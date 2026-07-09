import makeWASocket from "@whiskeysockets/baileys";
import type { WAMessage } from "@whiskeysockets/baileys";
import { logger } from "./logger.js";
import { loadSettings, saveSettings } from "./botState.js";

type WASocket = ReturnType<typeof makeWASocket>;

const STATUS_EMOJIS = [
  "🔥","❤️","😂","😍","😮","😢","🎉","👍","🥰","😎",
  "🤩","💯","🙌","✨","⚡","🎊","💪","👏","🌟","💫",
];
export function randomEmoji(): string {
  return STATUS_EMOJIS[Math.floor(Math.random() * STATUS_EMOJIS.length)];
}

function getBodyText(msg: WAMessage): string {
  return (
    msg.message?.conversation ??
    msg.message?.extendedTextMessage?.text ??
    msg.message?.imageMessage?.caption ??
    msg.message?.videoMessage?.caption ?? ""
  ).trim();
}

function getSenderNumber(msg: WAMessage): string {
  const j = msg.key.fromMe
    ? (msg.key.remoteJid ?? "")
    : (msg.key.participant ?? msg.key.remoteJid ?? "");
  return j.split("@")[0].replace(/[^0-9]/g, "");
}

export function isOwner(msg: WAMessage, sock: WASocket): boolean {
  if (msg.key.fromMe) return true;
  const sn = getSenderNumber(msg);
  if (!sn) return false;
  const on = (process.env.OWNER_NUMBER ?? "").replace(/[^0-9]/g, "");
  if (on && sn === on) return true;
  const bn = (sock.user?.id ?? "").split(":")[0].split("@")[0].replace(/[^0-9]/g, "");
  if (bn && sn === bn) return true;
  return false;
}

function fmtDur(s: number): string {
  const m = Math.floor(s / 60); const sc = s % 60;
  return `${m}:${String(sc).padStart(2, "0")}`;
}

async function ytSearch(query: string): Promise<string> {
  const q = encodeURIComponent(query);
  const instances = [
    `https://inv.nadeko.net/api/v1/search?q=${q}&type=video&fields=title,videoId,author,lengthSeconds,viewCount`,
    `https://vid.puffyan.us/api/v1/search?q=${q}&type=video&fields=title,videoId,author,lengthSeconds,viewCount`,
    `https://invidious.fdn.fr/api/v1/search?q=${q}&type=video`,
    `https://invidious.slipfox.xyz/api/v1/search?q=${q}&type=video`,
  ];
  for (const url of instances) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!res.ok) continue;
      const data = (await res.json()) as any[];
      if (!Array.isArray(data) || !data.length) continue;
      return data.slice(0, 5).map((v: any, i: number) => {
        const dur = fmtDur(Number(v.lengthSeconds) || 0);
        const views = v.viewCount ? `${Number(v.viewCount).toLocaleString()} views · ` : "";
        return `${i + 1}. *${v.title}*\n   👤 ${v.author || "?"} · ⏱ ${dur} · ${views}\n   ▶️ https://youtu.be/${v.videoId}`;
      }).join("\n\n");
    } catch { continue; }
  }
  throw new Error("All YouTube search sources failed. Try again later.");
}

