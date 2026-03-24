import os from "os";
import { registerCommand, commandRegistry } from "./types";

function ramBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function formatBytes(b: number) {
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

function uptime() {
  const s = process.uptime();
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h ${m}m ${sec}s`;
}

registerCommand({
  name: "alive",
  aliases: ["botstatus", "status"],
  category: "General",
  description: "Show bot status",
  handler: async ({ sock, from, msg, settings }) => {
    const totalB = os.totalmem();
    const freeB  = os.freemem();
    const usedB  = totalB - freeB;
    const pct    = Math.round((usedB / totalB) * 100);
    const totalMB = (totalB / 1024 / 1024).toFixed(0);
    const usedMB  = (usedB  / 1024 / 1024).toFixed(0);
    const upt = process.uptime();
    const h = Math.floor(upt / 3600);
    const m = Math.floor((upt % 3600) / 60);
    const s = Math.floor(upt % 60);
    const bar = ramBar(pct);
    const text = `╔══════════════════════╗
║  ✨ *MAXX-XMD IS ALIVE!* ✨
╚══════════════════════╝

🤖 *Bot:* ${settings.botName}
👑 *Owner:* ${settings.ownerName}
🔧 *Prefix:* ${settings.prefix}
🌐 *Mode:* ${settings.mode}
⏰ *Uptime:* ${h}h ${m}m ${s}s
💾 *RAM:* ${usedMB}MB / ${totalMB}MB [${pct}%]
${bar}
📦 *Version:* 2.0.0
🟢 *Status:* Active & Running

📢 *Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J`;
    const botpic: string = (settings as any).botpic || "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg";
    try {
      await sock.sendMessage(from, { image: { url: botpic }, caption: text }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text }, { quoted: msg });
    }
  },
});

registerCommand({
  name: "ping",
  aliases: ["ping2", "speed"],
  category: "General",
  description: "Check bot response speed",
  handler: async ({ msg, reply }) => {
    const start = Date.now();
    const user = (msg as any).pushName || "User";
    await reply("⏳ Checking ping... 🔍");
    const ms = Date.now() - start;
    await reply(`╔══════════════════════╗
║  *🌈 MAXX-XMD STATUS* 🌈
╚══════════════════════╝

👋 Hello, *${user}*!
🚀 Bot is *ONLINE!*
🟢 *Status:* Active & Running

⚡ *Ping:* ${ms}ms
📡 *Network:* Stable 🔥

💖 Thanks for using *MAXX-XMD*!`);
  },
});

registerCommand({
  name: "runtime",
  aliases: ["uptime"],
  category: "General",
  description: "Show bot runtime and system info",
  handler: async ({ reply }) => {
    const upt = process.uptime();
    const days = Math.floor(upt / 86400);
    const hrs = Math.floor((upt % 86400) / 3600);
    const mins = Math.floor((upt % 3600) / 60);
    const secs = Math.floor(upt % 60);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
    const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
    const usedMem = (os.totalmem() / 1024 / 1024 - os.freemem() / 1024 / 1024).toFixed(0);
    await reply(`⏱️ *MAXX-XMD RUNTIME*

⏳ *Uptime:* ${days}d ${hrs}h ${mins}m ${secs}s
💻 *Platform:* ${os.platform()} ${os.arch()}
🧠 *RAM:* ${usedMem}MB / ${totalMem}MB
⚙️ *Node.js:* ${process.version}
🔧 *CPU:* ${os.cpus()[0]?.model?.trim() || "Unknown"}`);
  },
});

registerCommand({
  name: "time",
  aliases: ["date"],
  category: "General",
  description: "Show current date and time",
  handler: async ({ args, reply }) => {
    const tz = args.join(" ") || "Africa/Nairobi";
    try {
      const res = await fetch(`https://worldtimeapi.org/api/timezone/${tz}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as any;
      const dt = new Date(data.datetime);
      await reply(`🕐 *Time in ${tz}*\n\n📅 Date: *${dt.toDateString()}*\n⏰ Time: *${dt.toLocaleTimeString()}*\n🌐 UTC Offset: *${data.utc_offset}*`);
    } catch {
      const now = new Date();
      await reply(`🕐 *Current Time (UTC)*\n\n📅 ${now.toUTCString()}`);
    }
  },
});

registerCommand({
  name: "repo",
  aliases: ["github", "source"],
  category: "General",
  description: "Get the bot source code",
  handler: async ({ reply }) => {
    await reply(`📦 *MAXX XMD Source Code*\n\n🔗 https://github.com/Carlymaxx/maxxtechxmd\n\n⭐ Star the repo if you enjoy using the bot!\n\n🚀 Deploy your own:\n• Heroku • Railway • Koyeb • Replit`);
  },
});

