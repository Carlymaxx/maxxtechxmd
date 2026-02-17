const { isOwner } = require("../utils/settings");

module.exports = {
  name: "bio",
  alias: ["setbio", "about"],
  description: "Set bot's WhatsApp bio/about",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can change the bio!" }, { quoted: msg });
    }

    if (!args.length) {
      return await sock.sendMessage(from, { text: `📝 Usage: ${settings.prefix}bio <your new bio text>` }, { quoted: msg });
    }

    const newBio = args.join(" ");
    try {
      await sock.updateProfileStatus(newBio);
      await sock.sendMessage(from, { text: `✅ Bio updated to:\n\n_${newBio}_` }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to update bio. Try again later." }, { quoted: msg });
    }
  }
};
