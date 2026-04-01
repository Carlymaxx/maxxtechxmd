import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import {
  RequestPairingBody,
  RequestPairingResponse,
  GetPairingStatusResponse,
} from "@workspace/api-zod";
import { AUTH_DIR, ensureAuthDir } from "../lib/botState.js";
import {
  activeSessions,
  sessionConnected,
  sessionIdCache,
  startPairingSession,
} from "../lib/baileys.js";
import { logger } from "../lib/logger.js";
import { incrementPairings } from "./stats.js";

const router: IRouter = Router();

const SESSION_PREFIX = process.env.BOT_NAME || "MAXX-XMD";

// Rate limiting: phone number → last request timestamp
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 3 * 60 * 1000; // 3 minutes between requests per number

// Track active pairing sessions for cleanup
const pairingSessionTimestamps = new Map<string, number>();

// Cleanup expired pairing sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  for (const [sessionId, ts] of pairingSessionTimestamps.entries()) {
    if (now - ts > EXPIRY_MS) {
      pairingSessionTimestamps.delete(sessionId);

      // If still not connected, clean up
      if (!sessionConnected[sessionId]) {
        const sock = activeSessions[sessionId];
        if (sock) {
          try { sock.end(undefined); } catch {}
          delete activeSessions[sessionId];
        }
        delete sessionConnected[sessionId];

        // Remove auth folder
        const sessionFolder = path.join(AUTH_DIR, sessionId);
        if (fs.existsSync(sessionFolder)) {
          try { fs.rmSync(sessionFolder, { recursive: true, force: true }); } catch {}
        }
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
    // Only encode if the account is actually linked (has 'me' field set)
    if (!parsed.me || !parsed.me.id) return null;
    const compressed = zlib.gzipSync(Buffer.from(creds, "utf8"));
    return "MAXX-XMD~" + compressed.toString("base64");
  } catch {
    return null;
  }
}

router.post("/", async (req, res) => {
  const parsed = RequestPairingBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const number = (parsed.data.number || "").replace(/[^0-9]/g, "");
  if (!/^\d{6,15}$/.test(number)) {
    return res.status(400).json({
      error: "Invalid phone number. Use country code + number (e.g. 254700000000)",
    });
  }

  // Session cap — each session uses ~30–50 MB RAM; default cap is 200 (override via MAX_SESSIONS env)
  const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || "200", 10);
  const currentSessions = Object.keys(activeSessions).filter((id) => id !== "main").length;
  if (currentSessions >= MAX_SESSIONS) {
    return res.status(503).json({
      error: `Bot is at full capacity (${MAX_SESSIONS} sessions). Try again later.`,
    });
  }

  // Rate limiting
  const lastRequest = rateLimitMap.get(number);
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
    const remainingSecs = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastRequest)) / 1000);
    return res.status(429).json({
      error: `Please wait ${remainingSecs}s before requesting a new code for this number.`,
    });
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
      success: true,
      pairingCode: formattedCode,
      sessionId,
      message: "Enter this code in WhatsApp > Linked Devices > Link with phone number",
    });
    res.json(data);
  } catch (err: any) {
    // On error, remove rate limit so they can retry immediately
    rateLimitMap.delete(number);
    pairingSessionTimestamps.delete(sessionId);
    logger.error({ err }, "Pairing error");
    res.status(500).json({
      error: err?.message || "Failed to generate pairing code. Please try again.",
    });
  }
});

router.get("/status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  ensureAuthDir();

  // Check live socket first
  const liveConnected = !!sessionConnected[sessionId];

  // Try to get SESSION_ID: first from in-memory cache (survives auth folder deletion),
  // then from disk (for the window before cache is populated).
  let deploySessionId: string | null = null;

  // 1. Memory cache — always available once sendSessionIdToUser runs
  const cached = sessionIdCache.get(sessionId);
  if (cached) {
    deploySessionId = cached.encodedId;
  }

  // 2. Disk fallback — for the ~5-10s window before sendSessionIdToUser fires
  if (!deploySessionId && liveConnected) {
    const sessionFolder = path.join(AUTH_DIR, sessionId);
    deploySessionId = encodeSessionIdSync(sessionFolder);
  }

  // Report as "connected" if the socket is live OR if we have a cached SESSION_ID
  // (the socket may have been closed after delivery but the user still needs to copy the key)
  const connected = liveConnected || !!deploySessionId;

  const data = GetPairingStatusResponse.parse({
    sessionId,
    status: connected ? "connected" : "waiting",
    connected,
    deploySessionId,
  });
  res.json(data);
});

export default router;
