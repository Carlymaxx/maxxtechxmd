import os from "os";
import { registerCommand, commandRegistry } from "./types";
import { getLiveSessions, getCmdUsageCount } from "../botState";

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
📦 *Version:* 3.0.0
🌍 *Website:* www.maxxtech.co.ke
🟢 *Status:* Active & Running

━━━━━━━━━━━━━━━━━━━━━
📢 *Join Our Channel* 👇
https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J`;
    const botpic: string = (settings as any).botpic || "https://files.catbox.moe/9r47nb.jpg";
    try {
      await sock.sendMessage(from, { image: { url: botpic }, caption: text }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text }, { quoted: msg });
    }
  },
});

registerCommand({
  name: "ping",
  aliases: ["ping2", "latency"],
  category: "General",
  description: "Check bot response speed",
  handler: async ({ senderName, reply }) => {
    const start = Date.now();
    await reply("⏳ Checking ping... 🔍");
    const ms = Date.now() - start;
    await reply(`╔══════════════════════╗
║  *🌈 MAXX-XMD STATUS* 🌈
╚══════════════════════╝

👋 Hello, *${senderName}*!
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

// ── Country-code → timezone lookup ───────────────────────────────────────────
const CC_TZ: Record<string, { tz: string; country: string }> = {
  "1":   { tz: "America/New_York",        country: "USA/Canada" },
  "7":   { tz: "Europe/Moscow",           country: "Russia" },
  "20":  { tz: "Africa/Cairo",            country: "Egypt" },
  "27":  { tz: "Africa/Johannesburg",     country: "South Africa" },
  "31":  { tz: "Europe/Amsterdam",        country: "Netherlands" },
  "32":  { tz: "Europe/Brussels",         country: "Belgium" },
  "33":  { tz: "Europe/Paris",            country: "France" },
  "34":  { tz: "Europe/Madrid",           country: "Spain" },
  "36":  { tz: "Europe/Budapest",         country: "Hungary" },
  "39":  { tz: "Europe/Rome",             country: "Italy" },
  "40":  { tz: "Europe/Bucharest",        country: "Romania" },
  "41":  { tz: "Europe/Zurich",           country: "Switzerland" },
  "44":  { tz: "Europe/London",           country: "United Kingdom" },
  "45":  { tz: "Europe/Copenhagen",       country: "Denmark" },
  "46":  { tz: "Europe/Stockholm",        country: "Sweden" },
  "47":  { tz: "Europe/Oslo",             country: "Norway" },
  "48":  { tz: "Europe/Warsaw",           country: "Poland" },
  "49":  { tz: "Europe/Berlin",           country: "Germany" },
  "51":  { tz: "America/Lima",            country: "Peru" },
  "52":  { tz: "America/Mexico_City",     country: "Mexico" },
  "54":  { tz: "America/Argentina/Buenos_Aires", country: "Argentina" },
  "55":  { tz: "America/Sao_Paulo",       country: "Brazil" },
  "56":  { tz: "America/Santiago",        country: "Chile" },
  "57":  { tz: "America/Bogota",          country: "Colombia" },
  "58":  { tz: "America/Caracas",         country: "Venezuela" },
  "60":  { tz: "Asia/Kuala_Lumpur",       country: "Malaysia" },
  "61":  { tz: "Australia/Sydney",        country: "Australia" },
  "62":  { tz: "Asia/Jakarta",            country: "Indonesia" },
  "63":  { tz: "Asia/Manila",             country: "Philippines" },
  "64":  { tz: "Pacific/Auckland",        country: "New Zealand" },
  "65":  { tz: "Asia/Singapore",          country: "Singapore" },
  "66":  { tz: "Asia/Bangkok",            country: "Thailand" },
  "81":  { tz: "Asia/Tokyo",              country: "Japan" },
  "82":  { tz: "Asia/Seoul",              country: "South Korea" },
  "84":  { tz: "Asia/Ho_Chi_Minh",        country: "Vietnam" },
  "86":  { tz: "Asia/Shanghai",           country: "China" },
  "90":  { tz: "Europe/Istanbul",         country: "Turkey" },
  "91":  { tz: "Asia/Kolkata",            country: "India" },
  "92":  { tz: "Asia/Karachi",            country: "Pakistan" },
  "93":  { tz: "Asia/Kabul",              country: "Afghanistan" },
  "94":  { tz: "Asia/Colombo",            country: "Sri Lanka" },
  "95":  { tz: "Asia/Rangoon",            country: "Myanmar" },
  "98":  { tz: "Asia/Tehran",             country: "Iran" },
  "212": { tz: "Africa/Casablanca",       country: "Morocco" },
  "213": { tz: "Africa/Algiers",          country: "Algeria" },
  "216": { tz: "Africa/Tunis",            country: "Tunisia" },
  "218": { tz: "Africa/Tripoli",          country: "Libya" },
  "220": { tz: "Africa/Banjul",           country: "Gambia" },
  "221": { tz: "Africa/Dakar",            country: "Senegal" },
  "222": { tz: "Africa/Nouakchott",       country: "Mauritania" },
  "223": { tz: "Africa/Bamako",           country: "Mali" },
  "224": { tz: "Africa/Conakry",          country: "Guinea" },
  "225": { tz: "Africa/Abidjan",          country: "Ivory Coast" },
  "226": { tz: "Africa/Ouagadougou",      country: "Burkina Faso" },
  "227": { tz: "Africa/Niamey",           country: "Niger" },
  "228": { tz: "Africa/Lome",             country: "Togo" },
  "229": { tz: "Africa/Porto-Novo",       country: "Benin" },
  "230": { tz: "Indian/Mauritius",        country: "Mauritius" },
  "231": { tz: "Africa/Monrovia",         country: "Liberia" },
  "232": { tz: "Africa/Freetown",         country: "Sierra Leone" },
  "233": { tz: "Africa/Accra",            country: "Ghana" },
  "234": { tz: "Africa/Lagos",            country: "Nigeria" },
  "235": { tz: "Africa/Ndjamena",         country: "Chad" },
  "236": { tz: "Africa/Bangui",           country: "CAR" },
  "237": { tz: "Africa/Douala",           country: "Cameroon" },
  "238": { tz: "Atlantic/Cape_Verde",     country: "Cape Verde" },
  "239": { tz: "Africa/Sao_Tome",         country: "São Tomé" },
  "240": { tz: "Africa/Malabo",           country: "Equatorial Guinea" },
  "241": { tz: "Africa/Libreville",       country: "Gabon" },
  "242": { tz: "Africa/Brazzaville",      country: "Congo" },
  "243": { tz: "Africa/Kinshasa",         country: "DR Congo" },
  "244": { tz: "Africa/Luanda",           country: "Angola" },
  "245": { tz: "Africa/Bissau",           country: "Guinea-Bissau" },
  "246": { tz: "Indian/Chagos",           country: "British Indian Ocean" },
  "247": { tz: "Atlantic/St_Helena",      country: "Ascension Island" },
  "248": { tz: "Indian/Mahe",             country: "Seychelles" },
  "249": { tz: "Africa/Khartoum",         country: "Sudan" },
  "250": { tz: "Africa/Kigali",           country: "Rwanda" },
  "251": { tz: "Africa/Addis_Ababa",      country: "Ethiopia" },
  "252": { tz: "Africa/Mogadishu",        country: "Somalia" },
  "253": { tz: "Africa/Djibouti",         country: "Djibouti" },
  "254": { tz: "Africa/Nairobi",          country: "Kenya" },
  "255": { tz: "Africa/Dar_es_Salaam",    country: "Tanzania" },
  "256": { tz: "Africa/Kampala",          country: "Uganda" },
  "257": { tz: "Africa/Bujumbura",        country: "Burundi" },
  "258": { tz: "Africa/Maputo",           country: "Mozambique" },
  "260": { tz: "Africa/Lusaka",           country: "Zambia" },
  "261": { tz: "Indian/Antananarivo",     country: "Madagascar" },
  "262": { tz: "Indian/Reunion",          country: "Réunion" },
  "263": { tz: "Africa/Harare",           country: "Zimbabwe" },
  "264": { tz: "Africa/Windhoek",         country: "Namibia" },
  "265": { tz: "Africa/Blantyre",         country: "Malawi" },
  "266": { tz: "Africa/Maseru",           country: "Lesotho" },
  "267": { tz: "Africa/Gaborone",         country: "Botswana" },
  "268": { tz: "Africa/Mbabane",          country: "Eswatini" },
  "269": { tz: "Indian/Comoro",           country: "Comoros" },
  "291": { tz: "Africa/Asmara",           country: "Eritrea" },
  "297": { tz: "America/Aruba",           country: "Aruba" },
  "351": { tz: "Europe/Lisbon",           country: "Portugal" },
  "352": { tz: "Europe/Luxembourg",       country: "Luxembourg" },
  "353": { tz: "Europe/Dublin",           country: "Ireland" },
  "355": { tz: "Europe/Tirane",           country: "Albania" },
  "356": { tz: "Europe/Malta",            country: "Malta" },
  "358": { tz: "Europe/Helsinki",         country: "Finland" },
  "380": { tz: "Europe/Kyiv",             country: "Ukraine" },
  "381": { tz: "Europe/Belgrade",         country: "Serbia" },
  "385": { tz: "Europe/Zagreb",           country: "Croatia" },
  "386": { tz: "Europe/Ljubljana",        country: "Slovenia" },
  "420": { tz: "Europe/Prague",           country: "Czech Republic" },
  "421": { tz: "Europe/Bratislava",       country: "Slovakia" },
  "503": { tz: "America/El_Salvador",     country: "El Salvador" },
  "504": { tz: "America/Tegucigalpa",     country: "Honduras" },
  "505": { tz: "America/Managua",         country: "Nicaragua" },
  "506": { tz: "America/Costa_Rica",      country: "Costa Rica" },
  "507": { tz: "America/Panama",          country: "Panama" },
  "591": { tz: "America/La_Paz",          country: "Bolivia" },
  "593": { tz: "America/Guayaquil",       country: "Ecuador" },
  "595": { tz: "America/Asuncion",        country: "Paraguay" },
  "598": { tz: "America/Montevideo",      country: "Uruguay" },
  "855": { tz: "Asia/Phnom_Penh",         country: "Cambodia" },
  "856": { tz: "Asia/Vientiane",          country: "Laos" },
  "880": { tz: "Asia/Dhaka",              country: "Bangladesh" },
  "886": { tz: "Asia/Taipei",             country: "Taiwan" },
  "960": { tz: "Indian/Maldives",         country: "Maldives" },
  "961": { tz: "Asia/Beirut",             country: "Lebanon" },
  "962": { tz: "Asia/Amman",              country: "Jordan" },
  "963": { tz: "Asia/Damascus",           country: "Syria" },
  "964": { tz: "Asia/Baghdad",            country: "Iraq" },
  "965": { tz: "Asia/Kuwait",             country: "Kuwait" },
  "966": { tz: "Asia/Riyadh",             country: "Saudi Arabia" },
  "967": { tz: "Asia/Aden",               country: "Yemen" },
  "968": { tz: "Asia/Muscat",             country: "Oman" },
  "970": { tz: "Asia/Gaza",               country: "Palestine" },
  "971": { tz: "Asia/Dubai",              country: "UAE" },
  "972": { tz: "Asia/Jerusalem",          country: "Israel" },
  "973": { tz: "Asia/Bahrain",            country: "Bahrain" },
  "974": { tz: "Asia/Qatar",              country: "Qatar" },
  "975": { tz: "Asia/Thimphu",            country: "Bhutan" },
  "976": { tz: "Asia/Ulaanbaatar",        country: "Mongolia" },
  "977": { tz: "Asia/Kathmandu",          country: "Nepal" },
};

