import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import { HealthCheckResponse } from "@workspace/api-zod";
import { WORKSPACE_ROOT, AUTH_DIR } from "../lib/botState.js";
import { activeSessions, sessionConnected } from "../lib/baileys.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/diagnose", (_req, res) => {
  const credsPath = path.join(AUTH_DIR, "main", "creds.json");
  const credsExist = fs.existsSync(credsPath);

  let credsValid = false;
  let credsPhone = "";
  if (credsExist) {
    try {
      const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
      credsValid = !!(creds.noiseKey && creds.signedIdentityKey);
      credsPhone = creds.me?.id?.split(":")[0]?.split("@")[0] || creds.me?.id || "";
    } catch {}
  }

  const mainSock = activeSessions["main"];
  const isConnected = !!sessionConnected["main"];

  res.json({
    ok: true,
    platform: process.env.DYNO ? "heroku"
      : process.env.RENDER ? "render"
      : process.env.RAILWAY_ENVIRONMENT ? "railway"
      : process.env.KOYEB_APP_NAME ? "koyeb"
      : "unknown/local",
    cwd: process.cwd(),
    WORKSPACE_ROOT,
    AUTH_DIR,
    SESSION_ID_ENV_SET: !!process.env.SESSION_ID,
    OWNER_NUMBER_SET: !!process.env.OWNER_NUMBER,
    creds: {
      fileExists: credsExist,
      isValid: credsValid,
      phone: credsPhone || "(unknown)",
    },
    bot: {
      connected: isConnected,
      socketAlive: !!mainSock,
      selfId: (mainSock as any)?.user?.id || null,
    },
    hint: !process.env.SESSION_ID
      ? "SESSION_ID env var is not set — bot cannot connect"
      : !credsExist
      ? "creds.json not found — SESSION_ID may be corrupted or path is wrong"
      : !credsValid
      ? "creds.json exists but is missing required fields — re-pair to get a fresh SESSION_ID"
      : !isConnected
      ? "Creds look valid but bot is not connected — WhatsApp may have rejected the session, re-pair to get a fresh SESSION_ID"
      : "Bot is connected and should be handling commands. If commands still fail, check logs for message handler errors.",
  });
});

export default router;
