#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || "8081", 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || "8082", 10);
const AUTH_QR_DIR = path.join(__dirname, "auth_qr_sessions");
fs.mkdirSync(AUTH_QR_DIR, { recursive: true });

const qrSessions = new Map();

function buildDeploySessionId(credsJson) {
  try {
    const compressed = zlib.gzipSync(Buffer.from(credsJson, "utf8"));
    return "MAXX-XMD~" + compressed.toString("base64");
  } catch { return null; }
}

function loadPairPageHTML() {
  const srcPath = path.join(__dirname, "artifacts/api-server/src/lib/pairPage.ts");
  const raw = fs.readFileSync(srcPath, "utf8");
  const match = raw.match(/PAIR_PAGE_HTML\s*=\s*`([\s\S]+)`\s*;?\s*$/);
  if (!match) throw new Error("Cannot parse PAIR_PAGE_HTML");
  let html = match[1];
  html = html.replace(/\\`/g, "`");
  html = html.replace(/\\\$\{/g, "${");
  return html;
}

const PAIR_HTML = loadPairPageHTML();
console.log(`[pair-front] HTML: ${PAIR_HTML.length} chars, backticks: ${(PAIR_HTML.match(/`/g)||[]).length}`);

async function startQRSession(sessionId) {
  try {
    const baileys = require("@whiskeysockets/baileys/lib/index.js");
    const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = baileys;
    const QRCode = require("qrcode");

    const sessionFolder = path.join(AUTH_QR_DIR, sessionId);
    fs.mkdirSync(sessionFolder, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();
    console.log(`[qr] ${sessionId} baileys version: ${version}`);

    const noop = () => {};
    const silentLogger = {
      level: "silent", trace: noop, debug: noop, info: noop,
      warn: noop, error: noop, fatal: noop, child: () => silentLogger,
    };

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
      },
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "22.0.0"],
      connectTimeoutMs: 120000,
      logger: silentLogger,
      getMessage: async () => undefined,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      fireInitQueries: false,
      shouldSyncHistoryMessage: () => false,
      generateHighQualityLinkPreview: false,
      retryRequestDelayMs: 250,
    });

    const session = {
      qrDataUrl: null, connected: false, deploySessionId: null,
      sock, createdAt: Date.now(),
    };
    qrSessions.set(sessionId, session);

    sock.ev.on("connection.update", async (update) => {
      const { qr, connection, lastDisconnect } = update;
      console.log(`[qr] ${sessionId} update: conn=${connection} qr=${!!qr} err=${lastDisconnect?.error?.message}`);
      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, { width: 256, margin: 1 });
          const s = qrSessions.get(sessionId);
          if (s) s.qrDataUrl = dataUrl;
          console.log(`[qr] ${sessionId} QR ready (${dataUrl.length} chars)`);
        } catch (e) { console.error("[qr] QRCode error:", e.message); }
      }
      if (connection === "open") {
        try { await saveCreds(); } catch {}
        console.log(`[qr] ${sessionId} CONNECTED`);

        // Build SESSION_ID from DISK creds (Baileys writes them with proper Buffer serialization)
        // NEVER use JSON.stringify(sock.authState.creds) — Buffer keys serialize as {} without BufferJSON.replacer
        const sessionFolder = path.join(AUTH_QR_DIR, sessionId);
        const credsPath = path.join(sessionFolder, "creds.json");
        const userId = sock.user?.id;

        // Wait up to 5s for creds.json to be fully written by Baileys saveCreds
        let credsRaw = null;
        for (let i = 0; i < 10; i++) {
          try {
            if (fs.existsSync(credsPath)) {
              const raw = fs.readFileSync(credsPath, "utf8");
              const parsed = JSON.parse(raw);
              // Accept once we have noiseKey (the critical private key)
              if (parsed.noiseKey) { credsRaw = raw; break; }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 500));
        }

        // Inject me.id if Baileys hasn't written it yet (needed for bot identity)
        let deployId = null;
        if (credsRaw) {
          try {
            const parsed = JSON.parse(credsRaw);
            if (!parsed.me?.id && userId) {
              parsed.me = { id: userId, name: sock.user?.name || "" };
              const updated = JSON.stringify(parsed);
              try { fs.writeFileSync(credsPath, updated); } catch {}
              credsRaw = updated;
              console.log(`[qr] ${sessionId} injected me.id=${userId} into creds.json`);
            }
            deployId = buildDeploySessionId(credsRaw);
            console.log(`[qr] ${sessionId} SESSION_ID built from disk creds (${credsRaw.length} bytes)`);
          } catch (e) {
            console.error(`[qr] ${sessionId} creds encode error:`, e.message);
          }
        } else {
          console.error(`[qr] ${sessionId} creds.json not found after 5s — SESSION_ID will be null`);
        }

        const s = qrSessions.get(sessionId);
        if (s) { s.connected = true; s.deploySessionId = deployId; }

        // ── Send 3 messages to user's WhatsApp chat ──
        try {
          // Extract phone number from sock.user.id  e.g. 254700000000:15@s.whatsapp.net
          const rawJid = sock.user?.id || "";
          const phone = rawJid.split(":")[0].replace(/[^0-9]/g, "");
          if (phone.length >= 6 && deployId) {
            const userJid = phone + "@s.whatsapp.net";
            const BOT_NAME = "MAXX-XMD";

            // Wait a moment for session to fully stabilise
            await new Promise(r => setTimeout(r, 3000));

            // Message 1: intro
            await sock.sendMessage(userJid, {
              text:
                `🔑 *${BOT_NAME} — Your SESSION_ID is ready!*

