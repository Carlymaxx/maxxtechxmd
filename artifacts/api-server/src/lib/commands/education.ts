import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── Math ──────────────────────────────────────────────────────────────────────

registerCommand({
  name: "prime",
  aliases: ["isprime", "checkprime"],
  category: "Math",
  description: "Check if a number is prime (.prime 97)",
  handler: async ({ args, reply }) => {
    const n = parseInt(args[0]);
    if (isNaN(n) || n < 1) return reply(`❓ Usage: .prime <number>\nExample: .prime 97`);
    if (n === 1) return reply(`🔢 *1* is neither prime nor composite.${FOOTER}`);
    let isPrime = n > 1;
    for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) { isPrime = false; break; } }
    const factors: number[] = [];
    if (!isPrime) {
      let num = n;
      for (let i = 2; i <= num; i++) { while (num % i === 0) { factors.push(i); num /= i; } }
    }
    await reply(
      `🔢 *Prime Check: ${n}*\n\n${isPrime ? `✅ *${n}* is a PRIME number!` : `❌ *${n}* is NOT prime.\n🧩 Factors: ${factors.join(" × ")}`}${FOOTER}`
    );
  },
});

registerCommand({
  name: "fibonacci",
  aliases: ["fib", "fibseq"],
  category: "Math",
  description: "Generate Fibonacci sequence (.fibonacci 15) max 30",
  handler: async ({ args, reply }) => {
    const n = Math.min(parseInt(args[0]) || 10, 30);
    if (n < 1) return reply(`❓ Usage: .fibonacci <count>\nExample: .fibonacci 15`);
    const seq: bigint[] = [0n, 1n];
    for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);
    await reply(`🌀 *Fibonacci Sequence (${n} terms)*\n\n${seq.slice(0, n).join(", ")}${FOOTER}`);
  },
});

registerCommand({
  name: "factorial",
  aliases: ["fact2", "factcalc"],
  category: "Math",
  description: "Calculate factorial (.factorial 12) max 20",
  handler: async ({ args, reply }) => {
    const n = parseInt(args[0]);
    if (isNaN(n) || n < 0) return reply(`❓ Usage: .factorial <number>\nExample: .factorial 10`);
    if (n > 20) return reply(`❌ Max is 20 to avoid overflow.${FOOTER}`);
    let result = 1n;
    for (let i = 2n; i <= BigInt(n); i++) result *= i;
    await reply(`🔢 *Factorial*\n\n${n}! = *${result}*${FOOTER}`);
  },
});

registerCommand({
  name: "gcd",
  aliases: ["hcf", "lcm"],
  category: "Math",
  description: "Calculate GCD and LCM of two numbers (.gcd 12 18)",
  handler: async ({ args, reply }) => {
    const [a, b] = args.map(Number);
    if (!a || !b) return reply(`❓ Usage: .gcd <a> <b>\nExample: .gcd 12 18`);
    function gcdFn(x: number, y: number): number { return y === 0 ? x : gcdFn(y, x % y); }
    const g = gcdFn(Math.abs(a), Math.abs(b));
    const l = Math.abs(a * b) / g;
    await reply(`🔢 *GCD / LCM*\n\nNumbers: ${a} and ${b}\n\n🔗 GCD (HCF): *${g}*\n📐 LCM: *${l}*${FOOTER}`);
  },
});

registerCommand({
  name: "sqrt",
  aliases: ["squareroot", "root"],
  category: "Math",
  description: "Calculate square/cube root (.sqrt 144 / .sqrt 27 3)",
  handler: async ({ args, reply }) => {
    const n = parseFloat(args[0]);
    const deg = parseInt(args[1]) || 2;
    if (isNaN(n)) return reply(`❓ Usage: .sqrt <number> [degree]\nExamples:\n  .sqrt 144\n  .sqrt 27 3`);
    if (n < 0 && deg % 2 === 0) return reply(`❌ Cannot take even root of negative number.${FOOTER}`);
    const result = n < 0 ? -Math.pow(-n, 1 / deg) : Math.pow(n, 1 / deg);
    await reply(`📐 *${deg === 2 ? "Square" : "Cube"} Root*\n\n${deg === 2 ? "√" : "∛"}${n} = *${result.toFixed(8).replace(/\.?0+$/, "")}*${FOOTER}`);
  },
});

