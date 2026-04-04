import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── Finance ───────────────────────────────────────────────────────────────────

registerCommand({
  name: "loan",
  aliases: ["mortgage", "installment"],
  category: "Finance",
  description: "Calculate monthly loan payment (.loan 10000 5 12) — amount, rate%, months",
  handler: async ({ args, reply }) => {
    const principal = parseFloat(args[0]);
    const annualRate = parseFloat(args[1]);
    const months = parseInt(args[2]);
    if (isNaN(principal) || isNaN(annualRate) || isNaN(months)) {
      return reply(`❓ Usage: .loan <amount> <annual_rate%> <months>\nExample: .loan 10000 5 24\n(10,000 loan at 5% per year for 24 months)`);
    }
    const r = annualRate / 100 / 12;
    const monthly = r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const totalPay = monthly * months;
    const totalInterest = totalPay - principal;
    await reply(
      `💳 *Loan Calculator*\n\n` +
      `💰 *Principal:* ${principal.toLocaleString()}\n` +
      `📊 *Annual Rate:* ${annualRate}%\n` +
      `📅 *Term:* ${months} months\n\n` +
      `💵 *Monthly Payment:* *${monthly.toFixed(2)}*\n` +
      `💸 *Total Payment:* ${totalPay.toFixed(2)}\n` +
      `📈 *Total Interest:* ${totalInterest.toFixed(2)}${FOOTER}`
    );
  },
});

registerCommand({
  name: "savings",
  aliases: ["savecalc", "savingsplan"],
  category: "Finance",
  description: "Calculate compound savings (.savings 1000 5 10) — principal, rate%, years",
  handler: async ({ args, reply }) => {
    const principal = parseFloat(args[0]);
    const rate = parseFloat(args[1]);
    const years = parseFloat(args[2]);
    if (isNaN(principal) || isNaN(rate) || isNaN(years)) {
      return reply(`❓ Usage: .savings <amount> <rate%> <years>\nExample: .savings 1000 7 10`);
    }
    const result = principal * Math.pow(1 + rate / 100, years);
    const interest = result - principal;
    await reply(
      `💰 *Compound Savings Calculator*\n\n` +
      `💵 *Initial:* ${principal.toLocaleString()}\n` +
      `📊 *Rate:* ${rate}% per year\n` +
      `📅 *Years:* ${years}\n\n` +
      `📈 *Future Value:* *${result.toFixed(2)}*\n` +
      `💸 *Interest Earned:* ${interest.toFixed(2)}\n` +
      `🚀 *Growth:* ${((result / principal - 1) * 100).toFixed(1)}%${FOOTER}`
    );
  },
});

registerCommand({
  name: "tip",
  aliases: ["tipcalc", "tipamount"],
  category: "Finance",
  description: "Calculate tip amount (.tip 50 15) — bill amount, tip%",
  handler: async ({ args, reply }) => {
    const bill = parseFloat(args[0]);
    const pct = parseFloat(args[1]) || 15;
    const people = parseInt(args[2]) || 1;
    if (isNaN(bill)) return reply(`❓ Usage: .tip <bill> [tip%] [people]\nExample: .tip 80 20 4`);
    const tipAmt = bill * pct / 100;
    const total = bill + tipAmt;
    const perPerson = total / people;
    await reply(
      `🍽️ *Tip Calculator*\n\n` +
      `💵 *Bill:* ${bill.toFixed(2)}\n` +
      `💁 *Tip ${pct}%:* ${tipAmt.toFixed(2)}\n` +
      `✅ *Total:* ${total.toFixed(2)}\n` +
      (people > 1 ? `👥 *Per person (${people}):* ${perPerson.toFixed(2)}` : "")
      + FOOTER
    );
  },
});

registerCommand({
  name: "split",
  aliases: ["billsplit", "splitbill"],
  category: "Finance",
  description: "Split a bill equally (.split 240 6) — amount, people",
  handler: async ({ args, reply }) => {
    const total = parseFloat(args[0]);
    const people = parseInt(args[1]);
    if (isNaN(total) || isNaN(people) || people < 1) return reply(`❓ Usage: .split <total> <people>\nExample: .split 240 6`);
    const perPerson = total / people;
    await reply(`💸 *Bill Splitter*\n\n💰 *Total:* ${total.toFixed(2)}\n👥 *People:* ${people}\n\n💵 *Each person pays:* *${perPerson.toFixed(2)}*${FOOTER}`);
  },
});

registerCommand({
  name: "discount",
  aliases: ["saleprice", "disccalc"],
  category: "Finance",
  description: "Calculate discounted price (.discount 200 25) — price, discount%",
  handler: async ({ args, reply }) => {
    const price = parseFloat(args[0]);
    const pct = parseFloat(args[1]);
    if (isNaN(price) || isNaN(pct)) return reply(`❓ Usage: .discount <original_price> <discount%>\nExample: .discount 200 25`);
    const savings = price * pct / 100;
    const final = price - savings;
    await reply(
      `🏷️ *Discount Calculator*\n\n` +
      `💵 *Original:* ${price.toFixed(2)}\n` +
      `📉 *Discount:* ${pct}% (saves ${savings.toFixed(2)})\n` +
      `✅ *Final Price:* *${final.toFixed(2)}*${FOOTER}`
    );
  },
});

registerCommand({
  name: "profit",
  aliases: ["profitloss", "plcalc"],
  category: "Finance",
  description: "Calculate profit/loss (.profit 100 150) — cost, selling price",
  handler: async ({ args, reply }) => {
    const cost = parseFloat(args[0]);
    const sell = parseFloat(args[1]);
    if (isNaN(cost) || isNaN(sell)) return reply(`❓ Usage: .profit <cost> <selling_price>\nExample: .profit 100 150`);
    const diff = sell - cost;
    const pct = (diff / cost) * 100;
    const isProfit = diff >= 0;
    await reply(
      `${isProfit ? "📈" : "📉"} *${isProfit ? "Profit" : "Loss"} Calculator*\n\n` +
      `💵 *Cost Price:* ${cost.toFixed(2)}\n` +
      `💰 *Selling Price:* ${sell.toFixed(2)}\n\n` +
      `${isProfit ? "✅" : "❌"} *${isProfit ? "Profit" : "Loss"}:* *${Math.abs(diff).toFixed(2)}*\n` +
      `📊 *${isProfit ? "Profit" : "Loss"} %:* ${Math.abs(pct).toFixed(2)}%${FOOTER}`
    );
  },
});

