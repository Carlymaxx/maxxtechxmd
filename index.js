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

// ---- Store active sockets by sessionId ----
const activeSockets = {}; // { sessionId: sock }

// ---- Start a bot session ----
async function startBotSession(sessionId = 'main') {
    if (activeSockets[sessionId]) return activeSockets[sessionId];

    const sessionFolder = path.join(__dirname, 'auth_info_baileys', sessionId);
    if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

    try {
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
                console.log(`[${sessionId}] 📲 Scan QR with WhatsApp (first time only)`);
            }
            if (connection === 'open') console.log(`[${sessionId}] ✅ Bot connected!`);
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    console.log(`[${sessionId}] 🔐 Logged out, deleting session...`);
                    fs.rmSync(sessionFolder, { recursive: true, force: true });
                }
                console.log(`[${sessionId}] 🔁 Reconnecting in 5s...`);
                setTimeout(() => startBotSession(sessionId), 5000);
            }
        });

        // ---- Load Commands ----
        const commands = new Map();
        const commandsPath = path.join(__dirname, 'commands');
        if (fs.existsSync(commandsPath)) {
            fs.readdirSync(commandsPath).forEach(file => {
                if (file.endsWith('.js')) {
                    const command = require(path.join(commandsPath, file));
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

                // ---- Simple Hello Command ----
                if (text.toLowerCase() === `${prefix}hello`) {
                    await sock.sendMessage(chatId, { text: "👋 Hello! How can I help you today?" });
                }

                // ---- TODO: Add your YouTube / Play commands here per session ----

            } catch (err) {
                console.error(`[${sessionId}] messages.upsert error:`, err);
            }
        });

        activeSockets[sessionId] = sock;
        return sock;
    } catch (err) {
        console.error(`[${sessionId}] Fatal startup error:`, err);
        throw err;
    }
}
// ---- Export ----
module.exports = { startBotSession };

