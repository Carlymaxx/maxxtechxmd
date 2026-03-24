import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { handleMessage } from "./commands.js";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { logger } from "./logger.js";
import {
  AUTH_DIR,
  ensureAuthDir,
  loadSettings,
  saveSessionMeta,
  deleteSessionMeta,
} from "./botState.js";

type WASocket = ReturnType<typeof makeWASocket>;

export const activeSessions: Record<string, WASocket> = {};
export const sessionConnected: Record<string, boolean> = {};
export const latestQR: Record<string, string> = {};
export const stoppingSessions: Set<string> = new Set();
export const pendingPairings: Record<string, string> = {};

const sessionIntervals: Record<string, ReturnType<typeof setInterval>[]> = {};

export function getBotUptime(): number {
  return process.uptime();
}

function clearSessionIntervals(sessionId: string) {
  if (sessionIntervals[sessionId]) {
    for (const id of sessionIntervals[sessionId]) clearInterval(id);
    delete sessionIntervals[sessionId];
  }
}

export async function startBotSession(sessionId = "main"): Promise<WASocket> {
  if (activeSessions[sessionId]) return activeSessions[sessionId];

  stoppingSessions.delete(sessionId);
  delete latestQR[sessionId];

  ensureAuthDir();
  const sessionFolder = path.join(AUTH_DIR, sessionId);
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();
  const settings = loadSettings();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger as any),
    },
    printQRInTerminal: false,
    browser: [settings.botName || "MAXX-XMD", "Chrome", "1.0"],
    // RAM optimizations — never cache messages in memory
    getMessage: async () => undefined,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 3,
    fireInitQueries: false,
  });

  sock.ev.on("creds.update", saveCreds);

  // ── Message handler ──────────────────────────────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      await handleMessage(sock, msg);
    }
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR[sessionId] = qr;
      logger.info({ sessionId }, "QR code generated");
    }

    if (connection === "open") {
      delete latestQR[sessionId];
      sessionConnected[sessionId] = true;
      logger.info({ sessionId }, "Session connected");
      saveSessionMeta(sessionId, { autoRestart: true, lastConnected: Date.now() });

      if (pendingPairings[sessionId]) {
        const phone = pendingPairings[sessionId];
        delete pendingPairings[sessionId];
        setTimeout(async () => {
          await sendSessionIdToUser(sessionId, phone, sock);
        }, 5000);
      }
    }

    if (connection === "close") {
      delete latestQR[sessionId];
      sessionConnected[sessionId] = false;
      clearSessionIntervals(sessionId);

      if (stoppingSessions.has(sessionId)) {
        logger.info({ sessionId }, "Session stopped by user");
        delete activeSessions[sessionId];
        saveSessionMeta(sessionId, { autoRestart: false });
        return;
      }

      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      const errorMsg = (lastDisconnect?.error as any)?.message || "";

      if (reason === DisconnectReason.loggedOut) {
        logger.info({ sessionId }, "Session logged out, deleting");
        const sessionFolder2 = path.join(AUTH_DIR, sessionId);
        fs.rmSync(sessionFolder2, { recursive: true, force: true });
        delete activeSessions[sessionId];
        deleteSessionMeta(sessionId);
        return;
      }

      if (reason === DisconnectReason.connectionReplaced || errorMsg.includes("conflict")) {
        logger.warn({ sessionId }, "Connection replaced, not reconnecting");
        delete activeSessions[sessionId];
        saveSessionMeta(sessionId, { autoRestart: false });
        return;
      }

      delete activeSessions[sessionId];
      logger.info({ sessionId }, "Reconnecting in 5s...");
      setTimeout(() => startBotSession(sessionId), 5000);
    }
  });

  activeSessions[sessionId] = sock;
  return sock;
}

