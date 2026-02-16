require('dotenv').config();
const fs = require('fs');
const path = require('path');
const qrcodeTerminal = require('qrcode-terminal');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const settings = {
    prefix: process.env.PREFIX || ".",
    botName: process.env.BOT_NAME || "MAXX-XMD",
    ownerNumber: process.env.OWNER_NUMBER || ""
};

const SESSIONS_DIR = path.join(__dirname, 'auth_info_baileys');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

const activeSessions = {};
const stoppingSessions = new Set();
const latestQR = {};
const sessionConnected = {};

async function startBotSession(sessionId = 'main') {
    if (activeSessions[sessionId]) return activeSessions[sessionId];

    stoppingSessions.delete(sessionId);
    delete latestQR[sessionId];

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
            latestQR[sessionId] = qr;
            qrcodeTerminal.generate(qr, { small: true });
            console.log(`📲 [${sessionId}] Scan this QR with WhatsApp`);
        }
        if (connection === 'open') {
            delete latestQR[sessionId];
            sessionConnected[sessionId] = true;
            console.log(`✅ [${sessionId}] MAXX-XMD connected!`);
        }
        if (connection === 'close') {
            delete latestQR[sessionId];
            sessionConnected[sessionId] = false;
            if (stoppingSessions.has(sessionId)) {
                console.log(`⏹️ [${sessionId}] Session stopped by user.`);
                delete activeSessions[sessionId];
                return;
            }

            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log(`🔐 [${sessionId}] Logged out, deleting session...`);
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                delete activeSessions[sessionId];
                return;
            }
            delete activeSessions[sessionId];
            console.log(`🔁 [${sessionId}] Reconnecting in 5s...`);
            setTimeout(() => startBotSession(sessionId), 5000);
        }
    });

    activeSessions[sessionId] = sock;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.fromMe) continue;
            try {
                const handler = require('./handlers/messagehandler.js');
                await handler(sock, msg);
            } catch (err) {
                console.error('Message handler error:', err);
            }
        }
    });

    return sock;
}

async function startPairingSession(sessionId, phoneNumber) {
    stoppingSessions.delete(sessionId);

    const sessionFolder = path.join(SESSIONS_DIR, sessionId);
    if (fs.existsSync(sessionFolder)) {
        fs.rmSync(sessionFolder, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionFolder);

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: [settings.botName, 'Chrome', '1.0']
    });

    sock.ev.on('creds.update', saveCreds);

    await new Promise(resolve => setTimeout(resolve, 3000));

    if (sock.authState.creds.registered) {
        sock.end(undefined);
        fs.rmSync(sessionFolder, { recursive: true, force: true });
        throw new Error('Session already registered. Please try again.');
    }

    const pairingCode = await sock.requestPairingCode(phoneNumber);
    console.log(`🔑 [${sessionId}] Pairing code for ${phoneNumber}: ${pairingCode}`);

    sock.ev.on('connection.update', update => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(`✅ [${sessionId}] Paired and connected!`);
        }
        if (connection === 'close') {
            if (stoppingSessions.has(sessionId)) {
                console.log(`⏹️ [${sessionId}] Session stopped by user.`);
                delete activeSessions[sessionId];
                return;
            }

            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log(`🔐 [${sessionId}] Logged out, deleting session...`);
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                delete activeSessions[sessionId];
                return;
            }
            delete activeSessions[sessionId];
            console.log(`🔁 [${sessionId}] Reconnecting in 5s...`);
            setTimeout(() => startBotSession(sessionId), 5000);
        }
    });

    activeSessions[sessionId] = sock;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.fromMe) continue;
            try {
                const handler = require('./handlers/messagehandler.js');
                await handler(sock, msg);
            } catch (err) {
                console.error('Message handler error:', err);
            }
        }
    });

    return { sock, pairingCode };
}

module.exports = { startBotSession, startPairingSession, activeSessions, stoppingSessions, latestQR, sessionConnected };
