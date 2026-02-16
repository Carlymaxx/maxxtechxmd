const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "Why was the computer cold? It left its Windows open! 🪟",
  "What do you call a bear with no teeth? A gummy bear! 🐻",
  "Why don't scientists trust atoms? Because they make up everything! ⚛️",
  "What do you call fake spaghetti? An impasta! 🍝",
  "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
  "I told my wife she was drawing her eyebrows too high. She looked surprised! 😮",
  "What do you call a lazy kangaroo? A pouch potato! 🦘",
  "Why don't eggs tell jokes? They'd crack each other up! 🥚",
  "What do you call a dog that does magic? A Labracadabrador! 🐕",
  "Why did the math book look sad? It had too many problems! 📚",
  "What do you call a fish without eyes? A fsh! 🐟",
  "Why can't you give Elsa a balloon? Because she will let it go! 🎈",
  "What did the ocean say to the beach? Nothing, it just waved! 🌊",
  "Why don't skeletons fight each other? They don't have the guts! 💀",
  "What do you call a sleeping dinosaur? A dino-snore! 🦕",
  "Why did the bicycle fall over? Because it was two-tired! 🚲",
  "What's orange and sounds like a parrot? A carrot! 🥕",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one! ⛳",
  "What do you call a factory that makes okay products? A satisfactory! 🏭",
  "Why don't oysters donate to charity? Because they're shellfish! 🦪",
  "What do you call a belt made of watches? A waist of time! ⌚",
  "Why did the tomato turn red? Because it saw the salad dressing! 🍅",
  "What do you call a can opener that doesn't work? A can't opener! 🥫",
  "Why did the cookie go to the hospital? Because it felt crummy! 🍪"
];

module.exports = {
  name: "joke",
  alias: ["funny", "lol"],
  description: "Get a random joke",
  execute: async (sock, msg, args, from, settings) => {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    await sock.sendMessage(from, { text: `😂 *Random Joke:*\n\n${joke}` }, { quoted: msg });
  }
};
