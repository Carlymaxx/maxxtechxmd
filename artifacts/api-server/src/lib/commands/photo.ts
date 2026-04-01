import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

async function sendPhoto(sock: any, from: string, msg: any, url: string, caption: string) {
  await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg });
}

// AI-generated images via eliteprotech (works on Replit + all deploy platforms)
async function aiImg(prompt: string): Promise<Buffer> {
  const res = await fetch(`https://eliteprotech-apis.zone.id/imagine?prompt=${encodeURIComponent(prompt)}`);
  if (!res.ok) throw new Error(`imagine API returned ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

// Fallback pollinations.ai URL (for deployed servers: Heroku/Railway/Render)
function aiImgUrl(prompt: string, w = 800, h = 800): string {
  const seed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&enhance=true&model=flux`;
}

// Real-world photos from Loremflickr (works everywhere including Replit)
function realPhoto(keyword: string, w = 800, h = 600): string {
  const seed = Math.floor(Math.random() * 99999);
  // Loremflickr requires single keywords; pick first word if multi-word
  const kw = keyword.split(" ")[0].toLowerCase();
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(kw)}?random=${seed}`;
}

async function getMeme(subreddit?: string): Promise<{ url: string; title: string; sub: string }> {
  const endpoint = subreddit ? `https://meme-api.com/gimme/${subreddit}` : "https://meme-api.com/gimme";
  const res = await fetch(endpoint);
  const data = await res.json() as any;
  return { url: data.url, title: data.title || "Meme", sub: data.subreddit || "memes" };
}

async function waifuPics(category: string): Promise<string> {
  const res = await fetch(`https://api.waifu.pics/sfw/${category}`);
  const data = await res.json() as any;
  return data.url;
}

// ── AI Image Generation (eliteprotech-apis.zone.id/imagine) ─────────────────

