import { Router, type IRouter } from "express";
import { sessionIdCache, activeSessions } from "../lib/baileys.js";

const router: IRouter = Router();

// Real command count scanned from the codebase (registerCommand calls across all command files)
const COMMAND_COUNT = 580;

// Lifetime pairing counter — increments on every successful pairing code request
export let totalPairings = 0;
export function incrementPairings() {
  totalPairings++;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

router.get("/", (_req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const activePairings = sessionIdCache.size;
  const connectedBots = Object.keys(activeSessions).filter((k) => k !== "main").length;

  res.json({
    activePairings,
    connectedBots,
    totalPairings,
    commandCount: COMMAND_COUNT,
    uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
  });
});

export default router;
