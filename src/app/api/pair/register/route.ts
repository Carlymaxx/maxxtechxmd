import { NextResponse } from 'next/server';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { MongoClient, ObjectId } from 'mongodb';

let client: MongoClient | null = null;

async function getDb() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://maxxbot:maxxbot2020@clustersessions.pcz8pqh.mongodb.net/maxx-xmd?retryWrites=true&w=majority';
  const DB_NAME = process.env.MONGO_DB || 'maxx-xmd';
  
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(DB_NAME);
}

interface PairingSession {
  phone: string;
  socket: any;
  connected: boolean;
  creds?: any;
}

const activeSessions: Map<string, PairingSession> = new Map();

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const sessionsCollection = db.collection('sessions');
    
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (activeSessions.has(cleanPhone)) {
      const existing = activeSessions.get(cleanPhone);
      if (existing?.socket) {
        try {
          existing.socket.end({ error: undefined, reason: 'New pairing request' });
        } catch {}
      }
      activeSessions.delete(cleanPhone);
    }

    const existingSession = await sessionsCollection.findOne({ phone: cleanPhone });
    
    let authState: any;
    if (existingSession && existingSession.creds) {
      authState = {
        creds: existingSession.creds,
        keys: {}
      };
    } else {
      authState = { creds: {}, keys: {} };
    }

    const sock = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      browser: ['MaxX Tech', 'Chrome', '120.0.0'],
      logger: console as any,
    });

    const sessionData: PairingSession = { 
      phone: cleanPhone, 
      socket: sock, 
      connected: false,
      creds: authState.creds
    };
    activeSessions.set(cleanPhone, sessionData);

    sock.ev.on('creds.update', async (creds: any) => {
      sessionData.creds = { ...sessionData.creds, ...creds };
      await sessionsCollection.updateOne(
        { phone: cleanPhone },
        { $set: { phone: cleanPhone, creds: sessionData.creds, updatedAt: new Date() } },
        { upsert: true }
      );
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
          console.log('Reconnecting...');
        } else {
          activeSessions.delete(cleanPhone);
        }
      }

      if (connection === 'open') {
        console.log('Connected to WhatsApp!');
        sessionData.connected = true;
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Pairing timeout'));
      }, 60000);

      const checkConnection = setInterval(() => {
        if (sessionData.connected) {
          clearInterval(checkConnection);
          clearTimeout(timeout);
          resolve();
        }
      }, 1000);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to WhatsApp!',
      phone: cleanPhone
    });

  } catch (error: any) {
    console.error('Pairing error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to connect' 
    }, { status: 500 });
  }
}

export async function GET() {
  const sessions = Array.from(activeSessions.entries()).map(([phone, data]) => ({
    phone,
    connected: data.connected
  }));
  
  return NextResponse.json({ sessions });
}
