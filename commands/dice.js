module.exports = {
  name: "dice",
  alias: ["roll"],
  description: "Roll a dice",
  execute: async (sock, msg, args, from, settings) => {
    const sides = parseInt(args[0]) || 6;
    const count = Math.min(parseInt(args[1]) || 1, 10);
    const results = [];

    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }

    const diceEmojis = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const total = results.reduce((a, b) => a + b, 0);

    let display = results.map(r => {
      if (sides === 6 && r <= 6) return `${diceEmojis[r]} (${r})`;
      return `🎲 ${r}`;
    }).join("\n");

    const text = `🎲 *Dice Roll*\n\n${display}\n\n${count > 1 ? `📊 *Total:* ${total}\n` : ""}> _${sides}-sided dice${count > 1 ? ` × ${count}` : ""}_`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  }
};
