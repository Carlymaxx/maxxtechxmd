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

// Find the line that creates the fullMessage in handleNewsletterNotification
// Original (roughly):
//   }).toJSON();
//   await upsertMessage(fullMessage, 'append');
// We inject after the .toJSON() line to add server_id to category.
const TARGET_RE = /(\.toJSON\(\);)\s*(await upsertMessage\(fullMessage, 'append'\);)/;
if (!TARGET_RE.test(content)) {
  // Try a slightly different whitespace pattern
  const alt = content.indexOf("await upsertMessage(fullMessage, 'append')");
  if (alt === -1) {
    console.warn('[baileys-patch] Could not locate injection point in messages-recv.js');
    process.exit(0);
  }
}

const patched = content.replace(
  TARGET_RE,
  `$1\n                    ${MARKER}\n                    if (child.attrs.server_id) fullMessage.category = child.attrs.server_id;\n                    $2`
);

if (patched === content) {
  console.warn('[baileys-patch] Regex did not match — patch NOT applied');
  process.exit(0);
}

fs.writeFileSync(targetPath, patched, 'utf8');
console.log('[baileys-patch] ✅ Patched messages-recv.js — newsletter server_id now in WAMessage.category');
