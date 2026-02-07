# MAXX-XMD WhatsApp Bot with Next.js Dashboard

[![Dashboard Preview](https://img.shields.io/badge/📊-Dashboard-blue?style=for-the-badge)](http://localhost:3000)

A powerful WhatsApp bot built with Baileys and a modern Next.js web dashboard for management and control.

![Dashboard Screenshot](https://via.placeholder.com/800x400?text=MAXX-XMD+Dashboard+Preview)

---

## 📊 Dashboard Preview

The Next.js Dashboard provides a modern, responsive web interface to manage your WhatsApp bot:

### 🖥️ Main Dashboard (http://localhost:3000)
- **Bot Status** - Real-time connection status indicator
- **Start/Stop Bot** - Control bot from the web interface
- **Send Messages** - Programmatic message sending to any WhatsApp number
- **Session Management** - View and manage active sessions
- **Responsive Design** - Works on desktop, tablet, and mobile

### 📱 Pairing Dashboard (http://localhost:3000/pair)
- **QR-Free Linking** - Link WhatsApp without scanning QR codes
- **8-Digit Code Verification** - Secure pairing system
- **Session ID Delivery** - Session ID automatically sent to your WhatsApp
- **User-Friendly Interface** - Simple step-by-step process

---

## 🚀 Features

## 🚀 Features

### WhatsApp Bot (Baileys)
- Multi-session support
- Command system with handlers
- Auto-read messages and status
- Anti-link protection
- Status saver
- Sticker maker
- Media handling
- YouTube search and download
- Custom commands

### Next.js Dashboard
- Modern web interface
- Bot status monitoring
- Message sending interface
- **🆕 WhatsApp Pairing System** - Link your WhatsApp without QR codes
- Real-time updates
- Responsive design with Tailwind CSS

## 📦 Installation

```bash
# Install dependencies
bun install

# Or use npm
npm install
```

## ⚙️ Configuration

1. Copy the example config:
```bash
cp config.env .env
```

2. Edit `.env` or `config.env` with your settings:
```env
SESSION_ID='maxx_session'
PREFIX="."
PUBLIC_MODE='yes'
OWNER_NAME="Your Name"
OWNER_NUMBER="your_number"
BOT_NAME="MAXX-XMD"
```

## 🎯 Usage

### Option 1: Run Baileys Bot Only
```bash
bun bot
# or
npm run bot
```

This starts the Express server with your Baileys bot on port 3000.

### Option 2: Run Next.js Dashboard
```bash
bun dev
# or
npm run dev
```

This starts the Next.js development server with the web dashboard.

### Option 3: Run Both (Recommended)
```bash
# Terminal 1: Start the Baileys bot
bun bot

# Terminal 2: Start the Next.js dashboard
bun dev
```

## 📱 First Time Setup

### Method 1: Pairing Dashboard (Recommended) 🆕

1. Start the Next.js dashboard:
   ```bash
   bun dev
   ```

2. Open your browser and go to: `http://localhost:3000/pair`

3. Enter your WhatsApp phone number (with country code, no spaces)

4. Click "Send Verification Code"

5. Check your WhatsApp for an 8-digit code

6. Enter the code and click "Verify & Create Session"

7. Your Session ID will be sent to your WhatsApp and displayed on screen

8. Add the Session ID to your `config.env` file

📖 **For detailed instructions, see [PAIRING_GUIDE.md](PAIRING_GUIDE.md)**

### Method 2: QR Code (Traditional)

1. Start the bot using one of the methods above
2. A QR code will appear in the terminal
3. Open WhatsApp on your phone
4. Go to Settings > Linked Devices > Link a Device
5. Scan the QR code
6. Wait for "✅ MAXX-XMD connected!" message

## 🎮 Bot Commands

Send these commands to your WhatsApp bot:

- `.menu` - Show all available commands
- `.ping` - Check bot responsiveness
- `.botinfo` - Get bot information
- `.sticker` - Convert image/video to sticker
- `.toimg` - Convert sticker to image
- `.savestatus` - Save WhatsApp status

## 📁 Project Structure

```
.
├── src/                    # Next.js application
│   ├── app/               # App router pages
│   └── lib/               # Utilities
├── commands/              # Bot command handlers
├── handlers/              # Message and event handlers
├── utils/                 # Helper functions
├── media/                 # Media files
├── auth_info_baileys/     # Bot session data (auto-generated)
├── config.env             # Bot configuration
├── index.js               # Baileys bot core
├── server.js              # Express server
└── package.json           # Dependencies
```

## 🛠️ Development

```bash
# Type checking
bun typecheck

# Linting
bun lint

# Build for production
bun build

# Start production server
bun start
```

## 🔒 Security Notes

- Never commit `auth_info_baileys/` or `auth_info/` directories
- Keep your `config.env` file private
- Don't share your session files
- Use environment variables for sensitive data

## 📝 Adding Custom Commands

1. Create a new file in `commands/` directory:
```javascript
module.exports = {
  name: 'mycommand',
  description: 'My custom command',
  execute: async (sock, msg, args) => {
    await sock.sendMessage(msg.key.remoteJid, { 
      text: 'Hello from my command!' 
    });
  }
};
```

2. The command will be automatically loaded by the command handler

## 🤝 Contributing

Feel free to submit issues and pull requests!

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👨‍💻 Developer

**Carly Maxx** - MAXX TECH
- WhatsApp: +254725979273

## 🙏 Credits

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Next.js](https://nextjs.org/) - React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
