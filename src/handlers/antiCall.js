import { config } from '../lib/config.js';
import { ownerJid } from '../lib/config.js';
import logger from '../lib/logger.js';

/**
 * ANTICALL: reject incoming calls and optionally warn the caller.
 */
export async function handleCall(sock, calls) {
  if (!config.ANTICALL) return;

  for (const call of calls) {
    if (call.isGroup || call.status !== 'offer') continue;

    const caller = call.from;
    const owner = ownerJid();

    // Don't block owner's calls
    if (owner && caller === owner) continue;

    try {
      await sock.rejectCall(call.id, call.from);
      logger.info({ from: caller }, 'Call rejected (ANTICALL)');

      await sock.sendMessage(caller, {
        text: `❌ *Calls are not allowed!*\n\nThis bot does not accept calls. Please use text messages only.\n\n_— ${config.BOT_NAME}_`,
      });
    } catch (err) {
      logger.debug({ err }, 'handleCall error');
    }
  }
}
