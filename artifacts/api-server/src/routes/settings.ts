import { Router, type IRouter } from "express";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";
import { loadSettings, saveSettings } from "../lib/botState.js";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  const settings = loadSettings();
  const data = GetSettingsResponse.parse(settings);
  res.json(data);
});

router.patch("/", (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid settings data" });
  }

  const current = loadSettings();
  const updated = { ...current, ...parsed.data };
  saveSettings(updated);

  const data = UpdateSettingsResponse.parse(updated);
  res.json(data);
});

export default router;
