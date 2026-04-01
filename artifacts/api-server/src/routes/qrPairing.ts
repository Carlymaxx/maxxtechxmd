import { Router, type IRouter } from "express";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { AUTH_DIR, ensureAuthDir } from "../lib/botState.js";
import {
  activeSessions,
  sessionConnected,
  sessionIdCache,
  latestQR,
  stoppingSessions,
  startQrSession,
} from "../lib/baileys.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const SESSION_PREFIX = process.env.BOT_NAME || "MAXX-XMD";
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 3 * 60 * 1000;

router.post("/start", async (req, res) => {
  const ip = req.ip || "unknown";
  const last = rateLimitMap.get(ip);
  if (last && Date.now() - last < RATE_LIMIT_MS) {
    const secs = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
    return res.status(429).json({ error: `Please wait ${secs}s before requesting a new QR code.` });
  }
  rateLimitMap.set(ip, Date.now());

  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const sessionId = `${SESSION_PREFIX}-QR-${suffix}`;

  try {
    startQrSession(sessionId);
    res.json({ sessionId });
  } catch (err: any) {
    rateLimitMap.delete(ip);
    logger.error({ err }, "QR session start error");
    res.status(500).json({ error: err?.message || "Failed to start QR session." });
  }
});

router.get("/:sessionId/code", async (req, res) => {
  const { sessionId } = req.params;

  const qrString = latestQR[sessionId];
  if (!qrString) {
    return res.json({ qr: null });
  }

  try {
    const qrDataURL = await QRCode.toDataURL(qrString, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.json({ qr: qrDataURL });
  } catch (err) {
    res.json({ qr: null });
  }
});

router.get("/:sessionId/status", (req, res) => {
  const { sessionId } = req.params;
  ensureAuthDir();

  const liveConnected = !!sessionConnected[sessionId];

  let deploySessionId: string | null = null;
  const cached = sessionIdCache.get(sessionId);
  if (cached) {
    deploySessionId = cached.encodedId;
  }

  if (!deploySessionId && liveConnected) {
    const sessionFolder = path.join(AUTH_DIR, sessionId);
    const credsPath = path.join(sessionFolder, "creds.json");
    try {
      if (fs.existsSync(credsPath)) {
        const creds = fs.readFileSync(credsPath, "utf8");
        const parsed = JSON.parse(creds);
        if (parsed.me?.id) {
          const compressed = zlib.gzipSync(Buffer.from(creds, "utf8"));
          deploySessionId = "MAXX-XMD~" + compressed.toString("base64");
        }
      }
    } catch {}
  }

  const connected = liveConnected || !!deploySessionId;
  const expired = !activeSessions[sessionId] && !connected && !deploySessionId;

  res.json({ sessionId, connected, deploySessionId, expired });
});

router.delete("/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const sock = activeSessions[sessionId];
  if (sock) {
    try {
      stoppingSessions.add(sessionId);
      sock.end(undefined);
      delete activeSessions[sessionId];
    } catch {}
  }
  delete latestQR[sessionId];
  sessionConnected[sessionId] = false;
  res.json({ ok: true });
});

export default router;
