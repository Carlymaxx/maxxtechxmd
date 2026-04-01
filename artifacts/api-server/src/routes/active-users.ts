import { Router, type IRouter } from "express";
import { activeUsersMap } from "../lib/commands.js";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  const users = Array.from(activeUsersMap.values())
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 100);

  res.json({
    total: activeUsersMap.size,
    users,
  });
});

export default router;
