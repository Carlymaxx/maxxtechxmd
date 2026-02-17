module.exports = {
  name: "clearchat",
  alias: ["clear"],
  description: "Clear chat messages",
  execute: async (sock, msg, args, from, settings) => {
    try {
      await sock.chatModify({ delete: true, lastMessages: [{ key: msg.key, messageTimestamp: msg.messageTimestamp }] }, from);
      await sock.sendMessage(from, { text: "🧹 Chat cleared!" });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Could not clear chat. Bot may not have permission." }, { quoted: msg });
    }
  }
};
