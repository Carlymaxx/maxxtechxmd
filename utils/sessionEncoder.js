const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SESSIONS_DIR = path.join(__dirname, '..', 'auth_info_baileys');

function encodeSessionId(sessionFolder) {
  try {
    const credsPath = path.join(sessionFolder, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;

    const creds = fs.readFileSync(credsPath, 'utf8');
    const compressed = zlib.gzipSync(Buffer.from(creds, 'utf8'));
    const encoded = compressed.toString('base64');
    return 'MAXX-XMD~' + encoded;
  } catch (err) {
    console.error('Session encode error:', err);
    return null;
  }
}

function decodeSessionId(sessionId) {
  try {
    if (!sessionId.startsWith('MAXX-XMD~')) return null;
    const encoded = sessionId.replace('MAXX-XMD~', '');
    const compressed = Buffer.from(encoded, 'base64');
    const creds = zlib.gunzipSync(compressed).toString('utf8');
    return JSON.parse(creds);
  } catch (err) {
    console.error('Session decode error:', err);
    return null;
  }
}

function getSessionIdForFolder(sessionId) {
  const sessionFolder = path.join(SESSIONS_DIR, sessionId);
  return encodeSessionId(sessionFolder);
}

module.exports = { encodeSessionId, decodeSessionId, getSessionIdForFolder };
