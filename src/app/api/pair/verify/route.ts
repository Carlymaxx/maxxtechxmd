import { NextResponse } from 'next/server';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

// Import verification codes from generate route
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
    const { number, code } = await request.json();

    // Validate inputs
    if (!number || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required.' },
        { status: 400 }
      );
    }

    // Check if code exists and is valid
    const storedData = verificationCodes.get(number);
    if (!storedData) {
      return NextResponse.json(
        { error: 'No verification code found for this number. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if code matches
    if (storedData.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Check if code is expired (10 minutes)
    const expiryTime = 10 * 60 * 1000;
    if (Date.now() - storedData.timestamp > expiryTime) {
      verificationCodes.delete(number);
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `MAXX-XMD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Create session directory
    const sessionPath = path.join(process.cwd(), 'sessions', sessionId);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Create new session with Baileys
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const newSocket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
    });

    newSocket.ev.on('creds.update', saveCreds);

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);

      newSocket.ev.on('connection.update', async (update) => {
        const { connection } = update;

        if (connection === 'open') {
          clearTimeout(timeout);

          // Send session ID to user's WhatsApp
          const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
          const message = `✅ *MAXX-XMD SESSION CREATED!*\n\n📱 Your Session ID:\n\`\`\`${sessionId}\`\`\`\n\n⚠️ *IMPORTANT:*\n• Keep this Session ID private\n• Use it to connect your bot\n• Valid for 24 hours\n\n🔐 To use this session, add it to your config:\n\`SESSION_ID: "${sessionId}"\``;

          try {
            await newSocket.sendMessage(jid, { text: message });
          } catch (err) {
            console.error('Error sending session ID:', err);
          }

          resolve(true);
        }

        if (connection === 'close') {
          clearTimeout(timeout);
          reject(new Error('Connection closed'));
        }
      });
    });

    // Remove used verification code
    verificationCodes.delete(number);

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session created successfully! Session ID has been sent to your WhatsApp.',
    });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Failed to create session. Please try again.' },
      { status: 500 }
    );
  }
}