export async function startPairingSession(
  sessionId: string,
  phoneNumber: string
): Promise<{ sock: WASocket; pairingCode: string }> {
  stoppingSessions.delete(sessionId);

  ensureAuthDir();
  const sessionFolder = path.join(AUTH_DIR, sessionId);
  if (fs.existsSync(sessionFolder)) {
    fs.rmSync(sessionFolder, { recursive: true, force: true });
  }
  fs.mkdirSync(sessionFolder, { recursive: true });

  pendingPairings[sessionId] = phoneNumber;
  saveSessionMeta(sessionId, { phoneNumber, type: "paired", autoRestart: false });

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    qrTimeout: 120000,
    defaultQueryTimeoutMs: undefined,
    connectTimeoutMs: 120000,
    browser: ["Mac OS", "Chrome", "14.4.1"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      sessionConnected[sessionId] = true;
      saveSessionMeta(sessionId, { autoRestart: false, lastConnected: Date.now() });
      logger.info({ sessionId }, "Paired session connected");

      if (pendingPairings[sessionId]) {
        const phone = pendingPairings[sessionId];
        delete pendingPairings[sessionId];
        setTimeout(async () => {
          await sendSessionIdToUser(sessionId, phone, sock);
          await new Promise((r) => setTimeout(r, 3000));
          try {
            sock.end(undefined);
            delete activeSessions[sessionId];
            sessionConnected[sessionId] = false;
            stoppingSessions.add(sessionId);
          } catch {}
        }, 5000);
      }
    }

    if (connection === "close") {
      sessionConnected[sessionId] = false;
      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      const errorMsg = (lastDisconnect?.error as any)?.message || "";

      if (stoppingSessions.has(sessionId)) {
        delete activeSessions[sessionId];
        saveSessionMeta(sessionId, { autoRestart: false });
        return;
      }

      if (reason === DisconnectReason.loggedOut) {
        const sf = path.join(AUTH_DIR, sessionId);
        fs.rmSync(sf, { recursive: true, force: true });
        delete activeSessions[sessionId];
        delete pendingPairings[sessionId];
        deleteSessionMeta(sessionId);
        return;
      }

      if (errorMsg.includes("QR refs") || errorMsg.includes("timed out")) {
        const sf = path.join(AUTH_DIR, sessionId);
        fs.rmSync(sf, { recursive: true, force: true });
        delete activeSessions[sessionId];
        delete pendingPairings[sessionId];
        deleteSessionMeta(sessionId);
        return;
      }

      if (reason === DisconnectReason.restartRequired) {
        // WhatsApp sends 515 after every successful pairing — it means
        // "disconnect and reconnect with your freshly-written credentials".
        // We must reconnect; the next connection.open will be the real linked session.
        const phone = pendingPairings[sessionId] || phoneNumber;
        logger.info({ sessionId }, "Pairing restart required — reconnecting...");
        setTimeout(async () => {
          try {
            const { state: st2, saveCreds: sc2 } = await useMultiFileAuthState(sessionFolder);
            const sock2 = makeWASocket({
              version,
              auth: st2,
              printQRInTerminal: false,
              browser: ["Mac OS", "Chrome", "14.4.1"] as [string, string, string],
            });
            sock2.ev.on("creds.update", sc2);
            sock2.ev.on("connection.update", async (upd) => {
              if (upd.connection === "open") {
                sessionConnected[sessionId] = true;
                activeSessions[sessionId] = sock2;
                logger.info({ sessionId }, "Pairing session fully connected after restart");
                if (phone) {
                  setTimeout(async () => {
                    await sendSessionIdToUser(sessionId, phone, sock2);
                    await new Promise((r) => setTimeout(r, 3000));
                    try {
                      sock2.end(undefined);
                      delete activeSessions[sessionId];
                      sessionConnected[sessionId] = false;
                      stoppingSessions.add(sessionId);
                    } catch {}
                  }, 5000);
                }
              }
              if (upd.connection === "close") {
                sessionConnected[sessionId] = false;
                delete activeSessions[sessionId];
              }
            });
            activeSessions[sessionId] = sock2;
          } catch (err) {
            logger.error({ sessionId, err }, "Failed to reconnect pairing session after restart");
          }
        }, 1000);
        return;
      }

      if (reason === DisconnectReason.connectionReplaced || errorMsg.includes("conflict")) {
        delete activeSessions[sessionId];
        delete pendingPairings[sessionId];
        saveSessionMeta(sessionId, { autoRestart: false });
        return;
      }
    }
  });

  activeSessions[sessionId] = sock;

  await new Promise((r) => setTimeout(r, 3000));

  if ((sock.authState.creds as any).registered) {
    sock.end(undefined);
    const sf = path.join(AUTH_DIR, sessionId);
    fs.rmSync(sf, { recursive: true, force: true });
    delete activeSessions[sessionId];
    throw new Error("Session already registered. Please try again.");
  }

  const pairingCode = await sock.requestPairingCode(phoneNumber);
  logger.info({ sessionId, phoneNumber }, "Pairing code generated");

  return { sock, pairingCode };
}

