export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`;

export const BASE_CSS = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --forest:  #003580;
    --deep:    #F4F7F6;
    --emerald: #002E6E;
    --jade:    #004A99;
    --mint:    #84BD60;
    --gold:    #E8845A;
    --amber:   #F0A98B;
    --cream:   #FFFFFF;
    --teal:    #0ea5e9;
    --sky:     #38bdf8;
    --coral:   #f43f5e;
    --text:    #0F2035;
    --muted:   #5A7080;
    --border:  rgba(0,74,153,0.14);
    --serif:   'Playfair Display', Georgia, serif;
    --sans:    'DM Sans', system-ui, sans-serif;
    --mono:    'DM Mono', monospace;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--deep); color: var(--text); font-family: var(--sans); overflow-x: hidden; }
  body::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.2;
  }
  section { position: relative; z-index: 1; }

  /* Layout */
  .si  { max-width:1200px; margin:0 auto; padding:80px 5vw; }
  .si-sm { max-width:1200px; margin:0 auto; padding:48px 5vw; }

  /* Typography */
  .stag { display:inline-flex; align-items:center; gap:8px; padding:5px 14px; border-radius:100px; background:rgba(0,74,153,0.08); border:1px solid rgba(0,74,153,0.2); font-size:11px; font-weight:600; letter-spacing:2px; color:var(--jade); text-transform:uppercase; font-family:var(--mono); }
  .stag.gold { background:rgba(240,169,139,0.12); border-color:rgba(232,132,90,0.25); color:var(--gold); }
  .stag.sky  { background:rgba(14,165,233,0.1); border-color:rgba(14,165,233,0.25); color:var(--sky); }
  .stag.coral { background:rgba(249,112,102,0.1); border-color:rgba(249,112,102,0.25); color:var(--coral); }
  .stitle { font-family:var(--serif); font-size:clamp(26px,3.2vw,44px); font-weight:700; line-height:1.2; letter-spacing:-0.5px; margin-bottom:14px; }
  .stitle em { font-style:italic; color:var(--jade); }
  .stitle .gold { color:var(--gold); }
  .ssub { font-size:16px; color:var(--muted); line-height:1.75; max-width:580px; font-weight:300; }
  .divider { width:56px; height:3px; background:linear-gradient(90deg,var(--jade),var(--mint)); border-radius:2px; margin-top:14px; }

  /* Buttons */
  .btn-p { background:linear-gradient(135deg,#F0A98B,#E8845A); color:#0F2035; padding:12px 26px; border-radius:100px; border:none; font-family:var(--sans); font-weight:600; font-size:14px; cursor:pointer; box-shadow:0 6px 22px rgba(232,132,90,0.38); transition:all 0.28s; letter-spacing:0.2px; text-decoration:none; display:inline-block; }
  .btn-p:hover { transform:translateY(-2px); box-shadow:0 12px 30px rgba(232,132,90,0.5); }
  .btn-p:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .btn-o { background:transparent; color:var(--text); padding:12px 26px; border-radius:100px; border:1px solid rgba(0,74,153,0.25); font-family:var(--sans); font-weight:500; font-size:14px; cursor:pointer; transition:all 0.28s; text-decoration:none; display:inline-block; }
  .btn-o:hover { border-color:var(--jade); color:var(--jade); background:rgba(0,74,153,0.06); }
  .btn-a { background:linear-gradient(135deg,var(--gold),var(--amber)); color:#0F2035; padding:12px 26px; border-radius:100px; border:none; font-family:var(--sans); font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 6px 22px rgba(232,132,90,0.35); transition:all 0.28s; text-decoration:none; display:inline-block; }
  .btn-a:hover { transform:translateY(-2px); box-shadow:0 12px 30px rgba(232,132,90,0.48); }
  .btn-sm { padding:8px 18px; font-size:13px; }
  .btn-sky { background:linear-gradient(135deg,var(--teal),#0284c7); color:#fff; padding:12px 26px; border-radius:100px; border:none; font-family:var(--sans); font-weight:600; font-size:14px; cursor:pointer; box-shadow:0 6px 22px rgba(14,165,233,0.35); transition:all 0.28s; text-decoration:none; display:inline-block; }
  .btn-sky:hover { transform:translateY(-2px); box-shadow:0 12px 30px rgba(14,165,233,0.45); }
  .btn-full { width:100%; }
  .btn-danger { background:rgba(249,112,102,0.12); color:var(--coral); border:1px solid rgba(249,112,102,0.25); padding:10px 20px; border-radius:10px; font-family:var(--sans); font-weight:600; font-size:13px; cursor:pointer; transition:all 0.25s; }
  .btn-danger:hover { background:rgba(249,112,102,0.2); }

  /* Cards */
  .card { background:rgba(255,255,255,0.85); border:1px solid var(--border); border-radius:18px; padding:24px; transition:all 0.35s; }
  .card:hover { border-color:rgba(0,74,153,0.28); transform:translateY(-4px); box-shadow:0 14px 44px rgba(0,74,153,0.12); }
  .glass-card { background:linear-gradient(145deg,rgba(255,255,255,0.7),rgba(244,247,246,0.85)); border:1px solid rgba(0,74,153,0.14); border-radius:22px; padding:30px; backdrop-filter:blur(14px); }

  /* Forms */
  .form-label { font-size:12px; font-weight:600; color:var(--jade); letter-spacing:0.5px; font-family:var(--mono); text-transform:uppercase; margin-bottom:7px; display:block; }
  .form-input, .form-select, .form-textarea { width:100%; background:rgba(255,255,255,0.9); border:1px solid rgba(0,74,153,0.18); border-radius:10px; padding:11px 15px; color:var(--text); font-family:var(--sans); font-size:14px; transition:all 0.22s; outline:none; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color:var(--jade); background:#fff; box-shadow:0 0 0 3px rgba(0,74,153,0.1); }
  .form-select option { background:#fff; }
  .form-textarea { resize:vertical; min-height:90px; line-height:1.6; }
  .form-group { margin-bottom:16px; }
  .form-row2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .form-row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .form-err { font-size:12px; color:var(--coral); margin-top:5px; }

  /* Badges */
  .badge { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; font-family:var(--mono); }
  .badge-mint  { background:rgba(132,189,96,0.12); color:var(--mint); border:1px solid rgba(132,189,96,0.25); }
  .badge-gold  { background:rgba(240,169,139,0.12); color:var(--gold); border:1px solid rgba(232,132,90,0.2); }
  .badge-sky   { background:rgba(14,165,233,0.12); color:var(--sky); border:1px solid rgba(14,165,233,0.2); }
  .badge-coral { background:rgba(249,112,102,0.12); color:var(--coral); border:1px solid rgba(249,112,102,0.2); }
  .badge-dim   { background:rgba(15,32,53,0.06); color:var(--muted); border:1px solid rgba(15,32,53,0.1); }

  /* Tag pills */
  .tag { padding:3px 9px; border-radius:100px; font-size:11px; font-weight:500; font-family:var(--mono); background:rgba(0,74,153,0.08); color:var(--jade); border:1px solid rgba(0,74,153,0.15); }

  /* Animations */
  .fade-in { opacity:0; transform:translateY(22px); transition:opacity 0.65s ease,transform 0.65s ease; }
  .fade-in.visible { opacity:1; transform:translateY(0); }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes pulse-dot{ 0%,100%{box-shadow:0 0 0 0 rgba(132,189,96,0.5)} 50%{box-shadow:0 0 0 8px rgba(132,189,96,0)} }
  @keyframes pulse-red{ 0%,100%{box-shadow:0 0 0 0 rgba(249,112,102,0.5)} 50%{box-shadow:0 0 0 8px rgba(249,112,102,0)} }
  @keyframes spin-slow{ to{transform:rotate(360deg)} }
  @keyframes slide-in { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }

  /* Dividers */
  hr.section-line { border:none; border-top:1px solid rgba(0,74,153,0.1); margin:32px 0; }

  /* Checkbox / Radio custom */
  .check-group { display:flex; flex-direction:column; gap:9px; }
  .check-item { display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; color:var(--muted); transition:color 0.2s; user-select:none; }
  .check-item:hover { color:var(--text); }
  .check-item input { accent-color:var(--jade); width:15px; height:15px; cursor:pointer; }
  .check-item.checked { color:var(--text); }

  @media (max-width:768px) {
    .form-row2, .form-row3 { grid-template-columns:1fr; }
    .si, .si-sm { padding:60px 4vw; }
  }
`;

