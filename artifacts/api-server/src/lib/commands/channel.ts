import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

registerCommand({
  name: "channeljid",
  aliases: ["channelid", "getchanneljid"],
  category: "Channel",
  description: "Get JID of a WhatsApp channel",
  usage: ".channeljid <channel link>",
  handler: async ({ args, reply }) => {
    const link = args[0];
    if (!link) return reply(`❓ Usage: .channeljid <channel link>\nExample: .channeljid https://whatsapp.com/channel/...${FOOTER}`);
    await reply(`📢 *Channel JID Lookup*\n\nLink: ${link}\n\n💡 To get a channel's JID:\n1. Open the channel in WhatsApp\n2. Tap the channel name → info\n3. The invite link contains the JID\n\n🆔 JID format: <hash>@newsletter${FOOTER}`);
  },
});

registerCommand({
  name: "channeljid2",
  aliases: ["channelid2"],
  category: "Channel",
  description: "Get current chat/channel JID",
  usage: ".channeljid2",
  handler: async ({ from, isGroup, reply }) => {
    const type = isGroup ? "Group" : from.endsWith("@newsletter") ? "Channel" : "Private Chat";
    await reply(`🆔 *Current JID*\n\n📍 JID: \`${from}\`\n📌 Type: ${type}${FOOTER}`);
  },
});

registerCommand({
  name: "channelcreate",
  aliases: ["createchannel"],
  category: "Channel",
  description: "Instructions to create a WhatsApp channel",
  usage: ".channelcreate",
  handler: async ({ reply }) => {
    await reply(`📢 *Create a WhatsApp Channel*

1️⃣ Open WhatsApp
2️⃣ Tap *Updates* tab
3️⃣ Tap ➕ next to "Channels"
4️⃣ Tap *Create channel*
5️⃣ Add name, description, and icon
6️⃣ Tap *Create channel* ✅

💡 Channels are one-way broadcast — only admins post, followers read!${FOOTER}`);
  },
});

registerCommand({
  name: "channelname",
  aliases: ["setchannelname"],
  category: "Channel",
  description: "Set your bot's channel name",
  usage: ".channelname <name>",
  handler: async ({ sock, from, args, reply }) => {
    if (!from.endsWith("@newsletter")) return reply(`❌ This command only works inside a WhatsApp channel!${FOOTER}`);
    const name = args.join(" ");
    if (!name) return reply(`❓ Usage: .channelname <new name>${FOOTER}`);
    try {
      await (sock as any).updateNewsletterMetadata(from, { name });
      await reply(`✅ Channel name set to: *${name}*${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "channeldescription",
  aliases: ["setcanneldesc", "channeldesc"],
  category: "Channel",
  description: "Set your channel description",
  usage: ".channeldescription <text>",
  handler: async ({ sock, from, args, reply }) => {
    if (!from.endsWith("@newsletter")) return reply(`❌ This command only works inside a WhatsApp channel!${FOOTER}`);
    const desc = args.join(" ");
    if (!desc) return reply(`❓ Usage: .channeldescription <description>${FOOTER}`);
    try {
      await (sock as any).updateNewsletterMetadata(from, { description: desc });
      await reply(`✅ Channel description updated!${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "channelmute",
  aliases: ["mutechannel"],
  category: "Channel",
  description: "Mute a channel",
  usage: ".channelmute <channel jid>",
  handler: async ({ sock, from, args, reply }) => {
    const jid = args[0] || from;
    try {
      await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid);
      await reply(`🔇 Channel muted!${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed to mute: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "channelunmute",
  aliases: ["unmutechannel"],
  category: "Channel",
  description: "Unmute a channel",
  usage: ".channelunmute <channel jid>",
  handler: async ({ sock, from, args, reply }) => {
    const jid = args[0] || from;
    try {
      await sock.chatModify({ mute: null }, jid);
      await reply(`🔊 Channel unmuted!${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});
