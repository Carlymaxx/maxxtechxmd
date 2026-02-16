const moment = require("moment-timezone");
const os = require("os");
const emojis = require('../utils/emojis');
const { loadSettings } = require('../utils/settings');

module.exports = {
  name: "menu",
  alias: ["help", "commands"],
  description: "Show bot menu and info",

  execute: async (sock, msg, args, from, settings) => {
    const botSettings = loadSettings();
    const tz = botSettings.timezone || "Africa/Nairobi";
    const nairobiTime = moment().tz(tz).format("HH:mm:ss");
    const nairobiDate = moment().tz(tz).format("YYYY-MM-DD");

    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const usedMem = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const hour = parseInt(moment().tz(tz).format("HH"));
    let greeting = "Hello";
    if (hour >= 5 && hour < 12) greeting = "🌞 Good morning";
    else if (hour >= 12 && hour < 18) greeting = "🌤 Good afternoon";
    else if (hour >= 18 && hour < 22) greeting = "🌙 Good evening";
    else greeting = "🌌 Good night";

    const randEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
    const p = settings.prefix;

    const text = `╔══════════════════════════╗
║  ✨ *${settings.botName} MENU* ✨
╚══════════════════════════╝

${greeting}, *${msg.pushName || "User"}*! ${randEmoji()}

👑 *Owner:* ${settings.owner}
🔧 *Prefix:* ${p}
🌐 *Mode:* ${botSettings.mode || "public"}
🕒 *Time:* ${nairobiTime}
📅 *Date:* ${nairobiDate}
⏱️ *Uptime:* ${hours}h ${minutes}m
💾 *RAM:* ${usedMem}MB / ${totalMem}MB

╔═══ 🛠️ *UTILITIES* ═══╗
║ ${p}menu - Bot menu ${randEmoji()}
║ ${p}ping - Check response ${randEmoji()}
║ ${p}alive - Bot status ${randEmoji()}
║ ${p}botinfo - Bot info ${randEmoji()}
║ ${p}owner - Owner contact ${randEmoji()}
║ ${p}repo - Source code ${randEmoji()}
║ ${p}runtime - Uptime & system ${randEmoji()}
╚════════════════════╝

╔═══ 🎮 *FUN* ═══╗
║ ${p}joke - Random joke ${randEmoji()}
║ ${p}quote - Inspiration ${randEmoji()}
║ ${p}8ball - Magic 8-ball ${randEmoji()}
║ ${p}dice - Roll dice ${randEmoji()}
║ ${p}flip - Flip a coin ${randEmoji()}
║ ${p}truth - Truth question ${randEmoji()}
║ ${p}dare - Dare challenge ${randEmoji()}
║ ${p}compliment - Get hyped ${randEmoji()}
╚════════════════════╝

╔═══ 🔧 *TOOLS* ═══╗
║ ${p}calc - Calculator ${randEmoji()}
║ ${p}tts - Text to speech ${randEmoji()}
║ ${p}weather - Weather info ${randEmoji()}
║ ${p}sticker - Make sticker ${randEmoji()}
║ ${p}toimg - Sticker to image ${randEmoji()}
║ ${p}reshare - Forward message ${randEmoji()}
╚════════════════════╝

╔═══ 👥 *GROUP* ═══╗
║ ${p}tagall - Tag everyone ${randEmoji()}
║ ${p}groupinfo - Group info ${randEmoji()}
║ ${p}kick - Remove member ${randEmoji()}
║ ${p}promote - Make admin ${randEmoji()}
║ ${p}demote - Remove admin ${randEmoji()}
║ ${p}mute - Mute group ${randEmoji()}
║ ${p}unmute - Unmute group ${randEmoji()}
║ ${p}antilink - Toggle antilink ${randEmoji()}
╚════════════════════╝

╔═══ ⚙️ *SETTINGS* ═══╗
║ ${p}setvar - Set any variable ${randEmoji()}
║ ${p}mode - Public/Private ${randEmoji()}
║ ${p}setprefix - Change prefix ${randEmoji()}
║ ${p}setbotname - Bot name ${randEmoji()}
║ ${p}setauthor - Sticker author ${randEmoji()}
║ ${p}setpackname - Pack name ${randEmoji()}
║ ${p}settimezone - Timezone ${randEmoji()}
║ ${p}setbotpic - Bot picture ${randEmoji()}
╚════════════════════╝

╔═══ 🤖 *AUTOMATION* ═══╗
║ ${p}anticall - Auto-reject calls ${randEmoji()}
║ ${p}chatbot - AI auto-reply ${randEmoji()}
║ ${p}autoread - Auto-read msgs ${randEmoji()}
║ ${p}autoviewstatus - View statuses ${randEmoji()}
║ ${p}autolikestatus - React statuses ${randEmoji()}
║ ${p}greet - Welcome/goodbye ${randEmoji()}
╚════════════════════╝

╔═══ 🔐 *OWNER* ═══╗
║ ${p}block - Block user ${randEmoji()}
║ ${p}unblock - Unblock user ${randEmoji()}
║ ${p}deploy - Server info ${randEmoji()}
╚════════════════════╝

📢 *Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J

> _Powered by Maxx Tech_ ⚡💫`;

    const botpic = botSettings.botpic || "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg";

    await sock.sendMessage(from, {
      image: { url: botpic },
      caption: text
    }, { quoted: msg });
  }
};
