module.exports = {
  name: "setbotname",
  alias: ["botname"],
  description: "Show bot display name",
  execute: async (sock, msg, args, from, settings) => {
    await sock.sendMessage(from, { text: `🤖 Bot name: *MAXX-XMD*\n\n🔒 _This name is permanent and cannot be changed._` }, { quoted: msg });
  }
};
