const { setSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "setprefix",
  alias: ["prefix"],
  description: "Change bot prefix",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change the prefix!" }, { quoted: msg });
    }

    if (!args[0]) {
      return await sock.sendMessage(from, { text: `🔧 Current prefix: *${settings.prefix}*\n\nUsage: ${settings.prefix}setprefix <new prefix>` }, { quoted: msg });
    }

    const newPrefix = args[0];
    setSetting("prefix", newPrefix);
    await sock.sendMessage(from, { text: `✅ Prefix changed to: *${newPrefix}*` }, { quoted: msg });
  }
};
