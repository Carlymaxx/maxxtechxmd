import { config, ownerJid } from '../lib/config.js';
import os from 'os';

// Banner image
const BOT_IMAGE = 'https://files.catbox.moe/hmq9os.jpg';

function uptime() {
  const s = Math.floor(process.uptime());
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

const BOT_INFO_TEXT = () => `
╔══════════════════════╗
║    *${config.BOT_NAME}* 🤖       ║
╚══════════════════════╝

⚙️ *Bot Information*
├ *Name:* ${config.BOT_NAME}
├ *Prefix:* \`${config.PREFIX}\`
├ *Mode:* ${config.WORK_MODE.toUpperCase()}
├ *Uptime:* ${uptime()}
└ *Platform:* ${os.platform()} ${os.arch()}

📊 *System*
├ *Node.js:* ${process.version}
├ *Memory:* ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB
└ *CPU:* ${os.cpus()[0]?.model?.split(' ').slice(-2).join(' ') || 'N/A'}

🔧 *Auto Features*
├ Auto Read: ${config.AUTO_READ ? '✅' : '❌'}
├ Auto Typing: ${config.AUTO_TYPING ? '✅' : '❌'}
├ Auto React: ${config.AUTO_REACT ? '✅' : '❌'}
├ Auto View Status: ${config.AUTO_VIEW_STATUS ? '✅' : '❌'}
├ Auto Like Status: ${config.AUTO_LIKE_STATUS ? '✅' : '❌'}
└ Anti Call: ${config.ANTICALL ? '✅' : '❌'}

━━━━━━━━━━━━━━━━━━━━━━
> _Powered by *MAXX-XMD* ⚡_
`.trim();

export const botCommand = {
  // 'pair' is an alias for 'bot' — they do the exact same thing
  names: ['bot', 'pair', 'info', 'status'],
  description: 'Show bot info and status',
  async execute(sock, msg, _args) {
    const jid = msg.key.remoteJid;
    try {
      await sock.sendMessage(jid, {
        image: { url: BOT_IMAGE },
        caption: BOT_INFO_TEXT(),
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(jid, { text: BOT_INFO_TEXT() }, { quoted: msg });
    }
  },
};
