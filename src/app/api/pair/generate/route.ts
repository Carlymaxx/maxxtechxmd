import { NextResponse } from 'next/server';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

// Store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; timestamp: number }>();

// Store for bot socket
let botSocket: any = null;

// Initialize bot socket
async function initBotSocket() {
  if (botSocket && botSocket.ws?.readyState === 1) {
    return botSocket;
  }

  const authPath = path.join(process.cwd(), 'auth_info_baileys');
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  botSocket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  botSocket.ev.on('creds.update', saveCreds);

  return botSocket;
}

export async function POST(request: Request) {
  try {
    const { number } = await request.json();

    // Validate phone number
    if (!number || !/^\d{6,15}$/.test(number)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Please enter 6-15 digits without spaces or special characters.' },
        { status: 400 }
      );
    }

    // Generate 8-digit code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Store code with timestamp (expires in 10 minutes)
    verificationCodes.set(number, {
      code,
      timestamp: Date.now(),
    });

    // Initialize bot socket
    const sock = await initBotSocket();

    // Send code via WhatsApp
    const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
    const message = `🔐 *MAXX-XMD VERIFICATION CODE*\n\nYour verification code is: *${code}*\n\nThis code will expire in 10 minutes.\n\n⚠️ Do not share this code with anyone.`;

    await sock.sendMessage(jid, { text: message });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your WhatsApp!',
    });
  } catch (error: any) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code. Please make sure the bot is connected.' },
      { status: 500 }
    );
  }
}

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expiryTime = 10 * 60 * 1000; // 10 minutes

  for (const [number, data] of verificationCodes.entries()) {
    if (now - data.timestamp > expiryTime) {
      verificationCodes.delete(number);
    }
  }
}, 5 * 60 * 1000);

// Export the verification codes map for use in verify route
export { verificationCodes };
