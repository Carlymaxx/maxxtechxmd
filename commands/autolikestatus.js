const { toggleSetting, setSetting, getSetting } = require("../utils/settings");

module.exports = {
  name: "autolikestatus",
  alias: ["autoreact", "likestatus"],
  description: "Toggle auto-react to statuses",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("autolikestatus", true);
        return await sock.sendMessage(from, { text: "❤️ Auto-like status *enabled*!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("autolikestatus", false);
        return await sock.sendMessage(from, { text: "❤️ Auto-like status *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("autolikestatus");
    const emoji = getSetting("autolikestatus_emoji") || "🔥";
    await sock.sendMessage(from, { text: `❤️ Auto-like status ${newVal ? `*enabled*! Reacting with ${emoji}` : "*disabled*."}` }, { quoted: msg });
  }
};
