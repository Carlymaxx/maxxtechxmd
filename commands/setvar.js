const { getSetting, setSetting, getAllSettings, isOwner } = require("../utils/settings");

module.exports = {
  name: "setvar",
  alias: ["set", "config"],
  description: "Set a bot variable",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change settings!" }, { quoted: msg });
    }

    if (args.length < 2) {
      const all = getAllSettings();
      const settingsList = Object.entries(all)
        .filter(([k]) => k !== 'blockedNumbers')
        .map(([k, v]) => `• *${k}:* ${v}`)
        .join("\n");
      return await sock.sendMessage(from, {
        text: `⚙️ *Bot Settings*\n\n${settingsList}\n\n*Usage:* ${settings.prefix}setvar <key> <value>`
      }, { quoted: msg });
    }

    const key = args[0];
    const value = args.slice(1).join(" ");

    if (key === "botName") {
      return await sock.sendMessage(from, { text: `🔒 *MAXX-XMD* is a permanent name and cannot be changed.` }, { quoted: msg });
    }

    let parsedValue = value;
    if (value === "true") parsedValue = true;
    else if (value === "false") parsedValue = false;
    else if (!isNaN(value) && value !== "") parsedValue = Number(value);

    setSetting(key, parsedValue);
    await sock.sendMessage(from, { text: `✅ *${key}* set to: *${parsedValue}*` }, { quoted: msg });
  }
};