// ── Health / Lifestyle ─────────────────────────────────────────────────────────

registerCommand({
  name: "sleepcalc",
  aliases: ["sleep", "bedtime"],
  category: "Health",
  description: "Calculate best bedtime (.sleepcalc 07:00) — enter wake time",
  handler: async ({ args, reply }) => {
    const wakeTime = args[0];
    if (!wakeTime || !/^\d{1,2}:\d{2}$/.test(wakeTime)) return reply(`❓ Usage: .sleepcalc <HH:MM>\nExample: .sleepcalc 06:30`);
    const [h, m] = wakeTime.split(":").map(Number);
    const wakeMinutes = h * 60 + m;
    const cycleMins = 90;
    const cycles = [6, 5, 4]; // full sleep cycles
    const times = cycles.map(c => {
      const sleepMins = ((wakeMinutes - c * cycleMins - 14) + 1440) % 1440;
      const sh = Math.floor(sleepMins / 60);
      const sm = sleepMins % 60;
      return `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")} (${c} cycles = ${c * 1.5}hrs)`;
    });
    await reply(
      `😴 *Sleep Calculator*\n\nWake up: *${wakeTime}*\n\nBest times to sleep:\n${times.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n_Each sleep cycle = 90 mins. 14 min = avg time to fall asleep._${FOOTER}`
    );
  },
});

registerCommand({
  name: "waterintake",
  aliases: ["water", "hydration"],
  category: "Health",
  description: "Calculate daily water intake (.waterintake 70kg / .waterintake 70kg active)",
  handler: async ({ args, reply }) => {
    const weight = parseFloat(args[0]);
    const active = args[1]?.toLowerCase() === "active";
    if (isNaN(weight)) return reply(`❓ Usage: .waterintake <weight_kg> [active]\nExample: .waterintake 70kg active`);
    const base = weight * 35; // 35ml per kg
    const total = active ? base + 500 : base;
    const glasses = Math.round(total / 250);
    const bottles = (total / 1000).toFixed(1);
    await reply(
      `💧 *Daily Water Intake*\n\n⚖️ *Weight:* ${weight} kg\n🏃 *Activity:* ${active ? "Active" : "Sedentary"}\n\n` +
      `💧 *Recommended:* *${total} ml* per day\n` +
      `🥤 *Glasses (250ml):* ${glasses} glasses\n` +
      `🍶 *Bottles (1L):* ${bottles} bottles${FOOTER}`
    );
  },
});

registerCommand({
  name: "calorieburn",
  aliases: ["burnrate", "exercise"],
  category: "Health",
  description: "Estimate calories burned during exercise (.calorieburn running 30 70)",
  handler: async ({ args, reply }) => {
    const activity = args[0]?.toLowerCase();
    const minutes = parseFloat(args[1]) || 30;
    const weight = parseFloat(args[2]) || 70;
    const METS: Record<string, number> = {
      running: 9.8, walking: 3.5, cycling: 7.5, swimming: 8.0, hiit: 11.0,
      yoga: 2.5, weightlifting: 5.0, dancing: 5.5, football: 8.0, basketball: 7.0,
      jumping: 8.0, skipping: 11.8, tennis: 7.3, badminton: 5.5, boxing: 9.0,
    };
    if (!activity || !METS[activity]) {
      return reply(`❓ Usage: .calorieburn <activity> <minutes> <weight_kg>\nActivities: ${Object.keys(METS).join(", ")}`);
    }
    const calories = (METS[activity] * weight * minutes) / 60;
    await reply(
      `🔥 *Calorie Burn Estimator*\n\n🏃 *Activity:* ${activity}\n⏱️ *Duration:* ${minutes} mins\n⚖️ *Weight:* ${weight} kg\n\n🔥 *Calories Burned:* *${Math.round(calories)} kcal*${FOOTER}`
    );
  },
});

registerCommand({
  name: "calories",
  aliases: ["foodcalories", "nutrition"],
  category: "Health",
  description: "Estimate calories in common foods (.calories apple or .calories rice 200g)",
  handler: async ({ args, reply }) => {
    const FOODS: Record<string, { cal: number; unit: string; p: number; c: number; f: number }> = {
      apple: { cal: 95, unit: "1 medium", p: 0.5, c: 25, f: 0.3 },
      banana: { cal: 105, unit: "1 medium", p: 1.3, c: 27, f: 0.4 },
      egg: { cal: 72, unit: "1 large", p: 6, c: 0.4, f: 5 },
      rice: { cal: 206, unit: "1 cup cooked", p: 4.3, c: 45, f: 0.4 },
      bread: { cal: 79, unit: "1 slice", p: 2.7, c: 15, f: 1 },
      chicken: { cal: 165, unit: "100g", p: 31, c: 0, f: 3.6 },
      beef: { cal: 250, unit: "100g", p: 26, c: 0, f: 17 },
      milk: { cal: 149, unit: "1 cup (244ml)", p: 8, c: 12, f: 8 },
      cheese: { cal: 113, unit: "30g", p: 7, c: 0.4, f: 9 },
      avocado: { cal: 160, unit: "1/2 fruit", p: 2, c: 9, f: 15 },
      potato: { cal: 161, unit: "1 medium", p: 4.3, c: 37, f: 0.2 },
      pasta: { cal: 220, unit: "1 cup cooked", p: 8, c: 43, f: 1.3 },
      orange: { cal: 62, unit: "1 medium", p: 1.2, c: 15, f: 0.2 },
      salmon: { cal: 208, unit: "100g", p: 20, c: 0, f: 13 },
      chocolate: { cal: 155, unit: "30g", p: 2, c: 17, f: 9 },
    };
    const q = args[0]?.toLowerCase();
    if (!q) return reply(`❓ Usage: .calories <food>\nFoods: ${Object.keys(FOODS).join(", ")}`);
    const f = FOODS[q];
    if (!f) return reply(`❌ Food *${q}* not in database.\nAvailable: ${Object.keys(FOODS).join(", ")}${FOOTER}`);
    await reply(
      `🥗 *Nutrition: ${q.charAt(0).toUpperCase() + q.slice(1)}*\n\n📏 *Serving:* ${f.unit}\n\n🔥 *Calories:* ${f.cal} kcal\n💪 *Protein:* ${f.p}g\n🌾 *Carbs:* ${f.c}g\n🧈 *Fat:* ${f.f}g${FOOTER}`
    );
  },
});

