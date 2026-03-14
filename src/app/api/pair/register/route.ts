import { NextResponse } from 'next/server';
import makeWASocket, { AuthenticationState, BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import { MongoClient } from 'mongodb';

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
  pairingCode?: string;
  connected: boolean;
}

const pendingPairing: Map<string, { socket: any; timeout: NodeJS.Timeout }> = new Map();

function createAuthState(creds?: any): { state: AuthenticationState; saveCreds: () => Promise<void> } {
  const credsObj = creds || initAuthCreds();
  
  return {
    state: {
      creds: credsObj,
      keys: {
        get: async () => ({}),
        set: async () => {},
      }
    },
    saveCreds: async () => {}
  };
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const sessionsCollection = db.collection('sessions');
    
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    if (pendingPairing.has(cleanPhone)) {
      const existing = pendingPairing.get(cleanPhone);
      if (existing) {
        existing.socket.end(undefined);
        clearTimeout(existing.timeout);
      }
      pendingPairing.delete(cleanPhone);
    }

    const existingSession = await sessionsCollection.findOne({ phone: cleanPhone });
    
    let authState: { state: AuthenticationState; saveCreds: () => Promise<void> };
    if (existingSession && existingSession.creds) {
      authState = createAuthState(existingSession.creds);
    } else {
      authState = createAuthState();
    }

    const sock = makeWASocket({
      auth: authState.state,
      printQRInTerminal: false,
      browser: ['MaxX Tech', 'Chrome', '120.0.0'],
    });

    const pairingInfo: { socket: any; timeout: NodeJS.Timeout } = {
      socket: sock,
      timeout: setTimeout(() => {
        try {
          sock.end(undefined);
        } catch {}
        pendingPairing.delete(cleanPhone);
      }, 120000)
    };
    pendingPairing.set(cleanPhone, pairingInfo);

    sock.ev.on('creds.update', async (creds: any) => {
      await sessionsCollection.updateOne(
        { phone: cleanPhone },
        { $set: { phone: cleanPhone, creds, updatedAt: new Date() } },
        { upsert: true }
      );
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection } = update;
      
      if (connection === 'open') {
        clearTimeout(pairingInfo.timeout);
        pendingPairing.delete(cleanPhone);
        console.log('Connected to WhatsApp!');
      }
    });

    const code = await sock.requestPairingCode(fullPhone);
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

    return NextResponse.json({ 
      success: true, 
      pairingCode: formattedCode,
      phone: fullPhone,
      message: `Enter this code on your WhatsApp: ${formattedCode}`
    });

  } catch (error: any) {
    console.error('Pairing error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate pairing code' 
    }, { status: 500 });
  }
}

export async function GET() {
  const sessions = Array.from(pendingPairing.keys());
  return NextResponse.json({ pending: sessions });
}
