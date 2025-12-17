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

// ---- Multi-session bot manager ----
const { startBot: startMultiBot } = require('./botManager'); // Make sure botManager.js is in same repo

// ---- Start Express Server ----
const app = express();
app.use(express.json());

// ---- Health check ----
app.get('/', (req, res) => res.send(`<h1>${settings.botName} is Online ✅</h1>`));

// ---- Start session via API ----
app.post('/start-session', async (req, res) => {
    try {
        const { sessionName } = req.body;
        if (!sessionName) return res.status(400).json({ error: 'sessionName required' });

        await startMultiBot(sessionName);
        res.json({ success: true, message: `Session "${sessionName}" started!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ---- Example send message endpoint ----
app.post('/send-message', async (req, res) => {
    try {
        const { sessionName, number, message } = req.body;
        if (!sessionName || !number || !message)
            return res.status(400).json({ error: 'sessionName, number, and message are required' });

        const { sendMessage } = require('./botManager');
        await sendMessage(sessionName, number, message);
        res.json({ success: true, message: `Message sent via "${sessionName}" ✅` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ---- Start Express ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 MAXX-XMD server listening on port ${PORT}`));

// ---- Optional: automatically start a default session ----
const DEFAULT_SESSION = 'default';
startMultiBot(DEFAULT_SESSION).catch(console.error);