registerCommand({
  name: "heartrate",
  aliases: ["targethr", "hrzone"],
  category: "Health",
  description: "Calculate target heart rate zones (.heartrate 25) — enter your age",
  handler: async ({ args, reply }) => {
    const age = parseInt(args[0]);
    if (isNaN(age) || age < 5 || age > 100) return reply(`❓ Usage: .heartrate <age>\nExample: .heartrate 25`);
    const maxHR = 220 - age;
    const zones = [
      { name: "Rest", pct: "50-60%", min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6), desc: "Light activity" },
      { name: "Fat Burn", pct: "60-70%", min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), desc: "Weight loss" },
      { name: "Aerobic", pct: "70-80%", min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), desc: "Endurance" },
      { name: "Anaerobic", pct: "80-90%", min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), desc: "Speed training" },
      { name: "Max", pct: "90-100%", min: Math.round(maxHR * 0.9), max: maxHR, desc: "Maximum effort" },
    ];
    const zoneList = zones.map(z => `${z.name} (${z.pct}): ${z.min}-${z.max} bpm — ${z.desc}`).join("\n");
    await reply(`❤️ *Heart Rate Zones (Age: ${age})*\n\n🫀 *Max HR:* ${maxHR} bpm\n\n${zoneList}${FOOTER}`);
  },
});

// ── Text Effects ──────────────────────────────────────────────────────────────

registerCommand({
  name: "leet",
  aliases: ["1337", "leetspeak"],
  category: "Tools",
  description: "Convert text to leet speak (.leet Hello World)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .leet <text>`);
    const MAP: Record<string, string> = { a:"4",e:"3",i:"1",o:"0",s:"5",t:"7",b:"8",g:"9",l:"|" };
    const result = text.split("").map(c => MAP[c.toLowerCase()] || c).join("");
    await reply(`💻 *Leet Speak*\n\n${result}${FOOTER}`);
  },
});

registerCommand({
  name: "smallcaps",
  aliases: ["scaps", "smalltext"],
  category: "Tools",
  description: "Convert text to small caps (.smallcaps hello world)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .smallcaps <text>`);
    const MAP: Record<string, string> = { a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"Q",r:"ʀ",s:"s",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ" };
    await reply(text.toLowerCase().split("").map(c => MAP[c] || c).join("") + FOOTER);
  },
});

registerCommand({
  name: "wide",
  aliases: ["fullwidth", "aesthetic"],
  category: "Tools",
  description: "Convert text to wide/aesthetic font (.wide hello)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .wide <text>`);
    const result = text.split("").map(c => {
      const code = c.charCodeAt(0);
      if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xFF01 - 33);
      return c;
    }).join("");
    await reply(result + FOOTER);
  },
});

registerCommand({
  name: "bold2",
  aliases: ["boldtext", "ubold"],
  category: "Tools",
  description: "Bold unicode text (.bold2 hello world)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .bold2 <text>`);
    const MAP: Record<string, string> = {};
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("").forEach((c, i) => {
      if (i < 26) MAP[c] = String.fromCodePoint(0x1D400 + i);
      else if (i < 52) MAP[c] = String.fromCodePoint(0x1D41A + i - 26);
      else MAP[c] = String.fromCodePoint(0x1D7CE + i - 52);
    });
    await reply(text.split("").map(c => MAP[c] || c).join("") + FOOTER);
  },
});

registerCommand({
  name: "italic2",
  aliases: ["italictext", "uitalic"],
  category: "Tools",
  description: "Italic unicode text (.italic2 hello world)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .italic2 <text>`);
    const MAP: Record<string, string> = {};
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("").forEach((c, i) => {
      if (i < 26) MAP[c] = String.fromCodePoint(0x1D434 + i);
      else MAP[c] = String.fromCodePoint(0x1D44E + i - 26);
    });
    MAP["h"] = "\u{1D455}"; // special case
    await reply(text.split("").map(c => MAP[c] || c).join("") + FOOTER);
  },
});

registerCommand({
  name: "clap",
  aliases: ["claptext", "clapping"],
  category: "Tools",
  description: "Add clap emojis between words (.clap hello world)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .clap <text>`);
    await reply(text.split(" ").join(" 👏 ") + " 👏" + FOOTER);
  },
});

registerCommand({
  name: "caesar",
  aliases: ["caesarcipher", "rot"],
  category: "Tools",
  description: "Caesar cipher encoder/decoder (.caesar 3 Hello World or .caesar -3 to decode)",
  handler: async ({ args, reply }) => {
    const shift = parseInt(args[0]);
    const text = args.slice(1).join(" ");
    if (isNaN(shift) || !text) return reply(`❓ Usage: .caesar <shift> <text>\nExamples:\n  .caesar 3 Hello (encode)\n  .caesar -3 Khoor (decode)`);
    const result = text.split("").map(c => {
      if (/[a-zA-Z]/.test(c)) {
        const base = c >= "a" ? 97 : 65;
        return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
      }
      return c;
    }).join("");
    await reply(`🔐 *Caesar Cipher (shift: ${shift})*\n\n*Input:* ${text}\n*Output:* ${result}${FOOTER}`);
  },
});

