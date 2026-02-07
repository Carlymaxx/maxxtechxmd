module.exports = {
  name: "sticker",
  alias: ["s", "stik"],
  description: "Convert Image/Video to Sticker",
  execute: async (sock, msg, args, from) => {
    const isImage = msg.message.imageMessage;
    const isVideo = msg.message.videoMessage;

    if (!isImage && !isVideo) {
      return await sock.sendMessage(from, { text: "Send an image/video with caption .sticker" });
    }

    // Download media
    let buffer = await sock.downloadMediaMessage(msg);
    // Send as sticker
    await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
  }
};