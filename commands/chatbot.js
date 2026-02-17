const { toggleSetting, setSetting } = require("../utils/settings");

module.exports = {
  name: "chatbot",
  description: "Toggle AI chatbot auto-reply",
  execute: async (sock, msg, args, from, settings) => {
    if (args[0]) {
      const val = args[0].toLowerCase();
      if (val === "on" || val === "true") {
        setSetting("chatbot", true);
        return await sock.sendMessage(from, { text: "🤖 Chatbot *enabled* — auto-replies active!" }, { quoted: msg });
      } else if (val === "off" || val === "false") {
        setSetting("chatbot", false);
        return await sock.sendMessage(from, { text: "🤖 Chatbot *disabled*." }, { quoted: msg });
      }
    }

    const newVal = toggleSetting("chatbot");
    await sock.sendMessage(from, { text: `🤖 Chatbot ${newVal ? "*enabled* — auto-replies active!" : "*disabled*."}` }, { quoted: msg });
  }
};