registerCommand({
  name: "atbash",
  aliases: ["atbashcipher"],
  category: "Tools",
  description: "Atbash cipher (A=Z, B=Y, ...) (.atbash hello)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .atbash <text>`);
    const result = text.split("").map(c => {
      if (/[a-z]/.test(c)) return String.fromCharCode(219 - c.charCodeAt(0));
      if (/[A-Z]/.test(c)) return String.fromCharCode(155 - c.charCodeAt(0));
      return c;
    }).join("");
    await reply(`🔐 *Atbash Cipher*\n\n*Input:* ${text}\n*Output:* ${result}${FOOTER}`);
  },
});

registerCommand({
  name: "piglatin",
  aliases: ["pig", "piglang"],
  category: "Tools",
  description: "Convert text to Pig Latin (.piglatin hello world)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .piglatin <text>`);
    const toPigLatin = (word: string) => {
      if (/[aeiou]/i.test(word[0])) return word + "yay";
      const match = word.match(/^[^aeiou]+/i);
      if (!match) return word;
      return word.slice(match[0].length) + match[0] + "ay";
    };
    const result = text.split(" ").map(toPigLatin).join(" ");
    await reply(`🐷 *Pig Latin*\n\n*Input:* ${text}\n*Output:* ${result}${FOOTER}`);
  },
});

registerCommand({
  name: "palindrome",
  aliases: ["ispalindrome", "checkpali"],
  category: "Tools",
  description: "Check if a word/sentence is a palindrome (.palindrome racecar)",
  handler: async ({ args, reply }) => {
    const text = args.join(" ").toLowerCase().replace(/[^a-z0-9]/g, "");
    const original = args.join(" ");
    if (!text) return reply(`❓ Usage: .palindrome <text>`);
    const reversed = text.split("").reverse().join("");
    const isPalin = text === reversed;
    await reply(`🔄 *Palindrome Check*\n\n*Text:* "${original}"\n${isPalin ? "✅ YES, it's a palindrome!" : `❌ NOT a palindrome.\n*Reversed:* "${args.join(" ").split("").reverse().join("")}"`}${FOOTER}`);
  },
});

registerCommand({
  name: "anagram",
  aliases: ["isanagram", "checkanagram"],
  category: "Tools",
  description: "Check if two words are anagrams (.anagram listen silent)",
  handler: async ({ args, reply }) => {
    const [a, b] = [args[0], args[1]];
    if (!a || !b) return reply(`❓ Usage: .anagram <word1> <word2>\nExample: .anagram listen silent`);
    const sort = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "").split("").sort().join("");
    const isAnagram = sort(a) === sort(b);
    await reply(`🔤 *Anagram Check*\n\n*"${a}"* and *"${b}"*\n\n${isAnagram ? `✅ YES — they are anagrams of each other!` : `❌ NO — not anagrams.`}${FOOTER}`);
  },
});

