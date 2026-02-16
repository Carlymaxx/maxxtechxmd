require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const next = require('next');

const QRCode = require('qrcode');
const bot = require("./index.js");

const DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5000;
const BOT_OWNER = process.env.OWNER_NAME || 'MAXX';
const BOT_DEV = process.env.BOT_DEVELOPER || 'MAXX TECH';
const SESSION_PREFIX = process.env.BOT_NAME || 'MAXX-XMD';
const SESSIONS_DIR = path.join(__dirname, 'auth_info_baileys');

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

app.post('/api/pair', async (req, res) => {
  try {
    const number = (req.body.number || '').replace(/[^0-9]/g, '');
    if (!/^\d{6,15}$/.test(number)) {
      return res.status(400).json({ error: 'Invalid phone number. Use country code + number (e.g. 254700000000)' });
    }

    const mainSock = bot.activeSessions['main'];
    if (!mainSock || !mainSock.ws || mainSock.ws.readyState !== 1) {
      return res.status(503).json({ error: 'Main bot not connected. Start the main bot first.' });
    }

    const sessionId = `${SESSION_PREFIX}-${number.slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    sessionStatus[sessionId] = 'pairing';

    const { sock, pairingCode } = await bot.startPairingSession(sessionId, number);

    if (!pairingCode) {
      return res.status(400).json({ error: 'Session already registered. Delete old session first.' });
    }

    sock.ev.on('connection.update', async (update) => {
      const { connection } = update;
      if (connection === 'open') {
        sessionStatus[sessionId] = 'connected';
        console.log(`✅ [${sessionId}] User ${number} paired successfully!`);

        try {
          const mainSockNow = bot.activeSessions['main'];
          if (mainSockNow && mainSockNow.ws && mainSockNow.ws.readyState === 1) {
            const jid = number + '@s.whatsapp.net';
            await mainSockNow.sendMessage(jid, {
              text: `✅ *MAXX-XMD Bot Linked Successfully!*\n\n📋 *Your Session ID:*\n\`${sessionId}\`\n\n👤 Owner: ${BOT_OWNER}\n🔧 Developer: ${BOT_DEV}\n\n_Keep this session ID safe. Your bot is now active!_`
            });
            console.log(`📨 Session ID sent to ${number} via main bot`);
          }
        } catch (sendErr) {
          console.error('Failed to send session ID:', sendErr);
        }
      } else if (connection === 'close') {
        if (sessionStatus[sessionId] === 'pairing') {
          sessionStatus[sessionId] = 'failed';
        } else {
          sessionStatus[sessionId] = 'disconnected';
        }
      }
    });

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
  const sock = bot.activeSessions[sessionId];
  const isConnected = sock && sock.ws && sock.ws.readyState === 1;
  res.json({
    sessionId,
    status: isConnected ? 'connected' : (sessionStatus[sessionId] || 'unknown'),
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
  startBotSession('main').catch(console.error);
}).catch(err => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
