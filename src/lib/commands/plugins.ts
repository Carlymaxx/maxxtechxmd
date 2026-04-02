import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── WEATHER (wttr.in — no API key needed) ─────────────────────────────────────

registerCommand({
  name: "weather",
  aliases: ["clima", "forecast", "hali"],
  category: "Tools",
  description: "Get real-time weather for any city (.weather Nairobi)",
  usage: ".weather <city>",
  handler: async ({ args, reply }) => {
    const city = args.join(" ");
    if (!city) return reply(`❓ Usage: .weather <city>\nExample: .weather Nairobi${FOOTER}`);
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("not found");
      const d = await res.json() as any;
      const cur = d.current_condition?.[0];
      const area = d.nearest_area?.[0];
      const areaName = area?.areaName?.[0]?.value || city;
      const country = area?.country?.[0]?.value || "";
      const tempC = cur?.temp_C;
      const tempF = cur?.temp_F;
      const feels = cur?.FeelsLikeC;
      const humidity = cur?.humidity;
      const wind = cur?.windspeedKmph;
      const desc = cur?.weatherDesc?.[0]?.value || "N/A";
      const vis = cur?.visibility;
      const uv = cur?.uvIndex;
      await reply(
        `🌤️ *Weather: ${areaName}${country ? ", " + country : ""}*\n\n` +
        `🌡️ *Temp:* ${tempC}°C / ${tempF}°F\n` +
        `🤔 *Feels Like:* ${feels}°C\n` +
        `☁️ *Condition:* ${desc}\n` +
        `💧 *Humidity:* ${humidity}%\n` +
        `🌬️ *Wind:* ${wind} km/h\n` +
        `👁️ *Visibility:* ${vis} km\n` +
        `☀️ *UV Index:* ${uv}${FOOTER}`
      );
    } catch {
      await reply(`❌ Could not fetch weather for *${city}*. Check the city name.${FOOTER}`);
    }
  },
});

// ── CRYPTO PRICES (CoinGecko — free, no key) ─────────────────────────────────

const COIN_IDS: Record<string, string> = {
  btc: "bitcoin", bitcoin: "bitcoin",
  eth: "ethereum", ethereum: "ethereum",
  bnb: "binancecoin", binance: "binancecoin",
  sol: "solana", solana: "solana",
  doge: "dogecoin", dogecoin: "dogecoin",
  ada: "cardano", cardano: "cardano",
  xrp: "ripple", ripple: "ripple",
  dot: "polkadot", polkadot: "polkadot",
  matic: "matic-network", polygon: "matic-network",
  ltc: "litecoin", litecoin: "litecoin",
  avax: "avalanche-2", avalanche: "avalanche-2",
  shib: "shiba-inu", "shiba inu": "shiba-inu",
  link: "chainlink", chainlink: "chainlink",
  uni: "uniswap", uniswap: "uniswap",
  ton: "toncoin", toncoin: "toncoin",
};

registerCommand({
  name: "crypto",
  aliases: ["coin", "price", "btcprice", "coinprice", "cryptoprice"],
  category: "Tools",
  description: "Get live crypto price (.crypto bitcoin / .crypto eth)",
  usage: ".crypto <coin>",
  handler: async ({ args, reply }) => {
    const input = args.join(" ").toLowerCase() || "bitcoin";
    const coinId = COIN_IDS[input] || input;
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coinId)}&order=market_cap_desc&per_page=1&page=1`,
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json() as any[];
      if (!data?.length) throw new Error("not found");
      const c = data[0];
      const change = c.price_change_percentage_24h?.toFixed(2) || "0";
      const changeEmoji = parseFloat(change) >= 0 ? "📈" : "📉";
      await reply(
        `${changeEmoji} *${c.name} (${c.symbol?.toUpperCase()}) Price*\n\n` +
        `💵 *Price:* $${c.current_price?.toLocaleString()}\n` +
        `📊 *24h Change:* ${change}%\n` +
        `📦 *Market Cap:* $${c.market_cap?.toLocaleString()}\n` +
        `📉 *24h Low:* $${c.low_24h?.toLocaleString()}\n` +
        `📈 *24h High:* $${c.high_24h?.toLocaleString()}\n` +
        `🏆 *Rank:* #${c.market_cap_rank}${FOOTER}`
      );
    } catch {
      await reply(`❌ Coin *${input}* not found. Try: .crypto bitcoin\n\nSupported: btc, eth, bnb, sol, doge, ada, xrp, dot, matic, ltc, avax, shib${FOOTER}`);
    }
  },
});

