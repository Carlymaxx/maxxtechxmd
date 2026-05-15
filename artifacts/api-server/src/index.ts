import app from "./app.js";
import { logger } from "./lib/logger.js";
import { startBotSession } from "./lib/baileys.js";

const PORT = Number(process.env.PORT ?? 8082);

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server listening");
  // Auto-start main session on boot
  startBotSession("main").catch((err) =>
    logger.error({ err }, "Failed to start main session")
  );
});
