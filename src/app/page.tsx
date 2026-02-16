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
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [hasQR, setHasQR] = useState(false);

  const startMain = async () => {
    try {
      const res = await fetch('/api/start-bot', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Main bot starting... QR code will appear shortly');
        setTimeout(fetchData, 3000);
      } else {
        showToast('error', data.error || 'Failed to start');
      }
    } catch {
      showToast('error', 'Connection failed');
    }
  };

  useEffect(() => {
    if (mainConnected) {
      setQrImage(null);
      setHasQR(false);
      return;
    }

    const checkQR = async () => {
      try {
        const statusRes = await fetch('/api/status');
        const statusData = await statusRes.json();
        if (statusData.hasQR) {
          setHasQR(true);
          const qrRes = await fetch('/api/qr');
          const qrData = await qrRes.json();
          if (qrData.qr) {
            setQrImage(qrData.qr);
          }
        } else {
          setHasQR(false);
          setQrImage(null);
        }
      } catch {}
    };

    checkQR();
    const interval = setInterval(checkQR, 5000);
    return () => clearInterval(interval);
  }, [mainConnected]);

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

          {mainConnected ? (
            <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3 text-center">
              <p className="text-sm text-emerald-400">Bot is online and ready</p>
            </div>
          ) : qrImage ? (
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 flex items-center justify-center">
                <img src={qrImage} alt="WhatsApp QR Code" className="w-full max-w-[260px]" />
              </div>
              <p className="text-sm text-gray-400 text-center">Open WhatsApp &gt; Linked Devices &gt; Link a Device &gt; Scan this QR code</p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                QR refreshes automatically
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={startMain} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
                Start Main Bot
              </button>
              {hasQR && (
                <p className="text-xs text-gray-500 text-center">Loading QR code...</p>
              )}
            </div>
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
  const [pairingCode, setPairingCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(pairingCode.replace(/-/g, ''));
      setCopied(true);
      showToast('success', 'Code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = pairingCode.replace(/-/g, '');
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      showToast('success', 'Code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      showToast('success', 'Session ID copied!');
    } catch {
      showToast('error', 'Failed to copy');
    }
  };

  const requestPairing = async () => {
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    if (!cleanNumber || cleanNumber.length < 6) {
      showToast('error', 'Enter a valid WhatsApp number with country code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: cleanNumber })
      });
      const data = await res.json();
      if (data.error) {
        showToast('error', data.error);
      } else {
        setPairingCode(data.pairingCode);
        setSessionId(data.sessionId);
        setStep('code');
        setShowPopup(true);
      }
    } catch {
      showToast('error', 'Connection failed');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (step !== 'code' || !sessionId) return;

    let elapsed = 0;
    const interval = setInterval(async () => {
      elapsed += 3;
      try {
        const res = await fetch(`/api/pair/status/${sessionId}`);
        const data = await res.json();
        if (data.connected) {
          setStep('done');
          setShowPopup(false);
          showToast('success', 'WhatsApp linked successfully!');
          clearInterval(interval);
        } else if (data.status === 'failed' || data.status === 'disconnected') {
          showToast('error', 'Pairing failed. Please try again.');
          setStep('phone');
          setPairingCode('');
          setSessionId('');
          setShowPopup(false);
          clearInterval(interval);
        }
      } catch {}
      if (elapsed >= 120) {
        showToast('error', 'Pairing timed out. Please try again.');
        setStep('phone');
        setPairingCode('');
        setSessionId('');
        setShowPopup(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, sessionId, showToast]);

  const steps = [
    { key: 'phone', label: 'Enter Number' },
    { key: 'code', label: 'Link Device' },
    { key: 'done', label: 'Complete' },
  ];
  const currentIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {showPopup && pairingCode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPopup(false)}>
          <div className="w-full max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="bg-[#1f2c34] rounded-2xl overflow-hidden shadow-2xl border border-[#2a3942]">
              <div className="bg-[#00a884] px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-base">MAXX-XMD</p>
                  <p className="text-white/70 text-xs">Pairing Code Ready</p>
                </div>
                <button onClick={() => setShowPopup(false)} className="ml-auto text-white/70 hover:text-white text-xl leading-none">&times;</button>
              </div>

              <div className="px-5 py-6 space-y-4">
                <div className="bg-[#0b141a] rounded-xl p-5 text-center space-y-3">
                  <p className="text-[#8696a0] text-xs uppercase tracking-widest">Your MAXX-XMD Code</p>
                  <p className="text-3xl font-mono font-bold text-[#00a884] tracking-[0.35em] select-all">{pairingCode}</p>
                  <button
                    onClick={copyCode}
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${copied ? 'bg-[#00a884] text-white' : 'bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30'}`}
                  >
                    {copied ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Code</>
                    )}
                  </button>
                </div>

                <div className="bg-[#0b141a] rounded-xl p-4 space-y-2.5">
                  <p className="text-white text-sm font-medium">Enter this code in WhatsApp:</p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="text-[#00a884] font-bold text-sm mt-0.5">1.</span>
                      <p className="text-[#8696a0] text-sm">Open <span className="text-white">WhatsApp</span> on your phone</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#00a884] font-bold text-sm mt-0.5">2.</span>
                      <p className="text-[#8696a0] text-sm">Go to <span className="text-white">Linked Devices</span></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#00a884] font-bold text-sm mt-0.5">3.</span>
                      <p className="text-[#8696a0] text-sm">Tap <span className="text-white">Link a Device</span></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#00a884] font-bold text-sm mt-0.5">4.</span>
                      <p className="text-[#8696a0] text-sm">Tap <span className="text-[#00a884]">&quot;Link with phone number&quot;</span></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#00a884] font-bold text-sm mt-0.5">5.</span>
                      <p className="text-[#8696a0] text-sm">Paste or type the <span className="text-white">code above</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-[#8696a0]">
                  <span className="w-4 h-4 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                  Waiting for you to link...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Pair Your WhatsApp</h2>
        <p className="text-sm text-gray-400 mb-6">Link your WhatsApp to get your own MAXX-XMD bot session</p>

        {!mainConnected && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-300">The main bot must be connected first. Go to Dashboard and start the bot.</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${currentIndex >= i ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                {currentIndex > i ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${currentIndex > i ? 'bg-emerald-600' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Your WhatsApp Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 254700000000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                onKeyDown={e => e.key === 'Enter' && requestPairing()}
              />
              <p className="text-xs text-gray-500 mt-1">Country code + number, no + or spaces</p>
            </div>
            <button
              onClick={requestPairing}
              disabled={loading || !mainConnected}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating code...
                </span>
              ) : 'Get Pairing Code'}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-5">
            <div className="bg-gray-800 rounded-xl p-6 text-center space-y-3">
              <p className="text-sm text-gray-400">Your MAXX-XMD Pairing Code</p>
              <p className="text-4xl font-mono font-bold text-emerald-400 tracking-[0.3em] select-all">{pairingCode}</p>
              <button
                onClick={copyCode}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'}`}
              >
                {copied ? 'Copied!' : 'Copy MAXX-XMD Code'}
              </button>
            </div>

            <button
              onClick={() => setShowPopup(true)}
              className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Show WhatsApp Instructions
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Waiting for you to enter the code...
            </div>

            <button
              onClick={() => { setStep('phone'); setPairingCode(''); setSessionId(''); setShowPopup(false); }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancel & Start Over
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-semibold text-white">Linked Successfully!</h3>
            <p className="text-sm text-gray-400">Your WhatsApp is now connected to MAXX-XMD</p>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Your Session ID</p>
              <p className="text-emerald-400 font-mono text-sm break-all select-all mb-2">{sessionId}</p>
              <button
                onClick={copySessionId}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-all"
              >
                Copy Session ID
              </button>
            </div>
            <p className="text-sm text-gray-400">Your session ID was also sent to your WhatsApp via the main bot.</p>
            <button
              onClick={() => { setStep('phone'); setPhone(''); setPairingCode(''); setSessionId(''); }}
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
