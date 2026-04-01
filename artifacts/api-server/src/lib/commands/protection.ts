import { registerCommand } from "./types";
import fs from "fs";
import path from "path";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const GS_FILE = path.join(DATA_DIR, "groupsettings.json");
const WARN_FILE = path.join(DATA_DIR, "warnings.json");

function loadGS(): Record<string, any> {
  try { return JSON.parse(fs.readFileSync(GS_FILE, "utf8")); } catch { return {}; }
}
function saveGS(d: Record<string, any>) { fs.writeFileSync(GS_FILE, JSON.stringify(d, null, 2)); }
function loadWarns(): Record<string, Record<string, number>> {
  try { return JSON.parse(fs.readFileSync(WARN_FILE, "utf8")); } catch { return {}; }
}
function saveWarns(d: Record<string, Record<string, number>>) { fs.writeFileSync(WARN_FILE, JSON.stringify(d, null, 2)); }

// ── Export functions for middleware use ────────────────────────────────────────
export function getGroupSettings(groupJid: string) {
  return loadGS()[groupJid] || {};
}
export function setGroupSetting(groupJid: string, key: string, value: any) {
  const gs = loadGS();
  if (!gs[groupJid]) gs[groupJid] = {};
  gs[groupJid][key] = value;
  saveGS(gs);
}

// ── Toggle helper ─────────────────────────────────────────────────────────────

async function toggle(args: string[], groupJid: string, key: string, label: string, reply: (t: string) => any) {
  const val = args[0]?.toLowerCase();
  if (val !== "on" && val !== "off") {
    const current = getGroupSettings(groupJid)[key] ? "ON 🟢" : "OFF 🔴";
    return reply(`ℹ️ *${label}* is currently *${current}*\nUsage: .${key} on/off${FOOTER}`);
  }
  setGroupSetting(groupJid, key, val === "on");
  await reply(`${val === "on" ? "✅" : "❌"} *${label}* turned *${val.toUpperCase()}* for this group${FOOTER}`);
}

// ── Anti-link ─────────────────────────────────────────────────────────────────

registerCommand({
  name: "antilink",
  aliases: ["nolink", "linkblock"],
  category: "Protection",
  description: "Auto-delete links sent by non-admins (.antilink on/off)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => toggle(args, from, "antilink", "Anti-Link", reply),
});

registerCommand({
  name: "antispam",
  aliases: ["nospam", "spamblock"],
  category: "Protection",
  description: "Warn users who send too many messages (.antispam on/off)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => toggle(args, from, "antispam", "Anti-Spam", reply),
});

registerCommand({
  name: "welcome",
  aliases: ["welcomeon", "setwelcome"],
  category: "Protection",
  description: "Welcome new members (.welcome on/off or .welcome on Welcome to {group}!)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const val = args[0]?.toLowerCase();
    if (val !== "on" && val !== "off") {
      const current = getGroupSettings(from).welcome ? "ON 🟢" : "OFF 🔴";
      const msg = getGroupSettings(from).welcomeMsg || "Not set";
      return reply(`ℹ️ *Welcome* is *${current}*\n📝 Message: ${msg}\n\nUsage: .welcome on [custom message]\nVariables: {user} {group} {count}${FOOTER}`);
    }
    if (val === "on") {
      const customMsg = args.slice(1).join(" ") || "Welcome to *{group}*, {user}! 🎉\nYou are member #{count}.";
      setGroupSetting(from, "welcome", true);
      setGroupSetting(from, "welcomeMsg", customMsg);
      return reply(`✅ *Welcome messages* enabled!\n\n📝 Message:\n${customMsg}${FOOTER}`);
    }
    setGroupSetting(from, "welcome", false);
    await reply(`❌ *Welcome messages* disabled.${FOOTER}`);
  },
});

registerCommand({
  name: "goodbye",
  aliases: ["byemsg", "setgoodbye"],
  category: "Protection",
  description: "Goodbye message when members leave (.goodbye on/off)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const val = args[0]?.toLowerCase();
    if (val !== "on" && val !== "off") {
      const current = getGroupSettings(from).goodbye ? "ON 🟢" : "OFF 🔴";
      return reply(`ℹ️ *Goodbye* is *${current}*\nUsage: .goodbye on [custom message]${FOOTER}`);
    }
    if (val === "on") {
      const customMsg = args.slice(1).join(" ") || "Goodbye, {user}! 👋 Thanks for being with us.";
      setGroupSetting(from, "goodbye", true);
      setGroupSetting(from, "goodbyeMsg", customMsg);
      return reply(`✅ *Goodbye messages* enabled!\n📝 ${customMsg}${FOOTER}`);
    }
    setGroupSetting(from, "goodbye", false);
    await reply(`❌ *Goodbye messages* disabled.${FOOTER}`);
  },
});

// ── Warning system ─────────────────────────────────────────────────────────────

