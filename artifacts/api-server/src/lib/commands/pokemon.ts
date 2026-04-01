import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

async function getPokemon(query: string): Promise<any> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().replace(/\s+/g, "-")}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

registerCommand({
  name: "pokemon",
  aliases: ["poke", "pokeinfo"],
  category: "Pokemon",
  description: "Get Pokémon info by name or number (.pokemon pikachu)",
  handler: async ({ args, sock, from, msg, reply }) => {
    const q = args.join(" ") || String(Math.floor(Math.random() * 898) + 1);
    try {
      const p = await getPokemon(q);
      const types = p.types.map((t: any) => capitalize(t.type.name)).join(" / ");
      const abilities = p.abilities.map((a: any) => capitalize(a.ability.name)).join(", ");
      const stats = p.stats.map((s: any) => `  ${capitalize(s.stat.name)}: ${s.base_stat}`).join("\n");
      const imgUrl = p.sprites?.other?.["official-artwork"]?.front_default || p.sprites?.front_default;

      if (imgUrl) {
        await sock.sendMessage(from, {
          image: { url: imgUrl },
          caption:
            `🔴 *#${p.id} ${capitalize(p.name)}*\n\n` +
            `⚡ *Type:* ${types}\n` +
            `📏 *Height:* ${p.height / 10}m\n` +
            `⚖️ *Weight:* ${p.weight / 10}kg\n` +
            `✨ *Abilities:* ${abilities}\n\n` +
            `📊 *Base Stats:*\n${stats}${FOOTER}`,
        }, { quoted: msg });
      } else {
        await reply(
          `🔴 *#${p.id} ${capitalize(p.name)}*\n\n⚡ *Type:* ${types}\n📊 *Stats:*\n${stats}${FOOTER}`
        );
      }
    } catch {
      await reply(`❌ Pokémon *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "pokedex",
  aliases: ["pdex", "pokemoninfo"],
  category: "Pokemon",
  description: "Full Pokédex entry with description (.pokedex charizard)",
  handler: async ({ args, reply }) => {
    const q = args.join(" ") || "1";
    try {
      const p = await getPokemon(q);
      const specRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${p.id}`);
      const spec = await specRes.json() as any;
      const desc = spec.flavor_text_entries?.find((e: any) => e.language.name === "en")
        ?.flavor_text?.replace(/\f/g, " ") || "No description.";
      const category = spec.genera?.find((g: any) => g.language.name === "en")?.genus || "Unknown";
      const evolvesFrom = spec.evolves_from_species?.name ? capitalize(spec.evolves_from_species.name) : "None";

      await reply(
        `📖 *Pokédex #${p.id}: ${capitalize(p.name)}*\n\n` +
        `🏷️ *Category:* ${category}\n` +
        `🌍 *Region:* ${spec.generation?.name?.replace("generation-", "Gen ").toUpperCase() || "?"}\n` +
        `🔄 *Evolves from:* ${evolvesFrom}\n` +
        `✨ *Legendary:* ${spec.is_legendary ? "Yes 🌟" : "No"}\n` +
        `🦄 *Mythical:* ${spec.is_mythical ? "Yes ✨" : "No"}\n` +
        `🏃 *Base Happiness:* ${spec.base_happiness || 0}\n` +
        `🥚 *Capture Rate:* ${spec.capture_rate}/255\n\n` +
        `📝 ${desc}${FOOTER}`
      );
    } catch {
      await reply(`❌ Pokémon *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "pokemove",
  aliases: ["pmove", "pokemonmove"],
  category: "Pokemon",
  description: "Get info about a Pokémon move (.pokemove flamethrower)",
  handler: async ({ args, reply }) => {
    const q = args.join("-").toLowerCase();
    if (!q) return reply(`❓ Usage: .pokemove <move-name>\nExample: .pokemove flamethrower`);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/move/${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const m = await res.json() as any;
      const desc = m.flavor_text_entries?.find((e: any) => e.language.name === "en")?.flavor_text?.replace(/\f/g, " ") || "N/A";
      await reply(
        `⚔️ *Move: ${capitalize(m.name)}*\n\n` +
        `🔥 *Type:* ${capitalize(m.type?.name || "?")}\n` +
        `🎯 *Category:* ${capitalize(m.damage_class?.name || "?")}\n` +
        `💥 *Power:* ${m.power || "—"}\n` +
        `🎯 *Accuracy:* ${m.accuracy || "—"}%\n` +
        `🔄 *PP:* ${m.pp || "?"}\n` +
        `⚡ *Priority:* ${m.priority}\n\n` +
        `📝 ${desc}${FOOTER}`
      );
    } catch {
      await reply(`❌ Move *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "poketype",
  aliases: ["typechart", "typeinfo"],
  category: "Pokemon",
  description: "Get Pokémon type effectiveness (.poketype fire)",
  handler: async ({ args, reply }) => {
    const type = args[0]?.toLowerCase();
    if (!type) return reply(`❓ Usage: .poketype <type>\nExample: .poketype fire`);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/type/${encodeURIComponent(type)}`);
      if (!res.ok) throw new Error();
      const t = await res.json() as any;
      const dr = t.damage_relations;
      const fmt = (arr: any[]) => arr.map((x: any) => capitalize(x.name)).join(", ") || "None";
      await reply(
        `⚡ *Type: ${capitalize(t.name)}*\n\n` +
        `💪 *Strong against:* ${fmt(dr.double_damage_to)}\n` +
        `😐 *Normal against:* ${fmt(dr.normal_damage_to)}\n` +
        `😤 *Weak against:* ${fmt(dr.half_damage_to)}\n` +
        `🚫 *No effect on:* ${fmt(dr.no_damage_to)}\n\n` +
        `🛡️ *Resists:* ${fmt(dr.half_damage_from)}\n` +
        `⚠️ *Weak to:* ${fmt(dr.double_damage_from)}\n` +
        `🛡️ *Immune to:* ${fmt(dr.no_damage_from)}${FOOTER}`
      );
    } catch {
      await reply(`❌ Type *${type}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "poketeam",
  aliases: ["randomteam", "pokemonteam"],
  category: "Pokemon",
  description: "Generate a random Pokémon team of 6",
  handler: async ({ reply }) => {
    try {
      const ids = Array.from({ length: 6 }, () => Math.floor(Math.random() * 898) + 1);
      const team = await Promise.all(ids.map(id => getPokemon(String(id))));
      const list = team.map((p, i) => `${i + 1}. *${capitalize(p.name)}* (#${p.id}) — ${p.types.map((t: any) => capitalize(t.type.name)).join("/")}`).join("\n");
      await reply(`🎮 *Your Random Pokémon Team*\n\n${list}\n\n_Good luck, trainer!_${FOOTER}`);
    } catch {
      await reply(`❌ Could not generate team.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "pokemonability",
  aliases: ["pability", "ability"],
  category: "Pokemon",
  description: "Get info about a Pokémon ability (.pokemonability blaze)",
  handler: async ({ args, reply }) => {
    const q = args.join("-").toLowerCase();
    if (!q) return reply(`❓ Usage: .pokemonability <ability>\nExample: .pokemonability blaze`);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/ability/${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const a = await res.json() as any;
      const desc = a.flavor_text_entries?.find((e: any) => e.language.name === "en")?.flavor_text?.replace(/\f/g, " ") || "N/A";
      const pokemon = a.pokemon?.slice(0, 8).map((p: any) => capitalize(p.pokemon.name)).join(", ") || "N/A";
      await reply(
        `✨ *Ability: ${capitalize(a.name)}*\n\n` +
        `📝 ${desc}\n\n` +
        `🔮 *Generation:* ${a.generation?.name?.replace("generation-", "Gen ").toUpperCase() || "?"}\n` +
        `🦄 *Pokémon with ability:* ${pokemon}...${FOOTER}`
      );
    } catch {
      await reply(`❌ Ability *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "pokemonitem",
  aliases: ["pitem", "pokitem"],
  category: "Pokemon",
  description: "Get info about a Pokémon held item (.pokemonitem leftovers)",
  handler: async ({ args, reply }) => {
    const q = args.join("-").toLowerCase();
    if (!q) return reply(`❓ Usage: .pokemonitem <item>\nExample: .pokemonitem leftovers`);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/item/${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const item = await res.json() as any;
      const desc = item.flavor_text_entries?.find((e: any) => e.language?.name === "en")?.text?.replace(/\f/g, " ") || "N/A";
      await reply(
        `🎒 *Item: ${capitalize(item.name)}*\n\n` +
        `💰 *Cost:* ₽${item.cost}\n` +
        `🏷️ *Category:* ${capitalize(item.category?.name || "?")}\n\n` +
        `📝 ${desc}${FOOTER}`
      );
    } catch {
      await reply(`❌ Item *${q}* not found.${FOOTER}`);
    }
  },
});

registerCommand({
  name: "whoisthatpokemon",
  aliases: ["guesspoke", "pokeguess"],
  category: "Pokemon",
  description: "Who's that Pokémon? Sends silhouette-style challenge",
  handler: async ({ sock, from, msg, reply }) => {
    try {
      const id = Math.floor(Math.random() * 150) + 1;
      const p = await getPokemon(String(id));
      const imgUrl = p.sprites?.front_default;
      if (!imgUrl) return reply(`❌ Could not load Pokémon image.${FOOTER}`);
      await sock.sendMessage(from, {
        image: { url: imgUrl },
        caption: `❓ *WHO'S THAT POKÉMON?*\n\n_Reply with .reveal to find out!_\n\n> _MAXX-XMD_ ⚡`,
      }, { quoted: msg });
      // Store answer in a timeout message
      setTimeout(async () => {
        await sock.sendMessage(from, {
          text: `🎉 It was *${capitalize(p.name)}* (#${id})!${FOOTER}`,
        });
      }, 15000);
    } catch {
      await reply(`❌ Could not start Pokémon guess.${FOOTER}`);
    }
  },
});
