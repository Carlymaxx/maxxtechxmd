// ==================== MAXX-XMD index.js ====================

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
const sessionFolder = path.join(__dirname, 'auth_info_baileys');
if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

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

// ---- Start Bot Function ----
async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            browser: ['MAXX-XMD', 'Chrome', '1.0']
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', update => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                qrcodeTerminal.generate(qr, { small: true });
                console.log('📲 Scan this QR with WhatsApp (first time only)');
            }
            if (connection === 'open') console.log('✅ MAXX-XMD connected!');
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log('🔐 Logged out, deleting session...');
                    fs.rmSync(sessionFolder, { recursive: true, force: true });
                }
                console.log('🔁 Reconnecting in 5s...');
                setTimeout(startBot, 5000);
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
                        owner: "YourName"
                    });
                }

                // ---- Inline YouTube / Play Command logic ----
                // (Keep your existing YouTube / Play logic here as is)

                if(text.toLowerCase() === `${prefix}hello`) {
                    return sock.sendMessage(chatId, { text: "👋 Hello! How can I help you today?" });
                }

            } catch(err) {
                console.log('❌ messages.upsert error:', err);
            }
        });

        // ---- Express Server ----
        const app = express();
        app.use(express.json());
        app.get('/', (req,res) => res.send(`<h1>${settings.botName} is Online ✅</h1>`));

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`🚀 MAXX-XMD server listening on port ${PORT}`));

    } catch(err) {
        console.error('❌ Fatal startup error:', err);
        process.exit(1);
    }
}

// ---- Export startBot for external usage ----
module.exports = { startBot };
