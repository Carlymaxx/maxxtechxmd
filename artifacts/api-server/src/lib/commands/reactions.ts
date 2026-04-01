import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// waifu.pics reaction GIF types
const WAIFU_TYPES = [
  "hug", "kiss", "pat", "slap", "cry", "dance", "bite", "cuddle",
  "blush", "smile", "wave", "highfive", "handhold", "nom", "glomp",
  "kill", "happy", "wink", "poke", "cringe", "yeet", "bonk",
  "smug", "lick", "awoo",
];

async function getReactionGif(type: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.waifu.pics/sfw/${type}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return data.url || null;
  } catch {
    return null;
  }
}

function makeReaction(name: string, emoji: string, description: string, gifType: string, aliases: string[] = []) {
  registerCommand({
    name,
    aliases,
    category: "Reactions",
    description,
    usage: `.${name} [@mention] (optional)`,
    handler: async ({ sock, from, msg, args, reply }) => {
      const target = args[0] || (msg as any).pushName || "you";
      const sender = (msg as any).pushName || "Someone";
      const url = await getReactionGif(gifType);
      const caption = `${emoji} *${sender}* ${description.toLowerCase()} *${target}*!${FOOTER}`;
      if (url) {
        try {
          await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg });
          return;
        } catch {}
      }
      await reply(caption);
    },
  });
}

makeReaction("hug", "🤗", "hugged", "hug", ["hugg"]);
makeReaction("kiss", "😘", "kissed", "kiss", ["smooch"]);
makeReaction("pat", "👋", "patted", "pat", ["headpat"]);
makeReaction("slap", "👋", "slapped", "slap", ["smack"]);
makeReaction("cuddle", "🥰", "cuddled", "cuddle", ["snuggle"]);
makeReaction("bite", "😬", "bit", "bite", ["bites"]);
makeReaction("nom", "😋", "nommed", "nom", ["munch"]);
makeReaction("glomp", "💥", "glomped", "glomp");
makeReaction("poke", "👈", "poked", "poke", ["nudge"]);
makeReaction("wink", "😉", "winked at", "wink", ["winks"]);
makeReaction("blush", "😊", "blushed at", "blush");
makeReaction("smile", "😄", "smiled at", "smile");
makeReaction("wave", "👋", "waved at", "wave");
makeReaction("highfive", "🙌", "highfived", "highfive", ["hi5"]);
makeReaction("handhold", "🤝", "held hands with", "handhold");
makeReaction("bonk", "🔨", "bonked", "bonk");
makeReaction("yeet", "🚀", "yeeted", "yeet");
makeReaction("lick", "👅", "licked", "lick");
makeReaction("awoo", "🐺", "awoo'd at", "awoo", ["howl"]);
makeReaction("smug", "😏", "looked smugly at", "smug");
makeReaction("cringe", "😬", "cringed at", "cringe");
makeReaction("happy", "😄", "made happy", "happy", ["yay"]);
makeReaction("kill", "⚔️", "attacked", "kill", ["attack"]);

registerCommand({
  name: "cry",
  aliases: ["crying", "tears"],
  category: "Reactions",
  description: "Cry reaction GIF",
  handler: async ({ sock, from, msg, reply }) => {
    const sender = (msg as any).pushName || "Someone";
    const url = await getReactionGif("cry");
    const caption = `😢 *${sender}* is crying...${FOOTER}`;
    if (url) {
      try { await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg }); return; } catch {}
    }
    await reply(caption);
  },
});

registerCommand({
  name: "dance",
  aliases: ["dancing", "groove"],
  category: "Reactions",
  description: "Dance reaction GIF",
  handler: async ({ sock, from, msg, reply }) => {
    const sender = (msg as any).pushName || "Someone";
    const url = await getReactionGif("dance");
    const caption = `💃 *${sender}* is dancing!${FOOTER}`;
    if (url) {
      try { await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg }); return; } catch {}
    }
    await reply(caption);
  },
});

registerCommand({
  name: "bully",
  aliases: ["boo"],
  category: "Reactions",
  description: "Bully someone (fun reaction)",
  handler: async ({ sock, from, msg, args, reply }) => {
    const target = args[0] || "someone";
    const sender = (msg as any).pushName || "Someone";
    const url = await getReactionGif("slap");
    const caption = `😤 *${sender}* is bullying *${target}*!${FOOTER}`;
    if (url) {
      try { await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg }); return; } catch {}
    }
    await reply(caption);
  },
});
