import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);
const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function buildBot() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await build({
    entryPoints: [path.resolve(artifactDir, "src", "index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external: [
      "*.node", "@whiskeysockets/baileys", "sharp", "better-sqlite3",
      "bufferutil", "utf-8-validate", "canvas", "bcrypt", "argon2",
      "fsevents", "pg-native", "mysql2", "sqlite3", "piscina", "re2",
      "esbuild-plugin-pino",
    ],
    sourcemap: "linked",
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);`,
    },
  });
}

buildBot().then(() => console.log("Bot rebuilt OK")).catch((err) => { console.error(err.message); process.exit(1); });
