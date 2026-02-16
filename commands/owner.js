module.exports = {
  name: "owner",
  alias: ["creator", "dev"],
  description: "Show bot owner info",
  execute: async (sock, msg, args, from, settings) => {
    const ownerNumber = settings.ownerNumber || "254725979273";
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${settings.owner}
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}
END:VCARD`;

    await sock.sendMessage(from, {
      contacts: {
        displayName: settings.owner,
        contacts: [{ vcard }]
      }
    }, { quoted: msg });

    await sock.sendMessage(from, {
      text: `👑 *Bot Owner:* ${settings.owner}\n📞 *Number:* +${ownerNumber}\n🤖 *Bot:* ${settings.botName}\n\n> _Contact owner for bot related queries_`
    });
  }
};
