import { config } from '../lib/config.js';
import logger from '../lib/logger.js';

/**
 * Handle group participant updates:
 * - WELCOME_MSG: send welcome/goodbye messages
 */
export async function handleGroupParticipants(sock, update) {
  const { id, participants, action } = update;

  if (action === 'add') {
    for (const jid of participants) {
      const phoneNumber = jid.replace('@s.whatsapp.net', '');
      const welcomeText = config.WELCOME_MSG
        .replace(/@user/gi, `@${phoneNumber}`)
        .replace(/{user}/gi, `@${phoneNumber}`)
        .replace(/\{name\}/gi, phoneNumber);

      try {
        // Try to get group metadata for image
        let groupMeta = null;
        try {
          groupMeta = await sock.groupMetadata(id);
        } catch (_) {}

        const text = `✨ *Welcome to ${groupMeta?.subject || 'the group'}!*\n\n${welcomeText}`;

        if (groupMeta?.descId) {
          await sock.sendMessage(id, {
            text,
            mentions: [jid],
          });
        } else {
          await sock.sendMessage(id, { text, mentions: [jid] });
        }

        logger.info({ jid, group: id }, 'Welcome message sent');
      } catch (err) {
        logger.debug({ err }, 'welcome message error');
      }
    }
  }

  if (action === 'remove') {
    for (const jid of participants) {
      const phoneNumber = jid.replace('@s.whatsapp.net', '');
      try {
        await sock.sendMessage(id, {
          text: `👋 @${phoneNumber} has left the group. Goodbye!`,
          mentions: [jid],
        });
      } catch (_) {}
    }
  }
}
