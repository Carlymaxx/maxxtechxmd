const { getSenderJid, isGroupAdmin } = require("../utils/grouphelper");

module.exports = {
  name: "mute",
  alias: ["close"],
  description: "Mute group (only admins can send messages)",
  execute: async (sock, msg, args, from, settings) => {
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "❌ This command only works in groups!" }, { quoted: msg });
    }

    try {
      const senderJid = await getSenderJid(msg);

      if (!(await isGroupAdmin(sock, from, senderJid))) {
        return await sock.sendMessage(from, { text: "❌ Only group admins can use this command!" }, { quoted: msg });
      }

      await sock.groupSettingUpdate(from, "announcement");
      await sock.sendMessage(from, { text: "🔇 *Group muted!*\n\nOnly admins can send messages now." }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to mute group. I need admin permissions!" }, { quoted: msg });
    }
  }
};
