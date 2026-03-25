import type { WASocket, WAMessage, proto } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { loadSettings, saveSettings, WORKSPACE_ROOT } from "./botState.js";
import { logger } from "./logger.js";
import fs from "fs";
import path from "path";

// ── Sticker cache — built once, reused for every auto-react ──────────────────
const BOT_STICKER_URL = "https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg";
let _cachedSticker: Buffer | null = null;
async function getAutoSticker(): Promise<Buffer | null> {
  if (_cachedSticker) return _cachedSticker;
  try {
    const settings = loadSettings();
    const url: string = (settings as any).botpic || BOT_STICKER_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = Buffer.from(await res.arrayBuffer());
    const sharp = (await import("sharp")).default;
    _cachedSticker = await sharp(raw)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toBuffer();
    return _cachedSticker;
  } catch (e) {
    logger.warn({ err: String(e) }, "Could not build auto-sticker");
    return null;
  }
}

// ── Load all command modules (self-registering) ───────────────────────────────
import { commandRegistry } from "./commands/types.js";
import "./commands/general.js";
import "./commands/fun.js";
import "./commands/games.js";
import "./commands/group.js";
import "./commands/settings.js";
import "./commands/owner.js";
import "./commands/search.js";
import "./commands/religion.js";
import "./commands/sports.js";
import "./commands/tools.js";
import "./commands/photo.js";
import "./commands/extra.js";
import "./commands/anime.js";
import "./commands/pokemon.js";
import "./commands/education.js";
import "./commands/morefun.js";
import "./commands/sticker.js";
import "./commands/protection.js";
import "./commands/economy.js";
import "./commands/games2.js";
import "./commands/media2.js";
import "./commands/country.js";
import "./commands/creative2.js";
import "./commands/lifestyle.js";
import "./commands/ai.js";
import "./commands/coding.js";
import "./commands/reactions.js";
import "./commands/stalker.js";
import "./commands/uploader.js";
import "./commands/converters2.js";
import "./commands/channel.js";
import "./commands/plugins.js";

// ── Tools / download / audio / AI — inline here ──────────────────────────────
import { registerCommand } from "./commands/types.js";

// ---- TOOLS ----
registerCommand({
  name: "sticker",
  aliases: ["s"],
  category: "Tools",
  description: "Convert image/gif to sticker",
  handler: async ({ sock, from, msg, reply }) => {
    const settings = loadSettings();
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const imgMsg = msg.message?.imageMessage || ctx?.quotedMessage?.imageMessage;
    const vidMsg = msg.message?.videoMessage || ctx?.quotedMessage?.videoMessage;
    const stickerMedia = imgMsg || vidMsg;
    if (!stickerMedia) return reply("❌ Reply to or send an image/gif with .sticker");
    try {
      const rawMsg = imgMsg
        ? { message: { imageMessage: imgMsg } }
        : { message: { videoMessage: vidMsg } };
      const buf = await downloadMediaMessage(rawMsg as WAMessage, "buffer", {});
      const webp = await sharp(buf as Buffer).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
      await sock.sendMessage(from, {
        sticker: webp,
        mimetype: "image/webp",
      } as any);
    } catch (e: any) {
      await reply(`❌ Sticker failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "toimage",
  aliases: ["toimg"],
  category: "Tools",
  description: "Convert sticker to image",
  handler: async ({ sock, from, msg, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const stickerMsg = msg.message?.stickerMessage || ctx?.quotedMessage?.stickerMessage;
    if (!stickerMsg) return reply("❌ Reply to a sticker with .toimage");
    try {
      const buf = await downloadMediaMessage(
        { message: { stickerMessage: stickerMsg } } as WAMessage,
        "buffer", {}
      );
      const png = await sharp(buf as Buffer).png().toBuffer();
      await sock.sendMessage(from, { image: png, caption: "🖼️ Converted by MAXX XMD" });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "getpp",
  aliases: ["pp", "pfp"],
  category: "Tools",
  description: "Get a user's profile picture",
  handler: async ({ sock, from, msg, sender, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned || sender;
    try {
      const url = await sock.profilePictureUrl(target, "image");
      await sock.sendMessage(from, { image: { url }, caption: `📸 Profile picture of @${target.split("@")[0]}`, mentions: [target] });
    } catch {
      await reply(`❌ No profile picture found for @${target.split("@")[0]}`);
    }
  },
});

registerCommand({
  name: "getabout",
  aliases: ["about"],
  category: "Tools",
  description: "Get a user's WhatsApp bio",
  handler: async ({ sock, msg, sender, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned || sender;
    try {
      const status = await sock.fetchStatus(target);
      await reply(`👤 *About @${target.split("@")[0]}*\n\n📝 ${status?.status || "No bio set"}\n⏰ Last updated: ${status?.setAt ? new Date(status.setAt).toLocaleDateString() : "Unknown"}`);
    } catch {
      await reply(`❌ Could not fetch bio for @${target.split("@")[0]}`);
    }
  },
});

registerCommand({
  name: "react",
  aliases: [],
  category: "Tools",
  description: "React to a message with an emoji",
  handler: async ({ sock, msg, args, from, reply }) => {
    const emoji = args[0];
    if (!emoji) return reply("❓ Usage: .react <emoji>\nExample: .react 🔥");
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (!ctx?.stanzaId) return reply("❌ Reply to a message to react to it.");
    try {
      await sock.sendMessage(from, {
        react: {
          text: emoji,
          key: { remoteJid: from, id: ctx.stanzaId, fromMe: false, participant: ctx.participant },
        },
      });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "qrcode",
  aliases: ["qr"],
  category: "Tools",
  description: "Generate a QR code from text/URL",
  handler: async ({ sock, from, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .qrcode <text or URL>");
    try {
      const { default: QRCode } = await import("qrcode");
      const buf = await QRCode.toBuffer(text, { type: "png", width: 512, margin: 2 });
      await sock.sendMessage(from, { image: buf, caption: `📱 *QR Code*\n\n_${text}_` });
    } catch (e: any) {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`;
      await sock.sendMessage(from, { image: { url }, caption: `📱 *QR Code*\n\n_${text}_` });
    }
  },
});

registerCommand({
  name: "tinyurl",
  aliases: ["shorten", "short"],
  category: "Tools",
  description: "Shorten a URL",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url) return reply("❓ Usage: .tinyurl <URL>");
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      const short = await res.text();
      await reply(`🔗 *URL Shortened!*\n\n📎 Original: ${url}\n✂️ Short: *${short.trim()}*`);
    } catch {
      await reply("❌ Could not shorten URL. Make sure it's a valid URL.");
    }
  },
});

registerCommand({
  name: "calculate",
  aliases: ["calc", "math"],
  category: "Tools",
  description: "Calculate a math expression",
  handler: async ({ args, reply }) => {
    const expr = args.join(" ");
    if (!expr) return reply("❓ Usage: .calculate <expression>\nExample: .calculate 2 + 2 * 10");
    try {
      const safe = expr.replace(/[^0-9+\-*/().^%\s]/g, "");
      if (!safe.trim()) return reply("❌ Invalid expression.");
      const result = Function(`"use strict"; return (${safe})`)();
      await reply(`🧮 *Calculator*\n\n📝 ${expr}\n✅ = *${result}*`);
    } catch {
      await reply(`❌ Could not calculate: *${expr}*`);
    }
  },
});

registerCommand({
  name: "genpass",
  aliases: ["password", "generatepassword"],
  category: "Tools",
  description: "Generate a secure random password",
  handler: async ({ args, reply }) => {
    const len = Math.min(Math.max(parseInt(args[0]) || 16, 4), 64);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}";
    const { randomBytes } = await import("crypto");
    const bytes = randomBytes(len);
    let pass = "";
    for (let i = 0; i < len; i++) pass += chars[bytes[i] % chars.length];
    await reply(`🔐 *Generated Password*\n\n\`${pass}\`\n\n📏 Length: *${len}*\n💡 _Keep this safe!_`);
  },
});

