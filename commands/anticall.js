const { toggleSetting, setSetting } = require("../utils/settings");

module.exports = {
  name: "anticall",
  description: "Toggle auto-reject calls",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("anticall", true);
        return await sock.sendMessage(from, { text: "📵 Anticall *enabled* — calls will be auto-rejected!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("anticall", false);
        return await sock.sendMessage(from, { text: "📞 Anticall *disabled* — calls are allowed." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("anticall");
    const icon = newVal ? "📵" : "📞";
    await sock.sendMessage(from, { text: `${icon} Anticall ${newVal ? "*enabled* — calls auto-rejected!" : "*disabled* — calls allowed."}` }, { quoted: msg });
  }
};
