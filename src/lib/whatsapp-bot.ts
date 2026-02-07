import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

class WhatsAppBot {
  private client: Client;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // QR Code generation
    this.client.on('qr', (qr) => {
      console.log('📱 Scan this QR code with WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    // Client ready
    this.client.on('ready', () => {
      console.log('✅ WhatsApp bot is ready!');
      this.isReady = true;
    });

    // Authentication
    this.client.on('authenticated', () => {
      console.log('🔐 Authenticated successfully');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      console.log('⚠️ Client disconnected:', reason);
      this.isReady = false;
    });

    // Message handling
    this.client.on('message', async (message: Message) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: Message) {
    const chat = await message.getChat();
    const contact = await message.getContact();
    
    console.log(`📨 Message from ${contact.pushname || contact.number}: ${message.body}`);

    // Ignore group messages (optional)
    if (chat.isGroup) {
      return;
    }

    // Bot commands
    const command = message.body.toLowerCase().trim();

    try {
      switch (command) {
        case '/start':
        case 'hi':
        case 'hello':
          await message.reply(
            '👋 Hello! I\'m your WhatsApp bot.\n\n' +
            'Available commands:\n' +
            '• /help - Show this help message\n' +
            '• /info - Get bot information\n' +
            '• /ping - Check if bot is responsive\n' +
            '• /time - Get current time'
          );
          break;

        case '/help':
          await message.reply(
            '🤖 *WhatsApp Bot Help*\n\n' +
            'I can help you with:\n' +
            '• Automated responses\n' +
            '• Information queries\n' +
            '• Quick commands\n\n' +
            'Type any command to get started!'
          );
          break;

        case '/info':
          await message.reply(
            '📊 *Bot Information*\n\n' +
            '• Status: Active ✅\n' +
            '• Version: 1.0.0\n' +
            '• Built with: whatsapp-web.js\n' +
            '• Framework: Next.js'
          );
          break;

        case '/ping':
          await message.reply('🏓 Pong! Bot is responsive.');
          break;

        case '/time':
          const now = new Date();
          await message.reply(
            `🕐 Current time:\n${now.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'short',
            })}`
          );
          break;

        default:
          // Echo back or custom logic
          if (message.body.startsWith('/')) {
            await message.reply(
              '❓ Unknown command. Type /help to see available commands.'
            );
          } else {
            // Auto-reply to regular messages
            await message.reply(
              `You said: "${message.body}"\n\nType /help for available commands.`
            );
          }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await message.reply('⚠️ Sorry, something went wrong. Please try again.');
    }
  }

  async initialize() {
    console.log('🚀 Initializing WhatsApp bot...');
    await this.client.initialize();
  }

  async sendMessage(number: string, message: string) {
    if (!this.isReady) {
      throw new Error('Bot is not ready yet');
    }

    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    await this.client.sendMessage(chatId, message);
  }

  getClient() {
    return this.client;
  }

  isClientReady() {
    return this.isReady;
  }
}

// Singleton instance
let botInstance: WhatsAppBot | null = null;

export function getWhatsAppBot(): WhatsAppBot {
  if (!botInstance) {
    botInstance = new WhatsAppBot();
  }
  return botInstance;
}

export default WhatsAppBot;
