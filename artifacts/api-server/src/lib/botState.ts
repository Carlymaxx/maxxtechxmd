import fs from "fs";
import path from "path";

// On ALL cloud platforms (Heroku, Render, Railway, Koyeb) the Procfile/start command
// runs `node artifacts/api-server/dist/index.mjs` from the repo root, so cwd IS the root.
// On Replit dev, pnpm runs from the package directory
// (/home/runner/workspace/artifacts/api-server), so we must go up two levels.
// We detect Replit dev by checking if cwd contains the subpackage path.
// DATA_DIR env var overrides everything.
const WORKSPACE_ROOT: string = (() => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  const cwd = process.cwd();
  // If running from inside the api-server package dir, go up to workspace root
  if (cwd.includes("artifacts/api-server") || cwd.includes("artifacts" + path.sep + "api-server")) {
    return path.join(cwd, "../..");
  }
  // Otherwise (all cloud platforms): cwd is already the app/repo root
  return cwd;
})();

const SETTINGS_FILE = path.join(WORKSPACE_ROOT, "settings.json");
const SESSION_STORE_FILE = path.join(WORKSPACE_ROOT, "session_store.json");

export interface BotSettings {
  prefix: string;
  botName: string;
  ownerName: string;
  ownerNumber: string;
  jid: string;
  mode: string;
  welcomeMessage: boolean;
  goodbyeMessage: boolean;
  anticall: boolean;
  chatbot: boolean;
  autoread: boolean;
  autoviewstatus: boolean;
  autolikestatus: boolean;
  autolikestatus_emoji: string;
  antilink: boolean;
  alwaysonline: boolean;
  autotyping: boolean;
  autobio: boolean;
  autoreaction: boolean;
  [key: string]: unknown;
}

export interface SessionMeta {
  id?: string;
  phoneNumber?: string;
  type?: string;
  autoRestart?: boolean;
  createdAt?: number;
  lastConnected?: number;
  updatedAt?: number;
}

const defaultSettings: BotSettings = {
  prefix: ".",
  botName: "MAXX-XMD",
  ownerName: "MAXX",
  ownerNumber: "",
  jid: "",
  mode: "public",
  welcomeMessage: true,
  goodbyeMessage: true,
  anticall: false,
  chatbot: false,
  autoread: false,
  autoviewstatus: true,
  autolikestatus: true,
  autolikestatus_emoji: "🔥",
  antilink: false,
  alwaysonline: true,
  autotyping: true,
  autobio: false,
  autoreaction: false,
};

export function loadSettings(): BotSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...defaultSettings };
}

export function saveSettings(settings: BotSettings): void {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

export function loadSessionStore(): Record<string, SessionMeta> {
  try {
    if (fs.existsSync(SESSION_STORE_FILE)) {
      const raw = fs.readFileSync(SESSION_STORE_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch {}
  return {};
}

export function saveSessionStore(store: Record<string, SessionMeta>): void {
  fs.writeFileSync(SESSION_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function getSessionMeta(id: string): SessionMeta | null {
  const store = loadSessionStore();
  return store[id] || null;
}

export function saveSessionMeta(id: string, meta: Partial<SessionMeta>): void {
  const store = loadSessionStore();
  store[id] = {
    ...store[id],
    ...meta,
    id,
    updatedAt: Date.now(),
  };
  if (!store[id].createdAt) {
    store[id].createdAt = Date.now();
  }
  saveSessionStore(store);
}

export function deleteSessionMeta(id: string): void {
  const store = loadSessionStore();
  delete store[id];
  saveSessionStore(store);
}

export const AUTH_DIR = path.join(WORKSPACE_ROOT, "auth_info_baileys");
export { WORKSPACE_ROOT };

export function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}
