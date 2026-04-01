import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import botRouter from "./bot.js";
import sessionsRouter from "./sessions.js";
import pairingRouter from "./pairing.js";
import qrPairingRouter from "./qrPairing.js";
import settingsRouter from "./settings.js";
import statsRouter from "./stats.js";
import activeUsersRouter from "./active-users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/bot", botRouter);
router.use("/sessions", sessionsRouter);
router.use("/pair", pairingRouter);
router.use("/qr-pair", qrPairingRouter);
router.use("/settings", settingsRouter);
router.use("/stats", statsRouter);
router.use("/active-users", activeUsersRouter);

export default router;
