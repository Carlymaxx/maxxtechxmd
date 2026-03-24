import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

registerCommand({
  name: "remind",
  aliases: ["reminder", "remindme"],
  category: "Tools",
  description: "Set a timed reminder (e.g. .remind 5m take medicine)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const timeStr = args[0];
    const message = args.slice(1).join(" ");
    if (!timeStr || !message) return reply(`❓ Usage: .remind <time> <message>\nExamples:\n  .remind 5m take medicine\n  .remind 2h drink water\n  .remind 30s check oven\n\n_Supported: s=seconds, m=minutes, h=hours_`);
    const match = timeStr.match(/^(\d+)(s|m|h)$/i);
    if (!match) return reply("❌ Invalid time format.\nUse: 30s, 5m, 2h");
    const [, num, unit] = match;
    const ms = parseInt(num) * (unit.toLowerCase() === "s" ? 1000 : unit.toLowerCase() === "m" ? 60000 : 3600000);
    if (ms > 24 * 3600 * 1000) return reply("❌ Maximum reminder time is 24 hours.");
    await reply(`⏰ *Reminder Set!*\n\n📝 _${message}_\n🕒 In: *${timeStr}*${FOOTER}`);
    setTimeout(async () => {
      await sock.sendMessage(from, { text: `⏰ *REMINDER*\n\n📝 ${message}${FOOTER}` }, { quoted: msg });
    }, ms);
  },
});

registerCommand({
  name: "flip",
  aliases: ["coinflip", "toss"],
  category: "Tools",
  description: "Flip a coin (heads or tails)",
  handler: async ({ reply }) => {
    const result = Math.random() < 0.5 ? "🪙 *HEADS*" : "🪙 *TAILS*";
    await reply(`╔══════════════╗\n║ 🪙 COIN FLIP\n╚══════════════╝\n\n${result}${FOOTER}`);
  },
});

registerCommand({
  name: "roll",
  aliases: ["dice", "diceroll"],
  category: "Tools",
  description: "Roll a dice (default d6, or specify e.g. .roll d20)",
  handler: async ({ args, reply }) => {
    const input = args[0] || "d6";
    const match = input.match(/^d?(\d+)$/i);
    if (!match) return reply("❓ Usage: .roll d6  or  .roll d20  or  .roll 100");
    const sides = Math.min(parseInt(match[1]), 1000);
    if (sides < 2) return reply("❌ Dice must have at least 2 sides.");
    const result = Math.floor(Math.random() * sides) + 1;
    const emoji = sides === 6 ? ["⚀","⚁","⚂","⚃","⚄","⚅"][result - 1] : "🎲";
    await reply(`╔══════════════╗\n║ 🎲 DICE ROLL\n╚══════════════╝\n\n${emoji} *d${sides}* → *${result}*${FOOTER}`);
  },
});

registerCommand({
  name: "reverse",
  aliases: ["rev", "mirror"],
  category: "Tools",
  description: "Reverse the text you send",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .reverse <text>\nExample: .reverse Hello World");
    const reversed = text.split("").reverse().join("");
    await reply(`🔄 *Reversed Text*\n\n*Input:* ${text}\n*Output:* ${reversed}${FOOTER}`);
  },
});

registerCommand({
  name: "base64",
  aliases: ["b64"],
  category: "Tools",
  description: "Encode or decode Base64 (.base64 encode/decode <text>)",
  handler: async ({ args, reply }) => {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!mode || !text || !["encode", "decode", "enc", "dec", "e", "d"].includes(mode)) {
      return reply("❓ Usage:\n  .base64 encode <text>\n  .base64 decode <encoded>\nExample: .base64 encode Hello World");
    }
    try {
      const isEncode = ["encode", "enc", "e"].includes(mode);
      const result = isEncode
        ? Buffer.from(text, "utf8").toString("base64")
        : Buffer.from(text, "base64").toString("utf8");
      await reply(`🔐 *Base64 ${isEncode ? "Encode" : "Decode"}*\n\n*Input:* ${text}\n*Result:* ${result}${FOOTER}`);
    } catch {
      await reply("❌ Invalid Base64 input.");
    }
  },
});

