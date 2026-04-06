import { config, ownerJid } from '../lib/config.js';

async function requireAdmin(sock, msg) {
  const { key } = msg;
  const jid = key.remoteJid;
  const sender = key.participant || key.remoteJid;
  const owner = ownerJid();

  if (sender === owner) return true;

  try {
    const meta = await sock.groupMetadata(jid);
    const admins = meta.participants
      .filter(p => p.admin)
      .map(p => p.id);
    return admins.includes(sender);
  } catch {
    return false;
  }
}

export const tagAllCommand = {
  names: ['tagall', 'everyone', '@all'],
  description: 'Tag all group members',
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ Group only command!' }, { quoted: msg });
    }

    const isAdmin = await requireAdmin(sock, msg);
    if (!isAdmin) {
      return sock.sendMessage(jid, { text: '❌ Admins only!' }, { quoted: msg });
    }

    const meta = await sock.groupMetadata(jid);
    const members = meta.participants.map(p => p.id);
    const extra = args.join(' ') || '👋 Hey everyone!';
    const mentions = members.map(m => `@${m.split('@')[0]}`).join(' ');

    await sock.sendMessage(jid, {
      text: `${extra}\n\n${mentions}`,
      mentions: members,
    }, { quoted: msg });
  },
};

export const kickCommand = {
  names: ['kick', 'remove'],
  description: 'Remove a member from the group',
  async execute(sock, msg, args) {
    const { key, message } = msg;
    const jid = key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ Group only command!' }, { quoted: msg });
    }

    const isAdmin = await requireAdmin(sock, msg);
    if (!isAdmin) {
      return sock.sendMessage(jid, { text: '❌ Admins only!' }, { quoted: msg });
    }

    let target = null;
    const quoted = message?.extendedTextMessage?.contextInfo?.participant;
    if (quoted) {
      target = quoted;
    } else if (args[0]) {
      target = args[0].replace(/[@+\s]/g, '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    }

    if (!target) {
      return sock.sendMessage(jid, { text: '❌ Tag or reply to a user to kick.' }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(jid, [target], 'remove');
      await sock.sendMessage(jid, {
        text: `✅ @${target.split('@')[0]} has been removed.`,
        mentions: [target],
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: '❌ Could not remove member. Am I an admin?' }, { quoted: msg });
    }
  },
};

export const muteCommand = {
  names: ['mute'],
  description: 'Mute the group (admins only can send)',
  async execute(sock, msg, _args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return;
    const isAdmin = await requireAdmin(sock, msg);
    if (!isAdmin) {
      return sock.sendMessage(jid, { text: '❌ Admins only!' }, { quoted: msg });
    }
    await sock.groupSettingUpdate(jid, 'announcement');
    await sock.sendMessage(jid, { text: '🔇 Group muted — only admins can send messages.' }, { quoted: msg });
  },
};

export const unmuteCommand = {
  names: ['unmute', 'open'],
  description: 'Unmute the group',
  async execute(sock, msg, _args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return;
    const isAdmin = await requireAdmin(sock, msg);
    if (!isAdmin) {
      return sock.sendMessage(jid, { text: '❌ Admins only!' }, { quoted: msg });
    }
    await sock.groupSettingUpdate(jid, 'not_announcement');
    await sock.sendMessage(jid, { text: '🔊 Group unmuted — everyone can send messages.' }, { quoted: msg });
  },
};

export const ginfoCommand = {
  names: ['ginfo', 'groupinfo'],
  description: 'Show group information',
  async execute(sock, msg, _args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ Group only command!' }, { quoted: msg });
    }

    try {
      const meta = await sock.groupMetadata(jid);
      const admins = meta.participants.filter(p => p.admin).length;
      const createdAt = new Date(meta.creation * 1000).toLocaleDateString();

      await sock.sendMessage(jid, {
        text: [
          `📊 *Group Information*`,
          ``,
          `*Name:* ${meta.subject}`,
          `*ID:* ${jid.split('@')[0]}`,
          `*Created:* ${createdAt}`,
          `*Members:* ${meta.participants.length}`,
          `*Admins:* ${admins}`,
          `*Status:* ${meta.announce ? '🔒 Closed' : '🔓 Open'}`,
          meta.desc ? `\n*Description:*\n${meta.desc}` : '',
        ].filter(Boolean).join('\n'),
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: '❌ Failed to fetch group info.' }, { quoted: msg });
    }
  },
};

export const linkCommand = {
  names: ['link', 'invitelink'],
  description: 'Get the group invite link',
  async execute(sock, msg, _args) {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return;

    const isAdmin = await requireAdmin(sock, msg);
    if (!isAdmin) {
      return sock.sendMessage(jid, { text: '❌ Admins only!' }, { quoted: msg });
    }

    try {
      const code = await sock.groupInviteCode(jid);
      await sock.sendMessage(jid, {
        text: `🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`,
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: '❌ Could not get invite link. Am I an admin?' }, { quoted: msg });
    }
  },
};

export const promoteCommand = {
  names: ['promote'],
  description: 'Make a member admin',
  async execute(sock, msg, args) {
    const { key, message } = msg;
    const jid = key.remoteJid;
    if (!jid.endsWith('@g.us')) return;

    const isAdmin = await requireAdmin(sock, msg);
    if (!isAdmin) {
      return sock.sendMessage(jid, { text: '❌ Admins only!' }, { quoted: msg });
    }

    const target = message?.extendedTextMessage?.contextInfo?.participant
      || (args[0] ? args[0].replace(/[@+\s]/g, '').replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

    if (!target) {
      return sock.sendMessage(jid, { text: '❌ Tag or reply to a user.' }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(jid, [target], 'promote');
      await sock.sendMessage(jid, {
        text: `⭐ @${target.split('@')[0]} is now an admin!`,
        mentions: [target],
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: '❌ Failed to promote.' }, { quoted: msg });
    }
  },
};

export const demoteCommand = {
  names: ['demote'],
  description: 'Remove admin from a member',
  async execute(sock, msg, args) {
    const { key, message } = msg;
    const jid = key.remoteJid;
    if (!jid.endsWith('@g.us')) return;

    const isAdmin = await requireAdmin(sock, msg);
    if (!isAdmin) {
      return sock.sendMessage(jid, { text: '❌ Admins only!' }, { quoted: msg });
    }

    const target = message?.extendedTextMessage?.contextInfo?.participant
      || (args[0] ? args[0].replace(/[@+\s]/g, '').replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

    if (!target) {
      return sock.sendMessage(jid, { text: '❌ Tag or reply to a user.' }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(jid, [target], 'demote');
      await sock.sendMessage(jid, {
        text: `⬇️ @${target.split('@')[0]} has been demoted.`,
        mentions: [target],
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: '❌ Failed to demote.' }, { quoted: msg });
    }
  },
};
