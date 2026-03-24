import { registerCommand } from "./types";
import { loadSettings, saveSettings, WORKSPACE_ROOT } from "../botState";
import fs from "fs";
import path from "path";

const SUDO_FILE = path.join(WORKSPACE_ROOT, "sudo.json");
function loadSudo(): string[] {
  try { if (fs.existsSync(SUDO_FILE)) return JSON.parse(fs.readFileSync(SUDO_FILE, "utf8")); } catch {}
  return [];
}
function saveSudo(list: string[]) { fs.writeFileSync(SUDO_FILE, JSON.stringify(list, null, 2)); }

const BADWORD_FILE = path.join(WORKSPACE_ROOT, "badwords.json");
function loadBadwords(): string[] {
  try { if (fs.existsSync(BADWORD_FILE)) return JSON.parse(fs.readFileSync(BADWORD_FILE, "utf8")); } catch {}
  return [];
}
function saveBadwords(list: string[]) { fs.writeFileSync(BADWORD_FILE, JSON.stringify(list, null, 2)); }

function toggle(settings: any, key: string, arg: string | undefined, name: string, reply: Function) {
  if (!arg || !["on", "off"].includes(arg)) return reply(`❓ Usage: .${key} on/off\n\nCurrent: *${settings[key] ? "on" : "off"}*`);
  settings[key] = arg === "on";
  saveSettings(settings);
  reply(`✅ *${name}* has been turned *${arg}*!`);
}

registerCommand({
  name: "setprefix",
  aliases: ["prefix"],
  category: "Settings",
  description: "Change bot command prefix",
  handler: async ({ args, settings, reply }) => {
    const p = args[0];
    if (!p) return reply(`❓ Current prefix: *${settings.prefix}*\n\nUsage: .setprefix !`);
    settings.prefix = p;
    saveSettings(settings);
    await reply(`✅ Prefix changed to *${p}*`);
  },
});

registerCommand({
  name: "setbotname",
  aliases: ["botname"],
  category: "Settings",
  description: "Change the bot name",
  handler: async ({ args, settings, reply }) => {
    const name = args.join(" ");
    if (!name) return reply(`❓ Current name: *${settings.botName}*\n\nUsage: .setbotname MAXX XMD`);
    settings.botName = name;
    saveSettings(settings);
    await reply(`✅ Bot name changed to *${name}*`);
  },
});

registerCommand({
  name: "setownername",
  aliases: ["ownername"],
  category: "Settings",
  description: "Set owner name",
  handler: async ({ args, settings, reply }) => {
    const name = args.join(" ");
    if (!name) return reply(`❓ Current: *${settings.ownerName}*\n\nUsage: .setownername John`);
    settings.ownerName = name;
    saveSettings(settings);
    await reply(`✅ Owner name set to *${name}*`);
  },
});

registerCommand({
  name: "setownernumber",
  aliases: ["ownernumber"],
  category: "Settings",
  description: "Set owner number",
  handler: async ({ args, settings, reply }) => {
    const num = args[0]?.replace(/[^0-9]/g, "");
    if (!num) return reply(`❓ Current: *${settings.ownerNumber || "Not set"}*\n\nUsage: .setownernumber 254712345678`);
    settings.ownerNumber = num;
    saveSettings(settings);
    await reply(`✅ Owner number set to *${num}*`);
  },
});

registerCommand({
  name: "mode",
  aliases: ["modestatus"],
  category: "Settings",
  description: "Set bot mode (public/private/inbox)",
  handler: async ({ args, settings, reply }) => {
    const m = args[0]?.toLowerCase();
    if (!m || !["public", "private", "inbox", "anti"].includes(m)) {
      return reply(`❓ Current mode: *${settings.mode}*\n\nModes:\n• *public* — anyone can use\n• *private* — only owner/sudo\n• *inbox* — DMs only\n\nUsage: .mode public`);
    }
    settings.mode = m;
    saveSettings(settings);
    await reply(`✅ Bot mode changed to *${m}*`);
  },
});

registerCommand({
  name: "anticall",
  aliases: [],
  category: "Settings",
  description: "Toggle anti-call (reject incoming calls)",
  handler: async ({ args, settings, reply }) => toggle(settings, "anticall", args[0]?.toLowerCase(), "Anti-call", reply),
});

