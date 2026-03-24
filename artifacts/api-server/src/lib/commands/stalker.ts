import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── GitHub stalker ─────────────────────────────────────────────────────────────
registerCommand({
  name: "ghfollowers",
  aliases: ["githubfollowers", "gitfollow"],
  category: "Stalker",
  description: "Get a GitHub user's followers",
  usage: ".ghfollowers <username>",
  handler: async ({ args, reply }) => {
    const user = args[0];
    if (!user) return reply(`❓ Usage: .ghfollowers <github username>${FOOTER}`);
    try {
      const res = await fetch(`https://api.github.com/users/${user}`, {
        headers: { "User-Agent": "MAXX-XMD-Bot" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("User not found");
      const data = await res.json() as any;
      await reply(`👥 *GitHub: @${data.login}*

📛 Name: ${data.name || "N/A"}
👥 Followers: *${data.followers}*
👣 Following: *${data.following}*
📦 Repos: *${data.public_repos}*
🌍 Location: ${data.location || "N/A"}
🏢 Company: ${data.company || "N/A"}
📝 Bio: ${data.bio || "N/A"}
🔗 URL: ${data.html_url}${FOOTER}`);
    } catch (e: any) {
      await reply(`❌ Could not find GitHub user @${user}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "ghfollowing",
  aliases: ["githubfollowing"],
  category: "Stalker",
  description: "Get a GitHub user's following list",
  usage: ".ghfollowing <username>",
  handler: async ({ args, reply }) => {
    const user = args[0];
    if (!user) return reply(`❓ Usage: .ghfollowing <github username>${FOOTER}`);
    try {
      const res = await fetch(`https://api.github.com/users/${user}/following?per_page=20`, {
        headers: { "User-Agent": "MAXX-XMD-Bot" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("User not found");
      const data = await res.json() as any[];
      const list = data.map((u: any) => `• @${u.login}`).join("\n");
      await reply(`👣 *@${user} is following (first 20):*\n\n${list || "Following nobody"}${FOOTER}`);
    } catch {
      await reply(`❌ Could not find GitHub user @${user}${FOOTER}`);
    }
  },
});

registerCommand({
  name: "repostalk",
  aliases: ["gitrepo"],
  category: "Stalker",
  description: "Get info about a GitHub repository",
  usage: ".repostalk <user/repo>",
  handler: async ({ args, reply }) => {
    const repo = args[0];
    if (!repo || !repo.includes("/")) return reply(`❓ Usage: .repostalk <user/repo>\nExample: .repostalk torvalds/linux${FOOTER}`);
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { "User-Agent": "MAXX-XMD-Bot" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("Repo not found");
      const data = await res.json() as any;
      await reply(`📦 *GitHub Repo: ${data.full_name}*

📝 ${data.description || "No description"}
⭐ Stars: *${data.stargazers_count.toLocaleString()}*
🍴 Forks: *${data.forks_count.toLocaleString()}*
👁️ Watchers: *${data.watchers_count}*
🐛 Issues: *${data.open_issues_count}*
💻 Language: *${data.language || "N/A"}*
📅 Created: ${new Date(data.created_at).toDateString()}
🔗 URL: ${data.html_url}${FOOTER}`);
    } catch {
      await reply(`❌ Repo not found: ${args[0]}${FOOTER}`);
    }
  },
});

// ── NPM stalker ────────────────────────────────────────────────────────────────
registerCommand({
  name: "npmstalk",
  aliases: ["npminfo", "npmsearch"],
  category: "Stalker",
  description: "Get NPM package information",
  usage: ".npmstalk <package>",
  handler: async ({ args, reply }) => {
    const pkg = args[0];
    if (!pkg) return reply(`❓ Usage: .npmstalk <package name>${FOOTER}`);
    try {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("Package not found");
      const data = await res.json() as any;
      const latest = data["dist-tags"]?.latest || "N/A";
      const ver = data.versions?.[latest] || {};
      const weeklyDl = await fetch(`https://api.npmjs.org/downloads/point/last-week/${pkg}`).then(r => r.json()).catch(() => ({})) as any;
      await reply(`📦 *NPM: ${data.name}*

📝 ${data.description || "No description"}
🔖 Version: *${latest}*
👤 Author: ${ver.author?.name || "N/A"}
📜 License: *${ver.license || "N/A"}*
📅 Published: ${new Date(data.time?.[latest] || 0).toDateString()}
📥 Weekly Downloads: *${weeklyDl.downloads?.toLocaleString() || "N/A"}*
🔗 https://npmjs.com/package/${pkg}${FOOTER}`);
    } catch {
      await reply(`❌ NPM package not found: ${args[0]}${FOOTER}`);
    }
  },
});

// ── YouTube stalker ────────────────────────────────────────────────────────────
registerCommand({
  name: "ytstalk",
  aliases: ["ytchannel", "youtubechannel"],
  category: "Stalker",
  description: "Get YouTube channel information",
  usage: ".ytstalk <channel name or URL>",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply(`❓ Usage: .ytstalk <channel name>${FOOTER}`);
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " channel")}`;
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      const match = html.match(/"channelId":"([^"]+)".*?"title":"([^"]+)"/);
      const subMatch = html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/);
      if (match) {
        await reply(`🎥 *YouTube Channel*

📛 Name: *${match[2]}*
🆔 ID: ${match[1]}
👥 ${subMatch?.[1] || "Subscribers: N/A"}
🔗 https://youtube.com/channel/${match[1]}${FOOTER}`);
      } else {
        await reply(`🎥 *YouTube Search for:* ${query}\n\n🔗 https://youtube.com/results?search_query=${encodeURIComponent(query + " channel")}${FOOTER}`);
      }
    } catch {
      await reply(`🎥 *YouTube:* ${query}\n🔗 https://youtube.com/results?search_query=${encodeURIComponent(query)}${FOOTER}`);
    }
  },
});

