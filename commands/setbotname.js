const { setSetting, getSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "setbotname",
  alias: ["botname"],
  description: "Set bot display name",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change the bot name!" }, { quoted: msg });
    }

    if (!args[0]) {
      return await sock.sendMessage(from, { text: `🤖 Current bot name: *${getSetting("botName")}*\n\nUsage: ${settings.prefix}setbotname <name>` }, { quoted: msg });
    }

    const name = args.join(" ");
    setSetting("botName", name);
    await sock.sendMessage(from, { text: `✅ Bot name set to: *${name}*` }, { quoted: msg });
  }
};
