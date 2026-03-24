import os from "os";
import { registerCommand } from "./types";

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
  handler: async ({ sock, from, settings, reply }) => {
    const mem = process.memoryUsage();
    const total = os.totalmem();
    const used = mem.rss;
    const pct = Math.round((used / total) * 100);
    const start = Date.now();
    await reply("pinging...");
    const speed = Date.now() - start;
    const count = 150;
    const text = `┏▣ ◈ *MAXX XMD* ◈
┃ *ᴏᴡɴᴇʀ* : ${settings.ownerName}
┃ *ᴘʀᴇғɪx* : [ ${settings.prefix} ]
┃ *ʜᴏsᴛ* : Replit
┃ *ᴘʟᴜɢɪɴs* : ${count}
┃ *ᴍᴏᴅᴇ* : ${settings.mode}
┃ *ᴠᴇʀsɪᴏɴ* : 2.0.0
┃ *sᴘᴇᴇᴅ* : ${speed} ms
┃ *ᴜsᴀɢᴇ* : ${formatBytes(used)} of ${formatBytes(total)}
┃ *ʀᴀᴍ:* [${ramBar(pct)}] ${pct}%
┗▣`;
    await reply(text);
  },
});

registerCommand({
  name: "ping",
  aliases: ["ping2", "speed"],
  category: "General",
  description: "Check bot response speed",
  handler: async ({ reply }) => {
    const start = Date.now();
    await reply("🏓 Pinging...");
    await reply(`🏓 Pong! *${Date.now() - start}ms*`);
  },
});

