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
      if (!cur) throw new Error();
      const loc = `${area?.areaName?.[0]?.value || city}, ${area?.country?.[0]?.value || ""}`;
      const desc = cur.weatherDesc?.[0]?.value || "N/A";
      const temp = cur.temp_C;
      const feels = cur.FeelsLikeC;
      const humidity = cur.humidity;
      const wind = cur.windspeedKmph;
      const vis = cur.visibility;
      await reply(`🌤️ *Weather in ${loc}*

🌡️ Temperature: *${temp}°C*
🤔 Feels like: *${feels}°C*
⛅ Condition: *${desc}*
💧 Humidity: *${humidity}%*
🌬️ Wind: *${wind} km/h*
👁️ Visibility: *${vis} km*`);
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
  handler: async ({ args, reply }) => {
    const input = args.join(" ");
    if (!input) return reply("❓ Usage: .lyrics <artist> - <song>\nExample: .lyrics Adele - Hello");
    const [artist, song] = input.includes(" - ") ? input.split(" - ") : [args[0], args.slice(1).join(" ")];
    if (!song) return reply("❓ Usage: .lyrics <artist> - <song>");
    try {
      const url = `https://lyrist.vercel.app/api/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
      const res = await fetch(url);
      const data = await res.json() as any;
      if (!data.lyrics) throw new Error();
      const maxLen = 3000;
      const lyr = data.lyrics.length > maxLen ? data.lyrics.slice(0, maxLen) + "\n\n... _(truncated)_" : data.lyrics;
      await reply(`🎵 *${data.title || song}*\n👤 *${data.artist || artist}*\n\n${lyr}`);
    } catch {
      try {
        const r2 = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
        const d2 = await r2.json() as any;
        if (!d2.lyrics) throw new Error();
        const lyr = d2.lyrics.length > 3000 ? d2.lyrics.slice(0, 3000) + "\n\n... _(truncated)_" : d2.lyrics;
        await reply(`🎵 *${song}* — *${artist}*\n\n${lyr}`);
      } catch {
        await reply(`❌ Lyrics not found for *${song}* by *${artist}*.`);
      }
    }
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
  name: "imdb",
  aliases: ["movie", "film"],
  category: "Search",
  description: "Search IMDB for a movie",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply("❓ Usage: .imdb <movie name>\nExample: .imdb Avengers");
    try {
      const apiKey = process.env.OMDB_API_KEY || "trilogy";
      const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(query)}&type=movie`);
      const d = await res.json() as any;
      if (d.Response === "False" || !d.Title) throw new Error(d.Error);
      await reply(`🎬 *${d.Title}* (${d.Year})

📅 Released: ${d.Released}
⭐ IMDB: ${d.imdbRating}/10
🎭 Genre: ${d.Genre}
🎬 Director: ${d.Director}
🌟 Cast: ${d.Actors}
⏱️ Runtime: ${d.Runtime}
🌐 Country: ${d.Country}
🏆 Awards: ${d.Awards}

📝 *Plot:*\n${d.Plot}`);
    } catch (e: any) {
      await reply(`❌ Movie not found: *${query}*\n\nTip: Try the exact movie title.`);
    }
  },
});

registerCommand({
  name: "yts",
  aliases: ["yify", "movies"],
  category: "Search",
  description: "Search YTS for movies",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply("❓ Usage: .yts <movie name>\nExample: .yts Inception");
    try {
      const res = await fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json() as any;
      const movies = data.data?.movies;
      if (!movies?.length) return reply(`❌ No movies found for *${query}*`);
      const list = movies.map((m: any) =>
        `🎬 *${m.title}* (${m.year})\n⭐ ${m.rating}/10 | ${m.genres?.join(", ")}\n🔗 ${m.url}\n📥 Torrents: ${m.torrents?.map((t: any) => `${t.quality}`).join(" | ")}`
      ).join("\n\n");
      await reply(`🎬 *YTS Movie Results*\n\n${list}`);
    } catch {
      await reply("❌ Could not search YTS right now.");
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
