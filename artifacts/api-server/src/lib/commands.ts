import type { WASocket, WAMessage, proto } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import sharp from "sharp";
import { loadSettings, saveSettings } from "./botState.js";
import { logger } from "./logger.js";

type Sock = WASocket;

interface CmdContext {
  jid: string;
  sender: string;
  isGroup: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  botIsAdmin: boolean;
  pushName: string;
  quoted: proto.IMessage | null | undefined;
  quotedMsg: WAMessage | null;
}

async function reply(sock: Sock, jid: string, text: string, quoted?: WAMessage) {
  await sock.sendMessage(jid, { text }, quoted ? { quoted } : undefined);
}

async function react(sock: Sock, msg: WAMessage, emoji: string) {
  await sock.sendMessage(msg.key.remoteJid!, {
    react: { text: emoji, key: msg.key },
  });
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function extractText(msg: WAMessage): string {
  const m = msg.message;
  if (!m) return "";
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    ""
  );
}

function getMentionedJids(args: string[]): string[] {
  return args
    .filter((a) => a.startsWith("@"))
    .map((a) => a.replace("@", "") + "@s.whatsapp.net");
}

const COMMANDS: Record<
  string,
  (sock: Sock, msg: WAMessage, args: string[], ctx: CmdContext) => Promise<void>
