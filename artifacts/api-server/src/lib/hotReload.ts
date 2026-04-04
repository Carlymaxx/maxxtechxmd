/**
 * Hot-reload system for MAXX-XMD commands.
 *
 * Fetches the latest TypeScript command files from GitHub, transpiles them
 * in-process using esbuild (which is already a production dependency), then
 * runs each file inside a Node vm context that has registerCommand injected.
 * Because registerCommand writes into the live commandRegistry Map, every
 * command is updated in memory immediately — no restart required.
 */
import vm from "node:vm";
import { createRequire } from "node:module";
import { transform } from "esbuild";
import { commandRegistry, registerCommand } from "./commands/types.js";
import * as botState from "./botState.js";
import { logger } from "./logger.js";

const nodeRequire = createRequire(import.meta.url);

const REPO = "Carlymaxx/maxxtechxmd";
const BRANCH = "main";
const BASE_RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

// All command files relative to repo root
const COMMAND_FILES = [
  "artifacts/api-server/src/lib/commands/owner.ts",
  "artifacts/api-server/src/lib/commands/general.ts",
  "artifacts/api-server/src/lib/commands/fun.ts",
  "artifacts/api-server/src/lib/commands/morefun.ts",
  "artifacts/api-server/src/lib/commands/games.ts",
  "artifacts/api-server/src/lib/commands/games2.ts",
  "artifacts/api-server/src/lib/commands/group.ts",
  "artifacts/api-server/src/lib/commands/ai.ts",
  "artifacts/api-server/src/lib/commands/anime.ts",
  "artifacts/api-server/src/lib/commands/channel.ts",
  "artifacts/api-server/src/lib/commands/coding.ts",
  "artifacts/api-server/src/lib/commands/converters2.ts",
  "artifacts/api-server/src/lib/commands/country.ts",
  "artifacts/api-server/src/lib/commands/creative2.ts",
  // economy.ts intentionally excluded — writes disk on every command call
  "artifacts/api-server/src/lib/commands/education.ts",
  "artifacts/api-server/src/lib/commands/extra.ts",
  "artifacts/api-server/src/lib/commands/lifestyle.ts",
  "artifacts/api-server/src/lib/commands/media2.ts",
  "artifacts/api-server/src/lib/commands/photo.ts",
  "artifacts/api-server/src/lib/commands/plugins.ts",
  "artifacts/api-server/src/lib/commands/pokemon.ts",
  "artifacts/api-server/src/lib/commands/protection.ts",
  "artifacts/api-server/src/lib/commands/reactions.ts",
  "artifacts/api-server/src/lib/commands/religion.ts",
  "artifacts/api-server/src/lib/commands/search.ts",
  "artifacts/api-server/src/lib/commands/settings.ts",
  "artifacts/api-server/src/lib/commands/sports.ts",
  "artifacts/api-server/src/lib/commands/stalker.ts",
  "artifacts/api-server/src/lib/commands/sticker.ts",
  "artifacts/api-server/src/lib/commands/tools.ts",
  "artifacts/api-server/src/lib/commands/uploader.ts",
  "artifacts/api-server/src/lib/commands.ts",
];

// Build a require function for the VM context that maps relative imports to
// their live equivalents already loaded in the running process.
function makeVmRequire(filePath: string) {
  return function vmRequire(mod: string): unknown {
    // Relative imports — map to running modules
    if (mod.match(/[./]types(\.js)?$/)) {
      return { registerCommand, commandRegistry };
    }
    if (mod.match(/[./]botState(\.js)?$/)) {
      return botState;
    }
    if (mod.match(/[./]logger(\.js)?$/)) {
      return { logger };
    }
    if (mod.match(/[./]ytdlpUtil(\.js)?$/)) {
      return {}; // not needed in handlers
    }
    if (mod.match(/[./]baileys(\.js)?$/)) {
      return {}; // sock is passed as argument, not imported
    }
    if (mod.match(/[./]commands(\.js)?$/) && !mod.includes("/commands/")) {
      return {}; // skip self-referential import in commands.ts
    }
    // Node built-ins and npm packages — load normally
    try {
      return nodeRequire(mod);
    } catch {
      logger.warn({ mod, filePath }, "vm require: module not found — returning {}");
      return {};
    }
  };
}

export interface HotReloadResult {
  updated: number;
  commandsBefore: number;
  commandsAfter: number;
  errors: string[];
  latestCommit: string | null;
  changelog: string[];
}

export async function hotReloadCommands(): Promise<HotReloadResult> {
  const errors: string[] = [];
  let updated = 0;
  const commandsBefore = commandRegistry.size;

  // Fetch the latest commit info for reporting
  let latestCommit: string | null = null;
  const changelog: string[] = [];
  try {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${REPO}/commits?sha=${BRANCH}&per_page=5`,
      { headers: { "User-Agent": "MAXX-XMD-Bot", "Accept": "application/vnd.github.v3+json" } }
    );
    if (commitsRes.ok) {
      const commits: any[] = await commitsRes.json();
      if (commits.length > 0) {
        latestCommit = commits[0].sha.substring(0, 7);
        for (const c of commits) {
          const msg = (c.commit?.message as string || "").split("\n")[0].substring(0, 55);
          const date = new Date(c.commit?.author?.date || "").toLocaleDateString("en-US", { month: "short", day: "numeric" });
          changelog.push(`• [${c.sha.substring(0, 7)}] ${msg} (${date})`);
        }
      }
    }
  } catch { /* changelog is optional */ }

  // Hot-reload each command file
  for (const filePath of COMMAND_FILES) {
    try {
      const rawUrl = `${BASE_RAW}/${filePath}`;
      const res = await fetch(rawUrl, { headers: { "User-Agent": "MAXX-XMD-Bot" } });

      if (!res.ok) {
        errors.push(`${filePath.split("/").pop()}: HTTP ${res.status}`);
        continue;
      }

      const tsSource = await res.text();

      // Transpile TypeScript → CommonJS (strips types + converts ESM imports to require())
      const { code: jsCode } = await transform(tsSource, {
        loader: "ts",
        format: "cjs",
        target: "node18",
        // Strip type-only imports cleanly
        treeShaking: false,
      });

      // Create a fresh VM context with all necessary APIs
      const exports: Record<string, unknown> = {};
      const moduleObj = { exports };
      const ctx = vm.createContext({
        require: makeVmRequire(filePath),
        module: moduleObj,
        exports,
        __filename: filePath,
        __dirname: filePath.split("/").slice(0, -1).join("/"),
        console,
        process,
        fetch,
        Buffer,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Promise,
        URL,
        URLSearchParams,
        TextDecoder,
        TextEncoder,
      });

      vm.runInContext(jsCode, ctx, { timeout: 10000, filename: filePath });
      updated++;

    } catch (e: any) {
      const name = filePath.split("/").pop() || filePath;
      const msg = (e.message as string || "unknown error").substring(0, 120);
      errors.push(`${name}: ${msg}`);
      logger.error({ filePath, err: msg }, "Hot-reload failed");
    }
  }

  const commandsAfter = commandRegistry.size;
  logger.info({ updated, commandsBefore, commandsAfter, errors: errors.length }, "Hot-reload complete");

  return { updated, commandsBefore, commandsAfter, errors, latestCommit, changelog };
}
