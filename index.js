// ==================== MAXX-XMD index.js (Multi-Session) ====================

// Fetch polyfill for Node.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const fs = require('fs');
const path = require('path');
const express = require('express');
const { exec } = require('child_process');
const qrcodeTerminal = require('qrcode-terminal');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const play = require('play-dl');
const yts = require('yt-search');

// ---- Folders ----
const SESSIONS_DIR = path.join(__dirname, 'auth_info_baileys');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// ---- Bot settings ----
const settings = { prefix: ".", botName: "MAXX-XMD" };

// ---- Helpers ----
const sanitizeFileName = name => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').slice(0, 180).trim() || 'track';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function streamToFile(readable, filePath) {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(filePath);
        readable.pipe(ws);
        ws.on('finish', resolve);
        ws.on('close', resolve);
        ws.on('error', reject);
        readable.on('error', reject);
    });
}

// ---- Active sessions ----
const activeSessions = {}; // { sessionId: sock }

// ---- Start Bot for a session ----
async function startBotSession(sessionId = 'main') {
    if (activeSessions[sessionId]) return activeSessions[sessionId];

    try {
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

        // ---- Load Commands ----
        const commands = new Map();
        if (fs.existsSync('./commands')) {
            fs.readdirSync('./commands').forEach(file => {
                if (file.endsWith('.js')) {
                    const command = require(`./commands/${file}`);
                    commands.set(command.name, command);
                }
            });
        }

        // ---- Message Handler ----
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg || !msg.message || msg.key.fromMe) return;

                const chatId = msg.key.remoteJid;
                const text =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    msg.message.videoMessage?.caption ||
                    '';
                if (!text) return;

                const prefix = settings.prefix;
                if (!text.startsWith(prefix)) return;

                const args = text.slice(prefix.length).trim().split(/ +/);
                const commandName = args.shift().toLowerCase();
                const command = commands.get(commandName);
                if (command) {
                    await command.execute(sock, msg, args, chatId, {
                        botName: settings.botName,
                        owner: "MAXX"
                    });
                }

                if(text.toLowerCase() === `${prefix}hello`) {
                    return sock.sendMessage(chatId, { text: "👋 Hello! How can I help you today?" });
                }

            } catch(err) {
                console.log(`❌ [${sessionId}] messages.upsert error:`, err);
            }
        });

        // ---- Express Server for health check ----
        const app = express();
        app.use(express.json());
        app.get('/', (req,res) => res.send(`<h1>[${sessionId}] ${settings.botName} is Online ✅</h1>`));

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`🚀 [${sessionId}] MAXX-XMD server listening on port ${PORT}`));

        activeSessions[sessionId] = sock;
        return sock;

    } catch(err) {
        console.error(`❌ [${sessionId}] Fatal startup error:`, err);
        throw err;
    }
}

// ---- Export multi-session bot function ----
module.exports = { startBotSession };
