const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "reshare",
  alias: ["forward", "fwd"],
  description: "Forward/reshare a quoted message",
  execute: async (sock, msg, args, from, settings) => {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = contextInfo?.quotedMessage;

    if (!quoted) {
      return await sock.sendMessage(from, { text: `❌ Reply to a message to reshare it!\n\nUsage: Reply to any message with ${settings.prefix}reshare` }, { quoted: msg });
    }

    const quotedKey = {
      remoteJid: from,
      id: contextInfo.stanzaId,
      fromMe: false,
      participant: contextInfo.participant || undefined
    };

    try {
      if (quoted.conversation || quoted.extendedTextMessage) {
        const text = quoted.conversation || quoted.extendedTextMessage?.text;
        await sock.sendMessage(from, { text: `♻️ *Reshared:*\n\n${text}` });
      } else if (quoted.imageMessage) {
        const quotedMsg = { key: quotedKey, message: { imageMessage: quoted.imageMessage } };
        const buffer = await downloadMediaMessage(quotedMsg, "buffer", {});
        await sock.sendMessage(from, {
          image: buffer,
          caption: quoted.imageMessage.caption ? `♻️ ${quoted.imageMessage.caption}` : "♻️ Reshared image"
        });
      } else if (quoted.videoMessage) {
        const quotedMsg = { key: quotedKey, message: { videoMessage: quoted.videoMessage } };
        const buffer = await downloadMediaMessage(quotedMsg, "buffer", {});
        await sock.sendMessage(from, {
          video: buffer,
          caption: quoted.videoMessage.caption ? `♻️ ${quoted.videoMessage.caption}` : "♻️ Reshared video"
        });
      } else if (quoted.audioMessage) {
        const quotedMsg = { key: quotedKey, message: { audioMessage: quoted.audioMessage } };
        const buffer = await downloadMediaMessage(quotedMsg, "buffer", {});
        await sock.sendMessage(from, { audio: buffer, mimetype: "audio/mp4" });
      } else if (quoted.stickerMessage) {
        const quotedMsg = { key: quotedKey, message: { stickerMessage: quoted.stickerMessage } };
        const buffer = await downloadMediaMessage(quotedMsg, "buffer", {});
        await sock.sendMessage(from, { sticker: buffer });
      } else if (quoted.documentMessage) {
        const quotedMsg = { key: quotedKey, message: { documentMessage: quoted.documentMessage } };
        const buffer = await downloadMediaMessage(quotedMsg, "buffer", {});
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: quoted.documentMessage.mimetype,
          fileName: quoted.documentMessage.fileName || "reshared_file"
        });
      } else {
        await sock.sendMessage(from, { text: "❌ Unsupported message type for resharing." }, { quoted: msg });
      }
    } catch (err) {
      console.error("Reshare error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to reshare message." }, { quoted: msg });
    }
  }
};
