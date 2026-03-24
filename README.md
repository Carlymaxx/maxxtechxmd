# MAXX-XMD WhatsApp Bot

  > A powerful WhatsApp bot with a one-click session generator. Get your session ID in seconds and deploy anywhere.

  ---

  ## 🚀 Get Your Session ID

  Visit the session generator to link your WhatsApp and get a `SESSION_ID`:

  **👉 [Generate Session ID](https://maxxtechxmd.replit.app)**

  ### Steps:
  1. Enter your WhatsApp number (with country code, no `+`) — e.g. `254700000000`
  2. Click **Generate Pairing Code**
  3. Open WhatsApp → ⋮ Menu → **Linked Devices** → **Link a Device** → **Link with phone number**
  4. Type the 8-digit code shown on screen
  5. Your **Session ID** appears on screen and is also sent to your WhatsApp
  6. Copy it and paste it as the `SESSION_ID` environment variable when deploying

  ---

  ## ⚡ Deploy

  Fork this repo and deploy with your `SESSION_ID`:

  [![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd)
  [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)
  [![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

  ### Environment Variables

  | Variable | Description | Required |
  |----------|-------------|----------|
  | `SESSION_ID` | Your session ID from the generator (starts with `MAXX-XMD~`) | ✅ Yes |
  | `BOT_NAME` | Custom name for your bot | No |
  | `PREFIX` | Command prefix (default: `.`) | No |
  | `OWNER_NUMBER` | Your WhatsApp number (owner commands) | No |

  ---

  ## 📋 Features

  - ⚡ Real pairing codes via official WhatsApp Web protocol
  - 🔒 Session stored securely — no passwords needed
  - 🌍 Deploy on Heroku, Railway, Koyeb, Render, Replit and more
  - 📲 Session ID delivered directly to your WhatsApp after linking
  - 👥 Multi-user support — multiple people can generate sessions at the same time

  ---

  ## 🛠 Self-Host Requirements

  - Node.js 18+
  - pnpm 8+

  ```bash
  # Install dependencies
  pnpm install

  # Start the API server
  pnpm --filter @workspace/api-server run dev

  # Start the frontend
  pnpm --filter @workspace/maxx-xmd run dev
  ```

  ---

  ## ⚠️ Disclaimer

  This project is for **educational purposes only**. Use responsibly and in accordance with [WhatsApp's Terms of Service](https://www.whatsapp.com/legal/terms-of-service). The developer is not responsible for bans or misuse.

  ---

  <p align="center">Made with ❤️ by <strong>MAXX-XMD</strong></p>
  