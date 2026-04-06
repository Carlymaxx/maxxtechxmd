# MAXX-XMD WhatsApp Bot

> Powered by **MAXX Tech** ⚡

A feature-rich WhatsApp Multi-Device bot built with [Baileys](https://github.com/WhiskeySockets/Baileys).

## Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd)

## Features

- 🤖 Multi-device WhatsApp support
- 🔄 Auto React / Auto Read / Auto Typing
- 📊 Auto View & Like Status
- 📵 Anti-Call protection
- 🛡️ Anti-Spam for groups
- 👋 Welcome & Goodbye messages
- 📋 Full group management (tag all, kick, mute, promote, etc.)
- 📊 Group status management (`groupstatus`)
- 🎛️ `bot` and `pair` commands (same command, two names)
- 📋 Rich menu with images

## Commands

| Command | Description |
|---|---|
| `.menu` | Show full command menu with image |
| `.bot` / `.pair` | Show bot info (both do the same thing) |
| `.groupstatus open/close/info` | Manage group send permissions |
| `.tagall` | Tag all group members |
| `.kick @user` | Remove a member |
| `.mute` / `.unmute` | Lock/unlock group |
| `.ginfo` | Group information |
| `.link` | Get group invite link |
| `.setautoreact on/off` | Toggle auto-react |
| `.setautoread on/off` | Toggle auto-read |
| `.restart` | Restart bot (owner only) |
| `.broadcast <msg>` | Broadcast to all groups (owner only) |

## Configuration

Set these environment variables on Heroku:

| Variable | Description |
|---|---|
| `BOT_NAME` | Bot display name |
| `PREFIX` | Command prefix (default: `.`) |
| `OWNER_NUMBER` | Your phone number (e.g. `254712345678`) |
| `SESSION_ID` | WhatsApp session ID |
| `WORK_MODE` | `public` / `private` / `group` |
| `AUTO_READ` | Auto-read messages (`true`/`false`) |
| `AUTO_TYPING` | Show typing indicator |
| `AUTO_REACT` | Auto-react with emojis |
| `AUTO_VIEW_STATUS` | Auto-view statuses |
| `AUTO_LIKE_STATUS` | Auto-like statuses with ❤️ |
| `ANTICALL` | Block incoming calls |
| `ANTI_SPAM` | Anti-spam for groups |
| `WELCOME_MSG` | Welcome message (use `@user` as placeholder) |
| `HEROKU_API_KEY` | For self-restart feature |
| `HEROKU_APP_NAME` | This app's Heroku name |

## Credits

Built by **MAXX Tech** — [deploy.maxxtech.co.ke](https://deploy.maxxtech.co.ke)
