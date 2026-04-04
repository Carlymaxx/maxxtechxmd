import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";
const P = (p: string, cmd: string) => `${p}${cmd}`;

// ── Converters ────────────────────────────────────────────────────────────────

registerCommand({
  name: "temp",
  aliases: ["tempconv", "celsius", "fahrenheit"],
  category: "Converter",
  description: "Convert temperature between C, F, K",
  handler: async ({ args, reply }) => {
    const val = parseFloat(args[0]);
    const from = args[1]?.toUpperCase();
    const to = args[2]?.toUpperCase();
    if (isNaN(val) || !from || !to) return reply(`❓ Usage: .temp <value> <from> <to>\nExamples:\n  .temp 100 C F\n  .temp 32 F C\n  .temp 300 K C\nUnits: C, F, K`);
    let celsius: number;
    if (from === "C") celsius = val;
    else if (from === "F") celsius = (val - 32) * 5 / 9;
    else if (from === "K") celsius = val - 273.15;
    else return reply("❌ Invalid unit. Use C, F, or K");
    let result: number;
    if (to === "C") result = celsius;
    else if (to === "F") result = celsius * 9 / 5 + 32;
    else if (to === "K") result = celsius + 273.15;
    else return reply("❌ Invalid unit. Use C, F, or K");
    await reply(`🌡️ *Temperature Converter*\n\n${val}°${from} = *${result.toFixed(2)}°${to}*${FOOTER}`);
  },
});

registerCommand({
  name: "weight",
  aliases: ["weightconv", "kg", "lbs"],
  category: "Converter",
  description: "Convert weight (kg, lbs, g, oz, st)",
  handler: async ({ args, reply }) => {
    const val = parseFloat(args[0]);
    const from = args[1]?.toLowerCase();
    const to = args[2]?.toLowerCase();
    if (isNaN(val) || !from || !to) return reply(`❓ Usage: .weight <value> <from> <to>\nExample: .weight 70 kg lbs\nUnits: kg, lbs, g, oz, st (stone)`);
    const toKg: Record<string, number> = { kg: 1, lbs: 0.453592, g: 0.001, oz: 0.0283495, st: 6.35029 };
    if (!toKg[from] || !toKg[to]) return reply(`❌ Unknown unit. Use: kg, lbs, g, oz, st`);
    const result = (val * toKg[from]) / toKg[to];
    await reply(`⚖️ *Weight Converter*\n\n${val} ${from} = *${result.toFixed(4)} ${to}*${FOOTER}`);
  },
});

registerCommand({
  name: "speed",
  aliases: ["speedconv", "kmh", "mph"],
  category: "Converter",
  description: "Convert speed (kmh, mph, ms, knots)",
  handler: async ({ args, reply }) => {
    const val = parseFloat(args[0]);
    const from = args[1]?.toLowerCase();
    const to = args[2]?.toLowerCase();
    if (isNaN(val) || !from || !to) return reply(`❓ Usage: .speed <value> <from> <to>\nExample: .speed 100 kmh mph\nUnits: kmh, mph, ms, knots`);
    const toMs: Record<string, number> = { kmh: 1 / 3.6, mph: 0.44704, ms: 1, knots: 0.514444, kph: 1 / 3.6 };
    if (!toMs[from] || !toMs[to]) return reply(`❌ Unknown unit. Use: kmh, mph, ms, knots`);
    const result = (val * toMs[from]) / toMs[to];
    await reply(`🚀 *Speed Converter*\n\n${val} ${from} = *${result.toFixed(4)} ${to}*${FOOTER}`);
  },
});

registerCommand({
  name: "length",
  aliases: ["distance", "meter", "feet", "cm"],
  category: "Converter",
  description: "Convert length/distance (km, m, cm, mm, mi, ft, in, yd)",
  handler: async ({ args, reply }) => {
    const val = parseFloat(args[0]);
    const from = args[1]?.toLowerCase();
    const to = args[2]?.toLowerCase();
    if (isNaN(val) || !from || !to) return reply(`❓ Usage: .length <value> <from> <to>\nExample: .length 5 km mi\nUnits: km, m, cm, mm, mi, ft, in, yd`);
    const toM: Record<string, number> = { km: 1000, m: 1, cm: 0.01, mm: 0.001, mi: 1609.34, ft: 0.3048, "in": 0.0254, yd: 0.9144 };
    if (!toM[from] || !toM[to]) return reply(`❌ Unknown unit. Use: km, m, cm, mm, mi, ft, in, yd`);
    const result = (val * toM[from]) / toM[to];
    await reply(`📏 *Length Converter*\n\n${val} ${from} = *${result.toFixed(6)} ${to}*${FOOTER}`);
  },
});

registerCommand({
  name: "data",
  aliases: ["dataconv", "bytes", "mb", "gb"],
  category: "Converter",
  description: "Convert data sizes (B, KB, MB, GB, TB)",
  handler: async ({ args, reply }) => {
    const val = parseFloat(args[0]);
    const from = args[1]?.toUpperCase();
    const to = args[2]?.toUpperCase();
    if (isNaN(val) || !from || !to) return reply(`❓ Usage: .data <value> <from> <to>\nExample: .data 1 GB MB\nUnits: B, KB, MB, GB, TB`);
    const toB: Record<string, number> = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
    if (!toB[from] || !toB[to]) return reply(`❌ Unknown unit. Use: B, KB, MB, GB, TB`);
    const result = (val * toB[from]) / toB[to];
    await reply(`💾 *Data Size Converter*\n\n${val} ${from} = *${result.toFixed(6)} ${to}*${FOOTER}`);
  },
});

registerCommand({
  name: "age",
  aliases: ["birthday", "howold"],
  category: "Converter",
  description: "Calculate age from date of birth (.age 1990-05-15)",
  handler: async ({ args, reply }) => {
    const dob = args[0];
    if (!dob) return reply(`❓ Usage: .age <YYYY-MM-DD>\nExample: .age 1995-08-20`);
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return reply("❌ Invalid date. Use format YYYY-MM-DD");
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
    const nextBday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
    const daysUntilBday = Math.ceil((nextBday.getTime() - now.getTime()) / 86400000);
    await reply(`🎂 *Age Calculator*\n\n📅 *DOB:* ${dob}\n🎯 *Age:* ${years} years, ${months} months, ${days} days\n📆 *Total days lived:* ${totalDays.toLocaleString()}\n🎉 *Next birthday in:* ${daysUntilBday} days${FOOTER}`);
  },
});

