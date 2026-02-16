module.exports = {
  name: "tagall",
  alias: ["all", "everyone"],
  description: "Tag all members in a group",
  execute: async (sock, msg, args, from, settings) => {
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, { text: "❌ This command only works in groups!" }, { quoted: msg });
    }

    try {
      const groupMeta = await sock.groupMetadata(from);
      const participants = groupMeta.participants;
      const customMessage = args.join(" ") || "📢 Attention Everyone!";

      let mentions = participants.map(p => p.id);
      let tagText = `╔══════════════════╗\n║ 📢 *TAG ALL* 📢\n╚══════════════════╝\n\n`;
      tagText += `📝 *Message:* ${customMessage}\n\n`;
      tagText += `👥 *Members (${participants.length}):*\n`;

      for (const p of participants) {
        tagText += `├ @${p.id.split("@")[0]}\n`;
      }

      tagText += `\n> _Tagged by ${msg.pushName || "Admin"}_`;

      await sock.sendMessage(from, { text: tagText, mentions }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to tag members. Make sure I'm in the group." }, { quoted: msg });
    }
  }
};
