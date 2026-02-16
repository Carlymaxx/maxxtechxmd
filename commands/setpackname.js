const { setSetting, getSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "setpackname",
  alias: ["packname"],
  description: "Set sticker pack name",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change the pack name!" }, { quoted: msg });
    }

    if (!args[0]) {
      return await sock.sendMessage(from, { text: `📦 Current pack name: *${getSetting("packname")}*\n\nUsage: ${settings.prefix}setpackname <name>` }, { quoted: msg });
    }

    const name = args.join(" ");
    setSetting("packname", name);
    await sock.sendMessage(from, { text: `✅ Pack name set to: *${name}*` }, { quoted: msg });
  }
};
