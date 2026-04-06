#!/usr/bin/env node
// Patches @whiskeysockets/baileys messages-recv.js to preserve newsletter
// server_id in the WAMessage category field. Runs as postinstall script.
// This is needed because Baileys sets key.id = message_id (UUID) and discards
// server_id (numeric), but newsletterReactMessage needs the numeric server_id.

const fs = require('fs');
const path = require('path');

const candidates = [
  path.resolve(__dirname, '../node_modules/@whiskeysockets/baileys/lib/Socket/messages-recv.js'),
  path.resolve(process.cwd(), 'node_modules/@whiskeysockets/baileys/lib/Socket/messages-recv.js'),
];

let targetPath = null;
for (const c of candidates) {
  if (fs.existsSync(c)) { targetPath = c; break; }
}

if (!targetPath) {
  console.warn('[baileys-patch] Could not find messages-recv.js — skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(targetPath, 'utf8');

const MARKER = '// MAXX-XMD: server_id patched';
if (content.includes(MARKER)) {
  console.log('[baileys-patch] Already patched — skipping');
  process.exit(0);
}

// Patch: preserve server_id from newsletter messages
const SEARCH = `key.id = msg.key.id;`;
const REPLACE = `key.id = msg.key.id;
  ${MARKER}
  if (msg.key.serverMessageId != null) {
    key.id = String(msg.key.serverMessageId);
  }`;

if (content.includes(SEARCH)) {
  content = content.replace(SEARCH, REPLACE);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('[baileys-patch] messages-recv.js patched successfully ✓');
} else {
  console.warn('[baileys-patch] Patch target not found — Baileys version may have changed');
}
