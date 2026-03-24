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
  handler: async ({ args, settings, reply }) => {
    const cat = args[0]?.toLowerCase();
    const p = settings.prefix;

    if (!cat) {
      await reply(`┏▣ ◈ *MAXX XMD MENU* ◈
┃
┃ 📌 *Prefix:* ${p}
┃ 👑 *Owner:* ${settings.ownerName}
┃ 🌐 *Mode:* ${settings.mode}
┃
┃ 📂 *Categories* — type *${p}menu <name>*
┃ ─────────────────
┃ 🤖 \`${p}menu ai\`
┃ 🎵 \`${p}menu audio\`
┃ ⬇️ \`${p}menu download\`
┃ 😂 \`${p}menu fun\`
┃ 🎮 \`${p}menu games\`
┃ 👥 \`${p}menu group\`
┃ ℹ️ \`${p}menu other\`
┃ 👑 \`${p}menu owner\`
┃ 🕌 \`${p}menu religion\`
┃ 🔍 \`${p}menu search\`
┃ ⚙️ \`${p}menu settings\`
┃ ⚽ \`${p}menu sports\`
┃ 🔧 \`${p}menu tools\`
┃ 🌍 \`${p}menu translate\`
┃ 🎬 \`${p}menu video\`
┃
┗▣ _MAXX XMD v2.0.0_`);
      return;
    }

    const menus: Record<string, string> = {
      ai: `┏▣ ◈ *AI MENU* ◈
│➽ ${p}gpt <question>
│➽ ${p}gemini <question>
│➽ ${p}analyze <question>
│➽ ${p}code <request>
│➽ ${p}recipe <food name>
│➽ ${p}story <topic>
│➽ ${p}summarize <text>
│➽ ${p}teach <topic>
│➽ ${p}programming <question>
│➽ ${p}translate2 <lang> <text>
│➽ ${p}generate <image prompt>
│➽ ${p}chatbot on/off
┗▣`,
      audio: `┏▣ ◈ *AUDIO MENU* ◈
│➽ ${p}tomp3 — convert video to mp3
│➽ ${p}bass — add bass boost
│➽ ${p}blown — blown effect
│➽ ${p}deep — deep voice
│➽ ${p}earrape — earrape effect
│➽ ${p}reverse — reverse audio
│➽ ${p}robot — robot voice
│➽ ${p}volaudio <vol> — set volume
│➽ ${p}toptt — text to voice
┗▣`,
      download: `┏▣ ◈ *DOWNLOAD MENU* ◈
│➽ ${p}song <YouTube URL/title>
│➽ ${p}video <YouTube URL/title>
│➽ ${p}tiktok <URL>
│➽ ${p}tiktokaudio <URL>
│➽ ${p}instagram <URL>
│➽ ${p}twitter <URL>
│➽ ${p}facebook <URL>
│➽ ${p}pin <Pinterest URL>
│➽ ${p}image <search term>
│➽ ${p}savestatus — save status
│➽ ${p}apk <app name>
│➽ ${p}gitclone <repo URL>
│➽ ${p}mediafire <URL>
│➽ ${p}itunes <song>
│➽ ${p}xvideo <search>
┗▣`,
      fun: `┏▣ ◈ *FUN MENU* ◈
│➽ ${p}jokes
│➽ ${p}fact
│➽ ${p}quotes
│➽ ${p}trivia
│➽ ${p}memes
│➽ ${p}truthdetector <name>
│➽ ${p}xxqc <question>
┗▣`,
      games: `┏▣ ◈ *GAMES MENU* ◈
│➽ ${p}truth
│➽ ${p}dare
│➽ ${p}truthordare
┗▣`,
      group: `┏▣ ◈ *GROUP MENU* ◈
│➽ ${p}tagall — mention everyone
│➽ ${p}tag <text> — mention all
│➽ ${p}tagadmin — mention admins
│➽ ${p}hidetag <text> — hidden mention
│➽ ${p}kick @user — remove member
│➽ ${p}add 254xxx — add member
│➽ ${p}promote @user — make admin
│➽ ${p}demote @user — remove admin
│➽ ${p}mute — close group chat
│➽ ${p}unmute — open group chat
│➽ ${p}link — get invite link
│➽ ${p}resetlink — reset invite link
│➽ ${p}setdesc <text> — set description
│➽ ${p}setgroupname <name>
│➽ ${p}getgrouppp — group profile pic
│➽ ${p}setppgroup — set group pic
│➽ ${p}kickall — kick all members
│➽ ${p}poll <q>|<opt1>|<opt2>
│➽ ${p}welcome on/off
│➽ ${p}antilink on/off
│➽ ${p}antibadword on/off
│➽ ${p}totalmembers
│➽ ${p}userid
│➽ ${p}announce <text>
│➽ ${p}invite — group invite
┗▣`,
      other: `┏▣ ◈ *OTHER MENU* ◈
│➽ ${p}alive — bot status
│➽ ${p}ping — response speed
│➽ ${p}runtime — uptime
│➽ ${p}time <timezone>
│➽ ${p}repo — source code
│➽ ${p}owner — owner info
│➽ ${p}pair — get session ID
│➽ ${p}botinfo — detailed info
┗▣`,
      owner: `┏▣ ◈ *OWNER MENU* ◈
│➽ ${p}block @user
│➽ ${p}unblock @user
│➽ ${p}listblocked
│➽ ${p}join <invite link>
│➽ ${p}leave — leave group
│➽ ${p}restart — restart bot
│➽ ${p}addsudo @user
│➽ ${p}listsudo
│➽ ${p}delsudo @user
│➽ ${p}setbio <text>
│➽ ${p}setprofilepic (reply to image)
│➽ ${p}groupid — get group ID
│➽ ${p}broadcast <message>
│➽ ${p}delete — delete a message
│➽ ${p}tostatus (reply to media)
│➽ ${p}online on/off
│➽ ${p}lastseen on/off
│➽ ${p}readreceipts on/off
│➽ ${p}warn @user <reason>
│➽ ${p}listwarn
│➽ ${p}resetwarn @user
┗▣`,
      religion: `┏▣ ◈ *RELIGION MENU* ◈
│➽ ${p}bible <verse> (e.g. john 3:16)
│➽ ${p}quran <surah>:<ayah>
┗▣`,
      search: `┏▣ ◈ *SEARCH MENU* ◈
│➽ ${p}weather <city>
│➽ ${p}define <word>
│➽ ${p}define2 <word>
│➽ ${p}lyrics <artist> - <song>
│➽ ${p}translate <lang> <text>
│➽ ${p}imdb <movie name>
│➽ ${p}yts <movie name>
│➽ ${p}shazam (reply to audio)
┗▣`,
      settings: `┏▣ ◈ *SETTINGS MENU* ◈
│➽ ${p}setprefix <symbol>
│➽ ${p}setbotname <name>
│➽ ${p}setownername <name>
│➽ ${p}setownernumber <number>
│➽ ${p}mode public/private/inbox
│➽ ${p}anticall on/off
│➽ ${p}autoread on/off
│➽ ${p}autoreact on/off
│➽ ${p}autotype on/off
│➽ ${p}autobio on/off
│➽ ${p}alwaysonline on/off
│➽ ${p}autoviewstatus on/off
│➽ ${p}chatbot on/off
│➽ ${p}antilink on/off
│➽ ${p}antibug on/off
│➽ ${p}antiviewonce on/off
│➽ ${p}antidelete on/off
│➽ ${p}setwelcome <text>
│➽ ${p}delwelcome
│➽ ${p}setgoodbye <text>
│➽ ${p}delgoodbye
│➽ ${p}getsettings
│➽ ${p}resetsetting
│➽ ${p}addsudo @user
│➽ ${p}listsudo
│➽ ${p}delsudo @user
│➽ ${p}addbadword <word>
│➽ ${p}listbadword
│➽ ${p}deletebadword <word>
│➽ ${p}settimezone <tz>
│➽ ${p}setstatusemoji <emoji>
│➽ ${p}setstickerpackname <name>
│➽ ${p}setstickerauthor <name>
│➽ ${p}setwarn <max>
│➽ ${p}listwarn
│➽ ${p}resetwarn @user
┗▣`,
      sports: `┏▣ ◈ *SPORTS MENU* ◈
│ ⚽ *Premier League*
│➽ ${p}eplstandings
│➽ ${p}eplmatches
│➽ ${p}eplscorers
│➽ ${p}eplupcoming
│ ⚽ *La Liga*
│➽ ${p}laligastandings
│➽ ${p}laligamatches
│➽ ${p}laligascorers
│➽ ${p}laligaupcoming
│ ⚽ *Champions League*
│➽ ${p}clstandings
│➽ ${p}clmatches
│➽ ${p}clupcoming
│ ⚽ *Bundesliga, Serie A, Ligue1*
│➽ ${p}bundesligastandings
│➽ ${p}serieastandings
│➽ ${p}ligue1standings
│ ⚽ *Europa League, EFL, World Cup*
│➽ ${p}elstandings / ${p}eflstandings
│➽ ${p}wcstandings / ${p}wcmatches
│ 🤼 *WWE*
│➽ ${p}wwenews
│➽ ${p}wweschedule
│➽ ${p}wrestlingevents
┗▣`,
      tools: `┏▣ ◈ *TOOLS MENU* ◈
│➽ ${p}sticker — image to sticker
│➽ ${p}toimage — sticker to image
│➽ ${p}getpp @user — profile pic
│➽ ${p}getabout @user
│➽ ${p}qrcode <text>
│➽ ${p}tinyurl <URL>
│➽ ${p}calculate <expression>
│➽ ${p}genpass <length>
│➽ ${p}fancy <text>
│➽ ${p}fliptext <text>
│➽ ${p}say <text>
│➽ ${p}react <emoji> (reply to msg)
│➽ ${p}device @user
│➽ ${p}ssweb <URL> — screenshot
│➽ ${p}texttopdf <text>
│➽ ${p}tourl (reply to media)
│➽ ${p}obfuscate <text>
│➽ ${p}emojimix <e1> <e2>
│➽ ${p}vcf — export contacts
│➽ ${p}filtervcf (reply to vcf)
┗▣`,
      translate: `┏▣ ◈ *TRANSLATE MENU* ◈
│➽ ${p}translate <lang> <text>
│
│ *Language codes:*
│ en=English  fr=French
│ es=Spanish  de=German
│ ar=Arabic   zh=Chinese
│ pt=Portuguese  sw=Swahili
│ hi=Hindi  ru=Russian
│ ja=Japanese  ko=Korean
│ it=Italian  nl=Dutch
┗▣`,
      video: `┏▣ ◈ *VIDEO MENU* ◈
│➽ ${p}toaudio — video to audio
│➽ ${p}tovideo — audio to video
│➽ ${p}volvideo <vol> — set volume
│➽ ${p}video <URL> — download video
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
