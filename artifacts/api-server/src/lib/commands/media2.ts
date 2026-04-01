import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── Downloads ─────────────────────────────────────────────────────────────────

registerCommand({
  name: "tiktok",
  aliases: ["tt", "tik", "ttdown"],
  category: "Download",
  description: "Download TikTok video without watermark (.tiktok <url>)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const url = args[0];
    if (!url || !url.includes("tiktok")) return reply(`❓ Usage: .tiktok <tiktok url>\nExample: .tiktok https://vm.tiktok.com/xxx${FOOTER}`);
    try {
      await reply("⏳ Fetching TikTok video...");
      const res = await fetch(`https://api.eliteprotech.com/tiktok?url=${encodeURIComponent(url)}`);
      const data = await res.json() as any;
      const videoUrl = data.url || data.data?.play || data.video;
      if (!videoUrl) throw new Error("no video url");
      await sock.sendMessage(from, { video: { url: videoUrl }, caption: `🎵 TikTok Video${FOOTER}`, mimetype: "video/mp4" }, { quoted: msg });
    } catch {
      await reply(`❌ TikTok download failed. Try a different link.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "instagram",
  aliases: ["ig", "igdown", "insta"],
  category: "Download",
  description: "Download Instagram reel/post (.instagram <url>)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const url = args[0];
    if (!url || !url.includes("instagram")) return reply(`❓ Usage: .instagram <instagram url>${FOOTER}`);
    try {
      await reply("⏳ Fetching Instagram media...");
      const res = await fetch(`https://api.eliteprotech.com/instagram?url=${encodeURIComponent(url)}`);
      const data = await res.json() as any;
      const mediaUrl = data.url || data.data?.[0]?.url || data.video || data.image;
      if (!mediaUrl) throw new Error("no media url");
      const isVideo = mediaUrl.includes(".mp4") || data.type === "video";
      if (isVideo) {
        await sock.sendMessage(from, { video: { url: mediaUrl }, caption: `📸 Instagram Video${FOOTER}`, mimetype: "video/mp4" }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { image: { url: mediaUrl }, caption: `📸 Instagram Post${FOOTER}` }, { quoted: msg });
      }
    } catch {
      await reply(`❌ Instagram download failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "twitter",
  aliases: ["tw", "xvideo", "xdown"],
  category: "Download",
  description: "Download Twitter/X video (.twitter <url>)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const url = args[0];
    if (!url || (!url.includes("twitter") && !url.includes("x.com"))) return reply(`❓ Usage: .twitter <twitter/x url>${FOOTER}`);
    try {
      await reply("⏳ Fetching Twitter/X video...");
      const res = await fetch(`https://api.eliteprotech.com/twitter?url=${encodeURIComponent(url)}`);
      const data = await res.json() as any;
      const videoUrl = data.url || data.data?.url || data.video;
      if (!videoUrl) throw new Error("no video url");
      await sock.sendMessage(from, { video: { url: videoUrl }, caption: `🐦 Twitter/X Video${FOOTER}`, mimetype: "video/mp4" }, { quoted: msg });
    } catch {
      await reply(`❌ Twitter/X download failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "facebook",
  aliases: ["fb", "fbvideo", "fbdown"],
  category: "Download",
  description: "Download Facebook video (.facebook <url>)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const url = args[0];
    if (!url || !url.includes("facebook")) return reply(`❓ Usage: .facebook <facebook url>${FOOTER}`);
    try {
      await reply("⏳ Fetching Facebook video...");
      const res = await fetch(`https://api.eliteprotech.com/facebook?url=${encodeURIComponent(url)}`);
      const data = await res.json() as any;
      const videoUrl = data.url || data.data?.url || data.video;
      if (!videoUrl) throw new Error("no video url");
      await sock.sendMessage(from, { video: { url: videoUrl }, caption: `📘 Facebook Video${FOOTER}`, mimetype: "video/mp4" }, { quoted: msg });
    } catch {
      await reply(`❌ Facebook download failed.${FOOTER}`);
    }
  },
});

// ── QR Code ───────────────────────────────────────────────────────────────────

registerCommand({
  name: "qr",
  aliases: ["qrcode", "makeqr", "qrgen"],
  category: "Tools",
  description: "Generate a QR code for any text or URL (.qr https://google.com)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .qr <text/url>\nExample: .qr https://google.com`);
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=400x400&bgcolor=ffffff&color=000000&margin=10&format=png`;
      await sock.sendMessage(from, { image: { url }, caption: `📱 *QR Code*\n\n_Scan to get:_ ${text.slice(0, 80)}${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ QR code generation failed.${FOOTER}`);
    }
  },
});

// ── AI Portrait (different from photo.ts's imagine) ───────────────────────────

registerCommand({
  name: "imagine2",
  aliases: ["aiart2", "paintme", "portrait"],
  category: "AI",
  description: "Generate a portrait-style AI image (.imagine2 anime warrior girl with sword)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const prompt = args.join(" ");
    if (!prompt) return reply(`❓ Usage: .imagine2 <description>${FOOTER}`);
    try {
      await reply(`🖼️ Creating portrait: _"${prompt}"_\n\n⏳ This takes 10-20 seconds...`);
      const enhancedPrompt = `${prompt}, highly detailed, masterpiece, 4k, beautiful lighting`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=512&height=768&nologo=true&model=turbo`;
      await sock.sendMessage(from, { image: { url }, caption: `🖼️ *AI Portrait*\n\n✏️ _"${prompt}"_${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Portrait generation failed.${FOOTER}`);
    }
  },
});

// ── Screenshot ────────────────────────────────────────────────────────────────

registerCommand({
  name: "screenshot",
  aliases: ["webshot", "ss", "ssweb"],
  category: "Tools",
  description: "Take a screenshot of any website (.screenshot https://google.com)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const url = args[0];
    if (!url || !url.startsWith("http")) return reply(`❓ Usage: .screenshot <url>\nExample: .screenshot https://google.com${FOOTER}`);
    try {
      await reply("📸 Taking screenshot...");
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`);
      const data = await res.json() as any;
      const imgUrl = data.data?.screenshot?.url || data.url;
      if (!imgUrl) throw new Error("no screenshot");
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `📸 *Screenshot of:*\n${url}${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Screenshot failed.${FOOTER}`);
    }
  },
});

// ── Memes ─────────────────────────────────────────────────────────────────────

registerCommand({
  name: "meme",
  aliases: ["randmeme", "funmeme", "getmeme2"],
  category: "Fun",
  description: "Get a random meme from Reddit",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const res = await fetch("https://meme-api.com/gimme");
      const data = await res.json() as any;
      if (!data.url) throw new Error("no url");
      await sock.sendMessage(from, { image: { url: data.url }, caption: `😂 *${data.title}*\n\n📌 r/${data.subreddit}${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Could not fetch meme. Try again!${FOOTER}`);
    }
  },
});

registerCommand({
  name: "meme2",
  aliases: ["subredditm", "redditm"],
  category: "Fun",
  description: "Get a meme from a specific subreddit (.meme2 dankmemes)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const sub = args[0] || "memes";
    try {
      const res = await fetch(`https://meme-api.com/gimme/${encodeURIComponent(sub)}`);
      const data = await res.json() as any;
      if (!data.url || data.code) throw new Error("invalid subreddit");
      await sock.sendMessage(from, { image: { url: data.url }, caption: `😂 *${data.title}*\n\n📌 r/${data.subreddit}${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Subreddit *r/${sub}* not found or has no memes.${FOOTER}`);
    }
  },
});

// ── GIF Search ────────────────────────────────────────────────────────────────

registerCommand({
  name: "gif",
  aliases: ["gifsearch", "animgif"],
  category: "Fun",
  description: "Search and send a GIF (.gif dancing cat)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const query = args.join(" ") || "funny";
    try {
      const cats = ["hug", "pat", "wave", "dance", "happy", "wink", "blush"];
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const wpRes = await fetch(`https://api.waifu.pics/sfw/${cat}`);
      const wpData = await wpRes.json() as any;
      await sock.sendMessage(from, { image: { url: wpData.url }, caption: `🎞️ GIF: ${query}${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ GIF search failed.${FOOTER}`);
    }
  },
});

// ── Image Filters ─────────────────────────────────────────────────────────────

registerCommand({
  name: "blur",
  aliases: ["blurimg", "blurimage"],
  category: "Tools",
  description: "Blur an image (reply to image with .blur)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.blur*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(
        imgMsg.url ? { message: { imageMessage: imgMsg } } : msg
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const level = Math.min(parseInt(args[0]) || 3, 20);
      const blurred = await sharp(buf).blur(level).jpeg().toBuffer();
      await sock.sendMessage(from, { image: blurred, caption: `🌀 Blurred (level ${level})${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Blur failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "grayscale",
  aliases: ["greyscale", "bwimage", "blackwhite"],
  category: "Tools",
  description: "Convert image to grayscale (reply to image with .grayscale)",
  handler: async ({ sock, from, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.grayscale*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(imgMsg.url ? { message: { imageMessage: imgMsg } } : msg);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const result = await sharp(buf).grayscale().jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `⬛ Grayscale Image${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Grayscale failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "invert",
  aliases: ["invertimg", "negative", "invertcolors"],
  category: "Tools",
  description: "Invert image colors (reply to image with .invert)",
  handler: async ({ sock, from, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.invert*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(imgMsg.url ? { message: { imageMessage: imgMsg } } : msg);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const result = await sharp(buf).negate().jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `🔄 Inverted Colors${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Invert failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "imgflip",
  aliases: ["flipimg", "flipimage", "flipphoto"],
  category: "Tools",
  description: "Flip image horizontally or vertically (.imgflip / .imgflip vertical)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.imgflip*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(imgMsg.url ? { message: { imageMessage: imgMsg } } : msg);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const isVertical = args[0]?.toLowerCase() === "vertical";
      const result = isVertical
        ? await sharp(buf).flip().jpeg().toBuffer()
        : await sharp(buf).flop().jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `🔄 Flipped ${isVertical ? "Vertically" : "Horizontally"}${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Flip failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "rotate",
  aliases: ["rotateimg", "rotatepic", "imgrotate"],
  category: "Tools",
  description: "Rotate image by degrees (.rotate 90 / .rotate 180)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.rotate <degrees>*${FOOTER}`);
    const deg = parseInt(args[0]) || 90;
    try {
      const stream = await (sock as any).downloadMediaMessage(imgMsg.url ? { message: { imageMessage: imgMsg } } : msg);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const result = await sharp(buf).rotate(deg).jpeg().toBuffer();
      await sock.sendMessage(from, { image: result, caption: `🔄 Rotated ${deg}°${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Rotate failed.${FOOTER}`);
    }
  },
});
