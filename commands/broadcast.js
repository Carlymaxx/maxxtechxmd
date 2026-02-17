const { isOwner } = require("../utils/settings");

module.exports = {
  name: "broadcast",
  alias: ["bc", "announce"],
  description: "Broadcast message to all groups",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can broadcast!" }, { quoted: msg });
    }

    if (!args.length) {
      return await sock.sendMessage(from, { text: `📢 Usage: ${settings.prefix}broadcast <message>` }, { quoted: msg });
    }

    const broadcastMsg = args.join(" ");
    const text = `╔══════════════════╗\n` +
                 `║  📢 *BROADCAST*\n` +
                 `╚══════════════════╝\n\n` +
                 `${broadcastMsg}\n\n` +
                 `> _${settings.botName}_ ⚡`;

    try {
      const groups = await sock.groupFetchAllParticipating();
      const groupIds = Object.keys(groups);

      await sock.sendMessage(from, { text: `📢 Broadcasting to *${groupIds.length}* groups...` }, { quoted: msg });

      let sent = 0;
      let failed = 0;
      for (const gid of groupIds) {
        try {
          await sock.sendMessage(gid, { text });
          sent++;
          await new Promise(r => setTimeout(r, 1000));
        } catch {
          failed++;
        }
      }

      await sock.sendMessage(from, { text: `✅ Broadcast complete!\n📤 Sent: ${sent}\n❌ Failed: ${failed}` }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to broadcast. " + err.message }, { quoted: msg });
    }
  }
};
