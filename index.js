// ==================== MAXX-XMD index.js ====================
// Add this at the top of your file
// Replace any existing fetch declaration
// ==================== MAXX-XMD index.js ====================
// Add this at the top of your file
// Replace any existing fetch declaration
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const fs = require('fs');
const path = require('path');
const express = require('express');
const { exec } = require('child_process');
const qrcodeTerminal = require('qrcode-terminal');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const play = require('play-dl');
const yts = require('yt-search');

const sessionFolder = path.join(__dirname, 'auth_info_baileys');
if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

// Bot settings
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

// ---- Start Bot ----
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
        fs.readdirSync('./commands').forEach(file => {
            if (file.endsWith('.js')) {
                const command = require(`./commands/${file}`);
                commands.set(command.name, command);
            }
        });

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

                // ---- YouTube Inline Command (legacy) ----
                if (text.toLowerCase().startsWith(`${prefix}youtube `)) {
                    const url = text.split(" ")[1];
                    if(!url) return sock.sendMessage(chatId, { text: "❌ Please provide a YouTube URL!" });

                    try {
                        const res = await fetch(`https://your-api.example.com/youtube?url=${encodeURIComponent(url)}`);
                        const data = await res.json();

                        let msgText = `🎵 Title: ${data.data.title}\n\n📥 Download Links:\nMP3: ${data.data.downloadURL}\n`;
                        if(data.videos && data.videos.length) {
                            data.videos.forEach(v => msgText += `${v.label}: ${v.url}\n`);
                        }

                        if(data.data.thumbnail) {
                            await sock.sendMessage(chatId, { image: { url: data.data.thumbnail }, caption: msgText });
                        } else {
                            await sock.sendMessage(chatId, { text: msgText });
                        }
                    } catch(err) {
                        console.error(err);
                        await sock.sendMessage(chatId, { text: "❌ Failed to fetch YouTube data." });
                    }
                }
// ---- PLAY COMMAND (Automatic search, thumbnail, audio) ----
if (commandName === 'play') {
    const query = args.join(" ").trim();
    if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .play <song name or URL>' });

    await sock.sendMessage(chatId, { text: `🔍 Searching "${query}"...` });

    try {
        let songTitle, songArtist, songDuration, thumbnail, downloadURL;
        let found = false;

        // ---- Try Spotify search first ----
        try {
            const spotifyAPI = `https://eliteprotech-apis.zone.id/spotify?url=${encodeURIComponent('https://open.spotify.com/search/' + query)}`;
            const res = await fetch(spotifyAPI);
            const data = await res.json();
            if (data.success && data.data?.metadata?.title) {
                songTitle = data.data.metadata.title;
                songArtist = data.data.metadata.artist || 'Unknown Artist';
                songDuration = data.data.metadata.duration || 'Unknown';
                thumbnail = data.data.metadata.images;
                downloadURL = data.data.download;
                found = true;
            }
        } catch(err) {
            console.log('Spotify search failed, trying YouTube...', err);
        }

        // ---- Fallback: YouTube search if Spotify fails ----
        if (!found) {
            const searchResult = await yts(query);
            const video = searchResult?.videos?.[0];
            if (!video) return sock.sendMessage(chatId, { text: `❌ Could not find any results for "${query}"` });

            songTitle = video.title;
            songArtist = video.author?.name || 'YouTube';
            songDuration = video.timestamp || 'Unknown';
            thumbnail = video.thumbnail;
            downloadURL = `https://eliteprotech-apis.zone.id/yt?url=${encodeURIComponent(video.url)}`;
        }

        // ---- Send thumbnail + song info ----
        if (thumbnail) {
            await sock.sendMessage(chatId, {
                image: { url: thumbnail },
                caption: `🎵 Title: ${songTitle}\n👤 Artist: ${songArtist}\n⏱ Duration: ${songDuration}`
            });
        } else {
            await sock.sendMessage(chatId, { text: `🎵 Title: ${songTitle}\n👤 Artist: ${songArtist}\n⏱ Duration: ${songDuration}` });
        }

        // ---- Download audio from API ----
        const safeTitle = sanitizeFileName(songTitle);
        const tempPath = path.join(__dirname, `MAXXXMD - ${safeTitle}.mp3`);

        // fetch the audio and save to temp file
        const res = await fetch(downloadURL);
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(tempPath, Buffer.from(buffer));

        // ---- Check file size & clip if >16MB ----
        const stats = fs.statSync(tempPath);
        if (stats.size / (1024*1024) > 16) {
            const finalPath = path.join(__dirname, `MAXXXMD - ${safeTitle}-clip.mp3`);
            await new Promise((resolve, reject) => {
                const cmd = `ffmpeg -hide_banner -loglevel error -y -i "${tempPath}" -t 60 -vn "${finalPath}"`;
                exec(cmd, (err) => err ? reject(err) : resolve());
            });
            fs.unlinkSync(tempPath);

            await sock.sendMessage(chatId, {
                audio: fs.createReadStream(finalPath),
                mimetype: 'audio/mpeg',
                fileName: path.basename(finalPath)
            });
            fs.unlinkSync(finalPath);
        } else {
            await sock.sendMessage(chatId, {
                audio: fs.createReadStream(tempPath),
                mimetype: 'audio/mpeg',
                fileName: path.basename(tempPath)
            });
            fs.unlinkSync(tempPath);
        }

    } catch(err) {
        console.error(err);
        await sock.sendMessage(chatId, { text: `❌ Failed to play "${query}".` });
    }
}

                // ---- Hello Command ----
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
        app.get('/', (req,res)=>res.send(`<h1>${settings.botName} is Online ✅</h1>`));

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, ()=>console.log(`🚀 MAXX-XMD server listening on port ${PORT}`));

    } catch(err) {
        console.error('❌ Fatal startup error:', err);
        process.exit(1);
    }
}

// ---- Start bot ----
// Remove the automatic start
// startBot();

// Export for server usage
module.exports = { startBot };