registerCommand({
  name: "warn",
  aliases: ["warning", "strike"],
  category: "Protection",
  description: "Warn a user in the group (3 warns = kick) (.warn @user reason)",
  groupOnly: true,
  handler: async ({ sock, from, msg, args, reply, groupMetadata }) => {
    const mentioned = (msg as any).message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      || (msg as any).message?.extendedTextMessage?.contextInfo?.participant;
    if (!mentioned) return reply(`❓ Usage: .warn @user [reason]\nExample: .warn @user spamming${FOOTER}`);
    const reason = args.slice(1).join(" ") || "No reason given";
    const warns = loadWarns();
    if (!warns[from]) warns[from] = {};
    warns[from][mentioned] = (warns[from][mentioned] || 0) + 1;
    const count = warns[from][mentioned];
    saveWarns(warns);
    const name = groupMetadata?.participants?.find((p: any) => p.id === mentioned)?.name || mentioned.split("@")[0];
    if (count >= 3) {
      await reply(`⚠️ *@${mentioned.split("@")[0]}* has been warned *${count}/3* times.\n🚫 Auto-kicking for exceeding warn limit!\n📝 Reason: ${reason}${FOOTER}`);
      try { await sock.groupParticipantsUpdate(from, [mentioned], "remove"); } catch {}
      warns[from][mentioned] = 0;
      saveWarns(warns);
    } else {
      await reply(`⚠️ *Warning ${count}/3* issued to @${mentioned.split("@")[0]}\n📝 Reason: ${reason}\n\n_3 warnings = automatic kick_${FOOTER}`);
    }
  },
});

registerCommand({
  name: "warnlist",
  aliases: ["warns", "warninglist"],
  category: "Protection",
  description: "List all warnings in this group",
  groupOnly: true,
  handler: async ({ from, reply }) => {
    const warns = loadWarns()[from] || {};
    const entries = Object.entries(warns).filter(([, v]) => (v as number) > 0);
    if (!entries.length) return reply(`✅ No active warnings in this group.${FOOTER}`);
    const list = entries.map(([jid, count]) => `• @${jid.split("@")[0]}: ${count}/3 warns`).join("\n");
    await reply(`⚠️ *Warning List*\n\n${list}${FOOTER}`);
  },
});

registerCommand({
  name: "clearwarn",
  aliases: ["resetwarn", "delwarn"],
  category: "Protection",
  description: "Clear all warnings for a user (.clearwarn @user)",
  groupOnly: true,
  handler: async ({ from, msg, reply }) => {
    const mentioned = (msg as any).message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) return reply(`❓ Usage: .clearwarn @user${FOOTER}`);
    const warns = loadWarns();
    if (warns[from]) delete warns[from][mentioned];
    saveWarns(warns);
    await reply(`✅ Warnings cleared for @${mentioned.split("@")[0]}${FOOTER}`);
  },
});

registerCommand({
  name: "clearallwarns",
  aliases: ["resetallwarns"],
  category: "Protection",
  description: "Clear ALL warnings in this group",
  groupOnly: true,
  handler: async ({ from, reply }) => {
    const warns = loadWarns();
    delete warns[from];
    saveWarns(warns);
    await reply(`✅ All warnings cleared in this group.${FOOTER}`);
  },
});

// ── Anti-flood ────────────────────────────────────────────────────────────────

registerCommand({
  name: "antiflood",
  aliases: ["floodprotect", "msgcap"],
  category: "Protection",
  description: "Warn users flooding messages (.antiflood on/off [max messages per minute])",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const val = args[0]?.toLowerCase();
    if (val !== "on" && val !== "off") {
      const gs = getGroupSettings(from);
      return reply(`ℹ️ *Anti-Flood* is ${gs.antiflood ? "ON 🟢" : "OFF 🔴"}\nLimit: ${gs.floodLimit || 5} msgs/min\nUsage: .antiflood on [limit]${FOOTER}`);
    }
    setGroupSetting(from, "antiflood", val === "on");
    if (val === "on") {
      const limit = parseInt(args[1]) || 5;
      setGroupSetting(from, "floodLimit", limit);
      return reply(`✅ *Anti-Flood* enabled! Max *${limit}* messages per minute.${FOOTER}`);
    }
    await reply(`❌ *Anti-Flood* disabled.${FOOTER}`);
  },
});

// ── Bad words filter ──────────────────────────────────────────────────────────

registerCommand({
  name: "badwords",
  aliases: ["profanityfilter", "wordfilter"],
  category: "Protection",
  description: "Filter and delete bad words in group (.badwords on/off)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => toggle(args, from, "badwords", "Bad Words Filter", reply),
});

registerCommand({
  name: "addbadword",
  aliases: ["addfilter"],
  category: "Protection",
  description: "Add a word to the bad words filter (.addbadword <word>)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const word = args[0]?.toLowerCase();
    if (!word) return reply(`❓ Usage: .addbadword <word>`);
    const gs = loadGS();
    if (!gs[from]) gs[from] = {};
    if (!gs[from].badwordList) gs[from].badwordList = [];
    if (!gs[from].badwordList.includes(word)) gs[from].badwordList.push(word);
    saveGS(gs);
    await reply(`✅ Added *"${word}"* to the filter list.${FOOTER}`);
  },
});

