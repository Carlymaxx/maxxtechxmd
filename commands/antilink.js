// commands/antilink.js
module.exports = {
    name: "antilink",
    description: "Enable or disable anti-link",
    
    execute: async (sock, msg, args, from, settings) => {

        if (!args[0]) return sock.sendMessage(from, { text: "Use: .antilink on / off" });

        if (args[0].toLowerCase() === "on") {
            global.antilink = true;
            await sock.sendMessage(from, { text: "✅ Anti-Link Enabled" });
        } else if (args[0].toLowerCase() === "off") {
            global.antilink = false;
            await sock.sendMessage(from, { text: "🛑 Anti-Link Disabled" });
        }
    }
};