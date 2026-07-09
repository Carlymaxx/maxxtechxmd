# MAXX-XMD WhatsApp Bot ⚡

<div align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Rockwell&size=50&pause=1000&color=33ff00&center=true&width=910&height=100&lines=MAXX-XMD+v3.0.1;Multi+Device+WhatsApp+Bot;Made+by+Carlymaxx" alt="Typing SVG" />
  </a>
</div>

<div align="center">
  <img src="https://files.catbox.moe/9r47nb.jpg" alt="MAXX-XMD" height="300">
</div>

---

<div align="center">

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd)
&nbsp;
[![Fork](https://img.shields.io/badge/🍴%20FORK%20THIS%20REPO-darkblue?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Carlymaxx/maxxtechxmd/fork)
&nbsp;
[![Session ID](https://img.shields.io/badge/🔑%20GET%20SESSION%20ID-ffb703?style=for-the-badge&logo=whatsapp&logoColor=white)](https://pair.maxxtech.co.ke)

</div>

---

## 🚀 Deploy Options

### 1️⃣ Heroku (One Click)

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Carlymaxx/maxxtechxmd)

1. Click the button above
2. Enter your `SESSION_ID` (get it FREE from [pair.maxxtech.co.ke](https://pair.maxxtech.co.ke))
3. Click **Deploy App** → Done!

---

### 2️⃣ Docker (VPS / Katapump / Any Linux Server)

**Requirements:** Docker + Docker Compose installed

```bash
# 1. Clone the repo
git clone https://github.com/Carlymaxx/maxxtechxmd.git
cd maxxtechxmd

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env and paste your SESSION_ID
nano .env

# 4. Build and start
docker-compose up -d

# 5. View logs
docker-compose logs -f
```

---

### 3️⃣ VPS / Katapump (Manual)

**Requirements:** Node.js 20, pnpm

```bash
# 1. Clone
git clone https://github.com/Carlymaxx/maxxtechxmd.git
cd maxxtechxmd

# 2. Install dependencies
npm install -g pnpm
pnpm install

# 3. Set your SESSION_ID
export SESSION_ID="MAXX-XMD~H4sI...your-session..."
export BOT_NAME="MAXX-XMD"

# 4. Run the bot
node --enable-source-maps ./artifacts/carlymaxx-engine/dist/index.mjs
```

**Keep it running 24/7 with PM2:**
```bash
npm install -g pm2
pm2 start "node ./artifacts/carlymaxx-engine/dist/index.mjs" --name maxx-xmd
pm2 save && pm2 startup
```

---

### 4️⃣ Railway / Render / Koyeb (Free Hosting)

1. Fork this repo
2. Connect your GitHub to Railway/Render/Koyeb
3. Set `SESSION_ID` environment variable
4. Deploy — done!

---

## 🔑 Get Session ID

Visit **[pair.maxxtech.co.ke](https://pair.maxxtech.co.ke)** — enter your WhatsApp number, scan QR, copy the Session ID.

---

## 🌐 Links

| | |
|---|---|
| 🌍 Website | [maxxtech.co.ke](https://maxxtech.co.ke) |
| 📢 WhatsApp Channel | [Follow Us](https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J) |
| 👥 WhatsApp Group | [Join Group](https://chat.whatsapp.com/BWZOtIlbZoJ9Xt8lgxxbqQ) |
| 💻 GitHub | [Carlymaxx/maxxtechxmd](https://github.com/Carlymaxx/maxxtechxmd) |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_ID` | ✅ Yes | WhatsApp session (from pair.maxxtech.co.ke) |
| `BOT_NAME` | No | Bot display name (default: MAXX-XMD) |
| `PREFIX` | No | Command prefix (default: `.`) |
| `WORK_MODE` | No | `public` or `private` (default: public) |
| `OWNER_NUMBER` | No | Your WhatsApp number e.g. 254712345678 |
| `PAYSTACK_SECRET_KEY` | No | For M-Pesa STK push payments |

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Carlymaxx">
        <img src="https://avatars.githubusercontent.com/Carlymaxx?v=4" width="100" alt="Carlymaxx"/><br />
        <sub><b>Carlymaxx</b></sub>
      </a><br />
      <sup>👑 CEO &amp; Lead Developer</sup>
    </td>
  </tr>
</table>

> Want to contribute? Fork the repo, make your changes, and open a Pull Request!

---

## 📌 Made by [Carlymaxx](https://maxxtech.co.ke) ⚡

> MAXX-XMD v3.0.1 — The most powerful Kenyan WhatsApp bot
