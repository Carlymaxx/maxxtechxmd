require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const next = require('next');

const QRCode = require('qrcode');
const bot = require("./index.js");
const sessionStore = require('./utils/sessionStore');

const DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5000;
const BOT_OWNER = process.env.OWNER_NAME || 'MAXX';
const BOT_DEV = process.env.BOT_DEVELOPER || 'MAXX TECH';
const SESSION_PREFIX = process.env.BOT_NAME || 'MAXX-XMD';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '';
const SESSIONS_DIR = path.join(__dirname, 'auth_info_baileys');

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

const nextApp = next({ dev: DEV });
const nextHandle = nextApp.getRequestHandler();

async function startBotSession(sessionId = 'main') {
  if (bot.activeSessions[sessionId] && bot.sessionConnected[sessionId]) {
    return bot.activeSessions[sessionId];
  }

  try {
    const sock = await bot.startBotSession(sessionId);
    return sock;
  } catch (err) {
    throw err;
  }
}

function getSessionInfo(sessionId) {
  const isConnected = !!bot.sessionConnected[sessionId];
  const meta = sessionStore.getSession(sessionId) || {};
  return {
    id: sessionId,
    status: isConnected ? 'connected' : 'disconnected',
    connected: isConnected,
    phoneNumber: meta.phoneNumber || null,
    type: meta.type || (sessionId === 'main' ? 'main' : 'manual'),
    createdAt: meta.createdAt || null,
    lastConnected: meta.lastConnected || null,
    autoRestart: meta.autoRestart || false
  };
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  const connected = !!bot.sessionConnected['main'];
  const hasQR = !!bot.latestQR['main'];
  res.json({ connected, hasQR });
});

app.get('/api/qr', async (req, res) => {
  const qrString = bot.latestQR['main'];
  if (!qrString) {
    return res.json({ qr: null, message: 'No QR code available' });
  }
  try {
    const qrDataURL = await QRCode.toDataURL(qrString, { width: 300, margin: 2 });
    res.json({ qr: qrDataURL });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate QR' });
  }
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

    sessionStore.saveSession(safeName, { type: 'manual', autoRestart: true });
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
      bot.sessionConnected[id] = false;
    }
    sessionStore.saveSession(id, { autoRestart: false });
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
    delete bot.sessionConnected[id];

    const sessionFolder = path.join(SESSIONS_DIR, id);
    if (fs.existsSync(sessionFolder)) {
      fs.rmSync(sessionFolder, { recursive: true, force: true });
    }
    sessionStore.deleteSessionMeta(id);

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
    if (!sock || !bot.sessionConnected[id]) {
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
    if (!mainSock || !bot.sessionConnected['main']) {
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

app.post('/api/pair', async (req, res) => {
  try {
    const number = (req.body.number || '').replace(/[^0-9]/g, '');
    if (!/^\d{6,15}$/.test(number)) {
      return res.status(400).json({ error: 'Invalid phone number. Use country code + number (e.g. 254700000000)' });
    }

    const mainSock = bot.activeSessions['main'];
    if (!mainSock || !bot.sessionConnected['main']) {
      return res.status(503).json({ error: 'Main bot not connected. Start the main bot first.' });
    }

    const sessionId = `${SESSION_PREFIX}-${number.slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const pairingStatus = {};
    pairingStatus[sessionId] = 'pairing';

    const { sock, pairingCode } = await bot.startPairingSession(sessionId, number);

    if (!pairingCode) {
      return res.status(400).json({ error: 'Session already registered. Delete old session first.' });
    }

    const formattedCode = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode;

    res.json({
      success: true,
      pairingCode: formattedCode,
      sessionId,
      message: 'Enter this code in WhatsApp > Linked Devices > Link with phone number'
    });
  } catch (e) {
    console.error('Pair error:', e);
    res.status(500).json({ error: 'Failed to generate pairing code. Try again.' });
  }
});

app.get('/api/pair/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const isConnected = !!bot.sessionConnected[sessionId];
  res.json({
    sessionId,
    status: isConnected ? 'connected' : 'waiting',
    connected: isConnected
  });
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

app.all('*', (req, res) => {
  return nextHandle(req, res);
});

nextApp.prepare().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 MAXX-XMD server listening on port ${PORT}`));
  startBotSession('main').then(() => {
    setTimeout(() => {
      bot.restartSavedSessions().catch(err => console.error('Failed to restart saved sessions:', err));
    }, 5000);
  }).catch(console.error);
}).catch(err => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
