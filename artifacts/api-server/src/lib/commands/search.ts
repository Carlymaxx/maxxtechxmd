import { registerCommand } from "./types";

registerCommand({
  name: "weather",
  aliases: ["w"],
  category: "Search",
  description: "Get weather for a city",
  handler: async ({ args, reply }) => {
    const city = args.join(" ");
    if (!city) return reply("❓ Usage: .weather <city>\nExample: .weather Nairobi");
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const data = await res.json() as any;
      const cur = data.current_condition?.[0];
      const area = data.nearest_area?.[0];
      const today = data.weather?.[0];
      if (!cur) throw new Error();
      const loc = `${area?.areaName?.[0]?.value || city}, ${area?.country?.[0]?.value || ""}`.replace(/, $/, "");
      const desc = cur.weatherDesc?.[0]?.value || "N/A";
      const tempC = cur.temp_C;
      const tempF = cur.temp_F || Math.round(+tempC * 9 / 5 + 32);
      const feelsC = cur.FeelsLikeC;
      const wind = cur.windspeedKmph;
      const windDir = cur.winddir16Point || "";
      const humidity = cur.humidity;
      const cloud = cur.cloudcover;
      const precip = cur.precipMM;
      const vis = cur.visibility;
      const maxC = today?.maxtempC ?? "?";
      const minC = today?.mintempC ?? "?";
      const sunrise = today?.astronomy?.[0]?.sunrise || "?";
      const sunset = today?.astronomy?.[0]?.sunset || "?";

      const condEmoji = (() => {
        const d = desc.toLowerCase();
        if (d.includes("sun") || d.includes("clear")) return "☀️";
        if (d.includes("thunder") || d.includes("storm")) return "⛈️";
        if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
        if (d.includes("snow") || d.includes("blizzard")) return "❄️";
        if (d.includes("fog") || d.includes("mist")) return "🌫️";
        if (d.includes("cloud") || d.includes("overcast")) return "☁️";
        if (d.includes("wind")) return "💨";
        return "🌤️";
      })();

      await reply(`${condEmoji} *Weather Report*

📍 *Location:* ${loc}
🌡️ *Temperature:* ${tempC}°C / ${tempF}°F
🤔 *Feels Like:* ${feelsC}°C
💨 *Wind:* ${wind} km/h ${windDir}
💧 *Humidity:* ${humidity}%
☁️ *Cloud Cover:* ${cloud}%
🌧️ *Precipitation:* ${precip}mm
👁️ *Visibility:* ${vis} km
📝 *Condition:* ${desc}

📅 *Today's Forecast:*
🔺 Max: ${maxC}°C
🔻 Min: ${minC}°C
🌅 Sunrise: ${sunrise}
🌇 Sunset: ${sunset}`);
    } catch {
      await reply("❌ Could not fetch weather. Check the city name and try again.");
    }
  },
});

registerCommand({
  name: "define",
  aliases: ["dictionary", "meaning"],
  category: "Search",
  description: "Get definition of a word",
  handler: async ({ args, reply }) => {
    const word = args[0];
    if (!word) return reply("❓ Usage: .define <word>\nExample: .define philosophy");
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json() as any;
      if (!Array.isArray(data)) return reply(`❌ No definition found for *${word}*`);
      const entry = data[0];
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || "";
      const meanings = entry.meanings?.slice(0, 2).map((m: any) => {
        const defs = m.definitions?.slice(0, 2).map((d: any) =>
          `  • ${d.definition}${d.example ? `\n    _"${d.example}"_` : ""}`
        ).join("\n");
        return `📖 *${m.partOfSpeech}*\n${defs}`;
      }).join("\n\n");
      await reply(`📚 *${word}* ${phonetic ? `(${phonetic})` : ""}\n\n${meanings}`);
    } catch {
      await reply(`❌ Could not define *${word}*. Try another word.`);
    }
  },
});

