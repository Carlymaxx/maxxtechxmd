const { isOwner } = require("../utils/settings");

module.exports = {
  name: "block",
  alias: ["unblock"],
  description: "Block/unblock a user",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can block/unblock users!" }, { quoted: msg });
    }

    let targetJid;
    if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      targetJid = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args[0]) {
      const num = args[0].replace(/[^0-9]/g, "");
      targetJid = num + "@s.whatsapp.net";
    }

    if (!targetJid) {
      return await sock.sendMessage(from, { text: `❌ Reply to a user or provide number!\n\nUsage: ${settings.prefix}block 254700000000` }, { quoted: msg });
    }

    const commandUsed = msg.message?.conversation?.trim().split(/\s+/)[0] ||
      msg.message?.extendedTextMessage?.text?.trim().split(/\s+/)[0] || "";

    const isUnblock = commandUsed.toLowerCase().includes("unblock");

    try {
      if (isUnblock) {
        await sock.updateBlockStatus(targetJid, "unblock");
        await sock.sendMessage(from, { text: `✅ @${targetJid.split("@")[0]} has been unblocked!`, mentions: [targetJid] }, { quoted: msg });
      } else {
        await sock.updateBlockStatus(targetJid, "block");
        await sock.sendMessage(from, { text: `🚫 @${targetJid.split("@")[0]} has been blocked!`, mentions: [targetJid] }, { quoted: msg });
      }
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Failed to ${isUnblock ? "unblock" : "block"} user.` }, { quoted: msg });
    }
  }
};
