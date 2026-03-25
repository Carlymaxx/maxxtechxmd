import { useState, useEffect, useRef } from "react";
import { useRequestPairing, useGetPairingStatus } from "@workspace/api-client-react";
import {
  Smartphone, Copy, CheckCircle2, ShieldCheck,
  AlertCircle, Zap, Loader2, ExternalLink, Terminal,
  Users, Command, Clock, Github, MessageCircle,
  Globe, ArrowRight, Bot, Activity,
} from "lucide-react";

const PLATFORMS = [
  { name: "Heroku",   url: "https://heroku.com",    icon: "🟣", badge: "Popular" },
  { name: "Railway",  url: "https://railway.app",   icon: "🚂", badge: "Easy" },
  { name: "Koyeb",    url: "https://koyeb.com",     icon: "⚡", badge: "Free" },
  { name: "Render",   url: "https://render.com",    icon: "🌐", badge: "Stable" },
  { name: "VPS",      url: "https://digitalocean.com", icon: "🖥️", badge: "Pro" },
  { name: "Cyclic",   url: "https://cyclic.sh",     icon: "♻️", badge: "Light" },
];

const FEATURES = [
  { icon: "⚡", label: "200+ Commands" },
  { icon: "🤖", label: "AI Chat" },
  { icon: "🎵", label: "Music & Video" },
  { icon: "📸", label: "Image Gen" },
  { icon: "🛡️", label: "Group Admin" },
  { icon: "🎮", label: "Fun & Games" },
  { icon: "🔄", label: "Converters" },
  { icon: "💬", label: "Auto Reply" },
  { icon: "📊", label: "Stickers" },
  { icon: "🌐", label: "Translate" },
];

interface LiveStats {
  activePairings: number;
  totalPairings: number;
  commandCount: number;
  uptimeFormatted: string;
}

const SOCIALS = [
  { icon: Github, label: "GitHub", url: "https://github.com/Carlymaxx/maxxtechxmd", color: "#e2e8f0" },
  { icon: MessageCircle, label: "WhatsApp Group", url: "https://chat.whatsapp.com/", color: "#25d366" },
  { icon: Globe, label: "Channel", url: "https://whatsapp.com/channel/", color: "#00d4ff" },
];

const G   = "#00d4ff";
const G2  = "#0ea5e9";
const DIM = "rgba(0,212,255,.06)";
const BORDER = "rgba(0,212,255,.2)";
const BORDER_LO = "rgba(0,212,255,.1)";
const BG  = "#030c14";
const MONO = "'Share Tech Mono', 'Courier New', monospace";