function detectTimezone(phoneJid: string): { tz: string; country: string } | null {
  // Only real phone-number JIDs are useful — LID (@lid) and group (@g.us) JIDs
  // carry no meaningful country code and must be skipped to avoid false matches
  // (e.g. LID "51175206457492@lid" accidentally matches Peru +51)
  if (!phoneJid?.endsWith("@s.whatsapp.net")) return null;
  const digits = phoneJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  // Try longest match first (3-digit codes, then 2-digit, then 1-digit)
  for (const len of [3, 2, 1]) {
    const prefix = digits.slice(0, len);
    if (CC_TZ[prefix]) return CC_TZ[prefix];
  }
  return null;
}

registerCommand({
  name: "time",
  aliases: ["date", "bottime", "mydate", "mytime"],
  category: "General",
  description: "Show your local date and time based on your region",
  handler: async ({ args, sender, from, reply }) => {
    // If user manually provides a timezone arg, use that
    const manualTz = args.join(" ").trim();

    let tz = manualTz;
    let label = manualTz;
    let flag = "🌐";

    if (!manualTz) {
      // Auto-detect: try sender first (real phone JID), then from (chat JID),
      // then fall back to owner number from env (handles LID / group scenarios)
      let detected =
        detectTimezone(sender) ??
        detectTimezone(from) ??
        (() => {
          const ownerNum = process.env.OWNER_NUMBER ?? "";
          return ownerNum ? detectTimezone(ownerNum + "@s.whatsapp.net") : null;
        })();

      if (detected) {
        tz = detected.tz;
        label = detected.country;
        flag = "📍";
      } else {
        tz = "UTC";
        label = "UTC (couldn't detect your region)";
        flag = "🌐";
      }
    }

    try {
      const res = await fetch(`https://worldtimeapi.org/api/timezone/${tz}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("Invalid timezone");
      const data = await res.json() as any;
      const dt = new Date(data.datetime);

      const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const day = dayNames[dt.getDay()];
      const month = monthNames[dt.getMonth()];
      const dateStr = `${day}, ${dt.getDate()} ${month} ${dt.getFullYear()}`;
      const timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

      await reply(
        `╔══════════════════════╗\n` +
        `║  🕐 *DATE & TIME* 🕐\n` +
        `╚══════════════════════╝\n\n` +
        `${flag} *Region:* ${label}\n` +
        `🌍 *Timezone:* ${tz}\n` +
        `📅 *Date:* ${dateStr}\n` +
        `⏰ *Time:* ${timeStr}\n` +
        `🕰️ *UTC Offset:* ${data.utc_offset}\n\n` +
        `💡 _Tip: type .time Africa/Lagos for a specific timezone_`
      );
    } catch {
      // Fallback — show time in the detected/provided timezone using JS
      const now = new Date();
      let timeStr = "";
      try {
        timeStr = now.toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "medium" });
      } catch {
        timeStr = now.toUTCString();
        tz = "UTC";
      }
      await reply(
        `🕐 *Date & Time*\n\n` +
        `${flag} *Region:* ${label}\n` +
        `🌍 *Timezone:* ${tz}\n` +
        `📅 ${timeStr}`
      );
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
  name: "social",
  aliases: ["links", "socials", "follow"],
  category: "General",
  description: "Show all MAXX XMD social media and contact links",
  handler: async ({ sock, from, msg, settings }) => {
    const botName = settings.botName || "MAXX-XMD";
    const text =
      `╔══════════════════════════╗\n` +
      `║  🌐 *${botName} SOCIAL LINKS* 🌐\n` +
      `╚══════════════════════════╝\n\n` +
      `📢 *WhatsApp Channel:*\n` +
      `https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J\n\n` +
      `🔗 *Bot Pairing Site:*\n` +
      `https://pair.maxxtech.co.ke\n\n` +
      `🌍 *Website:*\n` +
      `https://www.maxxtech.co.ke\n\n` +
      `💻 *GitHub (Source Code):*\n` +
      `https://github.com/Carlymaxx/maxxtechxmd\n\n` +
      `> _⭐ Star us on GitHub — it helps a lot!_ ⚡`;
    await sock.sendMessage(from, { text }, { quoted: msg });
    await sock.sendMessage(from, {
      text: `📢 *Follow ${botName} on WhatsApp Channel* — tap below 👇\n\nhttps://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J`,
    });
  },
});

registerCommand({
  name: "restart",
  aliases: ["reboot", "relaunch", "botrestart"],
  category: "Owner",
  ownerOnly: true,
  description: "Pull latest code from GitHub and redeploy the bot",
  handler: async ({ reply }) => {
    const herokuApiKey = process.env.HEROKU_API_KEY;
    const herokuAppName = process.env.HEROKU_APP_NAME || "maxx-xmd-bot";
    const githubRepo = process.env.GITHUB_REPO || "Carlymaxx/maxxtechxmd";

    // ── Step 1: Check for new commits on GitHub ───────────────────────────────
    let latestCommit = "";
    let commitMsg = "";
    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${githubRepo}/commits/main`,
        { headers: { "Accept": "application/vnd.github.v3+json" }, signal: AbortSignal.timeout(8000) }
      );
      if (ghRes.ok) {
        const data = await ghRes.json() as any;
        latestCommit = data.sha?.slice(0, 7) || "";
        commitMsg = data.commit?.message?.split("\n")[0]?.slice(0, 60) || "";
      }
    } catch { /* no problem — still restart */ }

    await reply(
      `╔══════════════════════════╗\n` +
      `║  🔄 *RESTARTING BOT* 🔄\n` +
      `╚══════════════════════════╝\n\n` +
      `📦 *Pulling latest code from GitHub...*\n` +
      (latestCommit ? `🆕 *Latest commit:* \`${latestCommit}\`\n📝 ${commitMsg}\n` : "") +
      `\n♻️ Redeploying now — will be back in ~2 mins!\n` +
      `📩 You'll get a notification when it's online.\n\n` +
      `> _MAXX-XMD_ ⚡`
    );

    // ── Step 2: Trigger Heroku rebuild (pulls latest GitHub code + rebuilds) ──
    if (herokuApiKey) {
      setTimeout(async () => {
        try {
          const buildRes = await fetch(
            `https://api.heroku.com/apps/${herokuAppName}/builds`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${herokuApiKey}`,
                "Accept": "application/vnd.heroku+json; version=3",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                source_blob: {
                  url: `https://github.com/${githubRepo}/archive/refs/heads/main.tar.gz`,
                  version: latestCommit || "main",
                },
              }),
            }
          );
          if (!buildRes.ok) {
            const err = await buildRes.text();
            throw new Error(`Heroku build failed: ${err.slice(0, 100)}`);
          }
        } catch (e: any) {
          // If Heroku rebuild fails, fall back to simple process restart
          setTimeout(() => process.exit(0), 1000);
        }
      }, 3000);
    } else {
      // No Heroku key — just restart the process (uses same built code)
      setTimeout(() => process.exit(0), 3000);
    }
  },
});