registerCommand({
  name: "topcrypto",
  aliases: ["topcoins", "cryptolist", "coinlist"],
  category: "Tools",
  description: "Show top 10 cryptocurrencies by market cap",
  handler: async ({ reply }) => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1",
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json() as any[];
      const list = data.map((c: any, i: number) => {
        const ch = c.price_change_percentage_24h?.toFixed(1) || "0";
        return `${i + 1}. *${c.name}* (${c.symbol?.toUpperCase()}) — $${c.current_price?.toLocaleString()} ${parseFloat(ch) >= 0 ? "📈" : "📉"} ${ch}%`;
      }).join("\n");
      await reply(`💹 *Top 10 Cryptocurrencies*\n\n${list}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch crypto data. Try again later.${FOOTER}`);
    }
  },
});

// ── CURRENCY EXCHANGE (open.er-api.com — free) ───────────────────────────────

registerCommand({
  name: "currency",
  aliases: ["convert", "exchange", "forex", "rate"],
  category: "Tools",
  description: "Convert currency (.currency 100 USD KES)",
  usage: ".currency <amount> <from> <to>",
  handler: async ({ args, reply }) => {
    if (args.length < 3) return reply(`❓ Usage: .currency <amount> <from> <to>\nExample: .currency 100 USD KES\nExample: .currency 50 EUR GBP${FOOTER}`);
    const amount = parseFloat(args[0]);
    const from = args[1].toUpperCase();
    const to = args[2].toUpperCase();
    if (isNaN(amount) || amount <= 0) return reply(`❌ Invalid amount. Example: .currency 100 USD KES${FOOTER}`);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, { signal: AbortSignal.timeout(10000) });
      const d = await res.json() as any;
      if (d.result !== "success") throw new Error("failed");
      const rate = d.rates?.[to];
      if (!rate) throw new Error("currency not found");
      const converted = (amount * rate).toFixed(2);
      await reply(
        `💱 *Currency Exchange*\n\n` +
        `🔢 ${amount} ${from} = *${converted} ${to}*\n\n` +
        `📊 Rate: 1 ${from} = ${rate.toFixed(4)} ${to}\n` +
        `🕒 Updated: ${new Date().toLocaleDateString()}${FOOTER}`
      );
    } catch {
      await reply(`❌ Could not convert *${from} → ${to}*. Check currency codes.\n\nExamples: USD, EUR, GBP, KES, NGN, GHS, ZAR, JPY, CNY, INR${FOOTER}`);
    }
  },
});

// ── WIKIPEDIA (no key needed) ────────────────────────────────────────────────

