if (global.antilink && text.includes("chat.whatsapp.com")) {
    await sock.sendMessage(from, { text: "🚫 Group link detected!\nMember removed ❌" }, { quoted: msg });
    await sock.groupParticipantsUpdate(from, [msg.key.participant], "remove");
}
if (msg.message?.viewOnceMessageV2) {
    let media = await sock.downloadMediaMessage(msg);
    await sock.sendMessage(from, { image: media, caption: "👁‍🗨 View Once Opened" }, { quoted: msg });
}
const fs = require("fs");
const path = require("path");

if (/(hi|hello|mambo|niaje|boss)/i.test(text)) {
    let voice = fs.readFileSync(path.join(__dirname, "./media/voices/hello.opus"));
    await sock.sendMessage(from, { audio: voice, ptt: true }, { quoted: msg });
}