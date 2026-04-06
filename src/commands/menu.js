import { config } from '../lib/config.js';

// Menu banner images (cycle through them)
const MENU_IMAGES = [
  'https://files.catbox.moe/hmq9os.jpg',
  'https://files.catbox.moe/3we2za.jpg',
  'https://files.catbox.moe/3obbid.jpg',
  'https://files.catbox.moe/f86ogz.jpg',
  'https://files.catbox.moe/fmual4.jpg',
];
let imgIndex = 0;

function nextImage() {
  const url = MENU_IMAGES[imgIndex % MENU_IMAGES.length];
  imgIndex++;
  return url;
}

const MENU_TEXT = (p) => `
╔══════════════════════╗
║   *${config.BOT_NAME}* 🤖        ║
╚══════════════════════╝

*PREFIX:* \`${p}\`
*MODE:* ${config.WORK_MODE.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━

🤖 *BOT INFO*
├ ${p}bot — Bot info & stats
├ ${p}pair — Pairing info (same as bot)
└ ${p}menu — Show this menu

👥 *GROUP*
├ ${p}groupstatus — Manage group status
├ ${p}tagall — Tag all members
├ ${p}kick @user — Remove member
├ ${p}add number — Add member
├ ${p}promote @user — Make admin
├ ${p}demote @user — Remove admin
├ ${p}mute — Mute group
├ ${p}unmute — Unmute group
├ ${p}ginfo — Group info
└ ${p}link — Get invite link

⚙️ *AUTO FEATURES*
├ ${p}setautoreact on/off
├ ${p}setautoread on/off
├ ${p}setautotyping on/off
├ ${p}setautoviewstatus on/off
├ ${p}setautolikestatus on/off
└ ${p}setanticall on/off

🛡️ *PROTECTION*
├ ${p}antispam on/off
├ ${p}antilink on/off
└ ${p}anticall on/off

🎵 *MEDIA*
├ ${p}play <song> — Play music
├ ${p}yt <link> — YouTube audio
└ ${p}ytv <link> — YouTube video

👑 *OWNER ONLY*
├ ${p}restart — Restart bot
├ ${p}setprefix — Change prefix
├ ${p}broadcast — Broadcast msg
└ ${p}setname — Set bot name

━━━━━━━━━━━━━━━━━━━━━━
> Powered by *${config.BOT_NAME}* ⚡
`.trim();

export const menuCommand = {
  names: ['menu', 'help'],
  description: 'Show full command menu',
  async execute(sock, msg, _args) {
    const { key } = msg;
    const jid = key.remoteJid;
    const imageUrl = nextImage();
    const p = config.PREFIX;

    try {
      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: MENU_TEXT(p),
      }, { quoted: msg });
    } catch {
      // Fallback to text-only
      await sock.sendMessage(jid, { text: MENU_TEXT(p) }, { quoted: msg });
    }
  },
};
