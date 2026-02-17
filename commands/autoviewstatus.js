const { toggleSetting, setSetting } = require("../utils/settings");

module.exports = {
  name: "autoviewstatus",
  alias: ["autostatus", "viewstatus"],
  description: "Toggle auto-view WhatsApp statuses",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("autoviewstatus", true);
        return await sock.sendMessage(from, { text: "👁️ Auto-view status *enabled*!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("autoviewstatus", false);
        return await sock.sendMessage(from, { text: "👁️ Auto-view status *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("autoviewstatus");
    await sock.sendMessage(from, { text: `👁️ Auto-view status ${newVal ? "*enabled*!" : "*disabled*."}` }, { quoted: msg });
  }
};
