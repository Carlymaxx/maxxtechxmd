import { registerCommand } from "./types";
import { loadSettings, saveSettings, WORKSPACE_ROOT } from "../botState";
import fs from "fs";
import path from "path";

const GRP_SETTINGS_FILE = path.join(WORKSPACE_ROOT, "group_settings.json");
function loadGroupSettings(): Record<string, any> {
  try {
    if (fs.existsSync(GRP_SETTINGS_FILE)) return JSON.parse(fs.readFileSync(GRP_SETTINGS_FILE, "utf8"));
  } catch {}
  return {};
}
function saveGroupSettings(data: Record<string, any>) {
  fs.writeFileSync(GRP_SETTINGS_FILE, JSON.stringify(data, null, 2));
}
export function getGroupSetting(jid: string, key: string, def: any = false) {
  const store = loadGroupSettings();
  return store[jid]?.[key] ?? def;
}
export function setGroupSetting(jid: string, key: string, val: any) {
  const store = loadGroupSettings();
  if (!store[jid]) store[jid] = {};
  store[jid][key] = val;
  saveGroupSettings(store);
}

registerCommand({
  name: "tagall",
  aliases: ["everyone", "all"],
  category: "Group",
  description: "Mention all group members",
  groupOnly: true,
  handler: async ({ sock, from, msg, args, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Could not fetch group info.");
    const text = args.join(" ") || "👋 Hey everyone!";
    const mentions = groupMetadata.participants.map((p: any) => p.id);
    const mention = mentions.map((m: string) => `@${m.split("@")[0]}`).join(" ");
    await sock.sendMessage(from, { text: `${text}\n\n${mention}`, mentions });
  },
});

registerCommand({
  name: "tag",
  aliases: ["htag"],
  category: "Group",
  description: "Tag all members with a message",
  groupOnly: true,
  handler: async ({ sock, from, args, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Could not fetch group info.");
    const text = args.join(" ") || "📢 Attention!";
    const mentions = groupMetadata.participants.map((p: any) => p.id);
    await sock.sendMessage(from, { text, mentions });
  },
});

registerCommand({
  name: "hidetag",
  aliases: ["h"],
  category: "Group",
  description: "Silently mention all group members",
  groupOnly: true,
  handler: async ({ sock, from, args, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Could not fetch group info.");
    const text = args.join(" ") || "📢";
    const mentions = groupMetadata.participants.map((p: any) => p.id);
    await sock.sendMessage(from, { text, mentions });
  },
});

registerCommand({
  name: "tagadmin",
  aliases: ["admins"],
  category: "Group",
  description: "Mention all group admins",
  groupOnly: true,
  handler: async ({ sock, from, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Could not fetch group info.");
    const adminList = groupMetadata.participants.filter((p: any) => p.admin);
    if (!adminList.length) return reply("❌ No admins found.");
    const mentions = adminList.map((p: any) => p.id);
    const mention = mentions.map((m: string) => `@${m.split("@")[0]}`).join(" ");
    await sock.sendMessage(from, { text: `👑 *Group Admins*\n\n${mention}`, mentions });
  },
});

registerCommand({
  name: "kick",
  aliases: ["remove", "ban"],
  category: "Group",
  description: "Remove a member from the group",
  groupOnly: true,
  handler: async ({ sock, from, msg, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Not in a group.");
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) return reply("❌ Please mention the user to kick.\nExample: .kick @user");
    try {
      await sock.groupParticipantsUpdate(from, [mentioned], "remove");
      await reply(`✅ @${mentioned.split("@")[0]} has been removed from the group.`);
    } catch (e: any) {
      await reply(`❌ Failed to kick: ${e.message}`);
    }
  },
});

registerCommand({
  name: "add",
  aliases: [],
  category: "Group",
  description: "Add a member to the group",
  groupOnly: true,
  handler: async ({ sock, from, args, reply }) => {
    let num = args[0]?.replace(/[^0-9]/g, "");
    if (!num) return reply("❌ Provide a phone number.\nExample: .add 254712345678");
    if (!num.includes("@")) num = num + "@s.whatsapp.net";
    try {
      await sock.groupParticipantsUpdate(from, [num], "add");
      await reply(`✅ Added ${num.split("@")[0]} to the group!`);
    } catch (e: any) {
      await reply(`❌ Failed to add: ${e.message}`);
    }
  },
});

registerCommand({
  name: "promote",
  aliases: ["admin"],
  category: "Group",
  description: "Promote a member to admin",
  groupOnly: true,
  handler: async ({ sock, from, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) return reply("❌ Please mention the user to promote.\nExample: .promote @user");
    try {
      await sock.groupParticipantsUpdate(from, [mentioned], "promote");
      await reply(`✅ @${mentioned.split("@")[0]} has been promoted to admin! 👑`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "demote",
  aliases: [],
  category: "Group",
  description: "Demote an admin to member",
  groupOnly: true,
  handler: async ({ sock, from, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) return reply("❌ Please mention the user to demote.\nExample: .demote @user");
    try {
      await sock.groupParticipantsUpdate(from, [mentioned], "demote");
      await reply(`✅ @${mentioned.split("@")[0]} has been demoted to member.`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "mute",
  aliases: ["close"],
  category: "Group",
  description: "Close group (only admins can send)",
  groupOnly: true,
  handler: async ({ sock, from, reply }) => {
    try {
      await sock.groupSettingUpdate(from, "announcement");
      await reply("🔇 Group has been *muted*. Only admins can send messages.");
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "unmute",
  aliases: ["open"],
  category: "Group",
  description: "Open group (everyone can send)",
  groupOnly: true,
  handler: async ({ sock, from, reply }) => {
    try {
      await sock.groupSettingUpdate(from, "not_announcement");
      await reply("🔊 Group has been *unmuted*. Everyone can send messages.");
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "link",
  aliases: ["invite", "grouplink"],
  category: "Group",
  description: "Get group invite link",
  groupOnly: true,
  handler: async ({ sock, from, reply }) => {
    try {
      const code = await sock.groupInviteCode(from);
      await reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "resetlink",
  aliases: ["revoke", "newlink"],
  category: "Group",
  description: "Reset group invite link",
  groupOnly: true,
  handler: async ({ sock, from, reply }) => {
    try {
      const code = await sock.groupRevokeInvite(from);
      await reply(`✅ *Group link has been reset!*\n\n🔗 New link: https://chat.whatsapp.com/${code}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "setdesc",
  aliases: ["description", "setgroupdesc"],
  category: "Group",
  description: "Set group description",
  groupOnly: true,
  handler: async ({ sock, from, args, reply }) => {
    const desc = args.join(" ");
    if (!desc) return reply("❌ Provide a description.\nExample: .setdesc This is our group!");
    try {
      await sock.groupUpdateDescription(from, desc);
      await reply(`✅ Group description updated!`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "setgroupname",
  aliases: ["groupname", "setname"],
  category: "Group",
  description: "Set group name",
  groupOnly: true,
  handler: async ({ sock, from, args, reply }) => {
    const name = args.join(" ");
    if (!name) return reply("❌ Provide a name.\nExample: .setgroupname My Group");
    try {
      await sock.groupUpdateSubject(from, name);
      await reply(`✅ Group name updated to *${name}*!`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "getgrouppp",
  aliases: ["grouppp"],
  category: "Group",
  description: "Get group profile picture",
  groupOnly: true,
  handler: async ({ sock, from, reply }) => {
    try {
      const url = await sock.profilePictureUrl(from, "image");
      await sock.sendMessage(from, { image: { url }, caption: "📸 *Group Profile Picture*" });
    } catch {
      await reply("❌ No group profile picture found.");
    }
  },
});

registerCommand({
  name: "setppgroup",
  aliases: [],
  category: "Group",
  description: "Set group profile picture (reply to image)",
  groupOnly: true,
  handler: async ({ sock, from, msg, reply }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage;
    if (!imgMsg) return reply("❌ Reply to an image to set as group picture.");
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const buf = await downloadMediaMessage({ message: { imageMessage: imgMsg } } as any, "buffer", {});
      await sock.updateProfilePicture(from, buf as Buffer);
      await reply("✅ Group profile picture updated!");
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "kickall",
  aliases: [],
  category: "Group",
  description: "Kick all non-admin members",
  groupOnly: true,
  handler: async ({ sock, from, groupMetadata, sender, reply }) => {
    if (!groupMetadata) return reply("❌ Could not fetch group info.");
    const nonAdmins = groupMetadata.participants
      .filter((p: any) => !p.admin && p.id !== sender)
      .map((p: any) => p.id);
    if (!nonAdmins.length) return reply("✅ No non-admin members to kick.");
    await reply(`⚠️ Kicking ${nonAdmins.length} members...`);
    for (const jid of nonAdmins) {
      try { await sock.groupParticipantsUpdate(from, [jid], "remove"); } catch {}
      await new Promise(r => setTimeout(r, 1000));
    }
    await reply(`✅ Done! Kicked ${nonAdmins.length} members.`);
  },
});

registerCommand({
  name: "totalmembers",
  aliases: ["members", "count"],
  category: "Group",
  description: "Show total group members",
  groupOnly: true,
  handler: async ({ groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Could not fetch group info.");
    const total = groupMetadata.participants.length;
    const admins = groupMetadata.participants.filter((p: any) => p.admin).length;
    await reply(`👥 *Group Members*\n\n👤 Total: *${total}*\n👑 Admins: *${admins}*\n👤 Members: *${total - admins}*`);
  },
});

registerCommand({
  name: "userid",
  aliases: ["whois"],
  category: "Group",
  description: "Get user's WhatsApp ID",
  handler: async ({ sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned || sender;
    await reply(`🔍 *User ID*\n\n📱 JID: \`${target}\`\n📞 Number: \`${target.split("@")[0]}\``);
  },
});

registerCommand({
  name: "poll",
  aliases: [],
  category: "Group",
  description: "Create a group poll",
  groupOnly: true,
  handler: async ({ sock, from, args, reply }) => {
    const raw = args.join(" ");
    const parts = raw.split("|").map(s => s.trim());
    if (parts.length < 3) return reply("❌ Format: .poll Question|Option1|Option2|...\nExample: .poll Best fruit?|Apple|Mango|Banana");
    const [question, ...options] = parts;
    try {
      await sock.sendMessage(from, {
        poll: { name: question, values: options, selectableCount: 1 }
      });
    } catch {
      await reply(`📊 *Poll: ${question}*\n\n${options.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n_Reply with the number of your choice!_`);
    }
  },
});

registerCommand({
  name: "welcome",
  aliases: ["setwelcome", "welcomemessage"],
  category: "Group",
  description: "Toggle or set welcome message",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const arg = args[0]?.toLowerCase();
    if (arg === "on") {
      setGroupSetting(from, "welcome", true);
      return reply("✅ Welcome messages *enabled*!");
    }
    if (arg === "off") {
      setGroupSetting(from, "welcome", false);
      return reply("✅ Welcome messages *disabled*!");
    }
    const text = args.join(" ");
    if (text) {
      setGroupSetting(from, "welcomeText", text);
      return reply(`✅ Welcome message set to:\n\n_${text}_`);
    }
    const current = getGroupSetting(from, "welcome", false);
    await reply(`ℹ️ Welcome messages are *${current ? "on" : "off"}*.\n\nUse: .welcome on/off\nOr: .welcome Your message here`);
  },
});

registerCommand({
  name: "antilink",
  aliases: [],
  category: "Group",
  description: "Toggle anti-link protection",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const arg = args[0]?.toLowerCase();
    if (arg === "on") { setGroupSetting(from, "antilink", true); return reply("✅ Anti-link *enabled*! Links will be deleted."); }
    if (arg === "off") { setGroupSetting(from, "antilink", false); return reply("✅ Anti-link *disabled*."); }
    await reply("❓ Usage: .antilink on/off");
  },
});

registerCommand({
  name: "antibadword",
  aliases: [],
  category: "Group",
  description: "Toggle anti-bad-word filter",
  groupOnly: true,
  handler: async ({ from, args, reply }) => {
    const arg = args[0]?.toLowerCase();
    if (arg === "on") { setGroupSetting(from, "antibadword", true); return reply("✅ Anti-badword *enabled*!"); }
    if (arg === "off") { setGroupSetting(from, "antibadword", false); return reply("✅ Anti-badword *disabled*."); }
    await reply("❓ Usage: .antibadword on/off");
  },
});

registerCommand({
  name: "announce",
  aliases: ["announcements"],
  category: "Group",
  description: "Send an announcement to the group",
  groupOnly: true,
  handler: async ({ sock, from, args, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Not in a group.");
    const text = args.join(" ");
    if (!text) return reply("❌ Provide announcement text.");
    const mentions = groupMetadata.participants.map((p: any) => p.id);
    await sock.sendMessage(from, {
      text: `📢 *ANNOUNCEMENT*\n\n${text}`,
      mentions,
    });
  },
});

registerCommand({
  name: "groupid",
  aliases: [],
  category: "Group",
  description: "Get the current group ID",
  groupOnly: true,
  handler: async ({ from, reply }) => {
    await reply(`🆔 *Group ID*\n\n\`${from}\``);
  },
});

registerCommand({
  name: "mediatag",
  aliases: [],
  category: "Group",
  description: "Tag all members with media",
  groupOnly: true,
  handler: async ({ sock, from, msg, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Not in a group.");
    const mentions = groupMetadata.participants.map((p: any) => p.id);
    const mention = mentions.map((m: string) => `@${m.split("@")[0]}`).join(" ");
    await sock.sendMessage(from, { text: `📢 Media tag!\n\n${mention}`, mentions });
  },
});
