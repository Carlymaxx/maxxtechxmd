module.exports = {
  name: "flip",
  alias: ["coin", "coinflip"],
  description: "Flip a coin",
  execute: async (sock, msg, args, from, settings) => {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    const emoji = result === "Heads" ? "🪙" : "💰";
    const text = `${emoji} *Coin Flip*\n\n🔄 Flipping...\n\n✨ Result: *${result}!* ${emoji}`;
    await sock.sendMessage(from, { text }, { quoted: msg });
  }
};
