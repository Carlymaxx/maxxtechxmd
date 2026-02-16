const { setSetting, getSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "setauthor",
  alias: ["author"],
  description: "Set sticker author name",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change the author!" }, { quoted: msg });
    }

    if (!args[0]) {
      return await sock.sendMessage(from, { text: `✍️ Current author: *${getSetting("author")}*\n\nUsage: ${settings.prefix}setauthor <name>` }, { quoted: msg });
    }

    const name = args.join(" ");
    setSetting("author", name);
    await sock.sendMessage(from, { text: `✅ Author set to: *${name}*` }, { quoted: msg });
  }
};
