import { registerCommand } from "./types";
import { loadSettings, saveSettings, WORKSPACE_ROOT, loadSudoList, saveSudoList } from "../botState";
import fs from "fs";
import path from "path";

// Sudo helpers — backed by shared in-memory cache in botState.ts
function loadSudo(): string[] { return loadSudoList(); }
function saveSudo(list: string[]) { saveSudoList(list); }

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

// ─── BOT CONTROL COMMANDS (sudoOnly — owner/sudo only) ─────────────────────

registerCommand({
  name: "setprefix",
  aliases: ["prefix"],
  category: "Settings",
  sudoOnly: true,
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
  name: "setjid",
  aliases: ["jid"],
  category: "Settings",
  sudoOnly: true,
  description: "Set bot JID",
  handler: async ({ args, settings, reply }) => {
    const jid = args.join(" ").trim();
    if (!jid) return reply(`❓ Current JID: *${settings.jid || "Not set"}*\n\nUsage: .setjid <jid>`);
    settings.jid = jid;
    saveSettings(settings);
    await reply(`✅ JID set to *${jid}*`);
  },
});

registerCommand({
  name: "mode",
  aliases: ["modestatus"],
  category: "Settings",
  description: "Set bot mode (public/private/inbox) — DM only",
  handler: async ({ args, settings, reply, isGroup }) => {
    if (isGroup) return; // silent — only works in DMs
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
  sudoOnly: true,
  description: "Toggle anti-call (reject incoming calls)",
  handler: async ({ args, settings, reply }) => toggle(settings, "anticall", args[0]?.toLowerCase(), "Anti-call", reply),
});

registerCommand({
  name: "autoread",
  aliases: [],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle auto-read messages",
  handler: async ({ args, settings, reply }) => toggle(settings, "autoread", args[0]?.toLowerCase(), "Auto-read", reply),
});

registerCommand({
  name: "autoreact",
  aliases: ["autoreaction"],
  category: "Settings",
  description: "Toggle auto-react — DM only",
  handler: async ({ args, settings, reply, isGroup }) => {
    if (isGroup) return; // silent — only works in DMs
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return reply(
        `❓ Usage: .autoreact on/off\n\n` +
        `📌 *Groups:* Always auto-react (cannot be disabled)\n` +
        `💬 *DMs:* ${settings.autoreaction ? "✅ on" : "❌ off"}`
      );
    }
    settings.autoreaction = args[0].toLowerCase() === "on";
    saveSettings(settings);
    await reply(`✅ DM auto-react *${args[0].toLowerCase()}*!\n📌 Groups always auto-react regardless.`);
  },
});

registerCommand({
  name: "autotype",
  aliases: ["autotyping"],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle auto-typing indicator",
  handler: async ({ args, settings, reply }) => toggle(settings, "autotyping", args[0]?.toLowerCase(), "Auto-typing", reply),
});

registerCommand({
  name: "autobio",
  aliases: [],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle automatic bio update",
  handler: async ({ args, settings, reply }) => toggle(settings, "autobio", args[0]?.toLowerCase(), "Auto-bio", reply),
});

registerCommand({
  name: "alwaysonline",
  aliases: ["online"],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle always online presence",
  handler: async ({ args, settings, reply }) => toggle(settings, "alwaysonline", args[0]?.toLowerCase(), "Always online", reply),
});

registerCommand({
  name: "autoviewstatus",
  aliases: [],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle auto-view status updates",
  handler: async ({ args, settings, reply }) => toggle(settings, "autoviewstatus", args[0]?.toLowerCase(), "Auto-view status", reply),
});

registerCommand({
  name: "autorecordstatus",
  aliases: ["recordstatus", "statussave"],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle auto-record status (forwards status media to owner)",
  handler: async ({ args, settings, reply }) => toggle(settings, "autorecordstatus", args[0]?.toLowerCase(), "Auto-record status", reply),
});

