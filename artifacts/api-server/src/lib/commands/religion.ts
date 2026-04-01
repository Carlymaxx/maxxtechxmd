import { registerCommand } from "./types";

registerCommand({
  name: "bible",
  aliases: ["verse", "scripture"],
  category: "Religion",
  description: "Get a Bible verse",
  handler: async ({ args, reply }) => {
    const verse = args.join(" ");
    if (!verse) return reply("❓ Usage: .bible <verse>\nExample: .bible john 3:16\nExample: .bible psalms 23:1-6");
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(verse)}`);
      const data = await res.json() as any;
      if (data.error) return reply(`❌ Verse not found: *${verse}*\n\nTry: .bible john 3:16`);
      const text = data.text?.trim();
      const ref = data.reference;
      await reply(`📖 *${ref}*\n\n_"${text}"_\n\n— Holy Bible`);
    } catch {
      await reply("❌ Could not fetch Bible verse. Try again.\nExample: .bible john 3:16");
    }
  },
});

registerCommand({
  name: "quran",
  aliases: ["ayah", "surah"],
  category: "Religion",
  description: "Get a Quran verse",
  handler: async ({ args, reply }) => {
    const ref = args[0];
    if (!ref) return reply("❓ Usage: .quran <surah>:<ayah>\nExample: .quran 2:255\nExample: .quran 1:1");
    const [surah, ayah] = ref.split(":");
    if (!surah || !ayah) return reply("❓ Format: .quran <surah>:<ayah>\nExample: .quran 2:255");
    try {
      const [engRes, arRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.sahih`),
        fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`),
      ]);
      const engData = await engRes.json() as any;
      const arData = await arRes.json() as any;
      if (engData.code !== 200) return reply(`❌ Verse not found: Surah ${surah}, Ayah ${ayah}`);
      const eng = engData.data;
      const ar = arData.data;
      await reply(`📿 *Quran — Surah ${eng.surah?.name} (${eng.surah?.englishName})*\nVerse ${eng.numberInSurah}

🕌 *Arabic:*
_${ar?.text || ""}_ 

🌍 *English (Sahih International):*
_"${eng.text}"_

📍 *Reference:* ${eng.surah?.englishName} ${surah}:${ayah}`);
    } catch {
      await reply("❌ Could not fetch Quran verse. Try again.\nExample: .quran 2:255");
    }
  },
});