registerCommand({
  name: "wiki",
  aliases: ["wikipedia", "define3", "wikiinfo", "wikis"],
  category: "Search",
  description: "Get a Wikipedia summary (.wiki Elon Musk)",
  usage: ".wiki <topic>",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply(`❓ Usage: .wiki <topic>\nExample: .wiki Elon Musk${FOOTER}`);
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=search&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`,
        { signal: AbortSignal.timeout(8000) }
      );
      const searchData = await searchRes.json() as any;
      const firstResult = searchData.query?.search?.[0]?.title;
      if (!firstResult) throw new Error("not found");
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstResult)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const d = await res.json() as any;
      if (!d.extract) throw new Error("no content");
      const extract = d.extract.length > 800 ? d.extract.slice(0, 800) + "..." : d.extract;
      await reply(
        `📚 *${d.title}*\n\n${extract}\n\n🔗 ${d.content_urls?.desktop?.page || "https://wikipedia.org"}${FOOTER}`
      );
    } catch {
      await reply(`❌ Nothing found for *${query}* on Wikipedia. Try a different search.${FOOTER}`);
    }
  },
});

// ── BIBLE VERSE (bible-api.com — free) ──────────────────────────────────────

registerCommand({
  name: "bible",
  aliases: ["verse", "bibleverse", "scripture", "biblequote"],
  category: "Religion",
  description: "Get a Bible verse (.bible john 3:16)",
  usage: ".bible <book chapter:verse>",
  handler: async ({ args, reply }) => {
    const ref = args.join(" ") || "john 3:16";
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}`, { signal: AbortSignal.timeout(8000) });
      const d = await res.json() as any;
      if (d.error || !d.text) throw new Error(d.error || "not found");
      await reply(
        `📖 *${d.reference}*\n\n_"${d.text.trim()}"_${FOOTER}`
      );
    } catch {
      await reply(`❌ Verse not found. Try: .bible john 3:16 or .bible romans 8:28${FOOTER}`);
    }
  },
});

// ── QURAN (alquran.cloud — free) ────────────────────────────────────────────

registerCommand({
  name: "quran",
  aliases: ["surah", "ayah", "quranverse", "islamquote"],
  category: "Religion",
  description: "Get a Quran verse in English (.quran 2:255 / .quran random)",
  usage: ".quran <surah:ayah> or .quran random",
  handler: async ({ args, reply }) => {
    const input = args.join("").toLowerCase();
    try {
      let ayahNum: string;
      if (!input || input === "random") {
        ayahNum = String(Math.floor(Math.random() * 6236) + 1);
      } else if (input.includes(":")) {
        const [s, a] = input.split(":");
        ayahNum = `${s}:${a}`;
      } else {
        ayahNum = input;
      }
      const [arabicRes, enRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahNum}`, { signal: AbortSignal.timeout(8000) }),
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahNum}/en.sahih`, { signal: AbortSignal.timeout(8000) }),
      ]);
      const arabic = await arabicRes.json() as any;
      const en = await enRes.json() as any;
      if (arabic.code !== 200 || !arabic.data) throw new Error("not found");
      const d = arabic.data;
      const eng = en.data?.text || "";
      await reply(
        `📿 *Quran — Surah ${d.surah.englishName} (${d.surah.name}) ${d.surah.number}:${d.numberInSurah}*\n\n` +
        `*Arabic:* ${d.text}\n\n` +
        `*English (Sahih):* _"${eng}"_${FOOTER}`
      );
    } catch {
      await reply(`❌ Ayah not found. Try: .quran 2:255 or .quran random\n\nFormat: .quran <surah>:<ayah>${FOOTER}`);
    }
  },
});

// ── ANIME INFO (Jikan — MyAnimeList, free) ───────────────────────────────────