registerCommand({
  name: "calc",
  aliases: ["math", "calculate", "eval"],
  category: "Tools",
  description: "Calculate a math expression (.calc 2+2*3)",
  handler: async ({ args, reply }) => {
    const expr = args.join(" ").replace(/[^0-9+\-*/().\s%^]/g, "");
    if (!expr) return reply("❓ Usage: .calc <expression>\nExamples:\n  .calc 2+2\n  .calc 100*1.16\n  .calc (5+3)*2");
    try {
      const safeExpr = expr.replace(/\^/g, "**");
      const result = Function(`"use strict"; return (${safeExpr})`)();
      if (typeof result !== "number" || !isFinite(result)) throw new Error();
      await reply(`🧮 *Calculator*\n\n📝 *Expression:* ${expr}\n✅ *Result:* ${result}${FOOTER}`);
    } catch {
      await reply("❌ Invalid expression. Example: .calc 2+2*3");
    }
  },
});

registerCommand({
  name: "password",
  aliases: ["genpass", "passgen"],
  category: "Tools",
  description: "Generate a secure random password (.password 16)",
  handler: async ({ args, reply }) => {
    const len = Math.min(Math.max(parseInt(args[0] || "12"), 6), 64);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}";
    let pass = "";
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    await reply(`🔐 *Password Generator*\n\n🔑 \`${pass}\`\n📏 Length: *${len}*\n\n⚠️ _Save it somewhere safe!_${FOOTER}`);
  },
});

