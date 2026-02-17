# MAXX-XMD WhatsApp Bot with Next.js Dashboard

## Overview
A WhatsApp bot built with Baileys library, featuring a modern dark-themed Next.js web dashboard for management and control. The server.js file runs both the Express API backend and the Next.js frontend on a single port. Supports multi-session bot management with WhatsApp pairing code linking.

## Project Architecture
- **Runtime**: Node.js 20
- **Frontend**: Next.js (React, TypeScript, Tailwind CSS v4)
- **Backend**: Express.js v4 (embedded in server.js)
- **WhatsApp**: @whiskeysockets/baileys
- **Entry Point**: `server.js` — starts Express + Next.js + WhatsApp bot
- **Port**: 5000
- **GitHub**: https://github.com/Carlymaxx/maxxtechxmd.git

## Key Files
- `server.js` — Main server (Express + Next.js + Bot startup + Multi-session API + Pairing API + auto-restart)
- `index.js` — WhatsApp bot multi-session logic with auto-features (anticall, autoread, autoviewstatus, autolikestatus, welcome/goodbye)
- `config.env` — Bot configuration (prefix, owner, features)
- `settings.json` — Runtime persistent settings (generated at first run, gitignored)
- `session_store.json` — Session metadata store (phone, created date, auto-restart flag, gitignored)
- `utils/settings.js` — Settings manager (load/save/toggle JSON-backed settings)
- `utils/sessionStore.js` — Session metadata manager (tracks phone numbers, creation dates, auto-restart flags)
- `src/app/pair/page.tsx` — Standalone pairing page (separate URL at /pair)
- `utils/grouphelper.js` — Group admin permission checks (getSenderJid, isGroupAdmin, isBotAdmin)
- `handlers/messagehandler.js` — Command router with mode support (public/private), chatbot, aliases
- `commands/` — 50 bot command modules (each exports {name, alias?, description, execute})
- `next.config.ts` — Next.js configuration (allowedDevOrigins for Replit proxy)
- `src/app/page.tsx` — Main dashboard page (client component with tabs)

