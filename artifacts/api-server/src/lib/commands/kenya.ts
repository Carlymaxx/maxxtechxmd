import { registerCommand } from "./types";
import fs from "fs";
import path from "path";
import os from "os";
import { WORKSPACE_ROOT, getGroupActivity } from "../botState";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";
const CONFESSION_FILE = path.join(WORKSPACE_ROOT, "confessions.json");
function loadConfessions(): Record<string, { groupJid: string; pending: string[] }> {
  try { return JSON.parse(fs.readFileSync(CONFESSION_FILE, "utf8")); } catch { return {}; }
}
function saveConfessions(d: Record<string, { groupJid: string; pending: string[] }>) {
  fs.writeFileSync(CONFESSION_FILE, JSON.stringify(d, null, 2));
}

async function ffmpegConvert(inputBuf: Buffer, inputExt: string, outputExt: string, extraArgs: string[] = []): Promise<Buffer> {
  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const execFileAsync = promisify(execFile);
  const tmpIn = path.join(os.tmpdir(), `maxx_kn_${Date.now()}.${inputExt}`);
  const tmpOut = path.join(os.tmpdir(), `maxx_kn_${Date.now()}.${outputExt}`);
  fs.writeFileSync(tmpIn, inputBuf);
  try {
    await execFileAsync("ffmpeg", ["-i", tmpIn, ...extraArgs, tmpOut, "-y"], { timeout: 60000 });
    return fs.readFileSync(tmpOut);
  } finally {
    try { fs.unlinkSync(tmpIn); } catch {}
    try { fs.unlinkSync(tmpOut); } catch {}
  }
}