/* Dashboard layout shared CSS (no Nav, full-screen) */
export const DASH_BASE = `
  ${FONTS}
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --forest:  #003580;
    --deep:    #F4F7F6;
    --emerald: #002E6E;
    --jade:    #004A99;
    --mint:    #84BD60;
    --gold:    #E8845A;
    --amber:   #F0A98B;
    --cream:   #FFFFFF;
    --teal:    #0ea5e9;
    --sky:     #38bdf8;
    --coral:   #f43f5e;
    --text:    #0F2035;
    --muted:   #5A7080;
    --border:  rgba(0,74,153,0.14);
    --sidebar: #EDF1F9;
    --panel:   rgba(255,255,255,0.97);
    --serif:   'Playfair Display', Georgia, serif;
    --sans:    'DM Sans', system-ui, sans-serif;
    --mono:    'DM Mono', monospace;
  }
  html,body { height:100%; }
  body { background:var(--deep); color:var(--text); font-family:var(--sans); overflow-x:hidden; }

  /* Shared dashboard layout */
  .dash-wrap  { display:flex; height:100vh; overflow:hidden; }
  .dash-side  { width:240px; min-width:240px; background:var(--sidebar); border-right:1px solid rgba(0,74,153,0.1); display:flex; flex-direction:column; overflow-y:auto; }
  .dash-main  { flex:1; overflow-y:auto; background:#F0F4FA; }
  .dash-logo  { padding:20px 20px 14px; border-bottom:1px solid rgba(0,74,153,0.08); }
  .dash-logo-text { font-family:var(--serif); font-size:20px; font-weight:700; color:var(--text); }
  .dash-logo-text span { color:var(--jade); }
  .dash-logo-sub  { font-size:10px; color:var(--muted); font-family:var(--mono); letter-spacing:1.5px; text-transform:uppercase; margin-top:2px; }
  .dash-user  { padding:14px 20px; border-bottom:1px solid rgba(0,74,153,0.08); display:flex; align-items:center; gap:10px; }
  .dash-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; background:linear-gradient(135deg,var(--jade),var(--emerald)); }
  .dash-user-name { font-size:13px; font-weight:600; }
  .dash-user-role { font-size:11px; color:var(--jade); font-family:var(--mono); }
  .dash-nav   { padding:12px 10px; flex:1; }
  .dash-nav-section { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(15,32,53,0.4); font-family:var(--mono); padding:10px 10px 6px; }
  .dash-nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:10px; cursor:pointer; transition:all 0.2s; font-size:13px; font-weight:500; color:var(--muted); text-decoration:none; margin-bottom:2px; }
  .dash-nav-item:hover { background:rgba(0,74,153,0.07); color:var(--text); }
  .dash-nav-item.active { background:rgba(0,74,153,0.1); color:var(--jade); border:1px solid rgba(0,74,153,0.15); }
  .dash-nav-item.active.gold { background:rgba(240,169,139,0.12); color:var(--gold); border-color:rgba(232,132,90,0.2); }
  .dash-nav-item.active.sky  { background:rgba(14,165,233,0.1); color:var(--sky); border-color:rgba(14,165,233,0.2); }
  .dash-nav-item.active.coral{ background:rgba(249,112,102,0.1); color:var(--coral); border-color:rgba(249,112,102,0.2); }
  .dash-nav-icon { font-size:17px; width:20px; text-align:center; }
  .dash-nav-badge { margin-left:auto; background:var(--coral); color:#fff; font-size:10px; font-weight:700; padding:2px 7px; border-radius:100px; font-family:var(--mono); }
  .dash-footer { padding:14px 20px; border-top:1px solid rgba(0,74,153,0.08); }
  .dash-footer a { font-size:12px; color:rgba(15,32,53,0.45); text-decoration:none; display:flex; align-items:center; gap:6px; transition:color 0.2s; }
  .dash-footer a:hover { color:var(--muted); }

  /* Main area */
  .dash-topbar { display:flex; align-items:center; justify-content:space-between; padding:18px 32px; border-bottom:1px solid rgba(0,74,153,0.1); background:rgba(255,255,255,0.85); sticky; top:0; z-index:10; }
  .dash-title  { font-family:var(--serif); font-size:22px; font-weight:700; }
  .dash-title span { color:var(--jade); font-style:italic; }
  .dash-actions { display:flex; align-items:center; gap:10px; }
  .dash-content { padding:28px 32px; }

  /* Stat cards */
  .stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
  .stat-box { background:rgba(255,255,255,0.85); border:1px solid var(--border); border-radius:16px; padding:20px; }
  .stat-box-icon { font-size:22px; margin-bottom:10px; }
  .stat-box-val { font-family:var(--serif); font-size:26px; font-weight:700; margin-bottom:4px; }
  .stat-box-val.mint  { color:var(--mint); }
  .stat-box-val.amber { color:var(--gold); }
  .stat-box-val.sky   { color:var(--sky); }
  .stat-box-val.coral { color:var(--coral); }
  .stat-box-label { font-size:12px; color:var(--muted); }
  .stat-box-delta { font-size:11px; font-family:var(--mono); margin-top:6px; }
  .stat-box-delta.up   { color:var(--mint); }
  .stat-box-delta.down { color:var(--coral); }

  /* Tabs */
  .dash-tabs { display:flex; gap:4px; padding:0 32px; border-bottom:1px solid rgba(0,74,153,0.1); background:rgba(255,255,255,0.7); overflow-x:auto; }
  .dash-tab  { padding:12px 18px; font-size:13px; font-weight:600; color:var(--muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; white-space:nowrap; font-family:var(--sans); }
  .dash-tab:hover { color:var(--text); }
  .dash-tab.active { color:var(--jade); border-bottom-color:var(--jade); }

  /* Table */
  .dash-table { width:100%; border-collapse:collapse; }
  .dash-table th { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:1px; font-family:var(--mono); padding:10px 14px; text-align:left; border-bottom:1px solid rgba(0,74,153,0.1); }
  .dash-table td { padding:13px 14px; font-size:13px; border-bottom:1px solid rgba(0,74,153,0.06); vertical-align:middle; }
  .dash-table tr:hover td { background:rgba(0,74,153,0.03); }
  .dash-table-wrap { background:rgba(255,255,255,0.85); border:1px solid var(--border); border-radius:16px; overflow:hidden; }

  /* Panel cards */
  .panel { background:rgba(255,255,255,0.85); border:1px solid var(--border); border-radius:16px; }
  .panel-head { padding:18px 22px; border-bottom:1px solid rgba(0,74,153,0.08); display:flex; align-items:center; justify-content:space-between; }
  .panel-title { font-size:15px; font-weight:700; }
  .panel-body { padding:18px 22px; }

  /* Form elements */
  .dash-input, .dash-select, .dash-textarea { width:100%; background:rgba(255,255,255,0.9); border:1px solid rgba(0,74,153,0.18); border-radius:9px; padding:10px 14px; color:var(--text); font-family:var(--sans); font-size:13px; transition:all 0.22s; outline:none; }
  .dash-input:focus, .dash-select:focus, .dash-textarea:focus { border-color:var(--jade); background:#fff; box-shadow:0 0 0 3px rgba(0,74,153,0.08); }
  .dash-select option { background:#fff; }
  .dash-textarea { resize:vertical; min-height:80px; line-height:1.6; }
  .dash-label { font-size:11px; font-weight:600; color:var(--jade); letter-spacing:0.5px; font-family:var(--mono); text-transform:uppercase; margin-bottom:6px; display:block; }
  .dash-form-group { margin-bottom:14px; }
  .dash-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

  /* Badges */
  .badge { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; font-family:var(--mono); }
  .badge-mint  { background:rgba(132,189,96,0.12); color:var(--mint); border:1px solid rgba(132,189,96,0.25); }
  .badge-gold  { background:rgba(240,169,139,0.12); color:var(--gold); border:1px solid rgba(232,132,90,0.2); }
  .badge-sky   { background:rgba(14,165,233,0.12); color:var(--sky); border:1px solid rgba(14,165,233,0.2); }
  .badge-coral { background:rgba(249,112,102,0.12); color:var(--coral); border:1px solid rgba(249,112,102,0.2); }
  .badge-dim   { background:rgba(15,32,53,0.06); color:var(--muted); border:1px solid rgba(15,32,53,0.1); }

  .tag { padding:3px 9px; border-radius:100px; font-size:11px; font-weight:500; font-family:var(--mono); background:rgba(0,74,153,0.08); color:var(--jade); border:1px solid rgba(0,74,153,0.15); }

  /* Buttons */
  .btn-p { background:linear-gradient(135deg,#F0A98B,#E8845A); color:#0F2035; padding:10px 22px; border-radius:100px; border:none; font-family:var(--sans); font-weight:600; font-size:13px; cursor:pointer; box-shadow:0 4px 16px rgba(232,132,90,0.38); transition:all 0.25s; }
  .btn-p:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,132,90,0.5); }
  .btn-p:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
  .btn-o { background:transparent; color:var(--text); padding:10px 22px; border-radius:100px; border:1px solid rgba(0,74,153,0.25); font-family:var(--sans); font-weight:500; font-size:13px; cursor:pointer; transition:all 0.25s; }
  .btn-o:hover { border-color:var(--jade); color:var(--jade); background:rgba(0,74,153,0.06); }
  .btn-a { background:linear-gradient(135deg,var(--gold),var(--amber)); color:#0F2035; padding:10px 22px; border-radius:100px; border:none; font-family:var(--sans); font-weight:700; font-size:13px; cursor:pointer; box-shadow:0 4px 16px rgba(232,132,90,0.35); transition:all 0.25s; }
  .btn-a:hover { transform:translateY(-2px); }
  .btn-sky { background:linear-gradient(135deg,var(--teal),#0284c7); color:#fff; padding:10px 22px; border-radius:100px; border:none; font-family:var(--sans); font-weight:600; font-size:13px; cursor:pointer; box-shadow:0 4px 16px rgba(14,165,233,0.32); transition:all 0.25s; }
  .btn-sky:hover { transform:translateY(-2px); }
  .btn-sm { padding:7px 15px; font-size:12px; }
  .btn-full { width:100%; }
  .btn-danger { background:rgba(249,112,102,0.12); color:var(--coral); border:1px solid rgba(249,112,102,0.25); padding:9px 18px; border-radius:10px; font-family:var(--sans); font-weight:600; font-size:13px; cursor:pointer; transition:all 0.22s; }
  .btn-danger:hover { background:rgba(249,112,102,0.2); }

  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
  @keyframes pulse-dot{ 0%,100%{box-shadow:0 0 0 0 rgba(132,189,96,0.5)} 50%{box-shadow:0 0 0 8px rgba(132,189,96,0)} }
  @keyframes pulse-red{ 0%,100%{box-shadow:0 0 0 0 rgba(249,112,102,0.5)} 50%{box-shadow:0 0 0 8px rgba(249,112,102,0)} }
  @keyframes spin-slow{ to{transform:rotate(360deg)} }
  @keyframes slide-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* Mobile hamburger & overlay */
  .dash-hamburger { display:none; align-items:center; justify-content:center; background:none; border:1px solid rgba(0,74,153,0.15); border-radius:9px; padding:7px 9px; cursor:pointer; color:var(--text); font-size:18px; line-height:1; transition:background 0.2s; flex-shrink:0; }
  .dash-hamburger:hover { background:rgba(0,74,153,0.08); }
  .dash-side-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:198; animation:fadeIn 0.2s; }
  .dash-side-overlay.open { display:block; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  /* Mobile topbar logout pill */
  .topbar-logout { display:none; align-items:center; gap:6px; background:rgba(249,112,102,0.1); border:1px solid rgba(249,112,102,0.25); border-radius:100px; padding:7px 14px; color:var(--coral); font-family:var(--mono); font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .topbar-logout:hover { background:rgba(249,112,102,0.2); }

  @media (max-width:900px) {
    .dash-hamburger { display:flex; }
    .topbar-logout { display:flex; }
    .dash-side {
      position:fixed; top:0; left:-260px; bottom:0;
      width:240px; z-index:199;
      transition:left 0.28s cubic-bezier(0.4,0,0.2,1);
      box-shadow:none;
    }
    .dash-side.open {
      left:0;
      box-shadow:6px 0 40px rgba(0,74,153,0.2);
    }
    .stat-grid { grid-template-columns:1fr 1fr; }
    .dash-content { padding:18px 16px; }
    .dash-topbar { padding:14px 16px; gap:10px; }
    .dash-form-row { grid-template-columns:1fr; }
    .dash-tabs { padding:0 16px; }
    .dash-title { font-size:17px; }
  }

  @media (max-width:500px) {
    .stat-grid { grid-template-columns:1fr 1fr; }
    .dash-topbar { flex-wrap:wrap; }
  }
`;