registerCommand({
  name: "fancy",
  aliases: ["fancytext"],
  category: "Tools",
  description: "Convert text to fancy Unicode style",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .fancy <text>");
    const maps: Record<string, string>[] = [
      Object.fromEntries("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c, i) => {
        const bold = "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭";
        return [c, [...bold][i]];
      })),
    ];
    const italic: Record<string, string> = {};
    "abcdefghijklmnopqrstuvwxyz".split("").forEach((c, i) => {
      const ic = "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻".split("")[i] || c;
      italic[c] = ic;
    });
    const convert = (t: string, map: Record<string, string>) => t.split("").map(c => map[c] || c).join("");
    const bold = convert(text, maps[0]);
    const ital = convert(text.toLowerCase(), italic);
    await reply(`✨ *Fancy Text*\n\n📝 Original: ${text}\n\n🔤 Bold: ${bold}\n🔤 Italic: ${ital}`);
  },
});

registerCommand({
  name: "fliptext",
  aliases: ["flip", "reverse"],
  category: "Tools",
  description: "Flip text upside down",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .fliptext <text>");
    const flipMap: Record<string, string> = {
      a:"ɐ",b:"q",c:"ɔ",d:"p",e:"ǝ",f:"ɟ",g:"ƃ",h:"ɥ",i:"ᴉ",j:"ɾ",k:"ʞ",l:"l",m:"ɯ",
      n:"u",o:"o",p:"d",q:"b",r:"ɹ",s:"s",t:"ʇ",u:"n",v:"ʌ",w:"ʍ",x:"x",y:"ʎ",z:"z",
      A:"∀",B:"ᗺ",C:"Ɔ",D:"ᗡ",E:"Ǝ",F:"Ⅎ",G:"פ",H:"H",I:"I",J:"ſ",K:"ʞ",L:"˥",
      M:"W",N:"N",O:"O",P:"Ԁ",Q:"Q",R:"ᴚ",S:"S",T:"┴",U:"∩",V:"Λ",W:"M",X:"X",Y:"⅄",Z:"Z",
      "0":"0","1":"Ɩ","2":"ᄅ","3":"Ɛ","4":"ㄣ","5":"ϛ","6":"9","7":"ㄥ","8":"8","9":"6",
      "!":"¡","?":"¿",".":"˙",",":"'","'":","
    };
    const flipped = text.split("").reverse().map(c => flipMap[c] || c).join("");
    await reply(`🔄 *Flipped Text*\n\n📝 Original: ${text}\n🙃 Flipped: ${flipped}`);
  },
});

registerCommand({
  name: "say",
  aliases: ["echo"],
  category: "Tools",
  description: "Make the bot say something",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .say <text>");
    await reply(text);
  },
});

registerCommand({
  name: "obfuscate",
  aliases: ["obf"],
  category: "Tools",
  description: "Obfuscate text with Unicode lookalikes",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .obfuscate <text>");
    const map: Record<string, string> = {a:"а",e:"е",o:"о",p:"р",c:"с",x:"х",y:"у",i:"і",b:"Ь",
      A:"А",E:"Е",O:"О",P:"Р",C:"С",X:"Х",Y:"У",I:"І",B:"В"};
    const obf = text.split("").map(c => map[c] || c).join("");
    await reply(`🔐 *Obfuscated Text*\n\n📝 Original: ${text}\n🔒 Obfuscated: ${obf}`);
  },
});

