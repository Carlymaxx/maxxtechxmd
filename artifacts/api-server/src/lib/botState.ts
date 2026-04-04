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
  autorecordstatus: boolean;
  antilink: boolean;
  alwaysonline: boolean;
  autotyping: boolean;
  autobio: boolean;
  autoreaction: boolean;
  groupLink: string;
  channelLink: string;
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
  autorecordstatus: false,
  antilink: false,
  alwaysonline: true,
  autotyping: true,
  autobio: false,
  autoreaction: false,
  groupLink: "https://chat.whatsapp.com/BWZOtIlbZoJ9Xt8lgxxbqQ",
  channelLink: "https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J",
};

export function loadSettings(): BotSettings {
  let settings: BotSettings;
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
      settings = { ...defaultSettings, ...JSON.parse(raw) };
    } else {
      settings = { ...defaultSettings };
    }
  } catch {
    settings = { ...defaultSettings };
  }

  // ── Env-var overrides — Heroku config vars always win over the settings file ──
  // This makes every variable advertised in app.json actually work on fresh deploys
  // where settings.json does not yet exist.
  if (process.env.OWNER_NUMBER)      settings.ownerNumber      = process.env.OWNER_NUMBER.replace(/[^0-9]/g, "");
  settings.botName = "MAXX-XMD"; // locked — cannot be changed by anyone
  if (process.env.PREFIX)            settings.prefix           = process.env.PREFIX;
  if (process.env.WORK_MODE)         settings.mode             = process.env.WORK_MODE;
  if (process.env.AUTO_READ         !== undefined) settings.autoread        = process.env.AUTO_READ         === "true";
  if (process.env.AUTO_TYPING       !== undefined) settings.autotyping      = process.env.AUTO_TYPING       === "true";
  if (process.env.AUTO_VIEW_STATUS  !== undefined) settings.autoviewstatus  = process.env.AUTO_VIEW_STATUS  === "true";
  if (process.env.AUTO_LIKE_STATUS  !== undefined) settings.autolikestatus  = process.env.AUTO_LIKE_STATUS  === "true";
  if (process.env.AUTOREACT_STATUS  !== undefined) settings.autoreaction    = process.env.AUTOREACT_STATUS  === "true";
  if (process.env.ANTICALL          !== undefined) settings.anticall        = process.env.ANTICALL          === "true";
  if (process.env.WELCOME_MSG       !== undefined) settings.welcomeMessage  = process.env.WELCOME_MSG       === "true";

  return settings;
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

// ── In-memory activity tracking (zero disk writes) ───────────────────────────
const _activityMemory = new Map<string, Map<string, { count: number; lastSeen: number }>>();

export function recordActivity(groupJid: string, userJid: string): void {
  if (!_activityMemory.has(groupJid)) _activityMemory.set(groupJid, new Map());
  const group = _activityMemory.get(groupJid)!;
  const prev = group.get(userJid) || { count: 0, lastSeen: 0 };
  group.set(userJid, { count: prev.count + 1, lastSeen: Date.now() });
}

export function getGroupActivity(groupJid: string): Record<string, { count: number; lastSeen: number }> {
  const group = _activityMemory.get(groupJid);
  if (!group) return {};
  return Object.fromEntries(group.entries());
}

// ── Live session counter (shared between baileys.ts and commands) ─────────────
let _liveSessionCount = 0;
const _liveSessionJids: Map<string, string> = new Map(); // sessionId → phone JID

export function registerLiveSession(sessionId: string, jid: string) {
  _liveSessionJids.set(sessionId, jid);
  _liveSessionCount = _liveSessionJids.size;
}
export function unregisterLiveSession(sessionId: string) {
  _liveSessionJids.delete(sessionId);
  _liveSessionCount = _liveSessionJids.size;
}
export function getLiveSessionCount(): number { return _liveSessionCount; }
export function getLiveSessions(): { sessionId: string; jid: string }[] {
  return [..._liveSessionJids.entries()].map(([sessionId, jid]) => ({ sessionId, jid }));
}

// ── Sudo list — shared cache so settings.ts and commands.ts stay in sync ──────
const SUDO_FILE_PATH = path.join(WORKSPACE_ROOT, "sudo.json");
let _sudoList: string[] | null = null;
export function loadSudoList(): string[] {
  if (_sudoList !== null) return _sudoList;
  try { if (fs.existsSync(SUDO_FILE_PATH)) _sudoList = JSON.parse(fs.readFileSync(SUDO_FILE_PATH, "utf8")); }
  catch {}
  if (_sudoList === null) _sudoList = [];
  return _sudoList;
}
export function saveSudoList(list: string[]): void {
  _sudoList = list; // update cache immediately
  try { fs.writeFileSync(SUDO_FILE_PATH, JSON.stringify(list, null, 2)); } catch {}
}

// ── Command usage counter — in-memory only (no disk write per command) ───────
// Disk writes on every command add 50-200ms latency on Heroku's network FS.
// Count is lost on restart (acceptable — it's a dashboard stat, not critical).
let _cmdUsageCount = 0;
export function incrementCmdUsage(): void { _cmdUsageCount++; }
export function getCmdUsageCount(): number { return _cmdUsageCount; }

export function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}
