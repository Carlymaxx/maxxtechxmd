import { Router, type IRouter } from "express";
import fs from "fs";
import path from "path";
import {
  ListSessionsResponse,
  CreateSessionBody,
  CreateSessionResponse,
  DeleteSessionResponse,
  StartSessionResponse,
  StopSessionResponse,
  SendSessionMessageBody,
  SendSessionMessageResponse,
} from "@workspace/api-zod";
import {
  loadSessionStore,
  saveSessionMeta,
  deleteSessionMeta,
  getSessionMeta,
  AUTH_DIR,
  ensureAuthDir,
} from "../lib/botState.js";
import {
  activeSessions,
  sessionConnected,
  stoppingSessions,
  startBotSession,
} from "../lib/baileys.js";

const router: IRouter = Router();

function getSessionInfo(sessionId: string) {
  ensureAuthDir();
  const meta = getSessionMeta(sessionId) || {};
  const isConnected = !!sessionConnected[sessionId];
  const sessionFolder = path.join(AUTH_DIR, sessionId);
  const credsExist = fs.existsSync(path.join(sessionFolder, "creds.json"));

  return {
    id: sessionId,
    status: (isConnected || credsExist) ? ("connected" as const) : ("disconnected" as const),
    connected: isConnected || credsExist,
    phoneNumber: meta.phoneNumber || null,
    type: meta.type || (sessionId === "main" ? "main" : "manual"),
    createdAt: meta.createdAt || null,
    lastConnected: meta.lastConnected || null,
    autoRestart: meta.autoRestart || false,
  };
}

router.get("/", (_req, res) => {
  ensureAuthDir();
  const sessionDirs: string[] = [];

  try {
    const entries = fs.readdirSync(AUTH_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        sessionDirs.push(entry.name);
      }
    }
  } catch {}

  const store = loadSessionStore();
  const allIds = new Set([...sessionDirs, ...Object.keys(store), ...Object.keys(activeSessions)]);
  const sessions = Array.from(allIds).map((id) => getSessionInfo(id));

  const data = ListSessionsResponse.parse({ sessions });
  res.json(data);
});

router.post("/", async (req, res) => {
  const parsed = CreateSessionBody.safeParse(req.body);
  const name = parsed.success && parsed.data?.name ? parsed.data.name : undefined;
  const sessionId = name || `session-${Date.now()}`;
  const safeName = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");

  saveSessionMeta(safeName, { type: "manual", autoRestart: true });

  try {
    await startBotSession(safeName);
  } catch {}

  const data = CreateSessionResponse.parse({
    success: true,
    session: getSessionInfo(safeName),
  });
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  stoppingSessions.add(id);
  const sock = activeSessions[id];
  if (sock) {
    try { sock.end(undefined); } catch {}
    delete activeSessions[id];
  }
  delete sessionConnected[id];

  const sessionFolder = path.join(AUTH_DIR, id);
  if (fs.existsSync(sessionFolder)) {
    fs.rmSync(sessionFolder, { recursive: true, force: true });
  }
  deleteSessionMeta(id);

  const data = DeleteSessionResponse.parse({
    success: true,
    message: `Session ${id} deleted`,
  });
  res.json(data);
});

router.post("/:id/start", async (req, res) => {
  const { id } = req.params;
  saveSessionMeta(id, { autoRestart: true });

  try {
    await startBotSession(id);
  } catch {}

  const data = StartSessionResponse.parse({
    success: true,
    session: getSessionInfo(id),
  });
  res.json(data);
});

router.post("/:id/stop", (req, res) => {
  const { id } = req.params;
  stoppingSessions.add(id);

  const sock = activeSessions[id];
  if (sock) {
    try { sock.end(undefined); } catch {}
    delete activeSessions[id];
    sessionConnected[id] = false;
  }
  saveSessionMeta(id, { autoRestart: false });

  const data = StopSessionResponse.parse({
    success: true,
    message: `Session ${id} stopped`,
  });
  res.json(data);
});

router.post("/:id/send", async (req, res) => {
  const { id } = req.params;
  const parsed = SendSessionMessageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Number and message required" });
  }

  const sock = activeSessions[id];
  if (!sock || !sessionConnected[id]) {
    return res.status(503).json({ error: "Session not connected" });
  }

  try {
    const { number, message } = parsed.data;
    const jid = number.includes("@") ? number : number + "@s.whatsapp.net";
    await sock.sendMessage(jid, { text: message });
    const data = SendSessionMessageResponse.parse({ success: true, message: "Message sent" });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