registerCommand({
  name: "deploy",
  aliases: ["updates", "changelog", "whatsnew", "redeploy"],
  category: "General",
  description: "Pull latest code from GitHub and restart the bot",
  sudoOnly: true,
  handler: async ({ args, reply }) => {
    // If user passes "check" arg, just show latest commits without updating
    if (args[0]?.toLowerCase() === "check") {
      try {
        const res = await fetch("https://api.github.com/repos/Carlymaxx/maxxtechxmd/commits?per_page=5", {
          headers: { "Accept": "application/vnd.github.v3+json" },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        const commits = await res.json() as any[];
        if (!commits.length) return reply("❌ No commits found.");

        let text = `╔══════════════════════════╗\n`;
        text += `║  🔄 *MAXX-XMD UPDATES* 🔄\n`;
        text += `╚══════════════════════════╝\n\n`;
        text += `📡 *Latest changes from GitHub:*\n\n`;

        for (let i = 0; i < commits.length; i++) {
          const c = commits[i];
          const msg = c.commit.message.split("\n")[0].slice(0, 80);
          const date = new Date(c.commit.author.date).toLocaleDateString("en-US", {
            timeZone: "Africa/Nairobi", year: "numeric", month: "short", day: "numeric",
          });
          const sha = c.sha.slice(0, 7);
          const icon = i === 0 ? "🆕" : "•";
          text += `${icon} *${msg}*\n`;
          text += `   └─ \`${sha}\` · ${date}\n\n`;
        }

        text += `💡 _Type .update to install these updates automatically_\n\n`;
        text += `> _MAXX-XMD_ ⚡`;
        await reply(text);
      } catch (e: any) {
        await reply(`❌ Could not fetch updates.\n\nError: ${e.message?.slice(0, 100) || "Unknown"}`);
      }
      return;
    }

    // Auto-update: restart the process — startup script (start.sh) handles git pull + rebuild
    await reply(`╔══════════════════════════╗
║  🔄 *UPDATING MAXX-XMD* 🔄
╚══════════════════════════╝

⏳ Restarting bot to pull latest code from GitHub...
🔧 The startup script will pull changes, rebuild, and start fresh.
♻️ Bot will be back in ~30 seconds!`);

    setTimeout(() => {
      process.exit(0);
    }, 2000);
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
  name: "link",
  aliases: ["links", "getlinks", "botlinks"],
  category: "General",
  description: "Show all official MAXX-XMD links — pairing site, WhatsApp group & channel",
  handler: async ({ sock, from, msg, settings }) => {
    const botName     = (settings.botName     as string) || "MAXX-XMD";
    const pairLink    = "https://pair.maxxtech.co.ke";
    const website     = "https://www.maxxtech.co.ke";
    const github      = "https://github.com/Carlymaxx/maxxtechxmd";
    const channelLink = (settings.channelLink as string) || "https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J";
    const groupLink   = (settings.groupLink   as string) || "https://chat.whatsapp.com/BWZOtIlbZoJ9Xt8lgxxbqQ";

    const text =
      `╔══════════════════════════╗\n` +
      `║  🔗 *${botName} LINKS* 🔗\n` +
      `╚══════════════════════════╝\n\n` +
      `🌐 *Pairing Site:*\n${pairLink}\n\n` +
      `👥 *WhatsApp Group:*\n${groupLink}\n\n` +
      `📢 *WhatsApp Channel:*\n${channelLink}\n\n` +
      `🖥️ *Website:*\n${website}\n\n` +
      `💻 *GitHub (Source):*\n${github}\n\n` +
      `> _Tap any link to open • ${botName}_ ⚡`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  },
});

registerCommand({
  name: "pair",
  aliases: ["getid", "session", "pairdevice"],
  category: "General",
  description: "Generate a WhatsApp pairing code for any device",
  handler: async ({ sock, from, msg, args, settings, reply }) => {
    const phone = args[0]?.replace(/\D/g, "");
    if (!phone || phone.length < 7) {
      return reply(`╔══════════════════════╗
║ 🔗 *PAIR DEVICE* 🔗
╚══════════════════════╝

📌 *Usage:* .pair <phone number>
📝 *Example:* .pair 254712345678

Include country code, no + or spaces.

🌐 *Or use web pairing:*
https://pair.maxxtech.co.ke

> _MAXX-XMD_ ⚡`);
    }

    await reply(`╔══════════════════════╗
║ 🔗 *PAIR DEVICE* 🔗
╚══════════════════════╝

📱 *Number:* +${phone}
`);

    try {
      const { generatePairingCode } = await import("../baileys.js");
      const pairingCode = await generatePairingCode(phone);

      // Code in its own monospace code-block box, then instructions below
      await reply(
        `🔑 *YOUR PAIRING CODE*\n\n` +
        `\`\`\`\n${pairingCode}\n\`\`\`\n\n` +
        `📱 *Steps to link your device:*\n` +
        `1️⃣ Open WhatsApp Settings\n` +
        `2️⃣ Tap *Linked Devices*\n` +
        `3️⃣ Tap *Link a Device*\n` +
        `4️⃣ Choose *Link with phone number*\n` +
        `5️⃣ Enter the code shown above\n\n` +
        `⏱️ _Expires in ~60 seconds_\n\n` +
        `> _MAXX-XMD_ ⚡`
      );

    } catch (e: any) {
      await reply(
        `❌ *Could not generate pairing code*\n\n` +
        `${e.message?.slice(0, 120) || "Unknown error"}\n\n` +
        `Use the web method instead:\n` +
        `https://pair.maxxtech.co.ke`
      );
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
📦 *Version:* 3.0.0
⚡ *Uptime:* ${uptime()}
🛠️ *Platform:* Node.js / Baileys

📋 *Features:*
• 580+ Commands
• Group Management
• Auto-Reply & AI Chat
• Media Downloads
• Sports Updates
• Fun & Games

🔗 *Repo:* github.com/Carlymaxx/maxxtechxmd
🌍 *Website:* www.maxxtech.co.ke

> _MAXX-XMD_ ⚡`);
  },
});

registerCommand({
  name: "menu",
  aliases: ["help", "commands", "list"],
  category: "General",
  description: "Show all bot commands",
  handler: async ({ sock, from, msg, args, settings, senderName, reply }) => {
    const cat = args[0]?.toLowerCase();
    const p = settings.prefix;

    // ── Category config ────────────────────────────────────────────────────
    const CAT_ORDER = [
      "General", "AI", "Download", "Search", "Photo", "Fun", "Games",
      "Anime", "Pokemon", "Group", "Converter", "Finance", "Health", "Math",
      "Education", "Settings", "Tools", "Audio", "Religion", "Sports", "Owner",
      "Sticker", "Protection", "Economy", "Lifestyle", "Coding", "Reactions",
      "Stalker", "Channel", "Uploader",
    ];
    const CAT_EMOJI: Record<string, string> = {
      General: "🌐", AI: "🤖", Download: "⬇️", Search: "🔍",
      Photo: "📸", Fun: "😂", Games: "🎮", Anime: "🎌", Pokemon: "🔴",
      Group: "👥", Converter: "🔄", Finance: "💰", Health: "❤️",
      Math: "🔢", Education: "📚",
      Settings: "⚙️", Tools: "🔧", Audio: "🎵", Religion: "🕌", Sports: "⚽", Owner: "👑",
      Sticker: "🎭", Protection: "🛡️", Economy: "🪙", Lifestyle: "🌿",
      Coding: "💻", Reactions: "💝", Stalker: "🕵️", Channel: "📢", Uploader: "📤",
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

      const botName = settings.botName || "MAXX-XMD";
      const ownerName = settings.ownerName || "MAXX";
      const totalCmds = uniqueCmds.length;

      // ── Live session feed ─────────────────────────────────────────────────
      const liveSessions = getLiveSessions();
      const liveCount = liveSessions.length;
      const liveBlock = liveCount > 0 ? `🤖 *Bots:* ${liveCount} active\n` : "";

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
        `📦 *Commands:* ${totalCmds} total\n` +
        `🔢 *Uses:* ${getCmdUsageCount().toLocaleString()}\n` +
        liveBlock +
        `\n`;

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

      text += `> _Powered by ${botName}_ ⚡`;

      const MENU_IMAGES = [
        "https://files.catbox.moe/jlz9dq.png",
        "https://files.catbox.moe/gsbjqz.jpg",
        "https://files.catbox.moe/llsa6p.jpg",
        "https://files.catbox.moe/u0jt81.jpg",
        "https://files.catbox.moe/l478xo.jpg",
        "https://files.catbox.moe/kzl01l.jpg",
        "https://files.catbox.moe/6qdiwk.jpg",
        "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg",
      ];
      const botpic: string = (settings as any).botpic ||
        MENU_IMAGES[Math.floor(Math.random() * MENU_IMAGES.length)];
      try {
        await sock.sendMessage(from, { image: { url: botpic }, caption: text }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text }, { quoted: msg });
      }
      await sock.sendMessage(from, { text: `https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J` });
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
      out += `💡 _${cmds.length} command${cmds.length !== 1 ? "s" : ""} in ${matchedCat}_\n\n`;
      out += `> _MAXX-XMD_ ⚡`;
      await reply(out);
      await sock.sendMessage(from, { text: `https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J` });
    } else {
      const cats = [...grouped.keys()].map(k => `${CAT_EMOJI[k] || "📌"} ${p}menu ${k.toLowerCase()}`).join("\n");
      await reply(`❌ Category *${cat}* not found.\n\n📋 *Available categories:*\n${cats}`);
    }
  },
});


registerCommand({
  name: "hack",
  aliases: ["hacking", "breach", "hackip", "cyberattack"],
  category: "Fun",
  description: "Realistic animated hack simulation with real IP/user lookup (.hack <target>)",
  usage: ".hack <name/ip/username>",
  handler: async ({ args, sock, from, msg }) => {
    const target = args.join(" ").trim() || "Target";
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const send = (text: string) => sock.sendMessage(from, { text }, { quoted: msg });

    // ── Generate realistic-looking fake data ─────────────────────────────────
    const randomIp = () => `${randInt(1,254)}.${randInt(0,255)}.${randInt(0,255)}.${randInt(1,254)}`;
    const randomMac = () => Array.from({length:6}, () => randHex(2)).join(":");
    const randomPort = () => [21,22,23,25,53,80,110,143,443,3306,3389,5900,8080][Math.floor(Math.random()*13)];
    const randomHash = (len: number) => Array.from({length:len}, () => randHex(2)).join("");
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target);

    // ── Try to fetch real data about the target ──────────────────────────────
    let realData: Record<string, string> = {};
    try {
      if (isIp) {
        const r = await fetch(`http://ip-api.com/json/${target}?fields=country,regionName,city,isp,org,lat,lon,timezone,mobile,proxy`, { signal: AbortSignal.timeout(5000) });
        const d = await r.json() as any;
        if (d.country) {
          realData = { country: d.country, city: d.city || "Unknown", isp: d.isp || "Unknown", org: d.org || d.isp || "Unknown", lat: String(d.lat || "?"), lon: String(d.lon || "?"), tz: d.timezone || "Unknown", proxy: d.proxy ? "VPN/Proxy Detected ⚠️" : "None detected" };
        }
      } else {
        // Try GitHub username lookup
        const r = await fetch(`https://api.github.com/users/${encodeURIComponent(target)}`, { signal: AbortSignal.timeout(5000) });
        if (r.ok) {
          const d = await r.json() as any;
          realData = { gh_name: d.name || target, gh_login: d.login, gh_repos: String(d.public_repos || 0), gh_followers: String(d.followers || 0), gh_location: d.location || "Unknown", gh_bio: d.bio || "No bio", gh_created: new Date(d.created_at).getFullYear().toString() };
        }
      }
    } catch { /* real lookup failed, continue with simulation */ }

    const ip = isIp ? target : randomIp();
    const proxyChain = [randomIp(), randomIp(), randomIp()];
    const openPort = randomPort();
    const macAddr = randomMac();
    const sessionToken = randomHash(16);
    const encKey = randomHash(32);
    const countries = ["🇳🇱 Netherlands","🇩🇪 Germany","🇺🇸 United States","🇸🇬 Singapore","🇫🇷 France","🇷🇺 Russia"];
    const exitNode = realData.country ? `${realData.country}` : countries[Math.floor(Math.random()*countries.length)];
    const city = realData.city || ["Amsterdam","Berlin","Dallas","Singapore","Paris","Moscow"][Math.floor(Math.random()*6)];
    const isp = realData.isp || ["Cloudflare Inc","AWS","DigitalOcean","OVH SAS","Hetzner Online GmbH"][Math.floor(Math.random()*5)];

    // ── PHASE 1: Initiation ──────────────────────────────────────────────────
    await send(
      `╔══════════════════════════════╗\n` +
      `║  💻 *MAXX-XMD CYBER TERMINAL* ║\n` +
      `╚══════════════════════════════╝\n\n` +
      `🎯 *Target:* \`${target}\`\n` +
      `🕒 *Timestamp:* ${new Date().toISOString()}\n` +
      `🔑 *Session:* \`${sessionToken}\`\n\n` +
      `> _Initializing attack sequence..._`
    );
    await sleep(1800);

    // ── PHASE 2: Network recon ───────────────────────────────────────────────
    await send(
      `📡 *[PHASE 1] Network Reconnaissance*\n` +
      `${"─".repeat(30)}\n\n` +
      `🔍 Resolving target...\n` +
      `   └─ IP Address: \`${ip}\`\n\n` +
      `🌐 Routing through proxy chain:\n` +
      `   ├─ Hop 1: \`${proxyChain[0]}\` (TOR Node)\n` +
      `   ├─ Hop 2: \`${proxyChain[1]}\` (VPN Exit)\n` +
      `   └─ Hop 3: \`${proxyChain[2]}\` → Target\n\n` +
      `📍 *Geolocation:*\n` +
      `   ├─ Location: ${exitNode}${city !== exitNode ? ", " + city : ""}\n` +
      `   ├─ ISP: ${isp}\n` +
      (realData.lat ? `   ├─ Coords: ${realData.lat}, ${realData.lon}\n` : "") +
      (realData.tz ? `   └─ Timezone: ${realData.tz}\n` : `   └─ Timezone: UTC+${randInt(0,12)}\n`) +
      `\n✅ _Geolocation mapped_`
    );
    await sleep(2200);

    // ── PHASE 3: Port scan ───────────────────────────────────────────────────
    const allPorts = [22, 80, 443, 3306, 3389, 8080, 21, 25];
    const openPorts = allPorts.filter(() => Math.random() > 0.5);
    if (!openPorts.includes(openPort)) openPorts.push(openPort);
    await send(
      `🔬 *[PHASE 2] Port Scan & Service Detection*\n` +
      `${"─".repeat(30)}\n\n` +
      `⚡ Running Nmap aggressive scan...\n\n` +
      openPorts.map(p => {
        const svc: Record<number,string> = {22:"SSH",80:"HTTP",443:"HTTPS/TLS",3306:"MySQL",3389:"RDP",8080:"HTTP-Alt",21:"FTP",25:"SMTP"};
        return `   ✅ Port \`${p}\` — ${svc[p] || "Unknown"} *OPEN*`;
      }).join("\n") +
      `\n\n🔎 MAC Address: \`${macAddr}\`\n` +
      `💥 *Vulnerable port selected:* \`${openPort}\`\n\n` +
      `✅ _Attack surface identified_`
    );
    await sleep(2000);

    // ── PHASE 4: Exploitation ────────────────────────────────────────────────
    const exploits: Record<number, string> = {
      22: "SSH brute-force (rockyou.txt wordlist)",
      80: "SQL injection via login endpoint",
      443: "SSL heartbleed exploit (CVE-2014-0160)",
      3306: "MySQL root default credentials",
      3389: "BlueKeep RDP exploit (CVE-2019-0708)",
      8080: "HTTP Basic auth bypass",
      21: "FTP anonymous login + path traversal",
      25: "SMTP open relay abuse",
    };
    const exploit = exploits[openPort] || "Zero-day buffer overflow";
    await send(
      `💥 *[PHASE 3] Exploitation*\n` +
      `${"─".repeat(30)}\n\n` +
      `🧠 Loading exploit module...\n` +
      `   └─ *${exploit}*\n\n` +
      `⚙️ Compiling payload...\n` +
      `   ├─ Encoder: x86/shikata_ga_nai\n` +
      `   ├─ Iterations: ${randInt(3,12)}\n` +
      `   └─ Payload size: ${randInt(350,900)} bytes\n\n` +
      `📤 Sending payload to \`${ip}:${openPort}\`...\n` +
      `   ├─ Attempt 1/3: ❌ Firewall blocked\n` +
      `   ├─ Attempt 2/3: ❌ IDS triggered — switching encoder\n` +
      `   └─ Attempt 3/3: ✅ *Shell dropped!*\n\n` +
      `✅ _Remote code execution achieved_`
    );
    await sleep(2400);

    // ── PHASE 5: Data extraction ─────────────────────────────────────────────
    const fileCount = randInt(200, 9999);
    const dbRows = randInt(1000, 500000);
    const contacts = randInt(50, 800);
    const photos = randInt(100, 5000);

    let extracted = `📂 *[PHASE 4] Data Extraction*\n` +
      `${"─".repeat(30)}\n\n` +
      `🔓 Escalating to root privileges...\n` +
      `   └─ UID: 0 (root) ✅\n\n` +
      `📁 Scanning filesystem...\n` +
      `   ├─ *${fileCount.toLocaleString()} files* found\n` +
      `   ├─ *${photos.toLocaleString()} media files* (photos/videos)\n` +
      `   ├─ *${contacts.toLocaleString()} contacts* extracted\n` +
      `   └─ Encryption key: \`${encKey.slice(0,16)}...\`\n\n` +
      `🗃️ Dumping database...\n` +
      `   ├─ Tables: ${randInt(5,50)} found\n` +
      `   ├─ Rows: *${dbRows.toLocaleString()}* records\n` +
      `   └─ Passwords: ${randInt(100,10000).toLocaleString()} hashes extracted\n\n`;

    if (realData.gh_login) {
      extracted +=
        `👤 *GitHub Profile Found:*\n` +
        `   ├─ Login: \`${realData.gh_login}\`\n` +
        `   ├─ Name: ${realData.gh_name}\n` +
        `   ├─ Location: ${realData.gh_location}\n` +
        `   ├─ Repos: ${realData.gh_repos}  Followers: ${realData.gh_followers}\n` +
        `   ├─ Account since: ${realData.gh_created}\n` +
        `   └─ Bio: _${(realData.gh_bio || "").slice(0,60)}_\n\n`;
    }

    if (realData.proxy) {
      extracted += `🛡️ *Proxy/VPN Status:* ${realData.proxy}\n\n`;
    }

    extracted += `✅ _All data exfiltrated via encrypted tunnel_`;
    await send(extracted);
    await sleep(2200);

    // ── PHASE 6: Covering tracks + result ────────────────────────────────────
    await send(
      `🧹 *[PHASE 5] Covering Tracks*\n` +
      `${"─".repeat(30)}\n\n` +
      `🗑️ Wiping system logs...\n` +
      `   ├─ /var/log/auth.log — ✅ Cleared\n` +
      `   ├─ /var/log/syslog — ✅ Cleared\n` +
      `   ├─ bash history — ✅ Overwritten\n` +
      `   └─ Network traces — ✅ Flushed\n\n` +
      `🔌 Closing backdoor...\n` +
      `🔒 Encrypting exfiltrated data...\n` +
      `📡 Disconnecting all proxy hops...\n\n` +
      `╔══════════════════════════════╗\n` +
      `║   ✅ *HACK COMPLETE!* 😈      ║\n` +
      `╚══════════════════════════════╝\n\n` +
      `🎯 Target: *${target}*\n` +
      `🌐 IP: \`${ip}\`\n` +
      `📁 Files: *${fileCount.toLocaleString()}* stolen\n` +
      `📞 Contacts: *${contacts.toLocaleString()}* synced\n` +
      `🗃️ DB Records: *${dbRows.toLocaleString()}* dumped\n` +
      `📸 Media: *${photos.toLocaleString()}* accessed\n` +
      `⏱️ Duration: *${(6.2 + Math.random()*3).toFixed(1)}s*\n\n` +
      `> ⚠️ _This is a fun simulation. No real hacking occurred._\n> _MAXX-XMD_ ⚡`
    );
  },
});

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randHex(len: number) { return Math.floor(Math.random() * Math.pow(16, len)).toString(16).padStart(len, "0"); }

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
  aliases: ["clear", "clr", "chatclear"],
  category: "General",
  description: "Silently wipe all chat history — no message, no box, just clean",
  handler: async ({ sock, from, msg }) => {
    try {
      // 1. Delete the command message itself (silent)
      try { await sock.sendMessage(from, { delete: msg.key }); } catch {}

      // 2. Wipe entire chat history from bot's WhatsApp — all messages, all time
      try { await (sock as any).chatModify({ clear: true }, from); } catch {}
      // Also archive then unarchive to force a full reset of chat state
      try { await (sock as any).chatModify({ archive: true }, from); } catch {}
      try { await (sock as any).chatModify({ archive: false }, from); } catch {}
      // Mark as read to clear notification badge
      try { await (sock as any).chatModify({ markRead: true }, from); } catch {}

      // 3. Send a completely invisible ghost message (2000 lines of zero-width chars)
      //    Pushes ALL old messages far off-screen on both sides
      const invisible = "\u200b\u200c\u200d\uFEFF".repeat(8) + "\n";
      const ghost = invisible.repeat(2000);
      const ghostMsg = await sock.sendMessage(from, { text: ghost });

      // 4. Delete the invisible message — chat looks completely empty
      await new Promise(r => setTimeout(r, 900));
      if (ghostMsg?.key) {
        try { await sock.sendMessage(from, { delete: ghostMsg.key }); } catch {}
      }
    } catch { /* fail silently */ }
  },
});

registerCommand({
  name: "version",
  aliases: ["ver", "v"],
  category: "General",
  description: "Show bot version",
  handler: async ({ settings, reply }) => {
    await reply(`╔══════════════════════╗
║  🤖 *MAXX-XMD v3.0.0*  ║
╚══════════════════════╝

📦 *Version:* 3.0.0
👑 *Owner:* ${settings.ownerName}
🛠️ *Platform:* Node.js / Baileys
🔧 *Commands:* 580+
🌍 *Website:* www.maxxtech.co.ke
🔗 *GitHub:* github.com/Carlymaxx/maxxtechxmd

> _MAXX-XMD_ ⚡`);
  },
});
