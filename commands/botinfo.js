module.exports = {
    name: "botinfo",
    description: "Shows bot info",
    async execute(sock, msg, args, jid, settings) {

        const uptimeSeconds = process.uptime().toFixed(0);
        const uptimeText = `${uptimeSeconds}s`;

        const info = `
✨🤖 *MAXX-XMD BOT INFORMATION* 🤖✨
────────────────────────────────────
🔱 *Name:*  MAXX-XMD
👑 *Owner:* MAXX
⏳ *Uptime:* ${uptimeText}
🔹 *Prefix:* (.)
────────────────────────────────────
💖❤️✨ *Always here for you with love, power and speed!* ✨❤️💖
🔥💫 *MAXX-XMD running at full energy!* 💫🔥
🌟⚡ *Thank you for using the bot!* ⚡🌟
`;

        await sock.sendMessage(jid, { text: info });
    }
};
