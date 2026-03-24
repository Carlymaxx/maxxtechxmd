import { useState, useEffect, useRef } from "react";
import { useRequestPairing, useGetPairingStatus } from "@workspace/api-client-react";
import {
  Smartphone, Copy, CheckCircle2, ShieldCheck,
  AlertCircle, Zap, Loader2, ExternalLink, Terminal,
} from "lucide-react";

const PLATFORMS = [
  { name: "Heroku",   url: "https://heroku.com",     icon: "🟣", badge: "Popular" },
  { name: "Railway",  url: "https://railway.app",    icon: "🚂", badge: "Easy" },
  { name: "Koyeb",    url: "https://koyeb.com",      icon: "⚡", badge: "Free" },
  { name: "Render",   url: "https://render.com",     icon: "🌐", badge: "Stable" },
  { name: "Replit",   url: "https://replit.com",     icon: "🔵", badge: "Dev" },
  { name: "Cyclic",   url: "https://cyclic.sh",      icon: "♻️", badge: "Light" },
];

const FEATURES = [
  "⚡ 200+ Commands",
  "🤖 AI Chat",
  "🎵 Music & Video",
  "📸 Image Gen",
  "🛡️ Group Admin",
  "🎮 Fun & Games",
  "🔄 Converters",
  "💬 Auto Reply",
];

const G = "#00ff88";
const DIM = "rgba(0,255,136,.06)";
const BORDER = "rgba(0,255,136,.18)";
const BORDER_LO = "rgba(0,255,136,.1)";
const MONO = "'Share Tech Mono', 'Courier New', monospace";

function css(obj: Record<string, any>): any { return obj; }

