'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [botStatus, setBotStatus] = useState<'unknown' | 'ready' | 'initializing'>('unknown');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const checkBotStatus = async () => {
    try {
      const response = await fetch('/api/bot');
      const data = await response.json();
      setBotStatus(data.status);
      setMessage(data.message);
    } catch (error) {
      setMessage('Failed to check bot status');
    }
  };

  useEffect(() => {
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const startBot = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await response.json();
      setMessage(data.message || data.error);
      setTimeout(checkBotStatus, 2000);
    } catch (error) {
      setMessage('Failed to start bot');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !messageText) return;

    setSendLoading(true);
    try {
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          number: phoneNumber,
          message: messageText,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setMessageText('');
        alert('Message sent successfully!');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🤖 WhatsApp Bot Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Control and monitor your WhatsApp bot
          </p>
          
          {/* Navigation Links */}
          <div className="mt-6 flex gap-4 justify-center">
            <a
              href="/pair"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Session
            </a>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bot Status</h2>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  botStatus === 'ready'
                    ? 'bg-green-500'
                    : botStatus === 'initializing'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {botStatus}
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{message}</p>

          <button
            onClick={startBot}
            disabled={loading || botStatus === 'ready'}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Starting...' : botStatus === 'ready' ? 'Bot Running' : 'Start Bot'}
          </button>

          {botStatus === 'initializing' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> Check your terminal/console for the QR code.
                Scan it with WhatsApp to authenticate the bot.
              </p>
            </div>
          )}
        </div>

        {/* Send Message Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Message</h2>
          
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (with country code)
              </label>
              <input
                id="phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 1234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={botStatus !== 'ready'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter number without + or spaces (e.g., 1234567890 for +1 234-567-890)
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                disabled={botStatus !== 'ready'}
              />
            </div>

            <button
              type="submit"
              disabled={sendLoading || botStatus !== 'ready' || !phoneNumber || !messageText}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {sendLoading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Bot Commands Info */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Bot Commands</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-sm text-green-600 font-semibold">/start</span>
              <span className="text-sm text-gray-600">Show welcome message and available commands</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-sm text-green-600 font-semibold">/help</span>
              <span className="text-sm text-gray-600">Display help information</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-sm text-green-600 font-semibold">/info</span>
              <span className="text-sm text-gray-600">Get bot information and status</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-sm text-green-600 font-semibold">/ping</span>
              <span className="text-sm text-gray-600">Check if bot is responsive</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-sm text-green-600 font-semibold">/time</span>
              <span className="text-sm text-gray-600">Get current date and time</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> The bot will automatically respond to messages sent to your WhatsApp number.
              Try sending any of these commands from WhatsApp!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
