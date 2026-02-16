require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const next = require('next');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const bot = require("./index.js");

const DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5000;
const BOT_OWNER = process.env.OWNER_NAME || 'MAXX';
const BOT_DEV = process.env.BOT_DEVELOPER || 'MAXX TECH';
const SESSION_PREFIX = process.env.BOT_NAME || 'MAXX-XMD';
const DB_FILE = path.join(__dirname, 'db.json');
const SESSIONS_DIR = path.join(__dirname, 'auth_info_baileys');

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, sessions: {} }, null, 2));
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

const nextApp = next({ dev: DEV });
const nextHandle = nextApp.getRequestHandler();

const sessionStatus = {};

async function startBotSession(sessionId = 'main') {
  if (bot.activeSessions[sessionId]) {
    const existing = bot.activeSessions[sessionId];
    if (existing.ws && existing.ws.readyState === 1) {
      sessionStatus[sessionId] = 'connected';
      return existing;
    }
  }

  sessionStatus[sessionId] = 'connecting';

  try {
    const sock = await bot.startBotSession(sessionId);

    sock.ev.on('connection.update', (update) => {
      const { connection } = update;
      if (connection === 'open') {
        sessionStatus[sessionId] = 'connected';
      } else if (connection === 'close') {
        sessionStatus[sessionId] = 'disconnected';
      }
    });

    return sock;
  } catch (err) {
    sessionStatus[sessionId] = 'error';
    throw err;
  }
}

function getSessionInfo(sessionId) {
  const sock = bot.activeSessions[sessionId];
  const isConnected = sock && sock.ws && sock.ws.readyState === 1;
  return {
    id: sessionId,
    status: isConnected ? 'connected' : (sessionStatus[sessionId] || 'disconnected'),
    connected: isConnected
  };
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  const mainSock = bot.activeSessions['main'];
  const connected = mainSock ? mainSock.ws && mainSock.ws.readyState === 1 : false;
  res.json({ connected });
});

