const { getSetting, setSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "mode",
  description: "Switch bot mode (public/private)",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change bot mode!" }, { quoted: msg });
    }

    const current = getSetting("mode");

    if (args[0]) {
      const newMode = args[0].toLowerCase();
      if (!["public", "private"].includes(newMode)) {
        return await sock.sendMessage(from, { text: "❌ Mode must be *public* or *private*" }, { quoted: msg });
      }
      setSetting("mode", newMode);
      const icon = newMode === "public" ? "🌐" : "🔒";
      return await sock.sendMessage(from, { text: `${icon} Bot mode set to *${newMode}*` }, { quoted: msg });
    }

    const newMode = current === "public" ? "private" : "public";
    setSetting("mode", newMode);
    const icon = newMode === "public" ? "🌐" : "🔒";
    await sock.sendMessage(from, { text: `${icon} Bot mode switched to *${newMode}*` }, { quoted: msg });
  }
};
