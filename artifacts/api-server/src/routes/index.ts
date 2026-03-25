import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import botRouter from "./bot.js";
import sessionsRouter from "./sessions.js";
import pairingRouter from "./pairing.js";
import settingsRouter from "./settings.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/bot", botRouter);
router.use("/sessions", sessionsRouter);
router.use("/pair", pairingRouter);
router.use("/settings", settingsRouter);
router.use("/stats", statsRouter);

export default router;
