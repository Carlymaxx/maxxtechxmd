import { config } from '../lib/config.js';
import logger from '../lib/logger.js';

// Random emoji reactions to cycle through
const REACTIONS = ['❤️', '😂', '😮', '🔥', '👏', '🎉', '💯', '😍', '🙏', '😎'];
let reactionIndex = 0;

function nextReaction() {
  const emoji = REACTIONS[reactionIndex % REACTIONS.length];
  reactionIndex++;
  return emoji;
}

/**
 * Handle incoming messages for auto features:
 * - AUTO_READ: mark messages as read
 * - AUTO_TYPING: simulate typing presence
 * - AUTO_REACT: react to messages with emojis
 */
export async function handleAutoFeatures(sock, msg) {
  const { key, message } = msg;
  if (!message || key.fromMe) return;

  try {
    // AUTO_READ
    if (config.AUTO_READ) {
      await sock.readMessages([key]);
    }

    // AUTO_TYPING
    if (config.AUTO_TYPING) {
      const jid = key.remoteJid;
      await sock.sendPresenceUpdate('composing', jid);
      setTimeout(() => sock.sendPresenceUpdate('paused', jid).catch(() => {}), 3000);
    }

    // AUTO_REACT
    if (config.AUTO_REACT && key.remoteJid && !key.remoteJid.endsWith('@broadcast')) {
      const emoji = nextReaction();
      await sock.sendMessage(key.remoteJid, {
        react: { text: emoji, key },
      });
    }
  } catch (err) {
    logger.debug({ err }, 'autoFeatures error');
  }
}

/**
 * Handle status/story updates:
 * - AUTO_VIEW_STATUS: mark status as viewed
 * - AUTO_LIKE_STATUS: send a heart react to the status
 */
export async function handleStatusUpdate(sock, status) {
  if (!config.AUTO_VIEW_STATUS && !config.AUTO_LIKE_STATUS) return;

  try {
    if (config.AUTO_VIEW_STATUS) {
      await sock.readMessages([status.key]);
    }
    if (config.AUTO_LIKE_STATUS) {
      await sock.sendMessage('status@broadcast', {
        react: { text: '❤️', key: status.key },
      });
    }
  } catch (err) {
    logger.debug({ err }, 'handleStatusUpdate error');
  }
}
