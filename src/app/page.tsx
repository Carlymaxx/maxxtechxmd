'use client';

import { useState, useEffect, useCallback } from 'react';

interface Session {
  id: string;
  status: string;
  connected: boolean;
}

interface BotInfo {
  botName: string;
  owner: string;
  developer: string;
  prefix: string;
  activeSessions: number;
  uptime: number;
}

type Tab = 'dashboard' | 'sessions' | 'send' | 'pair';

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [mainConnected, setMainConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, sessionsRes, infoRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/sessions'),
        fetch('/api/info')
      ]);
      const statusData = await statusRes.json();
      const sessionsData = await sessionsRes.json();
      const infoData = await infoRes.json();

      setMainConnected(statusData.connected);
      setSessions(sessionsData.sessions || []);
      setBotInfo(infoData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function formatUptime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  }

  const connectedCount = sessions.filter(s => s.connected).length;

  return (
    <div className="min-h-screen bg-gray-950">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg animate-fade-in text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${mainConnected ? 'bg-emerald-600 glow-green' : 'bg-gray-700'}`}>
              M
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">MAXX-XMD</h1>
              <p className="text-xs text-gray-400">WhatsApp Bot Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${mainConnected ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700' : 'bg-red-900/50 text-red-400 border border-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${mainConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {mainConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([
            { key: 'dashboard', label: 'Dashboard', icon: '📊' },
            { key: 'sessions', label: 'Sessions', icon: '🔗' },
            { key: 'send', label: 'Send Message', icon: '✉️' },
            { key: 'pair', label: 'Pair Device', icon: '📱' },
          ] as { key: Tab; label: string; icon: string }[]).map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === item.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <DashboardTab botInfo={botInfo} sessions={sessions} connectedCount={connectedCount} mainConnected={mainConnected} fetchData={fetchData} showToast={showToast} />}
            {tab === 'sessions' && <SessionsTab sessions={sessions} fetchData={fetchData} showToast={showToast} />}
            {tab === 'send' && <SendTab sessions={sessions} showToast={showToast} />}
            {tab === 'pair' && <PairTab mainConnected={mainConnected} showToast={showToast} />}
          </>
        )}
      </main>
    </div>
  );
}

function DashboardTab({ botInfo, sessions, connectedCount, mainConnected, fetchData, showToast }: {
  botInfo: BotInfo | null;
  sessions: Session[];
  connectedCount: number;
  mainConnected: boolean;
  fetchData: () => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const startMain = async () => {
    try {
      const res = await fetch('/api/start-bot', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Main bot starting...');
        setTimeout(fetchData, 3000);
      } else {
        showToast('error', data.error || 'Failed to start');
      }
    } catch {
      showToast('error', 'Connection failed');
    }
  };

  const stats = [
    { label: 'Total Sessions', value: sessions.length, icon: '🔗', color: 'text-cyan-400' },
    { label: 'Connected', value: connectedCount, icon: '✅', color: 'text-emerald-400' },
    { label: 'Disconnected', value: sessions.length - connectedCount, icon: '❌', color: 'text-red-400' },
    { label: 'Uptime', value: botInfo ? formatUptime(botInfo.uptime) : '--', icon: '⏱️', color: 'text-amber-400' },
  ];

  function formatUptime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Main Bot Status</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-4 h-4 rounded-full ${mainConnected ? 'bg-emerald-400 glow-green' : 'bg-red-400'}`} />
            <span className="text-gray-300">{mainConnected ? 'Connected and running' : 'Disconnected'}</span>
          </div>
          {!mainConnected && (
            <button onClick={startMain} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
              Start Main Bot
            </button>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Bot Information</h2>
          {botInfo && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-white font-medium">{botInfo.botName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Owner</span>
                <span className="text-white font-medium">{botInfo.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prefix</span>
                <span className="text-cyan-400 font-mono">{botInfo.prefix}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Developer</span>
                <span className="text-white font-medium">{botInfo.developer}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Available Commands</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { cmd: '.ping', desc: 'Check bot response' },
            { cmd: '.menu', desc: 'Show command menu' },
            { cmd: '.botinfo', desc: 'Bot information' },
            { cmd: '.sticker', desc: 'Create sticker' },
            { cmd: '.toimg', desc: 'Convert sticker to image' },
            { cmd: '.antilink', desc: 'Group antilink toggle' },
          ].map(c => (
            <div key={c.cmd} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
              <span className="bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded font-mono text-sm font-medium">{c.cmd}</span>
              <span className="text-gray-400 text-sm">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionsTab({ sessions, fetchData, showToast }: {
  sessions: Session[];
  fetchData: () => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const createSession = async () => {
    if (!newName.trim()) {
      showToast('error', 'Enter a session name');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Session "${newName}" created`);
        setNewName('');
        fetchData();
      } else {
        showToast('error', data.error || 'Failed to create');
      }
    } catch {
      showToast('error', 'Connection failed');
    }
    setCreating(false);
  };

  const startSession = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/sessions/${id}/start`, { method: 'POST' });
      const data = await res.json();
      if (data.success) showToast('success', `Session "${id}" starting...`);
      else showToast('error', data.error || 'Failed');
      setTimeout(fetchData, 2000);
    } catch {
      showToast('error', 'Connection failed');
    }
    setActionLoading(null);
  };

  const stopSession = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/sessions/${id}/stop`, { method: 'POST' });
      const data = await res.json();
      if (data.success) showToast('success', `Session "${id}" stopped`);
      else showToast('error', data.error || 'Failed');
      fetchData();
    } catch {
      showToast('error', 'Connection failed');
    }
    setActionLoading(null);
  };

  const deleteSession = async (id: string) => {
    if (!confirm(`Delete session "${id}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) showToast('success', `Session "${id}" deleted`);
      else showToast('error', data.error || 'Failed');
      fetchData();
    } catch {
      showToast('error', 'Connection failed');
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Create New Session</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Session name (e.g. my-bot)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            onKeyDown={e => e.key === 'Enter' && createSession()}
          />
          <button
            onClick={createSession}
            disabled={creating}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {creating ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Active Sessions ({sessions.length})</h2>
        </div>

        {sessions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No sessions yet. Create one above to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sessions.map(session => (
              <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${session.connected ? 'bg-emerald-400' : session.status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`} />
                  <div>
                    <p className="text-white font-medium">{session.id}</p>
                    <p className="text-xs text-gray-400 capitalize">{session.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {actionLoading === session.id ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {!session.connected ? (
                        <button onClick={() => startSession(session.id)} className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-md transition-colors">
                          Start
                        </button>
                      ) : (
                        <button onClick={() => stopSession(session.id)} className="text-xs bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 px-3 py-1.5 rounded-md transition-colors">
                          Stop
                        </button>
                      )}
                      <button onClick={() => deleteSession(session.id)} className="text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-md transition-colors">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SendTab({ sessions, showToast }: {
  sessions: Session[];
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [selectedSession, setSelectedSession] = useState('main');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const connectedSessions = sessions.filter(s => s.connected);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) {
      showToast('error', 'Enter both phone number and message');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSession}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phone.trim(), message: message.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Message sent!');
        setMessage('');
      } else {
        showToast('error', data.error || 'Failed to send');
      }
    } catch {
      showToast('error', 'Connection failed');
    }
    setSending(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Send WhatsApp Message</h2>

        {connectedSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-3">📵</p>
            <p>No connected sessions. Start a session first to send messages.</p>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Send via Session</label>
              <select
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {connectedSessions.map(s => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Phone Number (with country code)</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 254700000000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="Type your message here..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PairTab({ mainConnected, showToast }: {
  mainConnected: boolean;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify' | 'done'>('phone');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCode = async () => {
    if (!phone.trim()) {
      showToast('error', 'Enter your WhatsApp number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phone.trim() })
      });
      const data = await res.json();
      if (data.error) {
        showToast('error', data.error);
      } else {
        showToast('success', 'Code sent to your WhatsApp!');
        setStep('verify');
      }
    } catch {
      showToast('error', 'Connection failed');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      showToast('error', 'Enter the verification code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phone.trim(), code: code.trim() })
      });
      const data = await res.json();
      if (data.error) {
        showToast('error', data.error);
      } else {
        showToast('success', 'Device paired successfully!');
        setSessionId(data.sessionId);
        setStep('done');
      }
    } catch {
      showToast('error', 'Connection failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Pair WhatsApp Device</h2>
        <p className="text-sm text-gray-400 mb-6">Link your WhatsApp number without scanning a QR code</p>

        {!mainConnected && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-300">The main bot needs to be connected before you can pair devices. Go to Dashboard and start the bot first.</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          {['phone', 'verify', 'done'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s || ['phone', 'verify', 'done'].indexOf(step) > i ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 ${['phone', 'verify', 'done'].indexOf(step) > i ? 'bg-emerald-600' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">WhatsApp Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 254700000000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Include country code without + sign</p>
            </div>
            <button
              onClick={generateCode}
              disabled={loading || !mainConnected}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-300">A 6-digit code was sent to</p>
              <p className="text-lg font-mono text-emerald-400 mt-1">{phone}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-center text-xl tracking-widest font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('phone')} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors">
                Back
              </button>
              <button
                onClick={verifyCode}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-semibold text-white">Paired Successfully!</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Your Session ID</p>
              <p className="text-emerald-400 font-mono text-sm break-all">{sessionId}</p>
            </div>
            <p className="text-sm text-gray-400">This session ID was also sent to your WhatsApp.</p>
            <button
              onClick={() => { setStep('phone'); setPhone(''); setCode(''); setSessionId(''); }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Pair Another Device
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
