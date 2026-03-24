import { registerCommand } from "./types";

const TRUTHS = [
  "What's your biggest fear in life?",
  "What's the most embarrassing thing you've ever done?",
  "Have you ever lied to your best friend?",
  "What's the worst thing you've ever said to someone?",
  "Who is your secret crush?",
  "What's a bad habit you have that nobody knows about?",
  "Have you ever cheated on a test?",
  "What's the most childish thing you still do?",
  "Have you ever stolen something?",
  "What's your biggest regret?",
  "Have you ever blamed someone else for something you did?",
  "What's the strangest dream you've ever had?",
  "Have you ever read someone's messages without them knowing?",
  "What's your most embarrassing nickname?",
  "Have you ever pretended to be sick to skip something?",
  "What's something you're too embarrassed to tell your parents?",
  "Have you ever talked badly about someone in this group?",
  "What's the longest you've gone without showering?",
  "Have you ever sent a message to the wrong person?",
  "What's the dumbest thing you've ever done?",
  "Have you ever ghosted someone?",
  "What's a lie you told that got out of control?",
  "Do you have feelings for anyone in this group?",
  "Have you ever been caught snooping?",
  "What's the most trouble you've ever been in?",
];

const DARES = [
  "Change your profile picture to something funny for 1 hour.",
  "Write 'I am a potato' as your status for 30 minutes.",
  "Send a voice note singing happy birthday to the group.",
  "Let the last person who messaged you choose your next status.",
  "Send a compliment to every person in this group.",
  "Post a funny selfie in the group right now.",
  "Text someone you haven't talked to in a year.",
  "Put your phone away for the next 30 minutes.",
  "Send a screenshot of your most used emoji.",
  "Call someone in your contacts and say 'I love you' then hang up.",
  "Send a voice note saying 'MAXX XMD is the best bot ever!'",
  "Share your lock screen wallpaper in the group.",
  "Write a poem about the person above you in the group.",
  "Do 20 push-ups and send a voice note counting them.",
  "Change your name to 'MAXX XMD Fan' for 1 hour.",
  "Send the 5th photo in your gallery right now.",
  "Share your last WhatsApp status.",
  "Tell a joke in the group right now.",
  "Speak only in emojis for the next 5 minutes.",
  "Let the group vote on your next profile picture.",
  "Send 'I'm the best' to your group admin.",
  "Share the most recent meme you saved.",
  "Describe your day using only 3 emojis.",
  "Do a voice note impression of your favorite celebrity.",
  "Send your real age and location (city only).",
];

registerCommand({
  name: "jokes",
  aliases: ["joke"],
  category: "Fun",
  description: "Get a random joke",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist&type=single");
      const data = await res.json() as any;
      await reply(`😂 *Joke of the Day*\n\n${data.joke || "Why did the programmer quit? Because he didn't get arrays! 😄"}`);
    } catch {
      await reply("😂 Why don't scientists trust atoms?\n\nBecause they make up everything! 😄");
    }
  },
});

registerCommand({
  name: "fact",
  aliases: ["facts", "funfact"],
  category: "Fun",
  description: "Get a random interesting fact",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en");
      const data = await res.json() as any;
      await reply(`🤓 *Random Fact*\n\n${data.text}`);
    } catch {
      await reply("🤓 *Random Fact*\n\nHoney never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible!");
    }
  },
});

registerCommand({
  name: "quotes",
  aliases: ["quote", "motivation"],
  category: "Fun",
  description: "Get a random inspirational quote",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://zenquotes.io/api/random");
      const data = await res.json() as any;
      if (Array.isArray(data) && data[0]) {
        await reply(`💬 *Quote of the Day*\n\n_"${data[0].q}"_\n\n— *${data[0].a}*`);
      } else throw new Error();
    } catch {
      try {
        const r2 = await fetch("https://api.quotable.io/random");
        const d2 = await r2.json() as any;
        await reply(`💬 *Quote*\n\n_"${d2.content}"_\n\n— *${d2.author}*`);
      } catch {
        await reply(`💬 *Quote*\n\n_"The only way to do great work is to love what you do."_\n\n— *Steve Jobs*`);
      }
    }
  },
});

registerCommand({
  name: "trivia",
  aliases: ["quiz"],
  category: "Fun",
  description: "Get a random trivia question",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
      const data = await res.json() as any;
      const q = data.results?.[0];
      if (!q) throw new Error();
      const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
      const options = [...q.incorrect_answers, q.correct_answer]
        .sort(() => Math.random() - 0.5)
        .map((o: string, i: number) => `${["A", "B", "C", "D"][i]}. ${decode(o)}`)
        .join("\n");
      await reply(`🧠 *Trivia Time!*\n\n*Category:* ${decode(q.category)}\n*Difficulty:* ${q.difficulty}\n\n❓ ${decode(q.question)}\n\n${options}\n\n_Reply with the answer letter!_\n✅ Correct: *${decode(q.correct_answer)}*`);
    } catch {
      await reply(`🧠 *Trivia*\n\n❓ What is the capital of France?\n\nA. London\nB. Berlin\nC. Paris\nD. Madrid\n\n✅ Correct: *Paris*`);
    }
  },
});

registerCommand({
  name: "memes",
  aliases: ["meme"],
  category: "Fun",
  description: "Get a random meme",
  handler: async ({ sock, from, reply }) => {
    try {
      const res = await fetch("https://meme-api.com/gimme");
      const data = await res.json() as any;
      if (!data.url) throw new Error();
      await sock.sendMessage(from, {
        image: { url: data.url },
        caption: `😂 *${data.title}*\n\n👍 ${data.ups} upvotes | r/${data.subreddit}`,
      });
    } catch {
      await reply("😅 Couldn't fetch a meme right now. Try again!");
    }
  },
});

registerCommand({
  name: "truthdetector",
  aliases: ["lovedetector", "shiplove"],
  category: "Fun",
  description: "Fun truth/compatibility detector",
  handler: async ({ args, reply }) => {
    const name = args.join(" ") || "You";
    const pct = Math.floor(Math.random() * 101);
    const bars = Math.round(pct / 10);
    const bar = "█".repeat(bars) + "░".repeat(10 - bars);
    const msg = pct > 80 ? "🔥 Absolutely Amazing!" : pct > 60 ? "💛 Pretty Good!" : pct > 40 ? "😐 Average" : "❄️ Needs Work";
    await reply(`💖 *Truth Detector*\n\n👤 Name: *${name}*\n\n📊 [${bar}] ${pct}%\n\n${msg}`);
  },
});

registerCommand({
  name: "xxqc",
  aliases: ["8ball", "magic"],
  category: "Fun",
  description: "Ask the magic 8-ball",
  handler: async ({ args, reply }) => {
    const q = args.join(" ");
    if (!q) return reply("❓ Please ask a question!\nExample: .xxqc Will I be rich?");
    const answers = [
      "🎱 It is certain!", "🎱 Without a doubt!",
      "🎱 Yes, definitely!", "🎱 You may rely on it!",
      "🎱 As I see it, yes.", "🎱 Most likely.",
      "🎱 Signs point to yes.", "🎱 Reply hazy, try again.",
      "🎱 Ask again later.", "🎱 Better not tell you now.",
      "🎱 Cannot predict now.", "🎱 Don't count on it.",
      "🎱 My reply is no.", "🎱 Outlook not so good.",
      "🎱 Very doubtful.", "🎱 Outlook is good!",
    ];
    const ans = answers[Math.floor(Math.random() * answers.length)];
    await reply(`🎱 *Magic 8-Ball*\n\n❓ *Q:* ${q}\n\n${ans}`);
  },
});