registerCommand({
  name: "device",
  aliases: [],
  category: "Tools",
  description: "Get device info from a WhatsApp JID",
  handler: async ({ msg, sender, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned || sender;
    const id = target.split("@")[0];
    const deviceNum = parseInt(id.split(":")[1] || "0");
    const devices = ["Unknown", "Android", "iOS/iPhone", "KaiOS", "Android (Tablet)", "Unknown", "Unknown", "Unknown", "Unknown", "Unknown", "Web/Desktop"];
    const device = devices[deviceNum] || "Unknown";
    await reply(`📱 *Device Info*\n\n👤 User: @${id.split(":")[0]}\n📲 Device: *${device}*\n🔢 JID: \`${target}\``);
  },
});

// ---- DOWNLOAD ----
registerCommand({
  name: "song",
  aliases: ["play", "music", "yt", "ytaudio", "spotify"],
  category: "Download",
  description: "Download a song (Spotify/YouTube/search)",
  handler: async ({ sock, from, args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply(
      `❓ *Usage:* .song <title or URL>\n\n` +
      `*Examples:*\n` +
      `• .song Blinding Lights\n` +
      `• .song Alikiba UTU\n` +
      `• .song https://youtu.be/...\n` +
      `• .song https://open.spotify.com/track/...`
    );

    await reply(`╔═══════════════════╗\n║ 🎵 *MAXX MUSIC* 🎵\n╚═══════════════════╝\n\n🔍 Searching *${query}*...\n⏳ Please wait...`);

    try {
      let downloadUrl = "";
      let title = "Unknown";
      let artist = "";
      let duration = "";
      let thumbnail = "";

      // ── Spotify URL ──────────────────────────────
      if (query.includes("open.spotify.com")) {
        const res = await fetch(`https://eliteprotech-apis.zone.id/spotify?url=${encodeURIComponent(query)}`);
        const data = await res.json() as any;
        if (!data.success || !data.data?.download) throw new Error("Spotify track not found or unavailable");
        downloadUrl = data.data.download;
        title    = data.data.metadata?.title  || "Unknown";
        artist   = data.data.metadata?.artist || "";
        duration = data.data.metadata?.duration || "";
        thumbnail = data.data.metadata?.images || "";

      // ── YouTube URL or plain text search ─────────
      } else {
        let ytUrl = query;

        // Plain text → scrape YouTube search (bypasses yt-dlp bot detection)
        if (!query.match(/youtube\.com|youtu\.be/i)) {
          const { searchYouTube } = await import("./ytdlpUtil.js");
          ytUrl = await searchYouTube(query);
        }

        const res = await fetch(`https://eliteprotech-apis.zone.id/yt?url=${encodeURIComponent(ytUrl)}`);
        const data = await res.json() as any;
        if (!data.status || !data.downloadUrl) throw new Error("Could not get download link from YouTube");
        downloadUrl = data.downloadUrl;
        title     = data.title   || "Unknown";
        artist    = data.channel || "";
        thumbnail = data.thumbnail || "";
        const secs = data.duration || 0;
        duration = `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;
      }

      // ── Fetch & send ──────────────────────────────
      const audioRes = await fetch(downloadUrl);
      if (!audioRes.ok) throw new Error(`Download server returned ${audioRes.status}`);
      const buffer = Buffer.from(await audioRes.arrayBuffer());

      if (thumbnail) {
        await sock.sendMessage(from, {
          image: { url: thumbnail },
          caption: `🎵 *${title}*${artist ? `\n👤 ${artist}` : ""}${duration ? `\n⏱️ ${duration}` : ""}\n\n> _MAXX-XMD_ ⚡`,
        });
      }

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        ptt: false,
      } as any);

    } catch (e: any) {
      await reply(`❌ *Download Failed*\n\n${e.message || "Unknown error"}\n\nTry with a direct YouTube or Spotify link.`);
    }
  },
});

registerCommand({
  name: "spotifydl",
  aliases: ["spdl"],
  category: "Download",
  description: "Download a Spotify track",
  handler: async ({ sock, from, args, reply }) => {
    const url = args[0];
    if (!url?.includes("open.spotify.com")) {
      return reply(`❓ *Usage:* .spotifydl <Spotify URL>\n\n*Example:*\n.spotifydl https://open.spotify.com/track/...`);
    }
    await reply(`╔═══════════════════╗\n║ 🎧 *SPOTIFY DL* 🎧\n╚═══════════════════╝\n\n⏳ Fetching track...`);
    try {
      const res = await fetch(`https://eliteprotech-apis.zone.id/spotify?url=${encodeURIComponent(url)}`);
      const data = await res.json() as any;
      if (!data.success || !data.data?.download) throw new Error("Track not found or unavailable");

      const { title, artist, duration, images } = data.data.metadata;

      if (images) {
        await sock.sendMessage(from, {
          image: { url: images },
          caption: `🎧 *${title}*\n👤 ${artist}\n⏱️ ${duration}\n\n> _MAXX-XMD_ ⚡`,
        });
      }

      const audioRes = await fetch(data.data.download);
      if (!audioRes.ok) throw new Error("Download CDN unavailable");
      const buffer = Buffer.from(await audioRes.arrayBuffer());

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `${title} - ${artist}.mp3`,
        ptt: false,
      } as any);

    } catch (e: any) {
      await reply(`❌ *Spotify DL Failed*\n\n${e.message}`);
    }
  },
});

registerCommand({
  name: "video",
  aliases: ["ytvideo", "ytv", "youtube"],
  category: "Download",
  description: "Download a YouTube video as MP4",
  handler: async ({ sock, from, msg, args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply(
      `╔═══════════════════╗\n║ 🎬 *VIDEO DL* 🎬\n╚═══════════════════╝\n\n` +
      `❓ *Usage:* .video <title or YouTube URL>\n\n` +
      `*Examples:*\n` +
      `• .video Avengers trailer\n` +
      `• .video faded alan walker\n` +
      `• .video https://youtu.be/...\n\n` +
      `_Max 5 minutes. For audio only use .song_`
    );
    await reply(`╔═══════════════════╗\n║ 🎬 *VIDEO DL* 🎬\n╚═══════════════════╝\n\n🔍 Searching *${query}*...\n⏳ Please wait...`);
    try {
      // Step 1: Get YouTube URL (scrape search if text query)
      let ytUrl = query;
      if (!query.match(/youtube\.com|youtu\.be/i)) {
        const { searchYouTube } = await import("./ytdlpUtil.js");
        ytUrl = await searchYouTube(query);
      }

      // Step 2: Use eliteprotech ytdown API to get MP4 download link
      const apiRes = await fetch(
        `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(ytUrl)}&format=mp4`,
        { signal: AbortSignal.timeout(20000) }
      );
      const apiData = await apiRes.json() as any;
      if (!apiData.success || !apiData.downloadURL) {
        throw new Error("Could not get video download link");
      }

      const videoTitle = apiData.title || "Video";
      await reply(`✅ Found *${videoTitle}*\n⬇️ Downloading...`);

      // Step 3: Download the MP4 buffer
      const dlRes = await fetch(apiData.downloadURL, { signal: AbortSignal.timeout(90000) });
      if (!dlRes.ok) throw new Error(`Download server returned ${dlRes.status}`);
      const buffer = Buffer.from(await dlRes.arrayBuffer());

      if (buffer.length > 55 * 1024 * 1024) {
        return reply(
          `⚠️ *File too large* (${Math.round(buffer.length / 1024 / 1024)}MB)\n` +
          `WhatsApp limit is 55MB. Try a shorter clip or use .song for audio only.`
        );
      }

      await sock.sendMessage(from, {
        video: buffer,
        caption: `🎬 *${videoTitle}*\n\n> _MAXX-XMD_ ⚡`,
        mimetype: "video/mp4",
        fileName: `${videoTitle}.mp4`,
      } as any, { quoted: msg });

    } catch (e: any) {
      await reply(`❌ *Download Failed*\n\n${e.message?.slice(0, 150) || "Try again later"}`);
    }
  },
});

registerCommand({
  name: "tiktok",
  aliases: ["tt"],
  category: "Download",
  description: "Download a TikTok video",
  handler: async ({ sock, from, args, reply }) => {
    const url = args[0];
    if (!url?.includes("tiktok")) return reply("❓ Usage: .tiktok <TikTok URL>");
    await reply("⏳ Fetching TikTok video...");
    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl);
      const data = await res.json() as any;
      if (!data.data?.play) throw new Error("No video found");
      const videoUrl = data.data.play;
      const desc = data.data.title || "TikTok Video";
      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `🎵 *${desc}*\n\n> _MAXX XMD_ ⚡`,
      });
    } catch (e: any) {
      await reply(`❌ TikTok download failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "tiktokaudio",
  aliases: ["ttaudio"],
  category: "Download",
  description: "Download TikTok video as audio",
  handler: async ({ sock, from, args, reply }) => {
    const url = args[0];
    if (!url?.includes("tiktok")) return reply("❓ Usage: .tiktokaudio <TikTok URL>");
    await reply("⏳ Extracting audio...");
    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl);
      const data = await res.json() as any;
      if (!data.data?.music_info?.play) throw new Error();
      const audioUrl = data.data.music_info.play;
      await sock.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg" } as any);
    } catch {
      await reply("❌ Could not extract audio. Try .tiktok for the video.");
    }
  },
});

registerCommand({
  name: "instagram",
  aliases: ["ig"],
  category: "Download",
  description: "Download Instagram media",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url?.includes("instagram")) return reply("❓ Usage: .instagram <Instagram URL>");
    await reply(`📸 *Instagram Downloader*\n\nTo download Instagram media:\n1. Copy the post link\n2. Visit: https://snapinsta.app\n3. Paste and download\n\n🔗 URL: ${url}`);
  },
});

registerCommand({
  name: "twitter",
  aliases: ["x"],
  category: "Download",
  description: "Download Twitter/X media",
  handler: async ({ sock, from, args, reply }) => {
    const url = args[0];
    if (!url) return reply("❓ Usage: .twitter <tweet URL>");
    await reply("⏳ Fetching Twitter media...");
    try {
      const apiUrl = `https://twitsave.com/info?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      const match = html.match(/href="(https:\/\/video\.twimg\.com[^"]+)"/);
      if (!match) throw new Error();
      await sock.sendMessage(from, { video: { url: match[1] }, caption: "🐦 *Twitter Video*\n\n> _MAXX XMD_ ⚡" });
    } catch {
      await reply(`🐦 *Twitter Downloader*\n\nTo download Twitter/X media:\n1. Visit: https://ssstwitter.com\n2. Paste: ${url}\n\n> _MAXX XMD_ ⚡`);
    }
  },
});

registerCommand({
  name: "facebook",
  aliases: ["fb"],
  category: "Download",
  description: "Download Facebook video",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url?.includes("facebook") && !url?.includes("fb.watch")) return reply("❓ Usage: .facebook <Facebook video URL>");
    await reply(`📘 *Facebook Downloader*\n\nTo download Facebook video:\n1. Visit: https://fdown.net\n2. Paste: ${url}\n\n> _MAXX XMD_ ⚡`);
  },
});

registerCommand({
  name: "image",
  aliases: ["wallpaper"],
  category: "Download",
  description: "Search and download an image",
  handler: async ({ sock, from, args, reply }) => {
    const query = args.join(" ") || "nature wallpaper";
    try {
      const res = await fetch(`https://source.unsplash.com/1280x720/?${encodeURIComponent(query)}`, { redirect: "follow" });
      const url = res.url;
      await sock.sendMessage(from, { image: { url }, caption: `🖼️ *${query}*\n\n> _MAXX XMD_ ⚡` });
    } catch {
      await reply("❌ Could not fetch image. Try another search term.");
    }
  },
});

// ---- AUDIO EFFECTS ----
registerCommand({
  name: "tomp3",
  aliases: ["toaudio"],
  category: "Audio",
  description: "Convert video to audio (reply to video)",
  handler: async ({ sock, from, msg, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const vidMsg = msg.message?.videoMessage || ctx?.quotedMessage?.videoMessage;
    if (!vidMsg) return reply("❌ Reply to a video message with .tomp3");
    await reply("⏳ Converting to audio...");
    try {
      const buf = await downloadMediaMessage({ message: { videoMessage: vidMsg } } as WAMessage, "buffer", {});
      const os = await import("os");
      const tmpIn = path.join(os.tmpdir(), `maxx_in_${Date.now()}.mp4`);
      const tmpOut = path.join(os.tmpdir(), `maxx_out_${Date.now()}.mp3`);
      fs.writeFileSync(tmpIn, buf as Buffer);
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      await execAsync(`ffmpeg -i "${tmpIn}" -vn -ar 44100 -ac 2 -ab 192k "${tmpOut}" -y`);
      const audio = fs.readFileSync(tmpOut);
      await sock.sendMessage(from, { audio, mimetype: "audio/mpeg" } as any);
      fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut);
    } catch (e: any) {
      await reply(`❌ Conversion failed: ${e.message}`);
    }
  },
});

