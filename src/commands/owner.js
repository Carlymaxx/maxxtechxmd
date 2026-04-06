import { config, ownerJid } from '../lib/config.js';
import axios from 'axios';
import logger from '../lib/logger.js';

function isOwner(msg) {
  const sender = msg.key.participant || msg.key.remoteJid;
  return sender === ownerJid();
}

export const restartCommand = {
  names: ['restart', 'reboot'],
  description: 'Restart the bot (owner only)',
  ownerOnly: true,
  async execute(sock, msg, _args) {
    const jid = msg.key.remoteJid;
    if (!isOwner(msg)) {
      return sock.sendMessage(jid, { text: '❌ Owner only command!' }, { quoted: msg });
    }

    await sock.sendMessage(jid, { text: '🔄 Restarting bot...' }, { quoted: msg });

    if (config.HEROKU_API_KEY && config.HEROKU_APP_NAME) {
      try {
        await axios.delete(
          `https://api.heroku.com/apps/${config.HEROKU_APP_NAME}/dynos`,
          {
            headers: {
              Authorization: `Bearer ${config.HEROKU_API_KEY}`,
              Accept: 'application/vnd.heroku+json; version=3',
            },
          }
        );
        logger.info('Bot restart triggered via Heroku API');
      } catch (err) {
        logger.warn({ err }, 'Heroku restart failed, using process.exit');
        setTimeout(() => process.exit(0), 1000);
      }
    } else {
      setTimeout(() => process.exit(0), 1000);
    }
  },
};

export const broadcastCommand = {
  names: ['broadcast', 'bc'],
  description: 'Broadcast message to all groups (owner only)',
  ownerOnly: true,
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!isOwner(msg)) {
      return sock.sendMessage(jid, { text: '❌ Owner only command!' }, { quoted: msg });
    }

    const text = args.join(' ');
    if (!text) {
      return sock.sendMessage(jid, { text: '❌ Provide a message to broadcast.' }, { quoted: msg });
    }

    try {
      const groups = await sock.groupFetchAllParticipating();
      const ids = Object.keys(groups);

      await sock.sendMessage(jid, {
        text: `📢 Broadcasting to ${ids.length} groups...`,
      }, { quoted: msg });

      let sent = 0;
      for (const gid of ids) {
        try {
          await sock.sendMessage(gid, { text: `📢 *Broadcast Message*\n\n${text}` });
          sent++;
          await new Promise(r => setTimeout(r, 300));
        } catch (_) {}
      }

      await sock.sendMessage(jid, { text: `✅ Sent to ${sent}/${ids.length} groups.` });
    } catch (err) {
      await sock.sendMessage(jid, { text: `❌ Broadcast failed: ${err.message}` });
    }
  },
};

export const setAutoReactCommand = {
  names: ['setautoreact', 'autoreact'],
  description: 'Toggle auto react feature',
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!isOwner(msg)) {
      return sock.sendMessage(jid, { text: '❌ Owner only command!' }, { quoted: msg });
    }

    const val = (args[0] || '').toLowerCase();
    if (val === 'on') {
      config.AUTO_REACT = true;
      await sock.sendMessage(jid, { text: '✅ Auto React is now ON!' }, { quoted: msg });
    } else if (val === 'off') {
      config.AUTO_REACT = false;
      await sock.sendMessage(jid, { text: '❌ Auto React is now OFF!' }, { quoted: msg });
    } else {
      await sock.sendMessage(jid, {
        text: `Auto React is currently: ${config.AUTO_REACT ? 'ON ✅' : 'OFF ❌'}\nUse: \`${config.PREFIX}setautoreact on/off\``,
      }, { quoted: msg });
    }
  },
};

export const setAutoReadCommand = {
  names: ['setautoread', 'autoread'],
  description: 'Toggle auto read feature',
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid;
    if (!isOwner(msg)) {
      return sock.sendMessage(jid, { text: '❌ Owner only command!' }, { quoted: msg });
    }

    const val = (args[0] || '').toLowerCase();
    if (val === 'on') {
      config.AUTO_READ = true;
      await sock.sendMessage(jid, { text: '✅ Auto Read is now ON!' }, { quoted: msg });
    } else if (val === 'off') {
      config.AUTO_READ = false;
      await sock.sendMessage(jid, { text: '❌ Auto Read is now OFF!' }, { quoted: msg });
    } else {
      await sock.sendMessage(jid, {
        text: `Auto Read is currently: ${config.AUTO_READ ? 'ON ✅' : 'OFF ❌'}\nUse: \`${config.PREFIX}setautoread on/off\``,
      }, { quoted: msg });
    }
  },
};
