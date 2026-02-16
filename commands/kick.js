const { getSenderJid, isGroupAdmin, isBotAdmin } = require("../utils/grouphelper");

module.exports = {
  name: "kick",
  alias: ["remove", "ban"],
  description: "Remove a member from group",
  execute: async (sock, msg, args, from, settings) => {
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "❌ This command only works in groups!" }, { quoted: msg });
    }

    try {
      const senderJid = await getSenderJid(msg);

      if (!(await isGroupAdmin(sock, from, senderJid))) {
        return await sock.sendMessage(from, { text: "❌ Only group admins can use this command!" }, { quoted: msg });
      }

      if (!(await isBotAdmin(sock, from))) {
        return await sock.sendMessage(from, { text: "❌ I need to be an admin to remove members!" }, { quoted: msg });
      }

      let targetJid;
      if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetJid = msg.message.extendedTextMessage.contextInfo.participant;
      } else if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, "");
        targetJid = num + "@s.whatsapp.net";
      }

      if (!targetJid) {
        return await sock.sendMessage(from, { text: "❌ Reply to someone's message or provide number!\n\nExample: .kick 254700000000" }, { quoted: msg });
      }

      await sock.groupParticipantsUpdate(from, [targetJid], "remove");
      await sock.sendMessage(from, { text: `✅ @${targetJid.split("@")[0]} has been removed!`, mentions: [targetJid] }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to remove member. Check permissions." }, { quoted: msg });
    }
  }
};
