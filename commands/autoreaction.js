const { toggleSetting, setSetting } = require("../utils/settings");

module.exports = {
  name: "autoreaction",
  alias: ["autoreact2"],
  description: "Toggle auto-reaction to incoming messages",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("autoreaction", true);
        return await sock.sendMessage(from, { text: "😍 Auto-reaction *enabled* — bot reacts to all messages!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("autoreaction", false);
        return await sock.sendMessage(from, { text: "😐 Auto-reaction *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("autoreaction");
    await sock.sendMessage(from, { text: `😍 Auto-reaction ${newVal ? "*enabled*!" : "*disabled*."}` }, { quoted: msg });
  }
};
