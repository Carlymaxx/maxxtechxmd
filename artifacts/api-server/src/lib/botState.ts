import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

export const AUTH_DIR = path.resolve(process.cwd(), "auth_info_multi");
const SETTINGS_FILE = path.resolve(process.cwd(), "settings.json");
const SESSION_STORE_FILE = path.resolve(process.cwd(), "session_store.json");

export interface BotSettings {
  botName: string;
  prefix: string;
  mode: string;
  ownerNumber: string;
  [key: string]: unknown;
}

const DEFAULT_SETTINGS: BotSettings = {
  botName: process.env.BOT_NAME || "MAXX-XMD",
  prefix: process.env.PREFIX || ".",
  mode: process.env.MODE || "public",
  ownerNumber: process.env.OWNER_NUMBER || "",
};

export function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

export function loadSettings(): BotSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    logger.warn({ err }, "Failed to load settings, using defaults");
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Partial<BotSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf8");
  } catch (err) {
    logger.error({ err }, "Failed to save settings");
  }
}

interface SessionMeta {
  phoneNumber?: string;
  type?: string;
  autoRestart?: boolean;
  lastConnected?: number;
  [key: string]: unknown;
}

function loadSessionStore(): Record<string, SessionMeta> {
  try {
    if (fs.existsSync(SESSION_STORE_FILE)) {
      const raw = fs.readFileSync(SESSION_STORE_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

function writeSessionStore(store: Record<string, SessionMeta>): void {
  try {
    fs.writeFileSync(SESSION_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    logger.error({ err }, "Failed to write session store");
  }
}

export function saveSessionMeta(sessionId: string, meta: Partial<SessionMeta>): void {
  const store = loadSessionStore();
  store[sessionId] = { ...(store[sessionId] || {}), ...meta };
  writeSessionStore(store);
}

export function deleteSessionMeta(sessionId: string): void {
  const store = loadSessionStore();
  delete store[sessionId];
  writeSessionStore(store);
}

export function getSessionMeta(sessionId: string): SessionMeta | null {
  const store = loadSessionStore();
  return store[sessionId] || null;
}

export function getAllSessionMetas(): Record<string, SessionMeta> {
  return loadSessionStore();
}