registerCommand({
  name: "bmi",
  aliases: ["bodymass"],
  category: "Converter",
  description: "Calculate BMI (.bmi 70 1.75) — weight kg, height m",
  handler: async ({ args, reply }) => {
    const weight = parseFloat(args[0]);
    const height = parseFloat(args[1]);
    if (isNaN(weight) || isNaN(height) || height <= 0) return reply(`❓ Usage: .bmi <weight_kg> <height_m>\nExample: .bmi 70 1.75`);
    const bmi = weight / (height * height);
    let category = "";
    let emoji = "";
    if (bmi < 18.5) { category = "Underweight"; emoji = "⚠️"; }
    else if (bmi < 25) { category = "Normal weight"; emoji = "✅"; }
    else if (bmi < 30) { category = "Overweight"; emoji = "⚠️"; }
    else { category = "Obese"; emoji = "🔴"; }
    await reply(`⚖️ *BMI Calculator*\n\n👤 *Weight:* ${weight} kg\n📏 *Height:* ${height} m\n📊 *BMI:* ${bmi.toFixed(1)}\n${emoji} *Category:* ${category}\n\n_Healthy range: 18.5 – 24.9_${FOOTER}`);
  },
});

registerCommand({
  name: "percentage",
  aliases: ["percent", "pct"],
  category: "Converter",
  description: "Percentage calculator (.percentage 20 of 150 / .percentage 30 is what of 200)",
  handler: async ({ args, reply }) => {
    const input = args.join(" ").toLowerCase();
    if (!input) return reply(`❓ Usage examples:\n  .percentage 20 of 150\n  .percentage 30 is what of 200\n  .percentage 150 increase 20\n  .percentage 150 decrease 20`);
    if (input.includes("increase")) {
      const [base, , pct] = input.split(" ").map(Number);
      return reply(`📈 ${base} + ${pct}% = *${(base * (1 + pct / 100)).toFixed(2)}*${FOOTER}`);
    }
    if (input.includes("decrease")) {
      const [base, , pct] = input.split(" ").map(Number);
      return reply(`📉 ${base} - ${pct}% = *${(base * (1 - pct / 100)).toFixed(2)}*${FOOTER}`);
    }
    const ofMatch = input.match(/^([\d.]+) of ([\d.]+)$/);
    if (ofMatch) {
      const [, pct, total] = ofMatch.map(Number);
      return reply(`🔢 ${pct}% of ${total} = *${(pct / 100 * total).toFixed(2)}*${FOOTER}`);
    }
    const whatMatch = input.match(/^([\d.]+) is what of ([\d.]+)$/);
    if (whatMatch) {
      const [, part, total] = whatMatch.map(Number);
      return reply(`🔢 ${part} is *${((part / total) * 100).toFixed(2)}%* of ${total}${FOOTER}`);
    }
    await reply(`❓ Usage:\n  .percentage 20 of 150\n  .percentage 30 is what of 200\n  .percentage 150 increase 20\n  .percentage 150 decrease 20`);
  },
});

// ── Info / Lookup ─────────────────────────────────────────────────────────────

registerCommand({
  name: "wiki",
  aliases: ["wikipedia", "search"],
  category: "Search",
  description: "Search Wikipedia for any topic",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply(`❓ Usage: .wiki <topic>\nExample: .wiki Albert Einstein`);
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json() as any;
      const text = data.extract?.slice(0, 800) || "No summary available.";
      const url = data.content_urls?.desktop?.page || "";
      await reply(`📖 *${data.title}*\n\n${text}${text.length >= 800 ? "..." : ""}\n\n🔗 ${url}${FOOTER}`);
    } catch {
      await reply(`❌ Could not find Wikipedia article for *${query}*${FOOTER}`);
    }
  },
});

