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

const { loadSettings, getSetting } = require('./utils/settings');

const envSettings = {
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

function setupAutoFeatures(sock, sessionId) {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const settings = loadSettings();

        for (const msg of messages) {
            try {
                if (settings.autoread && msg.key.remoteJid !== 'status@broadcast') {
                    await sock.readMessages([msg.key]);
                }

                if (msg.key.remoteJid === 'status@broadcast') {
                    if (settings.autoviewstatus) {
                        await sock.readMessages([msg.key]);
                    }
                    if (settings.autolikestatus) {
                        const emoji = settings.autolikestatus_emoji || "🔥";
                        try {
                            await sock.sendMessage(msg.key.remoteJid, {
                                react: { text: emoji, key: msg.key }
                            });
                        } catch {}
                    }
                    continue;
                }

                const handler = require('./handlers/messagehandler.js');
                await handler(sock, msg);
            } catch (err) {
                console.error('Message handler error:', err);
            }
        }
    });

    sock.ev.on('call', async (calls) => {
        const settings = loadSettings();
        if (!settings.anticall) return;

        for (const call of calls) {
            if (call.status === 'offer') {
                try {
                    await sock.rejectCall(call.id, call.from);
                    await sock.sendMessage(call.from, {
                        text: `📵 *Auto-Reject*\n\nCalls are not allowed. Please send a message instead.\n\n_${settings.botName || 'MAXX-XMD'}_`
                    });
                    console.log(`📵 Rejected call from ${call.from}`);
                } catch (err) {
                    console.error('Error rejecting call:', err);
                }
            }
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        const settings = loadSettings();
        const { id, participants, action } = update;

        try {
            const groupMeta = await sock.groupMetadata(id);
            const groupName = groupMeta.subject;

            for (const participant of participants) {
                const userName = participant.split('@')[0];

                if (action === 'add' && settings.welcomeMessage) {
                    await sock.sendMessage(id, {
                        text: `╔══════════════════╗\n` +
                              `║  👋 *WELCOME!*\n` +
                              `╚══════════════════╝\n\n` +
                              `Hello @${userName}! 🎉\n\n` +
                              `Welcome to *${groupName}*!\n` +
                              `We're glad to have you here.\n\n` +
                              `📌 Please read the group description.\n\n` +
                              `> _${settings.botName || 'MAXX-XMD'}_ ⚡`,
                        mentions: [participant]
                    });
                }

                if (action === 'remove' && settings.goodbyeMessage) {
                    await sock.sendMessage(id, {
                        text: `╔══════════════════╗\n` +
                              `║  👋 *GOODBYE!*\n` +
                              `╚══════════════════╝\n\n` +
                              `@${userName} has left the group. 😢\n\n` +
                              `We'll miss you in *${groupName}*!\n\n` +
                              `> _${settings.botName || 'MAXX-XMD'}_ ⚡`,
                        mentions: [participant]
                    });
                }
            }
        } catch (err) {
            console.error('Group event error:', err);
        }
    });
}

async function startBotSession(sessionId = 'main') {
    if (activeSessions[sessionId]) return activeSessions[sessionId];

    stoppingSessions.delete(sessionId);
    delete latestQR[sessionId];

    const sessionFolder = path.join(SESSIONS_DIR, sessionId);
    if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const settings = loadSettings();

    const sock = makeWASocket({
        version,
        auth: state,
        browser: [settings.botName || envSettings.botName, 'Chrome', '1.0']
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

    setupAutoFeatures(sock, sessionId);

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
        qrTimeout: undefined,
        defaultQueryTimeoutMs: undefined,
        connectTimeoutMs: 120000,
        browser: ['Mac OS', 'Chrome', '14.4.1']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', update => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) return;
        if (connection === 'open') {
            sessionConnected[sessionId] = true;
            console.log(`✅ [${sessionId}] Paired and connected!`);
        }
        if (connection === 'close') {
            sessionConnected[sessionId] = false;
            if (stoppingSessions.has(sessionId)) {
                console.log(`⏹️ [${sessionId}] Session stopped by user.`);
                delete activeSessions[sessionId];
                return;
            }

            const reason = lastDisconnect?.error?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || '';
            if (reason === DisconnectReason.loggedOut) {
                console.log(`🔐 [${sessionId}] Logged out, deleting session...`);
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                delete activeSessions[sessionId];
                return;
            }
            if (errorMsg.includes('QR refs') || errorMsg.includes('timed out')) {
                console.log(`⏰ [${sessionId}] Pairing timed out, cleaning up...`);
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

    await new Promise(resolve => setTimeout(resolve, 3000));

    if (sock.authState.creds.registered) {
        sock.end(undefined);
        fs.rmSync(sessionFolder, { recursive: true, force: true });
        delete activeSessions[sessionId];
        throw new Error('Session already registered. Please try again.');
    }

    const pairingCode = await sock.requestPairingCode(phoneNumber);
    console.log(`🔑 [${sessionId}] Pairing code for ${phoneNumber}: ${pairingCode}`);

    setupAutoFeatures(sock, sessionId);

    return { sock, pairingCode };
}

module.exports = { startBotSession, startPairingSession, activeSessions, stoppingSessions, latestQR, sessionConnected };
