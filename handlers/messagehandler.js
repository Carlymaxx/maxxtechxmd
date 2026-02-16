const fs = require("fs");
const path = require("path");

const settings = {
  prefix: process.env.PREFIX || ".",
  botName: process.env.BOT_NAME || "MAXX-XMD",
  owner: process.env.OWNER_NAME || "MAXX",
  ownerNumber: process.env.OWNER_NUMBER || "",
};

const commands = {};
const aliases = {};
const commandFiles = fs.readdirSync(path.join(__dirname, "../commands")).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const commandPath = path.join(__dirname, "../commands", file);
  try {
    const command = require(commandPath);
    if (command && command.name) {
      commands[command.name] = command;
      if (command.alias && Array.isArray(command.alias)) {
        for (const a of command.alias) {
          aliases[a] = command.name;
        }
      }
    }
  } catch (err) {
    console.warn(`⚠ Failed to load command file ${file}:`, err.message);
  }
}

console.log(`📦 Loaded ${Object.keys(commands).length} commands: ${Object.keys(commands).join(", ")}`);

module.exports = async function handleMessage(sock, msg) {
  try {
    const messageContent =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption;
    if (!messageContent) return;

    const from = msg.key.remoteJid;
    const text = messageContent.trim();
    const prefix = settings.prefix;

    console.log(`[📩] ${from}: ${text}`);

    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const resolvedName = aliases[commandName] || commandName;
    const command = commands[resolvedName];
    if (!command) {
      return await sock.sendMessage(from, { text: `❌ Unknown command *${prefix}${commandName}*. Type ${prefix}menu to see available commands.` });
    }

    console.log(`[⚡] Executing command: ${prefix}${resolvedName} from ${from}`);
    await command.execute(sock, msg, args, from, settings);

  } catch (err) {
    console.error("❌ Error in handleMessage:", err);
  }
};
