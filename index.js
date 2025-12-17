// ==================== MAXX-XMD index.js (Multi-Session, no server) ====================

const fs = require('fs');
const path = require('path');
const qrcodeTerminal = require('qrcode-terminal');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');

// ---- Folders ----
const SESSIONS_DIR = path.join(__dirname, 'auth_info_baileys');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// ---- Bot settings ----
const settings = { prefix: ".", botName: "MAXX-XMD" };

// ---- Active sessions ----
const activeSessions = {}; // { sessionId: sock }

// ---- Start Bot for a session ----
async function startBotSession(sessionId = 'main') {
    if (activeSessions[sessionId]) return activeSessions[sessionId];

    const sessionFolder = path.join(SESSIONS_DIR, sessionId);
    if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        browser: [settings.botName, 'Chrome', '1.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', update => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcodeTerminal.generate(qr, { small: true });
            console.log(`📲 [${sessionId}] Scan this QR with WhatsApp (first time only)`);
        }
        if (connection === 'open') console.log(`✅ [${sessionId}] MAXX-XMD connected!`);
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log(`🔐 [${sessionId}] Logged out, deleting session...`);
                fs.rmSync(sessionFolder, { recursive: true, force: true });
            }
            console.log(`🔁 [${sessionId}] Reconnecting in 5s...`);
            setTimeout(() => startBotSession(sessionId), 5000);
        }
    });

    activeSessions[sessionId] = sock;
    return sock;
}

// ---- Export multi-session bot ----
module.exports = { startBotSession, activeSessions };
