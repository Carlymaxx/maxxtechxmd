module.exports = {
    name: "ping",
    description: "Check if bot is online",
    async execute(sock, msg, args, jid, settings) {

        const start = Date.now();
        await sock.sendMessage(jid, { text: "⏳ Checking ping... 🔍" });
        const ping = Date.now() - start;

        const user = msg.pushName || "User";

        const message = `
      ╔══════════   ═══════════╗
      🌈✨ *MAXX-XMD  STATUS* ✨🌈
      ╚══════════   ═══════════╝

👋 Hello, *${user}*!  
🚀 *${settings.botName}* is *ONLINE!*  
🟢 *Status:* ACTIVE & RUNNING SMOOTHLY  

👑 *Owner:* ${settings.owner}

⚡ *Ping:* *${ping}ms*  
📡 Network: Stable 🔥

💖 Thanks for using *MAXX-XMD*!  
Enjoy the power ✨💫🔥

━━━━━━━━━━━━━━━━━━━
🌟 Made with ❤️ by Maxx
━━━━━━━━━━━━━━━━━━━🔗
`;

        await sock.sendMessage(jid, { text: message });
    }
};