registerCommand({
  name: "urban",
  aliases: ["ud", "slang"],
  category: "Search",
  description: "Look up slang on Urban Dictionary",
  handler: async ({ args, reply }) => {
    const word = args.join(" ");
    if (!word) return reply(`❓ Usage: .urban <word>\nExample: .urban lit`);
    try {
      const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`);
      const data = await res.json() as any;
      const entry = data.list?.[0];
      if (!entry) return reply(`❌ No definition found for *${word}*${FOOTER}`);
      const def = entry.definition?.replace(/\[|\]/g, "")?.slice(0, 500) || "";
      const ex = entry.example?.replace(/\[|\]/g, "")?.slice(0, 200) || "";
      await reply(`📚 *Urban Dictionary: ${word}*\n\n📖 *Definition:*\n${def}\n\n💬 *Example:*\n${ex || "N/A"}\n\n👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}${FOOTER}`);
    } catch {
      await reply(`❌ Urban Dictionary lookup failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "github",
  aliases: ["ghuser", "gituser"],
  category: "Search",
  description: "Get GitHub user profile info",
  handler: async ({ args, reply }) => {
    const username = args[0];
    if (!username) return reply(`❓ Usage: .github <username>\nExample: .github Carlymaxx`);
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("Not found");
      const d = await res.json() as any;
      await reply(
        `👨‍💻 *GitHub: ${d.name || d.login}*\n\n📛 *Username:* @${d.login}\n📝 *Bio:* ${d.bio || "N/A"}\n📍 *Location:* ${d.location || "N/A"}\n🏢 *Company:* ${d.company || "N/A"}\n\n📦 *Repos:* ${d.public_repos}\n👥 *Followers:* ${d.followers}\n👤 *Following:* ${d.following}\n\n🔗 ${d.html_url}${FOOTER}`
      );
    } catch {
      await reply(`❌ GitHub user *${username}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "npm",
  aliases: ["npmpackage", "npminfo"],
  category: "Search",
  description: "Get info about an NPM package",
  handler: async ({ args, reply }) => {
    const pkg = args[0];
    if (!pkg) return reply(`❓ Usage: .npm <package-name>\nExample: .npm express`);
    try {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`);
      if (!res.ok) throw new Error();
      const d = await res.json() as any;
      const latest = d["dist-tags"]?.latest;
      const v = d.versions?.[latest];
      await reply(
        `📦 *NPM: ${d.name}*\n\n📝 *Description:* ${d.description?.slice(0, 150) || "N/A"}\n📌 *Latest:* ${latest}\n📅 *Updated:* ${new Date(d.time?.modified || "").toLocaleDateString()}\n📥 *License:* ${v?.license || "N/A"}\n👤 *Author:* ${typeof v?.author === "string" ? v.author : v?.author?.name || "N/A"}\n\n🔗 https://npmjs.com/package/${d.name}${FOOTER}`
      );
    } catch {
      await reply(`❌ Package *${pkg}* not found on NPM.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "countryinfo",
  aliases: ["country", "nation"],
  category: "Search",
  description: "Get info about any country (.countryinfo Kenya)",
  handler: async ({ args, reply }) => {
    const name = args.join(" ");
    if (!name) return reply(`❓ Usage: .countryinfo <country>\nExample: .countryinfo Kenya`);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`);
      const data = await res.json() as any;
      const c = data[0];
      if (!c) throw new Error();
      const currencies = Object.values(c.currencies || {}).map((cur: any) => `${cur.name} (${cur.symbol})`).join(", ");
      const langs = Object.values(c.languages || {}).join(", ");
      const capital = c.capital?.[0] || "N/A";
      await reply(
        `🌍 *${c.name.common}*\n\n🏴 *Official:* ${c.name.official}\n🌐 *Region:* ${c.region} — ${c.subregion || ""}\n🏙️ *Capital:* ${capital}\n👥 *Population:* ${(c.population || 0).toLocaleString()}\n📐 *Area:* ${(c.area || 0).toLocaleString()} km²\n💰 *Currency:* ${currencies || "N/A"}\n🗣️ *Languages:* ${langs || "N/A"}\n🕒 *Timezone:* ${c.timezones?.[0] || "N/A"}\n📞 *Dial Code:* +${c.idd?.root || ""}${(c.idd?.suffixes || [])[0] || ""}${FOOTER}`
      );
    } catch {
      await reply(`❌ Country *${name}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "currency",
  aliases: ["fx", "exchange"],
  category: "Converter",
  description: "Convert currency (.currency 100 USD KES)",
  handler: async ({ args, reply }) => {
    const amount = parseFloat(args[0]);
    const from = args[1]?.toUpperCase();
    const to = args[2]?.toUpperCase();
    if (isNaN(amount) || !from || !to) return reply(`❓ Usage: .currency <amount> <from> <to>\nExample: .currency 100 USD KES`);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
      const data = await res.json() as any;
      if (data.result !== "success") throw new Error(data["error-type"] || "Failed");
      const rate = data.rates?.[to];
      if (!rate) return reply(`❌ Currency *${to}* not found.${FOOTER}`);
      const result = (amount * rate).toFixed(2);
      const date = data.time_last_update_utc?.slice(0, 16) || "N/A";
      await reply(`💱 *Currency Converter*\n\n${amount} ${from} = *${result} ${to}*\n\n📊 Rate: 1 ${from} = ${rate.toFixed(4)} ${to}\n🕒 Updated: ${date}${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Currency conversion failed: ${e.message}${FOOTER}`);
    }
  },
});

// ── Fun ───────────────────────────────────────────────────────────────────────

registerCommand({
  name: "roast",
  aliases: ["insult"],
  category: "Fun",
  description: "Get a savage roast",
  handler: async ({ args, reply }) => {
    const roasts = [
      "You're like a cloud. When you disappear, it's a beautiful day.",
      "I'd agree with you, but then we'd both be wrong.",
      "You're not stupid, you just have bad luck thinking.",
      "I've seen better heads on a glass of beer.",
      "If laughter is the best medicine, your face must be curing the world.",
      "You're like Monday — nobody likes you.",
      "I'd call you a tool but even tools are useful.",
      "You have your entire life to be an idiot. Take a day off.",
      "I'm jealous of people who haven't met you.",
      "You bring everyone so much joy when you leave the room.",
      "Even mirrors crack when they see your face.",
      "The only way you'll ever get laid is if you crawl up a chicken's butt and wait.",
      "You're the reason the gene pool needs a lifeguard.",
      "I'd call you a genius but I'm not in the habit of lying.",
    ];
    const target = args[0] ? `*${args[0]}*` : "you";
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    await reply(`🔥 *Roast for ${target}:*\n\n_${roast}_${FOOTER}`);
  },
});

registerCommand({
  name: "compliment",
  aliases: ["flatter", "praise"],
  category: "Fun",
  description: "Get a nice compliment",
  handler: async ({ args, reply }) => {
    const compliments = [
      "You light up every room you walk into.",
      "Your smile could cure any bad day.",
      "You have a heart of gold.",
      "The world is a better place because of you.",
      "Your kindness is like a ripple that never stops.",
      "You make other people want to be better.",
      "You have an incredible mind.",
      "You're one of the rare people who make the world more interesting.",
      "Your laugh is absolutely contagious.",
      "You have excellent taste — you chose this bot! 😄",
      "You inspire everyone around you.",
      "You're stronger than you know.",
      "Your creativity is limitless.",
    ];
    const target = args[0] ? `*${args[0]}*` : "you";
    const c = compliments[Math.floor(Math.random() * compliments.length)];
    await reply(`💐 *Compliment for ${target}:*\n\n_${c}_${FOOTER}`);
  },
});

registerCommand({
  name: "pickup",
  aliases: ["pickupline", "flirt"],
  category: "Fun",
  description: "Get a cheesy pickup line",
  handler: async ({ reply }) => {
    const lines = [
      "Are you a Wi-Fi signal? Because I feel a connection.",
      "Do you have a map? I keep getting lost in your eyes.",
      "Are you a magician? Because whenever I look at you, everyone else disappears.",
      "Do you believe in love at first text, or should I message again?",
      "Are you a bank loan? Because you've got my interest.",
      "Is your name Google? Because you've got everything I've been searching for.",
      "Are you a keyboard? Because you're just my type.",
      "Do you have a name, or can I call you mine?",
      "If you were a vegetable, you'd be a cute-cumber.",
      "Are you an alien? Because you just abducted my heart.",
      "Are you a camera? Every time I look at you, I smile.",
      "Do you like science? Because we have chemistry.",
    ];
    await reply(`💌 *Pickup Line:*\n\n_${lines[Math.floor(Math.random() * lines.length)]}_${FOOTER}`);
  },
});

registerCommand({
  name: "riddle",
  aliases: ["puzzle", "brain"],
  category: "Fun",
  description: "Get a random riddle to solve",
  handler: async ({ reply }) => {
    const riddles = [
      { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An echo" },
      { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
      { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A map" },
      { q: "What has hands but can't clap?", a: "A clock" },
      { q: "What gets wetter as it dries?", a: "A towel" },
      { q: "What can travel around the world while staying in a corner?", a: "A stamp" },
      { q: "I'm light as a feather, yet the strongest person can't hold me for five minutes. What am I?", a: "Breath" },
      { q: "What has one eye but can't see?", a: "A needle" },
      { q: "What runs but never walks, has a mouth but never talks?", a: "A river" },
      { q: "What comes once in a minute, twice in a moment, but never in a thousand years?", a: "The letter M" },
    ];
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    await reply(`🧩 *RIDDLE*\n\n❓ ${r.q}\n\n||Answer: *${r.a}*||${FOOTER}`);
  },
});

registerCommand({
  name: "8ball",
  aliases: ["magicball", "ask"],
  category: "Fun",
  description: "Ask the magic 8-ball any yes/no question",
  handler: async ({ args, reply }) => {
    const question = args.join(" ");
    if (!question) return reply(`❓ Usage: .8ball <question>\nExample: .8ball Will I be rich?`);
    const answers = [
      "✅ It is certain.", "✅ It is decidedly so.", "✅ Without a doubt.",
      "✅ Yes, definitely.", "✅ You may rely on it.", "✅ As I see it, yes.",
      "✅ Most likely.", "🔮 Reply hazy, try again.", "🔮 Ask again later.",
      "🔮 Better not tell you now.", "🔮 Cannot predict now.", "🔮 Concentrate and ask again.",
      "❌ Don't count on it.", "❌ My reply is no.", "❌ My sources say no.",
      "❌ Outlook not so good.", "❌ Very doubtful.",
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    await reply(`🎱 *Magic 8-Ball*\n\n❓ _${question}_\n\n${answer}${FOOTER}`);
  },
});

registerCommand({
  name: "wouldyourather",
  aliases: ["wyr"],
  category: "Fun",
  description: "Get a 'Would You Rather' question",
  handler: async ({ reply }) => {
    const questions = [
      ["have the ability to fly", "be invisible"],
      ["never use social media again", "never watch movies or TV again"],
      ["always be 10 minutes late", "always be 20 minutes early"],
      ["lose all your photos", "lose all your contacts"],
      ["be famous but broke", "be rich but unknown"],
      ["speak all languages fluently", "play all instruments perfectly"],
      ["always be cold", "always be hot"],
      ["never eat sugar again", "never eat salt again"],
      ["have no Wi-Fi for a year", "have no phone for a year"],
      ["be 10 years older", "10 years younger"],
      ["live in the past", "live in the future"],
      ["be very funny", "be extremely intelligent"],
    ];
    const [a, b] = questions[Math.floor(Math.random() * questions.length)];
    await reply(`🤔 *Would You Rather?*\n\n🅰️ *${a.toUpperCase()}*\n\n—— OR ——\n\n🅱️ *${b.toUpperCase()}*\n\nReply A or B!${FOOTER}`);
  },
});

registerCommand({
  name: "neverhaveiever",
  aliases: ["nhie"],
  category: "Fun",
  description: "Get a 'Never Have I Ever' statement",
  handler: async ({ reply }) => {
    const statements = [
      "Never have I ever lied to get out of trouble.",
      "Never have I ever sent a text to the wrong person.",
      "Never have I ever stayed awake for 24 hours straight.",
      "Never have I ever eaten food that fell on the floor.",
      "Never have I ever pretended to be sick to avoid something.",
      "Never have I ever broken a bone.",
      "Never have I ever cried at a movie.",
      "Never have I ever forgotten someone's birthday.",
      "Never have I ever gotten lost in a city I know.",
      "Never have I ever spoken to a stranger's baby.",
      "Never have I ever sleep-walked.",
      "Never have I ever said 'I love you' first.",
    ];
    await reply(`🙈 *Never Have I Ever*\n\n${statements[Math.floor(Math.random() * statements.length)]}\n\n_Those who HAVE: 🍺 / Those who haven't: 💧_${FOOTER}`);
  },
});

registerCommand({
  name: "catfact",
  aliases: ["catisnugget"],
  category: "Fun",
  description: "Get a random cat fact",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://catfact.ninja/fact");
      const data = await res.json() as any;
      await reply(`🐱 *Cat Fact*\n\n${data.fact}${FOOTER}`);
    } catch {
      const facts = [
        "Cats sleep 70% of their lives.", "A group of cats is called a clowder.",
        "Cats can make over 100 different sounds.", "A cat's purr vibrates at a frequency that promotes healing.",
        "Cats can't taste sweetness.", "A cat's nose print is unique, like a human fingerprint.",
      ];
      await reply(`🐱 *Cat Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "dogfact",
  aliases: ["dogislife"],
  category: "Fun",
  description: "Get a random dog fact",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://dog-api.kinduff.com/api/facts?number=1");
      const data = await res.json() as any;
      await reply(`🐶 *Dog Fact*\n\n${data.facts?.[0] || "Dogs dream just like humans!"}${FOOTER}`);
    } catch {
      const facts = [
        "Dogs have a sense of smell 40x stronger than humans.", "A dog's nose print is unique.",
        "Dogs can understand about 165 words.", "Dogs sweat through their paws.",
        "The Basenji dog breed doesn't bark — it yodels.", "Greyhounds can run up to 45 mph.",
      ];
      await reply(`🐶 *Dog Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "dadjoke",
  aliases: ["badjoke", "papajoke"],
  category: "Fun",
  description: "Get a classic dad joke",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://icanhazdadjoke.com/", {
        headers: { Accept: "application/json" },
      });
      const data = await res.json() as any;
      await reply(`😂 *Dad Joke*\n\n${data.joke}${FOOTER}`);
    } catch {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "I'm reading a book about anti-gravity. It's impossible to put down.",
        "What do you call cheese that isn't yours? Nacho cheese.",
        "Why did the scarecrow win an award? He was outstanding in his field.",
        "I told my wife she was drawing her eyebrows too high. She looked surprised.",
        "What do you call a fish without eyes? A fsh.",
      ];
      await reply(`😂 *Dad Joke*\n\n${jokes[Math.floor(Math.random() * jokes.length)]}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "horoscope",
  aliases: ["zodiac", "star"],
  category: "Fun",
  description: "Get your zodiac horoscope (.horoscope aries)",
  handler: async ({ args, reply }) => {
    const signs: Record<string, string> = {
      aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
      leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
      sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓",
    };
    const sign = args[0]?.toLowerCase();
    if (!sign || !signs[sign]) {
      return reply(`❓ Usage: .horoscope <sign>\nSigns: ${Object.keys(signs).join(", ")}`);
    }
    const fortunes = [
      "Today is a great day to take bold steps. The universe is aligned in your favor.",
      "Focus on what truly matters. A surprise may come your way — stay open.",
      "Love and creativity flow abundantly today. Share your light with others.",
      "Patience is your superpower right now. Good things are building beneath the surface.",
      "Trust your instincts. A new opportunity is closer than you think.",
      "Communication is key today. Speak your truth and watch doors open.",
      "Financial matters deserve your attention. Review your goals carefully.",
      "Your energy is magnetic. People are drawn to your confidence today.",
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    await reply(`${signs[sign]} *${sign.charAt(0).toUpperCase() + sign.slice(1)} Horoscope*\n\n${fortune}\n\n✨ _Lucky number: ${Math.floor(Math.random() * 99) + 1}_\n🎨 _Lucky color: ${["Red", "Blue", "Green", "Gold", "Purple", "Silver"][Math.floor(Math.random() * 6)]}_${FOOTER}`);
  },
});

// ── AI Commands ───────────────────────────────────────────────────────────────

registerCommand({
  name: "aipoem",
  aliases: ["poem", "poetry"],
  category: "AI",
  description: "Generate an AI poem on any topic",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "life";
    await reply(`✍️ *Generating poem about "${topic}"...*`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write a beautiful short poem (8-12 lines) about: ${topic}. Make it rhyme and feel emotional.`)}`);
      const data = await res.json() as any;
      const poem = data.response || data.answer || data.text || "Could not generate poem.";
      await reply(`🎭 *AI Poem: ${topic}*\n\n${poem}${FOOTER}`);
    } catch {
      await reply(`❌ Poem generation failed. Try again.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "aistory",
  aliases: ["story", "shortstory"],
  category: "AI",
  description: "Generate a short AI story (.aistory a brave knight)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "an unexpected adventure";
    await reply(`📖 *Generating story about "${topic}"...*`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write a very short engaging story (150-200 words) about: ${topic}. Make it fun and interesting with a twist ending.`)}`);
      const data = await res.json() as any;
      const story = data.response || data.answer || data.text || "Could not generate story.";
      await reply(`📚 *AI Story*\n\n${story}${FOOTER}`);
    } catch {
      await reply(`❌ Story generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "ailyrics",
  aliases: ["songlyrics", "writelyr"],
  category: "AI",
  description: "Generate AI song lyrics (.ailyrics heartbreak afrobeats)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "love and heartbreak";
    await reply(`🎵 *Writing lyrics about "${topic}"...*`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write original song lyrics (verse, chorus, verse, chorus) about: ${topic}. Include clear [Verse] and [Chorus] labels.`)}`);
      const data = await res.json() as any;
      const lyrics = data.response || data.answer || data.text || "Could not generate lyrics.";
      await reply(`🎤 *AI Song Lyrics*\n\n${lyrics}${FOOTER}`);
    } catch {
      await reply(`❌ Lyrics generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "airecipe",
  aliases: ["recipe", "cook"],
  category: "AI",
  description: "Generate an AI recipe (.airecipe chicken pasta)",
  handler: async ({ args, reply }) => {
    const dish = args.join(" ") || "a quick healthy meal";
    await reply(`🍳 *Generating recipe for "${dish}"...*`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Give me a simple recipe for: ${dish}. Include: ingredients list and step-by-step instructions. Keep it practical and under 300 words.`)}`);
      const data = await res.json() as any;
      const recipe = data.response || data.answer || data.text || "Could not generate recipe.";
      await reply(`🍽️ *AI Recipe: ${dish}*\n\n${recipe}${FOOTER}`);
    } catch {
      await reply(`❌ Recipe generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "ainames",
  aliases: ["namegen", "babynames"],
  category: "AI",
  description: "Generate name ideas (.ainames african boy strong)",
  handler: async ({ args, reply }) => {
    const criteria = args.join(" ") || "unique powerful names";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Generate 10 creative name suggestions for: ${criteria}. For each name, give the name, its origin, and meaning in one line.`)}`);
      const data = await res.json() as any;
      const names = data.response || data.answer || data.text || "Could not generate names.";
      await reply(`📋 *AI Name Generator*\n\n${names}${FOOTER}`);
    } catch {
      await reply(`❌ Name generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "aitranslate",
  aliases: ["aitr"],
  category: "AI",
  description: "AI-powered translation (.aitranslate swahili Hello how are you)",
  handler: async ({ args, reply }) => {
    const lang = args[0];
    const text = args.slice(1).join(" ");
    if (!lang || !text) return reply(`❓ Usage: .aitranslate <language> <text>\nExample: .aitranslate french Good morning everyone`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Translate this text to ${lang}. Reply with ONLY the translation, nothing else: "${text}"`)}`);
      const data = await res.json() as any;
      const translated = data.response || data.answer || data.text || "Translation failed.";
      await reply(`🌍 *AI Translation → ${lang}*\n\n📝 *Original:* ${text}\n🔄 *Translation:* ${translated}${FOOTER}`);
    } catch {
      await reply(`❌ Translation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "aifix",
  aliases: ["grammar", "fixtext", "correct"],
  category: "AI",
  description: "Fix grammar and spelling in your text",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .aifix <your text>\nExample: .aifix i doesnt know how to speek english good`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Fix the grammar, spelling, and punctuation in this text. Reply with ONLY the corrected text: "${text}"`)}`);
      const data = await res.json() as any;
      const fixed = data.response || data.answer || data.text || text;
      await reply(`✍️ *Grammar Fix*\n\n❌ *Before:* ${text}\n✅ *After:* ${fixed}${FOOTER}`);
    } catch {
      await reply(`❌ Grammar fix failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "aisummary",
  aliases: ["summarize", "tldr"],
  category: "AI",
  description: "Summarize long text with AI",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (text.length < 20) return reply(`❓ Usage: .aisummary <long text to summarize>`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Summarize this in 3-5 bullet points. Be concise: "${text.slice(0, 1000)}"`)}`);
      const data = await res.json() as any;
      const summary = data.response || data.answer || data.text || "Could not summarize.";
      await reply(`📋 *AI Summary (TL;DR)*\n\n${summary}${FOOTER}`);
    } catch {
      await reply(`❌ Summary failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "roastai",
  aliases: ["airoast"],
  category: "AI",
  description: "Get an AI-generated savage roast",
  handler: async ({ args, reply }) => {
    const target = args.join(" ") || "someone who uses too many commands";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write a short funny savage roast about: ${target}. Keep it playful and not offensive. Max 3 sentences.`)}`);
      const data = await res.json() as any;
      const roast = data.response || data.answer || data.text || "Failed to generate roast.";
      await reply(`🔥 *AI Roast*\n\n${roast}${FOOTER}`);
    } catch {
      await reply(`❌ AI roast failed.${FOOTER}`);
    }
  },
});

