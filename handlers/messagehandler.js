const fs = require("fs");
const path = require("path");

// Load all commands dynamically
const commands = {};
const commandFiles = fs.readdirSync(path.join(__dirname, "../commands")).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const commandPath = path.join(__dirname, "../commands", file);
  try {
    const command = require(commandPath);
    if (command && command.name) commands[command.name] = command;
  } catch (err) {
    console.warn(`⚠ Failed to load command file ${file}:`, err.message);
  }
}

module.exports = async function handleMessage(sock, msg) {
  try {
    const messageContent =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    if (!messageContent) return;

    const sender = msg.key.remoteJid;
    const text = messageContent.trim();

    console.log(`[📩] ${sender}: ${text}`);

    if (!text.startsWith(".")) return; // Only handle commands with '.' prefix

    const args = text.split(/\s+/);
    const commandName = args.shift().slice(1).toLowerCase();

    const command = commands[commandName];
    if (!command) {
      return await sock.sendMessage(sender, { text: "❌ Unknown command. Type .menu to see available commands." });
    }

    await command.execute(sock, sender, args);

  } catch (err) {
    console.error("❌ Error in handleMessage:", err);
  }
};