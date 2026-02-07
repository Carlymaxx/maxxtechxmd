module.exports = {
  name: "toimg",
  description: "Convert sticker to image",
  execute: async (sock, msg, args, from) => {
    if (!msg.message.stickerMessage) {
      return await sock.sendMessage(from, { text: "Reply to a sticker with .toimg" });
    }

    // Download sticker media
    let buffer = await sock.downloadMediaMessage(msg);

    // Send as image
    await sock.sendMessage(from, { image: buffer }, { quoted: msg });
  }
};