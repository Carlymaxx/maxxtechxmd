import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import express from 'express';
import pino from 'pino';
import { config } from './lib/config.js';
import { getAuthState } from './lib/session.js';
import logger from './lib/logger.js';
import { getCommand } from './commands/index.js';
import { handleAutoFeatures, handleStatusUpdate } from './handlers/autoFeatures.js';
import { handleCall } from './handlers/antiCall.js';
import { handleAntiSpam } from './handlers/antiSpam.js';
import { handleGroupParticipants } from './handlers/welcome.js';

// ── Express server (required for Heroku web dyno) ──────────────────────────
const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'running',
    bot: config.BOT_NAME,
    uptime: Math.floor(process.uptime()),
    mode: config.WORK_MODE,
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, `${config.BOT_NAME} web server started`);
});

// ── Bot connection ─────────────────────────────────────────────────────────
async function connectBot() {
  const { state, saveCreds } = await getAuthState();
  const { version } = await fetchLatestBaileysVersion();
  logger.info({ version }, 'Using Baileys version');

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true,
    browser: [config.BOT_NAME, 'Chrome', '120.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  });

  // ── Connection updates ───────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('QR code generated — scan with WhatsApp');
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode }, 'Connection closed');

      if (shouldReconnect) {
        logger.info('Reconnecting in 5s...');
        setTimeout(connectBot, 5000);
      } else {
        logger.error('Logged out — remove session and restart');
        process.exit(1);
      }
    }

    if (connection === 'open') {
      logger.info(`${config.BOT_NAME} connected to WhatsApp ✅`);

      const ownerNum = config.OWNER_NUMBER;
      if (ownerNum) {
        try {
          await sock.sendMessage(`${ownerNum}@s.whatsapp.net`, {
            text: `✅ *${config.BOT_NAME}* is now online!\n\nMode: ${config.WORK_MODE.toUpperCase()}\nPrefix: \`${config.PREFIX}\`\n\nType \`${config.PREFIX}menu\` to get started.`,
          });
        } catch (_) {}
      }
    }
  });

  // ── Credentials update ───────────────────────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Incoming messages ────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      const { key } = msg;
      const jid = key.remoteJid;

      // Skip status broadcasts (handled separately)
      if (jid === 'status@broadcast') {
        await handleStatusUpdate(sock, msg).catch(() => {});
        continue;
      }

      // Auto features (read, typing, react)
      await handleAutoFeatures(sock, msg).catch(() => {});

      // Anti-spam (groups only)
      const isSpam = await handleAntiSpam(sock, msg).catch(() => false);
      if (isSpam) continue;

      // Skip own messages
      if (key.fromMe) continue;

      // Work mode filtering
      const isGroup = jid?.endsWith('@g.us');
      const isOwnerMsg = (key.participant || jid) === `${config.OWNER_NUMBER}@s.whatsapp.net`;

      if (config.WORK_MODE === 'private' && !isOwnerMsg) continue;
      if (config.WORK_MODE === 'group' && !isGroup && !isOwnerMsg) continue;

      // Extract message text
      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      if (!body.startsWith(config.PREFIX)) continue;

      const [rawCmd, ...args] = body.slice(config.PREFIX.length).trim().split(/\s+/);
      const cmdName = rawCmd.toLowerCase();
      const cmd = getCommand(cmdName);

      if (!cmd) continue;

      logger.info({ from: key.participant || jid, cmd: cmdName }, 'Command received');

      try {
        await cmd.execute(sock, msg, args);
      } catch (err) {
        logger.error({ err, cmd: cmdName }, 'Command error');
        try {
          await sock.sendMessage(jid, {
            text: `❌ Error running \`${config.PREFIX}${cmdName}\`: ${err.message}`,
          }, { quoted: msg });
        } catch (_) {}
      }
    }
  });

  // ── Call events ──────────────────────────────────────────────────────────
  sock.ev.on('call', async (calls) => {
    await handleCall(sock, calls).catch(() => {});
  });

  // ── Group participant updates ────────────────────────────────────────────
  sock.ev.on('group-participants.update', async (update) => {
    await handleGroupParticipants(sock, update).catch(() => {});
  });

  return sock;
}

// ── Entry point ────────────────────────────────────────────────────────────
connectBot().catch((err) => {
  logger.error({ err }, 'Fatal error starting bot');
  process.exit(1);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
});

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
});
