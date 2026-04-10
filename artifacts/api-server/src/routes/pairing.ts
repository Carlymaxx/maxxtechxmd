import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import QRCode from "qrcode";
import {
  RequestPairingBody,
  RequestPairingResponse,
  GetPairingStatusResponse,
} from "@workspace/api-zod";
import { AUTH_DIR, ensureAuthDir } from "../lib/botState.js";
import {
  activeSessions,
  latestQR,
  sessionConnected,
  sessionIdCache,
  startBotSession,
  startPairingSession,
} from "../lib/baileys.js";
import { logger } from "../lib/logger.js";
import { incrementPairings } from "./stats.js";

const router: IRouter = Router();
const SESSION_PREFIX = process.env.BOT_NAME || "MAXX-XMD";
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 3 * 60 * 1000;
const BLOCKED_NUMBERS = new Set(["254725979273"]);
const pairingSessionTimestamps = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  const EXPIRY_MS = 10 * 60 * 1000;
  for (const [sessionId, ts] of pairingSessionTimestamps.entries()) {
    if (now - ts > EXPIRY_MS) {
      pairingSessionTimestamps.delete(sessionId);
      if (!sessionConnected[sessionId]) {
        const sock = activeSessions[sessionId];
        if (sock) { try { sock.end(undefined); } catch {} delete activeSessions[sessionId]; }
        delete sessionConnected[sessionId];
        const sessionFolder = path.join(AUTH_DIR, sessionId);
        if (fs.existsSync(sessionFolder)) { try { fs.rmSync(sessionFolder, { recursive: true, force: true }); } catch {} }
        logger.info({ sessionId }, "Expired pairing session cleaned up");
      }
    }
  }
}, 5 * 60 * 1000);

function encodeSessionIdSync(sessionFolder: string): string | null {
  const credsPath = path.join(sessionFolder, "creds.json");
  if (!fs.existsSync(credsPath)) return null;
  try {
    const creds = fs.readFileSync(credsPath, "utf8");
    const parsed = JSON.parse(creds);
    if (!parsed.me || !parsed.me.id) return null;
    const compressed = zlib.gzipSync(Buffer.from(creds, "utf8"));
    return "MAXX-XMD~" + compressed.toString("base64");
  } catch { return null; }
}

// ── Phone number pairing ──────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const parsed = RequestPairingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request" });

  const number = (parsed.data.number || "").replace(/[^0-9]/g, "");
  if (!/^\d{6,15}$/.test(number))
    return res.status(400).json({ error: "Invalid phone number. Use country code + number (e.g. 254700000000)" });

  if (BLOCKED_NUMBERS.has(number))
    return res.status(403).json({ error: "This number is not allowed to use this service." });

  const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || "200", 10);
  const currentSessions = Object.keys(activeSessions).filter((id) => id !== "main").length;
  if (currentSessions >= MAX_SESSIONS)
    return res.status(503).json({ error: `Bot is at full capacity (${MAX_SESSIONS} sessions). Try again later.` });

  const lastRequest = rateLimitMap.get(number);
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
    const remainingSecs = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastRequest)) / 1000);
    return res.status(429).json({ error: `Please wait ${remainingSecs}s before requesting a new code for this number.` });
  }
  rateLimitMap.set(number, Date.now());

  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const sessionId = `${SESSION_PREFIX}-${number.slice(-6)}-${suffix}`;
  pairingSessionTimestamps.set(sessionId, Date.now());

  try {
    const { pairingCode } = await startPairingSession(sessionId, number);
    const formattedCode = pairingCode.match(/.{1,4}/g)?.join("-") || pairingCode;
    incrementPairings();
    const data = RequestPairingResponse.parse({
      success: true, pairingCode: formattedCode, sessionId,
      message: "Enter this code in WhatsApp > Linked Devices > Link with phone number",
    });
    res.json(data);
  } catch (err: any) {
    rateLimitMap.delete(number);
    pairingSessionTimestamps.delete(sessionId);
    logger.error({ err }, "Pairing error");
    res.status(500).json({ error: err?.message || "Failed to generate pairing code. Please try again." });
  }
});

// ── QR: start session ─────────────────────────────────────────────────────────
router.post("/qr/start", async (req, res) => {
  const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || "200", 10);
  const currentSessions = Object.keys(activeSessions).filter((id) => id !== "main").length;
  if (currentSessions >= MAX_SESSIONS)
    return res.status(503).json({ error: "Bot is at full capacity. Try again later." });

  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sessionId = `QR-${suffix}`;
  pairingSessionTimestamps.set(sessionId, Date.now());

  startBotSession(sessionId).catch((err) => logger.error({ err, sessionId }, "QR session error"));
  res.json({ success: true, sessionId });
});

// ── QR: get latest QR image ───────────────────────────────────────────────────
router.get("/qr/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  if (sessionConnected[sessionId])
    return res.json({ connected: true, waiting: false, qr: null });

  const qrString = latestQR[sessionId];
  if (!qrString) return res.json({ qr: null, waiting: true, connected: false });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      margin: 2, width: 280,
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.json({ qr: qrDataUrl, waiting: false, connected: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Status polling ─────────────────────────────────────────────────────────────
router.get("/status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  ensureAuthDir();

  const liveConnected = !!sessionConnected[sessionId];
  let deploySessionId: string | null = null;

  const cached = sessionIdCache.get(sessionId);
  if (cached) { deploySessionId = cached.encodedId; }

  if (!deploySessionId && liveConnected) {
    const sessionFolder = path.join(AUTH_DIR, sessionId);
    deploySessionId = encodeSessionIdSync(sessionFolder);
  }

  const connected = liveConnected || !!deploySessionId;
  const data = GetPairingStatusResponse.parse({
    sessionId, status: connected ? "connected" : "waiting", connected, deploySessionId,
  });
  res.json(data);
});

export default router;
