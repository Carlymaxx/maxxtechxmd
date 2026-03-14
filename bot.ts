import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://maxxbot:maxxbot2020@clustersessions.pcz8pqh.mongodb.net/maxx-xmd?retryWrites=true&w=majority';
const mongoClient = new MongoClient(MONGO_URI);

let db: any;

async function connectDb() {
  await mongoClient.connect();
  db = mongoClient.db('maxx-xmd');
  console.log('[DB] Connected to MongoDB');
}

function loadCreds(phone: string) {
  const credsPath = path.join(process.cwd(), 'auth', phone, 'creds.json');
  if (fs.existsSync(credsPath)) {
    return JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
  }
  return null;
}

function saveCreds(phone: string, creds: any) {
  const authDir = path.join(process.cwd(), 'auth', phone);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  fs.writeFileSync(path.join(authDir, 'creds.json'), JSON.stringify(creds, null, 2));
}

async function startBot() {
  await connectDb();
  const logsCollection = db.collection('logs');
  const sessionsCollection = db.collection('sessions');

  const sessions = await sessionsCollection.find({}).toArray();
  
  if (sessions.length === 0) {
    console.log('[BOT] No sessions found. Use the web interface to pair a device first.');
    return;
  }

  for (const session of sessions) {
    const phone = session.phone;
    console.log(`[BOT] Starting bot for ${phone}...`);

    const creds = loadCreds(phone);
    if (!creds) {
      console.log(`[BOT] No credentials found for ${phone}, skipping...`);
      continue;
    }

    const sock = makeWASocket({
      auth: {
        creds,
        keys: {
          get: async () => ({}),
          set: async () => {}
        }
      },
      printQRInTerminal: true,
      browser: ['MAXX-XMD Bot', 'Chrome', '120.0.0'],
    });

    sock.ev.on('creds.update', (newCreds) => {
      const updated = { ...creds, ...newCreds };
      saveCreds(phone, updated);
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'open') {
        console.log(`[BOT] Connected to WhatsApp! (${phone})`);
        await logsCollection.insertOne({
          phone,
          event: 'bot_connected',
          timestamp: new Date()
        });
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as any)?.output?.statusCode;
        console.log(`[BOT] Disconnected (${reason})`);
        
        await logsCollection.insertOne({
          phone,
          event: 'bot_disconnected',
          reason,
          timestamp: new Date()
        });

        if (reason !== DisconnectReason.loggedOut) {
          console.log('[BOT] Reconnecting...');
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const from = msg.key.remoteJid as string;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        
        console.log(`[MSG] From ${from}: ${text}`);

        await logsCollection.insertOne({
          phone,
          event: 'message_received',
          from,
          text,
          timestamp: new Date()
        });

        const response = await generateAIResponse(text, from);
        
        await sock.sendMessage(from, { text: response });

        await logsCollection.insertOne({
          phone,
          event: 'message_sent',
          to: from,
          text: response,
          timestamp: new Date()
        });
      }
    });
  }
}

async function generateAIResponse(message: string, from: string): Promise<string> {
  const lower = message.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! 👋 I'm MAXX-XMD Bot. How can I help you today?";
  }

  if (lower.includes('help')) {
    return "I'm here to help! Just send me a message and I'll respond. What would you like to know?";
  }

  if (lower.includes('who are you')) {
    return "I'm MAXX-XMD Bot, an AI-powered WhatsApp bot. I can chat with you, answer questions, and more!";
  }

  if (lower.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}`;
  }

  if (lower.includes('date')) {
    return `Today's date is ${new Date().toLocaleDateString()}`;
  }

  return `Thanks for your message: "${message}"!\n\nI'm MAXX-XMD Bot. You can ask me anything or just chat. 😊`;
}

startBot().catch(console.error);