async function applyAudioEffect(
  sock: WASocket, from: string, msg: WAMessage, reply: (t: string) => Promise<void>,
  filter: string, label: string
) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const audioMsg = msg.message?.audioMessage || ctx?.quotedMessage?.audioMessage;
  if (!audioMsg) return reply(`❌ Reply to an audio message with .${label.toLowerCase()}`);
  await reply(`⏳ Applying ${label} effect...`);
  try {
    const buf = await downloadMediaMessage({ message: { audioMessage: audioMsg } } as WAMessage, "buffer", {});
    const os = await import("os");
    const tmpIn = path.join(os.tmpdir(), `maxx_eff_in_${Date.now()}.mp3`);
    const tmpOut = path.join(os.tmpdir(), `maxx_eff_out_${Date.now()}.mp3`);
    fs.writeFileSync(tmpIn, buf as Buffer);
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    await execAsync(`ffmpeg -i "${tmpIn}" ${filter} "${tmpOut}" -y`);
    const audio = fs.readFileSync(tmpOut);
    await sock.sendMessage(from, { audio, mimetype: "audio/mpeg" } as any);
    fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut);
  } catch (e: any) {
    await reply(`❌ Effect failed: ${e.message}`);
  }
}

registerCommand({ name: "bass", aliases: [], category: "Audio", description: "Add bass boost to audio",
  handler: async ({ sock, from, msg, reply }) => applyAudioEffect(sock, from, msg, reply, '-af "bass=g=20,volume=2"', "Bass") });
registerCommand({ name: "blown", aliases: [], category: "Audio", description: "Blown/distorted audio",
  handler: async ({ sock, from, msg, reply }) => applyAudioEffect(sock, from, msg, reply, '-af "volume=10"', "Blown") });
registerCommand({ name: "deep", aliases: [], category: "Audio", description: "Deep voice effect",
  handler: async ({ sock, from, msg, reply }) => applyAudioEffect(sock, from, msg, reply, '-af "asetrate=44100*0.7,aresample=44100"', "Deep") });
registerCommand({ name: "earrape", aliases: [], category: "Audio", description: "Earrape effect",
  handler: async ({ sock, from, msg, reply }) => applyAudioEffect(sock, from, msg, reply, '-af "volume=30,acrusher=.1:1:64:0:log"', "Earrape") });
registerCommand({ name: "robot", aliases: [], category: "Audio", description: "Robot voice effect",
  handler: async ({ sock, from, msg, reply }) => applyAudioEffect(sock, from, msg, reply, '-af "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"', "Robot") });
registerCommand({ name: "reverse", aliases: [], category: "Audio", description: "Reverse audio",
  handler: async ({ sock, from, msg, reply }) => applyAudioEffect(sock, from, msg, reply, '-af "areverse"', "Reverse") });
registerCommand({ name: "volaudio", aliases: [], category: "Audio", description: "Adjust audio volume",
  handler: async ({ sock, from, msg, args, reply }) => {
    const vol = parseFloat(args[0]) || 2;
    return applyAudioEffect(sock, from, msg, reply, `-af "volume=${vol}"`, `Volume x${vol}`);
  },
});

registerCommand({
  name: "toptt",
  aliases: ["tts"],
  category: "Audio",
  description: "Text to speech",
  handler: async ({ sock, from, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .toptt <text>");
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
      await sock.sendMessage(from, { audio: { url }, mimetype: "audio/mpeg" } as any);
    } catch {
      await reply("❌ Text-to-speech failed. Try again.");
    }
  },
});

// ── Pollinations text helper ──────────────────────────────────────────────────
async function pollinationsAsk(question: string, model: string, system = ""): Promise<string> {
  const messages: any[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: question });
  const res = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model, seed: Math.floor(Math.random() * 9999) }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const answer = (await res.text()).trim();
  if (!answer) throw new Error("Empty response");
  return answer;
}

// ── Gemini helper ─────────────────────────────────────────────────────────────
async function askGemini(question: string, system = ""): Promise<{ answer: string; citations: string }> {
  return { answer: await pollinationsAsk(question, "gemini", system), citations: "" };
}

// ── GPT helper ────────────────────────────────────────────────────────────────
async function askGPT(question: string, system = ""): Promise<{ answer: string; citations: string }> {
  return { answer: await pollinationsAsk(question, "openai", system), citations: "" };
}

// ---- AI ----
registerCommand({
  name: "gpt",
  aliases: ["chatgpt"],
  category: "AI",
  description: "Chat with GPT (OpenAI)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .gpt <question>\nExample: .gpt Explain quantum physics`);
    await reply(`🤖 *ChatGPT*\n\n⏳ Thinking...`);
    try {
      const { answer } = await askGPT(q);
      await reply(`🤖 *ChatGPT*\n\n❓ *${q}*\n\n${answer}`);
    } catch (e: any) {
      await reply(`❌ GPT Error: ${e.message || "Try again later"}`);
    }
  },
});

registerCommand({
  name: "ai",
  aliases: ["ask"],
  category: "AI",
  description: "Chat with MAXX AI (powered by Gemini)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(
      `╔══════════════════════╗\n║ 🤖 *MAXX AI* 🤖\n╚══════════════════════╝\n\n❓ *Usage:* .ai <question>\n\n*Examples:*\n• .ai What is Nigeria's GDP?\n• .ask Write a love poem`
    );
    await reply(`╔══════════════════════╗\n║ 🤖 *MAXX AI* 🤖\n╚══════════════════════╝\n\n⏳ Thinking...`);
    try {
      const { answer } = await askGemini(q);
      await reply(`╔══════════════════════╗\n║ 🤖 *MAXX AI* 🤖\n╚══════════════════════╝\n\n❓ *${q}*\n\n${answer}`);
    } catch (e: any) {
      await reply(`❌ AI Error: ${e.message || "Try again later"}`);
    }
  },
});

registerCommand({
  name: "gemini",
  aliases: ["google"],
  category: "AI",
  description: "Chat with Gemini AI",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply("❓ Usage: .gemini <question>");
    await reply(`🤖 *Gemini AI*\n\n⏳ Thinking...`);
    try {
      const { answer, citations } = await askGemini(q);
      await reply(`✨ *Gemini AI*\n\n❓ *${q}*\n\n${answer}${citations}`);
    } catch (e: any) {
      await reply(`❌ AI Error: ${e.message || "Try again later"}`);
    }
  },
});

const aiCommands = [
  { name: "analyze",    prompt: (q: string) => `Analyze this in detail: ${q}` },
  { name: "code",       prompt: (q: string) => `Write clean code for: ${q}` },
  { name: "recipe",     prompt: (q: string) => `Give me a detailed recipe for: ${q}` },
  { name: "story",      prompt: (q: string) => `Write a creative short story about: ${q}` },
  { name: "summarize",  prompt: (q: string) => `Summarize this clearly and concisely: ${q}` },
  { name: "teach",      prompt: (q: string) => `Teach me about this topic in simple terms: ${q}` },
  { name: "programming",prompt: (q: string) => `Answer this programming question with examples: ${q}` },
  { name: "generate",   prompt: (q: string) => `Generate creative content about: ${q}` },
  { name: "explain",    prompt: (q: string) => `Explain this simply: ${q}` },
  { name: "translate",  prompt: (q: string) => `Translate this text and also state the language pair: ${q}` },
];

