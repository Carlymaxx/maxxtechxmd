const os = require("os");

module.exports = {
  name: "runtime",
  alias: ["uptime"],
  description: "Show bot uptime and system info",
  execute: async (sock, msg, args, from, settings) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
    const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
    const usedMem = (totalMem - freeMem).toFixed(0);

    const text = `⏱️ *MAXX-XMD RUNTIME*

⏳ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s
💻 *Platform:* ${os.platform()} ${os.arch()}
🧠 *RAM:* ${usedMem}MB / ${totalMem}MB
⚙️ *Node.js:* ${process.version}
🔧 *CPU:* ${os.cpus()[0]?.model || 'Unknown'}

> _${settings.botName} running smoothly_ ✨`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  }
};
