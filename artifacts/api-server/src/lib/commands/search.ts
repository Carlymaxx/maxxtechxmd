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
  aliases: ["yify", "movies", "movie", "film"],
  category: "Search",
  description: "Search movies with poster and download option",
  handler: async ({ sock, from, msg: waMsg, args, reply, settings }) => {
    const p = settings.prefix;
    const sub = args[0]?.toLowerCase();
    const rest = args.slice(1).join(" ");

    if (!args.length) {
      return reply(
        `🎬 *MOVIE BOX* 🍿\n\n*Commands:*\n${p}movie <name> — Search any movie\n${p}movie dl <name> — Get movie download links\n\n📝 *Examples:*\n${p}movie Avengers\n${p}movie Black Panther\n${p}movie dl Spiderman`
      );
    }

    // ── .movie dl <name> — downloads official trailer and sends as MP4 ─────────
    if (sub === "dl" || sub === "download") {
      const title = rest;
      if (!title) return reply(`❌ Please provide a movie name.\n\n📝 Example: ${p}movie dl Avengers`);

      await reply(
        `╔══════════════════════╗\n║  🎬 *MOVIE TRAILER*  ║\n╚══════════════════════╝\n\n` +
        `🔍 Searching trailer for *${title}*...\n⏳ This may take up to 60 seconds...`
      );

      try {
        const { searchYouTube, downloadVideo } = await import("../ytdlpUtil.js");

        // Search YouTube for the official trailer
        const ytUrl = await searchYouTube(`${title} official trailer HD`);

        await reply(`🎬 Found trailer! Downloading *${title}*... ⬇️`);

        const { buffer, duration } = await downloadVideo(ytUrl, 300);

        if (buffer.length > 55 * 1024 * 1024) {
          return reply(
            `⚠️ Trailer too large (${Math.round(buffer.length / 1024 / 1024)}MB).\n` +
            `WhatsApp limit is 55MB. Try a shorter movie name or search on YouTube directly.`
          );
        }

        const mins = Math.floor(duration / 60);
        const secs = (duration % 60).toString().padStart(2, "0");

        await sock.sendMessage(from, {
          video: buffer,
          mimetype: "video/mp4",
          caption:
            `🎬 *${title}* — Official Trailer\n` +
            `⏱️ ${mins}:${secs}`,
          fileName: `${title} trailer.mp4`,
        } as any, { quoted: waMsg });

      } catch (e: any) {
        await reply(
          `❌ Could not download trailer for *${title}*.\n\n` +
          `_${e.message?.slice(0, 120) || "Try again later"}_\n\n` +
          `💡 Try: ${p}movie dl ${title} official trailer`
        );
      }
      return;
    }

    // ── .movie <query> ────────────────────────────────────────────────────────
    const query = args.join(" ");
    if (!query) return reply(`❓ Usage: ${p}movie <movie name>\n\n💡 To download: ${p}movie dl <movie name>`);

    await reply(`🔍 Searching *${query}*... 🍿`);

    try {
      const [ytsRes, omdbRes] = await Promise.allSettled([
        fetch(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=8`).then(r => r.json()),
        fetch(`https://www.omdbapi.com/?apikey=trilogy&s=${encodeURIComponent(query)}&type=movie`).then(r => r.json()),
      ]);

      const movies: any[] = (ytsRes.status === "fulfilled" ? (ytsRes.value as any).data?.movies : null) || [];
      if (!movies.length) {
        return reply(`❌ No movies found for *${query}*.\n\nTry a different spelling or shorter name.`);
      }
      const top = movies[0];
      const omdbList: any = omdbRes.status === "fulfilled" ? omdbRes.value : {};
      const firstOmdb: any = omdbList.Search?.[0];

      // Fetch full OMDB details for the top movie
      let omdbDetail: any = {};
      if (firstOmdb?.imdbID) {
        try {
          const dr = await fetch(`https://www.omdbapi.com/?apikey=trilogy&i=${firstOmdb.imdbID}&plot=short`);
          omdbDetail = await dr.json() as any;
        } catch {}
      }

      const director = omdbDetail?.Director && omdbDetail.Director !== "N/A" ? omdbDetail.Director : null;
      const cast     = omdbDetail?.Actors   && omdbDetail.Actors   !== "N/A" ? omdbDetail.Actors   : null;
      const plot     = top.summary?.replace(/<[^>]+>/g, "").trim() ||
        (omdbDetail?.Plot && omdbDetail.Plot !== "N/A" ? omdbDetail.Plot : "No description available.");
      const genres  = top.genres?.join(", ") || omdbDetail?.Genre   || "N/A";
      const runtime = top.runtime ? `${top.runtime} min` : (omdbDetail?.Runtime || "N/A");
      const rating  = top.rating || omdbDetail?.imdbRating || "N/A";

      let caption =
        `╔══════════════════════╗\n║   🎬 *MAXX HUB* 🍿   ║\n╚══════════════════════╝\n\n` +
        `🎬 *${top.title}* (${top.year})\n` +
        `⭐ IMDb: ${rating}/10\n` +
        `🎭 ${genres}\n` +
        `⏱️ ${runtime}\n`;
      if (director) caption += `🎬 Director: ${director}\n`;
      if (cast)     caption += `🌟 Cast: ${cast}\n`;
      caption += `\n📝 ${plot.length > 300 ? plot.slice(0, 300) + "..." : plot}\n\n`;
      caption += `📥 _${p}movie dl ${top.title}_\n\n`;
      caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (movies.length > 1) {
        caption += `📋 *More Results:*\n\n`;
        movies.slice(1, 8).forEach((m: any, i: number) => {
          caption += `*${i + 2}. ${m.title}* (${m.year})\n`;
          caption += `┃ 📥 _${p}movie dl ${m.title}_\n\n`;
        });
      }

      caption += `💡 *To download:* ${p}movie dl <movie name>`;

      const posterUrl =
        top.large_cover_image ||
        top.medium_cover_image ||
        (firstOmdb?.Poster && firstOmdb.Poster !== "N/A" ? firstOmdb.Poster : null);

      if (posterUrl) {
        try {
          const buf = await fetch(posterUrl).then(r => r.ok ? r.arrayBuffer() : null);
          if (buf && buf.byteLength > 500) {
            await sock.sendMessage(from, { image: Buffer.from(buf), caption }, { quoted: waMsg });
            return;
          }
        } catch {}
      }

      await reply(caption);
    } catch {
      await reply("❌ Could not search movies right now. Try again later.");
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