registerCommand({
  name: "autoread",
  aliases: [],
  category: "Settings",
  description: "Toggle auto-read messages",
  handler: async ({ args, settings, reply }) => toggle(settings, "autoread", args[0]?.toLowerCase(), "Auto-read", reply),
});

registerCommand({
  name: "autoreact",
  aliases: ["autoreaction"],
  category: "Settings",
  description: "Toggle auto-react to messages",
  handler: async ({ args, settings, reply }) => {
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return reply(`❓ Usage: .autoreact on/off\n\nCurrent: *${settings.autoreaction ? "on" : "off"}*`);
    }
    settings.autoreaction = args[0].toLowerCase() === "on";
    saveSettings(settings);
    await reply(`✅ Auto-react *${args[0].toLowerCase()}*!`);
  },
});

registerCommand({
  name: "autotype",
  aliases: ["autotyping"],
  category: "Settings",
  description: "Toggle auto-typing indicator",
  handler: async ({ args, settings, reply }) => toggle(settings, "autotyping", args[0]?.toLowerCase(), "Auto-typing", reply),
});

registerCommand({
  name: "autobio",
  aliases: [],
  category: "Settings",
  description: "Toggle automatic bio update",
  handler: async ({ args, settings, reply }) => toggle(settings, "autobio", args[0]?.toLowerCase(), "Auto-bio", reply),
});

registerCommand({
  name: "alwaysonline",
  aliases: ["online"],
  category: "Settings",
  description: "Toggle always online presence",
  handler: async ({ args, settings, reply }) => toggle(settings, "alwaysonline", args[0]?.toLowerCase(), "Always online", reply),
});

registerCommand({
  name: "autoviewstatus",
  aliases: [],
  category: "Settings",
  description: "Toggle auto-view status updates",
  handler: async ({ args, settings, reply }) => toggle(settings, "autoviewstatus", args[0]?.toLowerCase(), "Auto-view status", reply),
});

registerCommand({
  name: "chatbot",
  aliases: [],
  category: "Settings",
  description: "Toggle AI chatbot mode",
  handler: async ({ args, settings, reply }) => toggle(settings, "chatbot", args[0]?.toLowerCase(), "Chatbot", reply),
});

registerCommand({
  name: "antibug",
  aliases: [],
  category: "Settings",
  description: "Toggle anti-bug (crash-message protection)",
  handler: async ({ args, settings, reply }) => {
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return reply(`❓ Usage: .antibug on/off\n\nCurrent: *${settings.antibug ? "on" : "off"}*`);
    }
    settings.antibug = args[0].toLowerCase() === "on";
    saveSettings(settings);
    await reply(`✅ Anti-bug *${args[0].toLowerCase()}*!`);
  },
});

registerCommand({
  name: "antiviewonce",
  aliases: [],
  category: "Settings",
  description: "Toggle anti-view-once (re-send view-once media)",
  handler: async ({ args, settings, reply }) => {
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return reply(`❓ Usage: .antiviewonce on/off\n\nCurrent: *${settings.antiviewonce ? "on" : "off"}*`);
    }
    settings.antiviewonce = args[0].toLowerCase() === "on";
    saveSettings(settings);
    await reply(`✅ Anti-view-once *${args[0].toLowerCase()}*!`);
  },
});

registerCommand({
  name: "antidelete",
  aliases: [],
  category: "Settings",
  description: "Toggle anti-delete (show deleted messages)",
  handler: async ({ args, settings, reply }) => {
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return reply(`❓ Usage: .antidelete on/off\n\nCurrent: *${settings.antidelete ? "on" : "off"}*`);
    }
    settings.antidelete = args[0].toLowerCase() === "on";
    saveSettings(settings);
    await reply(`✅ Anti-delete *${args[0].toLowerCase()}*!`);
  },
});