registerCommand({
  name: "removebadword",
  aliases: ["removefilter"],
  category: "Protection",
  description: "Remove a word from the filter (.removebadword <word>)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const word = args[0]?.toLowerCase();
    if (!word) return reply(`❓ Usage: .removebadword <word>`);
    const gs = loadGS();
    if (gs[from]?.badwordList) {
      gs[from].badwordList = gs[from].badwordList.filter((w: string) => w !== word);
      saveGS(gs);
    }
    await reply(`✅ Removed *"${word}"* from filter list.${FOOTER}`);
  },
});

registerCommand({
  name: "badwordlist",
  aliases: ["filterlist"],
  category: "Protection",
  description: "See all filtered words in this group",
  groupOnly: true,
  handler: async ({ from, reply }) => {
    const list = getGroupSettings(from).badwordList || [];
    if (!list.length) return reply(`ℹ️ No bad words in filter yet.\nUse .addbadword <word> to add.${FOOTER}`);
    await reply(`🚫 *Filtered Words*\n\n${list.map((w: string, i: number) => `${i + 1}. ${w}`).join("\n")}${FOOTER}`);
  },
});

// ── Group lock / settings ─────────────────────────────────────────────────────

registerCommand({
  name: "grouplock",
  aliases: ["lockgroup", "glock"],
  category: "Protection",
  description: "Lock/unlock the group settings (.grouplock on/off)",
  groupOnly: true,
  handler: async ({ sock, from, args, reply }) => {
    const val = args[0]?.toLowerCase();
    if (val !== "on" && val !== "off") return reply(`❓ Usage: .grouplock on/off${FOOTER}`);
    try {
      await sock.groupSettingUpdate(from, val === "on" ? "announcement" : "not_announcement");
      await reply(`${val === "on" ? "🔒" : "🔓"} Group is now *${val === "on" ? "locked" : "unlocked"}* — ${val === "on" ? "only admins can send messages" : "all members can send messages"}${FOOTER}`);
    } catch {
      await reply(`❌ Failed to update group lock. Bot must be admin.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "antidelete2",
  aliases: ["antidel2", "nodeletemsgs"],
  category: "Protection",
  description: "Re-send deleted messages in the group (.antidelete2 on/off)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => toggle(args, from, "antidelete", "Anti-Delete", reply),
});

registerCommand({
  name: "groupsettings",
  aliases: ["gsettings", "gstatus"],
  category: "Protection",
  description: "View all protection settings for this group",
  groupOnly: true,
  handler: async ({ from, reply }) => {
    const gs = getGroupSettings(from);
    const onOff = (v: boolean) => v ? "ON 🟢" : "OFF 🔴";
    await reply(
      `🛡️ *Group Protection Settings*\n\n` +
      `🔗 Anti-Link: ${onOff(gs.antilink)}\n` +
      `💬 Anti-Spam: ${onOff(gs.antispam)}\n` +
      `🌊 Anti-Flood: ${onOff(gs.antiflood)}\n` +
      `🔤 Bad Words: ${onOff(gs.badwords)}\n` +
      `❌ Anti-Delete: ${onOff(gs.antidelete)}\n` +
      `👋 Welcome: ${onOff(gs.welcome)}\n` +
      `👋 Goodbye: ${onOff(gs.goodbye)}\n` +
      `⚠️ Warn Limit: 3 warns = kick${FOOTER}`
    );
  },
});

registerCommand({
  name: "setwelcomemsg",
  aliases: ["welcomemsg", "welmsg"],
  category: "Protection",
  description: "Set a custom welcome message (.setwelcomemsg Welcome {user}!)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const msg = args.join(" ");
    if (!msg) return reply(`❓ Usage: .setwelcomemsg <message>\nVariables: {user} {group} {count}\nExample: .setwelcomemsg Hello {user}, welcome to {group}!${FOOTER}`);
    setGroupSetting(from, "welcomeMsg", msg);
    setGroupSetting(from, "welcome", true);
    await reply(`✅ Welcome message set:\n\n_${msg}_${FOOTER}`);
  },
});

registerCommand({
  name: "setgoodbyemsg",
  aliases: ["byemsg2"],
  category: "Protection",
  description: "Set a custom goodbye message (.setgoodbyemsg Bye {user}!)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const msg = args.join(" ");
    if (!msg) return reply(`❓ Usage: .setgoodbyemsg <message>\nVariables: {user} {group}${FOOTER}`);
    setGroupSetting(from, "goodbyeMsg", msg);
    setGroupSetting(from, "goodbye", true);
    await reply(`✅ Goodbye message set:\n\n_${msg}_${FOOTER}`);
  },
});

registerCommand({
  name: "antibot",
  aliases: ["nobots", "botblock"],
  category: "Protection",
  description: "Block other bots from joining/sending (.antibot on/off)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => toggle(args, from, "antibot", "Anti-Bot", reply),
});

registerCommand({
  name: "cleanmode",
  aliases: ["cleangroup", "cleanall"],
  category: "Protection",
  description: "Auto-delete certain types of messages (.cleanmode on/off)",
  groupOnly: true,
  handler: async ({ from, args, reply }) => toggle(args, from, "cleanmode", "Clean Mode", reply),
});
