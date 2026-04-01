import { registerCommand } from "./types";
import fs from "fs";
import path from "path";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

async function urlToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

function getQuotedMedia(msg: any): { type: string; url?: string; buffer?: any } | null {
  const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!q) return null;
  if (q.imageMessage) return { type: "image", url: q.imageMessage.url };
  if (q.stickerMessage) return { type: "sticker", url: q.stickerMessage.url };
  if (q.videoMessage) return { type: "video", url: q.videoMessage.url };
  return null;
}

// ── Sticker from image/video ─────────────────────────────────────────────────

registerCommand({
  name: "sticker",
  aliases: ["s", "make", "stiker"],
  category: "Sticker",
  description: "Convert image/GIF to WhatsApp sticker (send with caption or reply to image)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const packname = args[0] || "MAXX-XMD";
    const author  = args[1] || "⚡ Bot";

    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!imgMsg) return reply(`❌ Send or reply to an image with *.sticker*\n\nUsage: .sticker [packname] [author]\nExample: .sticker "MyPack" "Me"${FOOTER}`);

    try {
      await reply("🔄 Converting to sticker...");
      const stream = await (sock as any).downloadMediaMessage(
        imgMsg.url ? { message: { imageMessage: imgMsg } } : msg
      );
      let buf: Buffer;
      if (Buffer.isBuffer(stream)) { buf = stream; }
      else {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(chunk);
        buf = Buffer.concat(chunks);
      }
      let stickerBuf = buf;
      try {
        const sharp = (await import("sharp")).default;
        stickerBuf = await sharp(buf).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
      } catch { /* use raw if sharp fails */ }

      await sock.sendMessage(from, {
        sticker: stickerBuf,
        ...(packname ? {} : {}),
      } as any, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Sticker creation failed: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "toimg",
  aliases: ["stickertoimage", "sticker2img"],
  category: "Sticker",
  description: "Convert a sticker back to an image (reply to sticker)",
  handler: async ({ sock, from, msg, reply }) => {
    const stickerMsg = msg.message?.stickerMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
    if (!stickerMsg) return reply(`❌ Reply to a sticker with *.toimg*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(
        stickerMsg.url ? { message: { stickerMessage: stickerMsg } } : msg
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      await sock.sendMessage(from, { image: buf, caption: `🖼️ Sticker converted to image!${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Could not convert sticker.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "steal",
  aliases: ["ssave", "copysticker"],
  category: "Sticker",
  description: "Steal a sticker and rebrand it with your bot's name (reply to sticker)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const stickerMsg = msg.message?.stickerMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
    if (!stickerMsg) return reply(`❌ Reply to a sticker with *.steal*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(
        stickerMsg.url ? { message: { stickerMessage: stickerMsg } } : msg
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      await sock.sendMessage(from, {
        sticker: buf,
      } as any, { quoted: msg });
      await reply(`✅ Sticker stolen & saved as *MAXX-XMD* pack!${FOOTER}`);
    } catch {
      await reply(`❌ Could not steal sticker.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "stickerinfo",
  aliases: ["packinfo", "sinfo"],
  category: "Sticker",
  description: "Get info about a sticker's pack (reply to sticker)",
  handler: async ({ msg, reply }) => {
    const stickerMsg = msg.message?.stickerMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
    if (!stickerMsg) return reply(`❌ Reply to a sticker with *.stickerinfo*${FOOTER}`);
    const info = stickerMsg as any;
    await reply(
      `📦 *Sticker Info*\n\n` +
      `🏷️ *Pack:* ${info.packname || "Unknown"}\n` +
      `👤 *Author:* ${info.author || "Unknown"}\n` +
      `🆔 *Pack ID:* ${info.packId || "N/A"}\n` +
      `📏 *Type:* ${info.isAnimated ? "Animated GIF" : "Static"}\n` +
      `🎨 *Has audio:* ${info.isAvatar ? "Yes" : "No"}${FOOTER}`
    );
  },
});

// ── QR code sticker ──────────────────────────────────────────────────────────

registerCommand({
  name: "qrsticker",
  aliases: ["qrs"],
  category: "Sticker",
  description: "Create a QR code sticker for any text (.qrsticker https://yoursite.com)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .qrsticker <text/url>`);
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=512x512&bgcolor=ffffff&color=000000&format=png`;
      const buf = await urlToBuffer(url);
      let stickerBuf = buf;
      try {
        const sharp = (await import("sharp")).default;
        stickerBuf = await sharp(buf).resize(512, 512).webp().toBuffer();
      } catch {}
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch {
      await reply(`❌ QR sticker creation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "emojisticker",
  aliases: ["esticker", "emsticker"],
  category: "Sticker",
  description: "Get a large emoji sticker (.emojisticker 😂)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const emoji = args[0];
    if (!emoji) return reply(`❓ Usage: .emojisticker <emoji>\nExample: .emojisticker 😂`);
    try {
      const codepoint = [...emoji].map(c => c.codePointAt(0)!.toString(16)).join("-");
      const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codepoint}.png`;
      const buf = await urlToBuffer(url);
      let stickerBuf = buf;
      try {
        const sharp = (await import("sharp")).default;
        stickerBuf = await sharp(buf).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp().toBuffer();
      } catch {}
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch {
      await reply(`❌ Emoji sticker failed. Try a standard emoji.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "circleimg",
  aliases: ["circle", "roundimg"],
  category: "Sticker",
  description: "Make a circular crop sticker from an image (reply to image)",
  handler: async ({ sock, from, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.circleimg*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(
        imgMsg.url ? { message: { imageMessage: imgMsg } } : msg
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const circle = Buffer.from(
        `<svg><circle cx="256" cy="256" r="256"/></svg>`
      );
      const stickerBuf = await sharp(buf)
        .resize(512, 512, { fit: "cover" })
        .composite([{ input: circle, blend: "dest-in" }])
        .webp()
        .toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch {
      await reply(`❌ Circular sticker failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "bwsticker",
  aliases: ["graysticker", "greyscalesticker"],
  category: "Sticker",
  description: "Make a grayscale sticker from an image (reply to image)",
  handler: async ({ sock, from, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.bwsticker*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(
        imgMsg.url ? { message: { imageMessage: imgMsg } } : msg
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const stickerBuf = await sharp(buf).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).grayscale().webp().toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch {
      await reply(`❌ Grayscale sticker failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "flipsticker",
  aliases: ["fliplr", "mirrorsticker"],
  category: "Sticker",
  description: "Flip/mirror an image horizontally as sticker (reply to image)",
  handler: async ({ sock, from, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.flipsticker*${FOOTER}`);
    try {
      const stream = await (sock as any).downloadMediaMessage(
        imgMsg.url ? { message: { imageMessage: imgMsg } } : msg
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const sharp = (await import("sharp")).default;
      const stickerBuf = await sharp(buf).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).flop().webp().toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch {
      await reply(`❌ Flip sticker failed.${FOOTER}`);
    }
  },
});