registerCommand({
  name: "anime",
  aliases: ["animeinfo", "anisearch", "animelookup", "mal"],
  category: "Anime",
  description: "Look up any anime (.anime naruto)",
  usage: ".anime <name>",
  handler: async ({ reply, args }) => {
    const query = args.join(" ");
    if (!query) return reply(`❓ Usage: .anime <name>\nExample: .anime naruto${FOOTER}`);
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`,
        { signal: AbortSignal.timeout(10000) }
      );
      const d = await res.json() as any;
      const a = d.data?.[0];
      if (!a) throw new Error("not found");
      await reply(
        `🎌 *${a.title}*${a.title_english && a.title_english !== a.title ? ` (${a.title_english})` : ""}\n\n` +
        `⭐ *Score:* ${a.score || "N/A"}/10  🏆 *Rank:* #${a.rank || "N/A"}\n` +
        `📺 *Type:* ${a.type || "N/A"}  📅 *Year:* ${a.year || a.aired?.prop?.from?.year || "N/A"}\n` +
        `🎬 *Episodes:* ${a.episodes || "?"} ${a.status ? `(${a.status})` : ""}\n` +
        `🏷️ *Genres:* ${a.genres?.map((g: any) => g.name).join(", ") || "N/A"}\n\n` +
        `📝 *Synopsis:*\n${(a.synopsis || "No description available.").slice(0, 400)}${(a.synopsis?.length || 0) > 400 ? "..." : ""}\n\n` +
        `🔗 ${a.url}${FOOTER}`
      );
    } catch {
      await reply(`❌ Anime *${query}* not found. Try a different name.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "topanime",
  aliases: ["bestanime", "animetop", "animerank"],
  category: "Anime",
  description: "Show the top 10 rated anime of all time",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://api.jikan.moe/v4/top/anime?limit=10", { signal: AbortSignal.timeout(10000) });
      const d = await res.json() as any;
      const list = d.data?.map((a: any, i: number) =>
        `${i + 1}. *${a.title}* — ⭐${a.score} (${a.type}, ${a.episodes || "?"}ep)`
      ).join("\n");
      await reply(`🏆 *Top 10 Anime (MAL)*\n\n${list}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch anime rankings. Try again.${FOOTER}`);
    }
  },
});

// ── URL SHORTENER (tinyurl — free, no key) ───────────────────────────────────

registerCommand({
  name: "tinyurl",
  aliases: ["shorten", "shortlink", "shortenurl", "urlshorten"],
  category: "Tools",
  description: "Shorten any long URL (.tinyurl https://example.com/very-long-url)",
  usage: ".tinyurl <url>",
  handler: async ({ args, reply }) => {
    const url = args[0];
    if (!url || !url.startsWith("http")) return reply(`❓ Usage: .tinyurl <url>\nExample: .tinyurl https://example.com/page${FOOTER}`);
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) });
      const short = await res.text();
      if (!short.startsWith("https://")) throw new Error("failed");
      await reply(
        `🔗 *URL Shortener*\n\n📎 Original: ${url.slice(0, 60)}${url.length > 60 ? "..." : ""}\n✂️ Short: *${short}*${FOOTER}`
      );
    } catch {
      await reply(`❌ Could not shorten URL. Make sure it starts with https://${FOOTER}`);
    }
  },
});

// ── USELESS FACT ─────────────────────────────────────────────────────────────

registerCommand({
  name: "fact",
  aliases: ["uselessfact", "randomfact", "funfact", "didfact"],
  category: "Fun",
  description: "Get a random interesting fact",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en", { signal: AbortSignal.timeout(8000) });
      const d = await res.json() as any;
      await reply(`🧠 *Random Fact*\n\n${d.text}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch fact. Try again.${FOOTER}`);
    }
  },
});

// ── BORED ACTIVITY GENERATOR ─────────────────────────────────────────────────

registerCommand({
  name: "activity",
  aliases: ["bored", "borednow", "dosomething", "idea"],
  category: "Fun",
  description: "Get a random activity suggestion when you're bored",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://bored-api.appbrewery.com/random", { signal: AbortSignal.timeout(8000) });
      const d = await res.json() as any;
      const typeEmoji: Record<string, string> = {
        education: "📚", recreational: "🎮", social: "👥", diy: "🔧",
        charity: "❤️", cooking: "🍳", relaxation: "😌", music: "🎵",
        busywork: "📋",
      };
      const emoji = typeEmoji[d.type] || "💡";
      await reply(
        `${emoji} *Activity Idea*\n\n${d.activity}\n\n` +
        `🏷️ Type: ${d.type}\n` +
        `👥 Participants: ${d.participants}\n` +
        `💰 Cost: ${d.price === 0 ? "Free!" : "$".repeat(Math.ceil(d.price * 3))}${FOOTER}`
      );
    } catch {
      await reply(`❌ Could not get activity. Try again.${FOOTER}`);
    }
  },
});