registerCommand({
  name: "setwelcome",
  aliases: [],
  category: "Settings",
  description: "Set custom welcome message",
  handler: async ({ args, settings, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .setwelcome Welcome @user to @group!\n\nVariables: @user @group @desc");
    settings.welcomeText = text;
    saveSettings(settings);
    await reply(`✅ Welcome message set:\n\n_${text}_`);
  },
});

registerCommand({
  name: "delwelcome",
  aliases: [],
  category: "Settings",
  description: "Delete custom welcome message",
  handler: async ({ settings, reply }) => {
    delete settings.welcomeText;
    saveSettings(settings);
    await reply("✅ Custom welcome message deleted. Using default.");
  },
});

registerCommand({
  name: "setgoodbye",
  aliases: [],
  category: "Settings",
  description: "Set custom goodbye message",
  handler: async ({ args, settings, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .setgoodbye Goodbye @user from @group!");
    settings.goodbyeText = text;
    saveSettings(settings);
    await reply(`✅ Goodbye message set:\n\n_${text}_`);
  },
});

registerCommand({
  name: "delgoodbye",
  aliases: [],
  category: "Settings",
  description: "Delete custom goodbye message",
  handler: async ({ settings, reply }) => {
    delete settings.goodbyeText;
    saveSettings(settings);
    await reply("✅ Custom goodbye message deleted. Using default.");
  },
});

registerCommand({
  name: "showwelcome",
  aliases: [],
  category: "Settings",
  description: "Show current welcome message",
  handler: async ({ settings, reply }) => {
    await reply(`📋 *Welcome Message*\n\n${(settings as any).welcomeText || "Default: Welcome @user to @group!"}`);
  },
});

registerCommand({
  name: "showgoodbye",
  aliases: [],
  category: "Settings",
  description: "Show current goodbye message",
  handler: async ({ settings, reply }) => {
    await reply(`📋 *Goodbye Message*\n\n${(settings as any).goodbyeText || "Default: Goodbye @user!"}`);
  },
});

registerCommand({
  name: "getsettings",
  aliases: ["showsettings", "mysettings"],
  category: "Settings",
  description: "Show all bot settings",
  handler: async ({ settings, reply }) => {
    await reply(`⚙️ *MAXX XMD Settings*

📛 Bot Name: *${settings.botName}*
👑 Owner: *${settings.ownerName}*
📱 Owner #: *${settings.ownerNumber || "Not set"}*
📌 Prefix: *${settings.prefix}*
🌐 Mode: *${settings.mode}*

🔧 *Toggles:*
• Anti-call: *${settings.anticall ? "✅" : "❌"}*
• Auto-read: *${settings.autoread ? "✅" : "❌"}*
• Auto-react: *${settings.autoreaction ? "✅" : "❌"}*
• Auto-type: *${settings.autotyping ? "✅" : "❌"}*
• Auto-bio: *${settings.autobio ? "✅" : "❌"}*
• Always online: *${settings.alwaysonline ? "✅" : "❌"}*
• Auto-view status: *${settings.autoviewstatus ? "✅" : "❌"}*
• Auto-like status: *${settings.autolikestatus ? "✅" : "❌"}*
• Anti-link: *${settings.antilink ? "✅" : "❌"}*
• Chatbot: *${settings.chatbot ? "✅" : "❌"}*`);
  },
});

registerCommand({
  name: "resetsetting",
  aliases: ["resetsettings"],
  category: "Settings",
  description: "Reset all settings to default",
  handler: async ({ reply }) => {
    const defaults = {
      prefix: ".", botName: "MAXX-XMD", ownerName: "MAXX", ownerNumber: "",
      mode: "public", welcomeMessage: true, goodbyeMessage: true, anticall: true,
      chatbot: false, autoread: false, autoviewstatus: true, autolikestatus: true,
      autolikestatus_emoji: "🔥", antilink: false, alwaysonline: true, autotyping: true,
      autobio: false, autoreaction: false,
    };
    saveSettings(defaults as any);
    await reply("✅ All settings have been *reset to default*!");
  },
});

registerCommand({
  name: "addsudo",
  aliases: [],
  category: "Settings",
  description: "Add a sudo user",
  handler: async ({ msg, args, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    let num = args[0]?.replace(/[^0-9]/g, "");
    const target = mentioned || (num ? num + "@s.whatsapp.net" : null);
    if (!target) return reply("❌ Mention a user or provide their number.\nExample: .addsudo @user");
    const sudo = loadSudo();
    if (sudo.includes(target)) return reply("ℹ️ User is already a sudo.");
    sudo.push(target);
    saveSudo(sudo);
    await reply(`✅ *${target.split("@")[0]}* added as sudo!`);
  },
});

registerCommand({
  name: "listsudo",
  aliases: [],
  category: "Settings",
  description: "List all sudo users",
  handler: async ({ reply }) => {
    const sudo = loadSudo();
    if (!sudo.length) return reply("📋 No sudo users set.");
    const list = sudo.map((s, i) => `${i + 1}. @${s.split("@")[0]}`).join("\n");
    await reply(`👑 *Sudo Users*\n\n${list}`);
  },
});

registerCommand({
  name: "delsudo",
  aliases: ["removesudo"],
  category: "Settings",
  description: "Remove a sudo user",
  handler: async ({ msg, args, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    let num = args[0]?.replace(/[^0-9]/g, "");
    const target = mentioned || (num ? num + "@s.whatsapp.net" : null);
    if (!target) return reply("❌ Mention or provide number.\nExample: .delsudo @user");
    const sudo = loadSudo().filter(s => s !== target);
    saveSudo(sudo);
    await reply(`✅ *${target.split("@")[0]}* removed from sudo.`);
  },
});

registerCommand({
  name: "addbadword",
  aliases: [],
  category: "Settings",
  description: "Add a word to the bad words list",
  handler: async ({ args, reply }) => {
    const word = args[0]?.toLowerCase();
    if (!word) return reply("❓ Usage: .addbadword <word>");
    const bw = loadBadwords();
    if (bw.includes(word)) return reply("ℹ️ Word already in list.");
    bw.push(word);
    saveBadwords(bw);
    await reply(`✅ *${word}* added to bad word list.`);
  },
});

registerCommand({
  name: "listbadword",
  aliases: [],
  category: "Settings",
  description: "List all bad words",
  handler: async ({ reply }) => {
    const bw = loadBadwords();
    if (!bw.length) return reply("📋 No bad words set.");
    await reply(`🚫 *Bad Words List*\n\n${bw.map((w, i) => `${i + 1}. ${w}`).join("\n")}`);
  },
});

registerCommand({
  name: "deletebadword",
  aliases: ["removebadword"],
  category: "Settings",
  description: "Remove a word from the bad words list",
  handler: async ({ args, reply }) => {
    const word = args[0]?.toLowerCase();
    if (!word) return reply("❓ Usage: .deletebadword <word>");
    const bw = loadBadwords().filter(w => w !== word);
    saveBadwords(bw);
    await reply(`✅ *${word}* removed from bad word list.`);
  },
});

registerCommand({
  name: "settimezone",
  aliases: ["timezone"],
  category: "Settings",
  description: "Set bot timezone",
  handler: async ({ args, settings, reply }) => {
    const tz = args.join("/");
    if (!tz) return reply("❓ Usage: .settimezone Africa/Nairobi");
    settings.timezone = tz;
    saveSettings(settings);
    await reply(`✅ Timezone set to *${tz}*`);
  },
});

registerCommand({
  name: "setstatusemoji",
  aliases: ["statusemoji"],
  category: "Settings",
  description: "Set the auto-like status emoji",
  handler: async ({ args, settings, reply }) => {
    const emoji = args[0];
    if (!emoji) return reply(`❓ Current: *${settings.autolikestatus_emoji}*\n\nUsage: .setstatusemoji ❤️`);
    settings.autolikestatus_emoji = emoji;
    saveSettings(settings);
    await reply(`✅ Status emoji set to *${emoji}*`);
  },
});

registerCommand({
  name: "setstickerpackname",
  aliases: [],
  category: "Settings",
  description: "Set sticker pack name",
  handler: async ({ args, settings, reply }) => {
    const name = args.join(" ");
    if (!name) return reply("❓ Usage: .setstickerpackname My Stickers");
    settings.stickerPackName = name;
    saveSettings(settings);
    await reply(`✅ Sticker pack name: *${name}*`);
  },
});

registerCommand({
  name: "setstickerauthor",
  aliases: [],
  category: "Settings",
  description: "Set sticker author name",
  handler: async ({ args, settings, reply }) => {
    const name = args.join(" ");
    if (!name) return reply("❓ Usage: .setstickerauthor MAXX XMD");
    settings.stickerAuthor = name;
    saveSettings(settings);
    await reply(`✅ Sticker author: *${name}*`);
  },
});

registerCommand({
  name: "setwarn",
  aliases: [],
  category: "Settings",
  description: "Set max warnings before kick",
  handler: async ({ args, settings, reply }) => {
    const max = parseInt(args[0]);
    if (isNaN(max) || max < 1) return reply("❓ Usage: .setwarn 3");
    settings.maxWarns = max;
    saveSettings(settings);
    await reply(`✅ Max warnings set to *${max}*`);
  },
});
