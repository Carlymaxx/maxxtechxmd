const { isOwner } = require("../utils/settings");
const os = require("os");

module.exports = {
  name: "deploy",
  alias: ["server"],
  description: "Show deployment/server info",
  execute: async (sock, msg, args, from, settings) => {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(senderJid)) {
      return await sock.sendMessage(from, { text: "❌ Only the owner can view deploy info!" }, { quoted: msg });
    }

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;

    const text = `🚀 *DEPLOYMENT INFO*\n\n` +
      `📡 *Platform:* Replit\n` +
      `🖥️ *OS:* ${os.type()} ${os.release()}\n` +
      `🏗️ *Arch:* ${os.arch()}\n` +
      `⏱️ *Uptime:* ${hours}h ${minutes}m ${seconds}s\n` +
      `💾 *RAM:* ${usedMem}MB / ${totalMem}MB\n` +
      `📊 *CPU Cores:* ${os.cpus().length}\n` +
      `🌐 *Hostname:* ${os.hostname()}\n` +
      `📂 *Node:* ${process.version}\n` +
      `🆔 *PID:* ${process.pid}\n\n` +
      `> _MAXX-XMD Bot Server_ ⚡`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  }
};