// ── COCKTAIL / DRINK RECIPE ──────────────────────────────────────────────────

registerCommand({
  name: "cocktail",
  aliases: ["drink", "recipe", "randomdrink", "drinkrecipe"],
  category: "Fun",
  description: "Get a random cocktail/drink recipe",
  handler: async ({ args, reply }) => {
    try {
      let res;
      if (args.length > 0) {
        const q = args.join(" ");
        res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8000) });
      } else {
        res = await fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php", { signal: AbortSignal.timeout(8000) });
      }
      const d = await res.json() as any;
      const drink = d.drinks?.[0];
      if (!drink) throw new Error("not found");
      const ingredients: string[] = [];
      for (let i = 1; i <= 15; i++) {
        const ing = drink[`strIngredient${i}`];
        const msr = drink[`strMeasure${i}`];
        if (ing) ingredients.push(`• ${msr ? msr.trim() + " " : ""}${ing}`);
      }
      const instr = drink.strInstructions?.slice(0, 300) || "No instructions.";
      await reply(
        `🍹 *${drink.strDrink}*\n\n` +
        `🥃 *Glass:* ${drink.strGlass || "Any"}\n` +
        `🏷️ *Category:* ${drink.strCategory || "N/A"}\n\n` +
        `🧪 *Ingredients:*\n${ingredients.join("\n")}\n\n` +
        `📋 *Instructions:*\n${instr}${instr.length === 300 ? "..." : ""}${FOOTER}`
      );
    } catch {
      await reply(`❌ Drink not found. Try .cocktail margarita or just .cocktail for random.${FOOTER}`);
    }
  },
});

// ── POKEDEX (PokéAPI — free) ─────────────────────────────────────────────────

registerCommand({
  name: "pokedex",
  aliases: ["pokemon2", "pokesearch", "pokeinfo"],
  category: "Fun",
  description: "Look up any Pokémon (.pokedex pikachu)",
  usage: ".pokedex <name or number>",
  handler: async ({ args, reply, sock, from, msg }) => {
    const input = args.join("").toLowerCase() || "pikachu";
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(input)}`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error("not found");
      const p = await res.json() as any;
      const types = p.types?.map((t: any) => t.type.name).join(", ") || "N/A";
      const abilities = p.abilities?.map((a: any) => a.ability.name).join(", ") || "N/A";
      const stats = p.stats?.map((s: any) => `• ${s.stat.name}: ${s.base_stat}`).join("\n") || "";
      const imgUrl = p.sprites?.other?.["official-artwork"]?.front_default || p.sprites?.front_default;
      const caption =
        `🔴 *Pokédex #${p.id} — ${p.name.toUpperCase()}*\n\n` +
        `⚡ *Types:* ${types}\n` +
        `🏋️ *Height:* ${(p.height / 10).toFixed(1)}m  Weight: ${(p.weight / 10).toFixed(1)}kg\n` +
        `💫 *Abilities:* ${abilities}\n\n` +
        `📊 *Base Stats:*\n${stats}${FOOTER}`;
      if (imgUrl) {
        await sock.sendMessage(from, { image: { url: imgUrl }, caption }, { quoted: msg });
      } else {
        await reply(caption);
      }
    } catch {
      await reply(`❌ Pokémon *${input}* not found. Try: .pokedex pikachu${FOOTER}`);
    }
  },
});

// ── COLOR INFO ────────────────────────────────────────────────────────────────

