module.exports = {
  name: "listonline",
  alias: ["members", "groupmembers"],
  description: "List all group members",
  execute: async (sock, msg, args, from, settings) => {
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "❌ This command only works in groups!" }, { quoted: msg });
    }

    try {
      const groupMeta = await sock.groupMetadata(from);
      const participants = groupMeta.participants;

      let text = `╔══════════════════╗\n` +
                 `║  🟢 *GROUP MEMBERS*\n` +
                 `╚══════════════════╝\n\n` +
                 `👥 *${groupMeta.subject}*\n` +
                 `📊 Total: ${participants.length} members\n\n`;

      for (const p of participants) {
        const role = p.admin === 'admin' ? '👮' : p.admin === 'superadmin' ? '👑' : '👤';
        text += `${role} @${p.id.split('@')[0]}\n`;
      }

      text += `\n> _${settings.botName}_ ⚡`;

      await sock.sendMessage(from, {
        text,
        mentions: participants.map(p => p.id)
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to get group members." }, { quoted: msg });
    }
  }
};
