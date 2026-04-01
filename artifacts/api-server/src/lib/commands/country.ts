import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── Country Info ─────────────────────────────────────────────────────────────

registerCommand({
  name: "country",
  aliases: ["countryinfo", "nation"],
  category: "Search",
  description: "Get detailed info about any country (.country Kenya)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .country <name>\nExample: .country Kenya`);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}?fullText=false`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json() as any;
      const c = data[0];
      const langs = Object.values(c.languages || {}).join(", ");
      const currencies = Object.values(c.currencies || {}).map((x: any) => `${x.name} (${x.symbol})`).join(", ");
      const capital = c.capital?.[0] || "N/A";
      const region = `${c.region} / ${c.subregion}`;
      const pop = (c.population || 0).toLocaleString();
      const area = (c.area || 0).toLocaleString();
      const timezones = c.timezones?.slice(0, 3).join(", ");
      const flag = c.flag || "🏴";
      const borders = c.borders?.slice(0, 5).join(", ") || "None (island/standalone)";
      const text =
        `${flag} *${c.name?.common}* (${c.name?.official})\n\n` +
        `🏛️ *Capital:* ${capital}\n` +
        `🌍 *Region:* ${region}\n` +
        `👥 *Population:* ${pop}\n` +
        `📐 *Area:* ${area} km²\n` +
        `🗣️ *Languages:* ${langs}\n` +
        `💵 *Currency:* ${currencies}\n` +
        `🕐 *Timezones:* ${timezones}\n` +
        `🛂 *Borders:* ${borders}\n` +
        `📞 *Calling code:* +${c.idd?.root}${c.idd?.suffixes?.[0] || ""}`;
      const flagUrl = c.flags?.png;
      if (flagUrl) {
        await sock.sendMessage(from, { image: { url: flagUrl }, caption: text + FOOTER }, { quoted: msg });
      } else {
        await reply(text + FOOTER);
      }
    } catch {
      await reply(`❌ Country *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "capital",
  aliases: ["getcapital", "capcity"],
  category: "Search",
  description: "Get the capital city of a country (.capital Japan)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .capital <country>\nExample: .capital France`);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`);
      const data = await res.json() as any;
      const c = data[0];
      await reply(`🏛️ *Capital of ${c.name?.common}*\n\n📍 ${c.capital?.[0] || "N/A"}${FOOTER}`);
    } catch {
      await reply(`❌ Country *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "flag",
  aliases: ["countryflag", "getflag"],
  category: "Search",
  description: "Get a country's flag image (.flag Nigeria)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .flag <country>\nExample: .flag Nigeria`);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`);
      const data = await res.json() as any;
      const c = data[0];
      const flagUrl = c.flags?.png;
      if (!flagUrl) return reply(`❌ No flag found for ${q}.${FOOTER}`);
      await sock.sendMessage(from, { image: { url: flagUrl }, caption: `${c.flag || "🏴"} *Flag of ${c.name?.common}*${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Country *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "currency2",
  aliases: ["convert2", "exchange"],
  category: "Converter",
  description: "Convert currency live (.currency2 100 USD KES)",
  handler: async ({ args, reply }) => {
    const amount = parseFloat(args[0]);
    const from2 = args[1]?.toUpperCase();
    const to   = args[2]?.toUpperCase();
    if (isNaN(amount) || !from2 || !to) return reply(`❓ Usage: .currency2 <amount> <from> <to>\nExample: .currency2 100 USD KES`);
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from2}`);
      const data = await res.json() as any;
      const rate = data.rates?.[to];
      if (!rate) throw new Error("rate not found");
      const result = (amount * rate).toFixed(2);
      await reply(`💱 *Currency Exchange*\n\n${amount} *${from2}* = *${result} ${to}*\n\n📊 Rate: 1 ${from2} = ${rate.toFixed(4)} ${to}\n🕐 Updated: ${new Date(data.date).toDateString()}${FOOTER}`);
    } catch {
      await reply(`❌ Could not convert ${from2} to ${to}. Check the currency codes.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "population",
  aliases: ["pop", "countrypop"],
  category: "Search",
  description: "Get population of a country (.population China)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .population <country>`);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`);
      const data = await res.json() as any;
      const c = data[0];
      await reply(`👥 *Population: ${c.name?.common}*\n\n🔢 ${c.population.toLocaleString()} people\n🌍 Region: ${c.region}${FOOTER}`);
    } catch {
      await reply(`❌ Country *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "languages",
  aliases: ["countrylangs", "spokelang"],
  category: "Search",
  description: "Get official languages of a country (.languages South Africa)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .languages <country>`);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`);
      const data = await res.json() as any;
      const c = data[0];
      const langs = Object.values(c.languages || {}).join(", ");
      await reply(`🗣️ *Languages: ${c.name?.common}*\n\n${langs}${FOOTER}`);
    } catch {
      await reply(`❌ Country *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "borders",
  aliases: ["borderingcountries", "neighbours"],
  category: "Search",
  description: "Get countries that border a given country (.borders Germany)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .borders <country>`);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`);
      const data = await res.json() as any;
      const c = data[0];
      const borders = c.borders || [];
      if (!borders.length) return reply(`🏝️ *${c.name?.common}* has no land borders (island or standalone).${FOOTER}`);
      await reply(`🗺️ *Countries bordering ${c.name?.common}*:\n\n${borders.map((b: string) => `• ${b}`).join("\n")}${FOOTER}`);
    } catch {
      await reply(`❌ Country *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "countryquiz",
  aliases: ["geoguess", "capitalquiz"],
  category: "Games",
  description: "Capital city quiz — guess the capital of a random country!",
  handler: async ({ from, sock, reply }) => {
    try {
      const res = await fetch("https://restcountries.com/v3.1/all?fields=name,capital,flag");
      const data = await res.json() as any;
      const valid = data.filter((c: any) => c.capital?.length && c.name?.common);
      const c = valid[Math.floor(Math.random() * valid.length)];
      const options = [c.capital[0]];
      while (options.length < 4) {
        const rand = valid[Math.floor(Math.random() * valid.length)];
        if (rand.capital?.[0] && !options.includes(rand.capital[0])) options.push(rand.capital[0]);
      }
      options.sort(() => Math.random() - 0.5);
      const letters = ["A", "B", "C", "D"];
      const answerLetter = letters[options.indexOf(c.capital[0])];
      const list = options.map((o, i) => `${letters[i]}. ${o}`).join("\n");
      await reply(`${c.flag} *Capital Quiz!*\n\nWhat is the capital of *${c.name.common}*?\n\n${list}\n\n||✅ Answer: ${answerLetter}. ${c.capital[0]}||${FOOTER}`);
    } catch {
      await reply(`❌ Could not load quiz.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "worldfacts",
  aliases: ["globalfact", "earthfact"],
  category: "Search",
  description: "Get a random world fact",
  handler: async ({ reply }) => {
    const facts = [
      "Vatican City is the smallest country in the world — just 0.44 km².",
      "Russia has 11 time zones, more than any other country.",
      "Canada has the longest coastline — over 202,080 km.",
      "China borders 14 countries, the most of any nation.",
      "Australia is the only country that is also a continent.",
      "The Nile (6,650 km) and Amazon (6,400 km) compete for the title of world's longest river.",
      "More than 7,000 languages are spoken on Earth today.",
      "The world population hit 8 billion in November 2022.",
      "60% of the world's population lives in Asia.",
      "Iceland has no mosquitoes — it's the only country without any.",
      "Monaco is the most densely populated country in the world.",
      "Bhutan measures its success by Gross National Happiness, not GDP.",
    ];
    await reply(`🌍 *World Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
  },
});

// ── Weather (using wttr.in — free, no key) ─────────────────────────────────────

registerCommand({
  name: "weather",
  aliases: ["wthr", "forecast"],
  category: "Search",
  description: "Get weather for any city (.weather Nairobi)",
  handler: async ({ args, reply }) => {
    const city = args.join(" ");
    if (!city) return reply(`❓ Usage: .weather <city>\nExample: .weather Nairobi`);
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      if (!res.ok) throw new Error();
      const data = await res.json() as any;
      const cur = data.current_condition?.[0];
      const area = data.nearest_area?.[0];
      const name = area?.areaName?.[0]?.value || city;
      const country = area?.country?.[0]?.value || "";
      const temp = cur?.temp_C || "?";
      const feels = cur?.FeelsLikeC || "?";
      const desc = cur?.weatherDesc?.[0]?.value || "N/A";
      const humidity = cur?.humidity || "?";
      const wind = cur?.windspeedKmph || "?";
      const windDir = cur?.winddir16Point || "?";
      const visibility = cur?.visibility || "?";
      const uv = cur?.uvIndex || "?";
      const today = data.weather?.[0];
      const maxT = today?.maxtempC || "?";
      const minT = today?.mintempC || "?";
      await reply(
        `🌤️ *Weather: ${name}, ${country}*\n\n` +
        `🌡️ *Temp:* ${temp}°C (feels like ${feels}°C)\n` +
        `☁️ *Condition:* ${desc}\n` +
        `💧 *Humidity:* ${humidity}%\n` +
        `💨 *Wind:* ${wind} km/h ${windDir}\n` +
        `👁️ *Visibility:* ${visibility} km\n` +
        `☀️ *UV Index:* ${uv}\n` +
        `📈 *High:* ${maxT}°C  📉 *Low:* ${minT}°C${FOOTER}`
      );
    } catch {
      await reply(`❌ Weather for *${city}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "weather3day",
  aliases: ["forecast3", "3dayweather"],
  category: "Search",
  description: "Get 3-day weather forecast for any city (.weather3day Lagos)",
  handler: async ({ args, reply }) => {
    const city = args.join(" ");
    if (!city) return reply(`❓ Usage: .weather3day <city>`);
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const data = await res.json() as any;
      const area = data.nearest_area?.[0];
      const name = area?.areaName?.[0]?.value || city;
      const days = data.weather?.slice(0, 3).map((d: any, i: number) => {
        const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Day 3";
        const desc = d.hourly?.[4]?.weatherDesc?.[0]?.value || "N/A";
        return `📅 *${label}*\n   Max: ${d.maxtempC}°C / Min: ${d.mintempC}°C\n   ☁️ ${desc}`;
      }).join("\n\n");
      await reply(`📅 *3-Day Forecast: ${name}*\n\n${days}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch forecast for *${city}*.${FOOTER}`);
    }
  },
});

// ── News Headlines ─────────────────────────────────────────────────────────────

registerCommand({
  name: "news",
  aliases: ["headlines", "topnews"],
  category: "Search",
  description: "Get top news headlines",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://gnews.io/api/v4/top-headlines?lang=en&max=5&apikey=0d2a3aef0a1fd27e60b3eed2d0e24e41");
      if (!res.ok) throw new Error();
      const data = await res.json() as any;
      const articles = data.articles?.slice(0, 5);
      if (!articles?.length) throw new Error();
      const list = articles.map((a: any, i: number) =>
        `${i + 1}. *${a.title}*\n   📰 ${a.source?.name || "News"} | 🕐 ${new Date(a.publishedAt).toLocaleDateString()}`
      ).join("\n\n");
      await reply(`📰 *Top Headlines*\n\n${list}${FOOTER}`);
    } catch {
      // Fallback: scrape a simple news feed
      await reply(`📰 *Top News* (visit for live updates)\n\n🌐 BBC: https://bbc.com/news\n🌐 CNN: https://cnn.com\n🌐 Reuters: https://reuters.com\n🌐 Al Jazeera: https://aljazeera.com${FOOTER}`);
    }
  },
});

registerCommand({
  name: "maplink",
  aliases: ["map", "getmap"],
  category: "Search",
  description: "Get a Google Maps link for any place (.maplink Eiffel Tower Paris)",
  handler: async ({ args, reply }) => {
    const place = args.join(" ");
    if (!place) return reply(`❓ Usage: .maplink <place>\nExample: .maplink Eiffel Tower Paris`);
    const url = `https://www.google.com/maps/search/${encodeURIComponent(place)}`;
    await reply(`🗺️ *Map: ${place}*\n\n📍 ${url}${FOOTER}`);
  },
});

registerCommand({
  name: "timezone2",
  aliases: ["tz", "worldtime"],
  category: "Search",
  description: "Get current time in any city/timezone (.timezone2 Tokyo)",
  handler: async ({ args, reply }) => {
    const tz = args.join("_") || "Africa/Nairobi";
    try {
      const res = await fetch(`https://worldtimeapi.org/api/timezone/${tz}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as any;
      const dt = new Date(data.datetime);
      await reply(
        `🕐 *Time in ${tz}*\n\n` +
        `📅 *Date:* ${dt.toDateString()}\n` +
        `⏰ *Time:* ${dt.toLocaleTimeString()}\n` +
        `🌐 *UTC Offset:* ${data.utc_offset}\n` +
        `☀️ *Day of week:* ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dt.getDay()]}${FOOTER}`
      );
    } catch {
      const now = new Date();
      await reply(`🕐 *Current UTC Time*\n\n${now.toUTCString()}\n\n_Available zones: Africa/Nairobi, Europe/London, America/New_York, Asia/Tokyo_${FOOTER}`);
    }
  },
});
