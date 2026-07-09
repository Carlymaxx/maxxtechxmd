import app from "./app.js";
import { logger } from "./lib/logger.js";
import {
  restoreSessionFromEnv,
  startBotSession,
  restoreAllSessions,
} from "./lib/baileys.js";

const PORT = Number(process.env.PORT ?? 8082);

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server listening");
  restoreSessionFromEnv();
  startBotSession("main").catch((err) =>
    logger.error({ err }, "Failed to start main session"),
  );
  restoreAllSessions().catch((err) =>
    logger.error({ err }, "Failed to restore user sessions"),
  );
});
