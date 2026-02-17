'use client';

import { useState, useEffect, useCallback } from 'react';

export default function PairPage() {
  const [phone, setPhone] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

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
    <div className="min-h-screen bg-[#0b141a] flex flex-col items-center justify-center p-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00a884]/20 mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#00a884"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">MAXX-XMD</h1>
          <p className="text-[#8696a0] text-sm mt-1">Link your WhatsApp to get your own bot</p>
        </div>

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

        <div className="bg-[#1f2c34] border border-[#2a3942] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${currentIndex >= i ? 'bg-[#00a884] text-white' : 'bg-[#2a3942] text-[#8696a0]'}`}>
                  {currentIndex > i ? '✓' : i + 1}
                </div>
                <p className="text-xs text-[#8696a0] hidden sm:block">{s.label}</p>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${currentIndex > i ? 'bg-[#00a884]' : 'bg-[#2a3942]'}`} />}
              </div>
            ))}
          </div>

          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#8696a0] mb-1.5">Your WhatsApp Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 254700000000"
                  className="w-full bg-[#0b141a] border border-[#2a3942] rounded-lg px-4 py-3 text-white placeholder-[#8696a0]/50 focus:outline-none focus:border-[#00a884] transition-colors"
                  onKeyDown={e => e.key === 'Enter' && requestPairing()}
                />
                <p className="text-xs text-[#8696a0] mt-1">Country code + number, no + or spaces</p>
              </div>
              <button
                onClick={requestPairing}
                disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#00a884]/90 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
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
              <div className="bg-[#0b141a] rounded-xl p-6 text-center space-y-3">
                <p className="text-sm text-[#8696a0]">Your MAXX-XMD Pairing Code</p>
                <p className="text-4xl font-mono font-bold text-[#00a884] tracking-[0.3em] select-all">{pairingCode}</p>
                <button
                  onClick={copyCode}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-[#00a884] text-white' : 'bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30'}`}
                >
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <button
                onClick={() => setShowPopup(true)}
                className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Show WhatsApp Instructions
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-[#8696a0]">
                <span className="w-4 h-4 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                Waiting for you to enter the code...
              </div>

              <button
                onClick={() => { setStep('phone'); setPairingCode(''); setSessionId(''); setShowPopup(false); }}
                className="w-full bg-[#2a3942] hover:bg-[#2a3942]/80 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Cancel & Start Over
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl mb-2">🎉</div>
                <h3 className="text-xl font-semibold text-white">Linked Successfully!</h3>
                <p className="text-sm text-[#8696a0] mt-1">Your WhatsApp is now connected to MAXX-XMD</p>
              </div>
              <div className="bg-[#0b141a] rounded-lg p-4 text-center">
                <p className="text-xs text-[#8696a0] mb-1">Your Session ID</p>
                <p className="text-[#00a884] font-mono text-xs break-all select-all mb-2 max-h-20 overflow-y-auto">{sessionId}</p>
                <button
                  onClick={copySessionId}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30 transition-all"
                >
                  Copy Session ID
                </button>
              </div>
              <div className="bg-[#00a884]/10 border border-[#00a884]/30 rounded-lg p-4">
                <p className="text-sm text-[#00a884] font-semibold mb-2">Your deployable Session ID was sent to your WhatsApp!</p>
                <p className="text-xs text-[#8696a0]">Check your WhatsApp for the full session ID with deployment instructions.</p>
              </div>
              <div className="bg-[#0b141a] rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-white">Deploy Your Bot:</p>
                <div className="text-xs text-[#8696a0] space-y-1">
                  <p>1. Fork the repo: <a href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank" className="text-[#00a884] hover:underline">github.com/Carlymaxx/maxxtechxmd</a></p>
                  <p>2. Set SESSION_ID environment variable with the ID from your WhatsApp</p>
                  <p>3. Deploy on Render, Heroku, Railway, Koyeb, or Replit</p>
                </div>
              </div>
              <button
                onClick={() => { setStep('phone'); setPhone(''); setPairingCode(''); setSessionId(''); }}
                className="w-full bg-[#2a3942] hover:bg-[#2a3942]/80 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Pair Another Device
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[#8696a0] text-xs mt-6">
          Powered by <span className="text-[#00a884] font-semibold">MAXX-XMD</span> &bull; <a href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank" className="text-[#00a884] hover:underline">GitHub</a>
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