// ── Group extras ──────────────────────────────────────────────────────────────

registerCommand({
  name: "listadmins",
  aliases: ["admins", "getadmins", "showadmins"],
  category: "Group",
  description: "List all group admins",
  groupOnly: true,
  handler: async ({ groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Group info not available.");
    const admins = groupMetadata.participants.filter(p => p.admin);
    if (!admins.length) return reply(`❌ No admins found.${FOOTER}`);
    const list = admins.map((a, i) => `${i + 1}. @${a.id.split("@")[0]} ${a.admin === "superadmin" ? "👑" : "🛡️"}`).join("\n");
    await reply(`🛡️ *Group Admins (${admins.length})*\n\n${list}${FOOTER}`);
  },
});

registerCommand({
  name: "groupinfo",
  aliases: ["ginfo"],
  category: "Group",
  description: "Get full group information",
  groupOnly: true,
  handler: async ({ groupMetadata, reply }) => {
    if (!groupMetadata) return reply("❌ Group info not available.");
    const admins = groupMetadata.participants.filter(p => p.admin).length;
    const created = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleDateString() : "N/A";
    await reply(
      `📊 *Group Info*\n\n📌 *Name:* ${groupMetadata.subject}\n👥 *Members:* ${groupMetadata.participants.length}\n🛡️ *Admins:* ${admins}\n📅 *Created:* ${created}\n🔒 *Restricted:* ${groupMetadata.restrict ? "Yes" : "No"}\n📝 *Description:*\n${groupMetadata.desc || "None"}${FOOTER}`
    );
  },
});

registerCommand({
  name: "invitelink",
  aliases: ["getlink", "grouplink"],
  category: "Group",
  description: "Get the group invite link",
  groupOnly: true,
  handler: async ({ sock, from, reply }) => {
    try {
      const code = await sock.groupInviteCode(from);
      await reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Failed: ${e.message}`);
    }
  },
});

registerCommand({
  name: "ping2",
  aliases: ["latency", "ms"],
  category: "General",
  description: "Advanced ping with latency measurement",
  handler: async ({ sock, from, msg, reply }) => {
    const start = Date.now();
    await reply(`⚡ Measuring latency...`);
    const latency = Date.now() - start;
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    await reply(
      `📡 *Network Status*\n\n⚡ *Latency:* ${latency}ms\n${latency < 100 ? "🟢 Excellent" : latency < 300 ? "🟡 Good" : "🔴 High"}\n\n⏱️ *Uptime:* ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m\n💾 *Heap Used:* ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB${FOOTER}`
    );
  },
});

// ── Misc fun ──────────────────────────────────────────────────────────────────

registerCommand({
  name: "inspire",
  aliases: ["quote2", "motivate2", "getinspired"],
  category: "Fun",
  description: "Get an inspiring motivational quote",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://zenquotes.io/api/random");
      const data = await res.json() as any;
      const q = data[0];
      await reply(`💡 *Inspiration*\n\n_"${q.q}"_\n\n— *${q.a}*${FOOTER}`);
    } catch {
      const quotes = [
        { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
        { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" },
        { q: "Your time is limited, so don't waste it living someone else's life.", a: "Steve Jobs" },
        { q: "Don't watch the clock; do what it does. Keep going.", a: "Sam Levenson" },
        { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
      ];
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      await reply(`💡 *Inspiration*\n\n_"${q.q}"_\n\n— *${q.a}*${FOOTER}`);
    }
  },
});

registerCommand({
  name: "love",
  aliases: ["lovemeter", "couple"],
  category: "Fun",
  description: "Calculate love percentage between two names",
  handler: async ({ args, reply }) => {
    const names = args.join(" ");
    if (!names) return reply(`❓ Usage: .love <name1> and <name2>\nExample: .love John and Mary`);
    const name1 = args[0] || "you";
    const name2 = args[args.length - 1] || "them";
    const seed = (name1 + name2).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const pct = ((seed * 7 + 13) % 100) + 1;
    const bars = Math.round(pct / 10);
    const bar = "❤️".repeat(bars) + "🖤".repeat(10 - bars);
    let msg = "";
    if (pct >= 90) msg = "💍 Soulmates! Perfect match!";
    else if (pct >= 70) msg = "😍 Strong connection!";
    else if (pct >= 50) msg = "💕 There's something there...";
    else if (pct >= 30) msg = "😅 Maybe just friends?";
    else msg = "💔 Not a match.";
    await reply(`💖 *Love Meter*\n\n💑 ${name1} + ${name2}\n\n${bar}\n\n❤️ *${pct}%*\n\n${msg}${FOOTER}`);
  },
});

registerCommand({
  name: "lucky",
  aliases: ["luckynumber"],
  category: "Fun",
  description: "Get your lucky number for today",
  handler: async ({ senderName, msg, reply }) => {
    const name = senderName;
    const today = new Date().toDateString();
    const seed = (name + today).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const lucky = (seed % 100) + 1;
    const colors = ["Red 🔴", "Blue 🔵", "Green 🟢", "Gold 🟡", "Purple 🟣", "White ⚪"];
    const color = colors[seed % colors.length];
    await reply(`🍀 *Your Lucky Stats Today*\n\n👤 *Name:* ${name}\n🔢 *Lucky Number:* ${lucky}\n🎨 *Lucky Color:* ${color}\n⭐ *Power Level:* ${"⭐".repeat(Math.max(1, seed % 5 + 1))}\n\n> _Today only — refresh tomorrow!_${FOOTER}`);
  },
});

registerCommand({
  name: "truth2",
  aliases: ["confess"],
  category: "Games",
  description: "Get a deep truth question",
  handler: async ({ reply }) => {
    const truths = [
      "What's the last lie you told someone?",
      "What's your biggest insecurity?",
      "Have you ever done something illegal? What was it?",
      "Who in this group do you find most annoying?",
      "What's a secret you've never told anyone?",
      "Have you ever betrayed someone's trust?",
      "What's the most embarrassing thing you've done for money?",
      "Do you have feelings for someone in this chat?",
      "What's the worst thing you've said about someone behind their back?",
      "If everyone could read your mind for 1 minute, what would embarrass you most?",
    ];
    await reply(`😳 *Truth Question:*\n\n_${truths[Math.floor(Math.random() * truths.length)]}_${FOOTER}`);
  },
});

registerCommand({
  name: "dare2",
  aliases: ["challenge"],
  category: "Games",
  description: "Get an intense dare challenge",
  handler: async ({ reply }) => {
    const dares = [
      "Send a voice note singing any song for 30 seconds.",
      "Change your WhatsApp status to something embarrassing for 10 minutes.",
      "Send a selfie to this group right now.",
      "Send a voice note saying 'I am the best in the world!' 3 times.",
      "Text the 5th person in your contacts 'I love your vibe' with no explanation.",
      "Change your profile picture to something funny for 1 hour.",
      "Send a 60-second voice note of you doing your best impression.",
      "Call someone on your contact list and sing Happy Birthday.",
      "Share your most liked photo on social media in this group.",
      "Do 20 push-ups and send a video proof.",
    ];
    await reply(`😈 *Dare Challenge:*\n\n_${dares[Math.floor(Math.random() * dares.length)]}_${FOOTER}`);
  },
});

registerCommand({
  name: "number",
  aliases: ["numfact", "numbertrivia"],
  category: "Fun",
  description: "Get a fun fact about any number",
  handler: async ({ args, reply }) => {
    const num = args[0] || String(Math.floor(Math.random() * 1000));
    try {
      const res = await fetch(`http://numbersapi.com/${num}/trivia`);
      const fact = await res.text();
      await reply(`🔢 *Number Fact: ${num}*\n\n${fact}${FOOTER}`);
    } catch {
      await reply(`🔢 The number ${num} is ${parseInt(num) % 2 === 0 ? "even" : "odd"} and ${parseInt(num) < 0 ? "negative" : "positive"}.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "thisorthat",
  aliases: ["tot", "choice"],
  category: "Fun",
  description: "Get a 'This or That' quick choice question",
  handler: async ({ reply }) => {
    const questions = [
      ["Coffee ☕", "Tea 🍵"], ["Beach 🏖️", "Mountains ⛰️"], ["Night owl 🦉", "Early bird 🐦"],
      ["Pizza 🍕", "Burger 🍔"], ["iOS 🍎", "Android 🤖"], ["Movies 🎬", "TV Shows 📺"],
      ["Summer ☀️", "Winter ❄️"], ["Cats 🐱", "Dogs 🐶"], ["Driving 🚗", "Flying ✈️"],
      ["Rich & sad 💸😢", "Poor & happy 💔😊"], ["Super strength 💪", "Super speed ⚡"],
      ["Gym 🏋️", "Running 🏃"], ["Cook at home 🍳", "Eat out 🍽️"],
    ];
    const [a, b] = questions[Math.floor(Math.random() * questions.length)];
    await reply(`⚡ *This or That?*\n\n${a}\n\n—— VS ——\n\n${b}\n\nReply with your choice!${FOOTER}`);
  },
});

registerCommand({
  name: "motivation",
  aliases: ["pep", "boost"],
  category: "Fun",
  description: "Get a personalized motivational message",
  handler: async ({ senderName, msg, reply }) => {
    const name = senderName;
    const messages = [
      `Hey ${name}! You are more capable than you think. Every step you take, no matter how small, is progress. Keep pushing!`,
      `${name}, greatness doesn't come overnight. But you show up every day, and that's what separates winners from the rest. Stay consistent!`,
      `Remember ${name}, every setback is a setup for a comeback. Your best days are still ahead of you. Believe in yourself!`,
      `${name}, you have survived 100% of your worst days. You are stronger than any challenge that comes your way!`,
      `Hey ${name}! The world needs what only you can offer. Keep being you, keep growing, keep winning!`,
    ];
    await reply(`💪 *Motivation for ${name}*\n\n${messages[Math.floor(Math.random() * messages.length)]}${FOOTER}`);
  },
});

registerCommand({
  name: "advice",
  aliases: ["tips"],
  category: "Fun",
  description: "Get random life advice",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://api.adviceslip.com/advice");
      const data = await res.json() as any;
      await reply(`💡 *Life Advice*\n\n_${data.slip?.advice}_${FOOTER}`);
    } catch {
      const advices = [
        "Drink more water and sleep more hours — most problems solve themselves.",
        "Before you say something, ask: is it true? Is it kind? Is it necessary?",
        "Spend less time impressing strangers and more time with people who love you.",
        "You don't need everyone's approval. One life, your rules.",
        "Comparison is the thief of joy. Run your own race.",
        "Don't mistake motion for progress. Focus on what actually matters.",
      ];
      await reply(`💡 *Life Advice*\n\n_${advices[Math.floor(Math.random() * advices.length)]}_${FOOTER}`);
    }
  },
});

registerCommand({
  name: "acronym",
  aliases: ["acro", "abbreviation"],
  category: "Fun",
  description: "Expand or invent meaning for an acronym (.acronym GOAT)",
  handler: async ({ args, reply }) => {
    const word = args[0]?.toUpperCase();
    if (!word) return reply(`❓ Usage: .acronym <word>\nExample: .acronym MAXX`);
    const adjectives = ["Magnificent", "Awesome", "Amazing", "Brilliant", "Creative", "Dynamic", "Elite", "Fantastic", "Glorious", "Heroic", "Incredible", "Legendary", "Mighty", "Noble", "Outstanding", "Powerful", "Quantum", "Remarkable", "Supreme", "Tremendous", "Ultimate", "Vibrant", "Wonderful", "Xenial", "Young", "Zealous"];
    const nouns = ["Achiever", "Beast", "Champion", "Dreamer", "Enthusiast", "Fighter", "Genius", "Hero", "Innovator", "Juggler", "King", "Legend", "Master", "Ninja", "Operator", "Pioneer", "Queen", "Rocket", "Superstar", "Titan", "Unicorn", "Visionary", "Warrior", "Expert", "Youth", "Zealot"];
    const result = word.split("").map(l => {
      const adj = adjectives.find(a => a.startsWith(l)) || l + "...";
      return `*${l}* — ${adj}`;
    }).join("\n");
    await reply(`🔤 *Acronym: ${word}*\n\n${result}${FOOTER}`);
  },
});

registerCommand({
  name: "emojify",
  aliases: ["emoji", "emojitext"],
  category: "Fun",
  description: "Add random emojis to your text",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .emojify <text>`);
    const emojis = ["🔥", "⚡", "💫", "✨", "🌟", "💎", "🚀", "🎯", "💥", "🎊", "🎉", "🌈", "💪", "🎶", "🤩"];
    const result = text.split(" ").map(w => w + " " + emojis[Math.floor(Math.random() * emojis.length)]).join(" ");
    await reply(`✨ ${result}${FOOTER}`);
  },
});

registerCommand({
  name: "repeat",
  aliases: ["spam", "echo"],
  category: "Tools",
  description: "Repeat a message N times (.repeat 3 hello world) max 10",
  handler: async ({ sock, from, msg, args, reply }) => {
    const n = Math.min(parseInt(args[0]) || 1, 10);
    const text = args.slice(1).join(" ");
    if (!text) return reply(`❓ Usage: .repeat <times> <text>\nExample: .repeat 3 Hello!`);
    for (let i = 0; i < n; i++) {
      await sock.sendMessage(from, { text: `${text}\n\n> _MAXX-XMD_ ⚡` }, { quoted: msg });
    }
  },
});

registerCommand({
  name: "morse",
  aliases: ["morsecode"],
  category: "Tools",
  description: "Encode or decode Morse code (.morse encode/decode <text>)",
  handler: async ({ args, reply }) => {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!mode || !text) return reply(`❓ Usage:\n  .morse encode Hello\n  .morse decode .... . .-.. .-.. ---`);
    const MAP: Record<string, string> = {
      a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
      i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
      q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
      y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
      "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
      " ": "/",
    };
    const REV = Object.fromEntries(Object.entries(MAP).map(([k, v]) => [v, k]));
    let result: string;
    if (["encode", "enc", "e"].includes(mode)) {
      result = text.toLowerCase().split("").map(c => MAP[c] || c).join(" ");
    } else {
      result = text.split(" / ").map(word =>
        word.split(" ").map(code => REV[code] || "?").join("")
      ).join(" ");
    }
    await reply(`📡 *Morse Code ${mode === "encode" || mode === "enc" || mode === "e" ? "Encode" : "Decode"}*\n\n*Input:* ${text.slice(0, 100)}\n*Result:* ${result}${FOOTER}`);
  },
});

registerCommand({
  name: "roman",
  aliases: ["romannumeral", "toroman"],
  category: "Tools",
  description: "Convert number to/from Roman numerals (.roman 2024 / .roman XIV)",
  handler: async ({ args, reply }) => {
    const input = args[0];
    if (!input) return reply(`❓ Usage: .roman <number or roman>\nExamples: .roman 2024  or  .roman MMXXIV`);
    const isNum = /^\d+$/.test(input);
    if (isNum) {
      let num = parseInt(input);
      if (num <= 0 || num > 3999) return reply("❌ Enter a number between 1 and 3999.");
      const vals = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]] as [number, string][];
      let result = "";
      for (const [v, s] of vals) { while (num >= v) { result += s; num -= v; } }
      await reply(`🏛️ *Roman Numerals*\n\n${input} = *${result}*${FOOTER}`);
    } else {
      const roman = input.toUpperCase();
      const vals: Record<string, number> = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
      let result = 0, i = 0;
      while (i < roman.length) {
        const two = roman.slice(i, i + 2);
        if (vals[two]) { result += vals[two]; i += 2; }
        else if (vals[roman[i]]) { result += vals[roman[i]]; i++; }
        else return reply(`❌ Invalid Roman numeral: ${roman}`);
      }
      await reply(`🏛️ *Roman Numerals*\n\n${roman} = *${result}*${FOOTER}`);
    }
  },
});

