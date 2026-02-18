module.exports = {
  name: "repo",
  alias: ["repository", "source", "sc"],
  description: "Show bot repository link",
  execute: async (sock, msg, args, from, settings) => {
    const text = `╔══════════════════════╗
║  📦 *MAXX- REPO* 📦
╚══════════════════════╝

🔗 *Repository:* https://github.com/Carlymaxx/Maxx-tech
⭐ *Star the repo to support us!*

👑 *Owner:* ${settings.owner}
🤖 *Bot:* ${settings.botName}
📢 *Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J

> _Fork & deploy your own MAXX-XMD!_ ⚡`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  }
};
