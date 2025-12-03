require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

// Use your fork instead of @adiwajshing/baileys-pair
const bot = require("./index.js");
 // <-- change this to your GitHub fork package name

const PORT = process.env.PORT || 3000;
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
startBot().catch(console.error);

// --- Express ---
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Bot status route ---
app.get('/status', (req, res) => {
  res.json({ connected: sock ? sock.ws.readyState === 1 : false });
});

// --- Helper: send WhatsApp message ---
async function sendWhatsApp(number, message) {
  if (!sock) throw new Error('Bot not ready');
  const jid = number.includes('@') ? number : number + '@s.whatsapp.net';
  return await sock.sendMessage(jid, { text: message });
}

// --- Routes ---
// 1️⃣ Generate verification code
app.post('/generate', async (req, res) => {
  try {
    const number = (req.body.number || '').trim();
    if (!/^\d{6,15}$/.test(number)) return res.status(400).json({ error: 'Invalid phone number' });

    const db = readDB();
    db.users[number] = db.users[number] || { code: null, session: null, sessionExpiresAt: null };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.users[number].code = code;
    db.users[number].lastSentAt = Date.now();
    writeDB(db);

    const message = `🔐 MAXX-XMD VERIFICATION CODE\nYour code: *${code}*\nOwner: ${BOT_OWNER}\nDeveloper: ${BOT_DEV}`;

    await sendWhatsApp(number, message);
    res.json({ message: 'Verification code sent to WhatsApp ✅' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2️⃣ Verify code and create session
app.post('/verify', async (req, res) => {
  try {
    const { number, code } = req.body;
    if (!number || !code) return res.status(400).json({ error: 'Number and code required' });

    const db = readDB();
    const user = db.users[number];
    if (!user || user.code !== code) return res.status(400).json({ error: 'Invalid or expired code' });

    const sessionId = `${SESSION_PREFIX}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h

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

// 3️⃣ Pair.js session start
app.post('/start', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const sessionPath = path.join(SESSIONS_DIR, `${phone}.json`);
    const store = fs.existsSync(sessionPath) ? JSON.parse(fs.readFileSync(sessionPath)) : null;

    const pair = new Pair({ store });
    pair.on('update', (creds) => fs.writeFileSync(sessionPath, JSON.stringify(creds)));

    const { challenge, ref } = await pair.start(phone);

    res.json({ message: `WhatsApp sent code to ${phone}`, ref });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// 4️⃣ Verify Pair.js code
app.post('/pair-verify', async (req, res) => {
  try {
    const { phone, code, ref } = req.body;
    if (!phone || !code || !ref) return res.status(400).json({ error: 'Missing fields' });

    const sessionPath = path.join(SESSIONS_DIR, `${phone}.json`);
    if (!fs.existsSync(sessionPath)) return res.status(404).json({ error: 'Session not found' });

    const pair = new Pair({ store: JSON.parse(fs.readFileSync(sessionPath)) });
    const credentials = await pair.validateCode(code, ref);

    fs.writeFileSync(sessionPath, JSON.stringify(credentials));

    await pair.connect();
    await pair.sendMessage(phone + '@s.whatsapp.net', { text: `✅ Your Pair.js session is ready! Session ID: ${phone}` });

    res.json({ message: `Session for ${phone} connected! Session ID sent via WhatsApp.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify Pair.js session' });
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
}, 10 * 60 * 1000); // every 10 minutes

// --- Start Express server ---
app.listen(PORT, () => console.log(`🚀 MAXX-XMD server listening on port ${PORT}`));
