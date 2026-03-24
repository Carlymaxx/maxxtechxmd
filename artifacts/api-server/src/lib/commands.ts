import type { WASocket, WAMessage, proto } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import sharp from "sharp";
import { loadSettings, saveSettings } from "./botState.js";
import { logger } from "./logger.js";
import fs from "fs";
import path from "path";

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
  aliases: ["yt", "ytaudio", "music"],
  category: "Download",
  description: "Download a YouTube song/audio",
  handler: async ({ sock, from, args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply("❓ Usage: .song <YouTube URL or song title>\nExample: .song Blinding Lights");
    await reply("⏳ Searching and downloading... Please wait.");
    try {
      const ytdl = await import("@distube/ytdl-core");
      let url = query;
      if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
        const searchRes = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
        const html = await searchRes.text();
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (!match) return reply("❌ No results found for: " + query);
        url = `https://www.youtube.com/watch?v=${match[1]}`;
      }
      const info = await ytdl.default.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;
      if (parseInt(duration) > 600) return reply("❌ Video too long (max 10 minutes).");
      const { Readable } = await import("stream");
      const stream = ytdl.default(url, { filter: "audioonly", quality: "highestaudio" });
      const chunks: Buffer[] = [];
      await new Promise<void>((res, rej) => {
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", res);
        stream.on("error", rej);
      });
      const buf = Buffer.concat(chunks);
      await sock.sendMessage(from, {
        audio: buf,
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
      } as any);
      await reply(`✅ *${title}*\n⏱️ Duration: ${Math.floor(parseInt(duration) / 60)}:${(parseInt(duration) % 60).toString().padStart(2, "0")}\n\n> _MAXX XMD_ ⚡`);
    } catch (e: any) {
      await reply(`❌ Download failed: ${e.message}\n\nTip: Try with a direct YouTube URL.`);
    }
  },
});

registerCommand({
  name: "video",
  aliases: ["ytvideo", "ytv"],
  category: "Download",
  description: "Download a YouTube video",
  handler: async ({ sock, from, args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply("❓ Usage: .video <YouTube URL or title>");
    await reply("⏳ Downloading video... Please wait (may take a moment).");
    try {
      const ytdl = await import("@distube/ytdl-core");
      let url = query;
      if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
        const searchRes = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
        const html = await searchRes.text();
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (!match) return reply("❌ No results found.");
        url = `https://www.youtube.com/watch?v=${match[1]}`;
      }
      const info = await ytdl.default.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;
      if (parseInt(duration) > 300) return reply("❌ Video too long (max 5 minutes for video). Use .song for audio.");
      const stream = ytdl.default(url, { filter: "videoandaudio", quality: "18" });
      const chunks: Buffer[] = [];
      await new Promise<void>((res, rej) => {
        stream.on("data", (c: Buffer) => chunks.push(c));
        stream.on("end", res);
        stream.on("error", rej);
      });
      const buf = Buffer.concat(chunks);
      await sock.sendMessage(from, { video: buf, caption: `🎬 *${title}*\n\n> _MAXX XMD_ ⚡`, fileName: `${title}.mp4` } as any);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
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

// ---- AI ----
registerCommand({
  name: "gpt",
  aliases: ["ai", "ask", "chatgpt"],
  category: "AI",
  description: "Chat with AI",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply("❓ Usage: .gpt <question>\nExample: .gpt What is the capital of France?");
    await reply("🤖 *MAXX XMD AI*\n\n⏳ Thinking...");
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: q }], max_tokens: 500 }),
      });
      const data = await res.json() as any;
      const answer = data.choices?.[0]?.message?.content;
      if (!answer) throw new Error();
      await reply(`🤖 *MAXX XMD AI*\n\n❓ ${q}\n\n💬 ${answer}`);
    } catch {
      await reply(`🤖 *MAXX XMD AI*\n\nI need an OPENAI_API_KEY to answer AI questions.\n\nSet: OPENAI_API_KEY in your environment variables.\n\nAlternatively try: .gemini ${q}`);
    }
  },
});

