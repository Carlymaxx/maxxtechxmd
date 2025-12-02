const fs = require('fs');
const path = require('path');
// Removed getConfig dependency (lib/configdb missing)
const settings = require('./setting.js');

if (fs.existsSync(path.resolve('config.env'))) {
  require('dotenv').config({ path: path.resolve('config.env') });
}

function convertToBool(text, trueValue = 'true') {
  return text === trueValue;
}

module.exports = {
  SESSION_ID: settings.SESSION_ID || process.env.SESSION_ID || "",
  PREFIX: settings.PREFIX || ".",
  CHATBOT: process.env.CHATBOT || "on",
  BOT_NAME: process.env.BOT_NAME || "Carly Maxx",
  MODE: process.env.MODE || "private",
  REPO: process.env.REPO || "https://github.com/Carlymaxx/Maxx-tech",
  PAIRING_CODE: process.env.PAIRING_CODE || 'true',
  BAILEYS: process.env.BAILEYS || "@whiskeysockets/baileys",

  // Use international format by default (country code + number). Update via config.env or setting.js if needed.
  OWNER_NUMBER: settings.OWNER_NUMBER || process.env.OWNER_NUMBER || "254725979273",
  OWNER_NAME: process.env.OWNER_NAME || "Carly Maxx",
  DEV: process.env.DEV || "254725979273",
  DEVELOPER_NUMBER: '254725979273@s.whatsapp.net',
  
  MENU_AUDIO_URL: process.env.MENU_AUDIO_URL || 'https://files.catbox.moe/vkvci3.mp3',
  AUDIO_URL: process.env.AUDIO_URL || 'https://files.catbox.moe/vkvci3.mp3',
  AUDIO_URL2: process.env.AUDIO_URL2 || 'https://files.catbox.moe/vkvci3.mp3',
  
  NEWSLETTER_JID: process.env.NEWSLETTER_JID || '120363299029326322@newsletter',

  AUTO_REPLY: process.env.AUTO_REPLY || "false",
  AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
  AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*Just seen ur status 😆 🤖*",
  READ_MESSAGE: process.env.READ_MESSAGE || "false",
  REJECT_MSG: process.env.REJECT_MSG || "*📵 Calls are not allowed on this number unless you have permission. 🚫*",
  ALIVE_IMG: process.env.ALIVE_IMG || "https://url.maxx-xmd.online/Maxx.xm472dqv.jpeg",
  LIVE_MSG: process.env.LIVE_MSG || "> ʙᴏᴛ ɪs sᴘᴀʀᴋɪɴɢ ᴀᴄᴛɪᴠᴇ ᴀɴᴅ ᴀʟɪᴠᴇ\n\n\n> ɢɪᴛʜᴜʙ :* github.com/Carlymaxx/Maxx-tech",

  AUTO_REACT: process.env.AUTO_REACT || "false",
  OWNER_REACT: process.env.OWNER_REACT || "false",
  CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
  CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
  STICKER_NAME: process.env.STICKER_NAME || "MAXX-XMD",
  AUTO_STICKER: process.env.AUTO_STICKER || "false",

  AUTO_RECORDING: process.env.AUTO_RECORDING || "true",
  AUTO_TYPING: process.env.AUTO_TYPING || "true",
  MENTION_REPLY: process.env.MENTION_REPLY || "true",
  MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://url.maxx-xmd.online/Maxx.xm472dqv.jpeg",

  ANTI_DELETE: process.env.ANTI_DELETE || "true",
  ANTI_CALL: process.env.ANTI_CALL || "false",
  ANTI_BAD_WORD: process.env.ANTI_BAD_WORD || "false",
  ANTI_LINK: process.env.ANTI_LINK || "true",
  ANTI_VV: process.env.ANTI_VV || "true",
  DELETE_LINKS: process.env.DELETE_LINKS || "false",
  ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "inbox",
  ANTI_BOT: process.env.ANTI_BOT || "true",
  PM_BLOCKER: process.env.PM_BLOCKER || "true",

  DESCRIPTION: process.env.DESCRIPTION || "*ᴍᴀᴅᴇ ʙʏ Carly Maxx*",
  PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
  AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
  AUTO_BIO: process.env.AUTO_BIO || "false",
  WELCOME: process.env.WELCOME || "false",
  GOODBYE: process.env.GOODBYE || "false",
  ADMIN_ACTION: process.env.ADMIN_ACTION || "false",
  version: process.env.version || "1.5.0",
  // Default to a valid tz database zone
  TIMEZONE: settings.TIMEZONE || process.env.TIMEZONE || "Africa/Nairobi",
};
