# WhatsApp Bot Setup Guide

## Overview

This is a fully functional WhatsApp bot built with Next.js and whatsapp-web.js. The bot can automatically respond to messages, execute commands, and be controlled through a web dashboard.

## Features

- ✅ Automated message responses
- ✅ Custom command handling
- ✅ Web dashboard for bot control
- ✅ Send messages programmatically
- ✅ QR code authentication
- ✅ Real-time status monitoring

## Prerequisites

- Node.js 20+ or Bun installed
- A WhatsApp account
- A phone to scan the QR code

## Installation

1. Dependencies are already installed. If you need to reinstall:
   ```bash
   bun install
   ```

## How to Use

### Step 1: Start the Development Server

```bash
bun dev
```

The app will be available at `http://localhost:3000`

### Step 2: Start the Bot

1. Open `http://localhost:3000` in your browser
2. Click the "Start Bot" button
3. Check your terminal/console - you'll see a QR code
4. Open WhatsApp on your phone
5. Go to Settings > Linked Devices > Link a Device
6. Scan the QR code displayed in your terminal

### Step 3: Bot is Ready!

Once authenticated, the bot status will change to "ready" and you can:
- Send messages to your WhatsApp number - the bot will respond automatically
- Use the dashboard to send messages programmatically
- Monitor bot status in real-time

## Available Bot Commands

Users can send these commands to your WhatsApp number:

| Command | Description |
|---------|-------------|
| `/start` or `hi` or `hello` | Show welcome message |
| `/help` | Display help information |
| `/info` | Get bot information |
| `/ping` | Check bot responsiveness |
| `/time` | Get current date and time |

## Dashboard Features

### Bot Status
- Real-time status indicator (ready/initializing/offline)
- Start/stop bot controls
- Status messages and alerts

### Send Messages
- Send messages to any WhatsApp number
- Enter phone number with country code (no + or spaces)
- Example: `1234567890` for +1 234-567-890

## Customizing the Bot

### Adding New Commands

Edit `src/lib/whatsapp-bot.ts` and add your command in the `handleMessage` method:

```typescript
case '/mycommand':
  await message.reply('Your custom response here');
  break;
```

### Changing Auto-Reply Behavior

Modify the `default` case in the switch statement to customize how the bot responds to regular messages.

### Adding Group Support

By default, the bot ignores group messages. To enable group support, remove or modify this check:

```typescript
if (chat.isGroup) {
  return; // Remove this to handle group messages
}
```

## API Endpoints

### GET /api/bot
Check bot status

**Response:**
```json
{
  "status": "ready",
  "message": "Bot is ready and connected"
}
```

### POST /api/bot
Control the bot

**Start Bot:**
```json
{
  "action": "start"
}
```

**Send Message:**
```json
{
  "action": "send",
  "number": "1234567890",
  "message": "Hello from bot!"
}
```

## Troubleshooting

### QR Code Not Showing
- Make sure the terminal is visible
- Check console logs for errors
- Try restarting the bot

### Bot Not Responding
- Verify bot status is "ready"
- Check if WhatsApp is still connected on your phone
- Look for errors in the terminal

### Authentication Failed
- Delete the `.wwebjs_auth` folder
- Restart the bot and scan QR code again

### Messages Not Sending
- Ensure phone number format is correct (no + or spaces)
- Verify bot status is "ready"
- Check if the number exists on WhatsApp

## Session Persistence

The bot uses `LocalAuth` strategy, which saves your session in `.wwebjs_auth` folder. This means:
- You only need to scan QR code once
- Bot will auto-reconnect on restart
- Delete this folder to reset authentication

## Production Deployment

### Important Notes

1. **Server Requirements**: The bot needs a server that can run Puppeteer (headless Chrome)
2. **Keep Alive**: Use a process manager like PM2 to keep the bot running
3. **Session Storage**: Ensure `.wwebjs_auth` folder persists between deployments

### Deployment Steps

1. Build the application:
   ```bash
   bun build
   ```

2. Set up environment variables if needed

3. Deploy to a server that supports Node.js/Bun

4. Start the bot and scan QR code on first run

### Recommended Platforms
- VPS (DigitalOcean, Linode, AWS EC2)
- Railway (with persistent storage)
- Render (with persistent disk)

**Note**: Vercel and similar serverless platforms won't work due to Puppeteer requirements.

## Security Considerations

- Keep your `.wwebjs_auth` folder secure and private
- Don't commit authentication data to version control
- Add `.wwebjs_auth` to `.gitignore` (already done)
- Implement rate limiting for API endpoints in production
- Add authentication to your dashboard in production

## Advanced Features

### Sending Media
```typescript
await message.reply(new MessageMedia('image/png', base64Data, 'image.png'));
```

### Getting Chat Info
```typescript
const chat = await message.getChat();
const contact = await message.getContact();
```

### Typing Indicator
```typescript
await chat.sendStateTyping();
```

## Support

For issues with:
- **whatsapp-web.js**: Check [official documentation](https://wwebjs.dev/)
- **Next.js**: Check [Next.js documentation](https://nextjs.org/docs)

## License

This project is open source and available for personal and commercial use.
