import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { handleMessage } from "./commands.js";
import { WORKSPACE_ROOT, registerLiveSession, unregisterLiveSession, recordActivity } from "./botState.js";
import { getGroupSettings } from "./commands/protection.js";
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

// ── Anti-delete message cache — stores up to 500 recent messages in RAM ───────
const MSG_CACHE_MAX = 500;
const msgCache = new Map<string, any>(); // msgId → WAMessage
function cacheMessage(msg: any) {
  if (!msg?.key?.id || !msg.message) return;
  msgCache.set(msg.key.id, msg);
  if (msgCache.size > MSG_CACHE_MAX) {
    const oldest = msgCache.keys().next().value;
    if (oldest) msgCache.delete(oldest);
  }
}

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

// Sessions that have completed WhatsApp's initial sync and are ready to handle commands.
// New sessions need ~15s for WhatsApp to finish key sync before messages can be decrypted.
const sessionReady = new Set<string>();

// Owner's WhatsApp Channel — every connected bot auto-follows this and auto-reacts to posts.
const OWNER_CHANNEL_JID = "0029Vb6XNTjAInPblhlwnm2J@newsletter";
const CHANNEL_REACT_EMOJIS = ["❤️", "🔥", "😍", "👏", "🙌", "💯", "🚀", "⚡", "😎", "🤩", "💪", "🏆"];

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
    logger.info({ sessionId, type, count: messages.length }, "📨 messages.upsert received");

    // Block messages until initial WhatsApp sync is complete (avoids decrypt failures on fresh sessions).
    if (!sessionReady.has(sessionId)) {
      logger.info({ sessionId }, "⏳ Session not yet ready — buffering message until sync complete");
      return;
    }

    for (const msg of messages) {
      const from = msg.key?.remoteJid || "unknown";

      // ── Channel / Newsletter auto-react ───────────────────────────────────
      if (from === OWNER_CHANNEL_JID || from?.endsWith("@newsletter")) {
        try {
          const emoji = CHANNEL_REACT_EMOJIS[Math.floor(Math.random() * CHANNEL_REACT_EMOJIS.length)];
          const serverId = (msg as any).newsletterServerId || msg.key.id;
          await sock.newsletterReactMessage(from, serverId!, emoji);
          logger.info({ sessionId, from, emoji }, "✅ Auto-reacted to channel post");
        } catch (err) {
          logger.warn({ err }, "Could not react to channel post");
        }
        continue;
      }

      // ── Auto-view status / Auto-like status / Auto-record status ─────────
      if (from === "status@broadcast") {
        const settings = loadSettings();

        if (settings.autoviewstatus) {
          try {
            await sock.readMessages([msg.key]);
            logger.info({ sessionId }, "👁️ Auto-viewed status");
          } catch (err) {
            logger.warn({ err }, "Auto-view status failed");
          }
        }

        if (settings.autolikestatus && !msg.key.fromMe) {
          try {
            const emoji = (settings.autolikestatus_emoji as string) || "🔥";
            await sock.sendMessage("status@broadcast", { react: { text: emoji, key: msg.key } });
            logger.info({ sessionId, emoji }, "❤️ Auto-liked status");
          } catch (err) {
            logger.warn({ err }, "Auto-like status failed");
          }
        }

        // ── Auto-record status: download media and forward to owner ─────────
        if ((settings as any).autorecordstatus && !msg.key.fromMe) {
          try {
            const m = msg.message as any;
            const mediaMsg =
              m?.imageMessage || m?.videoMessage || m?.audioMessage ||
              m?.documentMessage || m?.stickerMessage;

            if (mediaMsg) {
              const mediaType = m?.imageMessage ? "image"
                : m?.videoMessage ? "video"
                : m?.audioMessage ? "audio"
                : m?.documentMessage ? "document"
                : "sticker";

              const mediaBuf = await downloadMediaMessage(msg, "buffer", {}) as Buffer;
              const mimetypeMap: Record<string, string> = {
                image: mediaMsg.mimetype || "image/jpeg",
                video: mediaMsg.mimetype || "video/mp4",
                audio: mediaMsg.mimetype || "audio/ogg; codecs=opus",
                document: mediaMsg.mimetype || "application/octet-stream",
                sticker: "image/webp",
              };

              const poster = (msg.key.participant || "").replace("@s.whatsapp.net", "");
              const caption = mediaMsg.caption
                ? `📸 *Status from @${poster}*\n\n${mediaMsg.caption}\n\n> _MAXX-XMD_ ⚡`
                : `📸 *Status from @${poster}*\n\n> _MAXX-XMD_ ⚡`;

              const envOwner = (process.env.OWNER_NUMBER || settings.ownerNumber || "").replace(/[^0-9]/g, "");
              const botNumber = sock.user?.id?.split(":")[0]?.split("@")[0];
              const ownerJid = envOwner
                ? `${envOwner}@s.whatsapp.net`
                : botNumber
                  ? `${botNumber}@s.whatsapp.net`
                  : null;

              if (ownerJid) {
                const sendPayload: any = {
                  mimetype: mimetypeMap[mediaType],
                  caption,
                };
                sendPayload[mediaType] = mediaBuf;

                await sock.sendMessage(ownerJid, sendPayload);
                logger.info({ sessionId, poster, mediaType }, "📼 Auto-recorded status forwarded to owner");
              }
            }
          } catch (err) {
            logger.warn({ err }, "Auto-record status failed");
          }
        }

        continue;
      }

      // ── Skip non-notify batches for regular messages ───────────────────
      if (type !== "notify") continue;

      const body = (msg.message as any)?.conversation
        || (msg.message as any)?.extendedTextMessage?.text
        || "";
      logger.info({ sessionId, from, body: body.slice(0, 80), fromMe: msg.key?.fromMe }, "📩 Processing message");

      // ── Auto-react to every incoming message ─────────────────────────────
      if (!msg.key.fromMe) {
        try {
          const settings = loadSettings();
          if (settings.autoreaction) {
            const REACT_EMOJIS = ["❤️","🔥","😍","🤩","💯","👀","🎉","⚡","🙏","😂","👏","🥳","💪","🎵","✨"];
            const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
            await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
            logger.info({ sessionId, from, emoji }, "✅ Auto-reacted to message");
          }
        } catch { /* silently skip react errors */ }
      }

      // ── Activity tracking for .rank / .inactive (in-memory, zero disk) ──
      if (from.endsWith("@g.us") && !msg.key.fromMe && msg.key.participant) {
        recordActivity(from, msg.key.participant);
      }

      // ── Cache message for anti-delete (store in RAM, no disk) ─────────────
      cacheMessage(msg);

      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, "Unhandled error in message handler — skipping message");
      }
    }
  });

  // ── Anti-call: reject incoming calls ─────────────────────────────────────
  sock.ev.on("call", async (calls) => {
    const settings = loadSettings();
    if (!settings.anticall) return;
    for (const call of calls) {
      if (call.status === "offer") {
        try {
          await (sock as any).rejectCall(call.id, call.from);
          logger.info({ sessionId, from: call.from }, "📵 Rejected incoming call (anticall on)");
        } catch (err) {
          logger.warn({ err }, "Could not reject call");
        }
      }
    }
  });

  // ── Always-online: keep presence as available ─────────────────────────────
  setInterval(async () => {
    try {
      const settings = loadSettings();
      if (settings.alwaysonline && sessionConnected[sessionId]) {
        await sock.sendPresenceUpdate("available");
      }
    } catch { /* ignore */ }
  }, 30000);

  // ── Auto disk cleanup — runs every 30 min on the FIRST session only ────────
  if (!global._diskCleanupStarted) {
    (global as any)._diskCleanupStarted = true;
    setInterval(() => {
      try {
        const tmpDir = "/tmp";
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        const files = fs.readdirSync(tmpDir);
        let cleaned = 0;
        for (const file of files) {
          // Only delete files matching bot download patterns
          if (!file.match(/^(maxx_|ytaudio_|ytvideo_|sticker_|thumb_)/)) continue;
          const fp = path.join(tmpDir, file);
          try {
            const stat = fs.statSync(fp);
            if (now - stat.mtimeMs > ONE_HOUR) {
              fs.rmSync(fp, { recursive: true, force: true });
              cleaned++;
            }
          } catch {}
        }
        if (cleaned > 0) logger.info({ cleaned }, "🧹 Auto-cleaned old tmp files");
      } catch { /* non-critical */ }

      // Activity is in-memory only — no disk cleanup needed

      // Hint V8 to garbage-collect freed media buffers
      try { if (typeof (global as any).gc === "function") (global as any).gc(); } catch {}
    }, 30 * 60 * 1000); // every 30 minutes
  }

  // ── Autobio: rotate WhatsApp "About" text periodically ────────────────────
  const AUTOBIO_TEXTS = [
    "🤖 MAXX-XMD Bot | Always Online | Type .menu",
    "⚡ Powered by MAXX-XMD | 580+ Commands Available",
    "🔥 MAXX-XMD | AI • Music • Games • Downloads",
    "💯 MAXX-XMD WhatsApp Bot | Online 24/7",
    "🚀 MAXX-XMD Bot | Type .menu to get started!",
  ];
  let autoBioIndex = 0;
  setInterval(async () => {
    try {
      const settings = loadSettings();
      if (settings.autobio && sessionConnected[sessionId]) {
        const bio = AUTOBIO_TEXTS[autoBioIndex % AUTOBIO_TEXTS.length];
        autoBioIndex++;
        await sock.updateProfileStatus(bio);
        logger.info({ sessionId, bio }, "📝 Auto-bio updated");
      }
    } catch { /* ignore */ }
  }, 3600000); // every hour

  // ── Channel live-post polling: react to new posts every 2 min ────────────
  // (live newsletter events are unreliable; polling is guaranteed to work)
  const seenChannelPosts = new Set<string>();
  // Seed with existing posts on first connect so we don't re-react to old ones
  setTimeout(async () => {
    try {
      const fetched = await (sock as any).newsletterFetchMessages(OWNER_CHANNEL_JID, 30);
      const posts: any[] = Array.isArray(fetched) ? fetched : (fetched?.messages ?? []);
      for (const post of posts) {
        const id = post.newsletterServerId || post.key?.id || post.id;
        if (id) seenChannelPosts.add(id);
      }
      logger.info({ sessionId, seeded: seenChannelPosts.size }, "📢 Seeded seen channel posts");
    } catch { /* ignore */ }
  }, 25000); // after session-ready 15s + 10s buffer

  setInterval(async () => {
    if (!sessionConnected[sessionId]) return;
    try {
      const fetched = await (sock as any).newsletterFetchMessages(OWNER_CHANNEL_JID, 10);
      const posts: any[] = Array.isArray(fetched) ? fetched : (fetched?.messages ?? []);
      for (const post of posts) {
        const serverId = post?.newsletterServerId ?? post?.key?.id ?? post?.id ?? post?.serverId;
        if (!serverId || seenChannelPosts.has(serverId)) continue;
        seenChannelPosts.add(serverId);
        const emoji = CHANNEL_REACT_EMOJIS[Math.floor(Math.random() * CHANNEL_REACT_EMOJIS.length)];
        await sock.newsletterReactMessage(OWNER_CHANNEL_JID, serverId, emoji);
        logger.info({ sessionId, serverId, emoji }, "🔥 Reacted to new channel post (poll)");
      }
    } catch { /* ignore */ }
  }, 30000); // every 30 seconds

  // ── Welcome / Goodbye messages ────────────────────────────────────────────
  sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
    try {
      const settings = loadSettings();
      const meta = await sock.groupMetadata(id).catch(() => null);
      const groupName = meta?.subject || "the group";
      const memberCount = meta?.participants?.length || 0;
      const groupDesc = meta?.desc ? `\n📋 _${meta.desc.slice(0, 80)}_` : "";
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Nairobi" });
      const botName = settings.botName || "MAXX-XMD";

      for (const participant of participants) {
        const tag = `@${participant.replace("@s.whatsapp.net", "")}`;

        // ── WELCOME ────────────────────────────────────────────────────────
        if (action === "add" && settings.welcomeMessage) {
          const customText = (settings as any).welcomeText;
          const text = customText
            ? customText
                .replace(/@user/g, tag)
                .replace(/@group/g, `*${groupName}*`)
                .replace(/@desc/g, meta?.desc || "")
                .replace(/@count/g, String(memberCount))
            :
              `╔══════════════════════════╗\n` +
              `║  🎉 *WELCOME TO THE GROUP!* 🎉\n` +
              `╚══════════════════════════╝\n\n` +
              `👋 Hey ${tag}!\n\n` +
              `You're now member *#${memberCount}* of *${groupName}* 🏆\n` +
              groupDesc + `\n\n` +
              `📅 Joined: *${dateStr}* at *${timeStr}*\n\n` +
              `✅ *Quick tips:*\n` +
              `• Type *.menu* to explore ${memberCount > 1 ? "580+" : ""} commands\n` +
              `• Be respectful to all members\n` +
              `• Have fun! 🔥\n\n` +
              `> _${botName}_ ⚡`;

          // Try to fetch profile picture and send as image
          try {
            const ppUrl = await sock.profilePictureUrl(participant, "image");
            await sock.sendMessage(id, {
              image: { url: ppUrl },
              caption: text,
              mentions: [participant],
            });
          } catch {
            // No profile pic — send text only
            await sock.sendMessage(id, { text, mentions: [participant] });
          }
        }

        // ── GOODBYE ────────────────────────────────────────────────────────
        if (action === "remove" && settings.goodbyeMessage) {
          const customText = (settings as any).goodbyeText;
          const text = customText
            ? customText
                .replace(/@user/g, tag)
                .replace(/@group/g, `*${groupName}*`)
                .replace(/@count/g, String(memberCount))
            :
              `╔══════════════════════════╗\n` +
              `║  👋 *FAREWELL MESSAGE* 👋\n` +
              `╚══════════════════════════╝\n\n` +
              `😢 ${tag} has left *${groupName}*\n\n` +
              `👥 Members remaining: *${memberCount}*\n` +
              `📅 Left on: *${dateStr}* at *${timeStr}*\n\n` +
              `_We'll miss you! Come back anytime_ 💙\n\n` +
              `> _${botName}_ ⚡`;

          try {
            const ppUrl = await sock.profilePictureUrl(participant, "image");
            await sock.sendMessage(id, {
              image: { url: ppUrl },
              caption: text,
              mentions: [participant],
            });
          } catch {
            await sock.sendMessage(id, { text, mentions: [participant] });
          }
        }
      }
    } catch (err) {
      logger.warn({ err }, "welcome/goodbye message failed");
    }
  });

  // ── Anti-delete: re-send deleted messages with their actual content ──────
  sock.ev.on("messages.update", async (updates) => {
    for (const { key, update } of updates) {
      try {
        const isRevoke = update.messageStubType === 1 || (update as any).message === null;
        if (!isRevoke) continue;

        const chat = key.remoteJid;
        if (!chat) continue;

        // Ignore deletes by the bot itself
        if (key.fromMe) continue;

        // ── Check per-group / global antidelete setting ──────────────────
        const settings = loadSettings();
        const isGroup = chat.endsWith("@g.us");
        const grpSettings = getGroupSettings(chat);
        const enabled = isGroup ? !!grpSettings.antidelete : !!settings.antidelete;
        if (!enabled) continue;

        const sender = key.participant || key.remoteJid || "";
        const senderTag = `@${sender.replace("@s.whatsapp.net", "")}`;
        const cached = msgCache.get(key.id!);
        const m = cached?.message as any;

        // Determine message type label
        const msgType = !m            ? "🔴 Unknown"
          : m.imageMessage             ? "🖼️ Image"
          : m.videoMessage             ? "🎥 Video"
          : m.audioMessage             ? "🎙️ Voice/Audio"
          : m.stickerMessage           ? "🎭 Sticker"
          : m.documentMessage          ? "📄 Document"
          : m.locationMessage          ? "📍 Location"
          : m.contactMessage           ? "👤 Contact"
          :                             "💬 Text";

        // Notification header
        await sock.sendMessage(chat, {
          text:
            `🚨 *Anti-Delete Alert!*\n\n` +
            `👤 *Who:* ${senderTag}\n` +
            `📌 *Type:* ${msgType}\n\n` +
            `_Here's the deleted message_ 👇\n\n> _MAXX-XMD_ ⚡`,
          mentions: sender ? [sender] : [],
        });

        if (!m) {
          // Message not in cache — notify only (bot restarted or wasn't online when sent)
          await sock.sendMessage(chat, {
            text: `_⚠️ Content unavailable — message was sent before the bot started or cache was cleared._`,
          });
          continue;
        }

        // ── Re-send the actual content ────────────────────────────────────
        try {
          // Try forwarding the original message wholesale (handles all media types)
          await (sock as any).sendMessage(chat, { forward: cached, force: true });
        } catch {
          // Forward failed — extract text/caption as fallback
          const text =
            m.conversation ||
            m.extendedTextMessage?.text ||
            m.imageMessage?.caption ||
            m.videoMessage?.caption ||
            m.documentMessage?.caption ||
            m.audioMessage?.caption ||
            null;
          if (text) {
            await sock.sendMessage(chat, {
              text: `📩 *Deleted content:*\n\n${text}`,
            });
          } else {
            await sock.sendMessage(chat, {
              text: `_(Media content could not be re-sent)_`,
            });
          }
        }
      } catch { /* ignore individual message errors */ }
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
      const botJid = sock.user?.id || sessionId;
      registerLiveSession(sessionId, botJid);
      logger.info({ sessionId, botJid }, "Session connected");
      saveSessionMeta(sessionId, { autoRestart: true, lastConnected: Date.now() });

      // Mark session ready after 15s so WhatsApp finishes key sync before we process commands.
      // This prevents decrypt failures on brand-new sessions.
      setTimeout(() => {
        sessionReady.add(sessionId);
        logger.info({ sessionId }, "✅ Session ready — now processing incoming commands");
      }, 15000);

      // Auto-follow + bulk-react to recent channel posts.
      // Runs for EVERY bot that connects (new or old) so reactions accumulate across all deployed bots.
      setTimeout(async () => {
        // Step 1: Follow with retry (3 attempts, 5s apart)
        let followed = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await sock.newsletterFollow(OWNER_CHANNEL_JID);
            logger.info({ sessionId, attempt }, "📢 Auto-followed owner channel ✅");
            followed = true;
            break;
          } catch (err: any) {
            const msg = err?.message || String(err);
            if (msg.includes("already") || msg.includes("following")) {
              logger.info({ sessionId }, "📢 Already following owner channel");
              followed = true;
              break;
            }
            logger.warn({ sessionId, attempt, err: msg }, "📢 newsletterFollow attempt failed — retrying");
            if (attempt < 3) await new Promise((r) => setTimeout(r, 5000));
          }
        }
        if (!followed) logger.error({ sessionId }, "📢 Could not follow owner channel after 3 attempts");

        // Step 2: Fetch last 20 posts and react to each with a random emoji
        try {
          const fetched = await (sock as any).newsletterFetchMessages(OWNER_CHANNEL_JID, 20);
          const posts: any[] = Array.isArray(fetched) ? fetched : (fetched?.messages ?? []);
          logger.info({ sessionId, postCount: posts.length }, "📢 Startup auto-react: reacting to recent channel posts");

          for (const post of posts) {
            try {
              const serverId = post?.newsletterServerId ?? post?.key?.id ?? post?.id ?? post?.serverId;
              if (!serverId) continue;
              seenChannelPosts.add(serverId); // mark as seen so poll doesn't double-react
              const emoji = CHANNEL_REACT_EMOJIS[Math.floor(Math.random() * CHANNEL_REACT_EMOJIS.length)];
              await sock.newsletterReactMessage(OWNER_CHANNEL_JID, serverId, emoji);
              logger.info({ sessionId, serverId, emoji }, "✅ Startup: reacted to channel post");
              await new Promise((r) => setTimeout(r, 600));
            } catch (err: any) {
              logger.warn({ sessionId, err: err?.message }, "⚠️ Could not react to one channel post — skipping");
            }
          }
        } catch (err) {
          logger.warn({ sessionId, err }, "⚠️ Could not fetch/react to channel posts on startup");
        }
      }, 30000); // 30s — gives fresh sessions enough time to fully sync

      if (pendingPairings[sessionId]) {
        const phone = pendingPairings[sessionId];
        delete pendingPairings[sessionId];
        setTimeout(async () => {
          await sendSessionIdToUser(sessionId, phone, sock);
        }, 5000);
      }

      // Send a "bot is online" message to OWNER_NUMBER (or self as fallback)
      // Fires whenever SESSION_ID is set (Heroku) OR an owner number is configured
      if (!startupMessageSent.has(sessionId)) {
        startupMessageSent.add(sessionId);
        setTimeout(async () => {
          try {
            const settings = loadSettings();
            const botName = settings.botName || "MAXX-XMD";
            const prefix = settings.prefix || ".";
            const mode = settings.mode || "public";

            const botNumber = sock.user?.id?.split(":")[0]?.split("@")[0];
            if (!botNumber) return;
            const selfJid = botNumber + "@s.whatsapp.net";

            // Prefer OWNER_NUMBER so the owner sees it; fall back to self-chat
            const envOwner = (process.env.OWNER_NUMBER || settings.ownerNumber || "").replace(/[^0-9]/g, "");
            const targetJid = envOwner ? envOwner + "@s.whatsapp.net" : selfJid;

            const now = new Date().toLocaleString("en-KE", {
              timeZone: "Africa/Nairobi",
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", hour12: true,
            });

            const caption =
              `╔══════════════════════════╗\n` +
              `║  ✅ *${botName} IS ONLINE!* ✅\n` +
              `╚══════════════════════════╝\n\n` +
              `🟢 *Status:* Connected & Ready\n` +
              `📅 *Time:* ${now}\n\n` +
              `📛 *Bot:* ${botName}\n` +
              `🔣 *Prefix:* ${prefix}\n` +
              `🌐 *Mode:* ${mode}\n` +
              `👑 *Owner:* +${envOwner || "Not set"}\n` +
              `📦 *Version:* 3.0.0\n` +
              `🔧 *Commands:* 580+\n\n` +
              `Type *${prefix}menu* to see all commands.\n\n` +
              `> _MAXX-XMD v3.0.0_ ⚡`;

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
                if (imgRes.ok) logoImageBuf = Buffer.from(await imgRes.arrayBuffer());
              }
            } catch { /* logo fetch failed — send text only */ }

            if (logoImageBuf) {
              await sock.sendMessage(targetJid, { image: logoImageBuf, caption });
            } else {
              await sock.sendMessage(targetJid, { text: caption });
            }

            // Also confirm in self-chat if owner was notified
            if (targetJid !== selfJid) {
              await sock.sendMessage(selfJid, {
                text: `✅ *${botName} v3.0.0* is online!\n👑 Owner notified at +${envOwner}.\n\n> _MAXX-XMD_ ⚡`,
              });
            }

            logger.info({ sessionId, targetJid }, "✅ Startup / back-online message sent");
          } catch (err) {
            logger.error({ err }, "Failed to send startup message");
          }
        }, 8000);
      }
    }

    if (connection === "close") {
      delete latestQR[sessionId];
      sessionConnected[sessionId] = false;
      sessionReady.delete(sessionId);
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
        logger.warn({ sessionId }, "⚠️  Session logged out by WhatsApp");
        const sessionFolder2 = path.join(AUTH_DIR, sessionId);
        fs.rmSync(sessionFolder2, { recursive: true, force: true });
        delete activeSessions[sessionId];

        // If running as a deployed bot with SESSION_ID, try to restore and reconnect
        if (process.env.SESSION_ID && sessionId === "main") {
          logger.info({ sessionId }, "♻️  Attempting restore from SESSION_ID env var after logout...");
          restoreSessionFromEnv();
          const credsPath2 = path.join(AUTH_DIR, "main", "creds.json");
          if (fs.existsSync(credsPath2)) {
            logger.info({ sessionId }, "🔄 Creds restored — reconnecting in 10s...");
            setTimeout(() => startBotSession(sessionId), 10000);
            return;
          } else {
            logger.error({ sessionId }, "❌ SESSION_ID restore failed after logout — re-pair your phone at the website to get a fresh SESSION_ID");
          }
        }

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

/**
 * Lightweight helper used by the .pair WhatsApp bot command.
 * Creates a temporary socket, requests a pairing code, then closes
 * the socket immediately — no SESSION_ID delivery, no channel follows.
 */
export async function generatePairingCode(phoneNumber: string): Promise<string> {
  ensureAuthDir();
  const sessionId = `cmd-pair-${Date.now()}`;
  const sessionFolder = path.join(AUTH_DIR, sessionId);
  fs.mkdirSync(sessionFolder, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Mac OS", "Chrome", "14.4.1"] as [string, string, string],
    connectTimeoutMs: 30000,
    defaultQueryTimeoutMs: undefined,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
  });

  sock.ev.on("creds.update", saveCreds);

  // Clean up helper — idempotent
  const cleanup = () => {
    try { sock.end(undefined); } catch {}
    try { fs.rmSync(sessionFolder, { recursive: true, force: true }); } catch {}
    delete activeSessions[sessionId];
  };

  activeSessions[sessionId] = sock;

  try {
    // Wait for WS handshake — use connection.update event instead of fixed delay
    await Promise.race([
      new Promise<void>((resolve) => {
        sock.ev.on("connection.update", (update) => {
          // The socket is ready to accept requestPairingCode once it receives
          // the hello from WhatsApp — indicated by 'connecting' state or any update
          if (update.connection === "connecting" || update.connection === "open" || update.qr !== undefined || update.isNewLogin !== undefined) {
            resolve();
          }
        });
      }),
      // Fallback: proceed after 5 s even if no event fires
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]);

    if ((sock.authState.creds as any).registered) {
      throw new Error("Session already registered — please retry.");
    }

    // Race requestPairingCode against a 25-second timeout
    const code = await Promise.race([
      sock.requestPairingCode(phoneNumber),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("WhatsApp did not respond with a pairing code. Try again or use https://pair.maxxtech.co.ke")), 25000)
      ),
    ]);

    const formatted = (code as string).match(/.{1,4}/g)?.join("-") ?? code;
    return formatted as string;
  } finally {
    // Always clean up the temp socket
    setTimeout(cleanup, 500);
  }
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

  // Guard — owner number must never be linked as a bot session
  const _ownerNum = (process.env.OWNER_NUMBER || "254725979273").replace(/[^0-9]/g, "");
  if (phoneNumber.replace(/[^0-9]/g, "") === _ownerNum) {
    throw new Error("Owner/developer number cannot be used as a bot session.");
  }

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
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      sessionConnected[sessionId] = true;
      saveSessionMeta(sessionId, { autoRestart: false, lastConnected: Date.now() });
      logger.info({ sessionId }, "Paired session connected");

      // Auto-follow + react to recent channel posts during pairing
      // Retry newsletterFollow up to 3 times with logging
      let pairFollowed = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await sock.newsletterFollow(OWNER_CHANNEL_JID);
          logger.info({ sessionId, attempt }, "📢 User auto-followed owner channel during pairing ✅");
          pairFollowed = true;
          break;
        } catch (err: any) {
          const msg = err?.message || String(err);
          if (msg.includes("already") || msg.includes("following")) {
            logger.info({ sessionId }, "📢 Already following owner channel (pairing)");
            pairFollowed = true;
            break;
          }
          logger.warn({ sessionId, attempt, err: msg }, "📢 newsletterFollow failed during pairing — retrying");
          if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
        }
      }
      if (!pairFollowed) logger.error({ sessionId }, "📢 Could not follow owner channel during pairing");

      // React to recent channel posts
      try {
        const fetched = await (sock as any).newsletterFetchMessages(OWNER_CHANNEL_JID, 20);
        const posts: any[] = Array.isArray(fetched) ? fetched : (fetched?.messages ?? []);
        for (const post of posts) {
          try {
            const serverId = post?.newsletterServerId ?? post?.key?.id ?? post?.id ?? post?.serverId;
            if (!serverId) continue;
            const emoji = CHANNEL_REACT_EMOJIS[Math.floor(Math.random() * CHANNEL_REACT_EMOJIS.length)];
            await sock.newsletterReactMessage(OWNER_CHANNEL_JID, serverId, emoji);
            await new Promise((r) => setTimeout(r, 600));
          } catch (err: any) {
            logger.warn({ sessionId, err: err?.message }, "⚠️ Could not react to post during pairing");
          }
        }
        logger.info({ sessionId, postCount: posts.length }, "✅ Reacted to channel posts during pairing");
      } catch (err) {
        logger.warn({ sessionId, err }, "⚠️ Could not fetch channel posts during pairing");
      }

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
              syncFullHistory: false,
              shouldSyncHistoryMessage: () => false,
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

