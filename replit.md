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
- `next.config.ts` — Next.js configuration (allowedDevOrigins for Replit proxy)
- `src/app/page.tsx` — Main dashboard page (client component with tabs)
- `src/app/layout.tsx` — Root layout with dark theme
- `src/app/globals.css` — Global styles and Tailwind theme
- `commands/` — Bot command modules
- `handlers/` — Message/command handler logic

## Pairing Flow
1. Main bot starts with QR code (owner scans to connect)
2. Users visit "Pair Device" tab, enter their WhatsApp number
3. Server generates a WhatsApp pairing code via `requestPairingCode()`
4. User enters the code in WhatsApp > Linked Devices > Link with phone number
5. On successful link, the session ID is automatically sent to the user's WhatsApp via the main bot

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
- 2026-02-16: Implemented WhatsApp pairing code flow (requestPairingCode) — users enter number, get code, link device, session ID sent to their WhatsApp
- 2026-02-16: Added startPairingSession to index.js with printQRInTerminal:false
- 2026-02-16: Redesigned dashboard with modern dark theme, multi-session management, tabbed UI
- 2026-02-16: Added stoppingSessions tracking to prevent auto-reconnect loops
- 2026-02-16: Downgraded Express to v4 for Next.js compatibility
- 2026-02-16: Initial Replit setup — port set to 5000, Next.js configured for proxy/iframe access
