import { NextResponse } from 'next/server';
import makeWASocket, { AuthenticationState, initAuthCreds } from '@whiskeysockets/baileys';
import { MongoClient, Binary } from 'mongodb';

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

function convertBuffers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Binary) return obj.buffer;
  if (Buffer.isBuffer(obj)) return obj;
  if (Array.isArray(obj)) return obj.map(convertBuffers);
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key of Object.keys(obj)) {
      converted[key] = convertBuffers(obj[key]);
    }
    return converted;
  }
  return obj;
}

const pendingPairing: Map<string, { socket: any; timeout: NodeJS.Timeout }> = new Map();
const connectedDevices: Map<string, { phone: string; connected: boolean }> = new Map();

function createAuthState(creds?: any): { state: AuthenticationState; saveCreds: () => Promise<void> } {
  const credsObj = creds ? convertBuffers(creds) : initAuthCreds();
  
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

    console.log('[PAIR] Generating pairing code for:', fullPhone);

    if (pendingPairing.has(cleanPhone)) {
      const existing = pendingPairing.get(cleanPhone);
      if (existing) {
        try {
          existing.socket.end(undefined);
        } catch {}
        clearTimeout(existing.timeout);
      }
      pendingPairing.delete(cleanPhone);
    }

    const existingSession = await sessionsCollection.findOne({ phone: cleanPhone });
    
    let authState: { state: AuthenticationState; saveCreds: () => Promise<void> };
    if (existingSession && existingSession.creds) {
      console.log('[PAIR] Using existing credentials');
      authState = createAuthState(existingSession.creds);
    } else {
      console.log('[PAIR] Creating new credentials');
      authState = createAuthState();
    }

    const sock = makeWASocket({
      auth: authState.state,
      printQRInTerminal: false,
      browser: ['MAXX-XMD', 'Chrome', '120.0.0'],
      connectTimeoutMs: 60000,
    });

    const pairingInfo: { socket: any; timeout: NodeJS.Timeout } = {
      socket: sock,
      timeout: setTimeout(() => {
        try {
          sock.end(undefined);
        } catch {}
        pendingPairing.delete(cleanPhone);
        console.log('[PAIR] Timed out');
      }, 90000)
    };
    pendingPairing.set(cleanPhone, pairingInfo);

    sock.ev.on('creds.update', async (creds: any) => {
      try {
        const serialized = JSON.parse(JSON.stringify(creds));
        await sessionsCollection.updateOne(
          { phone: cleanPhone },
          { $set: { phone: cleanPhone, creds: serialized, updatedAt: new Date() } },
          { upsert: true }
        );
        console.log('[PAIR] Credentials updated');
      } catch (err) {
        console.error('[PAIR] Failed to save creds:', err);
      }
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, qr } = update;
      console.log('[PAIR] Connection:', connection);
      
      if (connection === 'close') {
        clearTimeout(pairingInfo.timeout);
        pendingPairing.delete(cleanPhone);
      }

      if (connection === 'open') {
        console.log('[PAIR] Connected!');
        clearTimeout(pairingInfo.timeout);
        pendingPairing.delete(cleanPhone);
        connectedDevices.set(cleanPhone, { phone: fullPhone, connected: true });
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (!sock.authState?.creds) {
      throw new Error('Socket initialization failed');
    }

    const code = await (sock as any).requestPairingCode(fullPhone);
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

    console.log('[PAIR] Code generated:', formattedCode);

    return NextResponse.json({ 
      success: true, 
      pairingCode: formattedCode,
      phone: fullPhone
    });

  } catch (error: any) {
    console.error('[PAIR] Error:', error.message);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate pairing code' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    pending: Array.from(pendingPairing.keys()),
    connected: Array.from(connectedDevices.entries()).map(([phone, data]) => ({ phone, connected: data.connected }))
  });
}
