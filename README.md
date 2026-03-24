# MAXX-XMD WhatsApp Bot

> A powerful WhatsApp bot with 150+ commands. Get your SESSION_ID from the generator and deploy in one click.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Carlymaxx/maxxtechxmd)

---

## Quick Deploy Guide

### Step 1 — Get Your SESSION_ID
Visit **[maxxtechxmd.replit.app/pair]([https://maxxtechxmd.replit.app/pair](https://asset-manager-pussyinnit.replit.app))**, enter your WhatsApp number and follow the pairing code prompt. Your `SESSION_ID` (starts with `MAXX-XMD~`) will be sent to your WhatsApp.

### Step 2 — Deploy Your Bot

| Platform | One-Click Deploy | Cost |
|----------|-----------------|------|
| **Heroku** | [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd) | ~$7/mo Basic dyno |
| **Render** | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Carlymaxx/maxxtechxmd) | Free tier available |
| **Railway** | [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/maxxtechxmd) | ~$5/mo |
| **Koyeb** | [Deploy on Koyeb](https://app.koyeb.com/deploy?type=git&repository=github.com/Carlymaxx/maxxtechxmd) | Free tier available |

### Step 3 — Set Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_ID` | **Required.** From the pairing site | `MAXX-XMD~H4s...` |
| `OWNER_NUMBER` | Your controller number (must differ from paired number) | `254700000000` |
| `BOT_NAME` | Bot display name | `MAXX-XMD` |
| `OWNER_NAME` | Your display name | `MAXX` |
| `PREFIX` | Command prefix | `.` |
| `MODE` | `public` / `private` / `inbox` | `public` |
| `ALWAYS_ONLINE` | Show as online 24/7 | `true` |
| `ANTI_CALL` | Auto-reject calls | `true` |
| `GEMINI_API_KEY` | Optional — enables AI commands (.gpt, .gemini, etc.) | — |

---

## Commands (150+)

### General
`.ping` `.alive` `.menu` `.help` `.uptime` `.owner` `.info` `.runtime` `.speed` `.version`

### Fun & Entertainment
`.joke` `.fact` `.quote` `.meme` `.roast` `.pickup` `.compliment` `.riddle` `.wouldyou` `.truth` `.dare`

### Games
`.rps` (rock-paper-scissors) `.trivia` `.dice` `.flip` `.8ball` `.guess` `.hangman` `.wordscramble`

### Search & Info
`.weather` `.define` `.wiki` `.translate` `.lyrics` `.news` `.movie` `.bible` `.quran`

### Sports
`.livescores` `.standings` `.player` `.team` `.nextmatch` `.lastmatch`

### Downloads
`.ytmp3` `.ytmp4` `.tiktok` `.instagram` `.shorten`

### AI (requires GEMINI_API_KEY)
`.gpt` `.gemini` `.imagine` `.sticker` `.chatbot on/off`

### Group Management
`.kick` `.add` `.promote` `.demote` `.mute` `.unmute` `.link` `.revoke` `.tagall` `.hidetag` `.welcome on/off` `.antilink on/off`

### Settings (Owner/Sudo)
`.mode` `.setprefix` `.setname` `.autoreact on/off` `.autoread on/off` `.anticall on/off` `.alwaysonline on/off`

---

## Self-Fork & Customize

```bash
git clone https://github.com/Carlymaxx/maxxtechxmd.git
cd maxxtechxmd
npm install
# Set your SESSION_ID and other vars in .env
npm start
```

---

## Tech Stack
- **Runtime:** Node.js 20 + TypeScript
- **WhatsApp:** @whiskeysockets/baileys
- **Build:** esbuild (single bundled output)
- **Server:** Express 5
- **Package Manager:** npm workspaces

---

> Made with love by **Carlymaxx** | Session generator: [maxxtechxmd.replit.app](https://maxxtechxmd.replit.app/pair)
