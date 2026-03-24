import { registerCommand } from "./types";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";

const LEAGUES: Record<string, { id: string; name: string; emoji: string }> = {
  epl: { id: "4328", name: "English Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  laliga: { id: "4335", name: "Spanish La Liga", emoji: "🇪🇸" },
  cl: { id: "4480", name: "UEFA Champions League", emoji: "⭐" },
  bundesliga: { id: "4331", name: "German Bundesliga", emoji: "🇩🇪" },
  seriea: { id: "4332", name: "Italian Serie A", emoji: "🇮🇹" },
  ligue1: { id: "4334", name: "French Ligue 1", emoji: "🇫🇷" },
  el: { id: "4481", name: "UEFA Europa League", emoji: "🏆" },
  efl: { id: "4329", name: "EFL Championship", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  wc: { id: "4429", name: "FIFA World Cup", emoji: "🌍" },
};

async function getStandings(leagueId: string): Promise<string> {
  const season = "2024-2025";
  const res = await fetch(`${BASE}/lookuptable.php?l=${leagueId}&s=${season}`);
  const data = await res.json() as any;
  const table = data.table;
  if (!table?.length) throw new Error("No standings");
  const rows = table.slice(0, 10).map((t: any) =>
    `${String(t.intRank).padStart(2)}. ${t.strTeam.padEnd(20)} ${String(t.intPoints).padStart(3)}pts  W${t.intWin} D${t.intDraw} L${t.intLoss}`
  ).join("\n");
  return rows;
}

async function getEvents(leagueId: string, past = false): Promise<string> {
  const endpoint = past ? "eventspastleague" : "eventsnextleague";
  const res = await fetch(`${BASE}/${endpoint}.php?id=${leagueId}`);
  const data = await res.json() as any;
  const events = data.events?.slice(0, 8);
  if (!events?.length) throw new Error("No events");
  return events.map((e: any) => {
    const date = e.dateEvent || "TBD";
    const time = e.strTime ? e.strTime.slice(0, 5) : "";
    const score = (e.intHomeScore != null && e.intAwayScore != null)
      ? `${e.intHomeScore} - ${e.intAwayScore}`
      : "vs";
    return `⚽ *${e.strHomeTeam}* ${score} *${e.strAwayTeam}*\n   📅 ${date} ${time}`;
  }).join("\n\n");
}

function makeCommands(prefix: string) {
  const info = LEAGUES[prefix];
  if (!info) return;

  registerCommand({
    name: `${prefix}standings`,
    aliases: [],
    category: "Sports",
    description: `${info.name} standings`,
    handler: async ({ reply }) => {
      try {
        const table = await getStandings(info.id);
        await reply(`${info.emoji} *${info.name} Standings*\n\n\`\`\`\n${table}\n\`\`\``);
      } catch {
        await reply(`❌ Could not fetch ${info.name} standings. Try again later.`);
      }
    },
  });

  registerCommand({
    name: `${prefix}matches`,
    aliases: [],
    category: "Sports",
    description: `${info.name} recent results`,
    handler: async ({ reply }) => {
      try {
        const events = await getEvents(info.id, true);
        await reply(`${info.emoji} *${info.name} — Recent Results*\n\n${events}`);
      } catch {
        await reply(`❌ Could not fetch ${info.name} results.`);
      }
    },
  });

  registerCommand({
    name: `${prefix}upcoming`,
    aliases: [],
    category: "Sports",
    description: `${info.name} upcoming fixtures`,
    handler: async ({ reply }) => {
      try {
        const events = await getEvents(info.id, false);
        await reply(`${info.emoji} *${info.name} — Upcoming Fixtures*\n\n${events}`);
      } catch {
        await reply(`❌ Could not fetch ${info.name} fixtures.`);
      }
    },
  });

  registerCommand({
    name: `${prefix}scorers`,
    aliases: [],
    category: "Sports",
    description: `${info.name} top scorers`,
    handler: async ({ reply }) => {
      try {
        const res = await fetch(`${BASE}/lookuptable.php?l=${info.id}&s=2024-2025`);
        const data = await res.json() as any;
        if (!data.table?.length) throw new Error();
        const top = data.table.slice(0, 5).map((t: any, i: number) =>
          `${i + 1}. *${t.strTeam}* — ${t.intGoalsFor} goals scored`
        ).join("\n");
        await reply(`${info.emoji} *${info.name} — Top Scoring Teams*\n\n${top}`);
      } catch {
        await reply(`❌ Could not fetch ${info.name} scorers.`);
      }
    },
  });
}

for (const key of Object.keys(LEAGUES)) makeCommands(key);

registerCommand({
  name: "wwenews",
  aliases: [],
  category: "Sports",
  description: "Latest WWE news",
  handler: async ({ reply }) => {
    try {
      const res = await fetch(`${BASE}/searchevents.php?e=WWE+Raw`);
      const data = await res.json() as any;
      const events = data.event?.slice(0, 5);
      if (!events?.length) throw new Error();
      const list = events.map((e: any) => `🤼 *${e.strEvent}*\n📅 ${e.dateEvent}`).join("\n\n");
      await reply(`🤼 *WWE Latest Events*\n\n${list}`);
    } catch {
      await reply("🤼 *WWE News*\n\n_Visit wwe.com for the latest news and results!_");
    }
  },
});

registerCommand({
  name: "wweschedule",
  aliases: [],
  category: "Sports",
  description: "WWE upcoming schedule",
  handler: async ({ reply }) => {
    await reply(`🤼 *WWE Schedule*\n\n🔗 For the latest WWE schedule:\n📅 https://www.wwe.com/shows\n\nMajor Events:\n• Monday Night RAW — Every Monday\n• SmackDown — Every Friday\n• Pay-Per-View — Monthly`);
  },
});

registerCommand({
  name: "wrestlingevents",
  aliases: [],
  category: "Sports",
  description: "Recent wrestling events",
  handler: async ({ reply }) => {
    try {
      const res = await fetch(`${BASE}/searchevents.php?e=WrestleMania`);
      const data = await res.json() as any;
      const events = data.event?.slice(0, 5);
      if (!events?.length) throw new Error();
      const list = events.map((e: any) =>
        `🤼 *${e.strEvent}*\n📅 ${e.dateEvent || "TBD"}\n🏟️ ${e.strVenue || ""}`
      ).join("\n\n");
      await reply(`🤼 *Wrestling Events*\n\n${list}`);
    } catch {
      await reply("🤼 *Wrestling Events*\n\n_Visit wwe.com or aew.com for the latest!_");
    }
  },
});