// ── .inactive ─────────────────────────────────────────────────────────────────
registerCommand({
  name: "inactive",
  aliases: ["ghostlist", "sleeping", "ghosts"],
  category: "Group",
  description: "List group members who haven't sent a message in N days (default 7)",
  usage: ".inactive [days]",
  handler: async ({ sock, from, args, reply, msg }) => {
    if (!from.endsWith("@g.us")) return reply(`❌ This command only works in groups!${FOOTER}`);
    const days = parseInt(args[0] || "7");
    if (isNaN(days) || days < 1) return reply(`❓ Usage: .inactive [days] (e.g. .inactive 7)${FOOTER}`);

    try {
      const meta = await sock.groupMetadata(from);
      const participants = meta.participants;
      const groupActivity = getGroupActivity(from);
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

      const inactive: string[] = [];
      const active: string[] = [];

      for (const p of participants) {
        const jid = p.id;
        const entry = groupActivity[jid];
        if (!entry || entry.lastSeen < cutoff) {
          inactive.push(jid);
        } else {
          active.push(jid);
        }
      }

      if (inactive.length === 0) {
        return reply(`✅ *No Inactive Members!*\n\nEveryone has been active in the last *${days} days*. Great group! 🔥${FOOTER}`);
      }

      const inactiveList = inactive.slice(0, 50).map((jid, i) => {
        const entry = groupActivity[jid];
        const num = jid.split("@")[0];
        const ago = entry
          ? `${Math.floor((Date.now() - entry.lastSeen) / (24 * 60 * 60 * 1000))}d ago`
          : "never";
        return `${i + 1}. @${num} — last seen: *${ago}*`;
      }).join("\n");

      const text =
        `╔═══════════════════════╗\n` +
        `║  👻 *INACTIVE MEMBERS* 👻\n` +
        `╚═══════════════════════╝\n\n` +
        `📊 *${inactive.length}* inactive / *${active.length}* active (last ${days} days)\n\n` +
        inactiveList +
        (inactive.length > 50 ? `\n\n_...and ${inactive.length - 50} more_` : "") +
        FOOTER;

      await sock.sendMessage(from, {
        text,
        mentions: inactive.slice(0, 50),
      }, { quoted: msg });

    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── .watermark ────────────────────────────────────────────────────────────────
registerCommand({
  name: "watermark",
  aliases: ["wm", "brandimage", "stamp"],
  category: "Photo",
  description: "Add a text watermark to an image — reply to image",
  usage: ".watermark [text] (reply to image)",
  handler: async ({ sock, from, msg, args, settings, reply }) => {
    const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.watermark [text]*${FOOTER}`);

    const text = args.join(" ") || settings.botName || "MAXX-XMD";
    try {
      const fakeMsg = m?.imageMessage ? msg : { ...msg, message: { imageMessage: imgMsg } } as any;
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {}) as Buffer;

      const outBuf = await ffmpegConvert(buf, "jpg", "jpg", [
        "-vf",
        `drawtext=text='${text.replace(/'/g, "\\'")}':fontcolor=white@0.7:fontsize=28:x=w-tw-20:y=h-th-20:shadowcolor=black@0.8:shadowx=2:shadowy=2:box=1:boxcolor=black@0.3:boxborderw=6`,
        "-quality", "95",
      ]);

      await sock.sendMessage(from, {
        image: outBuf,
        caption: `🖊️ *Watermark:* "${text}"${FOOTER}`,
      }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── .setconfessgroup ─────────────────────────────────────────────────────────
registerCommand({
  name: "setconfessgroup",
  aliases: ["confessiongroup", "setconfess"],
  category: "Group",
  description: "Set this group as the confession destination (owner/admin only)",
  handler: async ({ from, sender, sock, msg, reply }) => {
    if (!from.endsWith("@g.us")) return reply(`❌ Run this inside the group you want confessions posted to.${FOOTER}`);
    const meta = await sock.groupMetadata(from);
    const isAdmin = meta.participants.find(p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin"));
    if (!isAdmin) return reply(`❌ Only group admins can set the confession group!${FOOTER}`);

    const confs = loadConfessions();
    confs["_target"] = { groupJid: from, pending: [] };
    saveConfessions(confs);

    await reply(
      `✅ *Confession Group Set!*\n\n` +
      `📢 Group: *${meta.subject}*\n\n` +
      `Members can now DM the bot with:\n` +
      `*.confess <their message>*\n\n` +
      `It will be posted here anonymously. 🤫${FOOTER}`
    );
  },
});

// ── .confess ──────────────────────────────────────────────────────────────────
registerCommand({
  name: "confess",
  aliases: ["confession", "anonymous", "anon"],
  category: "Fun",
  description: "Send an anonymous confession to the group (DM the bot)",
  usage: ".confess <your message>",
  handler: async ({ sock, from, msg, args, reply }) => {
    if (from.endsWith("@g.us")) return reply(`🤫 DM the bot privately with *.confess <message>* — don't type it in the group!${FOOTER}`);
    const confession = args.join(" ");
    if (!confession) return reply(`❓ Usage: .confess <your message>\n\n*DM me privately and I'll post it anonymously in the group!*${FOOTER}`);

    const confs = loadConfessions();
    const target = confs["_target"];
    if (!target?.groupJid) return reply(`❌ No confession group has been set yet. Ask the group admin to run *.setconfessgroup* in their group.${FOOTER}`);

    const confNum = Object.keys(confs).filter(k => k !== "_target").length + 1;

    try {
      await sock.sendMessage(target.groupJid, {
        text:
          `╔══════════════════════╗\n` +
          `║  🤫 *CONFESSION #${confNum}* 🤫\n` +
          `╚══════════════════════╝\n\n` +
          `_"${confession}"_\n\n` +
          `> _Anonymous • Posted via MAXX-XMD_ ⚡`,
      });

      confs[`conf_${Date.now()}`] = { groupJid: from, pending: [confession] };
      saveConfessions(confs);

      await reply(`✅ *Your confession has been posted anonymously!* 🤫\n\nNo one knows it was you.${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed to post confession: ${e.message}${FOOTER}`);
    }
  },
});

// ── .mpesa ────────────────────────────────────────────────────────────────────
registerCommand({
  name: "mpesa",
  aliases: ["lipa", "pay", "payme", "payment"],
  category: "Kenya",
  description: "Show M-Pesa payment instructions (.mpesa or .mpesa set <till/paybill/number> <name>)",
  handler: async ({ args, settings, reply, sock, from, msg }) => {
    const sub = args[0]?.toLowerCase();

    // .mpesa set <type> <value> <name>
    if (sub === "set") {
      const type = args[1]?.toLowerCase();
      const value = args[2];
      const name = args.slice(3).join(" ") || "MAXX-XMD";
      if (!type || !value) return reply(`❓ Usage: .mpesa set paybill 123456 BusinessName\n       .mpesa set till 123456 ShopName\n       .mpesa set number 0712345678 PersonName${FOOTER}`);
      (settings as any).mpesa = { type, value, name };
      const { saveSettings } = await import("../botState.js");
      saveSettings(settings);
      return reply(`✅ *M-Pesa payment info saved!*\n\nType *.mpesa* to view your payment card.${FOOTER}`);
    }

    const mp = (settings as any).mpesa;

    if (!mp) {
      return reply(
        `╔═════════════════════════╗\n` +
        `║  💚 *LIPA NA M-PESA* 💚  ║\n` +
        `╚═════════════════════════╝\n\n` +
        `📱 No M-Pesa info set yet.\n\n` +
        `*Set your payment details:*\n` +
        `• .mpesa set paybill 123456 CompanyName\n` +
        `• .mpesa set till 123456 ShopName\n` +
        `• .mpesa set number 0712345678 YourName\n\n` +
        `> _MAXX-XMD • Kenya_ 🇰🇪`
      );
    }

    const typeLabel = mp.type === "paybill" ? "Paybill No." : mp.type === "till" ? "Till No." : "Send to";
    const accountLabel = mp.type === "paybill" ? "Account No." : "";

    await sock.sendMessage(from, {
      text:
        `╔═════════════════════════╗\n` +
        `║  💚 *LIPA NA M-PESA* 💚  ║\n` +
        `╚═════════════════════════╝\n\n` +
        `📲 *${typeLabel}:* \`${mp.value}\`\n` +
        (accountLabel ? `📋 *${accountLabel}:* \`${mp.name}\`\n` : `👤 *Name:* ${mp.name}\n`) +
        `\n` +
        `*Steps:*\n` +
        `1️⃣ Go to M-Pesa → Lipa na M-Pesa\n` +
        `2️⃣ ${mp.type === "number" ? "Select Send Money" : mp.type === "till" ? "Select Buy Goods & Services" : "Select Pay Bill"}\n` +
        `3️⃣ Enter *${mp.value}*\n` +
        (mp.type === "paybill" ? `4️⃣ Account: *${mp.name}*\n` : "") +
        `\n💚 *Powered by MAXX-XMD* 🇰🇪`,
    }, { quoted: msg });
  },
});

// ── .safaricom ────────────────────────────────────────────────────────────────
registerCommand({
  name: "safaricom",
  aliases: ["saf", "safcodes", "mpesacodes", "ussd"],
  category: "Kenya",
  description: "Safaricom M-Pesa & bundle USSD codes cheat sheet",
  handler: async ({ reply }) => {
    await reply(
      `╔══════════════════════════════╗\n` +
      `║  🇰🇪 *SAFARICOM USSD CODES* 🇰🇪\n` +
      `╚══════════════════════════════╝\n\n` +
      `💰 *M-Pesa Codes:*\n` +
      `• Check Balance:       \`*334#\`\n` +
      `• Send Money:          \`*126*JID#\`\n` +
      `• Withdraw Cash:       \`*234*1*1#\`\n` +
      `• Buy Airtime:         \`*544*amount#\`\n` +
      `• Pay Bill:            \`*234*1#\`\n` +
      `• Buy Goods (Till):    \`*234*2*1#\`\n` +
      `• Request Money:       \`*234*9#\`\n\n` +
      `📦 *Data Bundles:*\n` +
      `• Buy Bundle:          \`*544#\`\n` +
      `• Check Data Balance:  \`*544*5#\`\n` +
      `• Bonga Points:        \`*126*6#\`\n\n` +
      `📞 *Account:*\n` +
      `• Airtime Balance:     \`*144#\`\n` +
      `• My Safaricom No.:    \`*100#\`\n` +
      `• Block SIM:           \`Call 100\`\n` +
      `• Customer Care:       \`100 / 0722 000 100\`\n\n` +
      `🌐 *Skiza Tunes:*\n` +
      `• Set Skiza:           \`*811*SKIZACODE#\`\n` +
      `• Deactivate:          \`*811*0#\`\n\n` +
      `> _MAXX-XMD • Kenya_ 🇰🇪 ⚡`
    );
  },
});

// ── .rank ─────────────────────────────────────────────────────────────────────
registerCommand({
  name: "rank",
  aliases: ["ranking", "myrank", "level", "xp"],
  category: "Group",
  description: "Show your group message rank and XP",
  handler: async ({ sock, from, sender, msg, reply }) => {
    if (!from.endsWith("@g.us")) return reply(`❌ This command only works in groups!${FOOTER}`);

    const groupActivity = getGroupActivity(from);
    const entries = Object.entries(groupActivity)
      .sort((a, b) => b[1].count - a[1].count);

    const myRank = entries.findIndex(([jid]) => jid === sender);
    const myEntry = groupActivity[sender];
    const myCount = myEntry?.count || 0;
    const total = entries.length;

    function getLevel(count: number) {
      if (count >= 1000) return { level: "👑 Legend", num: 10 };
      if (count >= 500)  return { level: "💎 Diamond", num: 9 };
      if (count >= 250)  return { level: "🏆 Gold", num: 8 };
      if (count >= 100)  return { level: "🥈 Silver", num: 7 };
      if (count >= 50)   return { level: "🥉 Bronze", num: 6 };
      if (count >= 20)   return { level: "⭐ Rising", num: 5 };
      if (count >= 10)   return { level: "🌱 Active", num: 4 };
      if (count >= 5)    return { level: "🐣 Newbie", num: 3 };
      if (count >= 1)    return { level: "👶 Rookie", num: 2 };
      return { level: "👻 Ghost", num: 1 };
    }

    const { level, num } = getLevel(myCount);
    const bar = "█".repeat(Math.min(num, 10)) + "░".repeat(10 - Math.min(num, 10));
    const displayRank = myRank === -1 ? total + 1 : myRank + 1;
    const num2 = sender.split("@")[0];

    // Top 5
    const top5 = entries.slice(0, 5).map(([jid, d], i) => {
      const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
      return `${medals[i]} @${jid.split("@")[0]} — *${d.count}* msgs`;
    }).join("\n");

    await sock.sendMessage(from, {
      text:
        `╔══════════════════════════╗\n` +
        `║  🏅 *GROUP RANK CARD* 🏅\n` +
        `╚══════════════════════════╝\n\n` +
        `👤 *@${num2}*\n` +
        `🏅 Rank: *#${displayRank}* of ${total}\n` +
        `💬 Messages: *${myCount}*\n` +
        `⭐ Level: *${level}*\n` +
        `${bar}\n\n` +
        `🏆 *Top 5 in Group:*\n` +
        (top5 || "_No activity recorded yet_") +
        FOOTER,
      mentions: [sender, ...entries.slice(0, 5).map(([jid]) => jid)],
    }, { quoted: msg });
  },
});

// ── .leaderboard ──────────────────────────────────────────────────────────────
registerCommand({
  name: "leaderboard",
  aliases: ["top", "topactive", "grouprank", "lb"],
  category: "Group",
  description: "Show the top 10 most active members in this group",
  handler: async ({ sock, from, msg, reply }) => {
    if (!from.endsWith("@g.us")) return reply(`❌ Only works in groups!${FOOTER}`);

    const groupActivity = getGroupActivity(from);
    const entries = Object.entries(groupActivity)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    if (entries.length === 0) return reply(`📊 No activity data yet. Keep chatting! 💬${FOOTER}`);

    const medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
    const rows = entries.map(([jid, d], i) =>
      `${medals[i]} @${jid.split("@")[0]} — *${d.count}* messages`
    ).join("\n");

    await sock.sendMessage(from, {
      text:
        `╔══════════════════════════╗\n` +
        `║  🏆 *LEADERBOARD* 🏆\n` +
        `╚══════════════════════════╝\n\n` +
        rows + FOOTER,
      mentions: entries.map(([jid]) => jid),
    }, { quoted: msg });
  },
});

