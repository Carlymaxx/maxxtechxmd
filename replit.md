# Workspace — MAXX-XMD WhatsApp Bot

## Overview

pnpm workspace monorepo using TypeScript. This is the MAXX-XMD WhatsApp Bot — a fully-featured WhatsApp bot with 500+ commands, a React dashboard, and a session pairing system.

Source: https://github.com/Carlymaxx/maxxtechxmd.git

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (optional, app uses file-based auth store)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **WhatsApp**: @whiskeysockets/baileys
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: Wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server + WhatsApp bot
│   └── maxx-xmd/           # React dashboard frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Workflows

- **MAXX-XMD Frontend** — `PORT=23403 BASE_PATH=/ pnpm --filter @workspace/maxx-xmd run dev` (port 23403)
- **artifacts/api-server: API Server** — `pnpm --filter @workspace/api-server run dev` (port 8080)

## API Routes

All routes under `/api`:
- `GET /api/healthz` — Health check
- `GET|POST /api/bot/*` — Bot control (status, start, qr, send, info)
- `GET|POST|DELETE /api/sessions/*` — Session management
- `POST /api/pair` — Request WhatsApp pairing code
- `GET /api/pair/:sessionId/status` — Check pairing status
- `GET|PATCH /api/settings` — Bot settings
- `GET /api/stats` — Live statistics

## Frontend Pages

- `/` — Link/Pair page (main landing)
- `/pair` — Pairing flow
- `/dashboard` — Bot dashboard
- `/sessions` — Session management
- `/send` — Send messages
- `/settings` — Bot settings

## Environment Variables

- `SESSION_ID` — WhatsApp session ID (set after pairing)
- `BOT_NAME` — Bot name prefix (default: "MAXX-XMD")
- `OWNER_NUMBER` — Owner's WhatsApp number
- `DATABASE_URL` — PostgreSQL connection (if using DB)

## Running Codegen

After changing `lib/api-spec/openapi.yaml`:
```
pnpm --filter @workspace/api-spec run codegen
```

## TypeScript & Composite Projects

- **Always typecheck from the root** — `pnpm run typecheck`
- `emitDeclarationOnly` for libs, esbuild for runtime

## Notes

- Auth data stored in `/auth_info_baileys/` (file-based, no DB needed for WhatsApp sessions)
- Bot auto-starts main session on server startup
- `protobufjs` must be installed separately as it's externalized from the bundle
