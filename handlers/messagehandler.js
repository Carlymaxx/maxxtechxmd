const fs = require("fs");
const path = require("path");
const https = require("https");
const { loadSettings, isOwner } = require("../utils/settings");

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

function chatbotReply(question) {
  return new Promise((resolve) => {
    const url = `https://api.simsimi.net/v2/?text=${encodeURIComponent(question)}&lc=en`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.success || "I don't understand that.");
        } catch {
          resolve("Hmm, I'm not sure what to say! 🤔");
        }
      });
    }).on('error', () => {
      resolve("Sorry, I can't respond right now.");
    });
  });
}

module.exports = async function handleMessage(sock, msg) {
  try {
    const botSettings = loadSettings();

    const messageContent =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption;
    if (!messageContent) return;

    const from = msg.key.remoteJid;
    const text = messageContent.trim();
    const prefix = botSettings.prefix || ".";
    const senderJid = msg.key.participant || msg.key.remoteJid;

    const handlerSettings = {
      prefix: botSettings.prefix || ".",
      botName: botSettings.botName || "MAXX-XMD",
      owner: botSettings.ownerName || botSettings.author || "MAXX",
      ownerNumber: botSettings.ownerNumber || "",
    };

    console.log(`[📩] ${from}: ${text}`);

    if (!text.startsWith(prefix)) {
      if (botSettings.chatbot && !from.endsWith("@g.us")) {
        try {
          const reply = await chatbotReply(text);
          await sock.sendMessage(from, { text: reply }, { quoted: msg });
        } catch {}
      }
      return;
    }

    if (botSettings.mode === "private" && !isOwner(senderJid, botSettings)) {
      return;
    }

    const args = text.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const resolvedName = aliases[commandName] || commandName;
    const command = commands[resolvedName];
    if (!command) {
      return await sock.sendMessage(from, { text: `❌ Unknown command *${prefix}${commandName}*. Type ${prefix}menu to see available commands.` });
    }

    console.log(`[⚡] Executing command: ${prefix}${resolvedName} from ${from}`);
    await command.execute(sock, msg, args, from, handlerSettings);

  } catch (err) {
    console.error("❌ Error in handleMessage:", err);
  }
};