app.get('/api/sessions', (req, res) => {
  try {
    const sessionDirs = [];
    if (fs.existsSync(SESSIONS_DIR)) {
      const entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          sessionDirs.push(entry.name);
        }
      }
    }

    const allIds = new Set([...sessionDirs, ...Object.keys(bot.activeSessions)]);
    const sessions = Array.from(allIds).map(id => getSessionInfo(id));

    res.json({ sessions });
  } catch (e) {
    console.error('Sessions list error:', e);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { name } = req.body;
    const sessionId = name || `session-${Date.now()}`;
    const safeName = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');

    await startBotSession(safeName);
    res.json({ success: true, session: getSessionInfo(safeName) });
  } catch (e) {
    console.error('Create session error:', e);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/sessions/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    await startBotSession(id);
    res.json({ success: true, session: getSessionInfo(id) });
  } catch (e) {
    console.error('Start session error:', e);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/api/sessions/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    bot.stoppingSessions.add(id);
    const sock = bot.activeSessions[id];
    if (sock) {
      sock.end(undefined);
      delete bot.activeSessions[id];
      sessionStatus[id] = 'disconnected';
    }
    res.json({ success: true, message: `Session ${id} stopped` });
  } catch (e) {
    console.error('Stop session error:', e);
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    bot.stoppingSessions.add(id);
    const sock = bot.activeSessions[id];
    if (sock) {
      sock.end(undefined);
      delete bot.activeSessions[id];
    }
    delete sessionStatus[id];

    const sessionFolder = path.join(SESSIONS_DIR, id);
    if (fs.existsSync(sessionFolder)) {
      fs.rmSync(sessionFolder, { recursive: true, force: true });
    }

    res.json({ success: true, message: `Session ${id} deleted` });
  } catch (e) {
    console.error('Delete session error:', e);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.post('/api/sessions/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, message } = req.body;
    if (!number || !message) {
      return res.status(400).json({ error: 'Number and message required' });
    }

    const sock = bot.activeSessions[id];
    if (!sock || !sock.ws || sock.ws.readyState !== 1) {
      return res.status(503).json({ error: 'Session not connected' });
    }

    const jid = number.includes('@') ? number : number + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, message: 'Message sent' });
  } catch (e) {
    console.error('Send error:', e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.post('/api/start-bot', async (req, res) => {
  try {
    await startBotSession('main');
    res.json({ success: true, message: 'Bot starting...' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to start bot' });
  }
});

app.post('/api/send', async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) {
      return res.status(400).json({ success: false, error: 'Number and message required' });
    }

    const mainSock = bot.activeSessions['main'];
    if (!mainSock || !mainSock.ws || mainSock.ws.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Bot not connected' });
    }

    const jid = number.includes('@') ? number : number + '@s.whatsapp.net';
    await mainSock.sendMessage(jid, { text: message });
    res.json({ success: true, message: 'Message sent' });
  } catch (e) {
    console.error('Send error:', e);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const number = (req.body.number || '').trim();
    if (!/^\d{6,15}$/.test(number)) return res.status(400).json({ error: 'Invalid phone number' });

    const db = readDB();
    db.users[number] = db.users[number] || { code: null, session: null, sessionExpiresAt: null };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.users[number].code = code;
    db.users[number].lastSentAt = Date.now();
    writeDB(db);

    const mainSock = bot.activeSessions['main'];
    if (!mainSock || !mainSock.ws || mainSock.ws.readyState !== 1) {
      return res.status(503).json({ error: 'Bot not connected. Start a session first.' });
    }

    const jid = number + '@s.whatsapp.net';
    const msg = `🔐 MAXX-XMD VERIFICATION CODE\nYour code: *${code}*\nOwner: ${BOT_OWNER}\nDeveloper: ${BOT_DEV}`;
    await mainSock.sendMessage(jid, { text: msg });
    res.json({ message: 'Verification code sent to WhatsApp' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/verify', async (req, res) => {
  try {
    const { number, code } = req.body;
    if (!number || !code) return res.status(400).json({ error: 'Number and code required' });

    const db = readDB();
    const user = db.users[number];
    if (!user || user.code !== code) return res.status(400).json({ error: 'Invalid or expired code' });

    const sessionId = `${SESSION_PREFIX}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    db.sessions[sessionId] = { number, createdAt: Date.now(), expiresAt };
    user.session = sessionId;
    user.sessionExpiresAt = expiresAt;
    user.code = null;
    writeDB(db);

    const mainSock = bot.activeSessions['main'];
    if (mainSock && mainSock.ws && mainSock.ws.readyState === 1) {
      const jid = number + '@s.whatsapp.net';
      await mainSock.sendMessage(jid, { text: `✅ MAXX-XMD session generated!\nSession ID: ${sessionId}\nOwner: ${BOT_OWNER}\nDeveloper: ${BOT_DEV}\nValid 24h` });
    }

    res.json({ message: 'Verification successful! Session sent to WhatsApp', sessionId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/info', (req, res) => {
  res.json({
    botName: SESSION_PREFIX,
    owner: BOT_OWNER,
    developer: BOT_DEV,
    prefix: process.env.PREFIX || '.',
    activeSessions: Object.keys(bot.activeSessions).length,
    uptime: process.uptime()
  });
});

setInterval(() => {
  try {
    const db = readDB();
    const now = Date.now();
    for (const sid of Object.keys(db.sessions)) {
      if (db.sessions[sid].expiresAt <= now) {
        const num = db.sessions[sid].number;
        if (db.users[num]) db.users[num].session = db.users[num].sessionExpiresAt = null;
        delete db.sessions[sid];
      }
    }
    writeDB(db);
  } catch (e) {
    console.error('Cleanup error', e);
  }
}, 10 * 60 * 1000);

app.all('*', (req, res) => {
  return nextHandle(req, res);
});

nextApp.prepare().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MAXX-XMD server listening on port ${PORT}`));
  startBotSession('main').catch(console.error);
}).catch(err => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
