module.exports = {
  name: "ping",
  description: "Check bot status",

  execute: async (msg, sock, args, from) => {
    await sock.sendMessage(from, { text: "✅ MAXX~XMD is online!" });
  }
};