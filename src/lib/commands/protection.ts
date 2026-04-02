import { registerCommand } from "./types";
import fs from "fs";
import path from "path";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const GS_FILE = path.join(DATA_DIR, "groupsettings.json");
const WARN_FILE = path.join(DATA_DIR, "warnings.json");

// ── Load ONCE at startup — no repeated disk reads ─────────────────────────────
let _gs: Record<string, any> = {};
let _warns: Record<string, Record<string, number>> = {};
try { _gs = JSON.parse(fs.readFileSync(GS_FILE, "utf8")); } catch {}
try { _warns = JSON.parse(fs.readFileSync(WARN_FILE, "utf8")); } catch {}

function saveGS() { try { fs.writeFileSync(GS_FILE, JSON.stringify(_gs)); } catch {} }
function saveWarns() { try { fs.writeFileSync(WARN_FILE, JSON.stringify(_warns)); } catch {} }

// ── Export functions for middleware use ────────────────────────────────────────
export function getGroupSettings(groupJid: string) {
  return _gs[groupJid] || {};
}
export function setGroupSetting(groupJid: string, key: string, value: any) {
  if (!_gs[groupJid]) _gs[groupJid] = {};
  _gs[groupJid][key] = value;
  saveGS();
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

// ── Spam Protection ──────────────────────────────────────────────────────────
// Note: antilink is in group.ts (reads group_settings.json — what the middleware uses)

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
    if (!_warns[from]) _warns[from] = {};
    _warns[from][mentioned] = (_warns[from][mentioned] || 0) + 1;
    const count = _warns[from][mentioned];
    saveWarns();
    const name = groupMetadata?.participants?.find((p: any) => p.id === mentioned)?.name || mentioned.split("@")[0];
    if (count >= 3) {
      await reply(`⚠️ *@${mentioned.split("@")[0]}* has been warned *${count}/3* times.\n🚫 Auto-kicking for exceeding warn limit!\n📝 Reason: ${reason}${FOOTER}`);
      try { await sock.groupParticipantsUpdate(from, [mentioned], "remove"); } catch {}
      _warns[from][mentioned] = 0;
      saveWarns();
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
    const warns = _warns[from] || {};
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
    if (_warns[from]) delete _warns[from][mentioned];
    saveWarns();
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
    delete _warns[from];
    saveWarns();
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
    if (!_gs[from]) _gs[from] = {};
    if (!_gs[from].badwordList) _gs[from].badwordList = [];
    if (!_gs[from].badwordList.includes(word)) _gs[from].badwordList.push(word);
    saveGS();
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
    if (_gs[from]?.badwordList) {
      _gs[from].badwordList = _gs[from].badwordList.filter((w: string) => w !== word);
      saveGS();
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
  name: "antidelete",
  aliases: ["antidel", "antidelete2", "nodeletemsgs", "antidel2"],
  category: "Protection",
  description: "Re-send deleted messages with their content (.antidelete on/off)",
  groupOnly: true,
  adminOnly: true,
  handler: async ({ from, args, reply }) => {
    const arg = args[0]?.toLowerCase();
    const current = getGroupSettings(from).antidelete;
    if (arg === "on") {
      setGroupSetting(from, "antidelete", true);
      return reply(
        `✅ *Anti-Delete ENABLED* 🔍\n\n` +
        `When anyone deletes a message I will:\n` +
        `• *Alert* the group who deleted it\n` +
        `• *Re-send* the deleted content\n\n` +
        `_Works for text, images, videos, audio, stickers & docs._\n\n` +
        `> _MAXX-XMD_ ⚡`
      );
    }
    if (arg === "off") {
      setGroupSetting(from, "antidelete", false);
      return reply(`✅ *Anti-Delete DISABLED* 🔓\n\nDeleted messages will no longer be recovered.\n\n> _MAXX-XMD_ ⚡`);
    }
    const status = current ? "🟢 *ON*" : "🔴 *OFF*";
    await reply(
      `🔍 *Anti-Delete Status:* ${status}\n\n` +
      `📌 *Usage:*\n` +
      `.antidelete on  — enable recovery\n` +
      `.antidelete off — disable\n\n` +
      `> _MAXX-XMD_ ⚡`
    );
  },
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
