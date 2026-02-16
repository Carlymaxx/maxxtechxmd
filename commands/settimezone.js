const { setSetting, getSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "settimezone",
  alias: ["timezone", "tz"],
  description: "Set bot timezone",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change the timezone!" }, { quoted: msg });
    }

    if (!args[0]) {
      return await sock.sendMessage(from, { text: `🕒 Current timezone: *${getSetting("timezone")}*\n\nUsage: ${settings.prefix}settimezone <timezone>\nExample: ${settings.prefix}settimezone Africa/Nairobi` }, { quoted: msg });
    }

    const tz = args[0];
    setSetting("timezone", tz);
    await sock.sendMessage(from, { text: `✅ Timezone set to: *${tz}*` }, { quoted: msg });
  }
};
