const fs = require('fs');
const path = require('path');
const express = require('express');
const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const crypto = require("crypto");
require('dotenv').config();

const AUTH_FOLDER = path.join(__dirname, 'auth_info_baileys');
fs.mkdirSync(AUTH_FOLDER, { recursive: true });

// ✅ Restore session from base64 (Heroku Config Var)
function restoreSession() {
    try {
        if (!process.env.SESSION_DATA) return console.log("⚠ No SESSION_DATA found.");
        const buffer = Buffer.from(process.env.SESSION_DATA, "base64");

        fs.writeFileSync(path.join(AUTH_FOLDER, "session.tar.gz"), buffer);
        require("child_process").execSync(`tar -xzf session.tar.gz`, { cwd: AUTH_FOLDER });

        console.log("✅ Session restored successfully!");
    } catch (err) {
        console.log("❌ Failed to restore session:", err);
    }
}

restoreSession();

async function startBot() {
    let creds = {};
    try {
        creds = JSON.parse(fs.readFileSync(path.join(AUTH_FOLDER, "creds.json"), "utf8"));
    } catch {
        console.log("❌ No valid session found. Please scan QR once to create new session.");
    }

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: { creds, keys: {} },
    });

    // ✅ Save session automatically
    sock.ev.on('creds.update', () => {
        const data = JSON.stringify(sock.authState.creds, null, 2);
        fs.writeFileSync(path.join(AUTH_FOLDER, "creds.json"), data);
        console.log("💾 Session updated and saved.");
    });

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'open') console.log('✅ BOT CONNECTED!');
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    // ✅ LOAD COMMANDS
    sock.commands = new Map();
    const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command?.name && command?.execute) {
            sock.commands.set(command.name.toLowerCase(), command);
            console.log(`✅ Loaded command: ${command.name}`);
        }
    }

    // ✅ MESSAGE HANDLER
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        let text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            "";

        if (!text.startsWith(".")) return;

        const args = text.slice(1).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        const command = sock.commands.get(cmdName);
        if (!command) return;

        try {
            await command.execute(sock, msg, args, msg.key.remoteJid);
        } catch (err) {
            console.log("Command Error:", err);
            await sock.sendMessage(msg.key.remoteJid, { text: "⚠ Command Failed!" });
        }
    });

    // ✅ EXPRESS SERVER
    const app = express();
    const PORT = process.env.PORT || 3000;
    app.get('/', (req, res) => res.send('Maxx-XMD is Online ✅'));
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startBot();