export default function LinkPage() {
  const [number, setNumber]         = useState("");
  const [error, setError]           = useState("");
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [code, setCode]             = useState<string | null>(null);
  const [countdown, setCountdown]   = useState(120);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSid, setCopiedSid]   = useState(false);
  const [liveStats, setLiveStats]   = useState<LiveStats | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) setLiveStats(await res.json());
      } catch {}
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  const pairMut = useRequestPairing({
    mutation: {
      onSuccess(data) {
        setCode(data.pairingCode ?? null);
        setSessionId(data.sessionId ?? null);
        setError("");
        setCountdown(120);
      },
      onError(err: any) {
        setError(err?.data?.error || err?.message || "Failed to generate code. Try again.");
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
  const codeColor   = countdown > 40 ? G : countdown > 20 ? "#fbbf24" : "#ef4444";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: BG,
      backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,212,255,.12), transparent),
        linear-gradient(${DIM} 1px,transparent 1px),
        linear-gradient(90deg,${DIM} 1px,transparent 1px)`,
      backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      color: "#e2e8f0", fontFamily: MONO,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes glowC   { 0%,100%{box-shadow:0 0 20px rgba(0,212,255,.25)} 50%{box-shadow:0 0 45px rgba(0,212,255,.5)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline{ 0%{top:-8%} 100%{top:108%} }
        .digit-box   { animation: fadeIn .35s ease forwards; }
        .plat-card:hover  { transform:translateY(-4px) scale(1.04); box-shadow:0 10px 30px rgba(0,212,255,.15)!important; }
        .plat-card   { transition: all .2s ease; }
        .copy-btn:hover   { background:rgba(0,212,255,.1)!important; }
        .feature-pill     { animation: fadeIn .4s ease forwards; }
        .stat-card:hover  { border-color:rgba(0,212,255,.4)!important; transform:translateY(-2px); }
        .stat-card  { transition: all .2s ease; }
        .social-btn:hover { background:rgba(0,212,255,.12)!important; transform:scale(1.04); }
        .social-btn { transition: all .2s ease; }
        .glow-text  { text-shadow: 0 0 30px rgba(0,212,255,.5), 0 0 60px rgba(0,212,255,.25); }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: `1px solid ${BORDER_LO}`, padding: "14px 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(3,12,20,.8)", backdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:50,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, background:"rgba(0,212,255,.1)",
            border:`1px solid rgba(0,212,255,.35)`, borderRadius:9,
            display:"flex", alignItems:"center", justifyContent:"center",
            animation:"glowC 3s ease-in-out infinite",
          }}>
            <Bot size={18} color={G} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1.1 }}>
            <span style={{ color:G, fontWeight:700, fontSize:18, letterSpacing:3 }}>MAXXXMD</span>
            <span style={{ color:"rgba(0,212,255,.4)", fontSize:9, letterSpacing:2 }}>SESSION GENERATOR</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <a href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank" rel="noopener noreferrer"
            style={{
              display:"flex", alignItems:"center", gap:5, fontSize:11,
              color:"rgba(0,212,255,.6)", textDecoration:"none",
              border:`1px solid rgba(0,212,255,.18)`, borderRadius:7, padding:"5px 11px",
            }}>
            <ExternalLink size={11} /> GitHub
          </a>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ flex:1, maxWidth:640, margin:"0 auto", width:"100%", padding:"44px 16px 80px" }}>

        {/* ═══════════════════ IDLE ═══════════════════ */}
        {!code && !isConnected && (<>

          {/* Hero */}
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{
              position:"relative", display:"inline-block",
              marginBottom:24, animation:"float 4s ease-in-out infinite",
            }}>
              <div style={{
                width:110, height:110, margin:"0 auto",
                borderRadius:26, border:`2px solid rgba(0,212,255,.45)`,
                overflow:"hidden", background:"rgba(0,18,35,.8)",
                boxShadow:"0 0 60px rgba(0,212,255,.25), 0 0 120px rgba(0,212,255,.08)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <img
                  src={`${import.meta.env.BASE_URL}images/bot-logo.png`}
                  alt="MAXXXMD"
                  style={{ width:"85%", height:"85%", objectFit:"contain" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:44px">🤖</span>';
                  }}
                />
              </div>
              <div style={{
                position:"absolute", bottom:-8, right:-8,
                background: `linear-gradient(135deg, ${G}, ${G2})`,
                color:"#000", fontSize:9, fontWeight:700,
                padding:"3px 9px", borderRadius:20, letterSpacing:1,
                animation:"pulse 2s infinite",
              }}>LIVE</div>
            </div>

            <div style={{ marginBottom:6 }}>
              <span style={{
                background:"rgba(0,212,255,.08)", border:`1px solid rgba(0,212,255,.2)`,
                color:G, fontSize:10, letterSpacing:3, padding:"3px 12px",
                borderRadius:20, textTransform:"uppercase",
              }}>WhatsApp Bot Platform</span>
            </div>

            <h1 style={{ fontSize:"clamp(32px,7vw,46px)", fontWeight:700, color:"#fff", margin:"12px 0 8px", letterSpacing:2 }}>
              MAXX<span className="glow-text" style={{ color:G }}>XXXMD</span>
            </h1>
            <p style={{ color:"#64748b", fontSize:14, margin:"0 0 24px", lineHeight:1.7 }}>
              The most powerful WhatsApp multi-device bot.<br />
              200+ commands, free to deploy in under 60 seconds.
            </p>

            {/* Feature pills */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center", marginBottom:32 }}>
              {FEATURES.map((f, i) => (
                <span key={f.label} className="feature-pill" style={{
                  display:"inline-flex", alignItems:"center", gap:4,
                  background:"rgba(0,212,255,.07)", border:`1px solid rgba(0,212,255,.18)`,
                  color:G, fontSize:11, padding:"4px 11px", borderRadius:20,
                  animationDelay:`${i * 0.04}s`,
                }}>{f.icon} {f.label}</span>
              ))}
            </div>
          </div>

          {/* Live stats bar */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:24,
          }}>
            {/* Active right now */}
            <div className="stat-card" style={{
              background:"rgba(0,18,35,.7)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"14px 8px", textAlign:"center", position:"relative",
            }}>
              {liveStats !== null && (
                <span style={{
                  position:"absolute", top:6, right:7,
                  width:6, height:6, borderRadius:"50%",
                  background:"#22c55e", animation:"pulse 2s infinite",
                }} />
              )}
              <Activity size={16} color={G} style={{ margin:"0 auto 6px" }} />
              <div style={{ color:"#fff", fontWeight:700, fontSize:16, letterSpacing:1 }}>
                {liveStats === null ? "—" : liveStats.activePairings}
              </div>
              <div style={{ color:"#475569", fontSize:10, letterSpacing:1, marginTop:2 }}>Active Now</div>
            </div>

            {/* Total sessions since boot */}
            <div className="stat-card" style={{
              background:"rgba(0,18,35,.7)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"14px 8px", textAlign:"center",
            }}>
              <Users size={16} color={G} style={{ margin:"0 auto 6px" }} />
              <div style={{ color:"#fff", fontWeight:700, fontSize:16, letterSpacing:1 }}>
                {liveStats === null ? "—" : liveStats.totalPairings}
              </div>
              <div style={{ color:"#475569", fontSize:10, letterSpacing:1, marginTop:2 }}>Sessions</div>
            </div>

            {/* Real command count */}
            <div className="stat-card" style={{
              background:"rgba(0,18,35,.7)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"14px 8px", textAlign:"center",
            }}>
              <Command size={16} color={G} style={{ margin:"0 auto 6px" }} />
              <div style={{ color:"#fff", fontWeight:700, fontSize:16, letterSpacing:1 }}>
                {liveStats === null ? "—" : liveStats.commandCount}
              </div>
              <div style={{ color:"#475569", fontSize:10, letterSpacing:1, marginTop:2 }}>Commands</div>
            </div>

            {/* Server uptime */}
            <div className="stat-card" style={{
              background:"rgba(0,18,35,.7)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"14px 8px", textAlign:"center",
            }}>
              <Clock size={16} color={G} style={{ margin:"0 auto 6px" }} />
              <div style={{ color:"#fff", fontWeight:700, fontSize:15, letterSpacing:1 }}>
                {liveStats === null ? "—" : liveStats.uptimeFormatted}
              </div>
              <div style={{ color:"#475569", fontSize:10, letterSpacing:1, marginTop:2 }}>Uptime</div>
            </div>
          </div>

          {/* Social links */}
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:28 }}>
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                className="social-btn"
                style={{
                  display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                  background:"rgba(0,18,35,.6)", border:`1px solid rgba(0,212,255,.12)`,
                  borderRadius:9, textDecoration:"none", color:s.color, fontSize:12,
                }}>
                <s.icon size={13} color={s.color} />
                <span style={{ color:"#94a3b8", fontSize:11 }}>{s.label}</span>
              </a>
            ))}
          </div>

          {/* Form card */}
          <form onSubmit={submit} style={{
            width:"100%", background:"rgba(0,18,35,.75)",
            border:`1px solid ${BORDER}`, borderRadius:20,
            padding:"28px 24px",
            boxShadow:"0 4px 60px rgba(0,0,0,.5), 0 0 1px rgba(0,212,255,.1) inset",
          }}>
            <div style={{
              display:"flex", alignItems:"center", gap:8, marginBottom:18,
              borderBottom:`1px solid ${BORDER_LO}`, paddingBottom:14,
            }}>
              <Smartphone size={15} color={G} />
              <span style={{ color:G, fontSize:11, letterSpacing:3, textTransform:"uppercase" }}>
                Link Your WhatsApp
              </span>
            </div>

            <div style={{ position:"relative" }}>
              <span style={{
                position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
                color:`rgba(0,212,255,.6)`, fontSize:18, fontWeight:700,
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
                  background:"rgba(0,0,0,.55)", border:`1px solid rgba(0,212,255,.22)`,
                  borderRadius:12, padding:"15px 14px 15px 38px",
                  fontSize:20, color:"#fff", outline:"none",
                  letterSpacing:3, fontFamily:MONO,
                  transition:"border-color .2s, box-shadow .2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,212,255,.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,212,255,.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,212,255,.22)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <p style={{ color:"#334155", fontSize:12, marginTop:7 }}>
              Country code + number, no spaces.&nbsp;
              <span style={{ color:"rgba(0,212,255,.6)" }}>E.g. 254700000000</span>
            </p>

            {error && (
              <div style={{
                display:"flex", alignItems:"flex-start", gap:8,
                background:"rgba(127,29,29,.25)", border:"1px solid rgba(248,113,113,.3)",
                borderRadius:10, padding:"10px 14px", marginTop:14,
              }}>
                <AlertCircle size={14} color="#f87171" style={{ marginTop:2, flexShrink:0 }} />
                <span style={{ color:"#f87171", fontSize:13 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width:"100%", marginTop:18, padding:"16px",
                background: isLoading
                  ? "rgba(0,212,255,.3)"
                  : `linear-gradient(135deg, ${G}, ${G2})`,
                color:"#000", fontFamily:MONO, fontWeight:700, fontSize:15,
                letterSpacing:1, border:"none", borderRadius:12,
                cursor: isLoading ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                boxShadow: isLoading ? "none" : "0 0 35px rgba(0,212,255,.35)",
                transition:"all .2s",
              }}
            >
              {isLoading ? (
                <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} /> Generating Code...</>
              ) : (
                <><Zap size={18} /> Generate Pairing Code <ArrowRight size={16} /></>
              )}
            </button>

            {/* Steps */}
            <div style={{ marginTop:22, borderTop:`1px solid ${BORDER_LO}`, paddingTop:18, display:"grid", gap:9 }}>
              {[
                ["01", "Enter your WhatsApp number with country code"],
                ["02", "Click the button to get your 8-digit pairing code"],
                ["03", "WhatsApp → Menu → Linked Devices → Link with phone number"],
                ["04", "Enter the code — SESSION_ID will be sent to your WhatsApp"],
                ["05", "Set SESSION_ID env var and deploy on any cloud platform"],
              ].map(([n, t]) => (
                <div key={n} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{
                    minWidth:24, height:24, borderRadius:"50%",
                    border:`1px solid rgba(0,212,255,.3)`, color:G,
                    fontSize:9, display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0,
                  }}>{n}</span>
                  <span style={{ color:"#475569", fontSize:13, lineHeight:1.5, paddingTop:3 }}>{t}</span>
                </div>
              ))}
            </div>
          </form>

          {/* Deploy platforms */}
          <div style={{ marginTop:36 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <Terminal size={14} color={G} />
              <span style={{ color:G, fontSize:11, letterSpacing:3, textTransform:"uppercase" }}>Deploy Your Bot</span>
              <div style={{ flex:1, height:1, background:BORDER_LO }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {PLATFORMS.map((p) => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="plat-card"
                  style={{
                    display:"flex", flexDirection:"column", alignItems:"center",
                    padding:"16px 12px",
                    background:"rgba(0,18,35,.65)", border:`1px solid rgba(0,212,255,.1)`,
                    borderRadius:12, textDecoration:"none", cursor:"pointer", position:"relative",
                    boxShadow:"0 2px 12px rgba(0,0,0,.4)",
                  }}>
                  <span style={{
                    position:"absolute", top:7, right:8, fontSize:9,
                    color:"rgba(0,212,255,.45)", letterSpacing:1,
                  }}>{p.badge}</span>
                  <span style={{ fontSize:26, marginBottom:6 }}>{p.icon}</span>
                  <span style={{ color:"#e2e8f0", fontSize:12, fontWeight:700, letterSpacing:1 }}>{p.name}</span>
                </a>
              ))}
            </div>

            {/* ENV hint */}
            <div style={{
              marginTop:14, background:"rgba(0,18,35,.55)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"16px 18px",
            }}>
              <p style={{ color:G, fontSize:10, letterSpacing:2, marginBottom:10 }}>ENV VARIABLE SETUP</p>
              <div style={{ background:"rgba(0,0,0,.55)", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
                <span style={{ color:"rgba(0,212,255,.85)", fontSize:12 }}>SESSION_ID</span>
                <span style={{ color:"#334155", fontSize:12 }}>=MAXXXMD~your_session_id_here</span>
              </div>
              <p style={{ color:"#334155", fontSize:11 }}>
                Set this on your platform after copying your session ID.{" "}
                <a href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank" rel="noopener noreferrer"
                  style={{ color:"rgba(0,212,255,.55)" }}>Fork the repo →</a>
              </p>
            </div>
          </div>

          {/* Features grid */}
          <div style={{ marginTop:36 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <Zap size={14} color={G} />
              <span style={{ color:G, fontSize:11, letterSpacing:3, textTransform:"uppercase" }}>What You Get</span>
              <div style={{ flex:1, height:1, background:BORDER_LO }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
              {[
                ["🤖 AI Chat", "ChatGPT powered conversations with your contacts"],
                ["🎵 Music Downloader", "Download any song from YouTube in seconds"],
                ["🖼️ Image Generator", "Create AI art from text prompts"],
                ["🛡️ Group Manager", "Kick, promote, mute — full admin controls"],
                ["🎮 Games & Fun", "Truth or dare, riddles, quotes and more"],
                ["📩 Auto Reply", "Custom triggers to auto-respond to messages"],
              ].map(([title, desc]) => (
                <div key={String(title)} style={{
                  background:"rgba(0,18,35,.5)", border:`1px solid rgba(0,212,255,.09)`,
                  borderRadius:12, padding:"14px 16px",
                }}>
                  <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:700, marginBottom:4 }}>{title}</div>
                  <div style={{ color:"#475569", fontSize:11, lineHeight:1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

        </>)}

        {/* ═══════════════════ CODE ═══════════════════ */}
        {code && !isConnected && (
          <div style={{ width:"100%", animation:"fadeIn .4s ease" }}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <p style={{ color:G, fontSize:12, letterSpacing:3, margin:"0 0 4px", textTransform:"uppercase" }}>
                Waiting for WhatsApp link
              </p>
              <p style={{ color:"#475569", fontSize:12, margin:0 }}>
                Number: <span style={{ color:"#94a3b8" }}>{number.replace(/[^0-9]/g, "")}</span>
              </p>
            </div>

            <div style={{
              background:"rgba(0,18,35,.9)", border:`2px solid ${codeColor}`,
              borderRadius:20, padding:"32px 24px", textAlign:"center", marginBottom:14,
              boxShadow:`0 0 60px ${codeColor}18`,
              position:"relative",
            }}>
              <div style={{
                position:"absolute", top:14, right:16,
                display:"flex", alignItems:"center", gap:5, fontSize:13, color:codeColor,
              }}>
                <div style={{
                  width:8, height:8, borderRadius:"50%",
                  background:codeColor, animation:"pulse 1s infinite",
                }} />
                {countdown}s
              </div>

              <p style={{ fontSize:10, color:"rgba(0,212,255,.5)", letterSpacing:4,
                textTransform:"uppercase", marginBottom:18 }}>Your Pairing Code</p>

              <div style={{ display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap", marginBottom:22 }}>
                {codeDigits.map((d, i) => (
                  <div key={i} className="digit-box" style={{
                    animationDelay:`${i * 0.06}s`,
                    width:46, height:60,
                    background:"rgba(0,0,0,.8)",
                    border:`2px solid rgba(0,212,255,.4)`,
                    borderRadius:11,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:28, fontWeight:900, color:"#fff",
                    boxShadow:"0 0 14px rgba(0,212,255,.1)",
                  }}>{d}</div>
                ))}
              </div>

              <button onClick={copyCode} className="copy-btn" style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"12px 28px", border:`1px solid rgba(0,212,255,.4)`, borderRadius:10,
                background: copiedCode ? "rgba(0,212,255,.12)" : "transparent",
                color:G, fontFamily:MONO, fontSize:14, fontWeight:700, cursor:"pointer",
                letterSpacing:1, transition:"all .2s",
              }}>
                {copiedCode ? <><CheckCircle2 size={16} /> COPIED!</> : <><Copy size={16} /> COPY CODE</>}
              </button>
            </div>

            <div style={{
              background:"rgba(0,18,35,.6)", border:`1px solid ${BORDER_LO}`,
              borderRadius:12, padding:"18px 20px", marginBottom:14,
            }}>
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
                <div key={i} style={{ display:"flex", gap:8, marginBottom:7, fontSize:13, color:"#94a3b8" }}>
                  <span style={{ color:G, flexShrink:0, minWidth:16 }}>{i + 1}.</span> {t}
                </div>
              ))}
              <div style={{
                marginTop:12, padding:"8px 12px",
                background:"rgba(251,191,36,.06)", border:"1px solid rgba(251,191,36,.2)",
                borderRadius:8,
              }}>
                <p style={{ color:"#fbbf24", fontSize:12, margin:0 }}>
                  ⚠ Code expires in ~2 minutes — enter it quickly!
                </p>
              </div>
            </div>

            <button onClick={reset} style={{
              width:"100%", padding:"12px", background:"transparent",
              border:`1px solid rgba(255,255,255,.07)`, borderRadius:10,
              color:"#475569", fontFamily:MONO, fontSize:13, cursor:"pointer",
            }}>↺ Start Over</button>
          </div>
        )}

        {/* ═══════════════════ CONNECTED ═══════════════════ */}
        {isConnected && (
          <div style={{ width:"100%", textAlign:"center", animation:"fadeIn .4s ease" }}>
            <div style={{
              width:96, height:96, margin:"0 auto 20px",
              background:"rgba(0,212,255,.1)", border:`2px solid rgba(0,212,255,.5)`,
              borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 0 60px rgba(0,212,255,.3), 0 0 120px rgba(0,212,255,.08)",
              animation:"glowC 2s ease-in-out infinite",
            }}>
              <ShieldCheck size={46} color={G} />
            </div>

            <h2 style={{ fontSize:28, fontWeight:700, color:G, margin:"0 0 6px" }}
              className="glow-text">
              WhatsApp Linked! 🎉
            </h2>
            <p style={{ color:"#64748b", fontSize:13, marginBottom:30 }}>
              Your bot is ready. Copy the session ID below and deploy!
            </p>

            {status?.deploySessionId ? (
              <div style={{
                background:"rgba(0,18,35,.85)", border:`2px solid rgba(0,212,255,.3)`,
                borderRadius:16, padding:"24px", marginBottom:14, textAlign:"left",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <span style={{ color:G, fontSize:10, letterSpacing:3 }}>SESSION_ID</span>
                  <span style={{ color:"#22c55e", fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                    <CheckCircle2 size={12} /> READY
                  </span>
                </div>
                <div style={{
                  background:"rgba(0,0,0,.6)", borderRadius:10, padding:"12px 14px",
                  marginBottom:14, wordBreak:"break-all", fontSize:11,
                  color:"rgba(0,212,255,.8)", lineHeight:1.6,
                  border:"1px solid rgba(0,212,255,.1)",
                }}>
                  {status.deploySessionId.slice(0, 60)}…
                </div>
                <button onClick={copySid} style={{
                  width:"100%", padding:"14px",
                  background: copiedSid
                    ? "rgba(34,197,94,.15)"
                    : `linear-gradient(135deg, ${G}, ${G2})`,
                  color: copiedSid ? "#22c55e" : "#000",
                  fontFamily:MONO, fontWeight:700, fontSize:14, letterSpacing:1,
                  border: copiedSid ? "1px solid rgba(34,197,94,.4)" : "none",
                  borderRadius:11, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow: copiedSid ? "none" : "0 0 30px rgba(0,212,255,.3)",
                  transition:"all .25s",
                }}>
                  {copiedSid
                    ? <><CheckCircle2 size={17} /> SESSION ID COPIED!</>
                    : <><Copy size={17} /> COPY SESSION ID</>}
                </button>
                <p style={{ color:"#334155", fontSize:11, marginTop:10, textAlign:"center" }}>
                  Also sent to your WhatsApp as a .txt file
                </p>
              </div>
            ) : (
              <div style={{
                background:"rgba(0,18,35,.7)", border:`1px solid rgba(0,212,255,.15)`,
                borderRadius:14, padding:"28px", marginBottom:14,
              }}>
                <Loader2 size={28} color={G} style={{ animation:"spin 1s linear infinite", margin:"0 auto 12px", display:"block" }} />
                <p style={{ color:G, fontSize:13, margin:"0 0 4px" }}>Generating your Session ID...</p>
                <p style={{ color:"#475569", fontSize:12 }}>This takes just a moment.</p>
              </div>
            )}

            <button onClick={reset} style={{
              width:"100%", padding:"12px", background:"transparent",
              border:`1px solid rgba(255,255,255,.07)`, borderRadius:10,
              color:"#475569", fontFamily:MONO, fontSize:13, cursor:"pointer",
            }}>↺ Pair Another Number</button>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop:`1px solid rgba(0,212,255,.07)`,
        background:"rgba(0,9,18,.8)", padding:"24px 20px",
        textAlign:"center",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:10 }}>
          <Bot size={14} color={G} />
          <span style={{ color:G, fontWeight:700, fontSize:14, letterSpacing:3 }}>MAXXXMD</span>
        </div>
        <p style={{ color:"#1e3a4a", fontSize:12, marginBottom:12 }}>
          Built with ❤️ by{" "}
          <a href="https://github.com/Carlymaxx" target="_blank" rel="noopener noreferrer"
            style={{ color:"rgba(0,212,255,.45)", textDecoration:"none" }}>
            Carlymaxx
          </a>
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:20 }}>
          {[
            { label:"GitHub", url:"https://github.com/Carlymaxx/maxxtechxmd" },
            { label:"Fork Bot", url:"https://github.com/Carlymaxx/maxxtechxmd/fork" },
            { label:"Report Bug", url:"https://github.com/Carlymaxx/maxxtechxmd/issues" },
          ].map((l) => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
              style={{ color:"#1e3a4a", fontSize:11, textDecoration:"none", letterSpacing:1 }}>
              {l.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
