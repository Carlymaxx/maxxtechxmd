import { NextResponse } from 'next/server';
import makeWASocket, { initAuthCreds } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

function createAuthDir(phone: string): string {
  const authDir = path.join(process.cwd(), 'auth', phone);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

function loadOrCreateCreds(phone: string) {
  const authDir = createAuthDir(phone);
  const credsFile = path.join(authDir, 'creds.json');
  
  let creds = initAuthCreds();
  
  if (fs.existsSync(credsFile)) {
    try {
      const data = fs.readFileSync(credsFile, 'utf-8');
      creds = { ...creds, ...JSON.parse(data) };
    } catch (e) {
      console.log('[CREDS] Failed to load, using new');
    }
  }
  
  return creds;
}

function saveCreds(phone: string, creds: any) {
  const authDir = createAuthDir(phone);
  const credsFile = path.join(authDir, 'creds.json');
  fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2));
}

export async function POST(request: Request) {
  let sock: any = null;
  
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    console.log('[PAIR] Generating code for:', fullPhone);

    const creds = loadOrCreateCreds(cleanPhone);

    sock = makeWASocket({
      auth: {
        creds,
        keys: {
          get: async () => ({}),
          set: async () => {}
        }
      },
      printQRInTerminal: false,
      browser: ['MAXX-XMD', 'Chrome', '120.0.0'],
    });

    sock.ev.on('creds.update', (newCreds: any) => {
      const updated = { ...creds, ...newCreds };
      saveCreds(cleanPhone, updated);
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const code = await sock.requestPairingCode(fullPhone);
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
  } finally {
    if (sock) {
      try { sock.end(undefined); } catch {}
    }
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