registerCommand({
  name: "color",
  aliases: ["colorinfo", "hexcolor", "rgbcolor", "colorfind"],
  category: "Tools",
  description: "Get info about a color (.color FF5733)",
  usage: ".color <hex>",
  handler: async ({ args, reply }) => {
    const hex = args[0]?.replace("#", "") || "FF5733";
    try {
      const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`, { signal: AbortSignal.timeout(8000) });
      const d = await res.json() as any;
      await reply(
        `🎨 *Color Info*\n\n` +
        `🖌️ *Name:* ${d.name?.value || "Unknown"}\n` +
        `#️⃣ *Hex:* ${d.hex?.value || "#" + hex}\n` +
        `🔴 *RGB:* ${d.rgb?.value || "N/A"}\n` +
        `🟡 *HSL:* ${d.hsl?.value || "N/A"}\n` +
        `🔵 *HSV:* ${d.hsv?.value || "N/A"}\n` +
        `🖼️ *CMYK:* ${d.cmyk?.value || "N/A"}\n\n` +
        `🌈 Preview: https://www.thecolorapi.com/id?hex=${hex}&format=svg${FOOTER}`
      );
    } catch {
      await reply(`❌ Invalid color. Use a hex code like FF5733 or 00BFFF${FOOTER}`);
    }
  },
});

// ── RANDOM USER AVATAR ────────────────────────────────────────────────────────

registerCommand({
  name: "avatar",
  aliases: ["randomavatar", "genface", "aiface", "generateavatar"],
  category: "Photo",
  description: "Generate a random AI avatar (.avatar / .avatar seed:MAXX)",
  usage: ".avatar [seed]",
  handler: async ({ args, reply, sock, from, msg }) => {
    const seed = args.join("") || Math.random().toString(36).slice(2, 10);
    const styles = ["adventurer", "avataaars", "big-ears", "bottts", "croodles", "fun-emoji", "lorelei", "micah", "miniavs", "notionists", "open-peeps", "personas", "pixel-art", "rings", "shapes", "thumbs"];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=200`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error("failed");
      const svgText = await res.text();
      // Convert SVG to PNG via a service
      const pngUrl = `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=256`;
      await sock.sendMessage(from, {
        image: { url: pngUrl },
        caption: `🎭 *AI Avatar*\n\n🎨 Style: ${style}\n🌱 Seed: ${seed}${FOOTER}`
      }, { quoted: msg });
    } catch {
      await reply(`🔗 *Avatar Generated!*\n\n${url}\n\nOpen the link to view your avatar.${FOOTER}`);
    }
  },
});

// ── CALCULATOR (safe math eval) ───────────────────────────────────────────────

registerCommand({
  name: "calc",
  aliases: ["calculate", "math", "solve", "calculator"],
  category: "Tools",
  description: "Calculate a math expression (.calc 15 * 3 + 7)",
  usage: ".calc <expression>",
  handler: async ({ args, reply }) => {
    const expr = args.join(" ");
    if (!expr) return reply(`❓ Usage: .calc <expression>\nExample: .calc 15 * 3 + 7\nExample: .calc (100 / 4) ** 2${FOOTER}`);
    try {
      // Safe math eval — only allow math characters
      const safe = expr.replace(/[^0-9+\-*/().\s%^]/g, "").trim();
      if (!safe) throw new Error("invalid");
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${safe.replace(/\^/g, "**")})`)();
      if (typeof result !== "number" || !isFinite(result)) throw new Error("invalid result");
      await reply(
        `🔢 *Calculator*\n\n` +
        `📝 Input: \`${expr}\`\n` +
        `✅ Result: *${result.toLocaleString()}*${FOOTER}`
      );
    } catch {
      await reply(`❌ Invalid expression. Only numbers and: + - * / ( ) % ^${FOOTER}`);
    }
  },
});

// ── AGE / DATE CALCULATOR ─────────────────────────────────────────────────────