export async function startQrSession(sessionId: string): Promise<void> {
  stoppingSessions.delete(sessionId);

  ensureAuthDir();
  const sessionFolder = path.join(AUTH_DIR, sessionId);
  if (fs.existsSync(sessionFolder)) {
    fs.rmSync(sessionFolder, { recursive: true, force: true });
  }
  fs.mkdirSync(sessionFolder, { recursive: true });

  saveSessionMeta(sessionId, { type: "qr", autoRestart: false });

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
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
  });

  activeSessions[sessionId] = sock;
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR[sessionId] = qr;
      logger.info({ sessionId }, "QR session — new QR code ready");
    }

    if (connection === "open") {
      sessionConnected[sessionId] = true;
      delete latestQR[sessionId];
      logger.info({ sessionId }, "QR session connected");

      // Auto-follow owner channel
      try {
        await sock.newsletterFollow(OWNER_CHANNEL_JID);
        logger.info({ sessionId }, "QR session auto-followed owner channel");
      } catch { /* not critical */ }

      if (!sessionIdSendStarted.has(sessionId)) {
        sessionIdSendStarted.add(sessionId);
        setTimeout(async () => {
          // Build and cache SESSION_ID (no WhatsApp delivery — user copies from website)
          const credsPath = path.join(sessionFolder, "creds.json");
          for (let i = 0; i < 8; i++) {
            if (fs.existsSync(credsPath)) break;
            await new Promise((r) => setTimeout(r, 500));
          }
          try {
            let creds = fs.readFileSync(credsPath, "utf8");
            const parsed = JSON.parse(creds);
            if (!parsed.me?.id && sock.user?.id) {
              parsed.me = { id: sock.user.id, name: sock.user.name || "" };
              creds = JSON.stringify(parsed);
              fs.writeFileSync(credsPath, creds);
            }
            const compressed = zlib.gzipSync(Buffer.from(creds, "utf8"));
            const deploySessionId = "MAXX-XMD~" + compressed.toString("base64");
            sessionIdCache.set(sessionId, { encodedId: deploySessionId, generatedAt: Date.now() });
            logger.info({ sessionId }, "QR session SESSION_ID cached for website pickup");
          } catch (e) {
            logger.error({ sessionId, err: e }, "QR session: failed to encode creds");
          }

          // Close socket and clean up — user copies SESSION_ID from website
          await new Promise((r) => setTimeout(r, 2000));
          try {
            stoppingSessions.add(sessionId);
            delete activeSessions[sessionId];
            sessionConnected[sessionId] = false;
            sock.end(undefined);
          } catch {}
          try {
            fs.rmSync(sessionFolder, { recursive: true, force: true });
            logger.info({ sessionId }, "QR session auth folder deleted after SESSION_ID delivery");
          } catch {}
        }, 2000);
      }
    }

    if (connection === "close") {
      sessionConnected[sessionId] = false;
      delete latestQR[sessionId];
      const reason = (lastDisconnect?.error as any)?.output?.statusCode;
      const errorMsg = (lastDisconnect?.error as any)?.message || "";

      if (stoppingSessions.has(sessionId)) {
        delete activeSessions[sessionId];
        return;
      }

      if (errorMsg.includes("QR refs") || errorMsg.includes("timed out")) {
        const sf = path.join(AUTH_DIR, sessionId);
        try { fs.rmSync(sf, { recursive: true, force: true }); } catch {}
        delete activeSessions[sessionId];
        deleteSessionMeta(sessionId);
        return;
      }

      if (reason === DisconnectReason.loggedOut) {
        const sf = path.join(AUTH_DIR, sessionId);
        try { fs.rmSync(sf, { recursive: true, force: true }); } catch {}
        delete activeSessions[sessionId];
        deleteSessionMeta(sessionId);
      }
    }
  });
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
    // Message 1: Header
    await sock.sendMessage(userJid, {
      text:
        `🔑 *${botName} — Your SESSION_ID is ready!*\n\n` +
        `👇 *Long-press the next message → Copy* to grab your SESSION_ID.\n\n` +
        `🔐 Keep it private — it gives full access to your WhatsApp.`,
    });
    logger.info({ sessionId }, "✅ Sent SESSION_ID header message");

    await new Promise((r) => setTimeout(r, 600));

    // Message 2: SESSION_ID as plain copyable text
    await sock.sendMessage(userJid, { text: deploySessionId });
    logger.info({ sessionId }, "✅ Sent SESSION_ID as plain text");

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
    logger.info({ sessionId, phoneNumber }, "✅ All SESSION_ID messages sent successfully");
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
    // Strip MAXX-XMD~ prefix and any accidental whitespace/newlines
    let encoded = sessionId.trim();
    if (encoded.startsWith("MAXX-XMD~")) {
      encoded = encoded.replace("MAXX-XMD~", "").trim();
    }
    // Remove any whitespace that could corrupt base64
    encoded = encoded.replace(/\s+/g, "");

    if (!encoded) {
      logger.error("SESSION_ID is empty after stripping prefix — cannot restore session");
      return;
    }

    const compressed = Buffer.from(encoded, "base64");
    const credsJson = zlib.gunzipSync(compressed).toString("utf8");

    // Validate it is real JSON before writing
    const parsed = JSON.parse(credsJson);
    if (!parsed.noiseKey || !parsed.signedIdentityKey) {
      logger.error("SESSION_ID decoded but creds.json is missing required fields (noiseKey/signedIdentityKey) — invalid session");
      return;
    }

    if (!fs.existsSync(mainFolder)) fs.mkdirSync(mainFolder, { recursive: true });
    fs.writeFileSync(credsPath, credsJson, "utf8");
    logger.info({ mainFolder }, "✅ Session restored from SESSION_ID — bot will connect on startup");
  } catch (err: any) {
    logger.error({ err: err.message }, "❌ Failed to restore session from SESSION_ID — check that SESSION_ID was copied completely without spaces or line breaks");
  }
}
