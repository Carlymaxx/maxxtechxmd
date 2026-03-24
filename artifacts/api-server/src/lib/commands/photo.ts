import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

async function sendPhoto(sock: any, from: string, msg: any, url: string, caption: string) {
  await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg });
}

async function waifuPics(category: string): Promise<string> {
  const res = await fetch(`https://api.waifu.pics/sfw/${category}`);
  const data = await res.json() as any;
  return data.url;
}

async function getMeme(subreddit?: string): Promise<{ url: string; title: string; sub: string }> {
  const endpoint = subreddit
    ? `https://meme-api.com/gimme/${subreddit}`
    : "https://meme-api.com/gimme";
  const res = await fetch(endpoint);
  const data = await res.json() as any;
  return { url: data.url, title: data.title || "Meme", sub: data.subreddit || "memes" };
}

function pollinationsUrl(prompt: string, w = 800, h = 800, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${s}&nologo=true&enhance=true`;
}

function unsplashUrl(keyword: string): string {
  const s = Math.floor(Math.random() * 999999);
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}&sig=${s}`;
}

registerCommand({
  name: "imagine",
  aliases: ["ai", "generate", "draw", "create", "paint"],
  category: "Photo",
  description: "Generate any AI image from a text prompt",
  handler: async ({ sock, from, msg, args, reply }) => {
    const prompt = args.join(" ");
    if (!prompt) return reply(
      `❓ Usage: .imagine <description>\n\nExamples:\n  .imagine a lion in space wearing armor\n  .imagine beautiful sunset over ocean\n  .imagine futuristic city at night\n  .imagine cute anime girl with blue hair${FOOTER}`
    );
    await reply(`🎨 Generating your image...\n\n📝 _${prompt}_`);
    const url = pollinationsUrl(prompt);
    try {
      await sendPhoto(sock, from, msg, url, `🎨 *AI Image*\n\n📝 ${prompt}${FOOTER}`);
    } catch {
      await reply(`❌ Image generation failed. Try a different prompt.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "waifu",
  aliases: ["animegirl", "waifupic"],
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
  aliases: ["catgirl", "nekopic"],
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
  name: "megumin",
  aliases: ["konosuba"],
  category: "Photo",
  description: "Get a random Megumin anime image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("megumin");
      await sendPhoto(sock, from, msg, url, `💥 *Megumin!*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "shinobu",
  aliases: [],
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

registerCommand({
  name: "meme",
  aliases: ["getmeme", "randmeme"],
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
  aliases: ["blackmeme"],
  category: "Photo",
  description: "Get a dark humour meme",
  handler: async ({ sock, from, msg, reply }) => {
    const subs = ["darkhumour", "morbidreality", "dankmemes"];
    const sub = subs[Math.floor(Math.random() * subs.length)];
    try {
      const { url, title } = await getMeme(sub);
      await sendPhoto(sock, from, msg, url, `🖤 *${title}*\n\n📌 r/${sub}${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch meme.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "wallpaper",
  aliases: ["wall", "wp"],
  category: "Photo",
  description: "Get a wallpaper by keyword (.wallpaper mountains)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const keyword = args.join(" ") || "nature landscape";
    try {
      const url = unsplashUrl(keyword);
      await sendPhoto(sock, from, msg, url, `🖼️ *Wallpaper*\n\n🔍 _${keyword}_${FOOTER}`);
    } catch {
      await reply(`❌ Could not fetch wallpaper.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "nature",
  aliases: ["landscape", "scenery"],
  category: "Photo",
  description: "Get a random nature photo",
  handler: async ({ sock, from, msg, reply }) => {
    const keywords = ["nature landscape", "forest waterfall", "mountain sunrise", "ocean sunset", "green valley", "tropical beach"];
    const kw = keywords[Math.floor(Math.random() * keywords.length)];
    try {
      await sendPhoto(sock, from, msg, unsplashUrl(kw), `🌿 *Nature Photo*\n\n_${kw}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "space",
  aliases: ["galaxy", "universe", "cosmos"],
  category: "Photo",
  description: "Get a space / galaxy photo",
  handler: async ({ sock, from, msg, reply }) => {
    const prompts = [
      "stunning galaxy nebula deep space photograph",
      "beautiful milky way stars night sky",
      "colorful space nebula with stars",
      "planet earth from space ISS view",
      "spiral galaxy hubble telescope",
    ];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    try {
      await sendPhoto(sock, from, msg, pollinationsUrl(prompt, 900, 900), `🌌 *Space Photo*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "food",
  aliases: ["meal", "dish", "recipe"],
  category: "Photo",
  description: "Get a random food photo",
  handler: async ({ sock, from, msg, args, reply }) => {
    const dish = args.join(" ") || "";
    const keywords = dish
      ? dish
      : ["delicious food", "gourmet meal", "pizza", "burger", "sushi", "pasta", "dessert cake"][Math.floor(Math.random() * 7)];
    try {
      await sendPhoto(sock, from, msg, unsplashUrl(keywords + " food"), `🍽️ *Food Photo*\n\n_${keywords}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "car",
  aliases: ["vehicle", "supercar", "rides"],
  category: "Photo",
  description: "Get a random car photo (.car lamborghini)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const model = args.join(" ") || "";
    const cars = ["Ferrari", "Lamborghini", "McLaren", "Porsche", "Bugatti", "Mercedes", "BMW"];
    const kw = model || cars[Math.floor(Math.random() * cars.length)];
    try {
      await sendPhoto(sock, from, msg, unsplashUrl(kw + " car luxury"), `🚗 *${kw}*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "animal",
  aliases: ["pet", "wildlife", "zoo"],
  category: "Photo",
  description: "Get a random animal photo (.animal lion)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const animals = ["lion", "tiger", "eagle", "dolphin", "elephant", "wolf", "fox", "panda", "cheetah", "gorilla"];
    const kw = args.join(" ") || animals[Math.floor(Math.random() * animals.length)];
    try {
      await sendPhoto(sock, from, msg, unsplashUrl(kw + " wildlife"), `🐾 *${kw.charAt(0).toUpperCase() + kw.slice(1)} Photo*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "city",
  aliases: ["urban", "skyline", "town"],
  category: "Photo",
  description: "Get a city/skyline photo (.city tokyo)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const cities = ["New York", "Tokyo", "Dubai", "London", "Paris", "Nairobi", "Singapore"];
    const kw = args.join(" ") || cities[Math.floor(Math.random() * cities.length)];
    try {
      await sendPhoto(sock, from, msg, unsplashUrl(kw + " city skyline"), `🏙️ *${kw}*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "anime",
  aliases: ["animeart", "mangaart"],
  category: "Photo",
  description: "Get an AI-generated anime art image",
  handler: async ({ sock, from, msg, args, reply }) => {
    const subject = args.join(" ") || "beautiful anime girl colorful scenery";
    const prompt = `anime style illustration ${subject}, high quality, detailed, vibrant colors`;
    try {
      await sendPhoto(sock, from, msg, pollinationsUrl(prompt, 800, 800), `🎌 *Anime Art*\n\n_${subject}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "abstract",
  aliases: ["art", "digitalart"],
  category: "Photo",
  description: "Generate an AI abstract art image",
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
      await sendPhoto(sock, from, msg, pollinationsUrl(prompt + " ultra HD digital art", 800, 800), `🎭 *Abstract Art*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "avatar",
  aliases: ["pfpai", "aiavatar"],
  category: "Photo",
  description: "Generate an AI avatar / profile picture (.avatar warrior princess)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const desc = args.join(" ") || "cool digital avatar portrait";
    const prompt = `stunning portrait avatar ${desc}, professional, highly detailed, 4K, centered face`;
    await reply(`🎨 Generating avatar...\n\n_${desc}_`);
    try {
      await sendPhoto(sock, from, msg, pollinationsUrl(prompt, 600, 600), `👤 *AI Avatar*\n\n_${desc}_${FOOTER}`);
    } catch {
      await reply(`❌ Avatar generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "logo",
  aliases: ["ailogo", "brandlogo"],
  category: "Photo",
  description: "Generate an AI logo (.logo MAXX gaming tech)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const desc = args.join(" ");
    if (!desc) return reply(`❓ Usage: .logo <description>\nExample: .logo MAXX gaming tech neon\n         .logo lion king sports team${FOOTER}`);
    const prompt = `professional logo design ${desc}, clean, minimal, vector style, white background, high quality`;
    await reply(`🎨 Generating logo...\n\n_${desc}_`);
    try {
      await sendPhoto(sock, from, msg, pollinationsUrl(prompt, 700, 700), `🏷️ *AI Logo*\n\n_${desc}_${FOOTER}`);
    } catch {
      await reply(`❌ Logo generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "poster",
  aliases: ["movieposter", "aiposter"],
  category: "Photo",
  description: "Generate an AI movie/event poster (.poster zombie apocalypse action film)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const desc = args.join(" ");
    if (!desc) return reply(`❓ Usage: .poster <description>\nExample: .poster epic fantasy dragon kingdom\n         .poster horror movie dark forest${FOOTER}`);
    const prompt = `cinematic movie poster ${desc}, dramatic lighting, professional design, text-free, ultra HD`;
    await reply(`🎨 Generating poster...\n\n_${desc}_`);
    try {
      await sendPhoto(sock, from, msg, pollinationsUrl(prompt, 700, 1000), `🎬 *AI Poster*\n\n_${desc}_${FOOTER}`);
    } catch {
      await reply(`❌ Poster generation failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "landscape",
  aliases: ["scenicview", "vista"],
  category: "Photo",
  description: "Generate a stunning AI landscape photo (.landscape snowy alps)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const desc = args.join(" ") || "breathtaking mountain landscape golden hour";
    const prompt = `stunning photorealistic landscape ${desc}, ultra HD photograph, professional photography, award winning`;
    try {
      await sendPhoto(sock, from, msg, pollinationsUrl(prompt, 1024, 600), `🌄 *Landscape*\n\n_${desc}_${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "hug",
  aliases: ["hugme"],
  category: "Photo",
  description: "Get an anime hug image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("hug");
      await sendPhoto(sock, from, msg, url, `🤗 *Hug!*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "pat",
  aliases: ["headpat"],
  category: "Photo",
  description: "Get an anime head-pat image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("pat");
      await sendPhoto(sock, from, msg, url, `✋ *Head pat!*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "kiss",
  aliases: ["animekiss"],
  category: "Photo",
  description: "Get an anime kiss image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("kiss");
      await sendPhoto(sock, from, msg, url, `💋 *Kiss!*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "slap",
  aliases: ["animeslap"],
  category: "Photo",
  description: "Get an anime slap image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("slap");
      await sendPhoto(sock, from, msg, url, `👋 *SLAP!*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "smug",
  aliases: ["smugface"],
  category: "Photo",
  description: "Get an anime smug face image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("smug");
      await sendPhoto(sock, from, msg, url, `😏 *Smug*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "dance",
  aliases: ["animedance"],
  category: "Photo",
  description: "Get an anime dance image",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const url = await waifuPics("dance");
      await sendPhoto(sock, from, msg, url, `💃 *Dance!*${FOOTER}`);
    } catch {
      await reply(`❌ Failed.${FOOTER}`);
    }
  },
});
