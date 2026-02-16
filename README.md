<p align="center">
  <img src="https://i.postimg.cc/YSXgK0Wb/Whats-App-Image-2025-11-22-at-08-20-26.jpg" alt="MAXX-XMD" width="200"/>
</p>

<h1 align="center">MAXX-XMD WhatsApp Bot</h1>

<p align="center">
  <b>A powerful multi-user WhatsApp bot with 50+ commands, AI chatbot, auto-features, and web dashboard</b>
</p>

<p align="center">
  <a href="https://github.com/Carlymaxx/maxxtechxmd/stargazers"><img src="https://img.shields.io/github/stars/Carlymaxx/maxxtechxmd?style=social" alt="Stars"/></a>
  <a href="https://github.com/Carlymaxx/maxxtechxmd/fork"><img src="https://img.shields.io/github/forks/Carlymaxx/maxxtechxmd?style=social" alt="Forks"/></a>
</p>

---

## Get Your Session ID

1. Visit the [MAXX-XMD Dashboard](https://maxxtechxmd.replit.app)
2. Go to **Pair Device** tab
3. Enter your WhatsApp number (with country code)
4. Enter the pairing code in WhatsApp > Linked Devices > Link with phone number
5. Your **Session ID** will be sent to your WhatsApp automatically!

---

## Deploy Your Bot

### Deploy on Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd)

### Deploy on Render

1. Fork this repo
2. Go to [render.com](https://render.com)
3. Create a new **Web Service**
4. Connect your forked repo
5. Set environment variables (see below)
6. Deploy!

### Deploy on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Deploy on Koyeb

1. Fork this repo
2. Go to [koyeb.com](https://koyeb.com)
3. Create new app from GitHub
4. Set environment variables
5. Deploy!

### Deploy on Replit

1. Fork this repo
2. Import to [replit.com](https://replit.com)
3. Set environment variables in Secrets tab
4. Click Run!

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SESSION_ID` | Your session ID from pairing | Yes |
| `OWNER_NUMBER` | Your WhatsApp number (with country code) | Yes |
| `BOT_NAME` | Bot display name | No (default: MAXX-XMD) |
| `PREFIX` | Command prefix | No (default: .) |
| `OWNER_NAME` | Owner display name | No |
| `PUBLIC_MODE` | yes/no - allow all users or owner only | No |

---

## Features

- **50+ Commands** across 7 categories
- **Multi-User Pairing** - anyone can get their own bot
- **Session ID System** - deploy on any platform
- **AI Chatbot** - auto-reply in DMs
- **Auto Features** - auto-read, auto-view status, auto-like status, anti-call
- **Group Management** - kick, promote, demote, mute, antilink
- **Welcome/Goodbye** messages for groups
- **Web Dashboard** - manage everything from browser
- **Sticker with every command** response

---

## Commands

### Utilities
| Command | Description |
|---------|-------------|
| `.menu` | Show full command menu |
| `.ping` | Check bot response time |
| `.alive` | Check if bot is running |
| `.botinfo` | Bot information |
| `.owner` | Owner contact |
| `.repo` | Source code link |
| `.runtime` | Uptime and system info |

### Fun
| Command | Description |
|---------|-------------|
| `.joke` | Random joke |
| `.quote` | Inspirational quote |
| `.8ball` | Magic 8-ball |
| `.dice` | Roll a dice |
| `.flip` | Flip a coin |
| `.truth` | Truth question |
| `.dare` | Dare challenge |
| `.compliment` | Get a compliment |

### Tools
| Command | Description |
|---------|-------------|
| `.calc` | Calculator |
| `.tts` | Text to speech |
| `.weather` | Weather info |
| `.sticker` | Create sticker from image |
| `.toimg` | Convert sticker to image |
| `.reshare` | Forward/reshare message |

### Group Admin
| Command | Description |
|---------|-------------|
| `.tagall` | Tag all members |
| `.groupinfo` | Group information |
| `.kick` | Remove member |
| `.promote` | Promote to admin |
| `.demote` | Demote from admin |
| `.mute` | Mute group |
| `.unmute` | Unmute group |
| `.antilink` | Toggle antilink |

### Settings (Owner Only)
| Command | Description |
|---------|-------------|
| `.setvar` | Set any bot variable |
| `.mode` | Switch public/private mode |
| `.setprefix` | Change command prefix |
| `.setbotname` | Change bot name |
| `.setauthor` | Set sticker author |
| `.setpackname` | Set sticker pack name |
| `.settimezone` | Set timezone |
| `.setbotpic` | Set bot picture |

### Automation (Owner Only)
| Command | Description |
|---------|-------------|
| `.anticall` | Toggle auto-reject calls |
| `.chatbot` | Toggle AI chatbot |
| `.autoread` | Toggle auto-read messages |
| `.autoviewstatus` | Toggle auto-view statuses |
| `.autolikestatus` | Toggle auto-react to statuses |
| `.greet` | Toggle welcome/goodbye messages |

### Owner Only
| Command | Description |
|---------|-------------|
| `.block` | Block a user |
| `.unblock` | Unblock a user |
| `.deploy` | Server/deployment info |

---

## Tech Stack

- **Runtime**: Node.js
- **WhatsApp**: @whiskeysockets/baileys
- **Frontend**: Next.js + Tailwind CSS
- **Backend**: Express.js

---

## Support

- **WhatsApp Channel**: [Join Here](https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J)

---

<p align="center">
  <b>Powered by Maxx Tech</b>
</p>