export async function handleMessage(sock: WASocket, msg: WAMessage): Promise<void> {
  try {
    if (!msg.message) return;
    const jid = msg.key.remoteJid ?? "";
    if (!jid || jid === "status@broadcast") return;

    const settings = loadSettings();
    const text = getBodyText(msg);
    if (!text.startsWith(settings.prefix)) return;

    const parts = text.slice(settings.prefix.length).trim().split(/\s+/);
    const cmd = (parts[0] ?? "").toLowerCase();
    const args = parts.slice(1).join(" ").trim();
    const ctx = msg.message?.extendedTextMessage?.contextInfo;

    // Antitag check for groups
    if ((settings.antitag as boolean) && jid.endsWith("@g.us") && !msg.key.fromMe) {
      const mentioned: string[] = (ctx?.mentionedJid ?? []) as string[];
      if (mentioned.length >= 5 || text.toLowerCase().includes("@all") || text.toLowerCase().includes("@everyone")) {
        const sJid = msg.key.participant ?? jid;
        try { await sock.sendMessage(jid, { delete: msg.key }); } catch {}
        await sock.sendMessage(jid, {
          text: `⚠️ *Anti-Tag:* @${sJid.split("@")[0]} — mass tagging is not allowed.`,
          mentions: [sJid],
        });
        return;
      }
    }

    switch (cmd) {

      case "restart":
      case "reboot": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        await sock.sendMessage(jid, {
          text: `♻️ *${settings.botName} restarting...*\n_Reconnecting in a few seconds._`,
        }, { quoted: msg });
        setTimeout(() => process.exit(0), 1500);
        break;
      }

      case "yts":
      case "yt":
      case "youtube": {
        if (!args) {
          await sock.sendMessage(jid, { text: `🎥 Usage: ${settings.prefix}yts <search query>` }, { quoted: msg });
          return;
        }
        await sock.sendMessage(jid, { text: `🔍 Searching YouTube for *"${args}"*...` }, { quoted: msg });
        try {
          const result = await ytSearch(args);
          await sock.sendMessage(jid, {
            text: `🎥 *YouTube — "${args}"*\n\n${result}\n\n> _Powered by ${settings.botName}_ ⚡`,
          }, { quoted: msg });
        } catch (err: any) {
          await sock.sendMessage(jid, { text: `❌ YouTube search failed: ${err?.message}` }, { quoted: msg });
        }
        break;
      }

      case "jid": {
        const sJid = msg.key.participant ?? msg.key.remoteJid ?? "unknown";
        const rJid = ctx?.participant ?? ctx?.remoteJid ?? null;
        await sock.sendMessage(jid, {
          text:
            `📋 *JID Info*\n\n` +
            `*Chat JID:* \`${jid}\`\n` +
            `*Your JID:* \`${sJid}\`\n` +
            `*Bot JID:* \`${sock.user?.id ?? "unknown"}\`\n` +
            (rJid ? `*Replied User:* \`${rJid}\`\n` : "") +
            `\n_JID = WhatsApp contact/chat identifier_`,
        }, { quoted: msg });
        break;
      }

      case "lid": {
        const sJid = msg.key.participant ?? msg.key.remoteJid ?? "unknown";
        const lid = (msg.key as any).lid ?? "Not available";
        await sock.sendMessage(jid, {
          text: `🆔 *LID Info*\n\n*Sender:* \`${sJid}\`\n*LID:* \`${lid}\`\n\n_LID = Linked Device Identity_`,
        }, { quoted: msg });
        break;
      }

      case "rid": {
        if (!ctx?.stanzaId) {
          await sock.sendMessage(jid, { text: `↩️ Reply to a message first, then type ${settings.prefix}rid` }, { quoted: msg });
          return;
        }
        await sock.sendMessage(jid, {
          text: `🆔 *Reply Message Info*\n\n*Message ID:* \`${ctx.stanzaId}\`\n*Sender:* \`${ctx.participant ?? ctx.remoteJid ?? "?"}\`\n*Chat:* \`${jid}\``,
        }, { quoted: msg });
        break;
      }

      case "fetch": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        if (!args || !args.startsWith("http")) {
          await sock.sendMessage(jid, { text: `Usage: ${settings.prefix}fetch <url>` }, { quoted: msg });
          return;
        }
        try {
          const res = await fetch(args, { signal: AbortSignal.timeout(12000) });
          let body = await res.text();
          if (body.length > 2500) body = body.slice(0, 2500) + "\n...[truncated]";
          await sock.sendMessage(jid, {
            text: `🌐 *Fetch Result*\n🔗 ${args}\nStatus: ${res.status}\n\n${body}`,
          }, { quoted: msg });
        } catch (err: any) {
          await sock.sendMessage(jid, { text: `❌ Fetch failed: ${err?.message}` }, { quoted: msg });
        }
        break;
      }

      case "syncsettings":
      case "settings": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        const s = loadSettings();
        await sock.sendMessage(jid, {
          text:
            `⚙️ *Bot Settings*\n\n` +
            `*Name:* ${s.botName}\n*Prefix:* ${s.prefix}\n*Mode:* ${s.mode}\n*Owner:* ${s.ownerNumber || "Not set"}\n\n` +
            `*Anti Tag:*            ${s.antitag ? "✅" : "❌"}\n` +
            `*Status Anti-Delete:*  ${s.statusAntidelete ? "✅" : "❌"}\n` +
            `*Anti Status Mention:* ${s.antiStatusMention ? "✅" : "❌"}\n` +
            `*Auto Channel Follow:* ${(s.autoChannelFollow !== false) ? "✅" : "❌"}\n` +
            `*Group Event Log:*     ${s.groupEvent ? "✅" : "❌"}\n\n` +
            `> _Settings saved to settings.json_ ⚡`,
        }, { quoted: msg });
        break;
      }

      case "boturl":
      case "url":
      case "links": {
        await sock.sendMessage(jid, {
          text:
            `🌐 *${settings.botName} Links*\n\n` +
            `🖥️ *Panel:* https://panel.maxxtech.co.ke\n` +
            `🔑 *Pair Session:* https://pair.maxxtech.co.ke\n` +
            `🏠 *Main Site:* https://maxxtech.co.ke\n\n` +
            `📢 *WhatsApp Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J\n` +
            `👥 *WhatsApp Group:* https://chat.whatsapp.com/GV3v2GUmoy12HdulEvQaVO\n\n` +
            `> _Powered by ${settings.botName}_ ⚡`,
        }, { quoted: msg });
        break;
      }

      case "channelreact": {
        if (!ctx?.stanzaId) {
          await sock.sendMessage(jid, { text: `Reply to a channel post first, then:\n${settings.prefix}channelreact <emoji>` }, { quoted: msg });
          return;
        }
        const emoji = args.trim() || "❤️";
        try {
          await sock.sendMessage(ctx.remoteJid ?? jid, {
            react: { text: emoji, key: { remoteJid: ctx.remoteJid ?? jid, id: ctx.stanzaId, participant: ctx.participant } },
          });
          await sock.sendMessage(jid, { text: `${emoji} Reacted!` }, { quoted: msg });
        } catch (err: any) {
          await sock.sendMessage(jid, { text: `❌ Reaction failed: ${err?.message}` }, { quoted: msg });
        }
        break;
      }

      case "tagonline":
      case "tagall":
      case "tageveryone": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, { text: "❌ Groups only." }, { quoted: msg });
          return;
        }
        try {
          const meta = await sock.groupMetadata(jid);
          const participants = meta.participants.map((p: any) => typeof p === "string" ? p : p.id);
          const mentions = participants.map((p: string) => `@${p.split("@")[0]}`).join(" ");
          await sock.sendMessage(jid, {
            text: `${args || "📢 Hey everyone!"}\n\n${mentions}`,
            mentions: participants,
          });
        } catch (err: any) {
          await sock.sendMessage(jid, { text: `❌ Failed: ${err?.message}` }, { quoted: msg });
        }
        break;
      }

      case "groupevent": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        const val = args.toLowerCase() === "on" ? true : args.toLowerCase() === "off" ? false : !(loadSettings().groupEvent as boolean);
        saveSettings({ groupEvent: val });
        await sock.sendMessage(jid, { text: `${val ? "✅" : "❌"} Group event log: *${val ? "ON" : "OFF"}*` }, { quoted: msg });
        break;
      }

      case "antitag": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        const val = args.toLowerCase() === "on" ? true : args.toLowerCase() === "off" ? false : !(loadSettings().antitag as boolean);
        saveSettings({ antitag: val });
        await sock.sendMessage(jid, {
          text: `${val ? "✅" : "❌"} Anti-tag: *${val ? "ON" : "OFF"}*\n${val ? "Mass-tagging messages will be deleted." : ""}`,
        }, { quoted: msg });
        break;
      }

      case "antistatusmention": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        const val = args.toLowerCase() === "on" ? true : args.toLowerCase() === "off" ? false : !(loadSettings().antiStatusMention as boolean);
        saveSettings({ antiStatusMention: val });
        await sock.sendMessage(jid, { text: `${val ? "✅" : "❌"} Anti-status-mention: *${val ? "ON" : "OFF"}*` }, { quoted: msg });
        break;
      }

      case "statusantidelete": {
        if (!isOwner(msg, sock)) {
          await sock.sendMessage(jid, { text: "❌ Owner only." }, { quoted: msg });
          return;
        }
        const val = args.toLowerCase() === "on" ? true : args.toLowerCase() === "off" ? false : !(loadSettings().statusAntidelete as boolean);
        saveSettings({ statusAntidelete: val });
        await sock.sendMessage(jid, { text: `${val ? "✅" : "❌"} Status anti-delete: *${val ? "ON" : "OFF"}*` }, { quoted: msg });
        break;
      }

      case "menu":
      case "help": {
        const p = settings.prefix;
        const n = settings.botName;
        await sock.sendMessage(jid, {
          text:
            `╔══════════════════════╗\n` +
            `║  ⚡ *${n} MENU* ⚡  ║\n` +
            `╚══════════════════════╝\n\n` +
            `*🔒 OWNER COMMANDS*\n` +
            `▸ ${p}restart — Restart the bot\n` +
            `▸ ${p}syncsettings — View all settings\n` +
            `▸ ${p}antitag on/off — Mass-tag protection\n` +
            `▸ ${p}antistatusmention on/off — Status mention guard\n` +
            `▸ ${p}statusantidelete on/off — Recover deleted statuses\n` +
            `▸ ${p}groupevent on/off — Group join/leave log\n` +
            `▸ ${p}tagonline [msg] — Tag all group members\n` +
            `▸ ${p}fetch <url> — Fetch a URL\n\n` +
            `*🔍 SEARCH*\n` +
            `▸ ${p}yts <query> — YouTube video search\n\n` +
            `*📋 INFO*\n` +
            `▸ ${p}alive — Bot status + URL buttons\n` +
            `▸ ${p}jid — Show chat JIDs\n` +
            `▸ ${p}lid — Linked device ID\n` +
            `▸ ${p}rid — Replied message ID\n` +
            `▸ ${p}boturl — Panel & pairing links\n\n` +
            `*📢 CHANNEL*\n` +
            `▸ ${p}channelreact <emoji> — React to a channel post\n` +
            `📢 Channel: https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J\n` +
            `👥 Group: https://chat.whatsapp.com/GV3v2GUmoy12HdulEvQaVO\n\n` +
            `> _Powered by ${n}_ ⚡\n` +
            `> _Panel: https://panel.maxxtech.co.ke_`,
        }, { quoted: msg });
        break;
      }


      case "alive":
      case "bot":
      case "status": {
        const uptimeSec = Math.floor(process.uptime());
        const hrs  = Math.floor(uptimeSec / 3600);
        const mins = Math.floor((uptimeSec % 3600) / 60);
        const secs = uptimeSec % 60;
        const uptimeStr = `${hrs}h ${mins}m ${secs}s`;
        const emoji = randomEmoji();
        await sock.sendMessage(jid, {
          text:
            `╔══════════════════════════╗\n` +
            `║  ${emoji} *${settings.botName} — ALIVE* ${emoji}  ║\n` +
            `╚══════════════════════════╝\n\n` +
            `✅ *Status:*   ONLINE & RUNNING\n` +
            `🤖 *Bot:*      ${settings.botName}\n` +
            `⏱️ *Uptime:*   ${uptimeStr}\n` +
            `🌐 *Mode:*     ${settings.mode ?? "public"}\n` +
            `⌨️  *Prefix:*   ${settings.prefix}\n` +
            `👤 *Owner:*    ${settings.ownerNumber || "Not set"}\n\n` +
            `📦 *Source:*   github.com/Carlymaxx/maxxtechxmd\n` +
            `🌍 *Website:*  www.maxxtech.co.ke\n\n` +
            `> _Tap a button below to get started_ 👇`,
          footer: `Powered by ${settings.botName} ⚡ Open Source`,
          templateButtons: [
            { urlButton: { displayText: "🌐 Install / Pair Bot",    url: "https://pair.maxxtech.co.ke" },                                         index: 1 },
            { urlButton: { displayText: "📢 Follow Our Channel",    url: "https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J" },              index: 2 },
            { urlButton: { displayText: "👥 Join WhatsApp Group",   url: "https://chat.whatsapp.com/BWZOtIlbZoJ9Xt8lgxxbqQ" },                    index: 3 },
            { urlButton: { displayText: "💻 View Source Code",      url: "https://github.com/Carlymaxx/maxxtechxmd" },                            index: 4 },
            { urlButton: { displayText: "🌍 Visit Website",         url: "https://www.maxxtech.co.ke" },                                          index: 5 },
          ],
        } as any, { quoted: msg });
        break;
      }

      case "ping": {
        const t1 = Date.now();
        const elapsed = Date.now() - t1;
        const bars =
          elapsed < 50  ? "████████░░" :
          elapsed < 150 ? "██████░░░░" :
          elapsed < 300 ? "████░░░░░░" : "██░░░░░░░░";
        const speed =
          elapsed < 50  ? "⚡ Very Fast" :
          elapsed < 150 ? "🟢 Fast" :
          elapsed < 300 ? "🟡 Normal"   : "🔴 Slow";
        const userName = sock.user?.name ?? (sock.user?.id?.split(":")[0] ?? "User");
        const pingText =
          `┌─────────────────────────┐
` +
          `│   ⚡ *MAXX-XMD PING* ⚡   │
` +
          `└─────────────────────────┘

` +
          `👋 Hey ${userName}!
` +
          `🟢 Status ────── ONLINE
` +
          `🤖 Bot ─────── ${settings.botName}
` +
          `📡 Server ────── ACTIVE
` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━
` +
          `⏱️ *Response Time*
` +
          `   [${bars}] ${elapsed}ms
` +
          `   ${speed}
` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(jid, {
          text: pingText,
          footer: `Powered by ${settings.botName} ⚡`,
          templateButtons: [
            { urlButton: { displayText: "🌐 Visit Repository", url: "https://github.com/Carlymaxx/maxxtechxmd" }, index: 1 },
            { urlButton: { displayText: "🍴 Fork Repository",  url: "https://github.com/Carlymaxx/maxxtechxmd/fork" }, index: 2 },
            { urlButton: { displayText: "🔑 Get Session ID",   url: "https://pair.maxxtech.co.ke" }, index: 3 },
            { urlButton: { displayText: "📥 Download Zip",     url: "https://github.com/Carlymaxx/maxxtechxmd/archive/refs/heads/main.zip" }, index: 4 },
            { urlButton: { displayText: "📢 WhatsApp Channel",  url: "https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J" }, index: 5 },
          ],
        } as any, { quoted: msg });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    logger.error({ err }, "handleMessage error");
  }
}