registerCommand({
  name: "wordcount",
  aliases: ["wcount", "countwords"],
  category: "Tools",
  description: "Count words, characters, sentences in text",
  handler: async ({ args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .wordcount <text>`);
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const noSpaces = text.replace(/\s/g, "").length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = text.split(/\n\n+/).length;
    const readTime = Math.ceil(words / 200);
    await reply(
      `📊 *Text Analysis*\n\n` +
      `📝 *Words:* ${words}\n` +
      `🔤 *Characters:* ${chars}\n` +
      `📌 *Chars (no spaces):* ${noSpaces}\n` +
      `📖 *Sentences:* ${sentences}\n` +
      `📄 *Paragraphs:* ${paragraphs}\n` +
      `⏱️ *Read time:* ~${readTime} min${FOOTER}`
    );
  },
});

registerCommand({
  name: "timestamp",
  aliases: ["unixtime", "epoch"],
  category: "Tools",
  description: "Convert between Unix timestamps and dates (.timestamp / .timestamp 1700000000)",
  handler: async ({ args, reply }) => {
    const input = args[0];
    if (!input) {
      const now = Math.floor(Date.now() / 1000);
      const date = new Date();
      return reply(`⏰ *Current Timestamp*\n\n🕐 *Unix:* ${now}\n📅 *Date:* ${date.toUTCString()}\n🕒 *Local:* ${date.toLocaleString()}${FOOTER}`);
    }
    const num = parseInt(input);
    if (!isNaN(num)) {
      const d = new Date(num > 1e10 ? num : num * 1000);
      return reply(`⏰ *Timestamp Converter*\n\n🔢 *Unix:* ${num}\n📅 *UTC:* ${d.toUTCString()}\n🕒 *Local:* ${d.toLocaleString()}${FOOTER}`);
    }
    const d = new Date(input);
    if (isNaN(d.getTime())) return reply(`❌ Invalid date format.${FOOTER}`);
    return reply(`⏰ *Date to Timestamp*\n\n📅 *Date:* ${d.toUTCString()}\n🔢 *Unix:* ${Math.floor(d.getTime() / 1000)}${FOOTER}`);
  },
});

registerCommand({
  name: "uuid",
  aliases: ["guidgen", "uuidgen"],
  category: "Tools",
  description: "Generate a random UUID / GUID",
  handler: async ({ args, reply }) => {
    const count = Math.min(parseInt(args[0]) || 1, 10);
    const uuids = Array.from({ length: count }, () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
      });
    });
    await reply(`🆔 *Generated UUID${count > 1 ? "s" : ""}*\n\n${uuids.join("\n")}${FOOTER}`);
  },
});

registerCommand({
  name: "urlencode",
  aliases: ["urlenc", "encodeurl"],
  category: "Tools",
  description: "URL encode/decode text (.urlencode encode hello world / .urlencode decode hello%20world)",
  handler: async ({ args, reply }) => {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(" ");
    if (!mode || !text) return reply(`❓ Usage: .urlencode <encode/decode> <text>`);
    try {
      const result = mode === "encode" || mode === "enc"
        ? encodeURIComponent(text)
        : decodeURIComponent(text);
      await reply(`🔗 *URL ${mode === "encode" || mode === "enc" ? "Encode" : "Decode"}*\n\n*Input:* ${text}\n*Output:* ${result}${FOOTER}`);
    } catch {
      await reply(`❌ Invalid input for URL decode.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "colorhex",
  aliases: ["colorinfo", "hexcolor"],
  category: "Tools",
  description: "Get color info from hex code (.colorhex FF5733)",
  handler: async ({ args, reply }) => {
    const hex = args[0]?.replace("#", "");
    if (!hex || !/^[0-9a-fA-F]{6}$/.test(hex)) return reply(`❓ Usage: .colorhex <hex>\nExample: .colorhex FF5733`);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const h = Math.max(r, g, b), l2 = Math.min(r, g, b);
    let hue = 0;
    if (h !== l2) {
      if (h === r) hue = ((g - b) / (h - l2)) % 6;
      else if (h === g) hue = (b - r) / (h - l2) + 2;
      else hue = (r - g) / (h - l2) + 4;
    }
    hue = Math.round(hue * 60 + 360) % 360;
    const lum = Math.round((h + l2) / 510 * 100);
    const sat = h === l2 ? 0 : Math.round((h - l2) / (1 - Math.abs(2 * lum / 100 - 1)) / 2.55);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? "Dark text recommended" : "Light text recommended";
    await reply(
      `🎨 *Color: #${hex.toUpperCase()}*\n\n` +
      `🔴 *R:* ${r}\n🟢 *G:* ${g}\n🔵 *B:* ${b}\n\n` +
      `🌈 *HSL:* hsl(${hue}, ${sat}%, ${lum}%)\n` +
      `💡 *Brightness:* ${Math.round(brightness)}/255\n` +
      `📝 *Usage:* ${textColor}${FOOTER}`
    );
  },
});

// ── Games / Fun ───────────────────────────────────────────────────────────────

registerCommand({
  name: "rps",
  aliases: ["rockpaperscissors", "roshambo"],
  category: "Games",
  description: "Play Rock Paper Scissors against the bot (.rps rock)",
  handler: async ({ args, reply }) => {
    const choices = ["rock", "paper", "scissors"];
    const emojis: Record<string, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
    const player = args[0]?.toLowerCase();
    if (!player || !choices.includes(player)) return reply(`❓ Usage: .rps <rock/paper/scissors>`);
    const bot = choices[Math.floor(Math.random() * 3)];
    let result: string;
    if (player === bot) result = "🤝 *It's a tie!*";
    else if ((player === "rock" && bot === "scissors") || (player === "paper" && bot === "rock") || (player === "scissors" && bot === "paper")) {
      result = "🎉 *You WIN!*";
    } else result = "😅 *Bot WINS!*";
    await reply(`✊ *Rock Paper Scissors*\n\nYou: ${emojis[player]} ${player}\nBot: ${emojis[bot]} ${bot}\n\n${result}${FOOTER}`);
  },
});

registerCommand({
  name: "dice",
  aliases: ["rolldice", "d6"],
  category: "Games",
  description: "Roll dice (.dice or .dice 3d6 or .dice 1d20)",
  handler: async ({ args, reply }) => {
    const input = args[0] || "1d6";
    const match = input.match(/^(\d+)d(\d+)$/i);
    if (!match) return reply(`❓ Usage: .dice [NdS]\nExamples: .dice (1d6) | .dice 2d6 | .dice 1d20`);
    const [, numStr, sidesStr] = match;
    const num = Math.min(parseInt(numStr), 10);
    const sides = Math.min(parseInt(sidesStr), 100);
    const rolls = Array.from({ length: num }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    await reply(`🎲 *Dice Roll: ${num}d${sides}*\n\nRolls: ${rolls.join(" + ")}\n\n🎯 *Total: ${total}*${FOOTER}`);
  },
});

registerCommand({
  name: "lotto",
  aliases: ["lottery", "lottonums"],
  category: "Games",
  description: "Generate random lottery numbers (.lotto or .lotto 6 49)",
  handler: async ({ args, reply }) => {
    const count = Math.min(parseInt(args[0]) || 6, 10);
    const max = Math.min(parseInt(args[1]) || 49, 200);
    const nums = new Set<number>();
    while (nums.size < count) nums.add(Math.floor(Math.random() * max) + 1);
    const bonus = Math.floor(Math.random() * max) + 1;
    const sorted = [...nums].sort((a, b) => a - b);
    await reply(`🎰 *Lottery Numbers*\n\n🔢 ${sorted.join(" • ")}\n⭐ *Bonus:* ${bonus}\n\n_Good luck! 🍀_${FOOTER}`);
  },
});

registerCommand({
  name: "iq",
  aliases: ["iqtest", "myiq"],
  category: "Games",
  description: "Get a fun (random) IQ score",
  handler: async ({ senderName, msg, reply }) => {
    const name = senderName;
    const seed = (name + new Date().toDateString()).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const iq = (seed % 80) + 90; // 90 to 169
    let cat = "";
    if (iq >= 160) cat = "🧠 Genius level!";
    else if (iq >= 130) cat = "✨ Highly gifted!";
    else if (iq >= 115) cat = "💡 Above average";
    else if (iq >= 85) cat = "✅ Average";
    else cat = "📚 Room to grow!";
    const bar = "█".repeat(Math.round(iq / 20)) + "░".repeat(10 - Math.round(iq / 20));
    await reply(`🧠 *IQ Test: ${name}*\n\n${bar}\n\n📊 *Your IQ:* ${iq}\n🏷️ *Category:* ${cat}\n\n_Score refreshes daily!_${FOOTER}`);
  },
});

registerCommand({
  name: "ship",
  aliases: ["shipnames", "couple"],
  category: "Games",
  description: "Ship two people together (.ship Alice Bob)",
  handler: async ({ args, reply }) => {
    const [a, b] = [args[0], args[1]];
    if (!a || !b) return reply(`❓ Usage: .ship <name1> <name2>\nExample: .ship Alice Bob`);
    const half1 = a.slice(0, Math.ceil(a.length / 2));
    const half2 = b.slice(Math.floor(b.length / 2));
    const shipName = half1 + half2;
    const seed = (a + b).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = (seed % 100) + 1;
    const hearts = "❤️".repeat(Math.round(score / 10)) + "🖤".repeat(10 - Math.round(score / 10));
    await reply(`💑 *Ship: ${a} + ${b}*\n\n💌 *Ship Name:* ${shipName}\n${hearts}\n❤️ *Score:* ${score}%\n\n${score >= 80 ? "🔥 PERFECT MATCH!" : score >= 60 ? "💕 Strong chemistry!" : score >= 40 ? "🙈 Possible..." : "😬 Hmm, not sure..."}${FOOTER}`);
  },
});

registerCommand({
  name: "vibe",
  aliases: ["vibecheck", "myvibes"],
  category: "Games",
  description: "Check your vibe for today",
  handler: async ({ senderName, msg, reply }) => {
    const name = senderName;
    const vibes = [
      { v: "IMMACULATE ✨", d: "You are absolutely radiating today. Stay on this frequency!", c: "🟢" },
      { v: "CHAOTIC 🌪️", d: "Energy is all over the place — embrace the madness!", c: "🟡" },
      { v: "CHILL ❄️", d: "Cool and collected. Nothing is bothering you today.", c: "🔵" },
      { v: "GRIND MODE 💪", d: "You're locked in. Nothing stopping you today.", c: "🟠" },
      { v: "MYSTERIOUS 🌙", d: "Dark, deep, and unpredictable. People are intrigued.", c: "🟣" },
      { v: "WHOLESOME 🌻", d: "Pure and kind energy. The world needs you!", c: "💛" },
      { v: "DANGEROUS 🔥", d: "Don't mess with this one. You came to WIN.", c: "🔴" },
      { v: "SOFT 🧸", d: "Gentle, caring, and full of love today.", c: "🩷" },
    ];
    const v = vibes[Math.abs((name + new Date().toDateString()).split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % vibes.length];
    await reply(`${v.c} *Vibe Check: ${name}*\n\n⚡ *Today's Vibe:* ${v.v}\n\n💬 ${v.d}${FOOTER}`);
  },
});

registerCommand({
  name: "aura",
  aliases: ["myaura", "auracolor"],
  category: "Games",
  description: "Find out your aura color",
  handler: async ({ senderName, msg, reply }) => {
    const name = senderName;
    const auras = [
      { color: "Red 🔴", meaning: "Passion, strength, and intense energy. You are a natural leader." },
      { color: "Orange 🟠", meaning: "Creativity and enthusiasm. You have vibrant, adventurous energy." },
      { color: "Yellow 🟡", meaning: "Intellect and optimism. You radiate positivity and mental clarity." },
      { color: "Green 💚", meaning: "Balance and healing. You are compassionate and connected to nature." },
      { color: "Blue 🔵", meaning: "Truth and intuition. You communicate deeply and inspire others." },
      { color: "Indigo 💜", meaning: "Wisdom and spiritual depth. You perceive things beyond the surface." },
      { color: "Violet 🟣", meaning: "Mystical energy. You are imaginative, intuitive, and deeply spiritual." },
      { color: "White ⚪", meaning: "Pure, divine energy. You carry a rare, high vibrational frequency." },
      { color: "Gold ✨", meaning: "Divine protection and wisdom. You are blessed and radiate abundance." },
    ];
    const a = auras[Math.abs((name + new Date().toDateString()).split("").reduce((s, c) => s + c.charCodeAt(0), 0)) % auras.length];
    await reply(`🌌 *Aura Reading: ${name}*\n\n${a.color} *Aura*\n\n${a.meaning}${FOOTER}`);
  },
});

registerCommand({
  name: "personality",
  aliases: ["mytype", "mbti"],
  category: "Games",
  description: "Get a fun personality type reading",
  handler: async ({ senderName, msg, reply }) => {
    const name = senderName;
    const types = [
      { type: "ENFJ — The Protagonist", desc: "Charismatic and inspiring leader who captivates those around them." },
      { type: "INTJ — The Architect", desc: "Imaginative and strategic thinker with a plan for everything." },
      { type: "INFP — The Mediator", desc: "Poetic, kind, and altruistic. Always eager to help a good cause." },
      { type: "ENTJ — The Commander", desc: "Bold, imaginative, and strong-willed leader who finds a way." },
      { type: "ISTP — The Virtuoso", desc: "Bold and practical experimenter who masters tools and crafts." },
      { type: "ESFP — The Entertainer", desc: "Spontaneous, energetic, and enthusiastic — life is never boring." },
      { type: "INFJ — The Advocate", desc: "Quiet, mystical, yet inspiring — with an unshakeable idealism." },
      { type: "ENTP — The Debater", desc: "Smart and curious thinker who cannot resist an intellectual challenge." },
    ];
    const t = types[Math.abs((name + new Date().toDateString()).split("").reduce((s, c) => s + c.charCodeAt(0), 0)) % types.length];
    await reply(`🧬 *Personality Type: ${name}*\n\n*${t.type}*\n\n${t.desc}${FOOTER}`);
  },
});

registerCommand({
  name: "fortune",
  aliases: ["fortunecookie", "cookie"],
  category: "Games",
  description: "Crack open a fortune cookie",
  handler: async ({ reply }) => {
    const fortunes = [
      "The fortune you seek is in another cookie.",
      "A beautiful, smart, and loving person will be coming into your life.",
      "Today is the last day of your life so far.",
      "Help! I am being held prisoner in a fortune cookie factory.",
      "Your future will be happy and bright.",
      "Do not mistake temptation for opportunity.",
      "A dream you have will come true… eventually.",
      "Someone is thinking of you right now. It might be the tax office.",
      "Be yourself — everyone else is already taken.",
      "The more you know, the less you need to show.",
      "Every storm runs out of rain. Keep pushing.",
      "You will find great joy in something you discover today.",
    ];
    await reply(`🥠 *Fortune Cookie*\n\n🔮 _${fortunes[Math.floor(Math.random() * fortunes.length)]}_${FOOTER}`);
  },
});

registerCommand({
  name: "scenario",
  aliases: ["whatif", "hypothetical"],
  category: "Games",
  description: "Get a random hypothetical scenario to discuss",
  handler: async ({ reply }) => {
    const scenarios = [
      "What if you woke up tomorrow and could speak every language fluently?",
      "If you could live anywhere on Earth rent-free, where would you go?",
      "What if humans could photosynthesize like plants — no more hunger, but you can't go indoors?",
      "If you had to eat one food forever, what would it be?",
      "What if you could only lie for one day — how would you use it?",
      "If you could swap lives with any person for a week, who and why?",
      "What if social media was banned globally for 1 year?",
      "If you could only use 3 apps on your phone, which would you choose?",
      "What if you found out your life was a simulation right now?",
      "If you could remove one invention from history, what would it be?",
    ];
    await reply(`💭 *Hypothetical Scenario*\n\n_${scenarios[Math.floor(Math.random() * scenarios.length)]}_\n\nShare your answer!${FOOTER}`);
  },
});

// ── AI-powered content creators ───────────────────────────────────────────────

registerCommand({
  name: "caption",
  aliases: ["igcaption", "postcaption"],
  category: "AI",
  description: "Generate an Instagram-worthy caption (.caption beach sunset vibes)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "life";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write 3 creative Instagram captions for: ${topic}. Each should be 1-2 lines with relevant emojis and 3-5 hashtags. Number them 1, 2, 3.`)}`);
      const data = await res.json() as any;
      await reply(`📸 *Caption Ideas: ${topic}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Caption generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "hashtags",
  aliases: ["tags", "generatetags"],
  category: "AI",
  description: "Generate trending hashtags for a topic (.hashtags travel photography)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "lifestyle";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Generate 20 relevant and trending hashtags for the topic: ${topic}. Group them into 3 tiers: Popular, Niche, and Branded. Format clearly.`)}`);
      const data = await res.json() as any;
      await reply(`#️⃣ *Hashtags: ${topic}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Hashtag generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "biogen",
  aliases: ["writebio", "biogenerator", "genbio"],
  category: "AI",
  description: "Generate a professional or social media bio (.biogen photographer Lagos)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "entrepreneur";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write 2 versions of a punchy social media bio for: ${topic}. Version 1: professional/LinkedIn style. Version 2: casual/Instagram style. Keep each under 150 characters.`)}`);
      const data = await res.json() as any;
      await reply(`👤 *Bio Generator: ${topic}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Bio generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "tweetgen",
  aliases: ["tweet", "writetweet"],
  category: "AI",
  description: "Generate a viral tweet on any topic (.tweetgen cryptocurrency is the future)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "life lessons";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write 3 viral tweet options about: ${topic}. Each must be under 280 characters, impactful, and shareable. Number them 1, 2, 3.`)}`);
      const data = await res.json() as any;
      await reply(`🐦 *Tweet Generator*\n\nTopic: ${topic}\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Tweet generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "emailgen",
  aliases: ["email", "writeemail"],
  category: "AI",
  description: "Generate a professional email (.emailgen job application for software developer)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || "business inquiry";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write a professional email for: ${topic}. Include Subject line, greeting, body (3 short paragraphs), closing. Keep it concise and professional.`)}`);
      const data = await res.json() as any;
      await reply(`📧 *Email Generator*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Email generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "pitch",
  aliases: ["elevatorpitch", "startup"],
  category: "AI",
  description: "Generate an elevator pitch for your idea (.pitch app that connects farmers to buyers)",
  handler: async ({ args, reply }) => {
    const idea = args.join(" ") || "a new startup idea";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Write a compelling 30-second elevator pitch for: ${idea}. Include: problem, solution, target market, and one call-to-action. Max 100 words.`)}`);
      const data = await res.json() as any;
      await reply(`🚀 *Elevator Pitch*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Pitch generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "roastme",
  aliases: ["selfroast", "roastyourself"],
  category: "AI",
  description: "Get an AI to roast your WhatsApp display name",
  handler: async ({ senderName, msg, reply }) => {
    const name = senderName;
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Give a short (2-3 sentence) funny savage roast to someone whose WhatsApp name is: "${name}". Be creative, playful, and not offensive.`)}`);
      const data = await res.json() as any;
      await reply(`🔥 *Roast: ${name}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Roast failed. Even AI felt bad for you.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "namecheck",
  aliases: ["meaning", "namemeaning"],
  category: "AI",
  description: "Find the meaning of any name (.namecheck Emmanuel)",
  handler: async ({ args, reply }) => {
    const name = args.join(" ");
    if (!name) return reply(`❓ Usage: .namecheck <name>\nExample: .namecheck Emmanuel`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Tell me the origin and meaning of the name: ${name}. Include language of origin, historical context, and personality traits commonly associated with this name.`)}`);
      const data = await res.json() as any;
      await reply(`📛 *Name: ${name}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Name lookup failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "debate",
  aliases: ["argue", "bothsides"],
  category: "AI",
  description: "Get AI to argue both sides of a topic (.debate social media is harmful)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ");
    if (!topic) return reply(`❓ Usage: .debate <topic>\nExample: .debate AI will replace jobs`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Give 3 strong arguments FOR and 3 strong arguments AGAINST: "${topic}". Label them clearly as FOR and AGAINST.`)}`);
      const data = await res.json() as any;
      await reply(`⚖️ *Debate: ${topic}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Debate generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "explain",
  aliases: ["eli5", "explain5"],
  category: "AI",
  description: "Explain anything in simple terms (.explain how does the internet work)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ");
    if (!topic) return reply(`❓ Usage: .explain <topic>\nExample: .explain how does WiFi work`);
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Explain "${topic}" as if I'm 10 years old. Use simple words, fun analogies, and no technical jargon. Keep it under 150 words.`)}`);
      const data = await res.json() as any;
      await reply(`🧒 *Simple Explanation*\n\n*${topic}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Explanation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "funfact2",
  aliases: ["ffact", "interestfact"],
  category: "AI",
  description: "Get an AI-generated interesting fact about any topic (.funfact2 black holes)",
  handler: async ({ args, reply }) => {
    const topic = args.join(" ") || Math.random() > 0.5 ? "nature" : "technology";
    try {
      const res = await fetch(`https://api.eliteprotech.com/copilot?q=${encodeURIComponent(`Give me one mind-blowing, little-known fact about: ${topic}. Make it fascinating and well-sourced. Max 80 words.`)}`);
      const data = await res.json() as any;
      await reply(`🤯 *Mind-Blowing Fact: ${topic}*\n\n${data.response || data.answer || data.text}${FOOTER}`);
    } catch {
      await reply(`❌ Fact generation failed.${FOOTER}`);
    }
  },
});

