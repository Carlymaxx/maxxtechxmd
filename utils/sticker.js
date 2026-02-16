const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const STICKER_PATH = path.join(__dirname, '..', 'media', 'bot-sticker.webp');
let cachedSticker = null;

async function generateBotSticker() {
  if (cachedSticker) return cachedSticker;

  if (fs.existsSync(STICKER_PATH)) {
    cachedSticker = fs.readFileSync(STICKER_PATH);
    return cachedSticker;
  }

  const sourcePath = path.join(__dirname, '..', 'media', 'maxx-xmd.png.jpg');
  if (!fs.existsSync(sourcePath)) {
    return null;
  }

  try {
    const buffer = await sharp(sourcePath)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toBuffer();

    fs.writeFileSync(STICKER_PATH, buffer);
    cachedSticker = buffer;
    return buffer;
  } catch (err) {
    console.error('Sticker generation error:', err);
    return null;
  }
}

async function sendBotSticker(sock, jid) {
  try {
    const sticker = await generateBotSticker();
    if (sticker) {
      await sock.sendMessage(jid, {
        sticker: sticker,
        isAnimated: false
      });
    }
  } catch (err) {
    console.error('Send sticker error:', err);
  }
}

module.exports = { generateBotSticker, sendBotSticker };