registerCommand({
  name: "power",
  aliases: ["exponent", "pow"],
  category: "Math",
  description: "Calculate base to the power (.power 2 10)",
  handler: async ({ args, reply }) => {
    const base = parseFloat(args[0]);
    const exp = parseFloat(args[1]);
    if (isNaN(base) || isNaN(exp)) return reply(`❓ Usage: .power <base> <exponent>\nExample: .power 2 10`);
    const result = Math.pow(base, exp);
    await reply(`⚡ *Exponent*\n\n${base}^${exp} = *${result}*${FOOTER}`);
  },
});

registerCommand({
  name: "log",
  aliases: ["logarithm", "ln"],
  category: "Math",
  description: "Calculate logarithm (.log 100 10 / .log 100 = base e)",
  handler: async ({ args, reply }) => {
    const n = parseFloat(args[0]);
    const base = parseFloat(args[1]);
    if (isNaN(n) || n <= 0) return reply(`❓ Usage: .log <number> [base]\nExamples:\n  .log 100 10\n  .log 100 (uses base e)`);
    const result = isNaN(base) ? Math.log(n) : Math.log(n) / Math.log(base);
    const label = isNaN(base) ? "ln" : `log${base}`;
    await reply(`📊 *Logarithm*\n\n${label}(${n}) = *${result.toFixed(10).replace(/\.?0+$/, "")}*${FOOTER}`);
  },
});

registerCommand({
  name: "stats",
  aliases: ["statistics", "statscalc"],
  category: "Math",
  description: "Statistical analysis of numbers (.stats 5 10 15 20 25)",
  handler: async ({ args, reply }) => {
    const nums = args.map(Number).filter(n => !isNaN(n));
    if (nums.length < 2) return reply(`❓ Usage: .stats <numbers...>\nExample: .stats 5 10 15 20 25`);
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / nums.length;
    const median = nums.length % 2 === 0
      ? (sorted[nums.length / 2 - 1] + sorted[nums.length / 2]) / 2
      : sorted[Math.floor(nums.length / 2)];
    const variance = nums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / nums.length;
    const std = Math.sqrt(variance);
    const freq: Record<number, number> = {};
    nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.keys(freq).filter(k => freq[Number(k)] === maxFreq);
    await reply(
      `📊 *Statistics*\n\n📋 *Data:* ${nums.join(", ")}\n\n` +
      `Σ *Sum:* ${sum}\n` +
      `📈 *Mean:* ${mean.toFixed(4)}\n` +
      `🎯 *Median:* ${median}\n` +
      `🔁 *Mode:* ${modes.join(", ")}\n` +
      `📉 *Min:* ${sorted[0]}\n` +
      `📈 *Max:* ${sorted[sorted.length - 1]}\n` +
      `📊 *Range:* ${sorted[sorted.length - 1] - sorted[0]}\n` +
      `📐 *Std Dev:* ${std.toFixed(4)}\n` +
      `🔢 *Variance:* ${variance.toFixed(4)}${FOOTER}`
    );
  },
});

registerCommand({
  name: "combinations",
  aliases: ["ncr", "choose"],
  category: "Math",
  description: "Calculate combinations nCr (.combinations 10 3)",
  handler: async ({ args, reply }) => {
    const n = parseInt(args[0]);
    const r = parseInt(args[1]);
    if (isNaN(n) || isNaN(r) || n < 0 || r < 0) return reply(`❓ Usage: .combinations <n> <r>\nExample: .combinations 10 3`);
    if (r > n) return reply(`❌ r cannot be greater than n.${FOOTER}`);
    function fact(x: number): number { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; }
    const result = fact(n) / (fact(r) * fact(n - r));
    await reply(`🔢 *Combinations (nCr)*\n\nC(${n}, ${r}) = *${result}*\n\n_Choosing ${r} items from ${n} items (order doesn't matter)_${FOOTER}`);
  },
});

