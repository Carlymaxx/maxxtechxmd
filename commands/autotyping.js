const { toggleSetting, setSetting } = require("../utils/settings");

module.exports = {
  name: "autotyping",
  alias: ["typing"],
  description: "Toggle auto-typing indicator before replies",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("autotyping", true);
        return await sock.sendMessage(from, { text: "⌨️ Auto-typing *enabled* — bot shows typing before replies!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("autotyping", false);
        return await sock.sendMessage(from, { text: "⌨️ Auto-typing *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("autotyping");
    await sock.sendMessage(from, { text: `⌨️ Auto-typing ${newVal ? "*enabled*!" : "*disabled*."}` }, { quoted: msg });
  }
};
