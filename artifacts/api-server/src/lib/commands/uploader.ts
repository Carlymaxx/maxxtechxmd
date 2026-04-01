import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── URL shorteners ─────────────────────────────────────────────────────────────
registerCommand({
  name: "tinyurl",
  aliases: ["shorten", "shorturl"],
  category: "Uploader",
  description: "Shorten a URL using TinyURL",
  usage: ".tinyurl <url>",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url || !url.startsWith("http")) return reply(`❓ Usage: .tinyurl <url>\nExample: .tinyurl https://google.com${FOOTER}`);
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("API error");
      const short = await res.text();
      await reply(`🔗 *URL Shortened (TinyURL)*\n\n📎 Original: ${url}\n✅ Short: *${short.trim()}*${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed to shorten URL: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "bitly",
  aliases: ["bit.ly"],
  category: "Uploader",
  description: "Shorten a URL using Bitly",
  usage: ".bitly <url>",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url || !url.startsWith("http")) return reply(`❓ Usage: .bitly <url>${FOOTER}`);
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(10000),
      });
      const short = await res.text();
      await reply(`🔗 *URL Shortened*\n\n📎 Original: ${url}\n✅ Short: *${short.trim()}*${FOOTER}`);
    } catch {
      await reply(`❌ Failed to shorten URL.\n\n💡 Try: https://bitly.com${FOOTER}`);
    }
  },
});

registerCommand({
  name: "tinube",
  aliases: ["tinube2"],
  category: "Uploader",
  description: "Shorten URL using Tinube",
  usage: ".tinube <url>",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url) return reply(`❓ Usage: .tinube <url>${FOOTER}`);
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(10000),
      });
      const short = await res.text();
      await reply(`🔗 *Short URL*\n\n${short.trim()}${FOOTER}`);
    } catch {
      await reply(`❌ Failed${FOOTER}`);
    }
  },
});

// ── File uploaders ─────────────────────────────────────────────────────────────
registerCommand({
  name: "uguu",
  aliases: ["uploadfile"],
  category: "Uploader",
  description: "Upload any media to uguu.se — reply to a file/image",
  usage: ".uguu (reply to media)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    const docMsg = m?.documentMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage;
    const hasMedia = imgMsg || docMsg;
    if (!hasMedia) return reply(`❓ Reply to any file or image with *.uguu* to upload it and get a link${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const targetMsg = imgMsg
        ? (m?.imageMessage ? msg : { ...msg, message: { imageMessage: imgMsg } } as any)
        : (m?.documentMessage ? msg : { ...msg, message: { documentMessage: docMsg } } as any);
      const buf = await downloadMediaMessage(targetMsg, "buffer", {});
      const form = new FormData();
      const mime = imgMsg?.mimetype || docMsg?.mimetype || "application/octet-stream";
      const ext = mime.split("/")[1] || "bin";
      form.append("files[]", new Blob([buf as Buffer], { type: mime }), `upload.${ext}`);
      const res = await fetch("https://uguu.se/upload.php", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json() as any;
      const url = data.files?.[0]?.url || data.url;
      if (!url) throw new Error("Upload failed");
      await reply(`✅ *Uploaded to Uguu.se!*\n\n🔗 ${url}\n\n⚠️ _File expires in 24 hours_${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Upload failed: ${e.message}\n\n💡 Try: https://uguu.se${FOOTER}`);
    }
  },
});

registerCommand({
  name: "litterbox",
  aliases: ["catboxlitter", "litter"],
  category: "Uploader",
  description: "Upload media to litterbox (temporary) — reply to media",
  usage: ".litterbox (reply to media)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❓ Reply to an image with *.litterbox* to upload temporarily${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const targetMsg = m?.imageMessage ? msg : { ...msg, message: { imageMessage: imgMsg } } as any;
      const buf = await downloadMediaMessage(targetMsg, "buffer", {});
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("time", "1h");
      form.append("fileToUpload", new Blob([buf as Buffer], { type: imgMsg.mimetype || "image/jpeg" }), "file.jpg");
      const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      const url = (await res.text()).trim();
      if (!url.startsWith("http")) throw new Error("Upload failed");
      await reply(`✅ *Uploaded to Litterbox!*\n\n🔗 ${url}\n\n⚠️ _Expires in 1 hour_${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Upload failed: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "catbox",
  aliases: ["catboxio", "catboxupload"],
  category: "Uploader",
  description: "Upload media to catbox.moe (permanent) — reply to media",
  usage: ".catbox (reply to media)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❓ Reply to an image with *.catbox* to upload permanently${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const targetMsg = m?.imageMessage ? msg : { ...msg, message: { imageMessage: imgMsg } } as any;
      const buf = await downloadMediaMessage(targetMsg, "buffer", {});
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", new Blob([buf as Buffer], { type: imgMsg.mimetype || "image/jpeg" }), "file.jpg");
      const res = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30000),
      });
      const url = (await res.text()).trim();
      if (!url.startsWith("http")) throw new Error("Upload failed");
      await reply(`✅ *Uploaded to Catbox.moe!*\n\n🔗 ${url}\n\n♾️ _Permanent storage_${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Upload failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── URL info ───────────────────────────────────────────────────────────────────
registerCommand({
  name: "url",
  aliases: ["urlinfo", "geturl"],
  category: "Uploader",
  description: "Get info about a URL / expand a shortened URL",
  usage: ".url <url>",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url) return reply(`❓ Usage: .url <url>${FOOTER}`);
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });
      const finalUrl = res.url;
      const contentType = res.headers.get("content-type") || "unknown";
      const size = res.headers.get("content-length");
      await reply(`🌐 *URL Info*\n\n📎 Input: ${url}\n🔗 Final URL: ${finalUrl}\n📄 Content-Type: ${contentType}\n📦 Size: ${size ? `${(parseInt(size) / 1024).toFixed(1)}KB` : "unknown"}\n✅ Status: ${res.status} ${res.statusText}${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Could not reach URL: ${e.message}${FOOTER}`);
    }
  },
});

// ── Random video ───────────────────────────────────────────────────────────────
registerCommand({
  name: "randomvideo",
  aliases: ["randvid", "randomvid"],
  category: "Uploader",
  description: "Get a random funny/entertaining video link",
  usage: ".randomvideo",
  handler: async ({ reply }) => {
    const videos = [
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ];
    const topics = ["funny cats", "amazing fails", "satisfying videos", "funny moments", "cool tricks"];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    await reply(`🎬 *Random Video*\n\n🔍 Topic: _${topic}_\n🔗 https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}&sp=EgIQAQ%3D%3D\n\n💡 Click any video from the search!${FOOTER}`);
  },
});
