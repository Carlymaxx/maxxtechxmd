import { config, ownerJid } from '../lib/config.js';
import logger from '../lib/logger.js';

const USAGE = `
*GROUP STATUS — Usage*

\`${config.PREFIX}groupstatus open\` — Open group (everyone can send)
\`${config.PREFIX}groupstatus close\` — Close group (admins only)
\`${config.PREFIX}groupstatus info\` — Show current group status
`.trim();

export const groupStatusCommand = {
  names: ['groupstatus', 'gstatus', 'gcstatus'],
  description: 'Manage group message settings',
  async execute(sock, msg, args) {
    const { key } = msg;
    const jid = key.remoteJid;

    // Only works in groups
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: '❌ This command only works in groups!',
      }, { quoted: msg });
    }

    const sender = key.participant || key.remoteJid;
    const isOwner = sender === ownerJid();

    // Check if sender is admin
    let isAdmin = isOwner;
    try {
      const meta = await sock.groupMetadata(jid);
      const admins = meta.participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);
      isAdmin = isAdmin || admins.includes(sender);
    } catch (err) {
      logger.debug({ err }, 'groupstatus metadata error');
    }

    if (!isAdmin) {
      return sock.sendMessage(jid, {
        text: '❌ Only group admins can use this command!',
      }, { quoted: msg });
    }

    const sub = (args[0] || '').toLowerCase();

    if (!sub || sub === 'help') {
      return sock.sendMessage(jid, { text: USAGE }, { quoted: msg });
    }

    if (sub === 'info') {
      try {
        const meta = await sock.groupMetadata(jid);
        const isLocked = meta.announce;
        await sock.sendMessage(jid, {
          text: [
            `📊 *Group Status Info*`,
            ``,
            `*Group:* ${meta.subject}`,
            `*Status:* ${isLocked ? '🔒 Closed (Admins only)' : '🔓 Open (Everyone)'}`,
            `*Members:* ${meta.participants.length}`,
            `*Admins:* ${meta.participants.filter(p => p.admin).length}`,
          ].join('\n'),
        }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: '❌ Failed to fetch group info.' }, { quoted: msg });
      }
      return;
    }

    if (sub === 'open') {
      try {
        await sock.groupSettingUpdate(jid, 'not_announcement');
        await sock.sendMessage(jid, {
          text: '✅ *Group is now OPEN!*\nAll members can send messages.',
        }, { quoted: msg });
      } catch {
        await sock.sendMessage(jid, {
          text: '❌ Failed to open group. Make sure I am an admin!',
        }, { quoted: msg });
      }
      return;
    }

    if (sub === 'close') {
      try {
        await sock.groupSettingUpdate(jid, 'announcement');
        await sock.sendMessage(jid, {
          text: '🔒 *Group is now CLOSED!*\nOnly admins can send messages.',
        }, { quoted: msg });
      } catch {
        await sock.sendMessage(jid, {
          text: '❌ Failed to close group. Make sure I am an admin!',
        }, { quoted: msg });
      }
      return;
    }

    await sock.sendMessage(jid, { text: USAGE }, { quoted: msg });
  },
};
