import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

async function urlToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Download image/sticker media using Baileys downloadMediaMessage
async function downloadImg(msg: any, imgMsg: any): Promise<Buffer> {
  const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
  const fakeMsg = (msg.message?.imageMessage)
    ? msg
    : { ...msg, message: { imageMessage: imgMsg } };
  return downloadMediaMessage(fakeMsg as any, "buffer", {}) as Promise<Buffer>;
}

async function downloadSticker(msg: any, stickerMsg: any): Promise<Buffer> {
  const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
  const fakeMsg = (msg.message?.stickerMessage)
    ? msg
    : { ...msg, message: { stickerMessage: stickerMsg } };
  return downloadMediaMessage(fakeMsg as any, "buffer", {}) as Promise<Buffer>;
}

// ── Steal/rebrand a sticker ───────────────────────────────────────────────────

registerCommand({
  name: "steal",
  aliases: ["ssave", "copysticker"],
  category: "Sticker",
  description: "Steal a sticker and rebrand it as MAXX-XMD (reply to sticker)",
  handler: async ({ sock, from, msg, reply }) => {
    const stickerMsg = msg.message?.stickerMessage
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
    if (!stickerMsg) return reply(`❌ Reply to a sticker with *.steal*${FOOTER}`);
    try {
      await reply("🔄 Stealing sticker...");
      const buf = await downloadSticker(msg, stickerMsg);
      await sock.sendMessage(from, { sticker: buf } as any, { quoted: msg });
      await reply(`✅ Sticker stolen & saved as *MAXX-XMD* pack!${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Could not steal sticker: ${e.message}${FOOTER}`);
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

// ── QR code sticker ───────────────────────────────────────────────────────────

registerCommand({
  name: "qrsticker",
  aliases: ["qrs"],
  category: "Sticker",
  description: "Create a QR code sticker for any text (.qrsticker https://yoursite.com)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .qrsticker <text/url>${FOOTER}`);
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=512x512&bgcolor=ffffff&color=000000&format=png`;
      const buf = await urlToBuffer(url);
      let stickerBuf = buf;
      try {
        const sharp = (await import("sharp")).default;
        stickerBuf = await sharp(buf).resize(512, 512).webp().toBuffer();
      } catch {}
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ QR sticker creation failed: ${e.message}${FOOTER}`);
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
    } catch (e: any) {
      await reply(`❌ Emoji sticker failed: ${e.message}. Try a standard emoji.${FOOTER}`);
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
      await reply("🔄 Creating circular sticker...");
      const buf = await downloadImg(msg, imgMsg);
      const sharp = (await import("sharp")).default;
      const circle = Buffer.from(`<svg><circle cx="256" cy="256" r="256"/></svg>`);
      const stickerBuf = await sharp(buf)
        .resize(512, 512, { fit: "cover" })
        .composite([{ input: circle, blend: "dest-in" }])
        .webp()
        .toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Circular sticker failed: ${e.message}${FOOTER}`);
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
      await reply("🔄 Creating B&W sticker...");
      const buf = await downloadImg(msg, imgMsg);
      const sharp = (await import("sharp")).default;
      const stickerBuf = await sharp(buf)
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .grayscale()
        .webp()
        .toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Grayscale sticker failed: ${e.message}${FOOTER}`);
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
      await reply("🔄 Flipping image...");
      const buf = await downloadImg(msg, imgMsg);
      const sharp = (await import("sharp")).default;
      const stickerBuf = await sharp(buf)
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .flop()
        .webp()
        .toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuf } as any, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Flip sticker failed: ${e.message}${FOOTER}`);
    }
  },
});