registerCommand({
  name: "truecaller",
  aliases: ["numinfo"],
  category: "Search",
  description: "Get basic info about a phone number format",
  handler: async ({ args, reply }) => {
    const number = args[0]?.replace(/\D/g, "");
    if (!number || number.length < 7) return reply(`❓ Usage: .truecaller <number>\nExample: .truecaller 2547XXXXXXXX`);
    const codes: Record<string, string> = {
      "1": "🇺🇸 USA/Canada", "44": "🇬🇧 United Kingdom", "254": "🇰🇪 Kenya", "255": "🇹🇿 Tanzania",
      "256": "🇺🇬 Uganda", "234": "🇳🇬 Nigeria", "27": "🇿🇦 South Africa", "91": "🇮🇳 India",
      "86": "🇨🇳 China", "49": "🇩🇪 Germany", "33": "🇫🇷 France", "39": "🇮🇹 Italy",
      "34": "🇪🇸 Spain", "55": "🇧🇷 Brazil", "7": "🇷🇺 Russia", "81": "🇯🇵 Japan",
      "82": "🇰🇷 South Korea", "20": "🇪🇬 Egypt", "233": "🇬🇭 Ghana", "260": "🇿🇲 Zambia",
      "263": "🇿🇼 Zimbabwe", "251": "🇪🇹 Ethiopia", "250": "🇷🇼 Rwanda", "237": "🇨🇲 Cameroon",
    };
    let country = "🌐 Unknown";
    for (const [code, name] of Object.entries(codes)) {
      if (number.startsWith(code)) { country = name; break; }
    }
    await reply(
      `📞 *Number Info*\n\n📱 *Number:* +${number}\n🌍 *Country:* ${country}\n📏 *Length:* ${number.length} digits\n✅ *Format:* ${number.length >= 10 ? "Valid length" : "Possibly incomplete"}\n\n_Note: Full lookup requires premium API_${FOOTER}`
    );
  },
});

