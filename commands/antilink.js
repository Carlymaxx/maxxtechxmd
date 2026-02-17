const { toggleSetting, setSetting } = require("../utils/settings");

module.exports = {
  name: "antilink",
  description: "Toggle anti-link in groups",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("antilink", true);
        return await sock.sendMessage(from, { text: "🔗 Anti-link *enabled* — links will be deleted!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("antilink", false);
        return await sock.sendMessage(from, { text: "🔗 Anti-link *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("antilink");
    await sock.sendMessage(from, { text: `🔗 Anti-link ${newVal ? "*enabled* — links will be deleted!" : "*disabled*."}` }, { quoted: msg });
  }
};
