const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'settings.json');

const DEFAULTS = {
  prefix: process.env.PREFIX || ".",
  botName: "MAXX-XMD",
  ownerName: process.env.OWNER_NAME || "Carly Maxx",
  ownerNumber: process.env.OWNER_NUMBER || "254725979273",
  author: process.env.OWNER_NAME || "Carly Maxx",
  packname: process.env.BOT_NAME || "MAXX-XMD",
  timezone: "Africa/Nairobi",
  botpic: "",
  mode: (process.env.PUBLIC_MODE || "yes").toLowerCase() === "yes" ? "public" : "private",
  greet: false,
  welcomeMessage: true,
  goodbyeMessage: true,
  anticall: true,
  chatbot: false,
  autoread: false,
  autoviewstatus: true,
  autolikestatus: true,
  autolikestatus_emoji: "🔥",
  statusReactEmojis: "😂,😎,😍,😆,😭,😡,🥳,🤩,😇,💀",
  antilink: false,
  blockedNumbers: []
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      const merged = { ...DEFAULTS, ...data };
      merged.botName = "MAXX-XMD";
      return merged;
    }
  } catch (err) {
    console.error('Error loading settings:', err.message);
  }
  return { ...DEFAULTS };
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving settings:', err.message);
    return false;
  }
}

function getSetting(key) {
  const settings = loadSettings();
  return settings[key];
}

const LOCKED_KEYS = ['botName'];

function setSetting(key, value) {
  if (LOCKED_KEYS.includes(key)) return false;
  const settings = loadSettings();
  settings[key] = value;
  return saveSettings(settings);
}

function toggleSetting(key) {
  const settings = loadSettings();
  if (typeof settings[key] === 'boolean') {
    settings[key] = !settings[key];
    saveSettings(settings);
    return settings[key];
  }
  return null;
}

function getAllSettings() {
  return loadSettings();
}

function isOwner(jid, settings) {
  if (!settings) settings = loadSettings();
  const senderNum = jid.split('@')[0].split(':')[0];
  return senderNum === settings.ownerNumber;
}

module.exports = { loadSettings, saveSettings, getSetting, setSetting, toggleSetting, getAllSettings, isOwner, DEFAULTS };
