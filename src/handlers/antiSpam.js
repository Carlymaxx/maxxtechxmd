import NodeCache from 'node-cache';
import { config } from '../lib/config.js';
import logger from '../lib/logger.js';

// Track message counts: jid -> { count, warned }
const spamCache = new NodeCache({ stdTTL: 10, checkperiod: 15 });
const SPAM_LIMIT = 7; // messages per 10 seconds

/**
 * ANTI_SPAM: detect rapid messaging and warn/kick the user.
 */
export async function handleAntiSpam(sock, msg) {
  if (!config.ANTI_SPAM) return false;
  const { key } = msg;
  if (!key.remoteJid?.endsWith('@g.us') || key.fromMe) return false;

  const participant = key.participant || key.remoteJid;
  const cacheKey = `${key.remoteJid}:${participant}`;

  let data = spamCache.get(cacheKey) || { count: 0, warned: false };
  data.count++;
  spamCache.set(cacheKey, data);

  if (data.count >= SPAM_LIMIT && !data.warned) {
    data.warned = true;
    spamCache.set(cacheKey, data);

    try {
      await sock.sendMessage(key.remoteJid, {
        text: `⚠️ @${participant.split('@')[0]} Please stop spamming! You have been warned.\nContinued spam may result in removal.`,
        mentions: [participant],
      });
      logger.info({ participant, group: key.remoteJid }, 'Spam warning sent');
    } catch (err) {
      logger.debug({ err }, 'antiSpam warning error');
    }
    return true;
  }

  if (data.count >= SPAM_LIMIT * 2 && data.warned) {
    try {
      await sock.groupParticipantsUpdate(key.remoteJid, [participant], 'remove');
      logger.info({ participant, group: key.remoteJid }, 'Spammer removed');
      spamCache.del(cacheKey);
    } catch (err) {
      logger.debug({ err }, 'antiSpam kick error');
    }
    return true;
  }

  return false;
}
