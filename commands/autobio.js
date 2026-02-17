const { toggleSetting, setSetting, getSetting } = require("../utils/settings");

module.exports = {
  name: "autobio",
  description: "Toggle auto-updating bio with uptime",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("autobio", true);
        return await sock.sendMessage(from, { text: "📝 Auto-bio *enabled* — bio updates with uptime!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("autobio", false);
        return await sock.sendMessage(from, { text: "📝 Auto-bio *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("autobio");
    await sock.sendMessage(from, { text: `📝 Auto-bio ${newVal ? "*enabled*!" : "*disabled*."}` }, { quoted: msg });
  }
};