registerCommand({
  name: "chatbot",
  aliases: ["aichat", "botchat"],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle AI chatbot mode — replies to messages in private DMs only",
  handler: async ({ args, settings, reply }) => {
    const arg = args[0]?.toLowerCase();
    if (arg === "on") {
      settings.chatbot = true;
      saveSettings(settings);
      return reply(
        `🤖 *Chatbot ENABLED* ✅\n\n` +
        `I will now reply to every non-command message sent to me in *private DMs*.\n\n` +
        `_Note: Chatbot does not work in groups._\n\n` +
        `Use *.chatbot off* to disable.\n\n> _MAXX-XMD_ ⚡`
      );
    }
    if (arg === "off") {
      settings.chatbot = false;
      saveSettings(settings);
      return reply(`🤖 *Chatbot DISABLED* ❌\n\nI will no longer auto-reply in DMs.\n\n> _MAXX-XMD_ ⚡`);
    }
    const status = settings.chatbot ? "🟢 *ON*" : "🔴 *OFF*";
    await reply(
      `🤖 *Chatbot Status:* ${status}\n\n` +
      `📌 *Usage:*\n` +
      `.chatbot on  — enable AI replies in private DMs\n` +
      `.chatbot off — disable\n\n` +
      `_Only owner can use this command. Groups not supported._\n\n> _MAXX-XMD_ ⚡`
    );
  },
});

registerCommand({
  name: "antibug",
  aliases: [],
  category: "Settings",
  sudoOnly: true,
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
  sudoOnly: true,
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
  name: "antideleteglobal",
  aliases: ["antideletegb"],
  category: "Settings",
  sudoOnly: true,
  description: "Toggle global anti-delete for all chats (use .antidelete in a group for per-group control)",
  handler: async ({ args, settings, reply }) => {
    if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
      return reply(`❓ Usage: .antideleteglobal on/off\n\nCurrent: *${settings.antidelete ? "on" : "off"}*\n\n_Tip: Use .antidelete on/off in a group for per-group control_`);
    }
    settings.antidelete = args[0].toLowerCase() === "on";
    saveSettings(settings);
    await reply(`✅ Global anti-delete *${args[0].toLowerCase()}*!`);
  },
});