// ── TikTok stalker ─────────────────────────────────────────────────────────────
registerCommand({
  name: "tiktokstalk",
  aliases: ["ttstalk", "tiktokinfo"],
  category: "Stalker",
  description: "Get TikTok user information",
  usage: ".tiktokstalk <username>",
  handler: async ({ args, reply }) => {
    const user = args[0]?.replace("@", "");
    if (!user) return reply(`❓ Usage: .tiktokstalk <username>${FOOTER}`);
    try {
      const res = await fetch(`https://www.tiktok.com/@${user}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html",
        },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      const nickname = html.match(/"nickname":"([^"]+)"/)?.[1] || user;
      const followers = html.match(/"followerCount":(\d+)/)?.[1];
      const following = html.match(/"followingCount":(\d+)/)?.[1];
      const likes = html.match(/"heartCount":(\d+)/)?.[1];
      const videos = html.match(/"videoCount":(\d+)/)?.[1];
      const bio = html.match(/"signature":"([^"]+)"/)?.[1];
      await reply(`🎵 *TikTok: @${user}*

👤 Name: *${nickname}*
📝 Bio: ${bio || "N/A"}
👥 Followers: *${parseInt(followers || "0").toLocaleString() || "N/A"}*
👣 Following: *${parseInt(following || "0").toLocaleString() || "N/A"}*
❤️ Likes: *${parseInt(likes || "0").toLocaleString() || "N/A"}*
📹 Videos: *${videos || "N/A"}*
🔗 https://tiktok.com/@${user}${FOOTER}`);
    } catch {
      await reply(`🎵 *TikTok:* @${user}\n🔗 https://tiktok.com/@${user}${FOOTER}`);
    }
  },
});

// ── Twitter/X stalker ──────────────────────────────────────────────────────────
registerCommand({
  name: "twistalk",
  aliases: ["twstalk", "twitterstalk", "xstalk"],
  category: "Stalker",
  description: "Get Twitter/X user information",
  usage: ".twistalk <username>",
  handler: async ({ args, reply }) => {
    const user = args[0]?.replace("@", "");
    if (!user) return reply(`❓ Usage: .twistalk <username>${FOOTER}`);
    try {
      const res = await fetch(`https://api.socialdata.tools/twitter/user/${user}`, {
        headers: { "Authorization": "Bearer undefined" },
        signal: AbortSignal.timeout(8000),
      });
      throw new Error("No free API");
    } catch {
      await reply(`🐦 *Twitter/X: @${user}*

🔗 Profile: https://x.com/${user}
📊 View full stats on:
• https://twitterstats.net
• https://socialblade.com/twitter/user/${user}${FOOTER}`);
    }
  },
});

// ── Instagram stalker ──────────────────────────────────────────────────────────
registerCommand({
  name: "igstalk",
  aliases: ["iginfo", "instastalk"],
  category: "Stalker",
  description: "Get Instagram profile info",
  usage: ".igstalk <username>",
  handler: async ({ args, reply }) => {
    const user = args[0]?.replace("@", "");
    if (!user) return reply(`❓ Usage: .igstalk <username>${FOOTER}`);
    try {
      const res = await fetch(`https://www.instagram.com/${user}/?__a=1&__d=dis`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
          "Accept": "application/json",
          "x-ig-app-id": "936619743392459",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("Private or not found");
      const data = await res.json() as any;
      const u = data?.data?.user || data?.graphql?.user;
      if (!u) throw new Error("Profile data not found");
      await reply(`📸 *Instagram: @${user}*

👤 Name: *${u.full_name || "N/A"}*
📝 Bio: ${u.biography || "N/A"}
👥 Followers: *${u.edge_followed_by?.count?.toLocaleString() || "N/A"}*
👣 Following: *${u.edge_follow?.count?.toLocaleString() || "N/A"}*
📷 Posts: *${u.edge_owner_to_timeline_media?.count || "N/A"}*
✅ Verified: ${u.is_verified ? "Yes ✔️" : "No"}
🔒 Private: ${u.is_private ? "Yes" : "No"}
🔗 https://instagram.com/${user}${FOOTER}`);
    } catch {
      await reply(`📸 *Instagram: @${user}*

🔗 https://instagram.com/${user}
📊 Full stats: https://socialblade.com/instagram/user/${user}${FOOTER}`);
    }
  },
});

// ── Pinterest stalker ──────────────────────────────────────────────────────────
registerCommand({
  name: "pintereststalk",
  aliases: ["pinterestinfo"],
  category: "Stalker",
  description: "Get Pinterest profile info",
  usage: ".pintereststalk <username>",
  handler: async ({ args, reply }) => {
    const user = args[0];
    if (!user) return reply(`❓ Usage: .pintereststalk <username>${FOOTER}`);
    await reply(`📌 *Pinterest: @${user}*

🔗 Profile: https://pinterest.com/${user}
🌐 Web: https://pinterest.com/${user}/_saved/
📊 Stats: Check profile directly on Pinterest${FOOTER}`);
  },
});

// ── WhatsApp channel stalker ───────────────────────────────────────────────────
registerCommand({
  name: "wachannel",
  aliases: ["wachannelinfo"],
  category: "Stalker",
  description: "Get WhatsApp channel information",
  usage: ".wachannel <channel link or name>",
  handler: async ({ args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply(`❓ Usage: .wachannel <channel link or name>${FOOTER}`);
    const isLink = query.includes("whatsapp.com/channel");
    await reply(`📢 *WhatsApp Channel Info*

${isLink ? `🔗 Channel: ${query}` : `🔍 Search: ${query}`}

ℹ️ WhatsApp doesn't expose channel stats publicly.
• Open the channel link in WhatsApp to see full info.
• Admin info, subscriber count, etc. is visible in the app.${FOOTER}`);
  },
});
