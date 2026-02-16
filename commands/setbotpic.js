const { setSetting, getSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "setbotpic",
  alias: ["botpic"],
  description: "Set bot profile picture URL",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change the bot picture!" }, { quoted: msg });
    }

    if (!args[0]) {
      const current = getSetting("botpic");
      return await sock.sendMessage(from, { text: `🖼️ Current bot pic: ${current || "Not set"}\n\nUsage: ${settings.prefix}setbotpic <url>` }, { quoted: msg });
    }

    const url = args[0];
    setSetting("botpic", url);
    await sock.sendMessage(from, { text: `✅ Bot picture updated!` }, { quoted: msg });
  }
};
