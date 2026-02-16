const answers = [
  "🟢 It is certain!",
  "🟢 Without a doubt!",
  "🟢 Yes, definitely!",
  "🟢 You may rely on it!",
  "🟢 As I see it, yes!",
  "🟢 Most likely!",
  "🟢 Outlook good!",
  "🟢 Yes!",
  "🟢 Signs point to yes!",
  "🟡 Reply hazy, try again...",
  "🟡 Ask again later...",
  "🟡 Better not tell you now...",
  "🟡 Cannot predict now...",
  "🟡 Concentrate and ask again...",
  "🔴 Don't count on it!",
  "🔴 My reply is no!",
  "🔴 My sources say no!",
  "🔴 Outlook not so good!",
  "🔴 Very doubtful!"
];

module.exports = {
  name: "8ball",
  alias: ["ask", "magic"],
  description: "Ask the magic 8-ball a question",
  execute: async (sock, msg, args, from, settings) => {
    if (!args.length) {
      return await sock.sendMessage(from, { text: "🎱 Please ask a question!\n\nExample: .8ball Will I be rich?" }, { quoted: msg });
    }

    const question = args.join(" ");
    const answer = answers[Math.floor(Math.random() * answers.length)];

    await sock.sendMessage(from, {
      text: `🎱 *Magic 8-Ball*\n\n❓ *Question:* ${question}\n\n✨ *Answer:* ${answer}`
    }, { quoted: msg });
  }
};
