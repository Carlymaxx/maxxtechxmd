import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── Piston code execution API ─────────────────────────────────────────────────
async function runCode(language: string, code: string, version = "*"): Promise<string> {
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language,
      version,
      files: [{ name: "code", content: code }],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error("Piston API error " + res.status);
  const data = await res.json() as any;
  const out = (data.run?.stdout || "") + (data.run?.stderr || "");
  return out.trim().slice(0, 1500) || "(no output)";
}

// ── Code runners ──────────────────────────────────────────────────────────────
registerCommand({
  name: "runpy",
  aliases: ["py", "python"],
  category: "Coding",
  description: "Run Python code",
  usage: ".runpy <code>",
  handler: async ({ args, reply }) => {
    const code = args.join(" ").replace(/```python|```py|```/gi, "").trim();
    if (!code) return reply(`❓ Usage: .runpy <python code>\n\nExample:\n.runpy print("Hello World")${FOOTER}`);
    try {
      const out = await runCode("python", code);
      await reply(`🐍 *Python Output*\n\`\`\`\n${out}\n\`\`\`${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Error: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "runjs",
  aliases: ["js", "javascript", "nodejs"],
  category: "Coding",
  description: "Run JavaScript/Node.js code",
  usage: ".runjs <code>",
  handler: async ({ args, reply }) => {
    const code = args.join(" ").replace(/```javascript|```js|```/gi, "").trim();
    if (!code) return reply(`❓ Usage: .runjs <javascript code>\n\nExample:\n.runjs console.log("Hello World")${FOOTER}`);
    try {
      const out = await runCode("javascript", code);
      await reply(`🟨 *JavaScript Output*\n\`\`\`\n${out}\n\`\`\`${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Error: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "runc",
  aliases: ["runC", "clang"],
  category: "Coding",
  description: "Run C code",
  usage: ".runc <code>",
  handler: async ({ args, reply }) => {
    const rawCode = args.join(" ").replace(/```c|```/gi, "").trim();
    if (!rawCode) return reply(`❓ Usage: .runc <C code>\n\nExample:\n.runc #include<stdio.h>\\nint main(){printf("Hello");return 0;}${FOOTER}`);
    const code = rawCode.includes("#include") ? rawCode : `#include <stdio.h>\n#include <stdlib.h>\nint main() {\n${rawCode}\nreturn 0;\n}`;
    try {
      const out = await runCode("c", code);
      await reply(`🔵 *C Output*\n\`\`\`\n${out}\n\`\`\`${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Error: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "runcpp",
  aliases: ["cpp", "cplusplus"],
  category: "Coding",
  description: "Run C++ code",
  usage: ".runcpp <code>",
  handler: async ({ args, reply }) => {
    const rawCode = args.join(" ").replace(/```cpp|```c\+\+|```/gi, "").trim();
    if (!rawCode) return reply(`❓ Usage: .runcpp <C++ code>${FOOTER}`);
    const code = rawCode.includes("#include") ? rawCode : `#include <iostream>\nusing namespace std;\nint main() {\n${rawCode}\nreturn 0;\n}`;
    try {
      const out = await runCode("c++", code);
      await reply(`🔷 *C++ Output*\n\`\`\`\n${out}\n\`\`\`${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Error: ${e.message}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "runjava",
  aliases: ["java"],
  category: "Coding",
  description: "Run Java code",
  usage: ".runjava <code>",
  handler: async ({ args, reply }) => {
    const rawCode = args.join(" ").replace(/```java|```/gi, "").trim();
    if (!rawCode) return reply(`❓ Usage: .runjava <Java code>${FOOTER}`);
    const code = rawCode.includes("class") ? rawCode :
      `public class code {\n  public static void main(String[] args) {\n    ${rawCode}\n  }\n}`;
    try {
      const out = await runCode("java", code);
      await reply(`☕ *Java Output*\n\`\`\`\n${out}\n\`\`\`${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Error: ${e.message}${FOOTER}`);
    }
  },
});

// ── Encoding / Decoding ───────────────────────────────────────────────────────
registerCommand({
  name: "base64",
  aliases: ["b64", "encode64"],
  category: "Coding",
  description: "Encode text to Base64",
  usage: ".base64 <text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .base64 <text>${FOOTER}`);
    const encoded = Buffer.from(text).toString("base64");
    await reply(`🔐 *Base64 Encoded*\n\n\`\`\`${encoded}\`\`\`${FOOTER}`);
  },
});

registerCommand({
  name: "unbase64",
  aliases: ["d64", "decodebase64", "base64decode"],
  category: "Coding",
  description: "Decode Base64 text",
  usage: ".unbase64 <base64 text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .unbase64 <base64 text>${FOOTER}`);
    try {
      const decoded = Buffer.from(text, "base64").toString("utf8");
      await reply(`🔓 *Base64 Decoded*\n\n${decoded}${FOOTER}`);
    } catch {
      await reply(`❌ Invalid Base64 string${FOOTER}`);
    }
  },
});

registerCommand({
  name: "binary",
  aliases: ["tobinary", "txt2bin"],
  category: "Coding",
  description: "Convert text to binary",
  usage: ".binary <text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .binary <text>${FOOTER}`);
    const bin = text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    await reply(`💻 *Text → Binary*\n\n\`\`\`${bin.slice(0, 1000)}\`\`\`${FOOTER}`);
  },
});

