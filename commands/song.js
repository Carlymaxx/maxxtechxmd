const https = require("https");

function searchYoutube(query) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const videoIds = data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g);
          if (videoIds && videoIds.length > 0) {
            const uniqueId = videoIds[0].replace('/watch?v=', '');
            resolve({ id: uniqueId, url: `https://youtu.be/${uniqueId}` });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = {
  name: "song",
  alias: ["play", "music"],
  description: "Search and get a song link",
  execute: async (sock, msg, args, from, settings) => {
    if (!args.length) {
      return await sock.sendMessage(from, { text: `🎵 Usage: ${settings.prefix}song <song name>` }, { quoted: msg });
    }

    const query = args.join(" ");
    await sock.sendMessage(from, { text: `🔍 Searching for *${query}*...` }, { quoted: msg });

    const result = await searchYoutube(query);
    if (!result) {
      return await sock.sendMessage(from, { text: "❌ No results found. Try a different search." }, { quoted: msg });
    }

    const text = `🎵 *Song Found!*\n\n` +
                 `🔗 ${result.url}\n\n` +
                 `> _${settings.botName}_ ⚡`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  }
};