registerCommand({
  name: "imagine",
  aliases: ["draw", "create", "paint", "generate"],
  category: "Photo",
  description: "Generate any AI image from a text prompt (.imagine a lion in space)",
  usage: ".imagine <description>",
  handler: async ({ sock, from, msg, args, reply }) => {
    const prompt = args.join(" ");
    if (!prompt) return reply(
      `❓ Usage: .imagine <description>\n\nExamples:\n  .imagine a lion in space wearing armor\n  .imagine beautiful sunset over ocean\n  .imagine futuristic city at night\n  .imagine cute anime girl with blue hair${FOOTER}`
    );
    await reply(`🎨 Generating your image...\n\n📝 _${prompt}_`);
    try {
      const imgBuf = await aiImg(prompt);
      await sock.sendMessage(from, { image: imgBuf, caption: `🎨 *AI Image*\n\n📝 ${prompt}${FOOTER}` }, { quoted: msg });
    } catch {
      await reply(`❌ Image generation failed. Try a different prompt.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "logo",
  aliases: ["ailogo", "brandlogo", "makelogo"],
  category: "Photo",
  description: "Generate an AI logo (.logo MAXX gaming tech neon)",
  usage: ".logo <description>",
  handler: async ({ sock, from, msg, args, reply }) => {
    const desc = args.join(" ");
    if (!desc) return reply(`❓ Usage: .logo <description>\nExample: .logo MAXX gaming tech neon\n         .logo lion king sports team${FOOTER}`);
    const prompt = `professional logo design ${desc}, clean, minimal, vector style, white background, high quality`;
    await reply(`🎨 Generating logo...\n\n_${desc}_`);
    try {
      await sendPhoto(sock, from, msg, aiImgUrl(prompt, 700, 700), `🏷️ *AI Logo*\n\n_${desc}_${FOOTER}`);
    } catch {
      await reply(`❌ Logo generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "poster",
  aliases: ["movieposter", "aiposter", "makeposter"],
  category: "Photo",
  description: "Generate an AI movie/event poster (.poster zombie apocalypse action film)",
  usage: ".poster <description>",
  handler: async ({ sock, from, msg, args, reply }) => {
    const desc = args.join(" ");
    if (!desc) return reply(`❓ Usage: .poster <description>\nExample: .poster epic fantasy dragon kingdom${FOOTER}`);
    const prompt = `cinematic movie poster ${desc}, dramatic lighting, professional design, text-free, ultra HD`;
    await reply(`🎨 Generating poster...\n\n_${desc}_`);
    try {
      await sendPhoto(sock, from, msg, aiImgUrl(prompt, 700, 1000), `🎬 *AI Poster*\n\n_${desc}_${FOOTER}`);
    } catch {
      await reply(`❌ Poster generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "avatar",
  aliases: ["pfpai", "aiavatar", "makeav"],
  category: "Photo",
  description: "Generate an AI avatar / profile picture (.avatar warrior princess)",
  usage: ".avatar <description>",
  handler: async ({ sock, from, msg, args, reply }) => {
    const desc = args.join(" ") || "cool digital avatar portrait";
    const prompt = `stunning portrait avatar ${desc}, professional, highly detailed, 4K, centered face`;
    await reply(`🎨 Generating avatar...\n\n_${desc}_`);
    try {
      await sendPhoto(sock, from, msg, aiImgUrl(prompt, 600, 600), `👤 *AI Avatar*\n\n_${desc}_${FOOTER}`);
    } catch {
      await reply(`❌ Avatar generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "abstract",
  aliases: ["abstractart", "digitalart"],
  category: "Photo",
  description: "Generate an AI abstract art image (.abstract neon psychedelic)",
  usage: ".abstract [style]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const styles = [
      "vibrant abstract fluid art colorful swirls",
      "geometric abstract pattern neon colors",
      "watercolor abstract art splashes",
      "fractal psychedelic art colorful",
      "dark abstract background glowing particles",
    ];
    const prompt = args.join(" ") || styles[Math.floor(Math.random() * styles.length)];
    try {
      await sendPhoto(sock, from, msg, aiImgUrl(`${prompt} ultra HD digital art`), `🎭 *Abstract Art*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "animephoto",
  aliases: ["animeart", "animepic", "mangaart"],
  category: "Photo",
  description: "Generate an AI anime art image (.animephoto girl with katana)",
  usage: ".animephoto [subject]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const subject = args.join(" ") || "beautiful anime girl colorful scenery";
    const prompt = `anime style illustration ${subject}, high quality, detailed, vibrant colors, studio ghibli`;
    try {
      await sendPhoto(sock, from, msg, aiImgUrl(prompt, 800, 800), `🎌 *Anime Art*\n\n_${subject}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

// ── Real-World Photos (Loremflickr — works everywhere) ───────────────────────

registerCommand({
  name: "wallpaper",
  aliases: ["wall", "wp", "wallpp", "4kwallpaper"],
  category: "Photo",
  description: "Get a 4K wallpaper by keyword (.wallpaper mountains)",
  usage: ".wallpaper [keyword]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const keywords = ["nature", "landscape", "mountains", "ocean", "forest", "city", "space", "anime", "cars"];
    const keyword = args.join(" ") || keywords[Math.floor(Math.random() * keywords.length)];
    try {
      const res = await fetch(`https://eliteprotech-apis.zone.id/4kwallpaper?type=search&q=${encodeURIComponent(keyword)}`);
      const data = await res.json() as any;
      if (data.success && data.results?.length) {
        const pick = data.results[Math.floor(Math.random() * Math.min(data.results.length, 5))];
        // Use thumbnail URL directly as the image
        await sock.sendMessage(from, {
          image: { url: pick.thumbnail },
          caption: `🖼️ *4K Wallpaper*\n\n🔍 _${keyword}_\n📌 ${pick.title || ""}${FOOTER}`
        }, { quoted: msg });
      } else {
        // Fallback to loremflickr
        await sendPhoto(sock, from, msg, realPhoto(keyword, 1280, 720), `🖼️ *Wallpaper*\n\n🔍 _${keyword}_${FOOTER}`);
      }
    } catch {
      await sendPhoto(sock, from, msg, realPhoto(keyword, 1280, 720), `🖼️ *Wallpaper*\n\n🔍 _${keyword}_${FOOTER}`);
    }
  },
});

registerCommand({
  name: "nature",
  aliases: ["scenery", "outdoors", "naturepic"],
  category: "Photo",
  description: "Get a nature photo (.nature waterfall)",
  usage: ".nature [keyword]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const scenes = ["waterfall", "forest", "mountain", "beach", "valley", "sunrise", "lake"];
    const keyword = args[0] || scenes[Math.floor(Math.random() * scenes.length)];
    try {
      await sendPhoto(sock, from, msg, realPhoto(keyword, 1024, 700), `🌿 *Nature Photo*\n\n_${keyword}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "landscape",
  aliases: ["scenicview", "vista", "landview"],
  category: "Photo",
  description: "Get a stunning landscape photo (.landscape canyon)",
  usage: ".landscape [keyword]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const scenes = ["landscape", "mountain", "canyon", "valley", "glacier", "prairie", "cliff"];
    const keyword = args[0] || scenes[Math.floor(Math.random() * scenes.length)];
    try {
      await sendPhoto(sock, from, msg, realPhoto(keyword, 1024, 600), `🌄 *Landscape*\n\n_${keyword}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "space",
  aliases: ["galaxy", "universe", "cosmos", "spacepic"],
  category: "Photo",
  description: "Get a space / galaxy photo (.space nebula)",
  usage: ".space [keyword]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const keywords = ["galaxy", "space", "stars", "nebula", "cosmos", "astronomy", "telescope"];
    const keyword = args[0] || keywords[Math.floor(Math.random() * keywords.length)];
    try {
      await sendPhoto(sock, from, msg, realPhoto(keyword, 900, 700), `🌌 *Space Photo*\n\n_${keyword}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "car",
  aliases: ["supercar", "rides", "carsphoto"],
  category: "Photo",
  description: "Get a luxury car photo (.car lamborghini)",
  usage: ".car [model]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const cars = ["ferrari", "lamborghini", "porsche", "bugatti", "mercedes", "bmw", "mclaren"];
    const kw = args[0] || cars[Math.floor(Math.random() * cars.length)];
    try {
      await sendPhoto(sock, from, msg, realPhoto(kw, 900, 600), `🚗 *${kw.charAt(0).toUpperCase() + kw.slice(1)}*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "animal",
  aliases: ["wildlife", "zoo", "animalpic", "pet"],
  category: "Photo",
  description: "Get a wildlife animal photo (.animal lion)",
  usage: ".animal [animal]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const animals = ["lion", "tiger", "eagle", "dolphin", "elephant", "wolf", "fox", "panda", "cheetah", "gorilla"];
    const kw = args[0] || animals[Math.floor(Math.random() * animals.length)];
    try {
      await sendPhoto(sock, from, msg, realPhoto(kw, 900, 700), `🐾 *${kw.charAt(0).toUpperCase() + kw.slice(1)} Photo*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "city",
  aliases: ["skyline", "town", "cityscape"],
  category: "Photo",
  description: "Get a city skyline photo (.city tokyo)",
  usage: ".city [city name]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const cities = ["tokyo", "dubai", "london", "paris", "nairobi", "singapore", "manhattan"];
    const kw = args[0] || cities[Math.floor(Math.random() * cities.length)];
    try {
      await sendPhoto(sock, from, msg, realPhoto(kw, 1024, 600), `🏙️ *${kw.charAt(0).toUpperCase() + kw.slice(1)}*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "food",
  aliases: ["foodpic", "dish", "foodphoto"],
  category: "Photo",
  description: "Get a food photo (.food sushi)",
  usage: ".food [dish]",
  handler: async ({ sock, from, msg, args, reply }) => {
    const foods = ["sushi", "pizza", "burger", "pasta", "steak", "cake", "tacos"];
    const kw = args[0] || foods[Math.floor(Math.random() * foods.length)];
    try {
      await sendPhoto(sock, from, msg, realPhoto(kw, 800, 700), `🍽️ *Food Photo*\n\n_${kw}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

// ── Anime / Waifu ─────────────────────────────────────────────────────────────

registerCommand({
  name: "waifu",
  aliases: ["animegirl", "waifupic", "waifuimg"],
  category: "Photo",
  description: "Get a random anime waifu image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("waifu");
      await sendPhoto(sock, from, msg, url, `🌸 *Random Waifu*${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch waifu image.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "neko",
  aliases: ["nekopic", "nekoimg"],
  category: "Photo",
  description: "Get a random anime neko (cat girl) image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("neko");
      await sendPhoto(sock, from, msg, url, `🐱 *Random Neko*${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch neko image.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "shinobu",
  aliases: ["shinobupic"],
  category: "Photo",
  description: "Get a random Shinobu anime image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("shinobu");
      await sendPhoto(sock, from, msg, url, `🦋 *Shinobu*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

// ── Memes ─────────────────────────────────────────────────────────────────────

registerCommand({
  name: "photomeme",
  aliases: ["getmeme", "rmeme"],
  category: "Photo",
  description: "Get a random meme from Reddit",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const { url, title, sub } = await getMeme();
      await sendPhoto(sock, from, msg, url, `😂 *${title}*\n\n📌 r/${sub}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch meme.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "programmermeme",
  aliases: ["codememe", "devmeme"],
  category: "Photo",
  description: "Get a programming/developer meme",
  handler: async ({ sock, from, msg, reply }) => {
    const subs = ["ProgrammerHumor", "programmerhumour", "softwaregore", "linuxmemes"];
    const sub = subs[Math.floor(Math.random() * subs.length)];
    try {
      const { url, title } = await getMeme(sub);
      await sendPhoto(sock, from, msg, url, `💻 *${title}*\n\n📌 r/${sub}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch meme.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "darkmeme",
  aliases: ["blackmeme", "darkhumour"],
  category: "Photo",
  description: "Get a dark humour meme",
  handler: async ({ sock, from, msg, reply }) => {
    const subs = ["darkhumour", "morbidreality", "dankmemes"];
    const sub = subs[Math.floor(Math.random() * subs.length)];
    try {
      const { url, title } = await getMeme(sub);
      await sendPhoto(sock, from, msg, url, `🖤 *${title}*\n\n📌 r/${sub}${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

// ── Fire Logo (eliteprotech-apis.zone.id/firelogo) ────────────────────────────

registerCommand({
  name: "firelogo",
  aliases: ["flaminglogo", "burnlogo", "flametext"],
  category: "Photo",
  description: "Generate a flaming fire-style text logo (.firelogo MAXX)",
  usage: ".firelogo <text>",
  handler: async ({ sock, from, msg, args, reply }) => {
    const text = args.join(" ");
    if (!text) return reply(`❓ Usage: .firelogo <text>\nExample: .firelogo MAXX XMD${FOOTER}`);
    await reply(`🔥 Generating fire logo for: _${text}_`);
    try {
      const res = await fetch(`https://eliteprotech-apis.zone.id/firelogo?text=${encodeURIComponent(text)}`);
      const data = await res.json() as any;
      if (!data.success || !data.image) throw new Error("no image");
      await sock.sendMessage(from, {
        image: { url: data.image },
        caption: `🔥 *Fire Logo*\n\n📝 _${text}_${FOOTER}`
      }, { quoted: msg });
    } catch {
      await reply(`❌ Could not generate fire logo. Try shorter text.${FOOTER}`);
    }
  },
});
