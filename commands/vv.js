module.exports = {
  name: "vv",
  alias: ["viewonce", "vo"],
  description: "View a view-once message",
  execute: async (sock, msg, args, from, settings) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return await sock.sendMessage(from, { text: "❌ Reply to a view-once message with *.vv* to view it!" }, { quoted: msg });
    }

    const viewOnce = quoted?.viewOnceMessage?.message || quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessageV2Extension?.message;
    if (!viewOnce) {
      return await sock.sendMessage(from, { text: "❌ That's not a view-once message!" }, { quoted: msg });
    }

    if (viewOnce.imageMessage) {
      const caption = viewOnce.imageMessage.caption || "";
      await sock.sendMessage(from, {
        image: { url: await sock.downloadMediaMessage(viewOnce.imageMessage) },
        caption: `👁️ *View Once Image*\n\n${caption}`
      }, { quoted: msg });
    } else if (viewOnce.videoMessage) {
      const caption = viewOnce.videoMessage.caption || "";
      await sock.sendMessage(from, {
        video: { url: await sock.downloadMediaMessage(viewOnce.videoMessage) },
        caption: `👁️ *View Once Video*\n\n${caption}`
      }, { quoted: msg });
    } else if (viewOnce.audioMessage) {
      await sock.sendMessage(from, {
        audio: { url: await sock.downloadMediaMessage(viewOnce.audioMessage) },
        mimetype: 'audio/mp4'
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: "❌ Unsupported view-once media type." }, { quoted: msg });
    }
  }
};