registerCommand({
  name: "setglobalwelcome",
  aliases: ["globalwelcome"],
  category: "Settings",
  sudoOnly: true,
  description: "Set global default welcome message (use .welcome in a group for per-group control)",
  handler: async ({ args, settings, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .setglobalwelcome Welcome @user to @group!\n\nVariables: @user @group @desc\n\n_Tip: Use .welcome on <message> in a group for per-group control_");
    settings.welcomeText = text;
    saveSettings(settings);
    await reply(`✅ Global welcome message set:\n\n_${text}_`);
  },
});

registerCommand({
  name: "delwelcome",
  aliases: [],
  category: "Settings",
  sudoOnly: true,
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
  sudoOnly: true,
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
  sudoOnly: true,
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

// ─── READ-ONLY SETTINGS (public — anyone can view) ─────────────────────────

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
🆔 JID: *${settings.jid || "Not set"}*
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
• Auto-record status: *${(settings as any).autorecordstatus ? "✅" : "❌"}*
• Anti-link: *${settings.antilink ? "✅" : "❌"}*
• Chatbot: *${settings.chatbot ? "✅" : "❌"}`);
  },
});

registerCommand({
  name: "resetsetting",
  aliases: ["resetsettings"],
  category: "Settings",
  sudoOnly: true,
  description: "Reset all settings to default",
  handler: async ({ reply }) => {
    const defaults = {
      prefix: ".", botName: "MAXX-XMD", ownerName: "MAXX", ownerNumber: "",
      jid: "", mode: "public", welcomeMessage: true, goodbyeMessage: true, anticall: false,
      chatbot: false, autoread: false, autoviewstatus: true, autolikestatus: true,
      autolikestatus_emoji: "🔥", antilink: false, alwaysonline: true, autotyping: true,
      autobio: false, autoreaction: false,
    };
    saveSettings(defaults as any);
    await reply("✅ All settings have been *reset to default*!");
  },
});

// ─── SUDO MANAGEMENT (sudoOnly) ────────────────────────────────────────────

registerCommand({
  name: "addsudo",
  aliases: [],
  category: "Settings",
  sudoOnly: true,
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
  sudoOnly: true,
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

// ─── BAD WORDS (sudoOnly) ──────────────────────────────────────────────────

registerCommand({
  name: "addglobalbadword",
  aliases: ["globalbadword"],
  category: "Settings",
  sudoOnly: true,
  description: "Add a word to the global bad words list (use .addbadword in a group for per-group control)",
  handler: async ({ args, reply }) => {
    const word = args[0]?.toLowerCase();
    if (!word) return reply("❓ Usage: .addglobalbadword <word>");
    const bw = loadBadwords();
    if (bw.includes(word)) return reply("ℹ️ Word already in global list.");
    bw.push(word);
    saveBadwords(bw);
    await reply(`✅ *${word}* added to global bad word list.`);
  },
});

registerCommand({
  name: "listglobalbadword",
  aliases: ["globalbadwords"],
  category: "Settings",
  description: "List all global bad words (use .badwords in a group for per-group list)",
  handler: async ({ reply }) => {
    const bw = loadBadwords();
    if (!bw.length) return reply("📋 No global bad words set.");
    await reply(`🚫 *Global Bad Words List*\n\n${bw.map((w, i) => `${i + 1}. ${w}`).join("\n")}`);
  },
});

registerCommand({
  name: "deleteglobalbadword",
  aliases: ["removeglobalbadword"],
  category: "Settings",
  sudoOnly: true,
  description: "Remove a word from the global bad words list",
  handler: async ({ args, reply }) => {
    const word = args[0]?.toLowerCase();
    if (!word) return reply("❓ Usage: .deleteglobalbadword <word>");
    const bw = loadBadwords().filter(w => w !== word);
    saveBadwords(bw);
    await reply(`✅ *${word}* removed from global bad word list.`);
  },
});

// ─── MORE SETTINGS (sudoOnly) ──────────────────────────────────────────────

registerCommand({
  name: "settimezone",
  aliases: ["timezone"],
  category: "Settings",
  sudoOnly: true,
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
  sudoOnly: true,
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
  sudoOnly: true,
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
  sudoOnly: true,
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
  sudoOnly: true,
  description: "Set max warnings before kick",
  handler: async ({ args, settings, reply }) => {
    const max = parseInt(args[0]);
    if (isNaN(max) || max < 1) return reply("❓ Usage: .setwarn 3");
    settings.maxWarns = max;
    saveSettings(settings);
    await reply(`✅ Max warnings set to *${max}*`);
  },
});

registerCommand({
  name: "setgrouplink",
  aliases: ["setgroup", "grouplink"],
  category: "Settings",
  sudoOnly: true,
  description: "Set the official WhatsApp group invite link (.setgrouplink <url>)",
  handler: async ({ args, settings, reply }) => {
    const url = args[0];
    if (!url || !url.startsWith("https://chat.whatsapp.com/")) {
      return reply(
        `❓ *Usage:* .setgrouplink <invite url>\n\n` +
        `*Example:*\n.setgrouplink https://chat.whatsapp.com/AbCdEfGhIjK\n\n` +
        `_Current:_ ${(settings.groupLink as string) || "Not set"}\n\n> _MAXX-XMD_ ⚡`
      );
    }
    settings.groupLink = url;
    saveSettings(settings);
    await reply(`✅ *WhatsApp group link updated!*\n\n🔗 ${url}\n\n_Members can now get it with .link_\n\n> _MAXX-XMD_ ⚡`);
  },
});

registerCommand({
  name: "setchannellink",
  aliases: ["setchannel", "channellink"],
  category: "Settings",
  sudoOnly: true,
  description: "Set the official WhatsApp channel link (.setchannellink <url>)",
  handler: async ({ args, settings, reply }) => {
    const url = args[0];
    if (!url || !url.startsWith("https://whatsapp.com/channel/")) {
      return reply(
        `❓ *Usage:* .setchannellink <channel url>\n\n` +
        `*Example:*\n.setchannellink https://whatsapp.com/channel/0029Vb6XNTjAIn...\n\n` +
        `_Current:_ ${(settings.channelLink as string) || "Not set"}\n\n> _MAXX-XMD_ ⚡`
      );
    }
    settings.channelLink = url;
    saveSettings(settings);
    await reply(`✅ *WhatsApp channel link updated!*\n\n📢 ${url}\n\n> _MAXX-XMD_ ⚡`);
  },
});
