require('dotenv').config();
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
const PORT = process.env.PORT || 4000;
const BOT_OWNER = process.env.BOT_OWNER || 'MAXX';
const BOT_DEV = process.env.BOT_DEVELOPER || 'MAXX TECH';
const SESSION_PREFIX = process.env.SESSION_PREFIX || 'MAXX-XMD';
const DB_FILE = path.join(__dirname, 'db.json');
const SESSIONS_DIR = path.join(__dirname, 'sessions');

// --- Initialize DB ---
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, sessions: {} }, null, 2));
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// --- Next.js App ---
const nextApp = next({ dev: DEV });
const nextHandle = nextApp.getRequestHandler();

// --- Start MAXX-XMD Baileys Bot ---
let sock;
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({ version, auth: state, printQRInTerminal: false });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (up) => {
    const conn = up.connection || '';
    if (conn === 'open') console.log('✅ BAILEYS BOT CONNECTED');
    if (conn === 'close') {
      const shouldReconnect = up.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
      else console.log('❌ Logged out, delete auth_info folder and restart');
    }
    if (up.qr) console.log('📲 QR ready in terminal (if needed)');
  });
}

// --- Express ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Helper: send WhatsApp message ---
async function sendWhatsApp(number, message) {
  if (!sock) throw new Error('Bot not ready');
  const jid = number.includes('@') ? number : number + '@s.whatsapp.net';
  return await sock.sendMessage(jid, { text: message });
}

// --- API Routes ---
app.get('/api/status', (req, res) => {
  res.json({ connected: sock ? sock.ws.readyState === 1 : false });
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

    const msg = `🔐 MAXX-XMD VERIFICATION CODE\nYour code: *${code}*\nOwner: ${BOT_OWNER}\nDeveloper: ${BOT_DEV}`;
    await sendWhatsApp(number, msg);
    res.json({ message: 'Verification code sent to WhatsApp ✅' });
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

    await sendWhatsApp(number, `✅ MAXX-XMD session successfully generated!\nSession ID: ${sessionId}\nOwner: ${BOT_OWNER}\nDeveloper: ${BOT_DEV}\nValid 24h`);
    res.json({ message: 'Verification successful! Session sent to WhatsApp', sessionId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/start-bot', async (req, res) => {
  try {
    if (!sock) {
      startBot().catch(console.error);
      res.json({ success: true, message: 'Bot starting... Check terminal for QR code' });
    } else if (sock.ws.readyState === 1) {
      res.json({ success: false, error: 'Bot is already running' });
    } else {
      startBot().catch(console.error);
      res.json({ success: true, message: 'Bot restarting... Check terminal for QR code' });
    }
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
    if (!sock || sock.ws.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'Bot not connected' });
    }
    await sendWhatsApp(number, message);
    res.json({ success: true, message: 'Message sent' });
  } catch (e) {
    console.error('Send error:', e);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// --- Cleanup expired sessions ---
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

// --- Catch-all handler for Next.js ---
app.get('*', (req, res) => {
  return nextHandle(req, res);
});

// --- Start everything ---
nextApp.prepare().then(() => {
  app.listen(PORT, () => console.log(`🚀 MAXX-XMD server listening on port ${PORT}`));
  startBot().catch(console.error);
}).catch(err => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