registerCommand({
  name: "age",
  aliases: ["myage", "birthday", "howold", "calcage"],
  category: "Tools",
  description: "Calculate age from a birthdate (.age 1998-05-15)",
  usage: ".age <YYYY-MM-DD>",
  handler: async ({ args, reply }) => {
    const input = args[0];
    if (!input) return reply(`❓ Usage: .age <date>\nExample: .age 1998-05-15\nExample: .age 2000-01-30${FOOTER}`);
    try {
      const birth = new Date(input);
      if (isNaN(birth.getTime())) throw new Error("invalid date");
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();
      if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
      if (months < 0) { years--; months += 12; }
      const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
      if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
      const daysUntil = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const zodiac = getZodiac(birth.getMonth() + 1, birth.getDate());
      await reply(
        `🎂 *Age Calculator*\n\n` +
        `📅 Birthday: ${birth.toDateString()}\n` +
        `🎉 Age: *${years} years, ${months} months, ${days} days*\n` +
        `📆 Total Days Lived: *${totalDays.toLocaleString()}*\n` +
        `🎈 Next Birthday: *${daysUntil} days* (${nextBirthday.toDateString()})\n` +
        `⭐ Zodiac Sign: *${zodiac}*${FOOTER}`
      );
    } catch {
      await reply(`❌ Invalid date. Use format: .age YYYY-MM-DD\nExample: .age 1995-07-23${FOOTER}`);
    }
  },
});

function getZodiac(month: number, day: number): string {
  const signs = [
    ["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20],
    ["Aries", 4, 19], ["Taurus", 5, 20], ["Gemini", 6, 20],
    ["Cancer", 7, 22], ["Leo", 8, 22], ["Virgo", 9, 22],
    ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21],
  ] as const;
  for (const [sign, m, d] of signs) {
    if (month === m && day <= d) return sign;
    if (month === m + 1 && day <= 1) return signs[m]?.[0] || "Capricorn";
  }
  return "Capricorn";
}

// ── PASSWORD GENERATOR ────────────────────────────────────────────────────────

registerCommand({
  name: "password",
  aliases: ["genpassword", "generatepassword", "passgen", "strongpass"],
  category: "Tools",
  description: "Generate a strong random password (.password 16)",
  usage: ".password [length]",
  handler: async ({ args, reply }) => {
    const len = Math.min(64, Math.max(8, parseInt(args[0] || "16")));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}";
    let pass = "";
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    const strength = len >= 20 ? "💪 Very Strong" : len >= 16 ? "✅ Strong" : len >= 12 ? "⚠️ Medium" : "❌ Weak";
    await reply(
      `🔐 *Password Generator*\n\n` +
      `🔑 Password: \`${pass}\`\n` +
      `📏 Length: ${len} characters\n` +
      `💪 Strength: ${strength}\n\n` +
      `_Don't share this with anyone!_${FOOTER}`
    );
  },
});

// ── RANDOM NUMBER ─────────────────────────────────────────────────────────────

registerCommand({
  name: "random",
  aliases: ["randomnum", "rollnum", "numgen", "randnum"],
  category: "Fun",
  description: "Generate a random number (.random 1 100)",
  usage: ".random [min] [max]",
  handler: async ({ args, reply }) => {
    const min = parseInt(args[0] || "1");
    const max = parseInt(args[1] || "100");
    if (isNaN(min) || isNaN(max) || min >= max) return reply(`❓ Usage: .random <min> <max>\nExample: .random 1 100${FOOTER}`);
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    await reply(`🎲 *Random Number*\n\nRange: ${min} → ${max}\nResult: *${num}*${FOOTER}`);
  },
});

// ── WORD COUNT / TEXT TOOLS ───────────────────────────────────────────────────

registerCommand({
  name: "wordcount",
  aliases: ["wc", "charcount", "textcount", "countwords"],
  category: "Tools",
  description: "Count words, characters, and sentences in text",
  usage: ".wordcount <text>",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .wordcount <text>\nExample: .wordcount Hello World this is a test${FOOTER}`);
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const readTime = Math.ceil(words / 200);
    await reply(
      `📊 *Text Analysis*\n\n` +
      `📝 *Words:* ${words}\n` +
      `🔤 *Characters:* ${chars}\n` +
      `🔡 *Chars (no spaces):* ${charsNoSpace}\n` +
      `💬 *Sentences:* ${sentences}\n` +
      `⏱️ *Read Time:* ~${readTime} min${FOOTER}`
    );
  },
});
