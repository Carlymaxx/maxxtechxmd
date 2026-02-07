const moment = require("moment-timezone");
const os = require("os");
const process = require("process");
const emojis = require('../utils/emojis');
  // your emoji list

module.exports = {
  name: "menu",
  alias: ["help"],
  description: "Show bot menu and info",

  execute: async (sock, msg, args, from, settings, plugins = [], users = []) => {
    // Nairobi time & date
    const nairobiTime = moment().tz("Africa/Nairobi").format("HH:mm:ss");
    const nairobiDate = moment().tz("Africa/Nairobi").format("YYYY-MM-DD");

    // RAM usage
    const totalMem = Math.round(os.totalmem() / 1024 / 1024); // MB
    const usedMem = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024); // MB

    // Public / Private mode
    const mode = global.public ? "Public" : "Private";

    // Bot version
    const version = "2.8.9";

    // Active users count
    const activeUsers = users.length || "N/A";

    // Greeting based on Nairobi hour
    const hour = parseInt(moment().tz("Africa/Nairobi").format("HH"));
    let greeting = "Hello";
    if (hour >= 5 && hour < 12) greeting = "🌞 Good morning";
    else if (hour >= 12 && hour < 18) greeting = "🌤 Good afternoon";
    else if (hour >= 18 && hour < 22) greeting = "🌙 Good evening";
    else greeting = "🌌 Good night";

    // Pick random emojis for decoration
    const randEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];
    const heartEmoji = ["💖", "💗", "💓", "💞", "💕", "💘", "💝"];
    const randomHeart = heartEmoji[Math.floor(Math.random() * heartEmoji.length)];

    // Build the menu with vertical border │
    const text = `
│═════════   ═══════════  ═════
│✨ ${randEmoji()} ${settings.botName.toUpperCase()} MENU ${randEmoji()} ✨
│═════════   ═══════════  ═════
│
│👤 Owner: ${settings.Maxx} ${randEmoji()}
│🛠️ Developer: maxx ${randEmoji()}
│📢 Channel: https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J ${randEmoji()}
│🆔 Prefix: ${settings.prefix} ${randEmoji()}
│🕒 Time (Nairobi Ruiru): ${nairobiTime} ${randEmoji()}
│📅 Date: ${nairobiDate} ${randEmoji()}
│
│════════════ INFO ═══════════
│🛠 Mode: ${mode} ${randEmoji()}
│🧩 Version: ${version} ${randEmoji()}
│💾 RAM Usage: ${usedMem}MB / ${totalMem}MB ${randEmoji()}
│🔌 Plugins Active: ${plugins.length || 0} ${randEmoji()}
│👥 Active Users: ${activeUsers} ${randEmoji()}
│
│══════════ COMMANDS ═════════
│• menu ${randEmoji()}
│• ping ${randEmoji()}
│• welcome ${randEmoji()}
│• goodbye ${randEmoji()}
│• antidelete ${randEmoji()}
│
│══════════ GREETING ═════════
│${greeting}, ${msg.pushName || "User"}! ${randomHeart}
│MAXX-XMD loves you! ${randomHeart} ${randEmoji()}
│
│═════════════════════════════
`;

    await sock.sendMessage(from, {
      image: { url: "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg" },
      caption: text
    }, { quoted: msg });
  }
};
