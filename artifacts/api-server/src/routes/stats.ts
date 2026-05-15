import { Router, type IRouter } from "express";

const router: IRouter = Router();

let totalPairings = 0;
const startTime = Date.now();

export function incrementPairings(): void {
  totalPairings++;
}

router.get("/stats", (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    totalPairings,
    uptimeSeconds,
    uptime: formatUptime(uptimeSeconds),
    status: "online",
  });
});

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default router;
