import { Router, type IRouter } from "express";
import zlib from "zlib";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { AUTH_DIR, ensureAuthDir } from "../lib/botState.js";
import { startBotSession, activeSessions, stoppingSessions } from "../lib/baileys.js";
import { logger } from "../lib/logger.js";

const gunzip = promisify(zlib.gunzip);
const router: IRouter = Router();

/**
 * POST /api/session/start
 * Body: { sessionId: string, encodedCredentials: string }
 * Decodes the MAXX-XMD~<base64gzipped> credential string,
 * saves to auth_info_multi/<sessionId>/creds.json, then starts the session.
 */
router.post("/session/start", async (req, res) => {
  try {
    const { sessionId, encodedCredentials } = req.body as {
      sessionId?: string;
      encodedCredentials?: string;
    };

    if (!sessionId || typeof sessionId !== "string") {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    ensureAuthDir();
    const sessionFolder = path.join(AUTH_DIR, sessionId);

    if (encodedCredentials && typeof encodedCredentials === "string") {
      // Strip prefix: MAXX-XMD~ or MAXX-XMD_
      const b64 = encodedCredentials.replace(/^MAXX-XMD[~_]/, "");
      try {
        const compressed = Buffer.from(b64, "base64");
        const raw = await gunzip(compressed);
        const creds = JSON.parse(raw.toString("utf8"));
        if (!creds.me?.id) throw new Error("Invalid creds — missing me.id");
        fs.mkdirSync(sessionFolder, { recursive: true });
        fs.writeFileSync(
          path.join(sessionFolder, "creds.json"),
          JSON.stringify(creds, null, 2),
          "utf8"
        );
        logger.info({ sessionId }, "Credentials decoded and saved from panel deploy");
      } catch (err) {
        logger.error({ err }, "Failed to decode encodedCredentials");
        res.status(400).json({ error: "Invalid encodedCredentials — could not decode. Make sure you copied the full SESSION_ID from the pairing page." });
        return;
      }
    }

    // Check creds exist
    if (!fs.existsSync(path.join(sessionFolder, "creds.json"))) {
      res.status(400).json({ error: "No credentials found. Provide encodedCredentials from the pairing page." });
      return;
    }

    // Already running — return early
    if (activeSessions[sessionId]) {
      res.json({ success: true, message: "Session already active" });
      return;
    }

    // Start in background so we can respond immediately
    stoppingSessions.delete(sessionId);
    startBotSession(sessionId).catch((err) =>
      logger.error({ err, sessionId }, "startBotSession failed after panel deploy")
    );

    res.json({ success: true, message: "Session starting — your bot will be online within 30 seconds." });
  } catch (err) {
    logger.error({ err }, "POST /session/start error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/session/stop
 * Body: { sessionId: string }
 */
router.post("/session/stop", async (req, res) => {
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: "sessionId required" });
    return;
  }
  try {
    const sock = activeSessions[sessionId];
    if (sock) {
      stoppingSessions.add(sessionId);
      try { sock.end(undefined); } catch {}
      delete activeSessions[sessionId];
    }
    res.json({ success: true, message: "Session stopped" });
  } catch (err) {
    res.status(500).json({ error: "Failed to stop session" });
  }
});

/**
 * GET /api/session/status/:sessionId
 */
router.get("/session/status/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const active = !!activeSessions[sessionId];
  res.json({ sessionId, active, status: active ? "online" : "offline" });
});

export default router;
