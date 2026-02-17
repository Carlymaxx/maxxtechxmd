const { toggleSetting, setSetting } = require("../utils/settings");

module.exports = {
  name: "alwaysonline",
  alias: ["online", "presence"],
  description: "Toggle always online presence",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("alwaysonline", true);
        try { await sock.sendPresenceUpdate('available'); } catch {}
        return await sock.sendMessage(from, { text: "🟢 Always online *enabled* — bot will appear online 24/7!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("alwaysonline", false);
        try { await sock.sendPresenceUpdate('unavailable'); } catch {}
        return await sock.sendMessage(from, { text: "⚫ Always online *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("alwaysonline");
    try {
      await sock.sendPresenceUpdate(newVal ? 'available' : 'unavailable');
    } catch {}
    await sock.sendMessage(from, { text: `🟢 Always online ${newVal ? "*enabled* — bot appears online 24/7!" : "*disabled*."}` }, { quoted: msg });
  }
};