registerCommand({
  name: "permutations",
  aliases: ["npr", "arrange"],
  category: "Math",
  description: "Calculate permutations nPr (.permutations 10 3)",
  handler: async ({ args, reply }) => {
    const n = parseInt(args[0]);
    const r = parseInt(args[1]);
    if (isNaN(n) || isNaN(r) || n < 0 || r < 0) return reply(`❓ Usage: .permutations <n> <r>\nExample: .permutations 10 3`);
    if (r > n) return reply(`❌ r cannot be greater than n.${FOOTER}`);
    function fact(x: number): number { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; }
    const result = fact(n) / fact(n - r);
    await reply(`🔢 *Permutations (nPr)*\n\nP(${n}, ${r}) = *${result}*\n\n_Arranging ${r} items from ${n} items (order matters)_${FOOTER}`);
  },
});

registerCommand({
  name: "fraction",
  aliases: ["simplify", "reducefrac"],
  category: "Math",
  description: "Simplify a fraction (.fraction 8 12)",
  handler: async ({ args, reply }) => {
    const num = parseInt(args[0]);
    const den = parseInt(args[1]);
    if (isNaN(num) || isNaN(den) || den === 0) return reply(`❓ Usage: .fraction <numerator> <denominator>\nExample: .fraction 8 12`);
    function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
    const g = gcd(Math.abs(num), Math.abs(den));
    const sn = num / g, sd = den / g;
    const decimal = num / den;
    const sign = (den < 0 ? -1 : 1) * (num < 0 ? -1 : 1);
    await reply(
      `➗ *Fraction Simplifier*\n\n${num}/${den} = *${Math.abs(sn)}/${Math.abs(sd)}* ${sign < 0 ? "(negative)" : ""}\n\n🔢 *Decimal:* ${decimal.toFixed(6)}\n📊 *Percentage:* ${(decimal * 100).toFixed(4)}%${FOOTER}`
    );
  },
});

registerCommand({
  name: "hexconv",
  aliases: ["hex", "hexconvert"],
  category: "Math",
  description: "Convert between number bases (.hexconv 255 / .hexconv FF hex)",
  handler: async ({ args, reply }) => {
    const input = args[0];
    const fromBase = args[1]?.toLowerCase();
    if (!input) return reply(`❓ Usage: .hexconv <number> [hex/bin/oct]\nExamples:\n  .hexconv 255 (dec to all)\n  .hexconv FF hex (hex to all)\n  .hexconv 11111111 bin`);
    let decimal: number;
    if (fromBase === "hex") decimal = parseInt(input, 16);
    else if (fromBase === "bin") decimal = parseInt(input, 2);
    else if (fromBase === "oct") decimal = parseInt(input, 8);
    else decimal = parseInt(input, 10);
    if (isNaN(decimal)) return reply(`❌ Invalid input.${FOOTER}`);
    await reply(
      `🔢 *Number Base Converter*\n\n📊 Decimal: *${decimal}*\n🔷 Hex: *${decimal.toString(16).toUpperCase()}*\n💻 Binary: *${decimal.toString(2)}*\n🔢 Octal: *${decimal.toString(8)}*${FOOTER}`
    );
  },
});

// ── Science / Education ───────────────────────────────────────────────────────

