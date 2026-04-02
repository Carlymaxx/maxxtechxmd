import { Router, type IRouter } from "express";
import { sessionConnected } from "../lib/baileys.js";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  const isConnected = Object.values(sessionConnected).some(Boolean);
  const statusColor = isConnected ? "#00ff88" : "#ff4444";
  const statusText = isConnected ? "🟢 ONLINE" : "🔴 OFFLINE";
  const statusLabel = isConnected ? "Bot is Connected & Ready" : "Bot is Offline";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>MAXX-XMD ⚡ WhatsApp Bot</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  :root{
    --neon:#00ff88;--neon2:#00ccff;--bg:#050a0f;--card:#0d1a24;--border:#1a3a4a;
    --text:#e0f0ff;--dim:#6a8fa8;
  }
  body{
    background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;
    min-height:100vh;overflow-x:hidden;
  }

  /* ── Matrix canvas ── */
  #matrix{position:fixed;top:0;left:0;width:100%;height:100%;opacity:.08;z-index:0;pointer-events:none;}

  /* ── Glow orbs ── */
  .orb{position:fixed;border-radius:50%;filter:blur(80px);z-index:0;pointer-events:none;}
  .orb1{width:500px;height:500px;background:radial-gradient(circle,#00ff8822,transparent);top:-100px;left:-100px;animation:float1 8s ease-in-out infinite;}
  .orb2{width:400px;height:400px;background:radial-gradient(circle,#00ccff18,transparent);bottom:-80px;right:-80px;animation:float2 10s ease-in-out infinite;}
  @keyframes float1{0%,100%{transform:translate(0,0);}50%{transform:translate(60px,40px);}}
  @keyframes float2{0%,100%{transform:translate(0,0);}50%{transform:translate(-40px,-60px);}}

  /* ── Layout ── */
  .wrap{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;gap:32px;}

  /* ── Logo block ── */
  .logo-block{text-align:center;}
  .logo-icon{font-size:64px;display:block;margin-bottom:8px;animation:pulse-icon 2s ease-in-out infinite;}
  @keyframes pulse-icon{0%,100%{transform:scale(1);filter:drop-shadow(0 0 12px #00ff88);}50%{transform:scale(1.08);filter:drop-shadow(0 0 28px #00ff88);}}

  .logo-name{
    font-size:clamp(36px,8vw,72px);font-weight:900;letter-spacing:6px;
    background:linear-gradient(135deg,var(--neon),var(--neon2),var(--neon));
    background-size:200% auto;
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    animation:shimmer 3s linear infinite;
  }
  @keyframes shimmer{0%{background-position:0% center;}100%{background-position:200% center;}}

  .logo-tag{font-size:14px;letter-spacing:4px;color:var(--dim);margin-top:6px;text-transform:uppercase;}

  /* ── Status badge ── */
  .status-badge{
    display:inline-flex;align-items:center;gap:10px;
    background:var(--card);border:1px solid var(--border);
    padding:10px 24px;border-radius:50px;font-size:15px;font-weight:600;
    box-shadow:0 0 20px #00ff8822;
  }
  .status-dot{
    width:10px;height:10px;border-radius:50%;
    background:${statusColor};
    box-shadow:0 0 8px ${statusColor};
    animation:blink 1.4s ease-in-out infinite;
  }
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}
  .status-text{color:${statusColor};}
  .status-sub{font-size:12px;color:var(--dim);display:block;text-align:center;margin-top:4px;}

  /* ── Stats grid ── */
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px;width:100%;max-width:600px;}
  .stat{
    background:var(--card);border:1px solid var(--border);border-radius:16px;
    padding:20px 16px;text-align:center;
    transition:transform .2s,box-shadow .2s;
  }
  .stat:hover{transform:translateY(-4px);box-shadow:0 8px 32px #00ff8822;}
  .stat-val{font-size:28px;font-weight:800;color:var(--neon);line-height:1;}
  .stat-lbl{font-size:11px;color:var(--dim);margin-top:6px;text-transform:uppercase;letter-spacing:1px;}

  /* ── Cards ── */
  .cards{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;width:100%;max-width:660px;}
  .card{
    flex:1;min-width:200px;
    background:var(--card);border:1px solid var(--border);border-radius:20px;
    padding:28px 24px;text-align:center;cursor:pointer;text-decoration:none;color:inherit;
    transition:transform .2s,box-shadow .2s,border-color .2s;
    position:relative;overflow:hidden;
  }
  .card::before{
    content:'';position:absolute;inset:0;
    background:linear-gradient(135deg,var(--neon)08,transparent);
    opacity:0;transition:opacity .2s;
  }
  .card:hover::before{opacity:1;}
  .card:hover{transform:translateY(-6px);box-shadow:0 12px 40px #00ff8830;border-color:var(--neon);}
  .card-icon{font-size:32px;margin-bottom:12px;display:block;}
  .card-title{font-size:16px;font-weight:700;margin-bottom:4px;color:var(--neon);}
  .card-sub{font-size:12px;color:var(--dim);}

  /* ── Divider ── */
  .divider{width:100%;max-width:480px;height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);}

  /* ── Footer ── */
  .footer{text-align:center;color:var(--dim);font-size:12px;line-height:2;}
  .footer a{color:var(--neon2);text-decoration:none;}
  .footer a:hover{text-decoration:underline;}

  /* ── Typing animation on tagline ── */
  .tagline{font-size:15px;color:var(--dim);letter-spacing:1px;white-space:nowrap;overflow:hidden;border-right:2px solid var(--neon);width:0;animation:type 2.5s steps(35,end) 0.5s forwards,blink-cursor 0.75s step-end infinite;}
  @keyframes type{to{width:100%;}}
  @keyframes blink-cursor{0%,100%{border-color:var(--neon);}50%{border-color:transparent;}}
</style>
</head>
<body>

<canvas id="matrix"></canvas>
<div class="orb orb1"></div>
<div class="orb orb2"></div>

<div class="wrap">

  <!-- Logo -->
  <div class="logo-block">
    <span class="logo-icon">🤖</span>
    <div class="logo-name">MAXX-XMD</div>
    <div class="logo-tag">WhatsApp Bot v3.0.0</div>
  </div>

  <!-- Typing tagline -->
  <div style="overflow:hidden;max-width:100%;">
    <div class="tagline">The most powerful WhatsApp bot — 580+ commands ⚡</div>
  </div>

  <!-- Status -->
  <div style="text-align:center;">
    <div class="status-badge">
      <span class="status-dot"></span>
      <span class="status-text">${statusText}</span>
    </div>
    <span class="status-sub">${statusLabel}</span>
  </div>

  <!-- Stats -->
  <div class="stats">
    <div class="stat"><div class="stat-val">580+</div><div class="stat-lbl">Commands</div></div>
    <div class="stat"><div class="stat-val">v3.0.0</div><div class="stat-lbl">Version</div></div>
    <div class="stat"><div class="stat-val">24/7</div><div class="stat-lbl">Uptime</div></div>
    <div class="stat"><div class="stat-val">⚡</div><div class="stat-lbl">Fast</div></div>
  </div>

  <div class="divider"></div>

  <!-- Action cards -->
  <div class="cards">
    <a class="card" href="https://pair.maxxtech.co.ke" target="_blank">
      <span class="card-icon">🔗</span>
      <div class="card-title">Pair Your Bot</div>
      <div class="card-sub">pair.maxxtech.co.ke</div>
    </a>
    <a class="card" href="https://chat.whatsapp.com/BWZOtIlbZoJ9Xt8lgxxbqQ" target="_blank">
      <span class="card-icon">👥</span>
      <div class="card-title">WhatsApp Group</div>
      <div class="card-sub">Join the community</div>
    </a>
    <a class="card" href="https://whatsapp.com/channel/0029Vb6XNTjAInPblhlwnm2J" target="_blank">
      <span class="card-icon">📢</span>
      <div class="card-title">Channel</div>
      <div class="card-sub">Follow for updates</div>
    </a>
    <a class="card" href="https://www.maxxtech.co.ke" target="_blank">
      <span class="card-icon">🌍</span>
      <div class="card-title">Website</div>
      <div class="card-sub">www.maxxtech.co.ke</div>
    </a>
    <a class="card" href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank">
      <span class="card-icon">💻</span>
      <div class="card-title">GitHub</div>
      <div class="card-sub">Source Code</div>
    </a>
  </div>

  <div class="divider"></div>

  <!-- Footer -->
  <div class="footer">
    <div>Powered by <strong style="color:var(--neon)">MAXX-XMD</strong> · Built with Baileys &amp; Node.js</div>
    <div>
      <a href="https://pair.maxxtech.co.ke">Pair</a> ·
      <a href="https://www.maxxtech.co.ke">Website</a> ·
      <a href="https://chat.whatsapp.com/BWZOtIlbZoJ9Xt8lgxxbqQ" target="_blank">Group</a> ·
      <a href="/api/healthz">Health</a> ·
      <a href="/api/diagnose">Diagnose</a>
    </div>
  </div>

</div>

<script>
// ── Matrix rain effect ──────────────────────────────────────────────
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
let cols, drops;

function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const size = 14;
  cols = Math.floor(canvas.width / size);
  drops = Array(cols).fill(1);
}

function draw() {
  ctx.fillStyle = 'rgba(5,10,15,0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff88';
  ctx.font = '13px monospace';
  const chars = 'MAXXXMD⚡01アイウエオカキクケコ';
  drops.forEach((y, i) => {
    const ch = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(ch, i * 14, y * 14);
    if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  });
}

init();
window.addEventListener('resize', init);
setInterval(draw, 55);
</script>
</body>
</html>`);
});

export default router;
