const compliments = [
  "You're an amazing person and don't let anyone tell you otherwise! 🌟",
  "Your smile could light up a whole city! 😊",
  "You have the heart of a champion! 🏆",
  "The world is better because you're in it! 🌍",
  "You're braver than you believe, stronger than you seem, and smarter than you think! 💪",
  "Your kindness is a balm to everyone who encounters it! 💖",
  "You're like sunshine on a rainy day! ☀️",
  "Your creativity inspires everyone around you! 🎨",
  "You have an incredible energy that's contagious! ⚡",
  "You make the world a more beautiful place! 🌸",
  "Your determination is unmatched! 🔥",
  "You're one in a million! 💎",
  "Your laugh is the best sound in the world! 😂",
  "You have the most beautiful soul! 🦋",
  "Everything you touch turns to gold! ✨",
  "You're a walking inspiration! 🌈",
  "Your presence makes every room brighter! 💡",
  "You have the power to change the world! 🌟",
  "You're proof that good things still exist! 🙏",
  "You deserve all the happiness in the world! 🎉"
];

module.exports = {
  name: "compliment",
  alias: ["hype", "nice"],
  description: "Get a random compliment",
  execute: async (sock, msg, args, from, settings) => {
    const name = msg.pushName || "friend";
    const compliment = compliments[Math.floor(Math.random() * compliments.length)];
    await sock.sendMessage(from, {
      text: `💝 *Hey ${name}!*\n\n${compliment}\n\n> _Sent with love by ${settings.botName}_ 💕`
    }, { quoted: msg });
  }
};