registerCommand({
  name: "dbinary",
  aliases: ["frombinary", "bin2txt", "decodebinary"],
  category: "Coding",
  description: "Decode binary to text",
  usage: ".dbinary <binary>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .dbinary <binary string>${FOOTER}`);
    try {
      const decoded = text.split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("");
      await reply(`💻 *Binary → Text*\n\n${decoded}${FOOTER}`);
    } catch {
      await reply(`❌ Invalid binary string${FOOTER}`);
    }
  },
});

registerCommand({
  name: "hex",
  aliases: ["tohex", "txt2hex"],
  category: "Coding",
  description: "Convert text to hexadecimal",
  usage: ".hex <text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .hex <text>${FOOTER}`);
    const hexed = Buffer.from(text).toString("hex");
    await reply(`🔢 *Text → Hex*\n\n\`\`\`${hexed}\`\`\`${FOOTER}`);
  },
});

registerCommand({
  name: "dhex",
  aliases: ["fromhex", "hexdecode"],
  category: "Coding",
  description: "Decode hexadecimal to text",
  usage: ".dhex <hex>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .dhex <hex string>${FOOTER}`);
    try {
      const decoded = Buffer.from(text.replace(/\s/g, ""), "hex").toString("utf8");
      await reply(`🔢 *Hex → Text*\n\n${decoded}${FOOTER}`);
    } catch {
      await reply(`❌ Invalid hex string${FOOTER}`);
    }
  },
});

registerCommand({
  name: "urlencode",
  aliases: ["encodeurl"],
  category: "Coding",
  description: "URL-encode a string",
  usage: ".urlencode <text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .urlencode <text>${FOOTER}`);
    await reply(`🌐 *URL Encoded*\n\n\`\`\`${encodeURIComponent(text)}\`\`\`${FOOTER}`);
  },
});

registerCommand({
  name: "urldecode",
  aliases: ["decodeurl"],
  category: "Coding",
  description: "URL-decode a string",
  usage: ".urldecode <encoded text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .urldecode <encoded text>${FOOTER}`);
    try {
      await reply(`🌐 *URL Decoded*\n\n${decodeURIComponent(text)}${FOOTER}`);
    } catch {
      await reply(`❌ Invalid URL-encoded string${FOOTER}`);
    }
  },
});

registerCommand({
  name: "encrypt",
  aliases: ["caesar", "rot13"],
  category: "Coding",
  description: "Encrypt text using Caesar/ROT13 cipher",
  usage: ".encrypt <text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .encrypt <text>${FOOTER}`);
    const rot13 = text.replace(/[a-zA-Z]/g, c => {
      const base = c < "a" ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
    await reply(`🔒 *ROT13 Cipher*\n\nOriginal: ${text}\nEncrypted: \`\`\`${rot13}\`\`\`${FOOTER}`);
  },
});

registerCommand({
  name: "encrypt2",
  aliases: ["xorencrypt"],
  category: "Coding",
  description: "Encrypt text with XOR cipher",
  usage: ".encrypt2 <text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .encrypt2 <text>${FOOTER}`);
    const key = 0x42;
    const encrypted = Buffer.from(text).map(b => b ^ key).toString("base64");
    await reply(`🔐 *XOR Encrypted*\n\n\`\`\`${encrypted}\`\`\`\n\n_Key: 0x42_${FOOTER}`);
  },
});

// ── Timestamp ─────────────────────────────────────────────────────────────────
registerCommand({
  name: "timestamp",
  aliases: ["epoch", "unixtime"],
  category: "Coding",
  description: "Convert date to Unix timestamp or vice versa",
  usage: ".timestamp <date or epoch>",
  handler: async ({ args, reply }) => {
    const input = args.join(" ");
    const now = Date.now();
    if (!input) {
      return reply(`🕐 *Current Unix Timestamp*\n\n⏱️ Milliseconds: \`${now}\`\n⏱️ Seconds: \`${Math.floor(now / 1000)}\`\n📅 Date: ${new Date(now).toUTCString()}${FOOTER}`);
    }
    if (/^\d+$/.test(input)) {
      const ms = input.length >= 13 ? parseInt(input) : parseInt(input) * 1000;
      await reply(`📅 *Unix → Date*\n\n${new Date(ms).toUTCString()}${FOOTER}`);
    } else {
      try {
        const d = new Date(input);
        if (isNaN(d.getTime())) throw new Error();
        await reply(`⏱️ *Date → Unix*\n\n${d.toUTCString()} → \`${d.getTime()}\`${FOOTER}`);
      } catch {
        await reply(`❌ Invalid date format\n\nExamples: .timestamp 2024-01-01  .timestamp 1704067200${FOOTER}`);
      }
    }
  },
});

// ── JSON formatter ────────────────────────────────────────────────────────────
registerCommand({
  name: "formatjson",
  aliases: ["prettyjson", "jsonformat"],
  category: "Coding",
  description: "Format/prettify a JSON string",
  usage: ".formatjson <json>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .formatjson <json string>${FOOTER}`);
    try {
      const parsed = JSON.parse(text);
      const pretty = JSON.stringify(parsed, null, 2);
      await reply(`📋 *Formatted JSON*\n\`\`\`json\n${pretty.slice(0, 1500)}\n\`\`\`${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Invalid JSON: ${e.message}${FOOTER}`);
    }
  },
});
