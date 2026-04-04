# MAXX-XMD WhatsApp Bot

The most powerful WhatsApp multi-device bot — 580+ commands, zero configuration required.  
Fork → Set `SESSION_ID` → Deploy → Done.

---

## One-Click Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd)

---

## Manual Deploy Steps

### 1. Get Your SESSION_ID

Visit **[pair.maxxtech.co.ke](https://pair.maxxtech.co.ke)** and link your WhatsApp number.  
Copy the `SESSION_ID` string shown after pairing.

### 2. Fork This Repo

Click **Fork** at the top right of this page. You must fork to deploy your own instance.

### 3. Create a Heroku App

```bash
heroku create my-maxx-bot
heroku git:remote -a my-maxx-bot
```

Or use the [Heroku Dashboard](https://dashboard.heroku.com) → New → Create new app.

### 4. Set Environment Variables

In your Heroku app → **Settings** → **Config Vars**, set:

| Variable | Required | Description |
|---|---|---|
| `SESSION_ID` | ✅ YES | Your session from pair.maxxtech.co.ke |
| `OWNER_NUMBER` | Optional | Your WhatsApp number, e.g. `256700000000` |
| `PREFIX` | Optional | Command prefix — default `.` |
| `WORK_MODE` | Optional | `public` (anyone) or `private` (owner only) — default `public` |
| `AUTO_READ` | Optional | Auto-read messages — `true` / `false` |
| `AUTO_TYPING` | Optional | Show typing indicator — `true` / `false` |
| `AUTO_VIEW_STATUS` | Optional | Auto-view statuses — `true` / `false` |
| `AUTO_LIKE_STATUS` | Optional | Auto-like statuses — `true` / `false` |
| `ANTICALL` | Optional | Reject calls automatically — `true` / `false` |
| `WELCOME_MSG` | Optional | Send welcome message to new group members — `true` / `false` |
| `HEROKU_API_KEY` | Optional | Your Heroku API key — enables `.update` command |
| `HEROKU_APP_NAME` | Optional | Your Heroku app name — enables `.update` command |
| `NPM_CONFIG_PRODUCTION` | Set to `false` | Keeps all packages — **do not change** |
| `NODE_MODULES_CACHE` | Set to `false` | Clean installs — **do not change** |

### 5. Connect GitHub & Deploy

In Heroku Dashboard → **Deploy** tab:
1. Connect to GitHub → search for your fork
2. Click **Deploy Branch** (or enable Auto-Deploy)

Or deploy via CLI:

```bash
git push heroku main
```

---

## Commands (580+)

| Category | Sample Commands |
|---|---|
| **AI** | `.gpt` `.gemini` `.ai` `.translate` `.code` `.explain` `.summarize` |
| **Download** | `.tiktok` `.instagram` `.twitter` `.facebook` `.song` `.video` `.spotifydl` |
| **Sticker** | `.sticker` `.steal` `.toimage` `.emojisticker` `.qrsticker` |
| **Image** | `.blur` `.grayscale` `.invert` `.imgflip` `.rotate` `.watermark` |
| **Audio** | `.tomp3` `.toptt` `.tts` `.bass` `.deep` `.audioreverse` |
| **Tools** | `.qrcode` `.ssweb` `.tourl` `.reverse` `.fancy` `.emojimix` |
| **Group** | `.kick` `.promote` `.demote` `.mute` `.unmute` `.invitelink` |
| **Owner** | `.block` `.broadcast` `.setprefix` `.mode` `.restart` `.update` |
| **Fun** | `.joke` `.fact` `.meme` `.quiz` `.8ball` `.dare` `.truth` |
| **Search** | `.wiki` `.weather` `.crypto` `.translate` `.movie` `.anime` |

Type `.menu` to see all categories, or `.help <command>` for details.

---

## Update the Bot

After forking, you can update to the latest version from WhatsApp:

```
.update
```

This hot-reloads all command files from your GitHub fork — no restart needed.  
Requires `HEROKU_API_KEY` and `HEROKU_APP_NAME` config vars to trigger a full rebuild.

---

## Support

- **Pair your session:** [pair.maxxtech.co.ke](https://pair.maxxtech.co.ke)
- **WhatsApp Group:** [Join here](https://chat.whatsapp.com/BWZOtIlbZoJ9Xt8lgxxbqQ)
- **WhatsApp Channel:** [Follow here](https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J)

---

## License

MIT — Fork freely. Keep the bot name as **MAXX-XMD**.
