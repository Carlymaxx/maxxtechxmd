const { toggleSetting, setSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "autoread",
  description: "Toggle auto-read messages",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can toggle autoread!" }, { quoted: msg });
    }

    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("autoread", true);
        return await sock.sendMessage(from, { text: "✅ Auto-read *enabled* — messages marked as read automatically!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("autoread", false);
        return await sock.sendMessage(from, { text: "❌ Auto-read *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("autoread");
    await sock.sendMessage(from, { text: `📖 Auto-read ${newVal ? "*enabled*!" : "*disabled*."}` }, { quoted: msg });
  }
};