registerCommand({
  name: "dictionary",
  aliases: ["dict", "meaning"],
  category: "Search",
  description: "Get the dictionary definition of a word",
  handler: async ({ args, reply }) => {
    const word = args[0];
    if (!word) return reply(`❓ Usage: .dictionary <word>\nExample: .dictionary serendipity`);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json() as any;
      const entry = data[0];
      const meanings = entry.meanings?.slice(0, 2).map((m: any) => {
        const def = m.definitions[0];
        return `*${m.partOfSpeech}:* ${def.definition}${def.example ? `\n_e.g. "${def.example}"_` : ""}`;
      }).join("\n\n");
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || "";
      await reply(`📖 *Dictionary: ${entry.word}*\n${phonetic ? `🔊 _${phonetic}_\n` : ""}\n${meanings || "No definition found."}${FOOTER}`);
    } catch {
      await reply(`❌ Definition for *${word}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "synonym",
  aliases: ["synonyms", "thesaurus"],
  category: "Search",
  description: "Find synonyms for a word",
  handler: async ({ args, reply }) => {
    const word = args[0];
    if (!word) return reply(`❓ Usage: .synonym <word>\nExample: .synonym happy`);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as any;
      const synonyms: string[] = [];
      const antonyms: string[] = [];
      for (const meaning of data[0]?.meanings || []) {
        for (const def of meaning.definitions || []) {
          synonyms.push(...(def.synonyms || []));
          antonyms.push(...(def.antonyms || []));
        }
        synonyms.push(...(meaning.synonyms || []));
        antonyms.push(...(meaning.antonyms || []));
      }
      const uniqSyn = [...new Set(synonyms)].slice(0, 15);
      const uniqAnt = [...new Set(antonyms)].slice(0, 10);
      if (!uniqSyn.length && !uniqAnt.length) return reply(`❌ No synonyms found for *${word}*${FOOTER}`);
      await reply(`📚 *Synonyms: ${word}*\n\n✅ *Synonyms:* ${uniqSyn.join(", ") || "None"}\n❌ *Antonyms:* ${uniqAnt.join(", ") || "None"}${FOOTER}`);
    } catch {
      await reply(`❌ No synonyms found for *${word}*${FOOTER}`);
    }
  },
});
