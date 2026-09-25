# AGENTS.md — AI Contributor Rules for MAXX-XMD

> This file is instructions for any AI agent (Cursor, Copilot, Claude, GPT, Devin, etc.)
> that accesses this repository. Read and follow ALL rules before making any change.

---

## 1. DO NOT TOUCH — Protected Files

These files are critical and must NOT be modified, deleted, renamed, or reformatted:

| File | Why |
|------|-----|
| `artifacts/carlymaxx-engine/dist/index.mjs` | Core bot bundle — partially obfuscated, hand-patched. Any rewrite breaks 677+ commands. |
| `artifacts/carlymaxx-engine/package.json` | Bot version pinned at v3.2.0+. Do not downgrade. |
| `Procfile` | Dyno startup command. Do not change the path. |
| `app.json` | Heroku deploy button config. Only `SESSION_ID` is required. Do not add new required env vars. |
| `Dockerfile` | Production Docker config. Do not change base image or paths. |
| `docker-compose.yml` | Compose config. Do not modify. |
| `.github/workflows/deploy.yml` | Auto-deploy pipeline to Heroku. Do not remove or rewrite. |
| `carlymaxx-scripts/set-all-configs.sh` | Sets config vars on all 30 Heroku apps. Do not touch. |

---

## 2. Core Architecture — Understand Before Editing

### Bot Bundle (`index.mjs`)
- Line 2 is a **single-line obfuscated bundle** (~11 MB). Do NOT reformat or prettify it.
- Lines 370+ contain `commandRegistry.set(...)` injections — these are hand-patched additions.
- The `.alive`, `.bot`, `.stk`, `.pay`, `.verifypay`, `.autoreactstatus` commands are all **injected after** the obfuscated base — do not duplicate or remove them.
- The `_saveToHeroku()` function persists settings to Heroku config vars via API — `HEROKU_APP_NAME` env var must always be present.

### Session Handling
- WhatsApp session is loaded from `SESSION_ID` env var.
- Baileys v7 uses `@lid` JIDs — do NOT convert them to `@s.whatsapp.net` for reactions.
- The `_attachStatusListener()` function auto-starts on connection open — do not remove the boot hook.

### Settings Persistence
- Settings are saved to Heroku config vars via `_saveToHeroku()`.
- `HEROKU_APP_NAME` is auto-injected by the `runtime-dyno-metadata` lab (enabled on all apps).
- `CUSTOM_BOT_PIC_URL` is the sentinel for `.setpic` — if absent, random rotation is used.

---

## 3. Folder Structure — Do Not Rename.

```
maxxtechxmd/
├── artifacts/
│   └── carlymaxx-engine/      # Main bot engine (was api-server, then maxx-engine)
│       ├── dist/index.mjs     # THE BUNDLE — do not touch
│       └── package.json       # version pinned
├── carlymaxx-assets/          # Static assets
├── carlymaxx-scripts/         # Utility scripts
├── .github/workflows/         # CI/CD — do not modify
├── Procfile                   # Heroku startup
├── app.json                   # Heroku deploy button
├── Dockerfile                 # Docker support
├── docker-compose.yml
├── .env.example               # Template for env vars
└── pnpm-workspace.yaml        # pnpm monorepo config
```

---

## 4. Environment Variables — Required on Every App

These must be set on **every** Heroku app. The GitHub Actions workflow sets them automatically:

| Var | Value / Notes |
|-----|---------------|
| `SESSION_ID` | User-provided from https://pair.maxxtech.co.ke |
| `HEROKU_API_KEY` | Auto-set by deploy workflow |
| `HEROKU_APP_NAME` | Auto-injected by runtime-dyno-metadata lab |
| `NPM_CONFIG_PRODUCTION` | `false` — required so Baileys is NOT pruned |
| `NODE_MODULES_CACHE` | `false` — required for fresh installs |
| `PAYSTACK_SECRET_KEY` | Live Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Live Paystack public key |

---

## 5. Deployment Rules

- **Source of truth is GitHub** (`Carlymaxx/maxxtechxmd`, `main` branch).
- **Never deploy directly to Heroku git** — always push to GitHub and let the Actions workflow deploy.
- Heroku app `ababuh` is the **primary test app** — test all changes here first.
- Heroku app `dare` is a **secondary production app** — deploy only after ababuh confirms working.
- Do NOT push to any other branch. All work goes to `main`.

---

## 6. Bot Commands — Implemented Features

Do NOT remove or re-implement these — they already exist and are tested:

- `.alive` / `.bot` / `.status` — alive card with externalAdReply View Channel button
- `.setname` / `.resetname` — sets bot name, persisted to Heroku
- `.setpic` / `.resetpic` — sets bot pic, persisted to Heroku
- `.stk` — sticker maker (sharp, no wa-sticker-formatter)
- `.tiktok` / `.ig` / `.ytmp3` / `.ytmp4` — media downloaders
- `.pay` / `.stk` / `.verifypay` — Paystack M-Pesa STK push
- `.autoreactstatus` / `.reactstatus` — auto-react to WhatsApp statuses
- `.chatbot` — AI chatbot listener (on/off)
- Menu command — 677+ commands, do NOT rebuild or reformat

---

## 7. What You CAN Do

- Add **new commands** by appending new `commandRegistry.set('newcmd', { ... })` blocks at the **bottom** of `index.mjs` (after all existing injections).
- Update `README.md`, `FUNDING.yml`, `.env.example`, issue templates.
- Add new scripts to `carlymaxx-scripts/`.
- Update `app.json` description/logo — but NOT the env var list.
- Bump version in `artifacts/carlymaxx-engine/package.json` (must be ≥ v3.2.0).

---

## 8. What You Must NEVER Do

- Rewrite, reformat, or prettify `index.mjs`
- Add new required fields to `app.json`
- Change the `Procfile` path
- Remove or rename any folder listed in section 3
- Downgrade Node.js below v20
- Switch package manager from pnpm
- Delete `.github/workflows/deploy.yml`
- Remove the `NPM_CONFIG_PRODUCTION=false` requirement
- Convert Baileys `@lid` JIDs to `@s.whatsapp.net`
- Replace `_saveToHeroku()` with file-based storage (dynos are ephemeral)

---

## 9. Testing Checklist Before Any Commit

- [ ] `node --check artifacts/carlymaxx-engine/dist/index.mjs` passes (no syntax errors)
- [ ] Bot connects and session loads from `SESSION_ID`
- [ ] `.alive` command responds with card + View Channel button
- [ ] `.menu` shows all 677+ commands
- [ ] `.setname` / `.setpic` changes persist after dyno restart
- [ ] No new required env vars added to `app.json`

---

*Last updated: 2026-07-21 by MAXXTECH AI Agent (Carlymaxx/maxxtechxmd)*
