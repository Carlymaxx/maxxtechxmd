import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pairingRouter from "./pairing";
import statsRouter from "./stats";
import sessionRouter from "./session";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/pair", pairingRouter);
router.use(statsRouter);
router.use(sessionRouter);

export default router;