registerCommand({
  name: "owner",
  aliases: ["developer", "creator"],
  category: "General",
  description: "Get bot owner contact card",
  handler: async ({ sock, from, msg, settings, reply }) => {
    const ownerNumber = ((settings.ownerNumber as string) || "254725979273").replace(/\D/g, "");
    const ownerName = settings.ownerName || "MAXX";
    const botName = settings.botName || "MAXX-XMD";
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nTEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\nEND:VCARD`;
    try {
      await sock.sendMessage(from, { contacts: { displayName: ownerName, contacts: [{ vcard }] } }, { quoted: msg });
    } catch {}
    await reply(`👑 *Bot Owner:* ${ownerName}\n📞 *Number:* +${ownerNumber}\n🤖 *Bot:* ${botName}\n\n> _MAXX-XMD_ ⚡`);
  },
});

registerCommand({
  name: "pair",
  aliases: ["getid", "session", "pairdevice"],
  category: "General",
  description: "Generate a WhatsApp pairing code for any device",
  handler: async ({ args, settings, reply }) => {
    const phone = args[0]?.replace(/\D/g, "");
    if (!phone || phone.length < 7) {
      return reply(`╔══════════════════════╗
║ 🔗 *PAIR DEVICE* 🔗
╚══════════════════════╝

📌 *Usage:* .pair <phone number>
📝 *Example:* .pair 254712345678

Include country code, no + or spaces.

🌐 *Or use web pairing:*
https://maxxtechxmd.replit.app/pair`);
    }

    await reply(`╔══════════════════════╗
║ 🔗 *PAIR DEVICE* 🔗
╚══════════════════════╝

📱 *Number:* +${phone}
⏳ Generating pairing code...
Please wait up to 30 seconds...`);

    try {
      const { startPairingSession } = await import("../baileys.js");
      const sessionId = `bot-pair-${Date.now()}`;
      const { pairingCode } = await startPairingSession(sessionId, phone);

      await reply(`✅ *PAIRING CODE READY!*

🔑 Code: *${pairingCode}*

📱 *Steps on WhatsApp:*
1️⃣ Open WhatsApp Settings
2️⃣ Linked Devices
3️⃣ Link a Device
4️⃣ Enter the code above 👆

⏱️ _Code expires in ~60 seconds!_`);
    } catch (e: any) {
      await reply(`❌ Failed to generate pairing code.

Try the web method instead:
🌐 https://maxxtechxmd.replit.app/pair

Error: ${e.message?.slice(0, 100) || "Unknown"}`);
    }
  },
});

registerCommand({
  name: "botinfo",
  aliases: ["info"],
  category: "General",
  description: "Show detailed bot info",
  handler: async ({ settings, reply }) => {
    await reply(`╔══════════════════╗
║  *🤖 MAXX XMD INFO*  ║
╚══════════════════╝

🏷️ *Bot Name:* ${settings.botName}
👑 *Owner:* ${settings.ownerName}
📌 *Prefix:* ${settings.prefix}
🌐 *Mode:* ${settings.mode}
📦 *Version:* 2.0.0
⚡ *Uptime:* ${uptime()}
🛠️ *Platform:* Node.js / Baileys

📋 *Features:*
• 150+ Commands
• Group Management
• Auto-Reply & AI Chat
• Media Downloads
• Sports Updates
• Fun & Games

🔗 *Repo:* github.com/Carlymaxx/maxxtechxmd`);
  },
});

