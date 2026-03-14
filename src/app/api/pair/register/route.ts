import { NextResponse } from 'next/server';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { existsSync, mkdirSync } from 'fs';

const SESSION_DIR = process.env.RENDER ? '/app/sessions' : './sessions';

function ensureSessionDir() {
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true });
  }
}

interface PairingSession {
  phone: string;
  socket: any;
  connected: boolean;
  pairingCode?: string;
}

const activeSessions: Map<string, PairingSession> = new Map();

export async function POST(request: Request) {
  try {
    ensureSessionDir();
    
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

    const { state, saveCreds } = await useMultiFileAuthState(`${SESSION_DIR}/${cleanPhone}`);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['MaxX Tech', 'Chrome', '120.0.0'],
      logger: console as any,
    });

    const sessionData: PairingSession = { 
      phone: cleanPhone, 
      socket: sock, 
      connected: false 
    };
    activeSessions.set(cleanPhone, sessionData);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('QR received');
      }

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
