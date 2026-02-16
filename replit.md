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

## Key Files
- `server.js` — Main server (Express + Next.js + Bot startup + Multi-session API + Pairing API)
- `index.js` — WhatsApp bot multi-session logic (startBotSession, startPairingSession, activeSessions)
- `config.env` — Bot configuration (prefix, owner, features)
- `handlers/messagehandler.js` — Command router: loads commands, handles aliases, passes (sock, msg, args, from, settings)
- `commands/` — Bot command modules (each exports {name, alias?, description, execute})
- `next.config.ts` — Next.js configuration (allowedDevOrigins for Replit proxy)
- `src/app/page.tsx` — Main dashboard page (client component with tabs)

## Command Architecture
- Commands are loaded dynamically from `commands/` directory
- Each command exports: `{ name, alias?, description, execute: async (sock, msg, args, from, settings) => {} }`
- Prefix: "." (configurable via config.env PREFIX)
- Bot processes ALL messages including fromMe (since bot runs as owner's linked device)
- Status broadcasts and history sync messages are filtered out

## Available Commands (26 total)
### Utilities: menu, ping, alive, botinfo, owner, repo, runtime
### Fun: joke, quote, 8ball, dice, flip, truth, dare, compliment
### Tools: calc, tts, weather, sticker, toimg
### Group: tagall, groupinfo, kick, promote, demote, mute, unmute, antilink

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
- 2026-02-16: Added 19 new commands (alive, owner, repo, runtime, joke, quote, 8ball, dice, flip, truth, dare, compliment, calc, tts, weather, tagall, groupinfo, kick, promote, demote, mute, unmute)
- 2026-02-16: Fixed command handler — passes correct params (sock, msg, args, from, settings), supports aliases, image/video captions
- 2026-02-16: Fixed fromMe filter — bot now processes owner commands (since bot IS the owner's linked device)
- 2026-02-16: Added type:'notify' filter to only process real-time messages, skip history sync
- 2026-02-16: Owner always gets notified on device pairing (removed !== number check)
- 2026-02-16: Implemented WhatsApp pairing code flow with WhatsApp-style popup modal
- 2026-02-16: Redesigned dashboard with modern dark theme, multi-session management, tabbed UI
