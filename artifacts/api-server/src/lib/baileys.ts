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

// Cache of generated SESSION_IDs keyed by sessionId.
// Kept for 30 minutes so the user can still copy from the website
// even after the auth folder is cleaned up and the socket is closed.
export const sessionIdCache: Map<string, { encodedId: string; generatedAt: number }> = new Map();
setInterval(() => {
  const THIRTY_MIN = 30 * 60 * 1000;
  const now = Date.now();
  for (const [sid, entry] of sessionIdCache.entries()) {
    if (now - entry.generatedAt > THIRTY_MIN) sessionIdCache.delete(sid);
  }
}, 5 * 60 * 1000);

const startupMessageSent = new Set<string>();
// Prevents sock1 AND sock2 from both sending messages — only the first one wins.
const sessionIdSendStarted = new Set<string>();

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
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, "Unhandled error in message handler — skipping message");
      }
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

      // QR-paired sessions: extract phone from sock.user.id and send SESSION_ID
      if (sessionId.startsWith("QR-") && !pendingPairings[sessionId] && !sessionIdSendStarted.has(sessionId)) {
        const rawJid = sock.user?.id || "";
        const qrPhone = rawJid.split(":")[0].replace(/[^0-9]/g, "");
        if (qrPhone.length >= 6) {
          sessionIdSendStarted.add(sessionId);
          setTimeout(async () => {
            await sendSessionIdToUser(sessionId, qrPhone, sock);
          }, 3000);
        }
      }

      // Send a "bot is online" message to the bot's own self-chat (not the owner)
      const isDeployedBot = !!process.env.SESSION_ID;
      if (isDeployedBot && !startupMessageSent.has(sessionId)) {
        startupMessageSent.add(sessionId);
        setTimeout(async () => {
          try {
            const settings = loadSettings();
            const botName = settings.botName || "MAXX-XMD";
            const prefix = settings.prefix || ".";
            const mode = settings.mode || "public";

            // Send to self (the connected bot account's own WhatsApp number)
            const botNumber = sock.user?.id?.split(":")[0]?.split("@")[0];
            if (!botNumber) return;
            const selfJid = botNumber + "@s.whatsapp.net";

            const caption =
              `✅ *${botName} IS NOW ONLINE!*\n\n` +
              `🟢 Bot connected successfully and ready to use.\n\n` +
              `*Bot Name:* ${botName}\n` +
              `*Prefix:* ${prefix}\n` +
              `*Mode:* ${mode}\n\n` +
              `Type *${prefix}menu* to see all commands.\n\n` +
              `> _Powered by MAXX-XMD_ ⚡`;

            // Try to fetch a fire logo image for the startup message
            let logoImageBuf: Buffer | null = null;
            try {
              const logoRes = await fetch(
                `https://eliteprotech-apis.zone.id/firelogo?text=${encodeURIComponent(botName)}`,
                { signal: AbortSignal.timeout(8000) }
              );
              const logoData = await logoRes.json() as any;
              if (logoData.success && logoData.image) {
                const imgRes = await fetch(logoData.image, { signal: AbortSignal.timeout(8000) });
                if (imgRes.ok) {
                  const ab = await imgRes.arrayBuffer();
                  logoImageBuf = Buffer.from(ab);
                }
              }
            } catch { /* logo fetch failed, fallback to text */ }

            if (logoImageBuf) {
              await sock.sendMessage(selfJid, { image: logoImageBuf, caption });
            } else {
              await sock.sendMessage(selfJid, { text: caption });
            }

            logger.info({ sessionId, selfJid }, "Startup message sent to bot self-chat");
          } catch (err) {
            logger.error({ err }, "Failed to send startup message");
          }
        }, 8000);
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

      if (pendingPairings[sessionId] && !sessionIdSendStarted.has(sessionId)) {
        sessionIdSendStarted.add(sessionId);
        const phone = pendingPairings[sessionId];
        delete pendingPairings[sessionId];
        setTimeout(async () => {
          await sendSessionIdToUser(sessionId, phone, sock);
          // SESSION_ID delivered — close this pairing socket and free all resources.
          // The user deploys their own bot using the SESSION_ID env var.
          await new Promise((r) => setTimeout(r, 2000));
          try {
            stoppingSessions.add(sessionId);
            delete activeSessions[sessionId];
            sessionConnected[sessionId] = false;
            sock.end(undefined);
          } catch {}
          // Delete auth folder from disk — frees disk and RAM used by this pairing session.
          try {
            const folder = path.join(AUTH_DIR, sessionId);
            fs.rmSync(folder, { recursive: true, force: true });
            logger.info({ sessionId }, "Pairing session auth folder deleted after SESSION_ID delivery");
          } catch (e) {
            logger.warn({ sessionId, err: e }, "Could not delete pairing session folder");
          }
        }, 2000);
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
                if (phone && !sessionIdSendStarted.has(sessionId)) {
                  sessionIdSendStarted.add(sessionId);
                  setTimeout(async () => {
                    await sendSessionIdToUser(sessionId, phone, sock2);
                    // SESSION_ID delivered — close pairing socket and free all resources.
                    // User deploys their own bot with SESSION_ID env var.
                    await new Promise((r) => setTimeout(r, 2000));
                    try {
                      stoppingSessions.add(sessionId);
                      delete activeSessions[sessionId];
                      sessionConnected[sessionId] = false;
                      sock2.end(undefined);
                    } catch {}
                    // Delete auth folder from disk after delivery.
                    try {
                      const folder = path.join(AUTH_DIR, sessionId);
                      fs.rmSync(folder, { recursive: true, force: true });
                      logger.info({ sessionId }, "Pairing session folder deleted (sock2 path)");
                    } catch {}
                  }, 2000);
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

// ── Promote a just-paired socket to a full persistent bot session ─────────────
// After the SESSION_ID is sent to the user, we cleanly close the pairing socket
// and hand off to startBotSession which opens a fresh socket with all message
// handlers, reconnect logic, and proper RAM optimisations.
async function promoteToUserSession(sessionId: string, pairingSock: WASocket): Promise<void> {
  try {
    // Mark as user session so it survives restarts
    saveSessionMeta(sessionId, { type: "user", autoRestart: true, lastConnected: Date.now() });

    // Gracefully close the pairing socket before startBotSession opens a new one
    stoppingSessions.add(sessionId);
    delete activeSessions[sessionId];
    sessionConnected[sessionId] = false;
    try { pairingSock.end(undefined); } catch {}

    // Give it a moment then open the real bot session for this user
    await new Promise((r) => setTimeout(r, 2000));
    stoppingSessions.delete(sessionId);
    await startBotSession(sessionId);
    logger.info({ sessionId }, "User session promoted to full bot session");
  } catch (err) {
    logger.error({ sessionId, err }, "Failed to promote pairing session to bot session");
  }
}

// ── Restore all saved user sessions on startup ────────────────────────────────
export async function restoreAllSessions(): Promise<void> {
  ensureAuthDir();
  let dirs: string[];
  try {
    dirs = fs.readdirSync(AUTH_DIR).filter((d) => {
      if (d === "main") return false; // main is always started separately
      const folder = path.join(AUTH_DIR, d);
      try {
        if (!fs.statSync(folder).isDirectory()) return false;
        const credsPath = path.join(folder, "creds.json");
        if (!fs.existsSync(credsPath)) return false;
        const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
        return !!(creds.me?.id); // only restore fully-linked sessions
      } catch { return false; }
    });
  } catch { return; }

  if (dirs.length === 0) {
    logger.info("No user sessions to restore");
    return;
  }

  logger.info({ count: dirs.length }, "Restoring user sessions...");

  // Stagger restores to avoid hitting WhatsApp rate limits
  for (const sessionId of dirs) {
    try {
      if (activeSessions[sessionId]) continue; // already running
      await startBotSession(sessionId);
      logger.info({ sessionId }, "User session restored");
    } catch (err) {
      logger.error({ sessionId, err }, "Failed to restore user session");
    }
    // 3 s gap between each session to avoid WA banning the server IP
    await new Promise((r) => setTimeout(r, 3000));
  }

  logger.info({ count: dirs.length }, "All user sessions restored");
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
  const credsPath = path.join(sessionFolder, "creds.json");
  const botName = loadSettings().botName || "MAXX-XMD";

  // ── Step 1: Build SESSION_ID immediately using sock.user (always set on open) ──
  // sock.user.id is guaranteed on connection.open — no retry loop needed.
  const userId = sock.user?.id;
  if (!userId) {
    logger.error({ sessionId }, "sock.user.id not set — cannot generate SESSION_ID");
    return;
  }

  // Wait up to 4s for creds.json to appear (Baileys writes it async after connection.open)
  let credsRaw: string | null = null;
  for (let i = 0; i < 8; i++) {
    try {
      if (fs.existsSync(credsPath)) {
        credsRaw = fs.readFileSync(credsPath, "utf8");
        break;
      }
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 500));
  }

  let deploySessionId: string | null = null;
  if (credsRaw) {
    try {
      const parsed = JSON.parse(credsRaw);
      // Inject me.id from sock.user if Baileys hasn't written it yet
      if (!parsed.me?.id) {
        parsed.me = { id: userId, name: sock.user?.name || "" };
        try { fs.writeFileSync(credsPath, JSON.stringify(parsed)); } catch {}
      }
      const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(parsed), "utf8"));
      deploySessionId = "MAXX-XMD~" + compressed.toString("base64");
    } catch (e) {
      logger.error({ sessionId, err: e }, "Failed to encode creds.json");
    }
  }

  if (!deploySessionId) {
    logger.error({ sessionId }, "Could not generate SESSION_ID — creds.json unavailable");
    return;
  }

  // ── Step 2: Cache immediately — website copy button works even after cleanup ──
  sessionIdCache.set(sessionId, { encodedId: deploySessionId, generatedAt: Date.now() });
  logger.info({ sessionId }, "SESSION_ID cached for website pickup");

  // ── Step 3: Send to user's WhatsApp ───────────────────────────────────────
  const userJid = phoneNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  logger.info({ sessionId, userJid, idLen: deploySessionId.length, sockUser: sock.user?.id }, "About to send SESSION_ID to WhatsApp");

  try {
    // Message 1: Intro — tells user what's coming next
    await sock.sendMessage(userJid, {
      text:
        `🔑 *${botName} — Your SESSION_ID is ready!*\n\n` +
        `👇 *Long-press the next message → Copy* to grab your SESSION_ID.\n\n` +
        `🔐 Keep it private — it gives full access to your WhatsApp.`,
    });
    logger.info({ sessionId }, "✅ Sent SESSION_ID intro message");

    await new Promise((r) => setTimeout(r, 800));

    // Message 2: Raw SESSION_ID — user long-presses and copies this
    await sock.sendMessage(userJid, { text: deploySessionId });
    logger.info({ sessionId }, "✅ Sent raw SESSION_ID");

    await new Promise((r) => setTimeout(r, 800));

    // Message 3: Deployment guide
    await sock.sendMessage(userJid, {
      text:
        `*𝗠𝗔𝗫𝗫-𝗫𝗠𝗗 DEPLOYMENT GUIDE* 📌\n\n` +
        `1️⃣ *Fork:* github.com/Carlymaxx/maxxtechxmd\n\n` +
        `2️⃣ *Deploy on any platform:*\n` +
        `   🟣 Heroku  🟢 Render  🔵 Railway  🟡 Koyeb\n\n` +
        `3️⃣ *Set these env vars:*\n` +
        `   SESSION_ID = <paste the copied text>\n` +
        `   OWNER_NUMBER = <your number>\n\n` +
        `> _Powered by ${botName}_ ⚡`,
    });
    logger.info({ sessionId, phoneNumber }, "✅ All 3 SESSION_ID messages sent successfully");
  } catch (err: any) {
    logger.error({ err: err.message, errStack: err.stack, sessionId, userJid }, "❌ Failed to send SESSION_ID messages to WhatsApp");
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