` +
                `👇 *Long-press the next message → Copy* to grab your SESSION_ID.

` +
                `🔐 Keep it private — it gives full access to your WhatsApp.`
            });
            console.log(`[qr] ${sessionId} ✅ Sent SESSION_ID intro`);

            await new Promise(r => setTimeout(r, 800));

            // Message 2: raw SESSION_ID
            await sock.sendMessage(userJid, { text: deployId });
            console.log(`[qr] ${sessionId} ✅ Sent raw SESSION_ID`);

            await new Promise(r => setTimeout(r, 800));

            // Message 3: deployment guide
            await sock.sendMessage(userJid, {
              text:
                `*𝗠𝗔𝗫𝗫-𝗫𝗠𝗗 DEPLOYMENT GUIDE* 📌

` +
                `1️⃣ *Fork:* github.com/Carlymaxx/maxxtechxmd

` +
                `2️⃣ *Deploy on any platform:*
` +
                `   🟣 Heroku  🟢 Render  🔵 Railway  🟡 Koyeb

` +
                `3️⃣ *Set these env vars:*
` +
                `   SESSION_ID = <paste the copied text>
` +
                `   OWNER_NUMBER = <your number>

` +
                `> _Powered by ${BOT_NAME}_ ⚡`
            });
            console.log(`[qr] ${sessionId} ✅ All 3 messages sent to ${userJid}`);
          }
        } catch (sendErr) {
          console.error(`[qr] ${sessionId} ❌ Failed to send SESSION_ID messages:`, sendErr.message);
        }
      }
      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        const msg = lastDisconnect?.error?.message || "unknown";
        console.log(`[qr] ${sessionId} closed: code=${code} msg=${msg}`);
        const s = qrSessions.get(sessionId);
        if (s && !s.connected) {
          // Auto-reconnect: 515=stream error retry fast, 408=QR expired retry fresh
          const delay = (code === 515) ? 2000 : (code === 408) ? 1000 : 0;
          if (delay > 0) {
            console.log(`[qr] ${sessionId} reconnecting in ${delay}ms...`);
            setTimeout(() => {
              if (qrSessions.has(sessionId) && !qrSessions.get(sessionId)?.connected) {
                // Reset qr so client shows loading spinner again
                const sess = qrSessions.get(sessionId);
                if (sess) sess.qrDataUrl = null;
                startQRSession(sessionId).catch(e => console.error(`[qr] reconnect error:`, e.message));
              }
            }, delay);
          }
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);
    return { success: true };
  } catch (e) {
    console.error("[qr] startQRSession error:", e.message, e.stack?.split("\n")[1]);
    return { success: false, error: e.message };
  }
}

async function handleLocal(req, res) {
  const url = req.url?.split("?")[0] || "/";
  const method = req.method;

  if (method === "POST" && url === "/api/pair/qr/start") {
    const sessionId = `QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const result = await startQRSession(sessionId);
    if (!result.success) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: result.error || "Failed to start QR session" }));
      return true;
    }
    const deadline = Date.now() + 15000;
    let session;
    while (Date.now() < deadline) {
      session = qrSessions.get(sessionId);
      if (session?.qrDataUrl) break;
      await new Promise(r => setTimeout(r, 300));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ sessionId, qr: session?.qrDataUrl || null, success: true }));
    return true;
  }

  if (method === "GET" && url.startsWith("/api/pair/qr/")) {
    const sid = url.slice("/api/pair/qr/".length);
    const session = qrSessions.get(sid);
    if (!session) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "QR session not found" }));
      return true;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ qr: session.qrDataUrl, waiting: !session.qrDataUrl, connected: session.connected }));
    return true;
  }

  if (method === "GET" && url.startsWith("/api/pair/status/")) {
    const sid = url.slice("/api/pair/status/".length);
    const session = qrSessions.get(sid);
    if (session) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: session.connected ? "connected" : "waiting",
        connected: session.connected,
        sessionId: sid,
        deploySessionId: session.deploySessionId || null,
      }));
      return true;
    }
    return false;
  }

  return false;
}

const server = http.createServer((req, res) => {
  const url = req.url?.split("?")[0] || "/";

  if (req.method === "GET" && (url === "/" || url === "/pair")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(PAIR_HTML);
    return;
  }

  const chunks = [];
  req.on("data", chunk => chunks.push(chunk));
  req.on("end", async () => {
    const bodyBuffer = Buffer.concat(chunks);
    const handled = await handleLocal(req, res).catch(err => {
      console.error("[pair-front] error:", err.message);
      if (!res.headersSent) { res.writeHead(500); res.end("Internal error"); }
      return true;
    });
    if (handled) return;

    const options = {
      hostname: "127.0.0.1",
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` },
    };
    const proxy = http.request(options, backRes => {
      res.writeHead(backRes.statusCode, backRes.headers);
      backRes.pipe(res, { end: true });
    });
    proxy.on("error", () => {
      if (!res.headersSent) { res.writeHead(502); res.end("Bad Gateway"); }
    });
    if (bodyBuffer.length > 0) { proxy.write(bodyBuffer); proxy.end(); }
    else { proxy.end(); }
  });
});

server.listen(PORT, () => {
  console.log(`[pair-front] :${PORT} → backend :${BACKEND_PORT}`);
});
