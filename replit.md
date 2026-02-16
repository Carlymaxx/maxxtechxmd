# MAXX-XMD WhatsApp Bot with Next.js Dashboard

## Overview
A WhatsApp bot built with Baileys library, featuring a modern dark-themed Next.js web dashboard for management and control. The server.js file runs both the Express API backend and the Next.js frontend on a single port. Supports multi-session bot management.

## Project Architecture
- **Runtime**: Node.js 20
- **Frontend**: Next.js (React, TypeScript, Tailwind CSS v4)
- **Backend**: Express.js v4 (embedded in server.js)
- **WhatsApp**: @whiskeysockets/baileys
- **Entry Point**: `server.js` — starts Express + Next.js + WhatsApp bot
- **Port**: 5000

## Key Files
- `server.js` — Main server (Express + Next.js + Bot startup + Multi-session API)
- `index.js` — WhatsApp bot multi-session logic (startBotSession, activeSessions)
- `config.env` — Bot configuration (prefix, owner, features)
- `next.config.ts` — Next.js configuration (allowedDevOrigins for Replit proxy)
- `src/app/page.tsx` — Main dashboard page (client component with tabs)
- `src/app/layout.tsx` — Root layout with dark theme
- `src/app/globals.css` — Global styles and Tailwind theme
- `commands/` — Bot command modules
- `handlers/` — Message/command handler logic

## API Endpoints
- `GET /api/status` — Main bot connection status
- `GET /api/info` — Bot info (name, owner, prefix, uptime)
- `GET /api/sessions` — List all sessions
- `POST /api/sessions` — Create new session
- `POST /api/sessions/:id/start` — Start a session
- `POST /api/sessions/:id/stop` — Stop a session
- `DELETE /api/sessions/:id` — Delete a session
- `POST /api/sessions/:id/send` — Send message via session
- `POST /api/start-bot` — Start main bot
- `POST /api/send` — Send message via main bot
- `POST /api/generate` — Generate pairing code
- `POST /api/verify` — Verify pairing code

## Recent Changes
- 2026-02-16: Redesigned dashboard with modern dark theme, multi-session management, tabbed UI (Dashboard, Sessions, Send Message, Pair Device)
- 2026-02-16: Added multi-session API endpoints to server.js
- 2026-02-16: Downgraded Express to v4 for Next.js compatibility
- 2026-02-16: Initial Replit setup — port set to 5000, Next.js configured for proxy/iframe access