> = {
  // ──────────── GENERAL ────────────

  async menu(sock, msg, _args, ctx) {
    const settings = loadSettings();
    const p = settings.prefix || ".";
    const text = `
╔══════════════════════╗
║    *MAXX-XMD BOT*    ║
╚══════════════════════╝

👤 *Hello ${ctx.pushName}!*
🤖 Bot is *ONLINE* and ready.

╔══ 🔰 GENERAL ══╗
│ ${p}menu / ${p}help
│ ${p}ping
│ ${p}alive
│ ${p}owner
│ ${p}runtime
│ ${p}botinfo

╔══ 🖼 MEDIA ══╗
│ ${p}sticker (reply image/gif)
│ ${p}s (shortcut for sticker)
│ ${p}toimg (reply sticker)

╔══ 👥 GROUP ══╗
│ ${p}tagall — mention everyone
│ ${p}everyone — same as tagall
│ ${p}kick @user — remove member
│ ${p}add 254xxx — add member
│ ${p}promote @user — make admin
│ ${p}demote @user — remove admin
│ ${p}mute — mute group
│ ${p}unmute — unmute group
│ ${p}grouplink — get invite link
│ ${p}revoke — reset invite link
│ ${p}leave — bot leaves group

╔══ ⚙️ OWNER ══╗
│ ${p}broadcast — send to all
│ ${p}setprefix — change prefix
│ ${p}setname — change bot name

╔══ 🛠 UTILITY ══╗
│ ${p}delete / ${p}del — delete msg
│ ${p}react emoji — react to msg
│ ${p}getpp @user — get profile pic

Prefix: *${p}*  |  Made by *MAXX-XMD*
`.trim();
    await reply(sock, ctx.jid, text, msg);
  },

  async help(sock, msg, args, ctx) {
    return COMMANDS.menu(sock, msg, args, ctx);
  },

  async ping(sock, msg, _args, ctx) {
    const start = Date.now();
    await react(sock, msg, "⏱");
    const ms = Date.now() - start;
    await reply(sock, ctx.jid, `🏓 *Pong!*\nLatency: *${ms}ms*`, msg);
  },

  async alive(sock, msg, _args, ctx) {
    const uptime = formatUptime(process.uptime());
    await reply(
      sock,
      ctx.jid,
      `✅ *MAXX-XMD is ALIVE!*\n\n⏱ Uptime: *${uptime}*\n👤 User: *${ctx.pushName}*`,
      msg
    );
    await react(sock, msg, "✅");
  },

  async owner(sock, msg, _args, ctx) {
    const settings = loadSettings();
    const ownerNum = settings.ownerNumber || process.env.OWNER_NUMBER || "Unknown";
    await reply(
      sock,
      ctx.jid,
      `👑 *BOT OWNER*\n\nNumber: *+${ownerNum}*\n\nContact the owner for support.`,
      msg
    );
  },

  async runtime(sock, msg, _args, ctx) {
    const uptime = formatUptime(process.uptime());
    await reply(sock, ctx.jid, `⏱ *Bot Runtime:* ${uptime}`, msg);
  },

  async botinfo(sock, msg, _args, ctx) {
    const settings = loadSettings();
    const uptime = formatUptime(process.uptime());
    const mem = process.memoryUsage();
    const mbUsed = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const mbTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);
    await reply(
      sock,
      ctx.jid,
      `🤖 *BOT INFO*

Name: *${settings.botName || "MAXX-XMD"}*
Prefix: *${settings.prefix || "."}*
Uptime: *${uptime}*
RAM: *${mbUsed}MB / ${mbTotal}MB*
Platform: *${process.platform}*
Node: *${process.version}*`,
      msg
    );
  },

  // ──────────── MEDIA ────────────

  async sticker(sock, msg, args, ctx) {
    const target = ctx.quotedMsg || msg;
    const mtype = Object.keys(target.message || {})[0];
    const isImage = mtype === "imageMessage";
    const isVideo = mtype === "videoMessage";
    const isSticker = mtype === "stickerMessage";

    if (!isImage && !isVideo && !isSticker) {
      return reply(sock, ctx.jid, "❌ Reply to an image, gif, or video to make a sticker.", msg);
    }
    await react(sock, msg, "⏳");
    try {
      const buffer = await downloadMediaMessage(target, "buffer", {});
      let webpBuffer: Buffer;
      if (isVideo) {
        webpBuffer = await sharp(buffer as Buffer, { pages: -1 })
          .webp({ quality: 80 })
          .toBuffer();
      } else {
        webpBuffer = await sharp(buffer as Buffer)
          .webp({ quality: 80 })
          .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer();
      }
      await sock.sendMessage(ctx.jid, { sticker: webpBuffer }, { quoted: msg });
      await react(sock, msg, "✅");
    } catch (err) {
      logger.error({ err }, "Sticker creation failed");
      await reply(sock, ctx.jid, "❌ Failed to create sticker. Try with a smaller image.", msg);
      await react(sock, msg, "❌");
    }
  },

  async s(sock, msg, args, ctx) {
    return COMMANDS.sticker(sock, msg, args, ctx);
  },

  async toimg(sock, msg, _args, ctx) {
    const target = ctx.quotedMsg || msg;
    const mtype = Object.keys(target.message || {})[0];
    if (mtype !== "stickerMessage") {
      return reply(sock, ctx.jid, "❌ Reply to a sticker to convert it to image.", msg);
    }
    await react(sock, msg, "⏳");
    try {
      const buffer = await downloadMediaMessage(target, "buffer", {});
      const pngBuffer = await sharp(buffer as Buffer).png().toBuffer();
      await sock.sendMessage(ctx.jid, { image: pngBuffer, caption: "Sticker → Image" }, { quoted: msg });
      await react(sock, msg, "✅");
    } catch (err) {
      logger.error({ err }, "toimg failed");
      await reply(sock, ctx.jid, "❌ Failed to convert sticker.", msg);
    }
  },

  // ──────────── GROUP ────────────

  async tagall(sock, msg, args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    const groupMeta = await sock.groupMetadata(ctx.jid);
    const members = groupMeta.participants;
    const caption = args.join(" ") || "📢 *Attention everyone!*";
    const mentions = members.map((m) => m.id);
    const text = caption + "\n\n" + members.map((m) => `@${m.id.split("@")[0]}`).join(" ");
    await sock.sendMessage(ctx.jid, { text, mentions }, { quoted: msg });
  },

  async everyone(sock, msg, args, ctx) {
    return COMMANDS.tagall(sock, msg, args, ctx);
  },

  async kick(sock, msg, args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isAdmin) return reply(sock, ctx.jid, "❌ You must be an admin.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin to kick members.", msg);

    const mentions = ctx.quotedMsg
      ? [ctx.quotedMsg.key.participant || ctx.quotedMsg.key.remoteJid!]
      : getMentionedJids(args);

    if (!mentions.length) return reply(sock, ctx.jid, "❌ Mention or reply to a user to kick.", msg);
    await sock.groupParticipantsUpdate(ctx.jid, mentions, "remove");
    await reply(sock, ctx.jid, `✅ Kicked ${mentions.length} member(s).`, msg);
  },

  async add(sock, msg, args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isAdmin) return reply(sock, ctx.jid, "❌ You must be an admin.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin.", msg);
    if (!args[0]) return reply(sock, ctx.jid, "❌ Provide a number. E.g. .add 254712345678", msg);
    const num = args[0].replace(/\D/g, "") + "@s.whatsapp.net";
    const result = await sock.groupParticipantsUpdate(ctx.jid, [num], "add");
    const status = result[0]?.status;
    if (status === "200") {
      await reply(sock, ctx.jid, `✅ Added *+${args[0].replace(/\D/g, "")}* to the group.`, msg);
    } else {
      await reply(sock, ctx.jid, `❌ Could not add user. Status: ${status}`, msg);
    }
  },

  async promote(sock, msg, args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isAdmin) return reply(sock, ctx.jid, "❌ You must be an admin.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin.", msg);
    const mentions = ctx.quotedMsg
      ? [ctx.quotedMsg.key.participant || ctx.quotedMsg.key.remoteJid!]
      : getMentionedJids(args);
    if (!mentions.length) return reply(sock, ctx.jid, "❌ Mention or reply to a user to promote.", msg);
    await sock.groupParticipantsUpdate(ctx.jid, mentions, "promote");
    await reply(sock, ctx.jid, `✅ Promoted ${mentions.length} member(s) to admin.`, msg);
  },

  async demote(sock, msg, args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isAdmin) return reply(sock, ctx.jid, "❌ You must be an admin.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin.", msg);
    const mentions = ctx.quotedMsg
      ? [ctx.quotedMsg.key.participant || ctx.quotedMsg.key.remoteJid!]
      : getMentionedJids(args);
    if (!mentions.length) return reply(sock, ctx.jid, "❌ Mention or reply to a user to demote.", msg);
    await sock.groupParticipantsUpdate(ctx.jid, mentions, "demote");
    await reply(sock, ctx.jid, `✅ Demoted ${mentions.length} member(s).`, msg);
  },

  async mute(sock, msg, _args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isAdmin) return reply(sock, ctx.jid, "❌ You must be an admin.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin.", msg);
    await sock.groupSettingUpdate(ctx.jid, "announcement");
    await reply(sock, ctx.jid, "🔇 Group muted — only admins can send messages.", msg);
  },

  async unmute(sock, msg, _args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isAdmin) return reply(sock, ctx.jid, "❌ You must be an admin.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin.", msg);
    await sock.groupSettingUpdate(ctx.jid, "not_announcement");
    await reply(sock, ctx.jid, "🔊 Group unmuted — everyone can send messages.", msg);
  },

  async grouplink(sock, msg, _args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin to get the invite link.", msg);
    const code = await sock.groupInviteCode(ctx.jid);
    await reply(sock, ctx.jid, `🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}`, msg);
  },

  async revoke(sock, msg, _args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isAdmin) return reply(sock, ctx.jid, "❌ You must be an admin.", msg);
    if (!ctx.botIsAdmin) return reply(sock, ctx.jid, "❌ I must be an admin.", msg);
    await sock.groupRevokeInvite(ctx.jid);
    await reply(sock, ctx.jid, "✅ Invite link has been reset.", msg);
  },

  async leave(sock, msg, _args, ctx) {
    if (!ctx.isGroup) return reply(sock, ctx.jid, "❌ Group only command.", msg);
    if (!ctx.isOwner) return reply(sock, ctx.jid, "❌ Owner only command.", msg);
    await reply(sock, ctx.jid, "👋 Goodbye! Leaving this group...", msg);
    await new Promise((r) => setTimeout(r, 1500));
    await sock.groupLeave(ctx.jid);
  },

  // ──────────── OWNER ────────────

  async broadcast(sock, msg, args, ctx) {
    if (!ctx.isOwner) return reply(sock, ctx.jid, "❌ Owner only command.", msg);
    const text = args.join(" ");
    if (!text) return reply(sock, ctx.jid, "❌ Provide a message to broadcast.", msg);
    const chats = await sock.groupFetchAllParticipating();
    const groups = Object.keys(chats);
    let sent = 0;
    for (const g of groups) {
      try {
        await sock.sendMessage(g, { text: `📢 *Broadcast:*\n\n${text}` });
        sent++;
        await new Promise((r) => setTimeout(r, 500));
      } catch {}
    }
    await reply(sock, ctx.jid, `✅ Broadcast sent to *${sent}* groups.`, msg);
  },

  async setprefix(sock, msg, args, ctx) {
    if (!ctx.isOwner) return reply(sock, ctx.jid, "❌ Owner only command.", msg);
    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 3) {
      return reply(sock, ctx.jid, "❌ Provide a valid prefix (1-3 chars). E.g. .setprefix !", msg);
    }
    const settings = loadSettings();
    settings.prefix = newPrefix;
    saveSettings(settings);
    await reply(sock, ctx.jid, `✅ Prefix changed to *${newPrefix}*`, msg);
  },

  async setname(sock, msg, args, ctx) {
    if (!ctx.isOwner) return reply(sock, ctx.jid, "❌ Owner only command.", msg);
    const name = args.join(" ");
    if (!name) return reply(sock, ctx.jid, "❌ Provide a name. E.g. .setname MyBot", msg);
    const settings = loadSettings();
    settings.botName = name;
    saveSettings(settings);
    await reply(sock, ctx.jid, `✅ Bot name changed to *${name}*`, msg);
  },

  // ──────────── UTILITY ────────────

  async delete(sock, msg, _args, ctx) {
    if (!ctx.quotedMsg) return reply(sock, ctx.jid, "❌ Reply to a message to delete it.", msg);
    const q = ctx.quotedMsg;
    const qSender = q.key.participant || q.key.remoteJid!;
    const botId = sock.user?.id?.replace(/:.*@/, "@") || "";
    const isQFromBot = qSender === botId || q.key.fromMe;
    if (!isQFromBot && !ctx.isAdmin && !ctx.isOwner) {
      return reply(sock, ctx.jid, "❌ You can only delete your own messages or bot messages.", msg);
    }
    await sock.sendMessage(ctx.jid, { delete: q.key });
    await sock.sendMessage(ctx.jid, { delete: msg.key });
  },

  async del(sock, msg, args, ctx) {
    return COMMANDS.delete(sock, msg, args, ctx);
  },

  async react(sock, msg, args, ctx) {
    if (!ctx.quotedMsg) return reply(sock, ctx.jid, "❌ Reply to a message to react to it.", msg);
    const emoji = args[0];
    if (!emoji) return reply(sock, ctx.jid, "❌ Provide an emoji. E.g. .react 🔥", msg);
    await sock.sendMessage(ctx.jid, { react: { text: emoji, key: ctx.quotedMsg.key } });
  },

  async getpp(sock, msg, args, ctx) {
    let target: string;
    if (ctx.quotedMsg) {
      target = ctx.quotedMsg.key.participant || ctx.quotedMsg.key.remoteJid!;
    } else if (args[0]) {
      target = args[0].replace("@", "") + "@s.whatsapp.net";
    } else {
      target = ctx.sender;
    }
    try {
      const pp = await sock.profilePictureUrl(target, "image");
      await sock.sendMessage(ctx.jid, { image: { url: pp }, caption: `📷 Profile picture of @${target.split("@")[0]}`, mentions: [target] }, { quoted: msg });
    } catch {
      await reply(sock, ctx.jid, "❌ No profile picture found or it's private.", msg);
    }
  },
};

