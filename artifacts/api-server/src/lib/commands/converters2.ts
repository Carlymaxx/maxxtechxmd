import { registerCommand } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

async function ffmpegConvert(inputBuf: Buffer, inputExt: string, outputExt: string, extraArgs: string[] = []): Promise<Buffer> {
  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const execFileAsync = promisify(execFile);
  const tmpIn = path.join(os.tmpdir(), `maxx_conv_${Date.now()}.${inputExt}`);
  const tmpOut = path.join(os.tmpdir(), `maxx_conv_${Date.now()}.${outputExt}`);
  fs.writeFileSync(tmpIn, inputBuf);
  try {
    await execFileAsync("ffmpeg", ["-i", tmpIn, ...extraArgs, tmpOut, "-y"], { timeout: 60000 });
    const result = fs.readFileSync(tmpOut);
    return result;
  } finally {
    try { fs.unlinkSync(tmpIn); } catch {}
    try { fs.unlinkSync(tmpOut); } catch {}
  }
}

// ── tomp3 / toaudio ───────────────────────────────────────────────────────────
registerCommand({
  name: "tomp3",
  aliases: ["tom4a", "toaudio"],
  category: "Converter",
  description: "Convert video/voice to MP3 audio — reply to video or audio",
  usage: ".tomp3 (reply to video/audio)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const vidMsg = m?.videoMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    const audMsg = m?.audioMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;
    const target = vidMsg || audMsg;
    if (!target) return reply(`❌ Reply to a video or audio with *.tomp3*${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const isVid = !!vidMsg;
      const fakeMsg = isVid
        ? (m?.videoMessage ? msg : { ...msg, message: { videoMessage: vidMsg } } as any)
        : (m?.audioMessage ? msg : { ...msg, message: { audioMessage: audMsg } } as any);
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
      const inputExt = isVid ? "mp4" : "ogg";
      const outBuf = await ffmpegConvert(buf as Buffer, inputExt, "mp3", ["-q:a", "0"]);
      await sock.sendMessage(from, {
        audio: outBuf,
        mimetype: "audio/mp4",
        ptt: false,
      }, { quoted: msg });
      await reply(`✅ Converted to MP3!${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Conversion failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── toptt — convert to voice note ─────────────────────────────────────────────
registerCommand({
  name: "toptt",
  aliases: ["tovoice", "tovn"],
  category: "Converter",
  description: "Convert audio/video to voice note (PTT) — reply to media",
  usage: ".toptt (reply to audio/video)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const vidMsg = m?.videoMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    const audMsg = m?.audioMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;
    if (!vidMsg && !audMsg) return reply(`❌ Reply to audio or video with *.toptt*${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const isVid = !!vidMsg;
      const src = isVid
        ? (m?.videoMessage ? msg : { ...msg, message: { videoMessage: vidMsg } } as any)
        : (m?.audioMessage ? msg : { ...msg, message: { audioMessage: audMsg } } as any);
      const buf = await downloadMediaMessage(src, "buffer", {});
      const outBuf = await ffmpegConvert(buf as Buffer, isVid ? "mp4" : "ogg", "ogg", ["-c:a", "libopus", "-ar", "48000", "-ac", "1", "-b:a", "24k"]);
      await sock.sendMessage(from, { audio: outBuf, mimetype: "audio/ogg; codecs=opus", ptt: true }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── toimg — extract video frame as image ──────────────────────────────────────
registerCommand({
  name: "toimg",
  aliases: ["vid2img", "frame"],
  category: "Converter",
  description: "Extract a frame from a video as an image — reply to video",
  usage: ".toimg (reply to video)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const vidMsg = m?.videoMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    if (!vidMsg) return reply(`❌ Reply to a video with *.toimg*${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const fakeMsg = m?.videoMessage ? msg : { ...msg, message: { videoMessage: vidMsg } } as any;
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
      const outBuf = await ffmpegConvert(buf as Buffer, "mp4", "jpg", ["-vframes", "1", "-q:v", "2"]);
      await sock.sendMessage(from, { image: outBuf, caption: `📸 *Video Frame Extracted!*${FOOTER}` }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── togif — convert video to GIF ─────────────────────────────────────────────
registerCommand({
  name: "togif",
  aliases: ["vid2gif", "makegif"],
  category: "Converter",
  description: "Convert a short video to GIF — reply to video",
  usage: ".togif (reply to video)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const vidMsg = m?.videoMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    if (!vidMsg) return reply(`❌ Reply to a video with *.togif* (keep video short, under 15 seconds)${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const fakeMsg = m?.videoMessage ? msg : { ...msg, message: { videoMessage: vidMsg } } as any;
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
      const outBuf = await ffmpegConvert(buf as Buffer, "mp4", "gif", ["-vf", "fps=10,scale=320:-1:flags=lanczos", "-t", "10"]);
      await sock.sendMessage(from, { video: outBuf, gifPlayback: true, caption: `🎞️ *Converted to GIF!*${FOOTER}` }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ GIF conversion failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── toviewonce — convert any media to view-once ───────────────────────────────
registerCommand({
  name: "toviewonce",
  aliases: ["makeviewonce", "tovo", "mvo"],
  category: "Converter",
  description: "Convert any media to a view-once message — reply to image/video",
  usage: ".toviewonce (reply to image or video)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    const vidMsg = m?.videoMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    if (!imgMsg && !vidMsg) return reply(`❌ Reply to an image or video with *.toviewonce*${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      if (imgMsg) {
        const fakeMsg = m?.imageMessage ? msg : { ...msg, message: { imageMessage: imgMsg } } as any;
        const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
        await sock.sendMessage(from, { image: buf as Buffer, viewOnce: true, caption: "" } as any, { quoted: msg });
      } else {
        const fakeMsg = m?.videoMessage ? msg : { ...msg, message: { videoMessage: vidMsg } } as any;
        const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
        await sock.sendMessage(from, { video: buf as Buffer, viewOnce: true, caption: "" } as any, { quoted: msg });
      }
      await reply(`✅ Sent as view-once!${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── toptv — send video as document (prevents compression) ────────────────────
registerCommand({
  name: "toptv",
  aliases: ["tovid", "tomp4"],
  category: "Converter",
  description: "Send video as a document (prevents WhatsApp compression) — reply to video",
  usage: ".toptv (reply to video)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const vidMsg = m?.videoMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
    if (!vidMsg) return reply(`❌ Reply to a video with *.toptv*${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const fakeMsg = m?.videoMessage ? msg : { ...msg, message: { videoMessage: vidMsg } } as any;
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
      await sock.sendMessage(from, {
        document: buf as Buffer,
        mimetype: "video/mp4",
        fileName: `MAXX-XMD_video_${Date.now()}.mp4`,
        caption: `📺 *Sent as document (no compression)*${FOOTER}`,
      }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── toaudiodoc — send audio as document ──────────────────────────────────────
registerCommand({
  name: "toaudiodoc",
  aliases: ["audiodoc"],
  category: "Converter",
  description: "Send audio as a document — reply to audio",
  usage: ".toaudiodoc (reply to audio)",
  handler: async ({ sock, from, msg, reply }) => {
    const m = msg.message as any;
    const audMsg = m?.audioMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;
    if (!audMsg) return reply(`❌ Reply to an audio message with *.toaudiodoc*${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const fakeMsg = m?.audioMessage ? msg : { ...msg, message: { audioMessage: audMsg } } as any;
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
      const mime = audMsg.mimetype || "audio/ogg";
      const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "mp3";
      await sock.sendMessage(from, {
        document: buf as Buffer,
        mimetype: mime,
        fileName: `MAXX-XMD_audio_${Date.now()}.${ext}`,
      }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── imgsize — get image dimensions ────────────────────────────────────────────
registerCommand({
  name: "imgsize",
  aliases: ["imagesize", "imgdimension"],
  category: "Converter",
  description: "Get the dimensions of an image — reply to an image",
  usage: ".imgsize (reply to image)",
  handler: async ({ msg, reply }) => {
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.imgsize*${FOOTER}`);
    const w = imgMsg.width || "unknown";
    const h = imgMsg.height || "unknown";
    const size = imgMsg.fileLength ? `${(parseInt(imgMsg.fileLength) / 1024).toFixed(1)}KB` : "unknown";
    await reply(`📐 *Image Info*\n\n📏 Width: *${w}px*\n📐 Height: *${h}px*\n💾 Size: *${size}*\n🖼️ Type: ${imgMsg.mimetype || "image"}${FOOTER}`);
  },
});

// ── watermark — add text watermark to image ───────────────────────────────────
registerCommand({
  name: "watermark",
  aliases: ["addwatermark", "brand"],
  category: "Converter",
  description: "Add a text watermark to an image — reply to image",
  usage: ".watermark [text] (reply to image)",
  handler: async ({ args, sock, from, msg, reply, settings }) => {
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.watermark [text]*${FOOTER}`);
    const text = args.join(" ") || settings.botName || "MAXX-XMD";
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const fakeMsg = m?.imageMessage ? msg : { ...msg, message: { imageMessage: imgMsg } } as any;
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
      const { execFile } = await import("child_process");
      const { promisify } = await import("util");
      const execFileAsync = promisify(execFile);
      const tmpIn = path.join(os.tmpdir(), `maxx_wm_${Date.now()}.jpg`);
      const tmpOut = path.join(os.tmpdir(), `maxx_wm_out_${Date.now()}.jpg`);
      fs.writeFileSync(tmpIn, buf as Buffer);
      await execFileAsync("ffmpeg", [
        "-i", tmpIn,
        "-vf", `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=40:fontcolor=white@0.8:x=(w-text_w)/2:y=h-th-20:shadowcolor=black:shadowx=2:shadowy=2`,
        tmpOut, "-y"
      ], { timeout: 30000 });
      const outBuf = fs.readFileSync(tmpOut);
      fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut);
      await sock.sendMessage(from, { image: outBuf, caption: `💧 *Watermark added: "${text}"*${FOOTER}` }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Watermark failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── resize — resize image ─────────────────────────────────────────────────────
registerCommand({
  name: "resize",
  aliases: ["resizeimage", "scale"],
  category: "Converter",
  description: "Resize an image — reply to image",
  usage: ".resize <width>x<height> (reply to image)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const m = msg.message as any;
    const imgMsg = m?.imageMessage || m?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imgMsg) return reply(`❌ Reply to an image with *.resize 800x600*${FOOTER}`);
    const dim = args[0] || "800x600";
    const [w, h] = dim.toLowerCase().split("x").map(Number);
    if (!w || !h) return reply(`❓ Usage: .resize 800x600 (reply to image)${FOOTER}`);
    try {
      const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
      const fakeMsg = m?.imageMessage ? msg : { ...msg, message: { imageMessage: imgMsg } } as any;
      const buf = await downloadMediaMessage(fakeMsg, "buffer", {});
      const outBuf = await ffmpegConvert(buf as Buffer, "jpg", "jpg", ["-vf", `scale=${w}:${h}`]);
      await sock.sendMessage(from, { image: outBuf, caption: `📐 *Resized to ${w}×${h}*${FOOTER}` }, { quoted: msg });
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── Audio Effects helper ──────────────────────────────────────────────────────
async function applyAudioEffect(
  msg: any, sock: any, from: string,
  ffArgs: string[], label: string, emoji: string, reply: (t: string) => Promise<any>
) {
  const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
  const m = msg.message as any;
  const quoted = m?.extendedTextMessage?.contextInfo?.quotedMessage;
  const audMsg = m?.audioMessage || quoted?.audioMessage || m?.videoMessage || quoted?.videoMessage;
  if (!audMsg) return reply(`❌ Reply to an audio or voice note with *${label}*${FOOTER}`);
  try {
    const isVid = !!(m?.videoMessage || quoted?.videoMessage);
    const fakeMsg = (m?.audioMessage || m?.videoMessage) ? msg
      : { ...msg, message: isVid ? { videoMessage: quoted?.videoMessage } : { audioMessage: quoted?.audioMessage } } as any;
    const buf = await downloadMediaMessage(fakeMsg, "buffer", {}) as Buffer;
    const inExt = isVid ? "mp4" : "ogg";
    const outBuf = await ffmpegConvert(buf, inExt, "mp3", ["-vn", ...ffArgs]);
    await sock.sendMessage(from, {
      audio: outBuf, mimetype: "audio/mpeg",
      fileName: `${label.toLowerCase().replace(/ /g, "_")}.mp3`,
    } as any, { quoted: msg });
  } catch (e: any) {
    await reply(`❌ Failed: ${e.message}${FOOTER}`);
  }
}

// ── Bass Boost ────────────────────────────────────────────────────────────────
registerCommand({
  name: "bass",
  aliases: ["bassboost", "bassboosted"],
  category: "Converter",
  description: "Apply bass boost effect to audio — reply to audio/voice",
  handler: async ({ msg, sock, from, reply }) => {
    await applyAudioEffect(msg, sock, from,
      ["-af", "equalizer=f=80:width_type=o:width=2:g=12,equalizer=f=40:width_type=o:width=2:g=8"],
      "Bass Boost", "🔊", reply);
  },
});

// ── Blown Speaker ─────────────────────────────────────────────────────────────
registerCommand({
  name: "blown",
  aliases: ["blownup", "blownspeaker", "distort"],
  category: "Converter",
  description: "Blown/distorted speaker effect on audio — reply to audio/voice",
  handler: async ({ msg, sock, from, reply }) => {
    await applyAudioEffect(msg, sock, from,
      ["-af", "acrusher=level_in=8:level_out=1:bits=4:mode=log:aa=1,volume=6dB"],
      "Blown Speaker", "💥", reply);
  },
});

// ── Deep / Pitch Down ─────────────────────────────────────────────────────────
registerCommand({
  name: "deep",
  aliases: ["deeper", "pitchdown", "slowdeep"],
  category: "Converter",
  description: "Deep pitched-down audio effect — reply to audio/voice",
  handler: async ({ msg, sock, from, reply }) => {
    await applyAudioEffect(msg, sock, from,
      ["-af", "asetrate=44100*0.75,aresample=44100,atempo=1.333"],
      "Deep Voice", "🔉", reply);
  },
});

// ── Nightcore / Pitch Up ──────────────────────────────────────────────────────
registerCommand({
  name: "nightcore",
  aliases: ["pitchup", "nightcored", "chipmunk"],
  category: "Converter",
  description: "Nightcore (pitched-up) audio effect — reply to audio/voice",
  handler: async ({ msg, sock, from, reply }) => {
    await applyAudioEffect(msg, sock, from,
      ["-af", "asetrate=44100*1.25,aresample=44100,atempo=0.8"],
      "Nightcore", "🌙", reply);
  },
});

// ── Reverb / Echo ─────────────────────────────────────────────────────────────
registerCommand({
  name: "reverb",
  aliases: ["echo", "reverbecho"],
  category: "Converter",
  description: "Reverb/echo effect on audio — reply to audio/voice",
  handler: async ({ msg, sock, from, reply }) => {
    await applyAudioEffect(msg, sock, from,
      ["-af", "aecho=0.8:0.88:60:0.4"],
      "Reverb", "🏔️", reply);
  },
});

// ── Slow Down ─────────────────────────────────────────────────────────────────
registerCommand({
  name: "slowmo",
  aliases: ["slow", "slowaudio"],
  category: "Converter",
  description: "Slow down audio to 75% speed — reply to audio/voice",
  handler: async ({ msg, sock, from, reply }) => {
    await applyAudioEffect(msg, sock, from,
      ["-af", "atempo=0.75"],
      "Slow Motion", "🐢", reply);
  },
});

// ── Speed Up ──────────────────────────────────────────────────────────────────
registerCommand({
  name: "fast",
  aliases: ["speed", "fastaudio", "speedup"],
  category: "Converter",
  description: "Speed up audio to 1.5× speed — reply to audio/voice",
  handler: async ({ msg, sock, from, reply }) => {
    await applyAudioEffect(msg, sock, from,
      ["-af", "atempo=1.5"],
      "Speed Up", "⚡", reply);
  },
});
