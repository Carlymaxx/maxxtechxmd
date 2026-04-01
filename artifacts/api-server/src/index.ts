import app from "./app.js";
import { logger } from "./lib/logger.js";
import { restoreSessionFromEnv, startBotSession } from "./lib/baileys.js";
import { WORKSPACE_ROOT, AUTH_DIR } from "./lib/botState.js";
import { getYtdlpBin } from "./lib/ytdlpUtil.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Startup diagnostics — visible in all platform logs (Heroku, Render, Railway, Koyeb)
  logger.info({
    WORKSPACE_ROOT,
    AUTH_DIR,
    cwd: process.cwd(),
    SESSION_ID_SET: !!process.env.SESSION_ID,
    OWNER_NUMBER_SET: !!process.env.OWNER_NUMBER,
    platform: process.env.DYNO ? "heroku"
      : process.env.RENDER ? "render"
      : process.env.RAILWAY_ENVIRONMENT ? "railway"
      : process.env.KOYEB_APP_NAME ? "koyeb"
      : "unknown",
  }, "🚀 MAXX-XMD startup diagnostics");

  restoreSessionFromEnv();

  // Pre-warm yt-dlp binary (downloads if missing on Heroku)
  getYtdlpBin()
    .then((bin) => logger.info({ bin }, "yt-dlp ready"))
    .catch((e) => logger.warn({ err: e.message }, "yt-dlp unavailable — .song/.video will fail"));

  try {
    await startBotSession("main");
    logger.info("Main bot session started");
  } catch (err) {
    logger.warn({ err }, "Could not start main bot session on startup");
  }

});
