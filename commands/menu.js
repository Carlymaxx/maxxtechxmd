const moment = require("moment-timezone");
const os = require("os");
const emojis = require('../utils/emojis');

module.exports = {
  name: "menu",
  alias: ["help", "commands"],
  description: "Show bot menu and info",

  execute: async (sock, msg, args, from, settings) => {
    const nairobiTime = moment().tz("Africa/Nairobi").format("HH:mm:ss");
    const nairobiDate = moment().tz("Africa/Nairobi").format("YYYY-MM-DD");

    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const usedMem = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const hour = parseInt(moment().tz("Africa/Nairobi").format("HH"));
    let greeting = "Hello";
    if (hour >= 5 && hour < 12) greeting = "🌞 Good morning";
    else if (hour >= 12 && hour < 18) greeting = "🌤 Good afternoon";
    else if (hour >= 18 && hour < 22) greeting = "🌙 Good evening";
    else greeting = "🌌 Good night";

    const randEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

    const text = `╔══════════════════════════╗
║  ✨ *${settings.botName} MENU* ✨
╚══════════════════════════╝

${greeting}, *${msg.pushName || "User"}*! ${randEmoji()}

👑 *Owner:* ${settings.owner}
🔧 *Prefix:* ${settings.prefix}
🕒 *Time:* ${nairobiTime}
📅 *Date:* ${nairobiDate}
⏱️ *Uptime:* ${hours}h ${minutes}m
💾 *RAM:* ${usedMem}MB / ${totalMem}MB

╔═══ 🛠️ *UTILITIES* ═══╗
║ ${settings.prefix}menu - Bot menu ${randEmoji()}
║ ${settings.prefix}ping - Check response ${randEmoji()}
║ ${settings.prefix}alive - Bot status ${randEmoji()}
║ ${settings.prefix}botinfo - Bot info ${randEmoji()}
║ ${settings.prefix}owner - Owner contact ${randEmoji()}
║ ${settings.prefix}repo - Source code ${randEmoji()}
║ ${settings.prefix}runtime - Uptime & system ${randEmoji()}
╚════════════════════╝

╔═══ 🎮 *FUN* ═══╗
║ ${settings.prefix}joke - Random joke ${randEmoji()}
║ ${settings.prefix}quote - Inspiration ${randEmoji()}
║ ${settings.prefix}8ball - Magic 8-ball ${randEmoji()}
║ ${settings.prefix}dice - Roll dice ${randEmoji()}
║ ${settings.prefix}flip - Flip a coin ${randEmoji()}
║ ${settings.prefix}truth - Truth question ${randEmoji()}
║ ${settings.prefix}dare - Dare challenge ${randEmoji()}
║ ${settings.prefix}compliment - Get hyped ${randEmoji()}
╚════════════════════╝

╔═══ 🔧 *TOOLS* ═══╗
║ ${settings.prefix}calc - Calculator ${randEmoji()}
║ ${settings.prefix}tts - Text to speech ${randEmoji()}
║ ${settings.prefix}weather - Weather info ${randEmoji()}
║ ${settings.prefix}sticker - Make sticker ${randEmoji()}
║ ${settings.prefix}toimg - Sticker to image ${randEmoji()}
╚════════════════════╝

╔═══ 👥 *GROUP* ═══╗
║ ${settings.prefix}tagall - Tag everyone ${randEmoji()}
║ ${settings.prefix}groupinfo - Group info ${randEmoji()}
║ ${settings.prefix}kick - Remove member ${randEmoji()}
║ ${settings.prefix}promote - Make admin ${randEmoji()}
║ ${settings.prefix}demote - Remove admin ${randEmoji()}
║ ${settings.prefix}mute - Mute group ${randEmoji()}
║ ${settings.prefix}unmute - Unmute group ${randEmoji()}
║ ${settings.prefix}antilink - Toggle antilink ${randEmoji()}
╚════════════════════╝

📢 *Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J

> _Powered by Maxx Tech_ ⚡💫`;

    await sock.sendMessage(from, {
      image: { url: "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg" },
      caption: text
    }, { quoted: msg });
  }
};
