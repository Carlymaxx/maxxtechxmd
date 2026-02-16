module.exports = {
  name: "calc",
  alias: ["calculate", "math"],
  description: "Calculate a math expression",
  execute: async (sock, msg, args, from, settings) => {
    if (!args.length) {
      return await sock.sendMessage(from, {
        text: "🧮 *Calculator*\n\nUsage: .calc <expression>\n\nExamples:\n• .calc 2 + 2\n• .calc 100 * 5\n• .calc 144 / 12\n• .calc 2 ** 10"
      }, { quoted: msg });
    }

    const expression = args.join(" ");
    const sanitized = expression.replace(/[^0-9+\-*/().%\s^]/g, "").replace(/\^/g, "**");

    try {
      const result = Function('"use strict"; return (' + sanitized + ')')();

      if (typeof result !== "number" || !isFinite(result)) {
        return await sock.sendMessage(from, { text: "❌ Invalid expression! Result is not a valid number." }, { quoted: msg });
      }

      await sock.sendMessage(from, {
        text: `🧮 *Calculator*\n\n📝 *Expression:* ${expression}\n✅ *Result:* ${result}`
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Invalid math expression! Please check your input." }, { quoted: msg });
    }
  }
};