registerCommand({
  name: "gemini",
  aliases: ["google"],
  category: "AI",
  description: "Chat with Google Gemini AI",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply("❓ Usage: .gemini <question>");
    await reply("🤖 Asking Gemini...");
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("No API key");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: q }] }] }),
      });
      const data = await res.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error();
      await reply(`✨ *Gemini AI*\n\n❓ ${q}\n\n💬 ${text}`);
    } catch {
      await reply(`✨ *Gemini AI*\n\nSet GEMINI_API_KEY in your environment to enable Gemini.\n\nGet a free key at: https://aistudio.google.com/`);
    }
  },
});

const aiCommands = [
  { name: "analyze", prompt: (q: string) => `Analyze this: ${q}` },
  { name: "code", prompt: (q: string) => `Write code for: ${q}` },
  { name: "recipe", prompt: (q: string) => `Give me a recipe for: ${q}` },
  { name: "story", prompt: (q: string) => `Write a short story about: ${q}` },
  { name: "summarize", prompt: (q: string) => `Summarize this: ${q}` },
  { name: "teach", prompt: (q: string) => `Teach me about: ${q}` },
  { name: "programming", prompt: (q: string) => `Answer this programming question: ${q}` },
  { name: "generate", prompt: (q: string) => `Generate content about: ${q}` },
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
      await reply(`🤖 Processing your request...`);
      try {
        const prompt = cmd.prompt(q);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error();
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await res.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error();
        await reply(`🤖 *${cmd.name.toUpperCase()}*\n\n${text}`);
      } catch {
        await reply(`🤖 *${cmd.name.toUpperCase()}*\n\nSet GEMINI_API_KEY to enable AI commands.\nGet free key: https://aistudio.google.com/`);
      }
    },
  });
}

// ── SUDO helpers ──────────────────────────────────────────────────────────────
const SUDO_FILE = path.join(process.cwd(), "../../sudo.json");
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
  if (!msg.message || msg.key.fromMe) return;

  const from = msg.key.remoteJid!;
  const sender = msg.key.participant || from;
  const isGroup = from.endsWith("@g.us");
  const body = extractText(msg);
  const settings = loadSettings();
  const prefix = settings.prefix || ".";

  // Auto-read
  if (settings.autoread) {
    try { await sock.readMessages([msg.key]); } catch {}
  }

  // Auto-typing presence
  if (settings.autotyping && body.startsWith(prefix)) {
    try { await sock.sendPresenceUpdate("composing", from); } catch {}
  }

  // ── Command routing ─────────────────────────────────────────────────────────
  if (!body.startsWith(prefix)) {
    // Chatbot auto-reply
    if (settings.chatbot && !isGroup) {
      const q = body.trim();
      if (q) {
        const responses = [
          "Hello! I'm MAXX XMD 🤖", "How can I help you?", "Type .menu to see all commands!",
          "I'm doing great, thanks for asking 😊", "Interesting! Tell me more.",
          `Send *${prefix}menu* to see what I can do!`,
        ];
        const r = responses[Math.floor(Math.random() * responses.length)];
        await sock.sendMessage(from, { text: r }, { quoted: msg });
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

  // Owner check
  const ownerNumber = settings.ownerNumber ? settings.ownerNumber + "@s.whatsapp.net" : "";
  const sudo = loadSudo();
  const isOwner = !!ownerNumber && (sender === ownerNumber || from === ownerNumber);
  const isSudo = sudo.includes(sender) || isOwner;

  if (command.ownerOnly && !isOwner) {
    await sock.sendMessage(from, { text: "⛔ This command is for the bot owner only!" }, { quoted: msg });
    return;
  }
  if (command.sudoOnly && !isSudo) {
    await sock.sendMessage(from, { text: "⛔ This command is for sudo users only!" }, { quoted: msg });
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

  // Auto-react to command
  if (settings.autoreaction) {
    try { await sock.sendMessage(from, { react: { text: "⚡", key: msg.key } }); } catch {}
  }

  // Fetch group metadata if needed
  let groupMetadata = null;
  if (isGroup) {
    try { groupMetadata = await sock.groupMetadata(from); } catch {}
  }

  // Reply helper
  const reply = async (text: string) => {
    await sock.sendMessage(from, { text }, { quoted: msg });
  };
  const reactFn = async (emoji: string) => {
    try { await sock.sendMessage(from, { react: { text: emoji, key: msg.key } }); } catch {}
  };

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

  // Stop typing
  if (settings.autotyping) {
    try { await sock.sendPresenceUpdate("paused", from); } catch {}
  }
}
