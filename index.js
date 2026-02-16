require('dotenv').config();
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
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

function restoreSessionFromEnv() {
    const sessionId = process.env.SESSION_ID;
    if (!sessionId) return;

    const mainFolder = path.join(SESSIONS_DIR, 'main');
    const credsPath = path.join(mainFolder, 'creds.json');

    if (fs.existsSync(credsPath)) {
        console.log('📂 Session creds already exist, skipping restore.');
        return;
    }

    try {
        let encoded = sessionId;
        if (encoded.startsWith('MAXX-XMD~')) {
            encoded = encoded.replace('MAXX-XMD~', '');
        }

        const compressed = Buffer.from(encoded, 'base64');
        const creds = zlib.gunzipSync(compressed).toString('utf8');

        JSON.parse(creds);

        if (!fs.existsSync(mainFolder)) fs.mkdirSync(mainFolder, { recursive: true });
        fs.writeFileSync(credsPath, creds, 'utf8');
        console.log('✅ Session restored from SESSION_ID environment variable!');
    } catch (err) {
        console.error('❌ Failed to restore session from SESSION_ID:', err.message);
    }
}

restoreSessionFromEnv();

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

async function sendSessionIdToUser(sessionId, phoneNumber) {
    const { encodeSessionId } = require('./utils/sessionEncoder');
    const sessionFolder = path.join(SESSIONS_DIR, sessionId);

    let deploySessionId = null;
    for (let attempt = 0; attempt < 8; attempt++) {
        const credsPath = path.join(sessionFolder, 'creds.json');
        if (fs.existsSync(credsPath)) {
            deploySessionId = encodeSessionId(sessionFolder);
            if (deploySessionId) break;
        }
        console.log(`⏳ [${sessionId}] Waiting for creds to save... attempt ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!deploySessionId) {
        console.error(`❌ [${sessionId}] Could not generate session ID after retries`);
        return;
    }

    const userJid = phoneNumber + '@s.whatsapp.net';
    const ownerNumber = envSettings.ownerNumber;
    const botOwner = process.env.OWNER_NAME || 'MAXX';
    const botDev = process.env.BOT_DEVELOPER || 'MAXX TECH';

    const sessionMsg = `*𝗠𝗔𝗫𝗫-𝗫𝗠𝗗 SESSION ID* 🔑\n\n` +
        `Here is your *MAXX-XMD* session ID.\nCopy it and use it to deploy your bot on any platform.\n\n` +
        `\`\`\`${deploySessionId}\`\`\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 *HOW TO DEPLOY:*\n\n` +
        `1️⃣ Fork: github.com/Carlymaxx/maxxtechxmd\n\n` +
        `2️⃣ Set environment variables:\n` +
        `   • SESSION_ID = _(paste above)_\n` +
        `   • OWNER_NUMBER = ${phoneNumber}\n` +
        `   • PREFIX = .\n\n` +
        `3️⃣ Deploy on:\n` +
        `   🟣 Heroku • 🟢 Render • 🔵 Railway\n` +
        `   🟡 Koyeb • ⚡ Replit\n\n` +
        `⚠️ _Keep your session ID private!_\n\n` +
        `> _Powered by MAXX-XMD_ ⚡`;

    try {
        const pairedSock = activeSessions[sessionId];
        if (pairedSock && sessionConnected[sessionId]) {
            await pairedSock.sendMessage(userJid, { text: sessionMsg });
            console.log(`📨 [${sessionId}] Session ID sent to ${phoneNumber} via paired session`);
        }
    } catch (err) {
        console.error(`Failed to send via paired session:`, err.message);
    }

    try {
        const mainSock = activeSessions['main'];
        if (mainSock && sessionConnected['main']) {
            await mainSock.sendMessage(userJid, { text: sessionMsg });
            console.log(`📨 [${sessionId}] Session ID sent to ${phoneNumber} via main bot`);

            if (ownerNumber) {
                const ownerJid = ownerNumber + '@s.whatsapp.net';
                await mainSock.sendMessage(ownerJid, {
                    text: `╔══════════════════════════╗\n` +
                          `║  📱 *NEW DEVICE PAIRED!*\n` +
                          `╚══════════════════════════╝\n\n` +
                          `👤 *Number:* +${phoneNumber}\n` +
                          `📋 *Session:* ${sessionId}\n` +
                          `⏰ *Time:* ${new Date().toLocaleString()}\n` +
                          `🌐 *Total Users:* ${Object.keys(activeSessions).length}\n\n` +
                          `_This device is now linked to MAXX-XMD_`
                });
                console.log(`📨 Owner notified about new pairing`);
            }
        }
    } catch (err) {
        console.error(`Failed to send via main bot:`, err.message);
    }
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

    let sessionIdSent = false;

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

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) return;
        if (connection === 'open') {
            sessionConnected[sessionId] = true;
            console.log(`✅ [${sessionId}] Paired and connected!`);

            if (!sessionIdSent) {
                sessionIdSent = true;
                await new Promise(resolve => setTimeout(resolve, 5000));
                await sendSessionIdToUser(sessionId, phoneNumber);
            }
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