async function encodeSessionId(sessionFolder: string): Promise<string | null> {
  const credsPath = path.join(sessionFolder, "creds.json");
  if (!fs.existsSync(credsPath)) return null;
  try {
    const creds = fs.readFileSync(credsPath, "utf8");
    const parsed = JSON.parse(creds);
    // Must have 'me' set — means the account is actually linked, not just initialised
    if (!parsed.me || !parsed.me.id) return null;
    const compressed = zlib.gzipSync(Buffer.from(creds, "utf8"));
    return "MAXX-XMD~" + compressed.toString("base64");
  } catch {
    return null;
  }
}

async function sendSessionIdToUser(
  sessionId: string,
  phoneNumber: string,
  sock: WASocket
): Promise<void> {
  const sessionFolder = path.join(AUTH_DIR, sessionId);
  let deploySessionId: string | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    deploySessionId = await encodeSessionId(sessionFolder);
    if (deploySessionId) break;
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (!deploySessionId) {
    logger.error({ sessionId }, "Could not generate session ID after retries");
    return;
  }

  const userJid = phoneNumber + "@s.whatsapp.net";
  const botName = loadSettings().botName || "MAXX-XMD";

  try {
    await sock.sendMessage(userJid, {
      text: `Here is your ${botName} session ID.\nCopy it and use it to deploy your bot on any platform.`,
    });
    await new Promise((r) => setTimeout(r, 1000));
    await sock.sendMessage(userJid, { text: deploySessionId });
    await new Promise((r) => setTimeout(r, 1000));
    await sock.sendMessage(userJid, {
      text: `*𝗠𝗔𝗫𝗫-𝗫𝗠𝗗 DEPLOYMENT GUIDE* 📌\n\n1️⃣ Fork: github.com/Carlymaxx/maxxtechxmd\n\n2️⃣ Deploy on:\n   🟣 Heroku • 🟢 Render • 🔵 Railway\n   🟡 Koyeb • ⚡ Replit\n\n⚠️ _Keep your session ID private!_\n\n> _Powered by MAXX-XMD_ ⚡`,
    });
    logger.info({ sessionId, phoneNumber }, "Session ID sent to user");
  } catch (err) {
    logger.error({ err, sessionId }, "Failed to send session ID");
  }
}

export function restoreSessionFromEnv(): void {
  const sessionId = process.env.SESSION_ID;
  if (!sessionId) return;

  ensureAuthDir();
  const mainFolder = path.join(AUTH_DIR, "main");
  const credsPath = path.join(mainFolder, "creds.json");

  if (fs.existsSync(credsPath)) {
    logger.info("Session creds already exist, skipping restore");
    return;
  }

  try {
    let encoded = sessionId;
    if (encoded.startsWith("MAXX-XMD~")) {
      encoded = encoded.replace("MAXX-XMD~", "");
    }
    const compressed = Buffer.from(encoded, "base64");
    const creds = zlib.gunzipSync(compressed).toString("utf8");
    JSON.parse(creds);

    if (!fs.existsSync(mainFolder)) fs.mkdirSync(mainFolder, { recursive: true });
    fs.writeFileSync(credsPath, creds, "utf8");
    logger.info("Session restored from SESSION_ID environment variable");
  } catch (err) {
    logger.error({ err }, "Failed to restore session from SESSION_ID");
  }
}
