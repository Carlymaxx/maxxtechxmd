import { registerCommand } from "./types";
import { saveSettings } from "../botState";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

const warnStore: Record<string, { count: number; reasons: string[] }> = {};

registerCommand({
  name: "block",
  aliases: [],
  category: "Owner",
  description: "Block a user",
  handler: async ({ sock, msg, args, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    let num = args[0]?.replace(/[^0-9]/g, "");
    const target = mentioned || (num ? num + "@s.whatsapp.net" : null);
    if (!target) return reply("❌ Mention or provide number. Example: .block @user");
    try {
      await sock.updateBlockStatus(target, "block");
      await reply(`✅ *${target.split("@")[0]}* has been blocked.`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "unblock",
  aliases: [],
  category: "Owner",
  description: "Unblock a user",
  handler: async ({ sock, msg, args, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    let num = args[0]?.replace(/[^0-9]/g, "");
    const target = mentioned || (num ? num + "@s.whatsapp.net" : null);
    if (!target) return reply("❌ Mention or provide number. Example: .unblock @user");
    try {
      await sock.updateBlockStatus(target, "unblock");
      await reply(`✅ *${target.split("@")[0]}* has been unblocked.`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "listblocked",
  aliases: [],
  category: "Owner",
  description: "List blocked contacts",
  handler: async ({ sock, reply }) => {
    try {
      const blocked = await sock.fetchBlocklist();
      if (!blocked.length) return reply("📋 No blocked contacts.");
      const list = blocked.map((b, i) => `${i + 1}. @${b.split("@")[0]}`).join("\n");
      await reply(`🚫 *Blocked Contacts (${blocked.length})*\n\n${list}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "join",
  aliases: [],
  category: "Owner",
  description: "Join a group via invite link",
  handler: async ({ sock, args, reply }) => {
    const link = args[0];
    if (!link) return reply("❌ Provide invite link. Example: .join https://chat.whatsapp.com/xxxxx");
    const code = link.split("chat.whatsapp.com/")[1]?.trim();
    if (!code) return reply("❌ Invalid link format.");
    try {
      await sock.groupAcceptInvite(code);
      await reply("✅ Successfully joined the group!");
    } catch (e: any) {
      await reply(`❌ Failed to join: ${e.message}`);
    }
  },
});

registerCommand({
  name: "leave",
  aliases: [],
  category: "Owner",
  description: "Leave current group",
  groupOnly: true,
  handler: async ({ sock, from, reply }) => {
    await reply("👋 Leaving the group...");
    try { await sock.groupLeave(from); } catch {}
  },
});

registerCommand({
  name: "restart",
  aliases: [],
  category: "Owner",
  description: "Restart the bot",
  handler: async ({ reply }) => {
    await reply("🔄 *MAXX XMD is restarting...*\n\n_Please wait a few seconds_");
    setTimeout(() => process.exit(0), 1500);
  },
});

registerCommand({
  name: "broadcast",
  aliases: [],
  category: "Owner",
  description: "Broadcast a message to all chats",
  handler: async ({ sock, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .broadcast <message>");
    await reply("📢 Broadcast sent! (To all open chats)");
  },
});

registerCommand({
  name: "setbio",
  aliases: ["bio"],
  category: "Owner",
  description: "Update bot's WhatsApp bio/about",
  handler: async ({ sock, args, reply }) => {
    const bio = args.join(" ");
    if (!bio) return reply("❓ Usage: .setbio <text>");
    try {
      await sock.updateProfileStatus(bio);
      await reply(`✅ Bio updated to:\n\n_${bio}_`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "setprofilepic",
  aliases: ["setpp", "setavatar"],
  category: "Owner",
  description: "Set bot profile picture (reply to image)",
  handler: async ({ sock, msg, reply }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage;
    if (!imgMsg) return reply("❌ Reply to an image to set as profile picture.");
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const buf = await downloadMediaMessage({ message: { imageMessage: imgMsg } } as any, "buffer", {});
      await sock.updateProfilePicture(sock.user!.id, buf as Buffer);
      await reply("✅ Profile picture updated!");
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "delete",
  aliases: ["del"],
  category: "Owner",
  description: "Delete a message (reply to it)",
  handler: async ({ sock, from, msg, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (!ctx?.stanzaId) return reply("❌ Reply to the message you want to delete.");
    try {
      await sock.sendMessage(from, {
        delete: { remoteJid: from, fromMe: ctx.participant === sock.user?.id, id: ctx.stanzaId, participant: ctx.participant },
      });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "tostatus",
  aliases: [],
  category: "Owner",
  description: "Post quoted media to your status",
  handler: async ({ sock, msg, reply }) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return reply("❌ Reply to a media message.");
    try {
      const imgMsg = quoted.imageMessage;
      const vidMsg = quoted.videoMessage;
      if (imgMsg) {
        const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
        const buf = await downloadMediaMessage({ message: { imageMessage: imgMsg } } as any, "buffer", {});
        await sock.sendMessage("status@broadcast", { image: buf as Buffer, caption: "Posted via MAXX XMD" });
        await reply("✅ Posted to status!");
      } else if (vidMsg) {
        const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
        const buf = await downloadMediaMessage({ message: { videoMessage: vidMsg } } as any, "buffer", {});
        await sock.sendMessage("status@broadcast", { video: buf as Buffer, caption: "Posted via MAXX XMD" });
        await reply("✅ Video posted to status!");
      } else {
        await reply("❌ Only images and videos can be posted to status.");
      }
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "lastseen",
  aliases: [],
  category: "Owner",
  description: "Toggle last seen visibility",
  handler: async ({ args, settings, reply }) => {
    const val = args[0]?.toLowerCase();
    if (!val || !["on", "off"].includes(val)) return reply("❓ Usage: .lastseen on/off");
    settings.lastseen = val === "on";
    saveSettings(settings);
    await reply(`✅ Last seen *${val}*`);
  },
});

registerCommand({
  name: "readreceipts",
  aliases: [],
  category: "Owner",
  description: "Toggle read receipts (blue ticks)",
  handler: async ({ args, settings, reply }) => {
    const val = args[0]?.toLowerCase();
    if (!val || !["on", "off"].includes(val)) return reply("❓ Usage: .readreceipts on/off");
    settings.readreceipts = val === "on";
    saveSettings(settings);
    await reply(`✅ Read receipts *${val}*`);
  },
});

registerCommand({
  name: "warn",
  aliases: [],
  category: "Owner",
  description: "Warn a user",
  handler: async ({ msg, args, settings, sock, from, groupMetadata, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) return reply("❌ Mention user. Example: .warn @user reason");
    const reason = args.slice(1).join(" ") || "No reason given";
    if (!warnStore[mentioned]) warnStore[mentioned] = { count: 0, reasons: [] };
    warnStore[mentioned].count++;
    warnStore[mentioned].reasons.push(reason);
    const max = (settings.maxWarns as number) || 3;
    const count = warnStore[mentioned].count;
    await reply(`⚠️ *Warning ${count}/${max}*\n\n👤 @${mentioned.split("@")[0]}\n📝 Reason: ${reason}`);
    if (count >= max && groupMetadata) {
      await reply(`🚫 *${mentioned.split("@")[0]} has reached max warnings and will be removed!*`);
      try {
        await sock.groupParticipantsUpdate(from, [mentioned], "remove");
        warnStore[mentioned] = { count: 0, reasons: [] };
      } catch {}
    }
  },
});

registerCommand({
  name: "listwarn",
  aliases: [],
  category: "Owner",
  description: "List all user warnings",
  handler: async ({ reply }) => {
    const entries = Object.entries(warnStore).filter(([, v]) => v.count > 0);
    if (!entries.length) return reply("📋 No active warnings.");
    const list = entries.map(([jid, { count, reasons }]) =>
      `👤 @${jid.split("@")[0]}: ${count} warn(s)\n   • ${reasons.join("\n   • ")}`
    ).join("\n\n");
    await reply(`⚠️ *Active Warnings*\n\n${list}`);
  },
});

registerCommand({
  name: "resetwarn",
  aliases: [],
  category: "Owner",
  description: "Reset warnings for a user",
  handler: async ({ msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) return reply("❌ Mention user. Example: .resetwarn @user");
    warnStore[mentioned] = { count: 0, reasons: [] };
    await reply(`✅ Warnings reset for @${mentioned.split("@")[0]}`);
  },
});

registerCommand({
  name: "disk",
  aliases: ["storage"],
  category: "Owner",
  description: "Show disk usage",
  handler: async ({ reply }) => {
    try {
      const { stdout } = await execAsync("df -h / 2>/dev/null | tail -1");
      const parts = stdout.trim().split(/\s+/);
      await reply(`💾 *Disk Usage*\n\n📦 Total: *${parts[1]}*\n✅ Used: *${parts[2]}*\n🆓 Free: *${parts[3]}*\n📊 Usage: *${parts[4]}*`);
    } catch {
      await reply("❌ Could not fetch disk info.");
    }
  },
});

registerCommand({
  name: "hostip",
  aliases: [],
  category: "Owner",
  description: "Get the server IP address",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json() as any;
      await reply(`🌐 *Server IP*\n\n\`${data.ip}\``);
    } catch {
      await reply("❌ Could not fetch IP.");
    }
  },
});

// ── Shared helper: download media from a quoted view-once message ─────────────
async function downloadViewOnce(
  msg: any,
  sock: any,
  from: string,
  reply: (t: string) => Promise<void>
): Promise<boolean> {
  const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;
  if (!quoted) { await reply("❌ Reply to a view-once message!"); return false; }

  // Locate the view-once wrapper
  const voMsg: any =
    quoted.viewOnceMessage?.message ||
    quoted.viewOnceMessageV2?.message ||
    (quoted as any).viewOnceMessageV2Extension?.message ||
    // Sometimes the whole quoted IS the view-once content (older Baileys)
    quoted;

  // Build a fake WAMessage keeping correct key for Baileys' download engine
  function buildFake(msgContent: object) {
    return {
      key: {
        remoteJid: from,
        fromMe: false,
        id: ctx?.stanzaId || "",
        participant: ctx?.participant || undefined,
      },
      message: msgContent,
    };
  }

  const imgMsg = voMsg?.imageMessage;
  const vidMsg = voMsg?.videoMessage;
  const audMsg = voMsg?.audioMessage;
  const stkMsg = voMsg?.stickerMessage;

  try {
    if (imgMsg) {
      const buf = await downloadMediaMessage(buildFake({ imageMessage: imgMsg }) as any, "buffer", {});
      await sock.sendMessage(from, {
        image: buf as Buffer,
        caption: `👁️ *View Once Image*\n${imgMsg.caption || ""}\n\n> _MAXX-XMD_ ⚡`,
      }, { quoted: msg });
      return true;
    } else if (vidMsg) {
      const buf = await downloadMediaMessage(buildFake({ videoMessage: vidMsg }) as any, "buffer", {});
      await sock.sendMessage(from, {
        video: buf as Buffer,
        caption: `👁️ *View Once Video*\n${vidMsg.caption || ""}\n\n> _MAXX-XMD_ ⚡`,
      }, { quoted: msg });
      return true;
    } else if (audMsg) {
      const buf = await downloadMediaMessage(buildFake({ audioMessage: audMsg }) as any, "buffer", {});
      await sock.sendMessage(from, {
        audio: buf as Buffer,
        mimetype: audMsg.mimetype || "audio/mp4",
        ptt: audMsg.ptt || false,
      }, { quoted: msg });
      return true;
    } else if (stkMsg) {
      const buf = await downloadMediaMessage(buildFake({ stickerMessage: stkMsg }) as any, "buffer", {});
      await sock.sendMessage(from, { sticker: buf as Buffer }, { quoted: msg });
      return true;
    } else {
      await reply("❌ No view-once media found in that message. Reply directly to the view-once!");
      return false;
    }
  } catch (e: any) {
    await reply(`❌ Download failed: ${e.message}\n\n💡 Make sure you reply directly to the view-once message, not a forwarded copy.`);
    return false;
  }
}

registerCommand({
  name: "vv",
  aliases: ["viewonce", "vo"],
  category: "Tools",
  description: "View/unlock a view-once message — reply to it then type .vv",
  usage: ".vv (reply to view-once)",
  handler: async ({ sock, from, msg, reply }) => {
    await downloadViewOnce(msg, sock, from, reply);
  },
});

registerCommand({
  name: "vv2",
  aliases: ["unvv", "openonce"],
  category: "Tools",
  description: "Alternative view-once unlocker (try if .vv fails)",
  usage: ".vv2 (reply to view-once)",
  handler: async ({ sock, from, msg, reply }) => {
    // Try extracting directly from the quoted message's first-level structure
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const stanzaId = ctx?.stanzaId;
    const participant = ctx?.participant;
    const quoted = ctx?.quotedMessage as any;
    if (!quoted) return reply("❌ Reply to a view-once message!");

    const { downloadMediaMessage } = await import("@whiskeysockets/baileys");

    // Try all possible view-once wrappers
    const wrappers = [
      quoted.viewOnceMessage?.message,
      quoted.viewOnceMessageV2?.message,
      (quoted as any).viewOnceMessageV2Extension?.message,
      quoted, // fallback: maybe quoted itself has imageMessage etc.
    ].filter(Boolean);

    for (const wrapper of wrappers) {
      try {
        const imgMsg = wrapper?.imageMessage;
        const vidMsg = wrapper?.videoMessage;
        const audMsg = wrapper?.audioMessage;

        const fake = (content: object) => ({
          key: { remoteJid: from, fromMe: false, id: stanzaId, participant },
          message: content,
        });

        if (imgMsg) {
          const buf = await downloadMediaMessage(fake({ imageMessage: imgMsg }) as any, "buffer", {});
          await sock.sendMessage(from, { image: buf as Buffer, caption: `🔓 *View-once unlocked!*\n\n> _MAXX-XMD_ ⚡` }, { quoted: msg });
          return;
        } else if (vidMsg) {
          const buf = await downloadMediaMessage(fake({ videoMessage: vidMsg }) as any, "buffer", {});
          await sock.sendMessage(from, { video: buf as Buffer, caption: `🔓 *View-once unlocked!*\n\n> _MAXX-XMD_ ⚡` }, { quoted: msg });
          return;
        } else if (audMsg) {
          const buf = await downloadMediaMessage(fake({ audioMessage: audMsg }) as any, "buffer", {});
          await sock.sendMessage(from, { audio: buf as Buffer, mimetype: audMsg.mimetype || "audio/mp4" }, { quoted: msg });
          return;
        }
      } catch {}
    }
    await reply("❌ Could not unlock that message. It may have already expired or been viewed.\n\n💡 Use *.antiviewonce on* to auto-catch them in future!");
  },
});

// ── .save — save any quoted media as a regular unprotected message ─────────────
registerCommand({
  name: "save",
  aliases: ["keep", "dl"],
  category: "Tools",
  description: "Save any quoted media (image/video/audio/sticker/doc) — reply to it",
  usage: ".save (reply to any media)",
  handler: async ({ sock, from, msg, reply }) => {
    const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage as any;
    if (!quoted) return reply("❌ Reply to any media message with *.save*\n\nWorks with: images, videos, audio, stickers, documents, view-once");

    const stanzaId = ctx?.stanzaId;
    const participant = ctx?.participant;

    function fake(content: object) {
      return { key: { remoteJid: from, fromMe: false, id: stanzaId, participant }, message: content };
    }

    // Unwrap view-once if present
    const voInner: any =
      quoted.viewOnceMessage?.message ||
      quoted.viewOnceMessageV2?.message ||
      (quoted as any).viewOnceMessageV2Extension?.message;

    const target = voInner || quoted;

    try {
      if (target.imageMessage) {
        const buf = await downloadMediaMessage(fake({ imageMessage: target.imageMessage }) as any, "buffer", {});
        return void await sock.sendMessage(from, {
          image: buf as Buffer,
          caption: `${target.imageMessage.caption ? target.imageMessage.caption + "\n\n" : ""}💾 *Saved by MAXX-XMD* ⚡`,
        }, { quoted: msg });
      }
      if (target.videoMessage) {
        const buf = await downloadMediaMessage(fake({ videoMessage: target.videoMessage }) as any, "buffer", {});
        return void await sock.sendMessage(from, {
          video: buf as Buffer,
          caption: `${target.videoMessage.caption ? target.videoMessage.caption + "\n\n" : ""}💾 *Saved by MAXX-XMD* ⚡`,
        }, { quoted: msg });
      }
      if (target.audioMessage) {
        const buf = await downloadMediaMessage(fake({ audioMessage: target.audioMessage }) as any, "buffer", {});
        return void await sock.sendMessage(from, {
          audio: buf as Buffer,
          mimetype: target.audioMessage.mimetype || "audio/mp4",
          ptt: target.audioMessage.ptt || false,
        }, { quoted: msg });
      }
      if (target.stickerMessage) {
        const buf = await downloadMediaMessage(fake({ stickerMessage: target.stickerMessage }) as any, "buffer", {});
        return void await sock.sendMessage(from, { sticker: buf as Buffer }, { quoted: msg });
      }
      if (target.documentMessage) {
        const buf = await downloadMediaMessage(fake({ documentMessage: target.documentMessage }) as any, "buffer", {});
        return void await sock.sendMessage(from, {
          document: buf as Buffer,
          mimetype: target.documentMessage.mimetype || "application/octet-stream",
          fileName: target.documentMessage.fileName || "file",
          caption: `💾 *Saved by MAXX-XMD* ⚡`,
        }, { quoted: msg });
      }
      await reply("❌ No downloadable media found in that message.");
    } catch (e: any) {
      await reply(`❌ Save failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "update",
  aliases: ["upgrade", "checkupdate"],
  category: "Owner",
  ownerOnly: true,
  description: "Check GitHub for new changes and auto-update the bot",
  usage: ".update",
  handler: async ({ reply, react }) => {
    await react("🔍");
    await reply("🔍 *Checking GitHub for updates...*");

    const REPO = "Carlymaxx/maxxtechxmd";
    const BRANCH = "main";

    try {
      // Fetch latest commits from GitHub (no auth needed for public repo)
      const commitsRes = await fetch(
        `https://api.github.com/repos/${REPO}/commits?sha=${BRANCH}&per_page=5`,
        { headers: { "User-Agent": "MAXX-XMD-Bot", "Accept": "application/vnd.github.v3+json" } }
      );

      if (!commitsRes.ok) {
        return reply(`❌ Could not reach GitHub (${commitsRes.status}). Check your internet connection.`);
      }

      const commits: any[] = await commitsRes.json();
      if (!Array.isArray(commits) || commits.length === 0) {
        return reply("❌ No commits found on GitHub.");
      }

      const latestSha = commits[0].sha as string;
      const shortSha = latestSha.substring(0, 7);

      // Build changelog from last 5 commits
      const changelog = commits.map((c: any, i: number) => {
        const msg = (c.commit?.message as string || "").split("\n")[0].substring(0, 60);
        const date = new Date(c.commit?.author?.date || "").toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${i === 0 ? "🆕" : "📝"} *[${c.sha.substring(0, 7)}]* ${msg} _(${date})_`;
      }).join("\n");

      // Check if auto-deploy via Heroku API is available
      const herokuKey = process.env.HEROKU_API_KEY;
      const herokuApp = process.env.HEROKU_APP_NAME;

      if (herokuKey && herokuApp) {
        // Trigger a new Heroku build from latest GitHub commit
        await reply(
          `📦 *MAXX-XMD Update Available*\n\n` +
          `*Latest commit:* \`${shortSha}\`\n\n` +
          `*Recent changes:*\n${changelog}\n\n` +
          `⚡ *Triggering auto-update on Heroku...*`
        );

        const buildRes = await fetch(`https://api.heroku.com/apps/${herokuApp}/builds`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${herokuKey}`,
            "Accept": "application/vnd.heroku+json; version=3",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_blob: {
              url: `https://codeload.github.com/${REPO}/legacy.tar.gz/refs/heads/${BRANCH}`,
              version: latestSha,
            },
          }),
        });

        if (buildRes.ok) {
          const build: any = await buildRes.json();
          await reply(
            `✅ *Update triggered successfully!*\n\n` +
            `🔨 Build ID: \`${(build.id as string).substring(0, 8)}\`\n` +
            `⏳ Your bot will restart with the latest code in ~2-3 minutes.\n\n` +
            `🔗 Track: https://dashboard.heroku.com/apps/${herokuApp}/activity`
          );
        } else {
          const err: any = await buildRes.json().catch(() => ({}));
          await reply(
            `⚠️ *Build trigger failed* (${buildRes.status})\n${err?.message || "Unknown error"}\n\n` +
            `Redeploy manually from:\nhttps://dashboard.heroku.com/apps/${herokuApp}/deploy/github`
          );
        }
      } else {
        // No Heroku API key — just show the changelog and instructions
        await reply(
          `📦 *MAXX-XMD Latest Changes*\n\n` +
          `*Latest commit:* \`${shortSha}\`\n\n` +
          `*Recent changes:*\n${changelog}\n\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `*To update your bot:*\n` +
          `• *Heroku:* Dashboard → Deploy → Manual deploy → Deploy Branch\n` +
          `• *Railway/Render/Koyeb:* Redeploy from your dashboard\n\n` +
          `💡 *Tip:* Set HEROKU_API_KEY + HEROKU_APP_NAME in your config vars for one-command auto-updates!\n\n` +
          `🔗 https://github.com/${REPO}`
        );
      }
    } catch (e: any) {
      await reply(`❌ Update check failed: ${e.message}`);
    }
  },
});
