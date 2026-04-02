import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// Patch Baileys messages-recv.js to preserve newsletter server_id in WAMessage.category.
// This runs at build time so it's applied before esbuild bundles Baileys into dist/index.mjs.
function patchBaileys() {
  let targetPath;
  try {
    // Use Node.js module resolution — follows pnpm symlinks to the actual file
    const req = createRequire(import.meta.url);
    targetPath = req.resolve("@whiskeysockets/baileys/lib/Socket/messages-recv.js");
  } catch {
    // Fallback: check known candidate paths
    const candidates = [
      path.resolve(artifactDir, "node_modules/@whiskeysockets/baileys/lib/Socket/messages-recv.js"),
      path.resolve(artifactDir, "../node_modules/.pnpm/@whiskeysockets+baileys@7.0.0-rc.9_sharp@0.34.5/node_modules/@whiskeysockets/baileys/lib/Socket/messages-recv.js"),
    ];
    targetPath = candidates.find(c => existsSync(c));
  }
  if (!targetPath) {
    console.warn("[baileys-patch] messages-recv.js not found — skipping");
    return;
  }
  let content = readFileSync(targetPath, "utf8");
  if (content.includes("MAXX-XMD: server_id patched")) {
    console.log("[baileys-patch] Already patched");
    return;
  }
  // Inject server_id → category after .toJSON() in the newsletter message handler
  const patched = content.replace(
    /(\.toJSON\(\);)\s*(await upsertMessage\(fullMessage, 'append'\);)/,
    "$1\n                    // MAXX-XMD: server_id patched\n                    if (child.attrs.server_id) fullMessage.category = child.attrs.server_id;\n                    $2"
  );
  if (patched === content) {
    console.warn("[baileys-patch] Regex did not match — patch NOT applied");
    return;
  }
  writeFileSync(targetPath, patched, "utf8");
  console.log("[baileys-patch] ✅ Patched — newsletter server_id now in WAMessage.category");
}

patchBaileys();

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    // Some packages may not be bundleable, so we externalize them, we can add more here as needed.
    // Some of the packages below may not be imported or installed, but we're adding them in case they are in the future.
    // Examples of unbundleable packages:
    // - uses native modules and loads them dynamically (e.g. sharp)
    // - use path traversal to read files (e.g. @google-cloud/secret-manager loads sibling .proto files)
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",

      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
    sourcemap: "linked",
    plugins: [
      // pino relies on workers to handle logging, instead of externalizing it we use a plugin to handle it
      esbuildPluginPino({ transports: ["pino-pretty"] })
    ],
    // Make sure packages that are cjs only (e.g. express) but are bundled continue to work in our esm output file
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
