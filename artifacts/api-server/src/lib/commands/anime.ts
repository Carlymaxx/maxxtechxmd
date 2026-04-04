import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sendReactionGif(category: string, action: string, target: string, sock: any, from: string, msg: any) {
  try {
    // try nekos.life first
    const res = await fetch(`https://nekos.life/api/v2/img/${category}`);
    const data = await res.json() as any;
    const url = data.url;
    if (!url) throw new Error("no url");
    await sock.sendMessage(from, {
      image: { url },
      caption: `${action} ${target}${FOOTER}`,
    }, { quoted: msg });
  } catch {
    // fallback to waifu.pics
    const map: Record<string, string> = {
      hug: "hug", pat: "pat", kiss: "kiss", slap: "slap", cuddle: "cuddle",
      poke: "poke", smug: "smug", wave: "wave", wink: "wink", blush: "blush",
      tickle: "pat", cry: "cry", laugh: "smug", bite: "slap", dance: "dance",
    };
    const wpCat = map[category] || "waifu";
    try {
      const r2 = await fetch(`https://api.waifu.pics/sfw/${wpCat}`);
      const d2 = await r2.json() as any;
      await sock.sendMessage(from, {
        image: { url: d2.url },
        caption: `${action} ${target}${FOOTER}`,
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: `${action} ${target}${FOOTER}` }, { quoted: msg });
    }
  }
}

// ── Anime Info ────────────────────────────────────────────────────────────────


registerCommand({
  name: "manga",
  aliases: ["searchmanga"],
  category: "Anime",
  description: "Search for any manga by name",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .manga <title>\nExample: .manga One Piece`);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json() as any;
      const m = data.data?.[0];
      if (!m) return reply(`❌ Manga *${q}* not found.${FOOTER}`);
      await reply(
        `📚 *${m.title}* (${m.title_japanese || "N/A"})\n\n` +
        `📖 *Type:* ${m.type || "N/A"}\n` +
        `📅 *Published:* ${m.published?.string || "N/A"}\n` +
        `📄 *Chapters:* ${m.chapters || "?"}\n` +
        `⭐ *Score:* ${m.score || "N/A"} / 10\n` +
        `🏆 *Rank:* #${m.rank || "?"}\n` +
        `📊 *Status:* ${m.status || "N/A"}\n` +
        `🏷️ *Genres:* ${m.genres?.map((g: any) => g.name).join(", ") || "N/A"}\n\n` +
        `📝 *Synopsis:*\n${(m.synopsis || "N/A").slice(0, 400)}...${FOOTER}`
      );
    } catch {
      await reply(`❌ Manga search failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "animechar",
  aliases: ["character", "animecharacter"],
  category: "Anime",
  description: "Search for an anime character",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply(`❓ Usage: .animechar <name>\nExample: .animechar Naruto`);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json() as any;
      const c = data.data?.[0];
      if (!c) return reply(`❌ Character *${q}* not found.${FOOTER}`);
      const animes = c.anime?.slice(0, 3).map((a: any) => a.anime?.title).join(", ");
      await reply(
        `👤 *${c.name}* (${c.name_kanji || "N/A"})\n\n` +
        `⭐ *Favorites:* ${c.favorites?.toLocaleString() || "0"}\n` +
        `🎌 *Appears in:* ${animes || "N/A"}\n\n` +
        `📝 *About:*\n${(c.about || "No info available.").slice(0, 400)}${FOOTER}`
      );
    } catch {
      await reply(`❌ Character search failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "animequote",
  aliases: ["aquote", "animequotes"],
  category: "Anime",
  description: "Get a random anime quote",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://animechan.io/api/v1/quotes/random");
      const data = await res.json() as any;
      const q = Array.isArray(data) ? data[0] : data;
      await reply(`🎌 *Anime Quote*\n\n"${q?.content || q?.quote}"\n\n— *${q?.character?.name || q?.character}* from _${q?.anime?.title || q?.anime}_${FOOTER}`);
    } catch {
      const quotes = [
        { q: "People's lives don't end when they die. It ends when they lose faith.", c: "Itachi Uchiha", a: "Naruto" },
        { q: "Power comes in response to a need, not a desire.", c: "Goku", a: "Dragon Ball Z" },
        { q: "The world isn't perfect. But it's there for us, doing the best it can.", c: "Roy Mustang", a: "FMA" },
        { q: "If you don't take risks, you can't create a future.", c: "Monkey D. Luffy", a: "One Piece" },
        { q: "Hard work is worthless for those that don't believe in themselves.", c: "Naruto Uzumaki", a: "Naruto" },
      ];
      const r = quotes[Math.floor(Math.random() * quotes.length)];
      await reply(`🎌 *Anime Quote*\n\n"${r.q}"\n\n— *${r.c}* from _${r.a}_${FOOTER}`);
    }
  },
});

