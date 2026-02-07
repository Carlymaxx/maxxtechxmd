module.exports = {
  name: "save",
  description: "Save WhatsApp status",
  execute: async (sock, msg, args, from) => {
    if (!args[0]) return sock.sendMessage(from, { text: "Example: .save 3" });

    let index = Number(args[0]) - 1;

    // Replace with your actual method to fetch statuses
    let statuses = await sock.getStatus?.(); // optional chaining just in case
    if (!statuses) return sock.sendMessage(from, { text: "No statuses available." });

    let target = statuses[index];
    if (!target) return sock.sendMessage(from, { text: "Status not found." });

    let media = await sock.downloadMediaMessage(target);
    await sock.sendMessage(from, { video: media }, { quoted: msg });
  }
};