registerCommand({
  name: "menu",
  aliases: ["help", "commands", "list"],
  category: "General",
  description: "Show all bot commands",
  handler: async ({ sock, from, msg, args, settings, reply }) => {
    const cat = args[0]?.toLowerCase();
    const p = settings.prefix;

    // ── Category config ────────────────────────────────────────────────────
    const CAT_ORDER = [
      "General", "Download", "AI", "Search", "Photo", "Fun", "Games",
      "Anime", "Pokemon", "Group", "Converter", "Finance", "Health", "Math",
      "Education", "Settings", "Tools", "Audio", "Religion", "Sports", "Owner",
      "Sticker", "Protection", "Economy", "Lifestyle",
    ];
    const CAT_EMOJI: Record<string, string> = {
      General: "🌐", Download: "⬇️", AI: "🤖", Search: "🔍",
      Photo: "📸", Fun: "😂", Games: "🎮", Anime: "🎌", Pokemon: "🔴",
      Group: "👥", Converter: "🔄", Finance: "💰", Health: "❤️",
      Math: "🔢", Education: "📚",
      Settings: "⚙️", Tools: "🔧", Audio: "🎵", Religion: "🕌", Sports: "⚽", Owner: "👑",
      Sticker: "🎭", Protection: "🛡️", Economy: "🪙", Lifestyle: "🌿",
    };

    // ── Get all unique commands from registry (exclude alias duplicates) ───
    const uniqueCmds = [...commandRegistry.entries()]
      .filter(([key, cmd]) => key === cmd.name)
      .map(([, cmd]) => cmd)
      .sort((a, b) => a.name.localeCompare(b.name));

    // ── Group by category ──────────────────────────────────────────────────
    const grouped = new Map<string, typeof uniqueCmds>();
    for (const cmd of uniqueCmds) {
      const cat = cmd.category || "General";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(cmd);
    }

    if (!cat) {
      // ── Full dynamic menu ────────────────────────────────────────────────
      const tz: string = (settings as any).timezone || "Africa/Nairobi";
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const dateStr = now.toLocaleDateString("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
      const uptimeSec = process.uptime();
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      const totalMem = Math.round(os.totalmem() / 1024 / 1024);
      const usedMem = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024);
      const hour = parseInt(now.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false }));
      let greeting = "Hello";
      if (hour >= 5 && hour < 12) greeting = "🌞 Good morning";
      else if (hour >= 12 && hour < 18) greeting = "🌤 Good afternoon";
      else if (hour >= 18 && hour < 22) greeting = "🌙 Good evening";
      else greeting = "🌌 Good night";

      const senderName = (msg as any).pushName || "User";
      const botName = settings.botName || "MAXX-XMD";
      const ownerName = settings.ownerName || "MAXX";
      const totalCmds = uniqueCmds.length;

      let text =
        `╔══════════════════════════╗\n` +
        `║  ✨ *${botName} MENU* ✨\n` +
        `╚══════════════════════════╝\n\n` +
        `${greeting}, *${senderName}*! ⚡\n\n` +
        `👑 *Owner:* ${ownerName}\n` +
        `🔧 *Prefix:* ${p}\n` +
        `🌐 *Mode:* ${settings.mode || "public"}\n` +
        `🕒 *Time:* ${timeStr}  📅 ${dateStr}\n` +
        `⏱️ *Uptime:* ${hours}h ${mins}m\n` +
        `💾 *RAM:* ${usedMem}MB / ${totalMem}MB\n` +
        `📦 *Commands:* ${totalCmds} total\n\n`;

      // Build each category section in order
      const orderedCats = [
        ...CAT_ORDER.filter(c => grouped.has(c)),
        ...[...grouped.keys()].filter(c => !CAT_ORDER.includes(c)).sort(),
      ];

      for (const catName of orderedCats) {
        const cmds = grouped.get(catName)!;
        const emoji = CAT_EMOJI[catName] || "📌";
        text += `╔═══ ${emoji} *${catName.toUpperCase()}* (${cmds.length}) ═══╗\n`;
        for (const cmd of cmds) {
          text += `║ ${p}${cmd.name}\n`;
        }
        text += `╚${"═".repeat(22)}╝\n\n`;
      }

      text +=
        `📢 *Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J\n\n` +
        `> _Powered by ${botName}_ ⚡`;

      const botpic: string = (settings as any).botpic || "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg";
      try {
        await sock.sendMessage(from, { image: { url: botpic }, caption: text }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text }, { quoted: msg });
      }
      return;
    }

    // ── Category sub-menu (.menu ai, .menu group, etc.) ──────────────────
    // Find matching category (case-insensitive partial match)
    const matchedCat = [...grouped.keys()].find(k =>
      k.toLowerCase() === cat || k.toLowerCase().startsWith(cat)
    );

    if (matchedCat) {
      const cmds = grouped.get(matchedCat)!;
      const emoji = CAT_EMOJI[matchedCat] || "📌";
      let out = `┏▣ ◈ *${emoji} ${matchedCat.toUpperCase()} COMMANDS* ◈\n`;
      for (const cmd of cmds) {
        out += `│➽ ${p}${cmd.name}${cmd.usage ? " " + cmd.usage : ""}\n`;
      }
      out += `┗▣\n\n`;
      out += `💡 _${cmds.length} command${cmds.length !== 1 ? "s" : ""} in ${matchedCat}_\n\n> _MAXX-XMD_ ⚡`;
      await reply(out);
    } else {
      const cats = [...grouped.keys()].map(k => `${CAT_EMOJI[k] || "📌"} ${p}menu ${k.toLowerCase()}`).join("\n");
      await reply(`❌ Category *${cat}* not found.\n\n📋 *Available categories:*\n${cats}`);
    }
  },
});

