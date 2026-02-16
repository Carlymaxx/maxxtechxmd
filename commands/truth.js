const truths = [
  "What is the most embarrassing thing you've ever done?",
  "What's the biggest lie you've ever told?",
  "What's your biggest fear?",
  "What's the most childish thing you still do?",
  "What's the worst thing you've ever said to someone?",
  "Have you ever cheated on a test?",
  "What's the most embarrassing thing in your phone?",
  "What's your biggest insecurity?",
  "Have you ever lied to your best friend?",
  "What's the last lie you told?",
  "What's the most trouble you've ever been in?",
  "Who was your first crush?",
  "What's the weirdest dream you've ever had?",
  "If you could be invisible for a day, what would you do?",
  "What's the meanest thing you've done to a friend?",
  "What's your most embarrassing nickname?",
  "Have you ever pretended to like a gift you hated?",
  "What's the longest you've gone without showering?",
  "What's a secret you've never told anyone?",
  "If you had to delete one app from your phone, which would it be?"
];

module.exports = {
  name: "truth",
  description: "Get a random truth question",
  execute: async (sock, msg, args, from, settings) => {
    const truth = truths[Math.floor(Math.random() * truths.length)];
    await sock.sendMessage(from, {
      text: `🔮 *Truth Question:*\n\n${truth}\n\n> _Answer honestly!_ 😏`
    }, { quoted: msg });
  }
};