registerCommand({
  name: "runtime",
  aliases: ["uptime"],
  category: "General",
  description: "Show bot runtime",
  handler: async ({ reply }) => {
    await reply(`⏱️ *MAXX XMD Runtime*\n\n🕐 Uptime: *${uptime()}*`);
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
  description: "Get bot owner contact",
  handler: async ({ settings, reply }) => {
    await reply(`👑 *MAXX XMD Owner*\n\n📛 Name: *${settings.ownerName}*\n📱 Number: *${settings.ownerNumber || "Not set"}*\n\n_Developed by MAXX XMD Team_`);
  },
});

registerCommand({
  name: "pair",
  aliases: ["getid", "session"],
  category: "General",
  description: "Get your session ID",
  handler: async ({ reply }) => {
    await reply(`🔗 *Get Your Session ID*\n\nVisit the link below to pair your WhatsApp and get your SESSION_ID:\n\n🌐 https://maxxtechxmd.replit.app/pair\n\n_Enter your phone number with country code (e.g. 254712345678) and follow the instructions_`);
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
  description: "Show command menu",
  handler: async ({ sock, from, msg, args, settings, reply }) => {
    const cat = args[0]?.toLowerCase();
    const p = settings.prefix;

    if (!cat) {
      // ── Full menu with new style ─────────────────────────────────────────
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
      const EMOJIS = ["🔥","⚡","💫","✨","🌟","💎","🚀","🎯","💥","🎊","🎉","🌈","💪","🎶","🤩","😎","🏆","💯","🦋","🌺"];
      const r = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const senderName = (msg as any).pushName || "User";
      const botName = settings.botName || "MAXX-XMD";
      const ownerName = settings.ownerName || "MAXX";

      const text =
`╔══════════════════════════╗
║  ✨ *${botName} MENU* ✨
╚══════════════════════════╝

${greeting}, *${senderName}*! ${r()}

👑 *Owner:* ${ownerName}
🔧 *Prefix:* ${p}
🌐 *Mode:* ${settings.mode || "public"}
🕒 *Time:* ${timeStr}
📅 *Date:* ${dateStr}
⏱️ *Uptime:* ${hours}h ${mins}m
💾 *RAM:* ${usedMem}MB / ${totalMem}MB

╔═══ 🛠️ *UTILITIES* ═══╗
║ ${p}menu - Bot menu ${r()}
║ ${p}ping - Check response ${r()}
║ ${p}alive - Bot status ${r()}
║ ${p}botinfo - Bot info ${r()}
║ ${p}owner - Owner contact ${r()}
║ ${p}repo - Source code ${r()}
║ ${p}runtime - Uptime & system ${r()}
╚════════════════════╝

╔═══ 😂 *FUN & GAMES* ═══╗
║ ${p}jokes - Random joke ${r()}
║ ${p}quotes - Inspiration ${r()}
║ ${p}fact - Random fact ${r()}
║ ${p}memes - Random meme ${r()}
║ ${p}trivia - Quiz question ${r()}
║ ${p}xxqc - Magic 8-ball ${r()}
║ ${p}truth - Truth question ${r()}
║ ${p}dare - Dare challenge ${r()}
║ ${p}truthdetector - Fun detector ${r()}
╚════════════════════╝

╔═══ 🔧 *TOOLS* ═══╗
║ ${p}sticker - Make sticker ${r()}
║ ${p}toimage - Sticker to image ${r()}
║ ${p}ssweb - Screenshot website ${r()}
║ ${p}calculate - Calculator ${r()}
║ ${p}toptt - Text to speech ${r()}
║ ${p}qrcode - Generate QR code ${r()}
║ ${p}tinyurl - Shorten URL ${r()}
║ ${p}genpass - Secure password ${r()}
║ ${p}emojimix - Mix emojis ${r()}
║ ${p}texttopdf - Text to PDF ${r()}
║ ${p}tourl - Upload & get URL ${r()}
║ ${p}getpp - Profile picture ${r()}
╚════════════════════╝

╔═══ ⬇️ *DOWNLOAD* ═══╗
║ ${p}song - YouTube MP3 ${r()}
║ ${p}video - YouTube MP4 ${r()}
║ ${p}tiktok - TikTok video ${r()}
║ ${p}instagram - IG download ${r()}
║ ${p}twitter - Twitter video ${r()}
║ ${p}itunes - Apple Music ${r()}
║ ${p}yts - Movie torrents ${r()}
║ ${p}image - Search images ${r()}
║ ${p}pin - Pinterest ${r()}
║ ${p}mediafire - MediaFire link ${r()}
╚════════════════════╝

╔═══ 👥 *GROUP* ═══╗
║ ${p}tagall - Tag everyone ${r()}
║ ${p}tag - Tag with message ${r()}
║ ${p}kick - Remove member ${r()}
║ ${p}promote - Make admin ${r()}
║ ${p}demote - Remove admin ${r()}
║ ${p}mute - Mute group ${r()}
║ ${p}unmute - Unmute group ${r()}
║ ${p}link - Invite link ${r()}
║ ${p}antilink - Block links ${r()}
║ ${p}poll - Create poll ${r()}
║ ${p}vcf - Export contacts ${r()}
╚════════════════════╝

╔═══ ⚙️ *SETTINGS* ═══╗
║ ${p}setprefix - Change prefix ${r()}
║ ${p}setbotname - Bot name ${r()}
║ ${p}mode - Public/Private/Inbox ${r()}
║ ${p}chatbot - AI auto-reply ${r()}
║ ${p}anticall - Reject calls ${r()}
║ ${p}autoread - Auto-read msgs ${r()}
║ ${p}alwaysonline - Always online ${r()}
║ ${p}autoreact - React to msgs ${r()}
║ ${p}setwelcome - Welcome msg ${r()}
║ ${p}getsettings - View all settings ${r()}
╚════════════════════╝

╔═══ 🤖 *AI* ═══╗
║ ${p}gpt - ChatGPT AI ${r()}
║ ${p}gemini - Google AI ${r()}
║ ${p}analyze - AI analysis ${r()}
║ ${p}code - Generate code ${r()}
║ ${p}recipe - Get recipes ${r()}
║ ${p}story - Write a story ${r()}
║ ${p}translate - Translate text ${r()}
║ ${p}lyrics - Song lyrics ${r()}
║ ${p}define - Word meaning ${r()}
╚════════════════════╝

╔═══ 🕌 *RELIGION* ═══╗
║ ${p}bible john 3:16 ${r()}
║ ${p}quran 2:255 ${r()}
╚════════════════════╝

╔═══ ⚽ *SPORTS* ═══╗
║ ${p}eplstandings / ${p}eplmatches ${r()}
║ ${p}laligastandings / ${p}clmatches ${r()}
║ ${p}wwenews / ${p}wweschedule ${r()}
╚════════════════════╝

╔═══ 👑 *OWNER* ═══╗
║ ${p}block / ${p}unblock ${r()}
║ ${p}broadcast - Broadcast msg ${r()}
║ ${p}restart - Restart bot ${r()}
║ ${p}addsudo - Add sudo user ${r()}
║ ${p}setbio - Set WhatsApp bio ${r()}
║ ${p}tostatus - Post to status ${r()}
║ ${p}disk - Server storage ${r()}
╚════════════════════╝

📢 *Channel:* https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J

_Powered by Maxx Tech_ ⚡💫`;

      const botpic: string = (settings as any).botpic || "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg";
      try {
        await sock.sendMessage(from, { image: { url: botpic }, caption: text }, { quoted: msg });
      } catch {
        await sock.sendMessage(from, { text }, { quoted: msg });
      }
      return;
    }

    const menus: Record<string, string> = {
      ai: `┏▣ ◈ *🤖 AI MENU* ◈
│➽ ${p}gpt <question> — ChatGPT
│➽ ${p}gemini <question> — Google AI
│➽ ${p}analyze <text> — AI analysis
│➽ ${p}code <request> — generate code
│➽ ${p}recipe <food> — get recipe
│➽ ${p}story <topic> — write a story
│➽ ${p}summarize <text> — summarize
│➽ ${p}teach <topic> — learn about
│➽ ${p}programming <question> — code help
│➽ ${p}generate <topic> — generate content
│➽ ${p}translate2 <lang> <text> — AI translate
│➽ ${p}chatbot on/off — auto-reply mode
┗▣`,
      audio: `┏▣ ◈ *🎵 AUDIO MENU* ◈
│➽ ${p}tomp3 — video → audio (reply to video)
│➽ ${p}tovideo — audio → video (reply to audio)
│➽ ${p}toptt <text> — text to speech
│➽ ${p}volaudio <vol> — boost audio volume
│➽ ${p}volvideo <vol> — boost video volume
│➽ ${p}bass — bass boost effect
│➽ ${p}blown — distorted effect
│➽ ${p}deep — deep voice effect
│➽ ${p}earrape — loud effect
│➽ ${p}reverse — reverse audio
│➽ ${p}robot — robot voice effect
┗▣`,
      download: `┏▣ ◈ *⬇️ DOWNLOAD MENU* ◈
│ 📺 *Video & Music*
│➽ ${p}song <YouTube URL/title>
│➽ ${p}video <YouTube URL/title>
│➽ ${p}tiktok <TikTok URL>
│➽ ${p}tiktokaudio <TikTok URL>
│➽ ${p}twitter <Tweet URL>
│➽ ${p}instagram <Instagram URL>
│➽ ${p}facebook <Facebook URL>
│➽ ${p}itunes <song/artist>
│
│ 🖼️ *Images & Files*
│➽ ${p}image <search term>
│➽ ${p}pin <Pinterest URL>
│➽ ${p}mediafire <URL>
│➽ ${p}apk <app name>
│➽ ${p}gitclone <repo URL>
│➽ ${p}savestatus — how to save statuses
┗▣`,
      fun: `┏▣ ◈ *😂 FUN MENU* ◈
│➽ ${p}jokes — random joke
│➽ ${p}fact — random fact
│➽ ${p}quotes — inspirational quote
│➽ ${p}trivia — quiz question
│➽ ${p}memes — random meme
│➽ ${p}truthdetector <name> — fun detector
│➽ ${p}xxqc <question> — magic 8-ball
┗▣`,
      games: `┏▣ ◈ *🎮 GAMES MENU* ◈
│➽ ${p}truth — random truth question
│➽ ${p}dare — random dare challenge
│➽ ${p}truthordare — random truth or dare
┗▣`,
      group: `┏▣ ◈ *👥 GROUP MENU* ◈
│ 📢 *Tagging*
│➽ ${p}tagall — mention everyone
│➽ ${p}tag <text> — tag all with message
│➽ ${p}tagadmin — mention admins
│➽ ${p}hidetag <text> — silent mention all
│➽ ${p}mediatag — tag with media
│➽ ${p}announce <text> — announcement
│
│ 🛡️ *Admin Controls*
│➽ ${p}kick @user — remove member
│➽ ${p}add 254xxx — add member
│➽ ${p}promote @user — make admin
│➽ ${p}demote @user — remove admin
│➽ ${p}mute — close group chat
│➽ ${p}unmute — open group chat
│➽ ${p}kickall — kick all non-admins
│
│ ⚙️ *Group Settings*
│➽ ${p}link — get invite link
│➽ ${p}resetlink — reset invite link
│➽ ${p}setdesc <text> — set description
│➽ ${p}setgroupname <name> — rename group
│➽ ${p}getgrouppp — group profile pic
│➽ ${p}setppgroup — set group pic
│➽ ${p}poll <q>|<opt1>|<opt2> — create poll
│➽ ${p}welcome on/off — welcome messages
│➽ ${p}antilink on/off — block links
│➽ ${p}antibadword on/off — filter bad words
│➽ ${p}totalmembers — member count
│➽ ${p}userid — get user's JID
│➽ ${p}vcf — export group contacts
┗▣`,
      other: `┏▣ ◈ *ℹ️ GENERAL MENU* ◈
│➽ ${p}alive — bot status & info
│➽ ${p}ping — response speed
│➽ ${p}runtime — bot uptime
│➽ ${p}time <timezone> — world clock
│➽ ${p}repo — GitHub source code
│➽ ${p}owner — owner contact
│➽ ${p}pair — get Session ID
│➽ ${p}botinfo — detailed bot info
┗▣`,
      owner: `┏▣ ◈ *👑 OWNER MENU* ◈
│ 🔒 *User Management*
│➽ ${p}block @user — block user
│➽ ${p}unblock @user — unblock user
│➽ ${p}listblocked — blocked list
│➽ ${p}warn @user <reason> — warn user
│➽ ${p}listwarn — see warnings
│➽ ${p}resetwarn @user — clear warnings
│
│ 🤖 *Bot Control*
│➽ ${p}restart — restart bot
│➽ ${p}broadcast <message> — mass message
│➽ ${p}join <invite link> — join group
│➽ ${p}leave — leave current group
│➽ ${p}delete — delete a message
│➽ ${p}update — check for updates
│➽ ${p}disk — server disk usage
│➽ ${p}hostip — server IP address
│
│ 👤 *Profile*
│➽ ${p}setbio <text> — update bio
│➽ ${p}setprofilepic — set profile pic
│➽ ${p}tostatus — post media to status
│➽ ${p}vv2 — unlock view-once media
│➽ ${p}lastseen on/off — last seen
│➽ ${p}readreceipts on/off — blue ticks
│➽ ${p}alwaysonline on/off — stay online
│
│ 🔑 *Sudo Users*
│➽ ${p}addsudo @user
│➽ ${p}listsudo
│➽ ${p}delsudo @user
┗▣`,
      religion: `┏▣ ◈ *🕌 RELIGION MENU* ◈
│ 📖 *Bible*
│➽ ${p}bible <verse>
│   Example: ${p}bible john 3:16
│   Example: ${p}bible psalms 23:1
│
│ 📿 *Quran*
│➽ ${p}quran <surah>:<ayah>
│   Example: ${p}quran 2:255
│   Example: ${p}quran 1:1
┗▣`,
      search: `┏▣ ◈ *🔍 SEARCH MENU* ◈
│➽ ${p}weather <city> — current weather
│➽ ${p}define <word> — word definition
│➽ ${p}define2 <word> — extended definition
│➽ ${p}lyrics <artist> - <song> — song lyrics
│➽ ${p}translate <lang> <text> — translate
│➽ ${p}imdb <movie name> — movie info
│➽ ${p}yts <movie name> — movie torrents
│➽ ${p}shazam — song recognition (reply audio)
│➽ ${p}itunes <song> — Apple Music search
┗▣`,
      settings: `┏▣ ◈ *⚙️ SETTINGS MENU* ◈
│ 🔧 *Core Settings*
│➽ ${p}setprefix <symbol> — change prefix
│➽ ${p}setbotname <name> — bot name
│➽ ${p}setownername <name> — owner name
│➽ ${p}setownernumber <num> — owner number
│➽ ${p}mode public/private/inbox — bot mode
│➽ ${p}getsettings — view all settings
│➽ ${p}resetsetting — reset to default
│
│ 🔁 *Auto Features*
│➽ ${p}anticall on/off — reject calls
│➽ ${p}autoread on/off — read messages
│➽ ${p}autoreact on/off — react to messages
│➽ ${p}autotype on/off — typing indicator
│➽ ${p}autobio on/off — auto-update bio
│➽ ${p}alwaysonline on/off — stay online
│➽ ${p}autoviewstatus on/off — view statuses
│➽ ${p}chatbot on/off — AI auto-reply
│
│ 🛡️ *Protection*
│➽ ${p}antilink on/off — block links
│➽ ${p}antibug on/off — bug protection
│➽ ${p}antiviewonce on/off — unlock view-once
│➽ ${p}antidelete on/off — show deleted msgs
│➽ ${p}antibadword on/off — bad word filter
│
│ 💬 *Welcome & Goodbye*
│➽ ${p}setwelcome <text> — set message
│➽ ${p}setgoodbye <text> — set message
│➽ ${p}showwelcome — view welcome msg
│➽ ${p}showgoodbye — view goodbye msg
│➽ ${p}delwelcome — delete welcome
│➽ ${p}delgoodbye — delete goodbye
│
│ 🚫 *Bad Words*
│➽ ${p}addbadword <word>
│➽ ${p}listbadword
│➽ ${p}deletebadword <word>
│
│ 🎨 *Appearance*
│➽ ${p}settimezone <tz> — set timezone
│➽ ${p}setstatusemoji <emoji> — status emoji
│➽ ${p}setstickerpackname <name>
│➽ ${p}setstickerauthor <name>
│➽ ${p}setwarn <max> — max warn limit
┗▣`,
      sports: `┏▣ ◈ *⚽ SPORTS MENU* ◈
│ 🏴󠁧󠁢󠁥󠁮󠁧󠁿 *Premier League*
│➽ ${p}eplstandings / ${p}eplmatches
│➽ ${p}eplscorers / ${p}eplupcoming
│
│ 🇪🇸 *La Liga*
│➽ ${p}laligastandings / ${p}laligamatches
│➽ ${p}laligascorers / ${p}laligaupcoming
│
│ ⭐ *Champions League*
│➽ ${p}clstandings / ${p}clmatches
│➽ ${p}clscorers / ${p}clupcoming
│
│ 🇩🇪🇮🇹🇫🇷 *Other Leagues*
│➽ ${p}bundesligastandings / ${p}bundesligamatches
│➽ ${p}serieastandings / ${p}serieamatches
│➽ ${p}ligue1standings / ${p}ligue1matches
│
│ 🏆 *More Competitions*
│➽ ${p}elstandings / ${p}elmatches (Europa)
│➽ ${p}eflstandings / ${p}eflmatches (EFL)
│➽ ${p}wcstandings / ${p}wcmatches (World Cup)
│
│ 🤼 *WWE Wrestling*
│➽ ${p}wwenews — latest WWE news
│➽ ${p}wweschedule — upcoming events
│➽ ${p}wrestlingevents — WrestleMania etc
┗▣`,
      tools: `┏▣ ◈ *🔧 TOOLS MENU* ◈
│ 🖼️ *Media*
│➽ ${p}sticker — image/gif → sticker
│➽ ${p}toimage — sticker → image
│➽ ${p}ssweb <URL> — website screenshot
│➽ ${p}tourl — upload media, get URL
│➽ ${p}qrcode <text> — generate QR code
│
│ 👤 *User Info*
│➽ ${p}getpp @user — profile picture
│➽ ${p}getabout @user — bio/about
│➽ ${p}device @user — device type
│➽ ${p}userid — get WhatsApp JID
│
│ ✍️ *Text Tools*
│➽ ${p}fancy <text> — Unicode style
│➽ ${p}fliptext <text> — upside down
│➽ ${p}obfuscate <text> — lookalike chars
│➽ ${p}say <text> — bot repeats text
│➽ ${p}react <emoji> — react to a message
│➽ ${p}texttopdf <text> — convert to PDF
│
│ 🛠️ *Utilities*
│➽ ${p}calculate <expression> — calculator
│➽ ${p}genpass <length> — secure password
│➽ ${p}tinyurl <URL> — shorten URL
│➽ ${p}emojimix <e1> <e2> — mix emojis
│➽ ${p}vcf — export group contacts
│➽ ${p}filtervcf — clean VCF file
┗▣`,
      translate: `┏▣ ◈ *🌍 TRANSLATE MENU* ◈
│➽ ${p}translate <lang> <text>
│➽ ${p}translate2 <lang> <text>
│
│ *Language codes:*
│ en=English    fr=French
│ es=Spanish    de=German
│ ar=Arabic     zh=Chinese
│ pt=Portuguese sw=Swahili
│ hi=Hindi      ru=Russian
│ ja=Japanese   ko=Korean
│ it=Italian    nl=Dutch
│ tr=Turkish    pl=Polish
│ vi=Vietnamese id=Indonesian
┗▣`,
      video: `┏▣ ◈ *🎬 VIDEO MENU* ◈
│➽ ${p}video <URL/title> — download YouTube
│➽ ${p}tiktok <URL> — download TikTok
│➽ ${p}twitter <URL> — download Twitter
│➽ ${p}tomp3 — video → audio
│➽ ${p}tovideo — audio → video
│➽ ${p}volvideo <vol> — adjust volume
│➽ ${p}ssweb <URL> — screenshot page
┗▣`,
    };

    const out = menus[cat];
    if (out) {
      await reply(out);
    } else {
      await reply(`❌ Unknown category: *${cat}*\n\nType *${p}menu* to see all categories.`);
    }
  },
});
