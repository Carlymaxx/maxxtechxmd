const moment = require("moment-timezone");

module.exports = {
  name: "menu",
  alias: ["help"], // optional aliases
  description: "Show bot menu and info",
  execute: async (sock, msg, args, from, info) => {
    const nairobiTime = moment().tz("Africa/Nairobi").format("HH:mm:ss");
    const nairobiDate = moment().tz("Africa/Nairobi").format("YYYY-MM-DD");

    const text = `
┌──⭓ ${info.botName} MENU
│
│ 👤 Owner: ${info.ownerName}
│ 🆔 Prefix: ${info.prefix}
│ 🕒 Time (Nairobi): ${nairobiTime}
│ 📅 Date: ${nairobiDate}
│
│ 📌 Available Commands:
│ • menu
│ • ping
│ • welcome
│ • goodbye
│ • antidelete
└──────────────⭓
    `;

    // Send image with caption
    await sock.sendMessage(from, {
      image: { url: "https://ibb.co/jZhpV4Vb.jpg" },
      caption: text
    }, { quoted: msg });
  }
};