for (const cmd of aiCommands) {
  registerCommand({
    name: cmd.name,
    aliases: [],
    category: "AI",
    description: `AI: ${cmd.name}`,
    handler: async ({ args, reply }) => {
      const q = args.join(" ");
      if (!q) return reply(`❓ Usage: .${cmd.name} <input>`);
      await reply(`🤖 Processing...`);
      try {
        const { answer, citations } = await askGemini(cmd.prompt(q));
        await reply(`🤖 *${cmd.name.toUpperCase()}*\n\n${answer}${citations}`);
      } catch (e: any) {
        await reply(`❌ AI Error: ${e.message || "Try again later"}`);
      }
    },
  });
}

// ---- DOWNLOAD: MISSING COMMANDS ----
registerCommand({
  name: "pin",
  aliases: ["pinterest"],
  category: "Download",
  description: "Download Pinterest image/video",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url?.includes("pinterest")) return reply("❓ Usage: .pin <Pinterest URL>\nExample: .pin https://pinterest.com/pin/123456");
    await reply(`📌 *Pinterest Downloader*\n\nTo download this pin:\n1. Visit: https://savephoto.net\n2. Paste: ${url}\n3. Click Download\n\n> _MAXX XMD_ ⚡`);
  },
});

registerCommand({
  name: "savestatus",
  aliases: ["statusdl"],
  category: "Download",
  description: "Save WhatsApp status",
  handler: async ({ reply }) => {
    await reply(`📱 *Save WhatsApp Status*\n\nTo save someone's status:\n\n📲 *Android:* Use "Status Saver" app from Play Store\n🍎 *iPhone:* Use "Wstat" from App Store\n\n💡 _Bots cannot directly access others' statuses due to WhatsApp's privacy system._\n\n> _MAXX XMD_ ⚡`);
  },
});

registerCommand({
  name: "apk",
  aliases: [],
  category: "Download",
  description: "Search and download an APK",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply("❓ Usage: .apk <app name>\nExample: .apk WhatsApp");
    const url = `https://apkpure.com/search?q=${encodeURIComponent(query)}`;
    await reply(`📦 *APK Search: ${query}*\n\n🔗 Click to find on APKPure:\n${url}\n\n⚠️ _Only install APKs from trusted sources!_\n\n> _MAXX XMD_ ⚡`);
  },
});

registerCommand({
  name: "gitclone",
  aliases: ["git"],
  category: "Download",
  description: "Get git clone command for any repo",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url) return reply("❓ Usage: .gitclone <GitHub/GitLab URL>\nExample: .gitclone https://github.com/Carlymaxx/maxxtechxmd");
    const name = url.replace(/\.git$/, "").split("/").slice(-1)[0] || "repo";
    await reply(`📂 *Git Clone*\n\n\`\`\`\ngit clone ${url}\ncd ${name}\n\`\`\`\n\n📥 *Download ZIP:*\n${url.replace(/\.git$/, "")}/archive/refs/heads/main.zip\n\n> _MAXX XMD_ ⚡`);
  },
});

registerCommand({
  name: "mediafire",
  aliases: ["mf"],
  category: "Download",
  description: "Get MediaFire direct download link",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url?.includes("mediafire")) return reply("❓ Usage: .mediafire <MediaFire URL>\nExample: .mediafire https://www.mediafire.com/file/xxx");
    await reply("⏳ Extracting download link...");
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
      const html = await res.text();
      const match = html.match(/href="(https:\/\/download\d+\.mediafire\.com[^"]+)"/);
      if (!match) throw new Error("No direct link found");
      await reply(`✅ *MediaFire Direct Link*\n\n🔗 ${match[1]}\n\n> _MAXX XMD_ ⚡`);
    } catch {
      await reply(`📁 *MediaFire*\n\n_Could not auto-extract link. Visit directly:_\n🔗 ${url}\n\n> _MAXX XMD_ ⚡`);
    }
  },
});

registerCommand({
  name: "itunes",
  aliases: ["apple", "applemusic"],
  category: "Download",
  description: "Search iTunes/Apple Music for a song",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply("❓ Usage: .itunes <song or artist>\nExample: .itunes Shape of You");
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5`);
      const data = await res.json() as any;
      if (!data.results?.length) return reply(`❌ No results found for: *${query}*`);
      const list = data.results.map((r: any, i: number) => {
        const dur = r.trackTimeMillis ? `${Math.floor(r.trackTimeMillis / 60000)}:${String(Math.floor((r.trackTimeMillis % 60000) / 1000)).padStart(2, "0")}` : "N/A";
        return `${i + 1}. 🎵 *${r.trackName}*\n   👤 ${r.artistName}\n   💿 ${r.collectionName}\n   ⏱️ ${dur}\n   🔗 ${r.trackViewUrl}`;
      }).join("\n\n");
      await reply(`🎵 *iTunes Search: ${query}*\n\n${list}\n\n> _MAXX XMD_ ⚡`);
    } catch {
      await reply("❌ Could not search iTunes. Try again later.");
    }
  },
});

// ---- TOOLS: MISSING COMMANDS ----
registerCommand({
  name: "ssweb",
  aliases: ["screenshot", "webss"],
  category: "Tools",
  description: "Take a screenshot of any website",
  handler: async ({ sock, from, args, reply }) => {
    const url = args[0];
    if (!url) return reply("❓ Usage: .ssweb <URL>\nExample: .ssweb https://google.com");
    await reply("⏳ Taking screenshot...");
    try {
      const ssUrl = `https://image.thum.io/get/width/1280/height/720/crop/720/noanimate/${url}`;
      await sock.sendMessage(from, {
        image: { url: ssUrl },
        caption: `🌐 *Screenshot: ${url}*\n\n> _MAXX XMD_ ⚡`,
      });
    } catch {
      await reply("❌ Could not take screenshot. Make sure the URL is valid and starts with http/https.");
    }
  },
});

registerCommand({
  name: "tourl",
  aliases: ["upload", "fileupload"],
  category: "Tools",
  description: "Upload media and get a shareable URL",
  handler: async ({ msg, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const imgMsg = msg.message?.imageMessage || ctx?.quotedMessage?.imageMessage;
    const vidMsg = msg.message?.videoMessage || ctx?.quotedMessage?.videoMessage;
    const audMsg = msg.message?.audioMessage || ctx?.quotedMessage?.audioMessage;
    const docMsg = msg.message?.documentMessage || ctx?.quotedMessage?.documentMessage;
    const media = imgMsg || vidMsg || audMsg || docMsg;
    if (!media) return reply("❌ Reply to or send a media message with .tourl");
    await reply("⏳ Uploading to cloud...");
    try {
      let rawMsg: any;
      let mime = "application/octet-stream";
      let ext = "bin";
      if (imgMsg) { rawMsg = { message: { imageMessage: imgMsg } }; mime = "image/jpeg"; ext = "jpg"; }
      else if (vidMsg) { rawMsg = { message: { videoMessage: vidMsg } }; mime = "video/mp4"; ext = "mp4"; }
      else if (audMsg) { rawMsg = { message: { audioMessage: audMsg } }; mime = "audio/mpeg"; ext = "mp3"; }
      else { rawMsg = { message: { documentMessage: docMsg } }; }
      const buf = await downloadMediaMessage(rawMsg as WAMessage, "buffer", {});
      const blob = new Blob([buf as Buffer], { type: mime });
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", blob, `media.${ext}`);
      const res = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form });
      const url = (await res.text()).trim();
      if (!url.startsWith("https://")) throw new Error("Upload failed");
      await reply(`☁️ *Media Uploaded!*\n\n🔗 ${url}\n\n_Link is permanent. Keep it safe!_\n\n> _MAXX XMD_ ⚡`);
    } catch (e: any) {
      await reply(`❌ Upload failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "emojimix",
  aliases: ["ejmix", "mixemoji"],
  category: "Tools",
  description: "Mix two emojis using Google Emoji Kitchen",
  handler: async ({ sock, from, args, reply }) => {
    const [e1, e2] = args;
    if (!e1 || !e2) return reply("❓ Usage: .emojimix <emoji1> <emoji2>\nExample: .emojimix 😂 😭");
    try {
      const cp1 = [...e1][0]?.codePointAt(0)?.toString(16);
      const cp2 = [...e2][0]?.codePointAt(0)?.toString(16);
      if (!cp1 || !cp2) throw new Error("Invalid emojis");
      // Try multiple date versions of the Emoji Kitchen API
      const dates = ["20201001", "20210218", "20210521", "20211115", "20220110", "20220406", "20220815"];
      let sent = false;
      for (const date of dates) {
        const url = `https://www.gstatic.com/android/keyboard/emojikitchen/${date}/u${cp1}/u${cp1}_u${cp2}.png`;
        try {
          const test = await fetch(url, { method: "HEAD" });
          if (test.ok) {
            await sock.sendMessage(from, { image: { url }, caption: `✨ *Emoji Mix: ${e1} + ${e2}*\n\n> _MAXX XMD_ ⚡` });
            sent = true;
            break;
          }
        } catch {}
      }
      if (!sent) {
        // Try reversed order
        for (const date of dates) {
          const url = `https://www.gstatic.com/android/keyboard/emojikitchen/${date}/u${cp2}/u${cp2}_u${cp1}.png`;
          try {
            const test = await fetch(url, { method: "HEAD" });
            if (test.ok) {
              await sock.sendMessage(from, { image: { url }, caption: `✨ *Emoji Mix: ${e1} + ${e2}*\n\n> _MAXX XMD_ ⚡` });
              sent = true;
              break;
            }
          } catch {}
        }
      }
      if (!sent) throw new Error("Combination not available");
    } catch {
      await reply(`🎨 *Emoji Mix*\n\n${e1} + ${e2} = ${e1}${e2}\n\nTry more combinations at https://emojimix.app\n\n> _MAXX XMD_ ⚡`);
    }
  },
});

