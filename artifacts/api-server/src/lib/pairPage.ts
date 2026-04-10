export const PAIR_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>MAXX-XMD – Session Generator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 30%,#f093fb 70%,#f5576c 100%);color:#1a1a2e}

/* Nav */
.nav{background:rgba(255,255,255,.15);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.25);padding:14px 20px;display:flex;align-items:center;justify-content:space-between}
.nav-brand{display:flex;align-items:center;gap:10px}
.nav-logo{width:38px;height:38px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.nav-title{font-size:18px;font-weight:800;color:#fff;letter-spacing:1px}
.nav-sub{font-size:11px;color:rgba(255,255,255,.7);letter-spacing:1px}
.nav-badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.badge{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);border-radius:20px;padding:4px 10px;font-size:11px;color:#fff;font-weight:600}

/* Page wrap */
.wrap{max-width:640px;margin:0 auto;padding:28px 16px 60px}

/* Hero */
.hero{text-align:center;padding:24px 0 22px}
.hero-icon{font-size:54px;margin-bottom:10px;display:inline-block}
.hero-title{font-size:clamp(26px,6vw,44px);font-weight:900;color:#fff;letter-spacing:2px;margin-bottom:6px;text-shadow:0 2px 10px rgba(0,0,0,.2)}
.hero-desc{color:rgba(255,255,255,.85);font-size:14px;margin-bottom:16px}
.feature-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.ftag{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);border-radius:20px;padding:5px 13px;font-size:12px;color:#fff;font-weight:600}

/* Card */
.card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.18);margin-bottom:20px}

/* Tabs */
.tabs{display:flex;background:#f8f8fc}
.tab-btn{flex:1;padding:16px;background:transparent;border:none;border-bottom:3px solid transparent;color:#888;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s}
#tab-phone{border-bottom-color:transparent;color:#555}
#tab-phone.active{background:#f0fff4;border-bottom-color:#16a34a;color:#15803d}
#tab-phone:hover:not(.active){background:rgba(22,163,74,.05);color:#16a34a}
#tab-qr{border-bottom-color:transparent;color:#555}
#tab-qr.active{background:#fff5f5;border-bottom-color:#dc2626;color:#dc2626}
#tab-qr:hover:not(.active){background:rgba(220,38,38,.05);color:#dc2626}

/* Steps bar */
.steps-bar{display:flex;align-items:center;gap:5px;background:#f0f0f8;border-bottom:1px solid #e8e8f0;padding:9px 16px;overflow-x:auto;scrollbar-width:none}
.steps-bar::-webkit-scrollbar{display:none}
.step-num{width:20px;height:20px;border-radius:50%;background:#764ba2;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0}
.step-label{font-size:10px;color:#666;white-space:nowrap;flex-shrink:0;font-weight:600}
.step-arrow{color:#bbb;font-size:11px;flex-shrink:0}

/* Tab body */
.tab-body{padding:24px}
.section-label{font-size:12px;font-weight:700;color:#764ba2;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase}
.hint-text{font-size:13px;color:#666;line-height:1.65;margin-bottom:18px}

/* Input */
.input-row{display:flex;gap:10px;flex-wrap:wrap}
.input-wrap{position:relative;flex:1;min-width:180px}
.input-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:15px}
input[type=tel]{width:100%;background:#f7f7fb;border:2px solid #e0e0ee;border-radius:10px;padding:13px 14px 13px 40px;color:#222;font-size:14px;outline:none;transition:border-color .2s;font-family:inherit}
input[type=tel]:focus{border-color:#764ba2;background:#fff}
.btn-primary{padding:13px 22px;background:linear-gradient(135deg,#667eea,#764ba2);border:none;border-radius:10px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:7px;white-space:nowrap;box-shadow:0 4px 15px rgba(118,75,162,.4);transition:all .2s;font-family:inherit}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(118,75,162,.5)}
.btn-primary:disabled{background:#ccc;color:#888;box-shadow:none;cursor:wait;transform:none}
.err-msg{color:#e53e3e;font-size:12px;font-weight:600;margin-top:10px;padding:8px 12px;background:#fff5f5;border-radius:8px;border-left:3px solid #e53e3e}

/* Code display */
.code-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.code-timer{font-size:13px;font-weight:700;color:#666}
.btn-reset{background:#f0f0f8;border:1px solid #ddd;border-radius:8px;padding:6px 14px;color:#555;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
.btn-reset:hover{background:#764ba2;color:#fff;border-color:#764ba2}
.digits{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:16px}
.digit{width:50px;height:58px;background:linear-gradient(135deg,#f0fff4,#dcfce7);border:2px solid #16a34a;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#15803d;box-shadow:0 4px 14px rgba(22,163,74,.25);animation:popIn .3s ease both}
.btn-copy{width:100%;padding:12px;background:linear-gradient(135deg,#56ab2f,#a8e063);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 15px rgba(86,171,47,.3);transition:all .2s;font-family:inherit}
.btn-copy:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(86,171,47,.4)}
.btn-copy.copied{background:linear-gradient(135deg,#11998e,#38ef7d)}
.hint-small{color:#999;font-size:11px;text-align:center;margin-top:8px}
.waiting-msg{color:#764ba2;font-size:12px;font-weight:600;text-align:center;margin-top:8px;animation:pulse 2s infinite}

/* QR */
.qr-center{text-align:center}
.qr-wrap{position:relative;display:inline-block;padding:12px;background:#fff;border-radius:16px;box-shadow:0 6px 30px rgba(220,38,38,.3);border:3px solid #dc2626;margin:0 auto 16px;cursor:pointer}
.qr-wrap:hover{box-shadow:0 10px 40px rgba(220,38,38,.45)}
#qr-canvas{width:220px;height:220px;display:block}
.qr-scanline{position:absolute;left:12px;right:12px;height:3px;background:linear-gradient(90deg,transparent,rgba(220,38,38,.9),transparent);border-radius:2px;animation:scanline 2.5s linear infinite}
.qr-corner{position:absolute;width:20px;height:20px;border-color:#dc2626;border-style:solid}
.qr-corner.tl{top:6px;left:6px;border-width:3px 0 0 3px}
.qr-corner.tr{top:6px;right:6px;border-width:3px 3px 0 0}
.qr-corner.bl{bottom:6px;left:6px;border-width:0 0 3px 3px}
.qr-corner.br{bottom:6px;right:6px;border-width:0 3px 3px 0}
.qr-loading{width:220px;height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#f7f7fb;border-radius:8px}
.spinner{width:32px;height:32px;border:3px solid #e0e0ee;border-top-color:#764ba2;border-radius:50%;animation:spin .8s linear infinite}
.qr-msg{color:#888;font-size:12px}
.qr-label{color:#764ba2;font-size:13px;font-weight:700;margin-bottom:4px;animation:pulse 2s infinite}
.qr-sublabel{color:#999;font-size:11px;margin-bottom:10px}
.btn-secondary{padding:9px 20px;background:#f0f0f8;border:2px solid #764ba2;border-radius:9px;color:#764ba2;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .2s;font-family:inherit}
.btn-secondary:hover{background:#764ba2;color:#fff}

/* Session ID */
.sid-box{animation:fadeIn .5s ease}
.sid-card{background:linear-gradient(135deg,#f0fff4,#e6ffed);border:2px solid #56ab2f;border-radius:14px;padding:18px;margin-bottom:12px;box-shadow:0 4px 20px rgba(86,171,47,.15)}
.sid-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.sid-dot{width:8px;height:8px;border-radius:50%;background:#56ab2f;animation:pulse 1.5s infinite}
.sid-title{color:#2d7a0a;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
.sid-label{color:#555;font-size:11px;margin-bottom:8px;font-weight:600}
.sid-value{background:#fff;border-radius:8px;padding:10px 12px;word-break:break-all;font-size:11px;color:#333;max-height:80px;overflow-y:auto;margin-bottom:12px;border:1px solid #d4edda;font-family:monospace}
.sid-copy-btn{width:100%;padding:11px;background:linear-gradient(135deg,#56ab2f,#a8e063);border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s;font-family:inherit}
.sid-copy-btn:hover{transform:translateY(-1px)}
.sid-copy-btn.copied{background:linear-gradient(135deg,#11998e,#38ef7d)}
.sid-note{color:#999;font-size:11px;text-align:center}

/* Platforms */
.divider{display:flex;align-items:center;gap:10px;margin:18px 0 14px}
.divider-line{flex:1;height:1px;background:rgba(255,255,255,.35)}
.divider-text{color:rgba(255,255,255,.9);font-size:11px;font-weight:700;letter-spacing:2px;white-space:nowrap}
.platforms{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.plat{position:relative;padding:14px 8px;background:#fff;border-radius:14px;text-align:center;text-decoration:none;transition:all .2s;box-shadow:0 4px 15px rgba(0,0,0,.08);display:block}
.plat:hover{transform:translateY(-4px);box-shadow:0 10px 30px rgba(0,0,0,.15)}
.plat-badge{position:absolute;top:5px;right:6px;font-size:8px;color:#764ba2;background:#f0f0f8;border-radius:8px;padding:1px 5px;font-weight:700}
.plat-icon{font-size:26px;margin-bottom:5px}
.plat-name{color:#333;font-size:11px;font-weight:700;margin-bottom:2px}
.plat-link{color:#764ba2;font-size:9px;display:flex;align-items:center;justify-content:center;gap:2px;font-weight:600}

/* Guide */
.guide{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.18);margin-top:18px}
.guide-header{background:linear-gradient(135deg,#667eea,#764ba2);padding:16px 20px;display:flex;align-items:center;gap:10px}
.guide-header-icon{font-size:22px}
.guide-header-text{color:#fff;font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
.guide-steps{padding:20px}
.guide-step{display:flex;align-items:flex-start;gap:14px;margin-bottom:18px}
.guide-step:last-child{margin-bottom:0}
.step-circle{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 10px rgba(118,75,162,.35)}
.step-content{flex:1;padding-top:5px}
.step-title{font-size:13px;font-weight:700;color:#222;margin-bottom:4px}
.step-desc{font-size:12px;color:#666;line-height:1.6}
.env-box{background:#f8f8fc;border:1px solid #e0e0ee;border-radius:8px;padding:9px 14px;margin:6px 0;font-family:monospace;font-size:12px;color:#333;display:flex;align-items:center;gap:6px}
.env-box .key{color:#764ba2;font-weight:700}
.env-box .val{color:#16a34a;font-weight:700}
.plat-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.plat-pill{background:#f0f0f8;border:1px solid #ddd;border-radius:20px;padding:4px 11px;font-size:11px;font-weight:600;color:#555}
a.link{color:#764ba2;font-weight:600;text-decoration:underline}

@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes scanline{0%{top:12px}100%{top:calc(100% - 12px)}}
@keyframes popIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-brand">
    <div class="nav-logo">⚡</div>
    <div>
      <div class="nav-title">MAXX-XMD</div>
      <div class="nav-sub">SESSION GENERATOR</div>
    </div>
  </div>
  <div class="nav-badges">
    <span class="badge">⚡ 150+ Cmds</span>
    <span class="badge">🤖 AI</span>
    <span class="badge">🎵 Music</span>
  </div>
</nav>

<div class="wrap">
  <div class="hero">
    <div class="hero-icon">🤖</div>
    <div class="hero-title">Connect Your Bot</div>
    <div class="hero-desc">Link your WhatsApp account to get a SESSION ID for deploying MAXX-XMD</div>
    <div class="feature-row">
      <span class="ftag">📱 Phone Number</span>
      <span class="ftag">📷 QR Code</span>
      <span class="ftag">⚡ Instant Setup</span>
      <span class="ftag">🛡️ Secure</span>
    </div>
  </div>

  <div class="card">
    <div class="tabs">
      <button class="tab-btn active" id="tab-phone" onclick="switchTab('phone')">📱 Phone Number</button>
      <button class="tab-btn" id="tab-qr" onclick="switchTab('qr')">📷 Scan QR Code</button>
    </div>
    <div class="steps-bar" id="steps-bar"></div>

    <!-- Phone Tab -->
    <div class="tab-body" id="body-phone">
      <p class="hint-text">Enter your WhatsApp number with country code. You will receive an 8-digit pairing code to enter in WhatsApp.</p>

      <div id="phone-form">
        <div class="section-label">Your Phone Number</div>
        <div class="input-row">
          <div class="input-wrap">
            <span class="input-icon">📱</span>
            <input type="tel" id="phone-input" placeholder="254700000000" autocomplete="off"/>
          </div>
          <button class="btn-primary" id="phone-btn" onclick="requestCode()">⚡ Get Code</button>
        </div>
        <div class="err-msg" id="phone-err" style="display:none"></div>
      </div>

      <div id="code-display" style="display:none">
        <div class="code-header">
          <span class="code-timer" id="code-timer">⏱ 120s</span>
          <button class="btn-reset" onclick="resetPhone()">↺ Try Again</button>
        </div>
        <div class="section-label">Your Pairing Code</div>
        <div class="digits" id="code-digits"></div>
        <button class="btn-copy" id="copy-code-btn" onclick="copyCode()">📋 Copy Code</button>
        <p class="hint-small">Go to WhatsApp → Menu (⋮) → Linked Devices → Link with phone number</p>
        <p class="waiting-msg">⏳ Waiting for WhatsApp to connect…</p>
      </div>

      <div id="phone-session" style="display:none"></div>
    </div>

    <!-- QR Tab -->
    <div class="tab-body" id="body-qr" style="display:none">
      <p class="hint-text">Scan the QR code below with your WhatsApp app to connect your account.</p>
      <div class="qr-center">
        <div class="qr-wrap" id="qr-wrap" onclick="refreshQR()" title="Click to refresh QR">
          <div class="qr-loading" id="qr-loading">
            <div class="spinner"></div>
            <div class="qr-msg">Generating QR…</div>
          </div>
          <div id="qr-canvas" style="display:none"></div>
          <div class="qr-scanline" id="qr-scanline" style="display:none"></div>
          <div class="qr-corner tl"></div>
          <div class="qr-corner tr"></div>
          <div class="qr-corner bl"></div>
          <div class="qr-corner br"></div>
        </div>
        <div id="qr-labels" style="display:none">
          <p class="qr-label">📷 Scan with WhatsApp to connect</p>
          <p class="qr-sublabel">WhatsApp → Menu (⋮) → Linked Devices → Link a Device</p>
          <button class="btn-secondary" onclick="refreshQR()">🔄 Refresh QR</button>
        </div>
        <div id="qr-session"></div>
      </div>
    </div>
  </div>

  <!-- Deploy platforms -->
  <div class="divider">
    <div class="divider-line"></div>
    <div class="divider-text">DEPLOY YOUR BOT</div>
    <div class="divider-line"></div>
  </div>
  <div class="platforms">
    <a class="plat" href="https://heroku.com" target="_blank"><div class="plat-badge">Popular</div><div class="plat-icon">🟣</div><div class="plat-name">Heroku</div><div class="plat-link">Deploy →</div></a>
    <a class="plat" href="https://railway.app" target="_blank"><div class="plat-badge">Easy</div><div class="plat-icon">🚂</div><div class="plat-name">Railway</div><div class="plat-link">Deploy →</div></a>
    <a class="plat" href="https://koyeb.com" target="_blank"><div class="plat-badge">Free</div><div class="plat-icon">⚡</div><div class="plat-name">Koyeb</div><div class="plat-link">Deploy →</div></a>
    <a class="plat" href="https://render.com" target="_blank"><div class="plat-badge">Stable</div><div class="plat-icon">🌐</div><div class="plat-name">Render</div><div class="plat-link">Deploy →</div></a>
  </div>

  <div class="guide">
    <div class="guide-header">
      <div class="guide-header-icon">💻</div>
      <div class="guide-header-text">Setup Instructions</div>
    </div>
    <div class="guide-steps">
      <div class="guide-step">
        <div class="step-circle">1</div>
        <div class="step-content">
          <div class="step-title">Connect &amp; Copy SESSION ID</div>
          <div class="step-desc">Use Phone Number or QR Code above to link your WhatsApp. Once connected, copy your SESSION ID.</div>
        </div>
      </div>
      <div class="guide-step">
        <div class="step-circle">2</div>
        <div class="step-content">
          <div class="step-title">Fork the Repository</div>
          <div class="step-desc">Go to <a class="link" href="https://github.com/Carlymaxx/maxxtechxmd" target="_blank">github.com/Carlymaxx/maxxtechxmd</a> and click <strong>Fork</strong> to get your own copy.</div>
        </div>
      </div>
      <div class="guide-step">
        <div class="step-circle">3</div>
        <div class="step-content">
          <div class="step-title">Choose a Hosting Platform</div>
          <div class="step-desc">Deploy on any of these platforms:</div>
          <div class="plat-row">
            <span class="plat-pill">🟣 Heroku</span>
            <span class="plat-pill">🟢 Render</span>
            <span class="plat-pill">🔵 Railway</span>
            <span class="plat-pill">🟡 Koyeb</span>
          </div>
        </div>
      </div>
      <div class="guide-step">
        <div class="step-circle">4</div>
        <div class="step-content">
          <div class="step-title">Set Environment Variables</div>
          <div class="step-desc">Add these in your platform's settings panel:</div>
          <div class="env-box"><span class="key">SESSION_ID</span> = <span class="val">MAXX-XMD~your_copied_text</span></div>
          <div class="env-box"><span class="key">OWNER_NUMBER</span> = <span class="val">254700000000</span></div>
        </div>
      </div>
      <div class="guide-step">
        <div class="step-circle">🚀</div>
        <div class="step-content">
          <div class="step-title">Deploy &amp; Go Live!</div>
          <div class="step-desc">Click Deploy — your MAXX-XMD bot will be live and ready to use in minutes.</div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
const BLOCKED = ['254725979273'];
const STEPS = {
  phone: ['Enter Number','Get 8-Digit Code','Enter in WhatsApp','Copy SESSION ID','Deploy Bot'],
  qr: ['Click Generate','Scan QR Code','WhatsApp Links','Copy SESSION ID','Deploy Bot']
};

let currentTab = 'phone';
let phoneSessionId = null;
let pairingCode = null;
let countdownInterval = null;
let statusPollInterval = null;
let qrSessionId = null;
let qrPollInterval = null;
let qrStatusPollInterval = null;
let countdown = 120;

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-phone').classList.toggle('active', tab === 'phone');
  document.getElementById('tab-qr').classList.toggle('active', tab === 'qr');
  document.getElementById('body-phone').style.display = tab === 'phone' ? '' : 'none';
  document.getElementById('body-qr').style.display = tab === 'qr' ? '' : 'none';
  renderSteps(tab);
  if (tab === 'qr' && !qrSessionId) startQR();
}

function renderSteps(tab) {
  const bar = document.getElementById('steps-bar');
  bar.innerHTML = STEPS[tab].map((s, i, a) =>
    \`<div class="step-num">\${i+1}</div><div class="step-label">\${s}</div>\${i < a.length-1 ? '<div class="step-arrow">›</div>' : ''}\`
  ).join('');
}

function renderSessionBox(containerId, sessionId) {
  const container = document.getElementById(containerId);
  const short = sessionId.substring(0, 120) + (sessionId.length > 120 ? '…' : '');
  container.innerHTML = \`
    <div class="sid-box">
      <div class="sid-card">
        <div class="sid-header"><div class="sid-dot"></div><div class="sid-title">✅ Connected — SESSION ID Ready</div></div>
        <div class="sid-label">Copy this and add it to your deployment platform as SESSION_ID</div>
        <div class="sid-value">\${short}</div>
        <button class="sid-copy-btn" id="sid-copy-btn" onclick="copySid('\${sessionId.replace(/'/g, "\\\\'")}')">📋 Copy Full SESSION ID</button>
      </div>
      <p class="sid-note">Your SESSION ID has also been sent to your WhatsApp</p>
    </div>
  \`;
  container.style.display = '';
}

function copySid(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('sid-copy-btn');
    if (btn) { btn.textContent = '✅ Copied!'; btn.classList.add('copied'); setTimeout(() => { btn.textContent = '📋 Copy Full SESSION ID'; btn.classList.remove('copied'); }, 2500); }
  });
}

async function requestCode() {
  const raw = document.getElementById('phone-input').value.replace(/[^0-9]/g, '');
  const err = document.getElementById('phone-err');
  if (BLOCKED.includes(raw)) {
    err.textContent = 'This number is not allowed to use this service.';
    err.style.display = '';
    return;
  }
  if (!/^\\d{10,15}$/.test(raw)) {
    err.textContent = 'Enter a valid number with country code and no spaces or + sign. Example: 254700000000';
    err.style.display = '';
    return;
  }
  err.style.display = 'none';
  const btn = document.getElementById('phone-btn');
  btn.textContent = '⟳ Generating…'; btn.disabled = true;
  try {
    const res = await fetch('/api/pair', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ number: raw })
    });
    const data = await res.json();
    if (!res.ok || !data.pairingCode) throw new Error(data.error || 'Failed to generate code');
    pairingCode = data.pairingCode;
    phoneSessionId = data.sessionId;
    showCodeDisplay();
    startStatusPoll();
  } catch(e) {
    err.textContent = e.message;
    err.style.display = '';
    btn.textContent = '⚡ Get Code'; btn.disabled = false;
  }
}

function showCodeDisplay() {
  document.getElementById('phone-form').style.display = 'none';
  document.getElementById('code-display').style.display = '';
  const digits = pairingCode.replace(/-/g, '').split('');
  const container = document.getElementById('code-digits');
  container.innerHTML = digits.map((d, i) => \`<div class="digit" style="animation-delay:\${i*0.06}s">\${d}</div>\`).join('');
  countdown = 120;
  updateTimer();
  countdownInterval = setInterval(() => { countdown--; updateTimer(); if (countdown <= 0) clearInterval(countdownInterval); }, 1000);
}

function updateTimer() {
  const el = document.getElementById('code-timer');
  const c = countdown > 40 ? '#56ab2f' : countdown > 20 ? '#f6ad55' : '#e53e3e';
  el.textContent = \`⏱ \${countdown}s\`;
  el.style.color = c;
}

function resetPhone() {
  clearInterval(countdownInterval); clearInterval(statusPollInterval);
  phoneSessionId = null; pairingCode = null;
  document.getElementById('phone-form').style.display = '';
  document.getElementById('code-display').style.display = 'none';
  document.getElementById('phone-session').style.display = 'none';
  document.getElementById('phone-session').innerHTML = '';
  document.getElementById('phone-btn').textContent = '⚡ Get Code';
  document.getElementById('phone-btn').disabled = false;
  document.getElementById('phone-err').style.display = 'none';
  document.getElementById('phone-input').value = '';
}

function copyCode() {
  const code = pairingCode ? pairingCode.replace(/-/g, '') : '';
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copy-code-btn');
    btn.textContent = '✅ Copied!'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copy Code'; btn.classList.remove('copied'); }, 2500);
  });
}

function startStatusPoll() {
  statusPollInterval = setInterval(async () => {
    if (!phoneSessionId) return;
    try {
      const res = await fetch(\`/api/pair/status/\${phoneSessionId}\`);
      const data = await res.json();
      if (data.connected && data.deploySessionId) {
        clearInterval(statusPollInterval); clearInterval(countdownInterval);
        document.getElementById('code-display').style.display = 'none';
        renderSessionBox('phone-session', data.deploySessionId);
      }
    } catch {}
  }, 3000);
}

async function startQR() {
  clearInterval(qrPollInterval); clearInterval(qrStatusPollInterval);
  qrSessionId = null;
  document.getElementById('qr-canvas').innerHTML = '';
  document.getElementById('qr-canvas').style.display = 'none';
  document.getElementById('qr-scanline').style.display = 'none';
  document.getElementById('qr-loading').style.display = 'flex';
  document.getElementById('qr-labels').style.display = 'none';
  document.getElementById('qr-session').innerHTML = '';
  document.getElementById('qr-session').style.display = 'none';
  try {
    const res = await fetch('/api/pair/qr/start', { method: 'POST', headers: {'Content-Type': 'application/json'} });
    const data = await res.json();
    if (!data.sessionId) throw new Error(data.error || 'Failed to start QR session');
    qrSessionId = data.sessionId;
    pollQR();
    qrStatusPollInterval = setInterval(async () => {
      if (!qrSessionId) return;
      try {
        const r = await fetch(\`/api/pair/status/\${qrSessionId}\`);
        const d = await r.json();
        if (d.connected && d.deploySessionId) {
          clearInterval(qrPollInterval); clearInterval(qrStatusPollInterval);
          document.getElementById('qr-loading').style.display = 'none';
          document.getElementById('qr-canvas').style.display = 'none';
          document.getElementById('qr-scanline').style.display = 'none';
          document.getElementById('qr-labels').style.display = 'none';
          renderSessionBox('qr-session', d.deploySessionId);
        }
      } catch {}
    }, 3000);
  } catch(e) {
    document.getElementById('qr-loading').innerHTML = \`<div style="color:#e53e3e;font-size:12px;padding:20px;text-align:center">\${e.message}</div>\`;
  }
}

function pollQR() {
  qrPollInterval = setInterval(async () => {
    if (!qrSessionId) return;
    try {
      const res = await fetch(\`/api/pair/qr/\${qrSessionId}\`);
      const data = await res.json();
      if (data.connected) { clearInterval(qrPollInterval); return; }
      if (data.qr) showQR(data.qr);
    } catch {}
  }, 2500);
}

function showQR(dataUrl) {
  document.getElementById('qr-loading').style.display = 'none';
  const canvas = document.getElementById('qr-canvas');
  canvas.innerHTML = \`<img src="\${dataUrl}" style="width:220px;height:220px;display:block"/>\`;
  canvas.style.display = 'block';
  document.getElementById('qr-scanline').style.display = 'block';
  document.getElementById('qr-labels').style.display = '';
}

function refreshQR() { startQR(); }

renderSteps('phone');
document.getElementById('phone-input').addEventListener('keydown', e => { if (e.key === 'Enter') requestCode(); });
</script>
</body>
</html>`;