registerCommand({
  name: "forward",
  aliases: ["fwd"],
  category: "Tools",
  description: "Forward a replied message to a number",
  handler: async ({ sock, from, msg, args, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const qMsg = ctx?.quotedMessage;
    if (!qMsg) return reply("❌ Reply to a message to forward it.\nUsage: .forward <number>");
    const target = args[0]?.replace(/\D/g, "");
    if (!target) return reply("❓ Usage: .forward <number>\nExample: .forward 2547XXXXXXXX");
    const jid = target + "@s.whatsapp.net";
    try {
      await sock.sendMessage(jid, {
        forward: { key: { remoteJid: from, id: ctx.stanzaId!, fromMe: false }, message: qMsg },
      });
      await reply(`✅ Message forwarded to *+${target}*${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "typing",
  aliases: ["type"],
  category: "Tools",
  description: "Simulate the bot typing for N seconds (.typing 5)",
  handler: async ({ sock, from, args, reply }) => {
    const secs = Math.min(Math.max(parseInt(args[0] || "3"), 1), 15);
    await sock.sendPresenceUpdate("composing", from);
    await new Promise(r => setTimeout(r, secs * 1000));
    await sock.sendPresenceUpdate("paused", from);
    await reply(`✅ Typing simulated for *${secs}s*${FOOTER}`);
  },
});

registerCommand({
  name: "recording",
  aliases: ["rec"],
  category: "Tools",
  description: "Simulate the bot recording audio for N seconds (.recording 5)",
  handler: async ({ sock, from, args, reply }) => {
    const secs = Math.min(Math.max(parseInt(args[0] || "3"), 1), 15);
    await sock.sendPresenceUpdate("recording", from);
    await new Promise(r => setTimeout(r, secs * 1000));
    await sock.sendPresenceUpdate("paused", from);
    await reply(`✅ Recording simulated for *${secs}s*${FOOTER}`);
  },
});

registerCommand({
  name: "shorten",
  aliases: ["short", "tinyurl"],
  category: "Tools",
  description: "Shorten a URL",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url || !url.startsWith("http")) return reply("❓ Usage: .shorten <url>\nExample: .shorten https://github.com/Carlymaxx/maxxtechxmd");
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      const short = await res.text();
      if (!short.startsWith("http")) throw new Error("Invalid response");
      await reply(`🔗 *URL Shortener*\n\n📎 *Original:* ${url.slice(0, 60)}${url.length > 60 ? "..." : ""}\n✂️ *Short:* ${short}${FOOTER}`);
    } catch {
      await reply("❌ Could not shorten URL. Try again later.");
    }
  },
});

registerCommand({
  name: "encode",
  aliases: ["urlencode"],
  category: "Tools",
  description: "URL-encode or decode text",
  handler: async ({ args, reply }) => {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!mode || !text) return reply("❓ Usage: .encode encode <text>\n       .encode decode <url-encoded>");
    const isEncode = ["encode", "enc", "e"].includes(mode);
    const result = isEncode ? encodeURIComponent(text) : decodeURIComponent(text);
    await reply(`🔗 *URL ${isEncode ? "Encode" : "Decode"}*\n\n*Input:* ${text}\n*Result:* ${result}${FOOTER}`);
  },
});

registerCommand({
  name: "hash",
  aliases: ["md5", "sha256"],
  category: "Tools",
  description: "Hash text with MD5 or SHA-256 (.hash sha256 <text>)",
  handler: async ({ args, reply }) => {
    const algo = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!algo || !text) return reply("❓ Usage: .hash <algo> <text>\nAlgos: md5, sha1, sha256, sha512\nExample: .hash sha256 Hello");
    const allowed = ["md5", "sha1", "sha256", "sha512"];
    if (!allowed.includes(algo)) return reply(`❌ Unsupported algorithm.\nAllowed: ${allowed.join(", ")}`);
    const { createHash } = await import("crypto");
    const hash = createHash(algo).update(text).digest("hex");
    await reply(`#️⃣ *Hash (${algo.toUpperCase()})*\n\n*Input:* ${text}\n*Hash:* \`${hash}\`${FOOTER}`);
  },
});

registerCommand({
  name: "randomnum",
  aliases: ["rand", "random"],
  category: "Tools",
  description: "Generate random number between two values (.random 1 100)",
  handler: async ({ args, reply }) => {
    const min = parseInt(args[0] || "1");
    const max = parseInt(args[1] || "100");
    if (isNaN(min) || isNaN(max) || min >= max) return reply("❓ Usage: .random <min> <max>\nExample: .random 1 100");
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    await reply(`🎰 *Random Number*\n\n📊 Range: ${min} - ${max}\n🎯 Result: *${result}*${FOOTER}`);
  },
});

registerCommand({
  name: "whoami",
  aliases: ["myinfo", "me"],
  category: "Tools",
  description: "Show your WhatsApp info (number, name, JID)",
  handler: async ({ sock, msg, from, reply }) => {
    const sender = msg.key.participant || from;
    const number = sender.split("@")[0];
    const name = (msg as any).pushName || "Unknown";
    let ppUrl = "";
    try { ppUrl = await sock.profilePictureUrl(sender, "image"); } catch {}
    const text = `╔═══════════════════╗\n║ 👤 *YOUR INFO* 👤\n╚═══════════════════╝\n\n📛 *Name:* ${name}\n📞 *Number:* +${number}\n🆔 *JID:* ${sender}\n🖼️ *Profile Pic:* ${ppUrl ? "✅ Public" : "🔒 Private"}${FOOTER}`;
    await reply(text);
  },
});

registerCommand({
  name: "totext",
  aliases: ["caps", "upper", "lower"],
  category: "Tools",
  description: "Convert text case (.totext upper/lower/title <text>)",
  handler: async ({ args, reply }) => {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!mode || !text) return reply("❓ Usage: .totext <upper|lower|title> <text>\nExamples:\n  .totext upper hello world\n  .totext title hello world");
    let result = text;
    if (["upper", "u", "caps"].includes(mode)) result = text.toUpperCase();
    else if (["lower", "l"].includes(mode)) result = text.toLowerCase();
    else if (["title", "t"].includes(mode)) result = text.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    else return reply("❌ Mode must be: upper, lower, or title");
    await reply(`🔤 *Text Case*\n\n*Mode:* ${mode}\n*Input:* ${text}\n*Output:* ${result}${FOOTER}`);
  },
});

registerCommand({
  name: "count",
  aliases: ["charcount", "wordcount"],
  category: "Tools",
  description: "Count characters and words in a text",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .count <text>");
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const lines = text.split("\n").length;
    await reply(`📊 *Text Statistics*\n\n📝 *Text:* ${text.slice(0, 50)}${text.length > 50 ? "..." : ""}\n\n📏 *Characters:* ${chars}\n📝 *Chars (no space):* ${charsNoSpace}\n🔤 *Words:* ${words}\n📄 *Lines:* ${lines}${FOOTER}`);
  },
});

registerCommand({
  name: "color",
  aliases: ["hex", "rgb", "colorinfo"],
  category: "Tools",
  description: "Get color info (HEX → RGB → name)",
  handler: async ({ sock, from, msg, args, reply }) => {
    let hex = args[0]?.replace(/^#/, "").toUpperCase();
    if (!hex || !/^[0-9A-F]{6}$/i.test(hex)) return reply("❓ Usage: .color <HEX>\nExample: .color #FF5733  or  .color FF5733");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const hsl = rgbToHsl(r, g, b);
    const imgUrl = `https://singlecolorimage.com/get/${hex}/200x200`;
    const text = `🎨 *Color Info*\n\n🖌️ *HEX:* #${hex}\n🔴 *RGB:* rgb(${r}, ${g}, ${b})\n🌈 *HSL:* hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)\n💡 *Brightness:* ${brightness > 128 ? "Light" : "Dark"}${FOOTER}`;
    try {
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: text }, { quoted: msg });
    } catch {
      await reply(text);
    }
  },
});

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

