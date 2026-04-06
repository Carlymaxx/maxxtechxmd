import { useMultiFileAuthState, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import logger from './logger.js';

const SESSION_DIR = process.env.SESSION_DIR || path.resolve('session');

/**
 * Decode SESSION_ID and restore auth credentials if present.
 * SESSION_ID format: base64-encoded JSON of the auth state credentials.
 */
export async function getAuthState() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  // If SESSION_ID is provided and session directory is fresh, seed it
  if (config.SESSION_ID && !fs.existsSync(path.join(SESSION_DIR, 'creds.json'))) {
    try {
      let raw = config.SESSION_ID;
      // Handle MAXX-XMD;BASE64 format
      if (raw.includes(';')) raw = raw.split(';').slice(1).join(';');
      const creds = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
      fs.writeFileSync(path.join(SESSION_DIR, 'creds.json'), JSON.stringify(creds, null, 2));
      logger.info('Session restored from SESSION_ID');
    } catch (err) {
      logger.warn({ err }, 'Could not decode SESSION_ID — will use QR/pairing code');
    }
  }

  return { state, saveCreds };
}
