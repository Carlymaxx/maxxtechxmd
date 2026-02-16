# MAXX-XMD WhatsApp Bot with Next.js Dashboard

## Overview
A WhatsApp bot built with Baileys library, featuring a Next.js web dashboard for management and control. The server.js file runs both the Express API backend and the Next.js frontend on a single port.

## Project Architecture
- **Runtime**: Node.js 20
- **Frontend**: Next.js (React, TypeScript, Tailwind CSS)
- **Backend**: Express.js (embedded in server.js)
- **WhatsApp**: @whiskeysockets/baileys
- **Entry Point**: `server.js` — starts Express + Next.js + WhatsApp bot
- **Port**: 5000

## Key Files
- `server.js` — Main server (Express + Next.js + Bot startup)
- `index.js` — WhatsApp bot multi-session logic
- `config.env` — Bot configuration (prefix, owner, features)
- `next.config.ts` — Next.js configuration
- `src/app/` — Next.js App Router pages
- `commands/` — Bot command modules
- `handlers/` — Message/command handler logic
- `public/` — Static HTML pages (dashboard, pairing)

## Recent Changes
- 2026-02-16: Initial Replit setup — port set to 5000, Next.js configured for proxy/iframe access, deployment configured