registerCommand({
  name: "define2",
  aliases: ["def2"],
  category: "Search",
  description: "Get extended word definition with synonyms",
  handler: async ({ args, reply }) => {
    const word = args.join(" ");
    if (!word) return reply("❓ Usage: .define2 <word>");
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await res.json() as any;
      if (!Array.isArray(data)) return reply(`❌ No definition found for *${word}*`);
      const entry = data[0];
      const synonyms = entry.meanings?.flatMap((m: any) =>
        m.definitions?.flatMap((d: any) => d.synonyms || []) || []
      ).slice(0, 8).join(", ");
      const antonyms = entry.meanings?.flatMap((m: any) =>
        m.definitions?.flatMap((d: any) => d.antonyms || []) || []
      ).slice(0, 5).join(", ");
      const def = entry.meanings?.[0]?.definitions?.[0]?.definition || "N/A";
      await reply(`📚 *Extended Definition: ${word}*\n\n📖 *Meaning:*\n${def}\n\n🔗 *Synonyms:*\n${synonyms || "N/A"}\n\n🔄 *Antonyms:*\n${antonyms || "N/A"}`);
    } catch {
      await reply(`❌ Could not find extended definition for *${word}*.`);
    }
  },
});

registerCommand({
  name: "lyrics",
  aliases: ["lyric"],
  category: "Search",
  description: "Get song lyrics",
  usage: ".lyrics Adele - Hello",
  handler: async ({ args, reply }) => {
    const input = args.join(" ");
    if (!input) return reply("❓ Usage: .lyrics <artist> - <song>\nExample: .lyrics Adele - Hello");

    let artist: string, song: string;
    if (input.includes(" - ")) {
      [artist, song] = input.split(" - ").map(s => s.trim());
    } else {
      artist = args[0];
      song = args.slice(1).join(" ");
    }
    if (!song?.trim()) return reply("❓ Usage: .lyrics <artist> - <song>\nExample: .lyrics Adele - Hello");

    const maxLen = 3500;
    function clean(raw: string): string {
      return raw
        .replace(/\[(\d{2}:\d{2}\.\d+)\]/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    // ── Layer 1: lrclib.net (free, no key, great coverage) ─────────────────
    try {
      const q = encodeURIComponent(`${artist} ${song}`);
      const res = await fetch(`https://lrclib.net/api/search?q=${q}`, { signal: AbortSignal.timeout(8000) });
      const results = await res.json() as any[];
      if (!Array.isArray(results) || results.length === 0) throw new Error("no results");
      const match = results.find(r => r.plainLyrics) || results[0];
      if (!match?.plainLyrics) throw new Error("no lyrics");
      const lyr = clean(match.plainLyrics);
      const display = lyr.length > maxLen ? lyr.slice(0, maxLen) + "\n\n... _(truncated)_" : lyr;
      return reply(`🎵 *${match.trackName || song}*\n👤 *${match.artistName || artist}*\n💿 ${match.albumName || ""}\n\n${display}`);
    } catch {}

    // ── Layer 2: lyrics.ovh ─────────────────────────────────────────────────
    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json() as any;
      if (!data.lyrics) throw new Error("no lyrics");
      const lyr = clean(data.lyrics);
      const display = lyr.length > maxLen ? lyr.slice(0, maxLen) + "\n\n... _(truncated)_" : lyr;
      return reply(`🎵 *${song}*\n👤 *${artist}*\n\n${display}`);
    } catch {}

    return reply(`❌ Lyrics not found for *${song}* by *${artist}*.\n\nTips:\n• Check the spelling of artist and song name\n• Try: _.lyrics Drake - God's Plan_`);
  },
});

registerCommand({
  name: "translate",
  aliases: ["tr"],
  category: "Search",
  description: "Translate text to another language",
  handler: async ({ args, reply }) => {
    if (args.length < 2) return reply("❓ Usage: .translate <lang> <text>\nExample: .translate fr Hello World\n\nCodes: en fr es de ar zh pt sw hi ru ja ko");
    const [lang, ...rest] = args;
    const text = rest.join(" ");
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`;
      const res = await fetch(url);
      const data = await res.json() as any;
      const translated = data.responseData?.translatedText;
      if (!translated || translated.toLowerCase().includes("mymemory")) throw new Error();
      await reply(`🌍 *Translation*\n\n📝 Original: _${text}_\n🔄 Translated (${lang}): *${translated}*`);
    } catch {
      await reply("❌ Translation failed. Check your language code and try again.");
    }
  },
});

registerCommand({
  name: "translate2",
  aliases: ["trans2"],
  category: "AI",
  description: "Advanced translation",
  handler: async ({ args, reply }) => {
    if (args.length < 2) return reply("❓ Usage: .translate2 <lang> <text>\nExample: .translate2 es Good morning");
    const [lang, ...rest] = args;
    const text = rest.join(" ");
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${lang}`;
      const res = await fetch(url);
      const data = await res.json() as any;
      const translated = data.responseData?.translatedText;
      if (!translated) throw new Error();
      await reply(`🌍 *Advanced Translation*\n\n📝 Input: _${text}_\n🔄 Result (${lang}): *${translated}*`);
    } catch {
      await reply("❌ Translation failed.");
    }
  },
});

