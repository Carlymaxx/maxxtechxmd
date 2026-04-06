// Configuration from environment variables
export const config = {
  // Bot identity
  BOT_NAME: process.env.BOT_NAME || 'MAXX-XMD',
  OWNER_NUMBER: (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, ''),
  PREFIX: process.env.PREFIX || '.',

  // Work mode: public | private | group
  WORK_MODE: (process.env.WORK_MODE || 'public').toLowerCase(),

  // Auto features
  AUTO_READ: (process.env.AUTO_READ || 'false').toLowerCase() === 'true',
  AUTO_TYPING: (process.env.AUTO_TYPING || 'false').toLowerCase() === 'true',
  AUTO_LIKE_STATUS: (process.env.AUTO_LIKE_STATUS || 'false').toLowerCase() === 'true',
  AUTO_VIEW_STATUS: (process.env.AUTO_VIEW_STATUS || 'false').toLowerCase() === 'true',
  AUTO_REACT: (process.env.AUTO_REACT || 'false').toLowerCase() === 'true',

  // Protection features
  ANTICALL: (process.env.ANTICALL || 'false').toLowerCase() === 'true',
  ANTI_SPAM: (process.env.ANTI_SPAM || 'false').toLowerCase() === 'true',

  // Messages
  WELCOME_MSG: process.env.WELCOME_MSG || 'Welcome to the group, @user! 🎉',

  // Heroku self-management
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || '',
  HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || '',

  // Session
  SESSION_ID: process.env.SESSION_ID || '',

  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
};

// Bot owner JID
export function ownerJid() {
  const num = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
  return num ? `${num}@s.whatsapp.net` : null;
}