registerCommand({
  name: "binary",
  aliases: ["bin", "bin2text", "text2bin"],
  category: "Tools",
  description: "Convert text to binary or binary to text",
  handler: async ({ args, reply }) => {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!mode || !text) return reply("❓ Usage:\n  .binary encode <text>\n  .binary decode <binary>\nExample: .binary encode Hello");
    const isEncode = ["encode", "enc", "e"].includes(mode);
    try {
      let result: string;
      if (isEncode) {
        result = text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
      } else {
        result = text.split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("");
      }
      await reply(`💻 *Binary ${isEncode ? "Encode" : "Decode"}*\n\n*Input:* ${text.slice(0, 60)}\n*Result:* ${result.slice(0, 300)}${result.length > 300 ? "..." : ""}${FOOTER}`);
    } catch {
      await reply("❌ Invalid input for binary conversion.");
    }
  },
});

registerCommand({
  name: "fancy",
  aliases: ["fancytext", "stylish"],
  category: "Tools",
  description: "Convert text to fancy Unicode styles",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .fancy <text>\nExample: .fancy Hello World");
    const bold = text.split("").map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
      return c;
    }).join("");
    const italic = text.split("").map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D434 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D44E + code - 97);
      return c;
    }).join("");
    const small = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ";
    const smallText = text.toUpperCase().split("").map(c => {
      const idx = c.charCodeAt(0) - 65;
      return idx >= 0 && idx < 26 ? small[idx] : c;
    }).join("");
    await reply(`✨ *Fancy Text*\n\n*Input:* ${text}\n\n𝗕𝗼𝗹𝗱: ${bold}\n𝐼𝑡𝑎𝑙𝑖𝑐: ${italic}\nꜱᴍᴀʟʟ: ${smallText}${FOOTER}`);
  },
});
