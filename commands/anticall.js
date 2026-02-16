const { toggleSetting, getSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "anticall",
  description: "Toggle auto-reject calls",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can toggle anticall!" }, { quoted: msg });
    }

    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        const { setSetting } = require("../utils/settings");
        setSetting("anticall", true);
        return await sock.sendMessage(from, { text: "📵 Anticall *enabled* — calls will be auto-rejected!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        const { setSetting } = require("../utils/settings");
        setSetting("anticall", false);
        return await sock.sendMessage(from, { text: "📞 Anticall *disabled* — calls are allowed." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("anticall");
    const icon = newVal ? "📵" : "📞";
    await sock.sendMessage(from, { text: `${icon} Anticall ${newVal ? "*enabled* — calls auto-rejected!" : "*disabled* — calls allowed."}` }, { quoted: msg });
  }
};