registerCommand({
  name: "animetrending",
  aliases: ["animetrend", "topanim"],
  category: "Anime",
  description: "Get top trending anime right now",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://api.jikan.moe/v4/top/anime?limit=10&filter=airing");
      const data = await res.json() as any;
      const list = data.data?.slice(0, 10).map((a: any, i: number) =>
        `${i + 1}. *${a.title}* — ⭐${a.score || "?"} | ${a.episodes || "?"}ep`
      ).join("\n");
      await reply(`🔥 *Top Trending Anime*\n\n${list || "None found."}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch trending anime.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "animerandom",
  aliases: ["randomanime"],
  category: "Anime",
  description: "Get a random anime recommendation",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://api.jikan.moe/v4/random/anime");
      const data = await res.json() as any;
      const a = data.data;
      await reply(
        `🎲 *Random Anime Recommendation*\n\n*${a.title}*\n\n📺 ${a.type} · ${a.episodes || "?"}ep · ⭐${a.score || "?"}\n🏷️ ${a.genres?.map((g: any) => g.name).join(", ") || "N/A"}\n\n${(a.synopsis || "").slice(0, 300)}...${FOOTER}`
      );
    } catch {
      await reply(`❌ Random anime fetch failed.${FOOTER}`);
    }
  },
});


registerCommand({
  name: "topmangas",
  aliases: ["mangatop", "bestmanga"],
  category: "Anime",
  description: "Get top manga list",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://api.jikan.moe/v4/top/manga?limit=10");
      const data = await res.json() as any;
      const list = data.data?.slice(0, 10).map((a: any, i: number) =>
        `${i + 1}. *${a.title}* — ⭐${a.score || "?"}`
      ).join("\n");
      await reply(`📚 *Top Manga*\n\n${list || "None found."}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch top manga.${FOOTER}`);
    }
  },
});

// ── Reaction GIFs (nekos.life / waifu.pics) ───────────────────────────────────

const REACTIONS: Array<{ name: string; aliases: string[]; category: string; action: string; nekos?: string; wp?: string }> = [
  { name: "hug",       aliases: ["hugs","abraco"],     category: "Anime", action: "🤗 *{name}* hugs",    nekos: "hug",     wp: "hug"    },
  { name: "pat",       aliases: ["patpat","headpat"],   category: "Anime", action: "✋ *{name}* pats",    nekos: "pat",     wp: "pat"    },
  { name: "kiss",      aliases: ["kisses","smoch"],     category: "Anime", action: "💋 *{name}* kisses",  nekos: "kiss",    wp: "kiss"   },
  { name: "slap",      aliases: ["slaps","hit"],        category: "Anime", action: "👋 *{name}* slaps",   nekos: "slap",    wp: "slap"   },
  { name: "cuddle",    aliases: ["snuggle"],            category: "Anime", action: "🥰 *{name}* cuddles", nekos: "cuddle",  wp: "cuddle" },
  { name: "poke",      aliases: ["prod"],               category: "Anime", action: "👉 *{name}* pokes",   nekos: "poke",    wp: "poke"   },
  { name: "smug",      aliases: ["smugface"],           category: "Anime", action: "😏 *{name}* is smug", nekos: "smug",    wp: "smug"   },
  { name: "wave",      aliases: ["greet","hi"],         category: "Anime", action: "👋 *{name}* waves at",nekos: "wave",    wp: "wave"   },
  { name: "wink",      aliases: ["winkat"],             category: "Anime", action: "😉 *{name}* winks at",nekos: "wink",    wp: "wink"   },
  { name: "blush",     aliases: ["embarrassed"],        category: "Anime", action: "😳 *{name}* blushes at",nekos: "blush", wp: "blush"  },
  { name: "tickle",    aliases: ["tickles"],            category: "Anime", action: "😂 *{name}* tickles", nekos: "tickle",  wp: "pat"    },
  { name: "cryanime",  aliases: ["weep","sob"],         category: "Anime", action: "😭 *{name}* cries",   nekos: "cry",     wp: "cry"    },
  { name: "laugh",     aliases: ["lol","haha"],         category: "Anime", action: "😂 *{name}* laughs",  nekos: "laugh",   wp: "smug"   },
  { name: "bite",      aliases: ["chomp","nibble"],     category: "Anime", action: "😤 *{name}* bites",   nekos: "bite",    wp: "slap"   },
  { name: "feed",      aliases: ["feeds"],              category: "Anime", action: "🍱 *{name}* feeds",   nekos: "feed",    wp: "pat"    },
  { name: "baka",      aliases: ["idiot","dummy"],      category: "Anime", action: "😠 *{name}* calls",   nekos: "baka",    wp: "smug"   },
  { name: "pout",      aliases: ["sulk"],               category: "Anime", action: "😤 *{name}* pouts at",nekos: "pout",    wp: "blush"  },
  { name: "dance",     aliases: ["dancing"],            category: "Anime", action: "💃 *{name}* dances with",nekos: "dance", wp: "dance"  },
  { name: "happy",     aliases: ["celebrate","yay"],    category: "Anime", action: "🎉 *{name}* is happy with",nekos: "happy",wp: "wave" },
  { name: "highfive",  aliases: ["hifive","hifd"],      category: "Anime", action: "🙌 *{name}* high-fives",nekos: "wink", wp: "wave"   },
  { name: "nod",       aliases: ["agree"],              category: "Anime", action: "😌 *{name}* nods at",  nekos: "nod",   wp: "wink"   },
  { name: "stare",     aliases: ["glare"],              category: "Anime", action: "👀 *{name}* stares at",nekos: "stare", wp: "smug"   },
  { name: "facepalm",  aliases: ["smh"],                category: "Anime", action: "🤦 *{name}* facepalms",nekos: "facedesk",wp:"smug" },
  { name: "shrug",     aliases: ["dunno"],              category: "Anime", action: "🤷 *{name}* shrugs",  nekos: "smug",   wp: "smug"   },
  { name: "kill",      aliases: ["murder"],             category: "Anime", action: "⚔️ *{name}* kills",   nekos: "slap",   wp: "slap"   },
];

for (const r of REACTIONS) {
  registerCommand({
    name: r.name,
    aliases: r.aliases,
    category: r.category,
    description: `Send a ${r.name} reaction`,
    handler: async ({ sock, from, msg, args, senderName, reply }) => {
      const name = senderName;
      const target = args.join(" ") || "everyone";
      const action = r.action.replace("{name}", name);
      await sendReactionGif(r.nekos || r.name, `${action} *${target}*`, "", sock, from, msg);
    },
  });
}

// ── Waifu content ─────────────────────────────────────────────────────────────

registerCommand({
  name: "foxgirl",
  aliases: ["fox", "kitsune"],
  category: "Anime",
  description: "Get a random fox girl image",
  handler: async ({ sock, from, msg }) => {
    try {
      const r = await fetch("https://nekos.life/api/v2/img/fox_girl");
      const d = await r.json() as any;
      await sock.sendMessage(from, { image: { url: d.url }, caption: `🦊 Fox Girl!${FOOTER}` }, { quoted: msg });
    } catch {
      const r = await fetch("https://api.waifu.pics/sfw/waifu");
      const d = await r.json() as any;
      await sock.sendMessage(from, { image: { url: d.url }, caption: `🦊 Fox Girl!${FOOTER}` }, { quoted: msg });
    }
  },
});

registerCommand({
  name: "catgirl",
  aliases: ["neko2", "catears"],
  category: "Anime",
  description: "Get a random cat girl image",
  handler: async ({ sock, from, msg }) => {
    const r = await fetch("https://api.waifu.pics/sfw/neko");
    const d = await r.json() as any;
    await sock.sendMessage(from, { image: { url: d.url }, caption: `🐱 Cat Girl!${FOOTER}` }, { quoted: msg });
  },
});

registerCommand({
  name: "megumin",
  aliases: ["explosion"],
  category: "Anime",
  description: "Get a Megumin image",
  handler: async ({ sock, from, msg }) => {
    const r = await fetch("https://api.waifu.pics/sfw/megumin");
    const d = await r.json() as any;
    await sock.sendMessage(from, { image: { url: d.url }, caption: `💥 EXPLOSION!${FOOTER}` }, { quoted: msg });
  },
});

registerCommand({
  name: "shinobu2",
  aliases: ["shinobuinsect"],
  category: "Anime",
  description: "Get a Shinobu Kocho image",
  handler: async ({ sock, from, msg }) => {
    const r = await fetch("https://api.waifu.pics/sfw/shinobu");
    const d = await r.json() as any;
    await sock.sendMessage(from, { image: { url: d.url }, caption: `🦋 Shinobu!${FOOTER}` }, { quoted: msg });
  },
});