registerCommand({
  name: "crypto",
  aliases: ["coin", "price"],
  category: "General",
  description: "Get live cryptocurrency price",
  handler: async ({ args, reply }) => {
    const input = args[0]?.toLowerCase();
    if (!input) return reply("❓ Usage: .crypto <coin>\nExamples: .crypto bitcoin  .crypto eth  .crypto bnb");
    const COIN_MAP: Record<string, string> = {
      btc: "bitcoin", eth: "ethereum", bnb: "binancecoin", sol: "solana",
      xrp: "ripple", ada: "cardano", doge: "dogecoin", matic: "matic-network",
      dot: "polkadot", ltc: "litecoin", trx: "tron", shib: "shiba-inu",
      avax: "avalanche-2", link: "chainlink", uni: "uniswap", usdt: "tether",
    };
    const id = COIN_MAP[input] || input;
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`);
      const data = await res.json() as any;
      const coin = data[id];
      if (!coin) return reply(`❌ Coin "*${input}*" not found.\n\nTry the full name e.g. .crypto bitcoin`);
      const price = coin.usd?.toLocaleString("en-US", { maximumFractionDigits: 6 });
      const change = coin.usd_24h_change?.toFixed(2);
      const mcap = coin.usd_market_cap ? `$${(coin.usd_market_cap / 1e9).toFixed(2)}B` : "N/A";
      const arrow = change > 0 ? "📈" : "📉";
      await reply(`💰 *${id.toUpperCase()} Price*

💵 *Price:* $${price}
${arrow} *24h Change:* ${change}%
🏦 *Market Cap:* ${mcap}

_Data from CoinGecko_`);
    } catch {
      await reply("❌ Could not fetch crypto price. Try again later.");
    }
  },
});

registerCommand({
  name: "hack",
  aliases: ["hacking", "breach"],
  category: "Fun",
  description: "Fake hacking simulation (for fun)",
  handler: async ({ args, reply }) => {
    const target = args.join(" ") || "Unknown Target";
    await reply(`╔══════════════════════╗
║ 💻 *HACKING INITIATED* 💻
╚══════════════════════╝

🎯 *Target:* ${target}

📡 Connecting to server...
🔐 Bypassing firewall...
🧠 Injecting exploit...
📂 Extracting data...
🔓 Cracking password...
📡 Rerouting through VPN...

✅ *HACK SUCCESSFUL!* 😈

📁 Files dumped
📸 Media accessed
📞 Contacts synced
💳 Data secured

⚠️ _This is a fake simulation for fun only._`);
  },
});

registerCommand({
  name: "device",
  aliases: ["sysinfo", "systeminfo"],
  category: "General",
  description: "Show bot device and system info",
  handler: async ({ settings, reply }) => {
    const upt = process.uptime();
    const hrs = Math.floor(upt / 3600);
    const mins = Math.floor((upt % 3600) / 60);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
    const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
    const usedMem = (os.totalmem() / 1024 / 1024 - os.freemem() / 1024 / 1024).toFixed(0);
    await reply(`╔══════════════════════╗
║ 📱 *DEVICE INFO* 📱
╚══════════════════════╝

🤖 *Bot Name:* ${settings.botName}
👑 *Owner:* ${settings.ownerName}

💻 *Platform:* ${os.platform()} (${os.arch()})
🔧 *CPU:* ${os.cpus()[0]?.model?.trim() || "Unknown"}
🧮 *Cores:* ${os.cpus().length}

📦 *Total RAM:* ${totalMem} MB
📊 *Used RAM:* ${usedMem} MB
🆓 *Free RAM:* ${freeMem} MB

⏱️ *Uptime:* ${hrs}h ${mins}m
⚙️ *Node.js:* ${process.version}
🟢 *Connection:* Active`);
  },
});

registerCommand({
  name: "clearchat",
  aliases: ["clear"],
  category: "General",
  description: "Clear the current chat",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      await sock.chatModify(
        { delete: true, lastMessages: [{ key: msg.key, messageTimestamp: (msg as any).messageTimestamp }] },
        from
      );
      await reply("🧹 Chat cleared!");
    } catch {
      await reply("❌ Could not clear chat. Bot may not have permission here.");
    }
  },
});

registerCommand({
  name: "version",
  aliases: ["ver", "v"],
  category: "General",
  description: "Show bot version",
  handler: async ({ settings, reply }) => {
    await reply(`🤖 *MAXX-XMD Bot*

📦 *Version:* 2.0.0
👑 *Owner:* ${settings.ownerName}
🛠️ *Platform:* Node.js / Baileys
🔧 *Commands:* 150+
🌐 *Repo:* github.com/Carlymaxx/maxxtechxmd`);
  },
});