## Command Architecture
- Commands are loaded dynamically from `commands/` directory
- Each command exports: `{ name, alias?, description, execute: async (sock, msg, args, from, settings) => {} }`
- Prefix: "." (configurable via settings)
- Bot processes ALL messages including fromMe (since bot runs as owner's linked device)
- Status broadcasts and history sync messages are filtered out
- Private mode: only owner can use commands; Public mode: everyone can use commands
- Chatbot: auto-reply in DMs using SimSimi API when enabled

## Available Commands (61 files)
### Utilities: menu, ping, alive, botinfo, owner, repo, runtime
### Fun: joke, quote, 8ball, dice, flip, truth, dare, compliment
### Tools: calc, tts, weather, sticker, toimg, reshare, vv, song, video, clearchat
### Group: tagall, groupinfo, kick, promote, demote, mute, unmute, antilink, listonline
### Settings: setvar, mode, setprefix, setbotname, setauthor, setpackname, settimezone, setbotpic, bio
### Automation: anticall, chatbot, autoread, autoviewstatus, autolikestatus, greet, alwaysonline, autotyping, autobio, autoreaction
### Owner: block, unblock, deploy, broadcast

## Auto-Features (index.js)
- **Anticall**: Auto-reject incoming calls and send message
- **Autoread**: Auto-mark messages as read
- **Autoviewstatus**: Auto-view WhatsApp statuses
- **Autolikestatus**: Auto-react to statuses with configurable emoji
- **AlwaysOnline**: Keep bot presence as online 24/7
- **AutoTyping**: Show typing indicator before replies
- **AutoBio**: Auto-update WhatsApp bio with uptime
- **AutoReaction**: Auto-react to incoming messages with random emojis
- **Welcome/Goodbye**: Send greeting messages when users join/leave groups
- **Chatbot**: AI auto-reply in DMs (SimSimi API)
- **Mode**: Public (all users can command) or Private (owner only)

## Settings System
- Persistent JSON storage at `settings.json` (gitignored)
- Runtime-modifiable via `.setvar` command
- Toggle commands for each feature (anticall, chatbot, autoread, alwaysonline, autotyping, autobio, autoreaction, etc.)
- Public access for automation toggles, owner-only for sensitive settings
- Falls back to config.env defaults if settings.json doesn't exist

## Pairing Flow
1. Main bot starts with QR code (owner scans to connect)
2. Users visit "Pair Device" tab, enter their WhatsApp number
3. Server generates a WhatsApp pairing code via `requestPairingCode()`
4. User enters the code in WhatsApp > Linked Devices > Link with phone number
5. On successful link, session ID sent to user AND owner via main bot

## API Endpoints
- `GET /api/status` — Main bot connection status
- `GET /api/info` — Bot info (name, owner, prefix, uptime)
- `GET /api/sessions` — List all sessions
- `POST /api/sessions` — Create new session (QR-based)
- `POST /api/sessions/:id/start` — Start a session
- `POST /api/sessions/:id/stop` — Stop a session
- `DELETE /api/sessions/:id` — Delete a session
- `POST /api/sessions/:id/send` — Send message via session
- `POST /api/start-bot` — Start main bot
- `POST /api/send` — Send message via main bot
- `POST /api/pair` — Generate WhatsApp pairing code for user linking
- `GET /api/pair/status/:sessionId` — Check pairing session connection status

## Recent Changes
- 2026-02-16: Added persistent settings system (utils/settings.js + settings.json)
- 2026-02-16: Added auto-features in index.js: anticall, autoread, autoviewstatus, autolikestatus, welcome/goodbye events
- 2026-02-16: Added 17 new settings/automation/owner commands (setvar, mode, setprefix, setbotname, setauthor, setpackname, settimezone, setbotpic, anticall, chatbot, autoread, autoviewstatus, autolikestatus, greet, block, deploy, reshare)
- 2026-02-16: Updated message handler with public/private mode, chatbot auto-reply, dynamic settings
- 2026-02-16: Pushed project to GitHub: https://github.com/Carlymaxx/maxxtechxmd
- 2026-02-16: Added 19 new commands (alive, owner, repo, runtime, joke, quote, 8ball, dice, flip, truth, dare, compliment, calc, tts, weather, tagall, groupinfo, kick, promote, demote, mute, unmute)
- 2026-02-16: Fixed command handler — passes correct params (sock, msg, args, from, settings), supports aliases, image/video captions
- 2026-02-16: Fixed fromMe filter — bot now processes owner commands
- 2026-02-16: Implemented WhatsApp pairing code flow with WhatsApp-style popup modal
- 2026-02-16: Redesigned dashboard with modern dark theme, multi-session management, tabbed UI
- 2026-02-16: Added SESSION_ID restore on startup — decodes MAXX-XMD~base64(gzip(creds.json)) into auth folder for deployment
- 2026-02-16: Added bot sticker system — sends branded sticker with every command response
- 2026-02-16: Added deployable session ID encoding — paired users receive base64-compressed session IDs on WhatsApp
- 2026-02-16: Updated dashboard with deployment instructions, GitHub fork link, "Get Your Own Bot" section
- 2026-02-16: Pushed all updates to GitHub including session restore, sticker system, 50+ commands
- 2026-02-17: Added standalone /pair page — separate URL for pairing only (no dashboard)
- 2026-02-17: Fixed WhatsApp conflict crash loop — bot stops gracefully when another instance takes over
- 2026-02-17: Added session metadata store (utils/sessionStore.js + session_store.json) — tracks phone numbers, creation dates, auto-restart flags
- 2026-02-17: Added auto-restart for saved sessions on server startup — sessions with autoRestart flag reconnect automatically
- 2026-02-17: Enhanced Sessions tab — shows session type (MAIN/PAIRED/MANUAL), phone number, dates, auto-restart badge
- 2026-02-17: Updated README with full MAXX-XMD branding and corrected all repo links
