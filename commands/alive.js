module.exports = {
  name: "alive",
  alias: ["bot", "status"],
  description: "Check if bot is alive",
  execute: async (sock, msg, args, from, settings) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const text = `╔══════════════════════╗
║  ✨ *MAXX-XMD IS ALIVE!* ✨
╚══════════════════════╝

🤖 *Bot:* ${settings.botName}
👑 *Owner:* ${settings.owner}
⏰ *Uptime:* ${hours}h ${minutes}m ${seconds}s
🟢 *Status:* Active & Running

📢 *Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J

> _Powered by Maxx Tech_ ⚡`;

    await sock.sendMessage(from, {
      image: { url: "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg" },
      caption: text
    }, { quoted: msg });
  }
};