// ── Owner extras ──────────────────────────────────────────────────────────────

registerCommand({
  name: "broadcast2",
  aliases: ["bcast2"],
  category: "Owner",
  description: "Broadcast a message with delay (.broadcast2 Hello everyone!)",
  handler: async ({ sock, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .broadcast2 <message>`);
    const chats = await (sock as any).groupFetchAllParticipating?.();
    if (!chats) return reply(`❌ No groups found or not connected.${FOOTER}`);
    const groups = Object.keys(chats);
    await reply(`📢 Broadcasting to ${groups.length} groups...`);
    let count = 0;
    for (const jid of groups) {
      await sock.sendMessage(jid, { text: `📢 *Broadcast*\n\n${text}${FOOTER}` });
      count++;
      await new Promise(r => setTimeout(r, 800));
    }
    await reply(`✅ Broadcast sent to ${count} groups.${FOOTER}`);
  },
});

registerCommand({
  name: "botuptime",
  aliases: ["sysuptime", "sysruntime", "botstatus"],
  category: "Owner",
  description: "Get bot uptime and system info",
  handler: async ({ reply }) => {
    const { default: os } = await import("os");
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const totalB = os.totalmem();
    const freeB  = os.freemem();
    const usedB  = totalB - freeB;
    const usedMB  = (usedB  / 1024 / 1024).toFixed(0);
    const totalMB = (totalB / 1024 / 1024).toFixed(0);
    const freeMB  = (freeB  / 1024 / 1024).toFixed(0);
    const pct = Math.round((usedB / totalB) * 100);
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    await reply(
      `⚙️ *Bot System Info*\n\n` +
      `⏱️ *Uptime:* ${h}h ${m}m ${s}s\n` +
      `💾 *RAM Used:* ${usedMB} MB / ${totalMB} MB [${pct}%]\n` +
      `🆓 *RAM Free:* ${freeMB} MB\n` +
      `${bar}\n` +
      `⚡ *Node:* ${process.version}\n` +
      `🖥️ *Platform:* ${process.platform} (${os.arch()})\n` +
      `🧮 *CPU Cores:* ${os.cpus().length}\n` +
      `🕒 *Started:* ${new Date(Date.now() - uptime * 1000).toLocaleString()}${FOOTER}`
    );
  },
});

registerCommand({
  name: "changelog",
  aliases: ["updates", "whatisnew"],
  category: "General",
  description: "See what's new in MAXX-XMD",
  handler: async ({ reply }) => {
    await reply(
      `📋 *MAXX-XMD Changelog*\n\n` +
      `*v2.0 — Latest* 🔥\n` +
      `• 200+ new commands added\n` +
      `• Anime & Pokémon modules\n` +
      `• Math & Education module\n` +
      `• Finance calculator module\n` +
      `• Health & lifestyle commands\n` +
      `• 25+ text effect tools\n` +
      `• 10+ AI content generators\n` +
      `• Reaction GIF system\n\n` +
      `*v1.0*\n` +
      `• Initial 580+ commands\n` +
      `• Photo generation (AI + Unsplash)\n` +
      `• Music & video download\n` +
      `• Group management\n` +
      `• Weather, crypto, translate${FOOTER}`
    );
  },
});

registerCommand({
  name: "cmdhelp",
  aliases: ["commandinfo", "cmdi"],
  category: "General",
  description: "Show help info for a specific command (.cmdhelp anime)",
  handler: async ({ args, reply }) => {
    if (!args[0]) return reply(`❓ Usage: .help <command>\nExample: .help anime\n\nUse *.menu* to see all commands.${FOOTER}`);
    const { commandRegistry } = await import("./types.js");
    const cmd = commandRegistry.get(args[0].toLowerCase());
    if (!cmd) return reply(`❌ Command *${args[0]}* not found.\nUse *.menu* to see all commands.${FOOTER}`);
    await reply(
      `📖 *Command: .${cmd.name}*\n\n` +
      `🏷️ *Category:* ${cmd.category}\n` +
      `📝 *Description:* ${cmd.description}\n` +
      (cmd.aliases?.length ? `🔁 *Aliases:* ${cmd.aliases.map(a => `.${a}`).join(", ")}\n` : "") +
      (cmd.groupOnly ? `👥 *Group Only*\n` : "") +
      (cmd.ownerOnly ? `👑 *Owner Only*\n` : "")
      + FOOTER
    );
  },
});
