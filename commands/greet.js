const { toggleSetting, setSetting, isOwner } = require("../utils/settings");

module.exports = {
  name: "greet",
  alias: ["welcome", "goodbye"],
  description: "Toggle welcome/goodbye messages",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can toggle greetings!" }, { quoted: msg });
    }

    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("welcomeMessage", true);
        setSetting("goodbyeMessage", true);
        return await sock.sendMessage(from, { text: "👋 Welcome & goodbye messages *enabled*!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("welcomeMessage", false);
        setSetting("goodbyeMessage", false);
        return await sock.sendMessage(from, { text: "👋 Welcome & goodbye messages *disabled*." }, { quoted: msg });
      }
    }

    const w = toggleSetting("welcomeMessage");
    const g = toggleSetting("goodbyeMessage");
    await sock.sendMessage(from, { text: `👋 Welcome: ${w ? "*ON*" : "*OFF*"} | Goodbye: ${g ? "*ON*" : "*OFF*"}` }, { quoted: msg });
  }
};