export async function handleMessage(sock: Sock, msg: WAMessage): Promise<void> {
  try {
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const settings = loadSettings();
    const prefix = settings.prefix || ".";
    const jid = msg.key.remoteJid!;
    if (!jid) return;

    const text = extractText(msg);
    if (!text.startsWith(prefix)) return;

    const [rawCmd, ...args] = text.slice(prefix.length).trim().split(/\s+/);
    const command = rawCmd?.toLowerCase();
    if (!command || !COMMANDS[command]) return;

    const sender = msg.key.participant || msg.key.remoteJid!;
    const isGroup = jid.endsWith("@g.us");
    const ownerRaw = (settings.ownerNumber || process.env.OWNER_NUMBER || "").replace(/\D/g, "");
    const isOwner = ownerRaw
      ? sender.replace(/@.+/, "") === ownerRaw ||
        sender === ownerRaw + "@s.whatsapp.net"
      : false;

    let isAdmin = false;
    let botIsAdmin = false;
    if (isGroup) {
      try {
        const meta = await sock.groupMetadata(jid);
        const admins = meta.participants.filter((p) => p.admin).map((p) => p.id);
        const botId = sock.user?.id?.replace(/:.*@/, "@") || "";
        isAdmin = admins.includes(sender);
        botIsAdmin = admins.includes(botId);
      } catch {}
    }

    const pushName = msg.pushName || sender.split("@")[0];

    const quotedMsg: WAMessage | null =
      (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        ? ({
            key: {
              remoteJid: jid,
              fromMe: msg.message.extendedTextMessage.contextInfo.participant === sock.user?.id,
              id: msg.message.extendedTextMessage.contextInfo.stanzaId,
              participant: msg.message.extendedTextMessage.contextInfo.participant,
            },
            message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
          } as WAMessage)
        : null);

    const ctx: CmdContext = {
      jid,
      sender,
      isGroup,
      isOwner,
      isAdmin,
      botIsAdmin,
      pushName,
      quoted: msg.message,
      quotedMsg,
    };

    await COMMANDS[command](sock, msg, args, ctx);
  } catch (err) {
    logger.error({ err, cmd: "handleMessage" }, "Command error");
  }
}