registerCommand({
  name: "movie",
  aliases: ["film", "movies", "yts", "yify", "imdb"],
  category: "Search",
  description: "Search movies with poster, details and download links",
  handler: async ({ sock, from, msg: waMsg, args, reply, settings }) => {
    const p = settings.prefix;
    const sub = args[0]?.toLowerCase();
    const rest = args.slice(1).join(" ");

    if (!args.length) {
      return reply(
        `╔══════════════════════╗\n║   🎬 *MOVIE BOX* 🍿   ║\n╚══════════════════════╝\n\n` +
        `*Commands:*\n${p}movie <name> — Search any movie\n${p}movie dl <name> — Get download links\n\n` +
        `📝 *Examples:*\n${p}movie Avengers\n${p}movie Black Panther\n${p}movie dl Spider-Man`
      );
    }

    const OMDB_KEY = process.env.OMDB_API_KEY || "trilogy";

    // ── helper: fetch poster buffer ───────────────────────────────────────────
    async function fetchPoster(url: string): Promise<Buffer | null> {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) return null;
        const buf = Buffer.from(await r.arrayBuffer());
        return buf.byteLength > 1000 ? buf : null;
      } catch { return null; }
    }

    // ── .movie dl <name> — download trailer as MP4 ───────────────────────────
    if (sub === "dl" || sub === "download") {
      const title = rest;
      if (!title) return reply(`❌ Please provide a movie name.\n\n📝 Example: ${p}movie dl Avengers`);

      await reply(
        `╔══════════════════════╗\n║  🎬 *MOVIE TRAILER*  ║\n╚══════════════════════╝\n\n` +
        `🔍 Searching trailer for *${title}*...\n⏳ Please wait...`
      );

      try {
        // Step 1: Fetch OMDB for movie info (runs in parallel with YouTube search start)
        const omdbPromise = fetch(
          `https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${encodeURIComponent(title)}&type=movie&plot=short`,
          { signal: AbortSignal.timeout(10000) }
        ).then(r => r.json()).catch(() => ({ Response: "False" })) as Promise<any>;

        // Step 2: Search YouTube for official trailer
        const { searchYouTube } = await import("../ytdlpUtil.js");
        const ytUrl = await searchYouTube(`${title} official trailer HD`);

        await reply(`🎬 Found trailer! ⬇️ Downloading...`);

        // Step 3: Get MP4 download link via eliteprotech ytdown API
        const apiRes = await fetch(
          `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(ytUrl)}&format=mp4`,
          { signal: AbortSignal.timeout(25000) }
        );
        const apiData = await apiRes.json() as any;
        if (!apiData.success || !apiData.downloadURL) {
          throw new Error("Could not get trailer download link");
        }

        // Step 4: Download the MP4 buffer
        const dlRes = await fetch(apiData.downloadURL, { signal: AbortSignal.timeout(90000) });
        if (!dlRes.ok) throw new Error(`Download failed (${dlRes.status})`);
        const buffer = Buffer.from(await dlRes.arrayBuffer());

        if (buffer.length > 55 * 1024 * 1024) {
          throw new Error(`Trailer too large (${Math.round(buffer.length / 1024 / 1024)}MB). WhatsApp limit is 55MB.`);
        }

        // Step 5: Build caption using OMDB data
        const omdb = await omdbPromise;
        const movieTitle = omdb.Response === "True" ? omdb.Title : title;
        const caption =
          `╔══════════════════════╗\n║  🎬 *MOVIE TRAILER*  ║\n╚══════════════════════╝\n\n` +
          `🎬 *${movieTitle}*` + (omdb.Year ? ` (${omdb.Year})` : "") + "\n" +
          (omdb.imdbRating && omdb.imdbRating !== "N/A" ? `⭐ IMDb: ${omdb.imdbRating}/10\n` : "") +
          (omdb.Genre && omdb.Genre !== "N/A" ? `🎭 ${omdb.Genre}\n` : "") +
          (omdb.Runtime && omdb.Runtime !== "N/A" ? `⏱️ ${omdb.Runtime}\n` : "") +
          (omdb.Director && omdb.Director !== "N/A" ? `🎬 Director: ${omdb.Director}\n` : "") +
          (omdb.Plot && omdb.Plot !== "N/A" ? `\n📝 ${omdb.Plot.slice(0, 200)}` : "") +
          `\n\n> _MAXX-XMD_ 🎬`;

        await sock.sendMessage(from, {
          video: buffer,
          mimetype: "video/mp4",
          caption,
          fileName: `${movieTitle} trailer.mp4`,
        } as any, { quoted: waMsg });

      } catch (e: any) {
        await reply(`❌ *Trailer Download Failed*\n\n${e.message?.slice(0, 150) || "Try again later"}`);
      }
      return;
    }

    // ── .movie <query> — full movie search ────────────────────────────────────
    const query = args.join(" ");

    await reply(`🔍 Searching *${query}*... 🍿`);

    try {
      // Search OMDB for multiple results
      const [searchRes, singleRes] = await Promise.allSettled([
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(query)}&type=movie`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
        fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${encodeURIComponent(query)}&type=movie&plot=short`, { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
      ]);

      const searchData: any = searchRes.status === "fulfilled" ? searchRes.value : {};
      const singleData: any = singleRes.status === "fulfilled" ? singleRes.value : {};

      // Use the best source for the top result
      let top: any = null;
      if (singleData.Response === "True") {
        top = singleData;
      } else if (searchData.Response === "True" && searchData.Search?.length) {
        // Fetch full details of the first search result
        try {
          const dr = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${searchData.Search[0].imdbID}&plot=short`, { signal: AbortSignal.timeout(8000) });
          top = await dr.json() as any;
        } catch { top = searchData.Search[0]; }
      }

      if (!top || top.Response === "False") {
        return reply(`❌ No movie found for *${query}*.\n\nTry a different spelling or the exact title.`);
      }

      const director = top.Director && top.Director !== "N/A" ? top.Director : null;
      const cast     = top.Actors   && top.Actors   !== "N/A" ? top.Actors   : null;
      const plot     = top.Plot     && top.Plot     !== "N/A" ? top.Plot     : "No description available.";
      const genre    = top.Genre    && top.Genre    !== "N/A" ? top.Genre    : null;
      const runtime  = top.Runtime  && top.Runtime  !== "N/A" ? top.Runtime  : null;
      const rating   = top.imdbRating && top.imdbRating !== "N/A" ? top.imdbRating : null;
      const country  = top.Country  && top.Country  !== "N/A" ? top.Country  : null;
      const awards   = top.Awards   && top.Awards   !== "N/A" && !top.Awards.startsWith("N/A") ? top.Awards : null;

      let caption =
        `╔══════════════════════╗\n║   🎬 *MAXX HUB* 🍿   ║\n╚══════════════════════╝\n\n` +
        `🎬 *${top.Title}* (${top.Year})\n`;
      if (rating)  caption += `⭐ IMDb: ${rating}/10\n`;
      if (genre)   caption += `🎭 ${genre}\n`;
      if (runtime) caption += `⏱️ ${runtime}\n`;
      if (country) caption += `🌐 ${country}\n`;
      if (director) caption += `🎬 Director: ${director}\n`;
      if (cast)     caption += `🌟 Cast: ${cast}\n`;
      if (awards)   caption += `🏆 ${awards}\n`;
      caption += `\n📝 ${plot.length > 350 ? plot.slice(0, 350) + "..." : plot}\n\n`;
      caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      caption += `📥 *${p}movie dl ${top.Title}*\n\n`;

      // More results from search
      const others: any[] = searchData.Search?.filter((s: any) => s.imdbID !== top.imdbID).slice(0, 6) || [];
      if (others.length) {
        caption += `📋 *More Results:*\n`;
        others.forEach((m: any, i: number) => {
          caption += `*${i + 2}. ${m.Title}* (${m.Year})\n  📥 ${p}movie dl ${m.Title}\n`;
        });
        caption += "\n";
      }

      caption += `💡 _Use ${p}movie dl <name> to get download links_`;

      const posterBuf = top.Poster && top.Poster !== "N/A" ? await fetchPoster(top.Poster) : null;
      if (posterBuf) {
        await sock.sendMessage(from, { image: posterBuf, caption }, { quoted: waMsg });
      } else {
        await reply(caption);
      }
    } catch (e: any) {
      await reply(`❌ Could not search movies. Try again later.\n\n_${e.message?.slice(0, 80) || ""}_`);
    }
  },
});

registerCommand({
  name: "shazam",
  aliases: [],
  category: "Search",
  description: "Identify a song (reply to audio)",
  handler: async ({ reply }) => {
    await reply("ℹ️ *Shazam Feature*\n\nReply to an audio message and this feature will try to identify the song.\n\n_Note: Full Shazam recognition requires a premium API. For now, use .lyrics <artist> - <song> to search._");
  },
});

registerCommand({
  name: "scan",
  aliases: ["check", "wa"],
  category: "Search",
  description: "Check if a phone number is on WhatsApp",
  handler: async ({ sock, args, reply }) => {
    const number = args[0]?.replace(/\D/g, "");
    if (!number) return reply("❓ Usage: .scan <number>\nExample: .scan 2547XXXXXXXX");
    const jid = number + "@s.whatsapp.net";
    try {
      const [result] = await sock.onWhatsApp(jid);
      if (!result?.exists) {
        return reply(
          `╔══════════════════════╗\n║ 🔍 *SCAN RESULT* 🔍\n╚══════════════════════╝\n\n📞 *Number:* ${number}\n❌ *Status:* Not on WhatsApp\n\n> _MAXX-XMD_ ⚡`
        );
      }
      await reply(
        `╔══════════════════════╗\n║ 🔍 *SCAN RESULT* 🔍\n╚══════════════════════╝\n\n📞 *Number:* ${number}\n✅ *Status:* Active on WhatsApp\n🆔 *JID:* ${result.jid}\n\n> _MAXX-XMD_ ⚡`
      );
    } catch {
      await reply("❌ Scan failed. Try again later.");
    }
  },
});

registerCommand({
  name: "stalk",
  aliases: ["profile", "userinfo"],
  category: "Search",
  description: "Get WhatsApp profile info of a number",
  handler: async ({ sock, from, msg, args, reply }) => {
    const number = args[0]?.replace(/\D/g, "");
    if (!number) return reply("❓ Usage: .stalk <number>\nExample: .stalk 2547XXXXXXXX");
    const jid = number + "@s.whatsapp.net";
    try {
      const [result] = await sock.onWhatsApp(jid);
      if (!result?.exists) return reply(`❌ Number *${number}* is not on WhatsApp.\n\n> _MAXX-XMD_ ⚡`);
      let ppUrl = "";
      try { ppUrl = await sock.profilePictureUrl(jid, "image"); } catch {}
      let about = "(No status/bio)";
      try {
        const s = await sock.fetchStatus(jid);
        if ((s as any)?.status) about = (s as any).status;
      } catch {}
      const caption =
        `╔═══════════════════╗\n║ 🔍 *WHATSAPP STALK* 🔍\n╚═══════════════════╝\n\n📞 *Number:* ${number}\n✅ *On WhatsApp:* Yes\n🆔 *JID:* ${result.jid}\n📝 *Bio:* ${about}\n🖼️ *Profile Pic:* ${ppUrl ? "✅ Visible" : "🔒 Hidden"}\n\n> _MAXX-XMD_ ⚡`;
      if (ppUrl) {
        await sock.sendMessage(from, { image: { url: ppUrl }, caption }, { quoted: msg });
      } else {
        await reply(caption);
      }
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "pp",
  aliases: ["getpp", "pfp", "avatar"],
  category: "Search",
  description: "Get profile picture of a number",
  handler: async ({ sock, from, msg, args, reply }) => {
    let jid: string;
    if (args[0]) {
      jid = args[0].replace(/\D/g, "") + "@s.whatsapp.net";
    } else {
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      jid = ctx?.participant || msg.key.participant || from;
    }
    try {
      const url = await sock.profilePictureUrl(jid, "image");
      await sock.sendMessage(
        from,
        { image: { url }, caption: `🖼️ *Profile Picture*\n👤 ${jid.split("@")[0]}\n\n> _MAXX-XMD_ ⚡` },
        { quoted: msg }
      );
    } catch {
      await reply("❌ Profile picture is private or not available.\n\n> _MAXX-XMD_ ⚡");
    }
  },
});

registerCommand({
  name: "ip",
  aliases: ["iplookup", "geoip"],
  category: "Search",
  description: "Lookup IP address or domain geolocation",
  handler: async ({ args, reply }) => {
    const target = args[0];
    if (!target) return reply("❓ Usage: .ip <address or domain>\nExample: .ip 8.8.8.8");
    try {
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(target)}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,query`);
      const d = await res.json() as any;
      if (d.status !== "success") return reply(`❌ ${d.message || "Could not look up that address."}\n\n> _MAXX-XMD_ ⚡`);
      await reply(
        `╔══════════════════╗\n║ 🌐 *IP LOOKUP* 🌐\n╚══════════════════╝\n\n🔍 *IP:* ${d.query}\n🏳️ *Country:* ${d.country}\n🏙️ *Region:* ${d.regionName}\n🌆 *City:* ${d.city}\n📮 *Zip:* ${d.zip || "N/A"}\n🗺️ *Coords:* ${d.lat}, ${d.lon}\n🕒 *Timezone:* ${d.timezone}\n📡 *ISP:* ${d.isp}\n🏢 *Org:* ${d.org || "N/A"}\n\n> _MAXX-XMD_ ⚡`
      );
    } catch {
      await reply("❌ Lookup failed. Try again later.");
    }
  },
});

registerCommand({
  name: "qr",
  aliases: ["qrcode", "makeqr"],
  category: "Search",
  description: "Generate a QR code from any text or URL",
  handler: async ({ sock, from, msg, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply("❓ Usage: .qr <text or URL>\nExample: .qr https://github.com/Carlymaxx/maxxtechxmd");
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(text)}`;
    await sock.sendMessage(
      from,
      { image: { url }, caption: `📱 *QR Code Generated*\n\n📝 _${text.slice(0, 80)}${text.length > 80 ? "..." : ""}_\n\n> _MAXX-XMD_ ⚡` },
      { quoted: msg }
    );
  },
});