const ELEMENTS: Record<string, any> = {
  h: { name: "Hydrogen", symbol: "H", num: 1, mass: 1.008, cat: "Nonmetal", config: "1s¹" },
  he: { name: "Helium", symbol: "He", num: 2, mass: 4.003, cat: "Noble Gas", config: "1s²" },
  li: { name: "Lithium", symbol: "Li", num: 3, mass: 6.941, cat: "Alkali Metal", config: "[He] 2s¹" },
  be: { name: "Beryllium", symbol: "Be", num: 4, mass: 9.012, cat: "Alkaline Earth Metal", config: "[He] 2s²" },
  b: { name: "Boron", symbol: "B", num: 5, mass: 10.811, cat: "Metalloid", config: "[He] 2s² 2p¹" },
  c: { name: "Carbon", symbol: "C", num: 6, mass: 12.011, cat: "Nonmetal", config: "[He] 2s² 2p²" },
  n: { name: "Nitrogen", symbol: "N", num: 7, mass: 14.007, cat: "Nonmetal", config: "[He] 2s² 2p³" },
  o: { name: "Oxygen", symbol: "O", num: 8, mass: 15.999, cat: "Nonmetal", config: "[He] 2s² 2p⁴" },
  f: { name: "Fluorine", symbol: "F", num: 9, mass: 18.998, cat: "Halogen", config: "[He] 2s² 2p⁵" },
  ne: { name: "Neon", symbol: "Ne", num: 10, mass: 20.180, cat: "Noble Gas", config: "[He] 2s² 2p⁶" },
  na: { name: "Sodium", symbol: "Na", num: 11, mass: 22.990, cat: "Alkali Metal", config: "[Ne] 3s¹" },
  mg: { name: "Magnesium", symbol: "Mg", num: 12, mass: 24.305, cat: "Alkaline Earth Metal", config: "[Ne] 3s²" },
  al: { name: "Aluminium", symbol: "Al", num: 13, mass: 26.982, cat: "Post-transition Metal", config: "[Ne] 3s² 3p¹" },
  si: { name: "Silicon", symbol: "Si", num: 14, mass: 28.086, cat: "Metalloid", config: "[Ne] 3s² 3p²" },
  p: { name: "Phosphorus", symbol: "P", num: 15, mass: 30.974, cat: "Nonmetal", config: "[Ne] 3s² 3p³" },
  s: { name: "Sulfur", symbol: "S", num: 16, mass: 32.065, cat: "Nonmetal", config: "[Ne] 3s² 3p⁴" },
  cl: { name: "Chlorine", symbol: "Cl", num: 17, mass: 35.453, cat: "Halogen", config: "[Ne] 3s² 3p⁵" },
  ar: { name: "Argon", symbol: "Ar", num: 18, mass: 39.948, cat: "Noble Gas", config: "[Ne] 3s² 3p⁶" },
  k: { name: "Potassium", symbol: "K", num: 19, mass: 39.098, cat: "Alkali Metal", config: "[Ar] 4s¹" },
  ca: { name: "Calcium", symbol: "Ca", num: 20, mass: 40.078, cat: "Alkaline Earth Metal", config: "[Ar] 4s²" },
  fe: { name: "Iron", symbol: "Fe", num: 26, mass: 55.845, cat: "Transition Metal", config: "[Ar] 3d⁶ 4s²" },
  cu: { name: "Copper", symbol: "Cu", num: 29, mass: 63.546, cat: "Transition Metal", config: "[Ar] 3d¹⁰ 4s¹" },
  zn: { name: "Zinc", symbol: "Zn", num: 30, mass: 65.38, cat: "Transition Metal", config: "[Ar] 3d¹⁰ 4s²" },
  ag: { name: "Silver", symbol: "Ag", num: 47, mass: 107.868, cat: "Transition Metal", config: "[Kr] 4d¹⁰ 5s¹" },
  au: { name: "Gold", symbol: "Au", num: 79, mass: 196.967, cat: "Transition Metal", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹" },
  hg: { name: "Mercury", symbol: "Hg", num: 80, mass: 200.592, cat: "Transition Metal", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²" },
  pb: { name: "Lead", symbol: "Pb", num: 82, mass: 207.2, cat: "Post-transition Metal", config: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²" },
  u: { name: "Uranium", symbol: "U", num: 92, mass: 238.029, cat: "Actinide", config: "[Rn] 5f³ 6d¹ 7s²" },
};

registerCommand({
  name: "element",
  aliases: ["periodic", "chem"],
  category: "Education",
  description: "Get periodic table element info (.element gold or .element Au or .element 79)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ").toLowerCase().trim();
    if (!q) return reply(`❓ Usage: .element <name/symbol/number>\nExamples:\n  .element gold\n  .element Au\n  .element 79`);
    let el: any;
    const num = parseInt(q);
    if (!isNaN(num)) {
      el = Object.values(ELEMENTS).find((e: any) => e.num === num);
    } else {
      el = ELEMENTS[q] || Object.values(ELEMENTS).find((e: any) =>
        e.name.toLowerCase() === q || e.symbol.toLowerCase() === q
      );
    }
    if (!el) return reply(`❌ Element *${q}* not found.\n_Try: gold, Au, 79, or any symbol/name_${FOOTER}`);
    await reply(
      `⚗️ *${el.name} (${el.symbol})*\n\n` +
      `🔢 *Atomic Number:* ${el.num}\n` +
      `⚖️ *Atomic Mass:* ${el.mass} u\n` +
      `🏷️ *Category:* ${el.cat}\n` +
      `🌀 *Config:* ${el.config}${FOOTER}`
    );
  },
});

registerCommand({
  name: "planet",
  aliases: ["planets", "solarplanet"],
  category: "Education",
  description: "Get info about any planet in our solar system",
  handler: async ({ args, reply }) => {
    const PLANETS: Record<string, any> = {
      mercury: { emoji: "🪨", dist: "57.9M km", orbit: "88 Earth days", moons: 0, temp: "-180°C to 430°C", diam: "4,879 km", mass: "0.055 Earth masses" },
      venus:   { emoji: "🌟", dist: "108.2M km", orbit: "225 Earth days", moons: 0, temp: "465°C", diam: "12,104 km", mass: "0.815 Earth masses" },
      earth:   { emoji: "🌍", dist: "149.6M km", orbit: "365.25 days", moons: 1, temp: "-88°C to 58°C", diam: "12,756 km", mass: "1 Earth mass" },
      mars:    { emoji: "🔴", dist: "227.9M km", orbit: "687 Earth days", moons: 2, temp: "-125°C to 20°C", diam: "6,792 km", mass: "0.107 Earth masses" },
      jupiter: { emoji: "🟠", dist: "778.5M km", orbit: "11.9 Earth years", moons: 95, temp: "-108°C", diam: "142,984 km", mass: "317.8 Earth masses" },
      saturn:  { emoji: "🪐", dist: "1.43B km", orbit: "29.5 Earth years", moons: 146, temp: "-178°C", diam: "120,536 km", mass: "95.2 Earth masses" },
      uranus:  { emoji: "💙", dist: "2.87B km", orbit: "84 Earth years", moons: 27, temp: "-224°C", diam: "51,118 km", mass: "14.5 Earth masses" },
      neptune: { emoji: "🔵", dist: "4.50B km", orbit: "165 Earth years", moons: 16, temp: "-218°C", diam: "49,528 km", mass: "17.1 Earth masses" },
    };
    const q = args.join(" ").toLowerCase();
    const p = PLANETS[q];
    if (!q) return reply(`❓ Usage: .planet <name>\nPlanets: ${Object.keys(PLANETS).join(", ")}`);
    if (!p) return reply(`❌ Planet *${q}* not found.\nPlanets: ${Object.keys(PLANETS).join(", ")}${FOOTER}`);
    await reply(
      `${p.emoji} *${q.charAt(0).toUpperCase() + q.slice(1)}*\n\n` +
      `☀️ *Distance from Sun:* ${p.dist}\n` +
      `🌀 *Orbital Period:* ${p.orbit}\n` +
      `🌙 *Moons:* ${p.moons}\n` +
      `🌡️ *Temperature:* ${p.temp}\n` +
      `📏 *Diameter:* ${p.diam}\n` +
      `⚖️ *Mass:* ${p.mass}${FOOTER}`
    );
  },
});

registerCommand({
  name: "iss",
  aliases: ["isstrack", "spacestation"],
  category: "Education",
  description: "Track the International Space Station location right now",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("http://api.open-notify.org/iss-now.json");
      const data = await res.json() as any;
      const { latitude, longitude } = data.iss_position;
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      await reply(
        `🛰️ *ISS Real-Time Location*\n\n` +
        `📍 *Latitude:* ${parseFloat(latitude).toFixed(4)}°\n` +
        `📍 *Longitude:* ${parseFloat(longitude).toFixed(4)}°\n` +
        `⏱️ *Timestamp:* ${new Date(data.timestamp * 1000).toUTCString()}\n\n` +
        `🗺️ *Map:* ${mapUrl}${FOOTER}`
      );
    } catch {
      await reply(`❌ Could not fetch ISS location.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "astronauts",
  aliases: ["spacecrew", "inspace"],
  category: "Education",
  description: "See who is in space right now",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("http://api.open-notify.org/astros.json");
      const data = await res.json() as any;
      const list = data.people?.map((p: any, i: number) => `${i + 1}. *${p.name}* (${p.craft})`).join("\n");
      await reply(`🚀 *People in Space Right Now*\n\n👨‍🚀 Total: ${data.number}\n\n${list}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch space crew data.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "mathformula",
  aliases: ["formula", "formulas"],
  category: "Education",
  description: "Get common math formulas (.mathformula area / .mathformula algebra / .mathformula trig)",
  handler: async ({ args, reply }) => {
    const topic = args[0]?.toLowerCase();
    const FORMULAS: Record<string, string> = {
      area: `📐 *Area Formulas*\n\n• Square: A = s²\n• Rectangle: A = l×w\n• Triangle: A = ½bh\n• Circle: A = πr²\n• Trapezoid: A = ½(a+b)h\n• Ellipse: A = πab`,
      volume: `📦 *Volume Formulas*\n\n• Cube: V = s³\n• Box: V = lwh\n• Sphere: V = ⁴⁄₃πr³\n• Cylinder: V = πr²h\n• Cone: V = ⅓πr²h\n• Pyramid: V = ⅓Bh`,
      algebra: `🔢 *Algebra Formulas*\n\n• Quadratic: x = (-b ± √(b²-4ac)) / 2a\n• FOIL: (a+b)(c+d) = ac+ad+bc+bd\n• Difference of squares: a²-b² = (a+b)(a-b)\n• Perfect square: (a±b)² = a²±2ab+b²`,
      trig: `📐 *Trigonometry*\n\n• sin²θ + cos²θ = 1\n• tan θ = sin θ / cos θ\n• sin(A+B) = sinAcosB + cosAsinB\n• cos(A+B) = cosAcosB - sinAsinB\n• Law of sines: a/sinA = b/sinB = c/sinC\n• Law of cosines: c² = a²+b²-2ab·cosC`,
      physics: `⚡ *Physics Formulas*\n\n• Force: F = ma\n• Energy: E = mc²\n• Kinetic: KE = ½mv²\n• Gravity: F = Gm₁m₂/r²\n• Ohm's Law: V = IR\n• Power: P = IV = V²/R\n• Momentum: p = mv`,
      chemistry: `⚗️ *Chemistry Formulas*\n\n• Ideal Gas: PV = nRT\n• pH = -log[H⁺]\n• Molarity: M = mol/L\n• Dilution: M₁V₁ = M₂V₂\n• ΔG = ΔH - TΔS\n• Moles: n = m/Mr`,
    };
    if (!topic || !FORMULAS[topic]) {
      return reply(`❓ Usage: .mathformula <topic>\nTopics: ${Object.keys(FORMULAS).join(", ")}`);
    }
    await reply(`${FORMULAS[topic]}${FOOTER}`);
  },
});

registerCommand({
  name: "sciencefact",
  aliases: ["scifact", "sfact"],
  category: "Education",
  description: "Get a random science fact",
  handler: async ({ reply }) => {
    const facts = [
      "A day on Venus is longer than a year on Venus. It takes 243 Earth days to rotate, but only 225 to orbit the sun.",
      "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs, and it was still edible.",
      "The human body contains enough carbon to make about 900 pencils.",
      "A teaspoonful of a neutron star would weigh about 10 million tons.",
      "Lightning strikes the Earth about 100 times every second.",
      "Bananas are slightly radioactive because they contain potassium-40.",
      "The speed of light in vacuum is approximately 299,792,458 m/s.",
      "A human has about 37 trillion cells in their body.",
      "There are more stars in the observable universe than grains of sand on all Earth's beaches.",
      "The longest lightning bolt ever recorded was 477.2 miles long in Brazil (2020).",
      "Octopuses have three hearts, blue blood, and nine brains.",
      "Sound travels 4x faster in water than in air.",
      "The human nose can detect over 1 trillion different scents.",
      "A photon takes 8 minutes to travel from the Sun to Earth.",
      "Sharks are older than trees — they've existed for about 450 million years.",
    ];
    await reply(`🔬 *Science Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
  },
});

registerCommand({
  name: "historyfact",
  aliases: ["history", "hisfact"],
  category: "Education",
  description: "Get a random historical fact",
  handler: async ({ reply }) => {
    const facts = [
      "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
      "Oxford University is older than the Aztec Empire.",
      "The fax machine was invented before the telephone, in 1843.",
      "Nintendo was founded in 1889 — as a playing card company.",
      "The shortest war in history lasted 38-45 minutes: the Anglo-Zanzibar War in 1896.",
      "The Great Wall of China was mostly built during the Ming Dynasty (1368–1644).",
      "Albert Einstein was offered the presidency of Israel in 1952. He declined.",
      "The first computer bug was an actual bug — a moth found in a Harvard computer in 1947.",
      "Shakespeare invented over 1,700 words we still use today.",
      "Ancient Egyptians shaved off their eyebrows to mourn the death of their cat.",
      "Viking helmets didn't actually have horns — that's a myth from 19th century artwork.",
      "The Roman Empire covered 5 million km² at its peak.",
    ];
    await reply(`📜 *History Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
  },
});

registerCommand({
  name: "geography",
  aliases: ["geo", "geofact"],
  category: "Education",
  description: "Get a random geography fact",
  handler: async ({ reply }) => {
    const facts = [
      "Russia is so large it spans 11 time zones.",
      "Canada has more lakes than all other countries combined.",
      "The Nile River flows northward into the Mediterranean Sea.",
      "Australia is wider than the moon.",
      "The Pacific Ocean is larger than all land masses combined.",
      "Africa is the only continent in all four hemispheres.",
      "The Sahara Desert is almost as large as the United States.",
      "The Amazon Rainforest produces 20% of the world's oxygen.",
      "Vatican City is the smallest country in the world, at 0.44 km².",
      "Greenland is 80% covered by ice.",
      "Mount Everest grows about 4mm taller every year.",
      "The deepest lake in the world is Lake Baikal in Russia, at 1,642 m deep.",
    ];
    await reply(`🌍 *Geography Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
  },
});

registerCommand({
  name: "bodyfact",
  aliases: ["humanfact", "anatomy"],
  category: "Education",
  description: "Get a random human body fact",
  handler: async ({ reply }) => {
    const facts = [
      "Your nose can detect about 1 trillion different smells.",
      "The human heart beats about 100,000 times per day.",
      "Your body produces 25 million new cells every second.",
      "The average adult walks about 7,500 steps per day.",
      "Your brain uses about 20% of your body's total energy.",
      "The small intestine is about 6 meters long — much longer than the large intestine.",
      "Human bones are stronger than steel by weight.",
      "Your eyes can distinguish about 10 million different colors.",
      "The liver is the only organ that can regenerate itself.",
      "Your skeleton replaces itself completely about every 10 years.",
      "Teeth are the only part of the body that cannot repair themselves.",
      "The human body has about 60,000 miles of blood vessels.",
    ];
    await reply(`🫀 *Human Body Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
  },
});

registerCommand({
  name: "techfact",
  aliases: ["technofact", "itfact"],
  category: "Education",
  description: "Get a random technology fact",
  handler: async ({ reply }) => {
    const facts = [
      "The first computer weighed 30 tons and filled an entire room (ENIAC, 1945).",
      "There are more devices connected to the internet than there are people on Earth.",
      "The first ever website is still online: info.cern.ch",
      "Google processes over 8.5 billion searches per day.",
      "The first iPhone was released on June 29, 2007.",
      "Email is older than the World Wide Web — the first email was sent in 1971.",
      "YouTube is the second largest search engine in the world after Google.",
      "About 90% of the world's data was created in the last two years.",
      "The average person unlocks their phone 80-150 times per day.",
      "The first domain name ever registered was Symbolics.com in 1985.",
      "WhatsApp processes over 100 billion messages per day.",
      "The most downloaded app of all time is TikTok.",
    ];
    await reply(`💻 *Tech Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}${FOOTER}`);
  },
});

registerCommand({
  name: "wordofday",
  aliases: ["wod", "vocabword"],
  category: "Education",
  description: "Get an advanced word of the day to expand vocabulary",
  handler: async ({ reply }) => {
    const words = [
      { word: "Ephemeral", pos: "adjective", def: "Lasting for a very short time; transitory.", ex: "Social media trends are ephemeral — here today, gone tomorrow." },
      { word: "Serendipity", pos: "noun", def: "The occurrence of events by chance in a happy or beneficial way.", ex: "Finding that book was pure serendipity." },
      { word: "Mellifluous", pos: "adjective", def: "Sweet or musical; pleasant to hear.", ex: "Her mellifluous voice filled the room." },
      { word: "Perspicacious", pos: "adjective", def: "Having a ready insight; shrewd.", ex: "The perspicacious detective solved the case in minutes." },
      { word: "Sycophant", pos: "noun", def: "A person who flatters and is excessively complimentary to powerful people.", ex: "He was surrounded by sycophants who only agreed with him." },
      { word: "Loquacious", pos: "adjective", def: "Tending to talk a great deal; talkative.", ex: "The loquacious host kept the party alive all night." },
      { word: "Vicarious", pos: "adjective", def: "Experienced through another person rather than directly.", ex: "She got vicarious excitement from watching adventures online." },
      { word: "Ubiquitous", pos: "adjective", def: "Present, appearing, or found everywhere.", ex: "Smartphones are ubiquitous in modern society." },
      { word: "Catharsis", pos: "noun", def: "The process of releasing strong or repressed emotions.", ex: "Writing in a journal can be cathartic." },
      { word: "Paradigm", pos: "noun", def: "A typical example or pattern of something; a world view.", ex: "The internet caused a paradigm shift in communication." },
    ];
    const w = words[Math.floor(Math.random() * words.length)];
    await reply(`📖 *Word of the Day*\n\n*${w.word}*\n_${w.pos}_\n\n📝 *Definition:* ${w.def}\n\n💬 *Example:*\n"${w.ex}"${FOOTER}`);
  },
});

registerCommand({
  name: "quiz",
  aliases: ["trivia2", "question"],
  category: "Education",
  description: "Get a random general knowledge quiz question",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
      const data = await res.json() as any;
      const q = data.results?.[0];
      if (!q) throw new Error();
      const allAnswers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
      const letters = ["A", "B", "C", "D"];
      const answerList = allAnswers.map((a: string, i: number) => `${letters[i]}. ${a.replace(/&quot;/g, '"').replace(/&#039;/g, "'")}`).join("\n");
      const correctLetter = letters[allAnswers.indexOf(q.correct_answer)];
      await reply(
        `🧠 *Quiz Time!*\n\n*Category:* ${q.category}\n*Difficulty:* ${q.difficulty.toUpperCase()}\n\n❓ ${q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'")}\n\n${answerList}\n\n||✅ Answer: ${correctLetter}. ${q.correct_answer}||${FOOTER}`
      );
    } catch {
      const fallback = [
        { q: "What is the capital of Japan?", a: "Tokyo", opts: ["A. Beijing\nB. Seoul\nC. Tokyo\nD. Bangkok", "C"] },
        { q: "What year did the first iPhone launch?", a: "2007", opts: ["A. 2005\nB. 2006\nC. 2007\nD. 2008", "C"] },
        { q: "Which planet is known as the Red Planet?", a: "Mars", opts: ["A. Venus\nB. Jupiter\nC. Saturn\nD. Mars", "D"] },
        { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci", opts: ["A. Picasso\nB. Michelangelo\nC. Raphael\nD. Leonardo da Vinci", "D"] },
      ];
      const f = fallback[Math.floor(Math.random() * fallback.length)];
      await reply(`🧠 *Quiz Time!*\n\n❓ ${f.q}\n\n${f.opts[0]}\n\n||✅ Answer: ${f.opts[1]}. ${f.a}||${FOOTER}`);
    }
  },
});
