module.exports = {
  name: "groupinfo",
  alias: ["ginfo", "gc"],
  description: "Show group information",
  execute: async (sock, msg, args, from, settings) => {
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "❌ This command only works in groups!" }, { quoted: msg });
    }

    try {
      const meta = await sock.groupMetadata(from);
      const admins = meta.participants.filter(p => p.admin).length;
      const members = meta.participants.length;
      const created = new Date(meta.creation * 1000).toLocaleDateString();

      const text = `╔══════════════════════╗
║  📋 *GROUP INFO* 📋
╚══════════════════════╝

📛 *Name:* ${meta.subject}
📝 *Description:* ${meta.desc || "No description"}
👥 *Members:* ${members}
👑 *Admins:* ${admins}
📅 *Created:* ${created}
🔒 *Locked:* ${meta.restrict ? "Yes" : "No"}
🔇 *Muted:* ${meta.announce ? "Yes" : "No"}

> _${settings.botName}_ ✨`;

      await sock.sendMessage(from, { text }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to get group info." }, { quoted: msg });
    }
  }
};
