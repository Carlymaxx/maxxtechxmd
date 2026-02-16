async function getSenderJid(msg) {
  return msg.key.participant || msg.key.remoteJid;
}

async function isGroupAdmin(sock, groupJid, userJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const participant = meta.participants.find(p => p.id === userJid);
    return participant && ["admin", "superadmin"].includes(participant.admin);
  } catch {
    return false;
  }
}

async function isBotAdmin(sock, groupJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const participant = meta.participants.find(p => p.id === botId);
    return participant && ["admin", "superadmin"].includes(participant.admin);
  } catch {
    return false;
  }
}

module.exports = { getSenderJid, isGroupAdmin, isBotAdmin };
