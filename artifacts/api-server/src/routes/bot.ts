import { Router, type IRouter } from "express";
import QRCode from "qrcode";
import {
  GetBotStatusResponse,
  StartBotResponse,
  GetBotQrResponse,
  SendMessageBody,
  SendMessageResponse,
  GetBotInfoResponse,
} from "@workspace/api-zod";
import { loadSettings } from "../lib/botState.js";
import {
  activeSessions,
  sessionConnected,
  latestQR,
  startBotSession,
  getBotUptime,
} from "../lib/baileys.js";

const router: IRouter = Router();

const BOT_DEVELOPER = process.env.BOT_DEVELOPER || "MAXX TECH";

router.get("/status", (_req, res) => {
  const connected = !!sessionConnected["main"];
  const hasQR = !!latestQR["main"];
  const data = GetBotStatusResponse.parse({
    connected,
    hasQR,
    uptime: connected ? Math.floor(getBotUptime()) : 0,
  });
  res.json(data);
});

router.post("/start", async (_req, res) => {
  try {
    await startBotSession("main");
    const data = StartBotResponse.parse({
      success: true,
      message: "Bot starting...",
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to start bot" });
  }
});

router.get("/qr", async (_req, res) => {
  const qrString = latestQR["main"];
  if (!qrString) {
    const data = GetBotQrResponse.parse({ qr: null, message: "No QR code available" });
    return res.json(data);
  }
  try {
    const qrDataURL = await QRCode.toDataURL(qrString, { width: 300, margin: 2 });
    const data = GetBotQrResponse.parse({ qr: qrDataURL });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to generate QR" });
  }
});

router.post("/send", async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Number and message required" });
  }

  const mainSock = activeSessions["main"];
  if (!mainSock || !sessionConnected["main"]) {
    return res.status(503).json({ error: "Bot not connected" });
  }

  try {
    const { number, message } = parsed.data;
    const jid = number.includes("@") ? number : number + "@s.whatsapp.net";
    await mainSock.sendMessage(jid, { text: message });
    const data = SendMessageResponse.parse({ success: true, message: "Message sent" });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.get("/info", (_req, res) => {
  const settings = loadSettings();
  const data = GetBotInfoResponse.parse({
    botName: settings.botName || "MAXX-XMD",
    owner: settings.ownerName || "MAXX",
    developer: BOT_DEVELOPER,
    prefix: settings.prefix || ".",
    activeSessions: Object.keys(activeSessions).length,
    uptime: Math.floor(getBotUptime()),
  });
  res.json(data);
});

export default router;
