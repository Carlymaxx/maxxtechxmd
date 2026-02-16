const https = require("https");
const http = require("http");

module.exports = {
  name: "tts",
  alias: ["say", "speak"],
  description: "Convert text to speech audio",
  execute: async (sock, msg, args, from, settings) => {
    if (!args.length) {
      return await sock.sendMessage(from, {
        text: "🔊 *Text to Speech*\n\nUsage: .tts <text>\n\nExample: .tts Hello everyone!"
      }, { quoted: msg });
    }

    const text = args.join(" ");
    if (text.length > 200) {
      return await sock.sendMessage(from, { text: "❌ Text too long! Maximum 200 characters." }, { quoted: msg });
    }

    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;

      const buffer = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://translate.google.com/" }
        }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = res.headers.location;
            const mod = redirectUrl.startsWith("https") ? https : http;
            mod.get(redirectUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (res2) => {
              const chunks = [];
              res2.on("data", chunk => chunks.push(chunk));
              res2.on("end", () => resolve(Buffer.concat(chunks)));
              res2.on("error", reject);
            }).on("error", reject);
            return;
          }
          const chunks = [];
          res.on("data", chunk => chunks.push(chunk));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        });
        req.on("error", reject);
      });

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mpeg",
        ptt: true
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Failed to generate audio. Try again later." }, { quoted: msg });
    }
  }
};
