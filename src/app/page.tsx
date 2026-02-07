export default function Home() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 MAXX-XMD WhatsApp Bot
          </h1>
          <p className="text-gray-600">
            Link your WhatsApp and manage your bot
          </p>
        </div>

        {/* Navigation Links */}
        <div className="space-y-4">
          <a
            href={`${origin}/dashboard.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            🔗 Link WhatsApp Number
          </a>
          
          <a
            href={`${origin}/dashboard.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            📊 Full Dashboard
          </a>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Note:</strong> Make sure the bot server is running.
            <br />
            The dashboard will show the bot status automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
