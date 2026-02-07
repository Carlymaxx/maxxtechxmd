import { NextResponse } from 'next/server';
import { getWhatsAppBot } from '@/lib/whatsapp-bot';

export async function GET() {
  try {
    const bot = getWhatsAppBot();
    const isReady = bot.isClientReady();

    return NextResponse.json({
      status: isReady ? 'ready' : 'initializing',
      message: isReady
        ? 'Bot is ready and connected'
        : 'Bot is initializing, please wait...',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get bot status', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, number, message } = body;

    const bot = getWhatsAppBot();

    switch (action) {
      case 'start':
        await bot.initialize();
        return NextResponse.json({
          success: true,
          message: 'Bot initialization started. Check console for QR code.',
        });

      case 'send':
        if (!number || !message) {
          return NextResponse.json(
            { error: 'Number and message are required' },
            { status: 400 }
          );
        }

        await bot.sendMessage(number, message);
        return NextResponse.json({
          success: true,
          message: 'Message sent successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "start" or "send"' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request', details: String(error) },
      { status: 500 }
    );
  }
}