export default function LinkPage() {
  const [number, setNumber]         = useState("");
  const [error, setError]           = useState("");
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [code, setCode]             = useState<string | null>(null);
  const [countdown, setCountdown]   = useState(120);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSid, setCopiedSid]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pairMut = useRequestPairing({
    mutation: {
      onSuccess(data) {
        setCode(data.pairingCode ?? null);
        setSessionId(data.sessionId ?? null);
        setError("");
        setCountdown(120);
      },
      onError(err: any) {
        setError(err?.data?.error || err?.message || "Failed to generate code. Please try again.");
      },
    },
  });

  const { data: status } = useGetPairingStatus(sessionId ?? "", {
    query: {
      enabled: !!sessionId,
      refetchInterval: (q) => (q.state.data?.connected ? false : 2000),
    },
  });

  useEffect(() => {
    if (!code || status?.connected || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [code, status?.connected, countdown]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = number.replace(/[^0-9]/g, "");
    if (!/^\d{10,15}$/.test(cleaned)) {
      setError("Enter country code + number, no + or spaces. E.g. 254700000000");
      return;
    }
    setError("");
    pairMut.mutate({ data: { number: cleaned } });
  }

  function reset() {
    setNumber(""); setCode(null); setSessionId(null); setError("");
    setCopiedCode(false); setCopiedSid(false); setCountdown(120);
    pairMut.reset();
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code.replace(/-/g, ""));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  }

  function copySid() {
    const sid = status?.deploySessionId;
    if (!sid) return;
    navigator.clipboard.writeText(sid);
    setCopiedSid(true);
    setTimeout(() => setCopiedSid(false), 2500);
  }

  const isConnected = !!status?.connected;
  const isLoading   = pairMut.isPending;
  const codeDigits  = code ? code.replace(/-/g, "").split("") : [];

  const codeColor = countdown > 40 ? G : countdown > 20 ? "#fbbf24" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "#030d06",
      backgroundImage: `linear-gradient(${DIM} 1px,transparent 1px),linear-gradient(90deg,${DIM} 1px,transparent 1px)`,
      backgroundSize: "36px 36px",
      color: "#e2e8f0", fontFamily: MONO }}>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes glow  { 0%,100%{box-shadow:0 0 20px rgba(0,255,136,.3)} 50%{box-shadow:0 0 40px rgba(0,255,136,.6)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeIn{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .digit-box { animation: fadeIn .35s ease forwards; }
        .platform-card:hover { transform:translateY(-3px) scale(1.03); box-shadow:0 8px 24px rgba(0,255,136,.15)!important; }
        .platform-card { transition: all .2s ease; }
        .copy-btn:hover { background:rgba(0,255,136,.1)!important; }
        .feature-pill { animation: fadeIn .4s ease forwards; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: `1px solid ${BORDER_LO}`, padding: "14px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(0,0,0,.4)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, background:"rgba(0,255,136,.12)",
            border:`1px solid rgba(0,255,136,.35)`, borderRadius:8,
            display:"flex", alignItems:"center", justifyContent:"center",
            animation:"glow 3s ease-in-out infinite" }}>
            <Zap size={17} color={G} />
          </div>
          <span style={{ color:G, fontWeight:700, fontSize:19, letterSpacing:2 }}>MAXX-XMD</span>
          <span style={{ color:"rgba(0,255,136,.35)", fontSize:11,
            borderLeft:`1px solid rgba(0,255,136,.12)`, paddingLeft:12, marginLeft:4,
            letterSpacing:2 }}>SESSION GENERATOR</span>
        </div>
        <a href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank" rel="noopener noreferrer"
          style={{ display:"flex", alignItems:"center", gap:5, fontSize:11,
            color:"rgba(0,255,136,.5)", textDecoration:"none",
            border:`1px solid rgba(0,255,136,.15)`, borderRadius:6, padding:"5px 10px" }}>
          <ExternalLink size={12} /> GitHub
        </a>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex:1, maxWidth:620, margin:"0 auto", width:"100%", padding:"40px 16px 80px" }}>

        {/* ═══════════════════════════════
            IDLE STATE — Show hero + form
        ═══════════════════════════════ */}
        {!code && !isConnected && (
          <>
            {/* Hero */}
            <div style={{ textAlign:"center", marginBottom:36 }}>
              {/* Bot logo with glow */}
              <div style={{ position:"relative", display:"inline-block", marginBottom:20, animation:"float 4s ease-in-out infinite" }}>
                <div style={{
                  width:100, height:100, margin:"0 auto",
                  borderRadius:22, border:`2px solid rgba(0,255,136,.4)`,
                  overflow:"hidden", background:"rgba(0,20,8,.8)",
                  boxShadow:"0 0 50px rgba(0,255,136,.3)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <img
                    src={`${import.meta.env.BASE_URL}images/bot-logo.png`}
                    alt="MAXX-XMD"
                    style={{ width:"85%", height:"85%", objectFit:"contain" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                      (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:40px">⚡</span>';
                    }}
                  />
                </div>
                <div style={{
                  position:"absolute", bottom:-6, right:-6,
                  background:G, color:"#000", fontSize:9, fontWeight:700,
                  padding:"2px 7px", borderRadius:20, letterSpacing:1,
                  animation:"pulse 2s infinite",
                }}>LIVE</div>
              </div>

              <h1 style={{ fontSize:"clamp(28px,6vw,38px)", fontWeight:700, color:"#fff", margin:"0 0 8px" }}>
                Get Your{" "}
                <span style={{ color:G, textShadow:`0 0 22px rgba(0,255,136,.5)` }}>
                  Session ID
                </span>
              </h1>
              <p style={{ color:"#6b7280", fontSize:14, margin:"0 0 20px", lineHeight:1.6 }}>
                The most powerful WhatsApp bot — 200+ commands, free to deploy.
                <br />Link your WhatsApp in 60 seconds and go live anywhere.
              </p>

              {/* Feature pills */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
                {FEATURES.map((f, i) => (
                  <span key={f} className="feature-pill" style={{
                    display:"inline-flex", alignItems:"center", gap:4,
                    background:"rgba(0,255,136,.07)", border:`1px solid rgba(0,255,136,.2)`,
                    color:G, fontSize:11, padding:"4px 10px", borderRadius:20,
                    animationDelay:`${i * 0.05}s`,
                  }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Form card */}
            <form onSubmit={submit} style={{
              width:"100%", background:"rgba(0,20,8,.75)",
              border:`1px solid ${BORDER}`, borderRadius:18,
              padding:"28px 24px",
              boxShadow:"0 4px 40px rgba(0,0,0,.4)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18,
                borderBottom:`1px solid ${BORDER_LO}`, paddingBottom:14 }}>
                <Smartphone size={15} color={G} />
                <span style={{ color:G, fontSize:11, letterSpacing:3, textTransform:"uppercase" }}>
                  Enter Your WhatsApp Number
                </span>
              </div>

              <div style={{ position:"relative" }}>
                <span style={{
                  position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                  color:`rgba(0,255,136,.5)`, fontSize:17, fontWeight:700,
                }}>+</span>
                <input
                  ref={inputRef}
                  type="tel"
                  placeholder="254700000000"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  style={{
                    width:"100%", boxSizing:"border-box",
                    background:"rgba(0,0,0,.55)", border:`1px solid rgba(0,255,136,.25)`,
                    borderRadius:11, padding:"15px 14px 15px 36px",
                    fontSize:20, color:"#fff", outline:"none",
                    letterSpacing:3, fontFamily:MONO,
                    transition:"border-color .2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(0,255,136,.6)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(0,255,136,.25)"}
                />
              </div>
              <p style={{ color:"#4b5563", fontSize:12, marginTop:7 }}>
                Country code + number, no spaces.&nbsp;
                <span style={{ color:"rgba(0,255,136,.6)" }}>E.g. 254700000000</span>
              </p>

              {error && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:8,
                  background:"rgba(127,0,0,.2)", border:"1px solid rgba(255,50,50,.3)",
                  borderRadius:9, padding:"10px 14px", marginTop:14 }}>
                  <AlertCircle size={14} color="#f87171" style={{ marginTop:2, flexShrink:0 }} />
                  <span style={{ color:"#f87171", fontSize:13 }}>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width:"100%", marginTop:18, padding:"16px",
                  background: isLoading ? "rgba(0,255,136,.4)" : G,
                  color:"#000", fontFamily:MONO, fontWeight:700, fontSize:15,
                  letterSpacing:1, border:"none", borderRadius:11,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow: isLoading ? "none" : "0 0 30px rgba(0,255,136,.4)",
                  transition:"all .2s",
                }}
              >
                {isLoading ? (
                  <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} /> Generating Code...</>
                ) : (
                  <><Zap size={18} /> Generate Pairing Code →</>
                )}
              </button>

              {/* Step list */}
              <div style={{ marginTop:22, borderTop:`1px solid ${BORDER_LO}`, paddingTop:18, display:"grid", gap:8 }}>
                {[
                  ["01", "Enter your WhatsApp number with country code"],
                  ["02", "Get your 8-digit pairing code instantly"],
                  ["03", "WhatsApp → Menu → Linked Devices → Link with phone number"],
                  ["04", "Enter the code — SESSION_ID sent to your WhatsApp"],
                  ["05", "Deploy on Heroku, Railway, Koyeb or any platform"],
                ].map(([n, t]) => (
                  <div key={n} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{
                      minWidth:24, height:24, borderRadius:"50%",
                      border:`1px solid rgba(0,255,136,.3)`, color:G,
                      fontSize:9, display:"flex", alignItems:"center", justifyContent:"center",
                      flexShrink:0, letterSpacing:0,
                    }}>{n}</span>
                    <span style={{ color:"#6b7280", fontSize:13, lineHeight:1.5, paddingTop:3 }}>{t}</span>
                  </div>
                ))}
              </div>
            </form>

            {/* Deploy platforms */}
            <div style={{ marginTop:32 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <Terminal size={14} color={G} />
                <span style={{ color:G, fontSize:11, letterSpacing:3, textTransform:"uppercase" }}>Deploy Your Bot</span>
                <div style={{ flex:1, height:1, background:BORDER_LO }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {PLATFORMS.map((p) => (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="platform-card"
                    style={{
                      display:"flex", flexDirection:"column", alignItems:"center",
                      padding:"16px 12px",
                      background:"rgba(0,20,8,.6)", border:`1px solid rgba(0,255,136,.12)`,
                      borderRadius:12, textDecoration:"none", cursor:"pointer", position:"relative",
                      boxShadow:"0 2px 12px rgba(0,0,0,.3)",
                    }}>
                    <span style={{ position:"absolute", top:7, right:8, fontSize:9,
                      color:"rgba(0,255,136,.4)", letterSpacing:1 }}>{p.badge}</span>
                    <span style={{ fontSize:26, marginBottom:6 }}>{p.icon}</span>
                    <span style={{ color:"#e2e8f0", fontSize:12, fontWeight:700, letterSpacing:1 }}>{p.name}</span>
                  </a>
                ))}
              </div>
              <div style={{
                marginTop:14, background:"rgba(0,20,8,.5)", border:`1px solid ${BORDER_LO}`,
                borderRadius:12, padding:"16px 18px",
              }}>
                <p style={{ color:G, fontSize:10, letterSpacing:2, marginBottom:10 }}>ENV VARIABLE SETUP</p>
                <div style={{ background:"rgba(0,0,0,.5)", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
                  <span style={{ color:"rgba(0,255,136,.8)", fontSize:12 }}>SESSION_ID</span>
                  <span style={{ color:"#6b7280", fontSize:12 }}>=MAXX-XMD~your_session_id_here</span>
                </div>
                <p style={{ color:"#4b5563", fontSize:11, marginBottom:0 }}>
                  Set this variable on your chosen platform after copying your session ID.{" "}
                  <a href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank" rel="noopener noreferrer"
                    style={{ color:"rgba(0,255,136,.6)" }}>Fork the repo →</a>
                </p>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════
            CODE STATE — digits display
        ═══════════════════════════════ */}
        {code && !isConnected && (
          <div style={{ width:"100%", animation:"fadeIn .4s ease" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <p style={{ color:`rgba(0,255,136,.6)`, fontSize:12, letterSpacing:3, margin:"0 0 4px", textTransform:"uppercase" }}>
                Waiting for WhatsApp link
              </p>
              <p style={{ color:"#4b5563", fontSize:12, margin:0 }}>
                Number: <span style={{ color:"#9ca3af" }}>{number.replace(/[^0-9]/g, "")}</span>
              </p>
            </div>

            {/* Code box */}
            <div style={{
              background:"rgba(0,20,8,.9)", border:`2px solid ${codeColor}`,
              borderRadius:18, padding:"32px 24px", textAlign:"center", marginBottom:14,
              boxShadow:`0 0 50px ${codeColor}22`,
              position:"relative",
            }}>
              {/* Countdown */}
              <div style={{ position:"absolute", top:14, right:16,
                display:"flex", alignItems:"center", gap:5, fontSize:13, color:codeColor }}>
                <div style={{ width:8, height:8, borderRadius:"50%",
                  background:codeColor, animation:"pulse 1s infinite" }} />
                {countdown}s
              </div>

              <p style={{ fontSize:10, color:"rgba(0,255,136,.45)", letterSpacing:4,
                textTransform:"uppercase", marginBottom:18 }}>Your Pairing Code</p>

              {/* Individual digit boxes */}
              <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginBottom:22 }}>
                {codeDigits.map((d, i) => (
                  <div key={i} className="digit-box" style={{
                    animationDelay:`${i * 0.06}s`,
                    width:44, height:58,
                    background:"rgba(0,0,0,.8)", border:`2px solid rgba(0,255,136,.45)`,
                    borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:26, fontWeight:900, color:"#fff",
                    boxShadow:"0 0 12px rgba(0,255,136,.12)",
                  }}>{d}</div>
                ))}
              </div>

              <button onClick={copyCode} className="copy-btn" style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"12px 28px", border:`1px solid rgba(0,255,136,.4)`, borderRadius:10,
                background: copiedCode ? "rgba(0,255,136,.12)" : "transparent",
                color:G, fontFamily:MONO, fontSize:14, fontWeight:700, cursor:"pointer",
                letterSpacing:1, transition:"all .2s",
              }}>
                {copiedCode ? <><CheckCircle2 size={16} /> COPIED!</> : <><Copy size={16} /> COPY CODE</>}
              </button>
            </div>

            {/* Instructions */}
            <div style={{ background:"rgba(0,20,8,.6)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"18px 20px", marginBottom:14 }}>
              <p style={{ color:G, fontSize:10, letterSpacing:3, marginBottom:12, textTransform:"uppercase" }}>
                How to enter in WhatsApp
              </p>
              {[
                "Open WhatsApp on your phone",
                "Tap the ⋮ menu → Linked Devices",
                'Tap "Link a Device"',
                '"Link with phone number instead"',
                "Type the 8-digit code exactly as shown above",
              ].map((t, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:7, fontSize:13, color:"#9ca3af" }}>
                  <span style={{ color:G, flexShrink:0, minWidth:16 }}>{i + 1}.</span> {t}
                </div>
              ))}
              <div style={{ marginTop:12, padding:"8px 12px", background:"rgba(251,191,36,.06)",
                border:"1px solid rgba(251,191,36,.2)", borderRadius:8 }}>
                <p style={{ color:"#fbbf24", fontSize:12, margin:0 }}>
                  ⚠ Code expires in ~2 minutes — enter it quickly!
                </p>
              </div>
            </div>

            <button onClick={reset} style={{
              width:"100%", padding:"12px", background:"transparent",
              border:`1px solid rgba(255,255,255,.08)`, borderRadius:10,
              color:"#4b5563", fontFamily:MONO, fontSize:13, cursor:"pointer",
            }}>↺ Start Over</button>
          </div>
        )}

        {/* ═══════════════════════════════
            CONNECTED — Session ID
        ═══════════════════════════════ */}
        {isConnected && (
          <div style={{ width:"100%", textAlign:"center", animation:"fadeIn .4s ease" }}>
            <div style={{
              width:90, height:90, margin:"0 auto 20px",
              background:"rgba(0,255,136,.12)", border:`2px solid rgba(0,255,136,.5)`,
              borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 0 50px rgba(0,255,136,.3), 0 0 100px rgba(0,255,136,.1)",
              animation:"glow 2s ease-in-out infinite",
            }}>
              <ShieldCheck size={44} color={G} />
            </div>

            <h2 style={{ fontSize:28, fontWeight:700, color:G,
              textShadow:"0 0 22px rgba(0,255,136,.55)", margin:"0 0 6px" }}>
              WhatsApp Linked! 🎉
            </h2>
            <p style={{ color:"#6b7280", fontSize:13, marginBottom:30 }}>
              Your bot is ready. Copy the session ID and deploy!
            </p>

            {/* Session ID */}
            <div style={{ background:"rgba(0,20,8,.85)", border:`2px solid rgba(0,255,136,.35)`,
              borderRadius:16, padding:"24px", marginBottom:14, textAlign:"left" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ color:G, fontSize:10, letterSpacing:3 }}>SESSION_ID</span>
                <span style={{ color:G, fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                  <CheckCircle2 size={12} /> READY
                </span>
              </div>

              {status?.deploySessionId ? (
                <>
                  <div style={{ background:"rgba(0,0,0,.55)", borderRadius:9,
                    padding:"12px 14px", marginBottom:16,
                    border:`1px solid rgba(0,255,136,.1)` }}>
                    <p style={{ color:"rgba(0,255,136,.7)", fontSize:11,
                      wordBreak:"break-all", lineHeight:1.7, margin:0 }}>
                      {status.deploySessionId.substring(0, 100)}
                      <span style={{ color:"#374151" }}> … ({status.deploySessionId.length} chars)</span>
                    </p>
                  </div>

                  <button onClick={copySid} style={{
                    width:"100%", padding:"16px",
                    background: copiedSid ? "rgba(0,255,136,.18)" : G,
                    color: copiedSid ? G : "#000",
                    fontFamily:MONO, fontWeight:700, fontSize:15,
                    border: copiedSid ? `1px solid ${G}` : "none",
                    borderRadius:11, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    boxShadow: copiedSid ? "none" : "0 0 30px rgba(0,255,136,.35)",
                    transition:"all .2s",
                  }}>
                    {copiedSid ? <><CheckCircle2 size={18} /> SESSION ID COPIED!</> : <><Copy size={18} /> COPY FULL SESSION ID</>}
                  </button>

                  <p style={{ color:"#4b5563", fontSize:11, marginTop:10, textAlign:"center" }}>
                    ✅ Session ID also sent to your WhatsApp
                  </p>
                </>
              ) : (
                <p style={{ color:G, fontSize:13, textAlign:"center",
                  animation:"pulse 2s infinite" }}>
                  Sending session ID to your WhatsApp...
                </p>
              )}
            </div>

            {/* Deploy guide */}
            <div style={{ background:"rgba(0,20,8,.6)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"18px 20px", marginBottom:14, textAlign:"left" }}>
              <p style={{ color:G, fontSize:10, letterSpacing:3, marginBottom:12, textTransform:"uppercase" }}>
                Deploy Your Bot
              </p>
              {[
                `Set SESSION_ID=<your session id> on your platform`,
                "Fork: github.com/Carlymaxx/maxxtechxmd",
                "Connect repo, add env variable, deploy!",
                "Your bot goes live and responds to .menu",
              ].map((t, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:7, fontSize:13, color:"#9ca3af" }}>
                  <span style={{ color:G, flexShrink:0 }}>{i + 1}.</span> {t}
                </div>
              ))}
            </div>

            {/* Platforms grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
              {PLATFORMS.map((p) => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="platform-card"
                  style={{
                    display:"flex", flexDirection:"column", alignItems:"center",
                    padding:"14px 10px", background:"rgba(0,20,8,.6)",
                    border:`1px solid rgba(0,255,136,.12)`,
                    borderRadius:12, textDecoration:"none", cursor:"pointer",
                  }}>
                  <span style={{ fontSize:24, marginBottom:5 }}>{p.icon}</span>
                  <span style={{ color:"#e2e8f0", fontSize:11, fontWeight:700 }}>{p.name}</span>
                </a>
              ))}
            </div>

            <button onClick={reset} style={{
              padding:"11px 28px", background:"transparent",
              border:`1px solid rgba(255,255,255,.1)`, borderRadius:10,
              color:"#6b7280", fontFamily:MONO, fontSize:13, cursor:"pointer",
            }}>↺ Pair Another Device</button>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:`1px solid ${BORDER_LO}`, padding:"16px 24px",
        textAlign:"center", color:"rgba(0,255,136,.25)", fontSize:11, letterSpacing:2 }}>
        MAXX-XMD © {new Date().getFullYear()} · 200+ COMMANDS · POWERED BY BAILEYS
      </footer>
    </div>
  );
}