registerCommand({
  name: "vcf",
  aliases: ["contacts", "exportcontacts"],
  category: "Tools",
  description: "Export group contacts as VCF file",
  groupOnly: true,
  handler: async ({ sock, from, groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Could not fetch group info.");
    const members = groupMetadata.participants;
    const vcfContent = members.map((m: any) => {
      const num = m.id.split("@")[0];
      return `BEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL;TYPE=CELL:+${num}\nEND:VCARD`;
    }).join("\n");
    const vcfBuf = Buffer.from(vcfContent, "utf8");
    await sock.sendMessage(from, {
      document: vcfBuf,
      mimetype: "text/vcard",
      fileName: `${groupMetadata.subject || "group"}_contacts.vcf`,
      caption: `📇 *${members.length} contacts exported!*\n\nGroup: ${groupMetadata.subject}\n\n> _MAXX XMD_ ⚡`,
    });
  },
});

registerCommand({
  name: "filtervcf",
  aliases: ["cleanvcf"],
  category: "Tools",
  description: "Filter and clean a VCF contacts file",
  handler: async ({ sock, from, msg, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const docMsg = msg.message?.documentMessage || ctx?.quotedMessage?.documentMessage;
    if (!docMsg) return reply("❌ Reply to a VCF (.vcf) file with .filtervcf");
    try {
      const buf = await downloadMediaMessage({ message: { documentMessage: docMsg } } as WAMessage, "buffer", {});
      const text = (buf as Buffer).toString("utf8");
      const cards = text.split(/(?=BEGIN:VCARD)/g).filter(c => c.includes("TEL"));
      if (!cards.length) return reply("❌ No valid contacts found in this VCF.");
      const cleaned = cards.join("\n");
      const filteredBuf = Buffer.from(cleaned, "utf8");
      await sock.sendMessage(from, {
        document: filteredBuf,
        mimetype: "text/vcard",
        fileName: "filtered_contacts.vcf",
        caption: `✅ *Filtered VCF*\n\n📇 ${cards.length} valid contacts kept\n\n> _MAXX XMD_ ⚡`,
      });
    } catch (e: any) {
      await reply(`❌ Failed to filter VCF: ${e.message}`);
    }
  },
});

registerCommand({
  name: "texttopdf",
  aliases: ["txt2pdf", "topdf"],
  category: "Tools",
  description: "Convert text to a PDF document",
  handler: async ({ sock, from, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .texttopdf <your text here>\nExample: .texttopdf Hello World, this is my document.");
    await reply("⏳ Generating PDF...");
    try {
      const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;padding:50px;line-height:1.8;color:#222">${text.replace(/\n/g, "<br>")}</body></html>`;
      const res = await fetch("https://api.html2pdf.app/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, apikey: "demo" }),
      });
      if (!res.ok) throw new Error("PDF service error");
      const pdfBuf = Buffer.from(await res.arrayBuffer());
      await sock.sendMessage(from, {
        document: pdfBuf,
        mimetype: "application/pdf",
        fileName: "maxx-xmd-document.pdf",
        caption: "📄 *PDF Generated!*\n\n> _MAXX XMD_ ⚡",
      });
    } catch {
      // Fallback to plain text file
      const textBuf = Buffer.from(text, "utf8");
      await sock.sendMessage(from, {
        document: textBuf,
        mimetype: "text/plain",
        fileName: "document.txt",
        caption: "📄 *Text Document*\n_(PDF service unavailable — sent as .txt)_\n\n> _MAXX XMD_ ⚡",
      });
    }
  },
});

// ---- VIDEO TOOLS ----
registerCommand({
  name: "tovideo",
  aliases: ["audiotovideo"],
  category: "Audio",
  description: "Convert audio to video with black background",
  handler: async ({ sock, from, msg, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const audioMsg = msg.message?.audioMessage || ctx?.quotedMessage?.audioMessage;
    if (!audioMsg) return reply("❌ Reply to an audio message with .tovideo");
    await reply("⏳ Converting audio to video...");
    try {
      const buf = await downloadMediaMessage({ message: { audioMessage: audioMsg } } as WAMessage, "buffer", {});
      const os = await import("os");
      const tmpAudio = path.join(os.tmpdir(), `maxx_tov_audio_${Date.now()}.mp3`);
      const tmpVideo = path.join(os.tmpdir(), `maxx_tov_vid_${Date.now()}.mp4`);
      fs.writeFileSync(tmpAudio, buf as Buffer);
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      await execAsync(`ffmpeg -f lavfi -i color=c=black:size=640x640:rate=1 -i "${tmpAudio}" -shortest -c:v libx264 -tune stillimage -c:a aac -b:a 192k "${tmpVideo}" -y`);
      const video = fs.readFileSync(tmpVideo);
      await sock.sendMessage(from, { video, caption: "🎬 *Audio → Video Converted!*\n\n> _MAXX XMD_ ⚡" } as any);
      fs.unlinkSync(tmpAudio);
      fs.unlinkSync(tmpVideo);
    } catch (e: any) {
      await reply(`❌ Conversion failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "volvideo",
  aliases: ["videovol"],
  category: "Audio",
  description: "Adjust the volume of a video",
  handler: async ({ sock, from, msg, args, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const vidMsg = msg.message?.videoMessage || ctx?.quotedMessage?.videoMessage;
    if (!vidMsg) return reply("❌ Reply to a video with .volvideo <multiplier>\nExample: .volvideo 2.0\nValues: 0.5 (half) 2.0 (double)");
    const vol = Math.min(Math.max(parseFloat(args[0]) || 2, 0.1), 10);
    await reply(`⏳ Adjusting volume to ${vol}x...`);
    try {
      const buf = await downloadMediaMessage({ message: { videoMessage: vidMsg } } as WAMessage, "buffer", {});
      const os = await import("os");
      const tmpIn = path.join(os.tmpdir(), `maxx_vvIn_${Date.now()}.mp4`);
      const tmpOut = path.join(os.tmpdir(), `maxx_vvOut_${Date.now()}.mp4`);
      fs.writeFileSync(tmpIn, buf as Buffer);
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      await execAsync(`ffmpeg -i "${tmpIn}" -af "volume=${vol}" -c:v copy "${tmpOut}" -y`);
      const video = fs.readFileSync(tmpOut);
      await sock.sendMessage(from, { video, caption: `🔊 *Video Volume: ${vol}x*\n\n> _MAXX XMD_ ⚡` } as any);
      fs.unlinkSync(tmpIn);
      fs.unlinkSync(tmpOut);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

// ── SUDO helpers ──────────────────────────────────────────────────────────────
const SUDO_FILE = path.join(WORKSPACE_ROOT, "sudo.json");
function loadSudo(): string[] {
  try { if (fs.existsSync(SUDO_FILE)) return JSON.parse(fs.readFileSync(SUDO_FILE, "utf8")); } catch {}
  return [];
}

// ── Text extractor ────────────────────────────────────────────────────────────
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
    ""
  );
}

// ── Main message handler ──────────────────────────────────────────────────────
export async function handleMessage(sock: WASocket, msg: WAMessage) {
  if (!msg.message) return;

  const from = msg.key.remoteJid!;
  const sender = msg.key.participant || from;
  const isGroup = from.endsWith("@g.us");
  const body = extractText(msg);
  const settings = loadSettings();

  // If the message was sent from the bot's own number (fromMe), only skip it when
  // it does NOT start with the command prefix — those are the bot's own replies and
  // we must not re-process them (prevents infinite loops).
  // When it DOES start with the prefix, it's the owner using the same number as the
  // bot; allow it everywhere (groups AND DMs) so commands work in all chats.
  if (msg.key.fromMe && !body.startsWith(settings.prefix || ".")) return;
  const prefix = settings.prefix || ".";

  // Auto-read
  if (settings.autoread) {
    try { await sock.readMessages([msg.key]); } catch {}
  }

  // ── Auto-antiviewonce — intercept incoming view-once before it expires ───────
  if (settings.antiviewonce && !msg.key.fromMe) {
    const m = msg.message as any;
    const voMsg: any =
      m?.viewOnceMessage?.message ||
      m?.viewOnceMessageV2?.message ||
      m?.viewOnceMessageV2Extension?.message;
    if (voMsg) {
      try {
        const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
        function buildFakeVO(content: object) {
          return { key: { ...msg.key }, message: content };
        }
        const imgMsg = voMsg.imageMessage;
        const vidMsg = voMsg.videoMessage;
        const audMsg = voMsg.audioMessage;
        if (imgMsg) {
          const buf = await downloadMediaMessage(buildFakeVO({ imageMessage: imgMsg }) as any, "buffer", {});
          await sock.sendMessage(from, {
            image: buf as Buffer,
            caption: `👁️ *View-once auto-saved by MAXX-XMD* ⚡\n${imgMsg.caption || ""}`,
          });
        } else if (vidMsg) {
          const buf = await downloadMediaMessage(buildFakeVO({ videoMessage: vidMsg }) as any, "buffer", {});
          await sock.sendMessage(from, {
            video: buf as Buffer,
            caption: `👁️ *View-once auto-saved by MAXX-XMD* ⚡\n${vidMsg.caption || ""}`,
          });
        } else if (audMsg) {
          const buf = await downloadMediaMessage(buildFakeVO({ audioMessage: audMsg }) as any, "buffer", {});
          await sock.sendMessage(from, {
            audio: buf as Buffer,
            mimetype: audMsg.mimetype || "audio/mp4",
            ptt: audMsg.ptt || false,
          });
        }
      } catch (e: any) {
        console.error("[antiviewonce] auto-intercept failed:", e.message);
      }
    }
  }

  // Auto-typing presence (fire-and-forget — never block the command)
  if (settings.autotyping && body.startsWith(prefix)) {
    sock.sendPresenceUpdate("composing", from).catch(() => {});
  }

  // ── Command routing ─────────────────────────────────────────────────────────
  if (!body.startsWith(prefix)) {
    // ── Chatbot — multi-layer AI with smart fallback ───────────────────────
    if (settings.chatbot) {
      const q = body.trim();
      if (q) {
        sock.sendPresenceUpdate("composing", from).catch(() => {});

        // ── Helper: Gemini AI (primary chatbot) ────────────────────────────
        async function tryElite(question: string): Promise<string> {
          return pollinationsAsk(
            question, "gemini",
            "You are MAXX-XMD, a helpful and friendly WhatsApp bot assistant. Keep responses concise and conversational."
          );
        }

        // ── Helper: Wikipedia for "what is / who is" factual queries ───────
        async function tryWikipedia(question: string): Promise<string> {
          const match = question.match(/(?:what is|who is|tell me about|explain|define)\s+(.+)/i);
          if (!match) throw new Error("not factual");
          const topic = match[1].trim().replace(/\s+/g, "_");
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`, { signal: AbortSignal.timeout(6000) });
          if (!res.ok) throw new Error("not found");
          const d = await res.json() as any;
          if (!d.extract) throw new Error("no extract");
          return `📖 *${d.title}*\n\n${d.extract.slice(0, 400)}${d.extract.length > 400 ? "..." : ""}`;
        }

        // ── Smart local fallback — always responds ─────────────────────────
        function localSmartReply(question: string): string {
          const q2 = question.toLowerCase().trim();
          const now = new Date();
          const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          const dateStr = now.toDateString();

          // Greetings
          if (/^(hi|hello|hey|heyy|sup|wassup|what'?s up|howdy|yo|hola)/.test(q2))
            return ["Hey there! 👋 How can I help you today?", "Hello! 😊 What can I do for you?", "Hi! I'm MAXX-XMD 🤖 How are you?", "Hey! Great to hear from you 😄"][Math.floor(Math.random() * 4)];

          // How are you
          if (/how are you|how r u|how're you|how do you do|you okay|u good/.test(q2))
            return "I'm doing great, thanks for asking! 😊 How are you doing today?";

          // Good morning/night/evening
          if (/good morning/.test(q2)) return "Good morning! ☀️ Hope you have an amazing day ahead!";
          if (/good night|gn\b/.test(q2)) return "Good night! 🌙 Sweet dreams! Rest well 😴";
          if (/good evening|good afternoon/.test(q2)) return "Good evening! 🌆 Hope your day went well!";

          // Time and date
          if (/what.*time|current time|time now/.test(q2)) return `🕐 The current time is *${timeStr}*`;
          if (/what.*date|today.*date|current date/.test(q2)) return `📅 Today is *${dateStr}*`;
          if (/what.*day/.test(q2)) return `📅 Today is *${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()]}*`;

          // Bot identity
          if (/who are you|what are you|your name|who made you|who created you/.test(q2))
            return "I'm *MAXX-XMD* 🤖 — a powerful WhatsApp bot! I have 450+ commands covering downloads, AI, games, economy, stickers, and more. Type `.menu` to see everything I can do! ⚡";

          // What can you do
          if (/what can you do|your features|your commands|show commands|help/.test(q2))
            return `🤖 I'm *MAXX-XMD* with 450+ commands!\n\nCategories:\n🤖 AI & Chat\n⬇️ Downloads (TikTok, IG, YT)\n🎮 Games (Wordle, Hangman)\n🪙 Economy System\n🎭 Sticker Creation\n🌍 Country & Weather\n📚 Education\n✍️ Writing Tools\n\nType *.menu* to explore all!`;

          // Thanks
          if (/thank|thanks|thx|thnx|ty\b/.test(q2)) return ["You're welcome! 😊 Anything else?", "Happy to help! 🙌", "Anytime! 😄 That's what I'm here for!"][Math.floor(Math.random() * 3)];

          // Bye
          if (/^(bye|goodbye|cya|see you|ttyl|later)\b/.test(q2)) return "Goodbye! 👋 Come back anytime! 😊";

          // Love
          if (/i love you|love u|luv u/.test(q2)) return "Aww 🥰 I love you too! (in a bot kind of way 😄)";

          // Compliments
          if (/you.*great|you.*amazing|you.*awesome|good bot|nice bot/.test(q2)) return "Thank you so much! 😊🙏 That means a lot!";

          // Insults
          if (/you.*stupid|you.*dumb|you.*useless|you.*suck/.test(q2)) return "Ouch 😅 I'm trying my best! Cut me some slack 🙏";

          // Jokes
          if (/tell.*joke|joke|make me laugh/.test(q2)) {
            const jokes = ["Why do programmers prefer dark mode? Because light attracts bugs! 🐛😂", "Why don't scientists trust atoms? Because they make up everything! 😂", "I told my wife she should embrace her mistakes. She gave me a hug 😂"];
            return jokes[Math.floor(Math.random() * jokes.length)];
          }

          // Random facts
          if (/tell.*fact|random fact|fun fact/.test(q2)) {
            const facts = ["🧠 Your brain generates enough electricity to power a small light bulb!", "🐬 Dolphins sleep with one eye open!", "🍯 Honey never expires — archaeologists found 3000-year-old edible honey in Egypt!", "🦈 Sharks are older than trees — they've existed for 400 million years!"];
            return facts[Math.floor(Math.random() * facts.length)];
          }

          // Motivation
          if (/motivat|inspire|encourage|i.*sad|feeling down|depressed/.test(q2))
            return "💪 *Remember:* Every expert was once a beginner. Every champion was once a contender that refused to give up. Keep going — your breakthrough is closer than you think! 🌟";

          // Generic smart response
          const generics = [
            "That's interesting! 🤔 Could you tell me more?",
            "I see! 😊 Is there anything specific you need help with? Type *.menu* to see all my commands!",
            "Interesting thought! If you need help with something, just ask or type *.menu* 📋",
            "I'm not 100% sure how to respond to that, but I'm always here if you need me! 😊",
            "Got it! Type *.menu* to see all the amazing things I can do for you ⚡",
          ];
          return generics[Math.floor(Math.random() * generics.length)];
        }

        // ── Try AI → Wikipedia → Smart fallback ───────────────────────────
        let responseText = "";
        try { responseText = await tryElite(q); } catch {}
        if (!responseText) { try { responseText = await tryWikipedia(q); } catch {} }
        if (!responseText) { responseText = localSmartReply(q); }

        try {
          await sock.sendMessage(from, { text: responseText + "\n\n> _MAXX-XMD_ ⚡" }, { quoted: msg });
        } catch {}
      }
    }
    return;
  }

  const parts = body.slice(prefix.length).trim().split(/\s+/);
  const commandName = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const text = args.join(" ");

  if (!commandName) return;

  const command = commandRegistry.get(commandName);
  if (!command) return;

  // Owner check — reads from env var first, falls back to saved settings number
  const envOwner = process.env.OWNER_NUMBER?.replace(/[^0-9]/g, "");
  const settingsOwner = settings.ownerNumber?.replace(/[^0-9]/g, "");
  const ownerNum = envOwner || settingsOwner || "";
  const ownerJid = ownerNum ? ownerNum + "@s.whatsapp.net" : "";
  const senderNum = sender.replace("@s.whatsapp.net", "").replace(/[^0-9]/g, "");
  const sudo = loadSudo();
  const isOwner = !!ownerNum && (senderNum === ownerNum || sender === ownerJid || from === ownerJid);
  const isSudo = sudo.includes(sender) || isOwner;

  // Block sensitive settings commands from non-sudo users
  if (command.sudoOnly && !isSudo) {
    await sock.sendMessage(from, { text: `⛔ *Owner/Sudo only!*\n\nThis command can only be used by the bot owner or sudo users.` }, { quoted: msg });
    return;
  }
  if (command.groupOnly && !isGroup) {
    await sock.sendMessage(from, { text: "⛔ This command can only be used in groups!" }, { quoted: msg });
    return;
  }

  // Mode check
  if (settings.mode === "private" && !isOwner && !isSudo) {
    await sock.sendMessage(from, { text: `🔒 Bot is in *private* mode. Only owner can use commands.` }, { quoted: msg });
    return;
  }
  if (settings.mode === "inbox" && isGroup && !isOwner) {
    await sock.sendMessage(from, { text: `📥 Bot only responds in *DMs* right now.` }, { quoted: msg });
    return;
  }

  // React with a random emoji — fire-and-forget (never delays the command)
  const REACT_EMOJIS = [
    "⚡","🔥","💫","✨","🌟","💎","🚀","🎯","💥","🎊",
    "🏆","👑","🎉","🤩","😎","🐉","🌈","🦋","💪","🎶",
    "🍀","🌺","🦅","🌙","☄️","🎸","🏄","🌊","🎭","🔮",
  ];
  const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
  sock.sendMessage(from, { react: { text: emoji, key: msg.key } }).catch(() => {});

  // Auto-sticker reaction if enabled — also fire-and-forget
  if (settings.autoreaction) {
    getAutoSticker().then(stickerBuf => {
      if (stickerBuf) sock.sendMessage(from, { sticker: stickerBuf }, { quoted: msg }).catch(() => {});
    }).catch(() => {});
  }

  // Fetch group metadata in parallel with command execution (non-blocking)
  let groupMetadata: any = null;
  const groupMetaPromise = isGroup
    ? sock.groupMetadata(from).then(m => { groupMetadata = m; }).catch(() => {})
    : Promise.resolve();

  // Reply helper — auto-appends a randomly chosen MAXX XMD footer to every text response
  const FOOTERS = [
    "\n\n> _MAXX-XMD_ ⚡",
    "\n\n> _MAXX-XMD_ 🔥",
    "\n\n> _MAXX-XMD_ 💫",
    "\n\n> _MAXX-XMD_ ✨",
    "\n\n> _MAXX-XMD_ 🌟",
    "\n\n> _MAXX-XMD_ 💎",
    "\n\n> _MAXX-XMD_ 🚀",
    "\n\n> *MAXX XMD* ⚡",
    "\n\n> *MAXX-XMD* 🔥",
    "\n\n> ✨ _MAXX-XMD_ 💫",
    "\n\n╰─ _MAXX XMD_ ⚡",
    "\n\n━━ *MAXX-XMD* 🌟",
    "\n\n> _Powered by MAXX-XMD_ ⚡",
    "\n\n> 🤖 _MAXX XMD_ ⚡",
    "\n\n> _MAXX-XMD Bot_ 🔥",
    "\n\n❯ _MAXX XMD_ ⚡",
    "\n\n⚡ _MAXX-XMD_",
    "\n\n🌟 _MAXX XMD_ 🌟",
    "\n\n> _MAXX-XMD_ 🎯",
    "\n\n> _MAXX-XMD_ 💥",
  ];
  const randomFooter = () => FOOTERS[Math.floor(Math.random() * FOOTERS.length)];
  const reply = async (text: string) => {
    const hasFooter = text.includes("MAXX XMD") || text.includes("MAXX-XMD");
    const branded = hasFooter ? text : text + randomFooter();
    await sock.sendMessage(from, { text: branded }, { quoted: msg });
  };
  const reactFn = async (emoji: string) => {
    try { await sock.sendMessage(from, { react: { text: emoji, key: msg.key } }); } catch {}
  };

  // Await group metadata now (was launched in parallel with react/sticker) — ensures
  // admin checks work while still not blocking the react/sticker sends
  await groupMetaPromise;

  // Build context
  const ctx = {
    sock, msg, from, sender, isGroup, isOwner, isSudo,
    body, args, text, prefix, commandName, settings,
    quoted: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage as any,
    groupMetadata, reply, react: reactFn,
  };

  try {
    await command.handler(ctx as any);
  } catch (e: any) {
    logger.error({ err: e }, `Command error: ${commandName}`);
    await reply(`❌ Error: ${e.message || "Something went wrong"}`);
  }

  // Stop typing (fire-and-forget)
  if (settings.autotyping) {
    sock.sendPresenceUpdate("paused", from).catch(() => {});
  }
}
