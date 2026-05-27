import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`;

const CSS = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --forest:   #0d3b2e;
    --deep:     #071f18;
    --emerald:  #1a6b4a;
    --jade:     #2d9669;
    --mint:     #5ec994;
    --gold:     #c8952a;
    --amber:    #e8b84b;
    --cream:    #f5ede0;
    --silk:     #fdf8f2;
    --fog:      rgba(255,255,255,0.06);
    --glass:    rgba(255,255,255,0.04);
    --glow:     rgba(94,201,148,0.15);
    --r:        #e05555;
    --text:     #e8f4ee;
    --muted:    rgba(232,244,238,0.55);
    --serif:    'Playfair Display', Georgia, serif;
    --sans:     'DM Sans', system-ui, sans-serif;
    --mono:     'DM Mono', monospace;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--deep); color: var(--text); font-family: var(--sans); overflow-x: hidden; }
  
  /* NOISE OVERLAY */
  body::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  /* ===== NAV ===== */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 5vw; height: 72px;
    background: rgba(7,31,24,0.85);
    backdrop-filter: blur(20px) saturate(1.4);
    border-bottom: 1px solid rgba(94,201,148,0.12);
    transition: all 0.4s;
  }
  .nav.scrolled { height: 60px; background: rgba(7,31,24,0.97); }
  .logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
  .logo-mark {
    width: 36px; height: 36px; border-radius: 50%;
    background: conic-gradient(from 120deg, var(--jade), var(--gold), var(--mint), var(--jade));
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: var(--deep);
    box-shadow: 0 0 20px rgba(94,201,148,0.4);
    animation: spin-slow 12s linear infinite;
  }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  .logo-text { font-family: var(--serif); font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
  .logo-text span { color: var(--amber); }
  .nav-links { display: flex; gap: 32px; list-style: none; }
  .nav-links a { color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.3px; transition: color 0.2s; }
  .nav-links a:hover { color: var(--mint); }
  .nav-cta {
    background: linear-gradient(135deg, var(--jade), var(--emerald));
    color: var(--cream); border: none; padding: 10px 22px; border-radius: 100px;
    font-family: var(--sans); font-size: 13px; font-weight: 600; cursor: pointer;
    box-shadow: 0 4px 20px rgba(45,150,105,0.4); transition: all 0.25s;
    letter-spacing: 0.3px;
  }
  .nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(45,150,105,0.5); }

  /* ===== HERO ===== */
  .hero {
    min-height: 100vh; display: flex; align-items: center;
    position: relative; overflow: hidden; padding: 120px 5vw 80px;
  }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background: radial-gradient(ellipse 120% 80% at 70% 40%, rgba(26,107,74,0.25) 0%, transparent 60%),
                radial-gradient(ellipse 60% 60% at 20% 80%, rgba(200,149,42,0.08) 0%, transparent 50%),
                linear-gradient(160deg, var(--deep) 0%, #0a2a20 100%);
  }
  .hero-orb {
    position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
    animation: float 8s ease-in-out infinite;
  }
  .orb1 { width: 500px; height: 500px; right: -100px; top: -80px; background: radial-gradient(circle, rgba(45,150,105,0.2) 0%, transparent 70%); animation-delay: 0s; }
  .orb2 { width: 300px; height: 300px; right: 200px; bottom: 100px; background: radial-gradient(circle, rgba(200,149,42,0.12) 0%, transparent 70%); animation-delay: 3s; }
  .orb3 { width: 200px; height: 200px; left: 10%; top: 30%; background: radial-gradient(circle, rgba(94,201,148,0.1) 0%, transparent 70%); animation-delay: 6s; }
  @keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }

  .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; width: 100%; max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
  .hero-eyebrow { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .eyebrow-line { width: 40px; height: 2px; background: linear-gradient(90deg, var(--amber), var(--mint)); border-radius: 2px; }
  .eyebrow-text { font-size: 11px; font-weight: 600; letter-spacing: 2.5px; color: var(--amber); text-transform: uppercase; font-family: var(--mono); }
  .hero h1 { font-family: var(--serif); font-size: clamp(40px, 5vw, 68px); font-weight: 700; line-height: 1.12; letter-spacing: -1px; margin-bottom: 20px; }
  .hero h1 em { font-style: italic; color: var(--mint); }
  .hero h1 .gold { color: var(--amber); }
  .hero-sub { font-size: 17px; line-height: 1.7; color: var(--muted); max-width: 480px; margin-bottom: 36px; font-weight: 300; }
  .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }
  .btn-primary {
    background: linear-gradient(135deg, var(--jade) 0%, var(--emerald) 100%);
    color: var(--cream); padding: 14px 32px; border-radius: 100px; border: none;
    font-family: var(--sans); font-weight: 600; font-size: 15px; cursor: pointer;
    box-shadow: 0 8px 32px rgba(45,150,105,0.4); transition: all 0.3s; letter-spacing: 0.2px;
  }
  .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(45,150,105,0.5); }
  .btn-outline {
    background: transparent; color: var(--text); padding: 14px 32px; border-radius: 100px;
    border: 1px solid rgba(94,201,148,0.3); font-family: var(--sans); font-weight: 500; font-size: 15px;
    cursor: pointer; transition: all 0.3s;
  }
  .btn-outline:hover { border-color: var(--mint); color: var(--mint); background: rgba(94,201,148,0.06); }
  .hero-stats { display: flex; gap: 32px; margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(94,201,148,0.15); }
  .stat-item { }
  .stat-num { font-family: var(--serif); font-size: 28px; font-weight: 700; color: var(--mint); }
  .stat-label { font-size: 12px; color: var(--muted); font-weight: 500; margin-top: 2px; letter-spacing: 0.3px; }

  /* HERO VISUAL */
  .hero-visual { position: relative; display: flex; justify-content: center; align-items: center; }
  .hero-card-stack { position: relative; width: 100%; max-width: 420px; }
  .main-card {
    background: linear-gradient(145deg, rgba(26,107,74,0.4), rgba(13,59,46,0.6));
    border: 1px solid rgba(94,201,148,0.2);
    border-radius: 24px; padding: 32px;
    backdrop-filter: blur(20px);
    box-shadow: 0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
    animation: card-float 6s ease-in-out infinite;
  }
  @keyframes card-float { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(0.5deg)} }
  .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .card-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--jade), var(--amber)); display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .card-name { font-weight: 600; font-size: 15px; }
  .card-role { font-size: 12px; color: var(--mint); font-weight: 500; }
  .nutrition-bars { margin-bottom: 20px; }
  .bar-row { margin-bottom: 12px; }
  .bar-label { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; color: var(--muted); font-family: var(--mono); }
  .bar-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease; }
  .bar-protein { background: linear-gradient(90deg, var(--jade), var(--mint)); }
  .bar-iron { background: linear-gradient(90deg, var(--gold), var(--amber)); }
  .bar-vitc { background: linear-gradient(90deg, #5ba3d9, #89d4f0); }
  .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(94,201,148,0.1); }
  .badge { padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; font-family: var(--mono); background: rgba(94,201,148,0.12); color: var(--mint); border: 1px solid rgba(94,201,148,0.2); }
  .badge.gold { background: rgba(200,149,42,0.12); color: var(--amber); border-color: rgba(200,149,42,0.2); }
  .floating-chip {
    position: absolute; background: rgba(7,31,24,0.9); border: 1px solid rgba(94,201,148,0.25);
    border-radius: 14px; padding: 10px 16px; backdrop-filter: blur(12px);
    font-size: 12px; font-weight: 600; white-space: nowrap; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .chip1 { top: -20px; right: -20px; color: var(--amber); animation: chip-float 5s ease-in-out infinite; }
  .chip2 { bottom: 40px; left: -30px; color: var(--mint); animation: chip-float 7s ease-in-out infinite 1s; }
  .chip3 { bottom: -20px; right: 20px; color: #89d4f0; animation: chip-float 6s ease-in-out infinite 2s; }
  @keyframes chip-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  /* ===== SECTION SHARED ===== */
  section { position: relative; z-index: 1; }
  .section-inner { max-width: 1200px; margin: 0 auto; padding: 100px 5vw; }
  .section-tag { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 100px; background: rgba(94,201,148,0.08); border: 1px solid rgba(94,201,148,0.2); font-size: 11px; font-weight: 600; letter-spacing: 2px; color: var(--mint); text-transform: uppercase; font-family: var(--mono); margin-bottom: 16px; }
  .section-title { font-family: var(--serif); font-size: clamp(28px, 3.5vw, 46px); font-weight: 700; line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 16px; }
  .section-title em { font-style: italic; color: var(--mint); }
  .section-sub { font-size: 16px; color: var(--muted); line-height: 1.75; max-width: 560px; font-weight: 300; }
  .section-header { margin-bottom: 60px; }
  .divider { width: 60px; height: 3px; background: linear-gradient(90deg, var(--jade), var(--amber)); border-radius: 2px; margin-top: 16px; }

  /* ===== ABOUT ===== */
  .about-section { background: linear-gradient(180deg, transparent 0%, rgba(13,59,46,0.15) 50%, transparent 100%); }
  .about-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; align-items: center; }
  .about-visual { position: relative; }
  .founder-card {
    background: linear-gradient(145deg, rgba(26,107,74,0.3), rgba(13,59,46,0.5));
    border: 1px solid rgba(94,201,148,0.18); border-radius: 24px; padding: 40px;
    backdrop-filter: blur(16px);
  }
  .founder-avatar-wrap { position: relative; display: inline-block; margin-bottom: 24px; }
  .founder-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--jade), var(--gold)); display: flex; align-items: center; justify-content: center; font-size: 36px; border: 3px solid rgba(94,201,148,0.3); }
  .online-dot { position: absolute; bottom: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--mint); border: 3px solid var(--forest); animation: pulse-dot 2s ease-in-out infinite; }
  @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(94,201,148,0.5)} 50%{box-shadow:0 0 0 8px rgba(94,201,148,0)} }
  .founder-name { font-family: var(--serif); font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .founder-title { font-size: 13px; color: var(--mint); font-weight: 500; margin-bottom: 20px; font-family: var(--mono); }
  .founder-bio { font-size: 14px; line-height: 1.75; color: var(--muted); font-weight: 300; margin-bottom: 24px; }
  .credential-list { display: flex; flex-direction: column; gap: 10px; }
  .credential { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text); }
  .cred-icon { width: 28px; height: 28px; border-radius: 8px; background: rgba(94,201,148,0.12); border: 1px solid rgba(94,201,148,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .story-text h3 { font-family: var(--serif); font-size: 28px; font-weight: 700; margin-bottom: 20px; line-height: 1.3; }
  .story-text p { font-size: 15px; line-height: 1.8; color: var(--muted); margin-bottom: 16px; font-weight: 300; }
  .story-text p strong { color: var(--text); font-weight: 600; }
  .quote-block { border-left: 3px solid var(--amber); padding-left: 20px; margin: 28px 0; }
  .quote-block p { font-family: var(--serif); font-size: 18px; font-style: italic; color: var(--cream); line-height: 1.6; }
  .values-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 32px; }
  .value-pill { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px; background: rgba(94,201,148,0.06); border: 1px solid rgba(94,201,148,0.15); font-size: 13px; font-weight: 500; }
  .value-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mint); flex-shrink: 0; }

  /* ===== SERVICES ===== */
  .services-section { }
  .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .service-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(94,201,148,0.12);
    border-radius: 20px; padding: 32px; transition: all 0.4s; cursor: pointer; position: relative; overflow: hidden;
  }
  .service-card::before { content:''; position:absolute; inset:0; background: linear-gradient(135deg, rgba(45,150,105,0.08), transparent); opacity:0; transition: opacity 0.4s; border-radius: 20px; }
  .service-card:hover::before { opacity: 1; }
  .service-card:hover { border-color: rgba(94,201,148,0.35); transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
  .service-card.featured { background: linear-gradient(145deg, rgba(26,107,74,0.25), rgba(13,59,46,0.4)); border-color: rgba(94,201,148,0.3); }
  .service-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px; background: rgba(94,201,148,0.1); border: 1px solid rgba(94,201,148,0.2); }
  .service-icon.gold { background: rgba(200,149,42,0.1); border-color: rgba(200,149,42,0.2); }
  .service-icon.blue { background: rgba(89,161,209,0.1); border-color: rgba(89,161,209,0.2); }
  .service-num { font-family: var(--mono); font-size: 11px; color: var(--muted); letter-spacing: 1px; margin-bottom: 8px; }
  .service-title { font-family: var(--serif); font-size: 20px; font-weight: 700; margin-bottom: 12px; }
  .service-desc { font-size: 14px; line-height: 1.7; color: var(--muted); font-weight: 300; margin-bottom: 20px; }
  .service-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; font-family: var(--mono); background: rgba(94,201,148,0.08); color: var(--mint); border: 1px solid rgba(94,201,148,0.15); }

  /* ===== PLATFORM ===== */
  .platform-section { background: linear-gradient(180deg, transparent, rgba(13,59,46,0.12), transparent); }
  .platform-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 80px; align-items: center; }
  .platform-mockup {
    background: rgba(7,31,24,0.8); border: 1px solid rgba(94,201,148,0.2); border-radius: 24px;
    overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.5);
  }
  .mockup-bar { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-bottom: 1px solid rgba(94,201,148,0.1); background: rgba(13,59,46,0.4); }
  .mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
  .md1 { background: #e05555; } .md2 { background: var(--amber); } .md3 { background: var(--mint); }
  .mockup-url { flex: 1; text-align: center; font-size: 11px; color: var(--muted); font-family: var(--mono); background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 6px; }
  .mockup-content { padding: 20px; }
  .mockup-nav { display: flex; gap: 6px; margin-bottom: 16px; }
  .mock-nav-item { padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .mock-nav-item.active { background: var(--jade); color: var(--cream); }
  .mock-nav-item:not(.active) { background: rgba(255,255,255,0.05); color: var(--muted); }
  .mock-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .mock-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(94,201,148,0.1); border-radius: 12px; padding: 14px; }
  .mock-card-label { font-size: 10px; color: var(--muted); font-family: var(--mono); margin-bottom: 4px; }
  .mock-card-val { font-family: var(--serif); font-size: 20px; font-weight: 700; }
  .mock-card-val.green { color: var(--mint); } .mock-card-val.gold { color: var(--amber); }
  .mock-chart-area { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
  .chart-label { font-size: 10px; color: var(--muted); font-family: var(--mono); margin-bottom: 10px; }
  .mini-bars { display: flex; align-items: flex-end; gap: 4px; height: 48px; }
  .mini-bar { flex: 1; border-radius: 4px 4px 0 0; background: linear-gradient(0deg, var(--jade), var(--mint)); opacity: 0.7; transition: opacity 0.2s; }
  .mini-bar:hover { opacity: 1; }
  .mock-plan { background: linear-gradient(135deg, rgba(26,107,74,0.4), rgba(200,149,42,0.15)); border: 1px solid rgba(200,149,42,0.2); border-radius: 12px; padding: 14px; display: flex; align-items: center; justify-content: space-between; }
  .plan-info { font-size: 12px; } .plan-name { font-weight: 700; color: var(--amber); margin-bottom: 2px; } .plan-sub { color: var(--muted); font-size: 11px; }
  .plan-badge { background: var(--jade); color: var(--cream); border-radius: 8px; padding: 6px 12px; font-size: 11px; font-weight: 700; }
  .platform-features { }
  .platform-features h3 { font-family: var(--serif); font-size: 32px; font-weight: 700; margin-bottom: 12px; line-height: 1.3; }
  .platform-features p { font-size: 15px; color: var(--muted); line-height: 1.75; font-weight: 300; margin-bottom: 32px; }
  .feature-list { display: flex; flex-direction: column; gap: 16px; }
  .feature-item { display: flex; gap: 16px; align-items: flex-start; }
  .feature-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(94,201,148,0.1); border: 1px solid rgba(94,201,148,0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .feature-text h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .feature-text p { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 300; }

  /* ===== NUTRITION TOOL ===== */
  .nutrition-section { }
  .nutrition-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
  .nutrition-form-card {
    background: rgba(13,59,46,0.3); border: 1px solid rgba(94,201,148,0.18); border-radius: 24px;
    padding: 36px; backdrop-filter: blur(16px);
  }
  .form-title { font-family: var(--serif); font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .form-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
  .form-group { margin-bottom: 18px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--mint); letter-spacing: 0.5px; font-family: var(--mono); text-transform: uppercase; margin-bottom: 7px; display: block; }
  .form-input, .form-select, .form-textarea {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(94,201,148,0.2);
    border-radius: 10px; padding: 12px 16px; color: var(--text); font-family: var(--sans); font-size: 14px;
    transition: all 0.25s; outline: none;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--mint); background: rgba(94,201,148,0.06); box-shadow: 0 0 0 3px rgba(94,201,148,0.1); }
  .form-select option { background: var(--forest); }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .btn-full { width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, var(--jade), var(--emerald)); color: var(--cream); border: none; font-family: var(--sans); font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 24px rgba(45,150,105,0.35); margin-top: 8px; }
  .btn-full:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(45,150,105,0.5); }
  .nutrition-info h3 { font-family: var(--serif); font-size: 28px; font-weight: 700; margin-bottom: 16px; line-height: 1.3; }
  .nutrition-info p { font-size: 15px; color: var(--muted); line-height: 1.75; font-weight: 300; margin-bottom: 28px; }
  .nutrition-pillars { display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px; }
  .pillar-item { display: flex; gap: 14px; padding: 16px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(94,201,148,0.1); transition: all 0.25s; cursor: default; }
  .pillar-item:hover { background: rgba(94,201,148,0.05); border-color: rgba(94,201,148,0.2); }
  .pillar-icon { font-size: 24px; flex-shrink: 0; }
  .pillar-text h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .pillar-text p { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 300; }

  /* ===== PLANS ===== */
  .plans-section { }
  .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .plan-card {
    border-radius: 24px; padding: 36px; position: relative; overflow: hidden;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(94,201,148,0.12); transition: all 0.35s;
  }
  .plan-card:hover { transform: translateY(-8px); box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
  .plan-card.popular {
    background: linear-gradient(145deg, rgba(26,107,74,0.35), rgba(13,59,46,0.55));
    border-color: rgba(94,201,148,0.4);
    box-shadow: 0 20px 60px rgba(45,150,105,0.2);
  }
  .popular-ribbon { position: absolute; top: 20px; right: -28px; background: linear-gradient(135deg, var(--jade), var(--amber)); color: var(--cream); font-size: 10px; font-weight: 700; padding: 6px 40px; transform: rotate(45deg); letter-spacing: 1px; }
  .plan-tier { font-family: var(--mono); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .plan-name-big { font-family: var(--serif); font-size: 24px; font-weight: 700; margin-bottom: 16px; }
  .plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 24px; }
  .price-currency { font-size: 14px; font-weight: 600; color: var(--mint); }
  .price-amount { font-family: var(--serif); font-size: 48px; font-weight: 700; line-height: 1; }
  .price-period { font-size: 13px; color: var(--muted); }
  .plan-divider { height: 1px; background: rgba(94,201,148,0.1); margin-bottom: 20px; }
  .plan-features-list { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
  .plan-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--muted); }
  .check { color: var(--mint); font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .plan-btn { width: 100%; padding: 13px; border-radius: 12px; font-family: var(--sans); font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s; }
  .plan-btn.outline { background: transparent; border: 1px solid rgba(94,201,148,0.3); color: var(--text); }
  .plan-btn.outline:hover { border-color: var(--mint); color: var(--mint); background: rgba(94,201,148,0.06); }
  .plan-btn.solid { background: linear-gradient(135deg, var(--jade), var(--emerald)); border: none; color: var(--cream); box-shadow: 0 6px 24px rgba(45,150,105,0.35); }
  .plan-btn.solid:hover { box-shadow: 0 10px 32px rgba(45,150,105,0.5); transform: translateY(-2px); }

  /* ===== COMMUNITY ===== */
  .community-section { background: linear-gradient(180deg, transparent, rgba(26,107,74,0.08), transparent); }
  .community-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 60px; align-items: center; }
  .testimonials { display: flex; flex-direction: column; gap: 20px; }
  .testimonial-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(94,201,148,0.12); border-radius: 16px;
    padding: 24px; transition: all 0.3s;
  }
  .testimonial-card:hover { border-color: rgba(94,201,148,0.25); background: rgba(94,201,148,0.04); }
  .test-quote { font-size: 15px; line-height: 1.7; color: var(--muted); margin-bottom: 16px; font-style: italic; font-weight: 300; }
  .test-author { display: flex; align-items: center; gap: 10px; }
  .test-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .test-name { font-size: 13px; font-weight: 600; }
  .test-role { font-size: 11px; color: var(--mint); font-family: var(--mono); }
  .stars { color: var(--amber); font-size: 12px; margin-bottom: 10px; }
  .community-right h3 { font-family: var(--serif); font-size: 32px; font-weight: 700; margin-bottom: 16px; line-height: 1.3; }
  .community-right p { font-size: 15px; color: var(--muted); line-height: 1.75; font-weight: 300; margin-bottom: 28px; }
  .community-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .c-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(94,201,148,0.12); border-radius: 14px; padding: 20px; text-align: center; }
  .c-stat-num { font-family: var(--serif); font-size: 32px; font-weight: 700; color: var(--mint); }
  .c-stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }

  /* ===== CONTACT ===== */
  .contact-section { }
  .contact-inner { background: linear-gradient(135deg, rgba(26,107,74,0.25), rgba(13,59,46,0.5)); border: 1px solid rgba(94,201,148,0.2); border-radius: 32px; padding: 80px 60px; text-align: center; position: relative; overflow: hidden; }
  .contact-inner::before { content:''; position:absolute; top:-100px; right:-100px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(200,149,42,0.08), transparent 70%); pointer-events: none; }
  .contact-tag { display: inline-flex; background: rgba(200,149,42,0.1); border: 1px solid rgba(200,149,42,0.25); color: var(--amber); padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; font-family: var(--mono); margin-bottom: 20px; }
  .contact-inner h2 { font-family: var(--serif); font-size: clamp(28px, 4vw, 48px); font-weight: 700; margin-bottom: 16px; line-height: 1.2; }
  .contact-inner p { font-size: 16px; color: var(--muted); max-width: 500px; margin: 0 auto 36px; line-height: 1.7; font-weight: 300; }
  .contact-actions { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .contact-info { display: flex; justify-content: center; gap: 40px; margin-top: 48px; padding-top: 40px; border-top: 1px solid rgba(94,201,148,0.15); flex-wrap: wrap; }
  .c-info-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--muted); }
  .c-info-icon { font-size: 16px; }

  /* ===== FOOTER ===== */
  .footer { border-top: 1px solid rgba(94,201,148,0.1); padding: 40px 5vw; }
  .footer-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
  .footer-copy { font-size: 13px; color: var(--muted); }
  .footer-links { display: flex; gap: 24px; }
  .footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .footer-links a:hover { color: var(--mint); }

  /* ===== MOBILE NAV ===== */
  .hamburger { display: none; background: none; border: none; cursor: pointer; color: var(--text); font-size: 22px; }

  /* ===== ANIMATIONS ===== */
  .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .fade-in.visible { opacity: 1; transform: translateY(0); }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 900px) {
    .hero-grid, .about-grid, .platform-grid, .nutrition-grid, .community-grid { grid-template-columns: 1fr; }
    .hero-visual { display: none; }
    .services-grid, .plans-grid { grid-template-columns: 1fr 1fr; }
    .nav-links { display: none; }
    .hamburger { display: block; }
    .contact-inner { padding: 50px 30px; }
  }
  @media (max-width: 600px) {
    .services-grid, .plans-grid { grid-template-columns: 1fr; }
    .hero-stats { flex-wrap: wrap; gap: 20px; }
    .community-stats { grid-template-columns: 1fr 1fr; }
    .mock-cards { grid-template-columns: 1fr; }
  }
`;

const BAR_HEIGHTS = [30, 55, 45, 70, 60, 80, 65, 75, 55, 85, 70, 90];

export default function EVivePortal() {
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [activeMockNav, setActiveMockNav] = useState("Nutrition");
  const [formData, setFormData] = useState({ name: "", email: "", condition: "", focus: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const fadeRefs = useRef([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1 });
    document.querySelectorAll(".fade-in").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const mockNavItems = ["Nutrition", "Caregivers", "Community", "Records"];
  const services = [
    { icon: "🥗", num: "01", title: "Personalised Nutrition Plans", desc: "Evidence-based, cancer-specific meal plans designed around your treatment phase, taste tolerance, and cultural food preferences. Updated dynamically as your health progresses.", tags: ["Oncology", "Palliative", "Dietetics"], iconClass: "" },
    { icon: "🩺", num: "02", title: "Advisory Consultations", desc: "One-on-one sessions with Ms. Ruguru — CNA, wellness advisor and founder — integrating clinical assessment, nutritional analysis, and compassionate guidance.", tags: ["Clinical", "Telehealth", "1-on-1"], iconClass: "gold", featured: true },
    { icon: "🏠", num: "03", title: "Home Visit & Meal Prep Training", desc: "Expert home visits for hands-on meal preparation coaching tailored to the patient's needs, empowering families to sustain quality nutrition at home.", tags: ["Home Care", "Hands-On"], iconClass: "" },
    { icon: "💙", num: "04", title: "Caregiver Support Programme", desc: "Structured emotional support, burnout prevention coaching, and practical care coordination guidance for family caregivers — who are too often overlooked.", tags: ["Mental Health", "Burnout", "Family"], iconClass: "blue" },
    { icon: "📚", num: "05", title: "Nutrition Education & Awareness", desc: "Group workshops, community seminars, and digital content educating patients, families, and healthcare workers on nutrition's vital role in cancer recovery.", tags: ["Education", "Community"], iconClass: "" },
    { icon: "🌐", num: "06", title: "Digital Care Platform", desc: "Access care plans, book consultations, track nutritional progress, connect with the caregiver community — all through the secure E-Vive digital portal.", tags: ["Platform", "Digital", "24/7"], iconClass: "gold" },
  ];
  const plans = [
    { tier: "Starter", name: "Companion", price: "2,500", period: "/month", features: ["Platform access & care plan viewing", "1 group nutrition workshop/month", "Weekly meal planning templates", "Community forum access", "WhatsApp support (business hours)"], btn: "outline", popular: false },
    { tier: "Core", name: "Guardian", price: "6,500", period: "/month", features: ["Everything in Companion", "2 advisory consultations/month", "Personalised nutrition plan (dynamic)", "Caregiver support sessions (x2)", "Priority appointment booking", "Home visit (1x/quarter)"], btn: "solid", popular: true },
    { tier: "Premium", name: "Luminary", price: "14,000", period: "/month", features: ["Everything in Guardian", "Weekly consultations (unlimited)", "Dedicated care coordinator", "Telemedicine specialist access", "Family nutritional coaching", "Full clinical documentation & reporting"], btn: "outline", popular: false },
  ];
  const testimonials = [
    { quote: "When my mother was diagnosed, I felt completely lost. E-Vive gave us a practical roadmap — the personalised meal plans made a measurable difference in how she tolerated her chemotherapy.", name: "Grace M.", role: "Caregiver, Nairobi", avatar: "👩🏾", bg: "rgba(45,150,105,0.15)" },
    { quote: "Salome's understanding comes from lived experience. She doesn't just advise — she truly gets what we're going through. The support sessions have been life-changing for me as a caregiver.", name: "James K.", role: "Caregiver, Mombasa", avatar: "👨🏾", bg: "rgba(200,149,42,0.1)" },
    { quote: "The digital platform made tracking my nutrition so easy. I can show my oncologist the data and we now make decisions together. I feel in control for the first time.", name: "Ruth N.", role: "Cancer Survivor, Nakuru", avatar: "👩🏿", bg: "rgba(89,161,209,0.1)" },
  ];
  const nutritionPillars = [
    { icon: "🫀", title: "Treatment Readiness", desc: "Optimal nutritional status before and during chemotherapy, radiotherapy, and surgery to support treatment efficacy and tolerance." },
    { icon: "🌿", title: "Healing & Recovery", desc: "Anti-inflammatory, immune-supportive meal plans promoting tissue repair, weight maintenance, and energy restoration post-treatment." },
    { icon: "🧘🏾", title: "Quality of Life", desc: "Addressing appetite loss, nausea, swallowing difficulties, and fatigue through compassionate, patient-centred nutritional strategies." },
  ];
  const platformFeatures = [
    { icon: "📊", title: "Live Nutrition Tracking", desc: "Daily food logging with cancer-specific nutrient analysis, trend charts, and personalized alerts reviewed by your advisor." },
    { icon: "📅", title: "Smart Appointment System", desc: "Book, reschedule, and attend consultations — including video calls — directly from the platform." },
    { icon: "🔔", title: "Caregiver Alerts", desc: "Family members receive real-time care plan updates, medication reminders, and appointment notifications." },
    { icon: "🌍", title: "Diaspora Care Module", desc: "Kenyan families abroad commission and monitor loved ones' care plans, with full English reporting and FX billing." },
  ];

  const handleInput = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); setSubmitted(true); };

  return (
    <>
      <Head>
        <title>E-Vive Wellness Initiative — Cancer Nutrition & Care Support, Kenya</title>
        <meta name="description" content="E-Vive is East Africa's pioneering digital nutrition and care support platform for cancer patients, survivors, and caregivers. Evidence-based, personalised care from Nairobi, Kenya." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="E-Vive Wellness Initiative" />
        <meta property="og:description" content="East Africa's pioneering cancer nutrition & care platform. Personalised plans, advisory consultations, and a supportive community." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://app.evive.co.ke" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="logo-mark">E</div>
          <div className="logo-text">e<span>-</span>vive</div>
        </div>
        <ul className="nav-links">
          {[["About", "#about"], ["Services", "#services"], ["Platform", "#platform"], ["Plans", "#plans"], ["Community", "#community"]].map(([l, h]) => (
            <li key={l}><a href={h}>{l}</a></li>
          ))}
        </ul>
        <button className="nav-cta" onClick={() => document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" })}>
          Book Consultation
        </button>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg" />
        <div className="hero-orb orb1" /><div className="hero-orb orb2" /><div className="hero-orb orb3" />
        <div className="hero-grid">
          <div>
            <div className="hero-eyebrow"><div className="eyebrow-line" /><span className="eyebrow-text">Nairobi · Kenya · Est. 2025</span></div>
            <h1>Kamau <em>Hope</em>,<br/>Sustaining <span className="gold">Life</span></h1>
            <p className="hero-sub">E-Vive is East Africa&apos;s pioneering digital nutrition and care support platform for cancer patients, survivors, and their caregivers — founded on lived experience, clinical expertise, and compassion.</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" })}>Begin Your Care Journey →</button>
              <button className="btn-outline" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>Explore Services</button>
            </div>
            <div className="hero-stats">
              {[["300+", "Lives Touched"], ["15+", "Yrs Clinical Exp."], ["5", "Care Pillars"], ["24/7", "Digital Support"]].map(([n, l]) => (
                <div className="stat-item" key={l}>
                  <div className="stat-num">{n}</div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="floating-chip chip1">🏆 Top Wellness Initiative 2025</div>
              <div className="floating-chip chip2">✅ CNA Certified Founder</div>
              <div className="floating-chip chip3">🌍 Diaspora Care Ready</div>
              <div className="main-card">
                <div className="card-header">
                  <div className="card-avatar">👤</div>
                  <div><div className="card-name">Sarah O., Cancer Survivor</div><div className="card-role">Active Plan · Week 6 of 12</div></div>
                </div>
                <div className="nutrition-bars">
                  {[["Protein", "82%", "protein"], ["Iron (Fe)", "67%", "iron"], ["Vitamin C", "91%", "vitc"]].map(([l, v, cls]) => (
                    <div className="bar-row" key={l}>
                      <div className="bar-label"><span>{l}</span><span>{v}</span></div>
                      <div className="bar-track"><div className={`bar-fill bar-${cls}`} style={{ width: v }} /></div>
                    </div>
                  ))}
                </div>
                <div className="card-footer">
                  <span className="badge">✓ On Track</span>
                  <span className="badge gold">📅 Consult Thu 3PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section" id="about">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-visual fade-in">
              <div className="founder-card">
                <div className="founder-avatar-wrap">
                  <div className="founder-avatar">👩🏾</div>
                  <div className="online-dot" />
                </div>
                <div className="founder-name">Ms. Ruguru Mburu</div>
                <div className="founder-title">Founder & Director, CNA · Wellness Advisor</div>
                <div className="founder-bio">Ms. Ruguru combines clinical nursing assistance, 15+ years of entrepreneurship, and the deeply personal experience of caring for her late father through stage 4 cancer to build E-Vive — a service she wished existed when she needed it most.</div>
                <div className="credential-list">
                  {[["🩺","Certified Nursing Assistant (CNA)"], ["🎓","B.Sc Business & Information Technology, ANU"], ["💼","Consulting CEO & Board Member, DoITAfrica"], ["🍽️","Founder, Star Delight Enterprises (2020)"], ["📊","Data Analytics Bootcamp Graduate (2023)"], ["🌿","Specialist: Palliative & Dementia Care"]].map(([ic, tx]) => (
                    <div className="credential" key={tx}><div className="cred-icon">{ic}</div><span>{tx}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="story-text fade-in">
              <div className="section-tag">Our Story</div>
              <h3>Born from the bedside of a father,<br/><em>built for every family like ours</em></h3>
              <p>In 2020, Ms. Ruguru&apos;s father was diagnosed with stage 4 throat cancer. For months, she was his primary caregiver — navigating treatment protocols, managing pain, and desperately searching for guidance on nutrition that could support his recovery and comfort.</p>
              <div className="quote-block">
                <p>&ldquo;I searched everywhere for practical, culturally relevant nutritional guidance for cancer patients in Kenya. I found almost nothing. That gap became E-Vive.&rdquo;</p>
              </div>
              <p>The result of that journey was <strong>E-Vive Wellness Initiative</strong>, founded in January 2025. Informed by clinical training, extensive research, and lived experience, E-Vive is now expanding into a <strong>fully integrated digital care platform</strong> — matching the nutritional and care placement expertise of its Star Delight sister brand with cutting-edge technology.</p>
              <p>E-Vive is also powered by insights from <strong>Star Delight Enterprises</strong> — the founder&apos;s broader healthcare and care-personnel placement venture — creating an ecosystem where nutritional care, direct home care, and digital health converge.</p>
              <div className="values-grid">
                {["Empathy", "Integrity", "Compassion", "Excellence", "Hope", "Clinical Rigour"].map(v => (
                  <div className="value-pill" key={v}><div className="value-dot" />{v}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services-section" id="services">
        <div className="section-inner">
          <div className="section-header fade-in">
            <div className="section-tag">What We Offer</div>
            <h2 className="section-title">Holistic Care <em>Services</em></h2>
            <p className="section-sub">Six integrated service pillars spanning clinical nutrition, direct care, caregiver support, education, and digital health — all under one compassionate roof.</p>
            <div className="divider" />
          </div>
          <div className="services-grid">
            {services.map((s, i) => (
              <div className={`service-card fade-in ${s.featured ? "featured" : ""}`} key={i} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={`service-icon ${s.iconClass}`}>{s.icon}</div>
                <div className="service-num">{s.num}</div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
                <div className="service-tags">{s.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section className="platform-section" id="platform">
        <div className="section-inner">
          <div className="platform-grid">
            <div className="platform-mockup fade-in">
              <div className="mockup-bar">
                <div className="mockup-dot md1"/><div className="mockup-dot md2"/><div className="mockup-dot md3"/>
                <div className="mockup-url">app.evive.co.ke</div>
              </div>
              <div className="mockup-content">
                <div className="mockup-nav">
                  {mockNavItems.map(item => (
                    <div key={item} className={`mock-nav-item ${activeMockNav === item ? "active" : ""}`} onClick={() => setActiveMockNav(item)}>{item}</div>
                  ))}
                </div>
                <div className="mock-cards">
                  <div className="mock-card"><div className="mock-card-label">Today&apos;s Calories</div><div className="mock-card-val green">1,840</div></div>
                  <div className="mock-card"><div className="mock-card-label">Protein Goal</div><div className="mock-card-val gold">82%</div></div>
                </div>
                <div className="mock-chart-area">
                  <div className="chart-label">Weekly Nutritional Adherence</div>
                  <div className="mini-bars">
                    {BAR_HEIGHTS.map((h, i) => <div className="mini-bar" key={i} style={{ height: `${h}%` }} />)}
                  </div>
                </div>
                <div className="mock-plan">
                  <div className="plan-info"><div className="plan-name">Guardian Plan</div><div className="plan-sub">Next consult: Thursday 3:00 PM</div></div>
                  <div className="plan-badge">Active</div>
                </div>
              </div>
            </div>
            <div className="platform-features fade-in">
              <div className="section-tag">Digital Platform</div>
              <h3>Your care, <em>in your hands</em> — everywhere</h3>
              <p>The E-Vive Portal is a purpose-built digital health ecosystem that connects patients, caregivers, and advisors in real time. Accessible via web and mobile, it extends our care beyond the consultation room into everyday life.</p>
              <div className="feature-list">
                {platformFeatures.map((f, i) => (
                  <div className="feature-item" key={i}>
                    <div className="feature-icon">{f.icon}</div>
                    <div className="feature-text"><h4>{f.title}</h4><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONSULTATION FORM */}
      <section className="nutrition-section" id="consult">
        <div className="section-inner">
          <div className="nutrition-grid">
            <div className="nutrition-info fade-in">
              <div className="section-tag">Get Started</div>
              <h3>Begin Your Nutritional<br/><em>Care Journey Today</em></h3>
              <p>Your first step toward better quality of life through evidence-based, personalised nutrition. Every journey starts with a single conversation — and we are here to listen.</p>
              <div className="nutrition-pillars">
                {nutritionPillars.map((p, i) => (
                  <div className="pillar-item" key={i}>
                    <div className="pillar-icon">{p.icon}</div>
                    <div className="pillar-text"><h4>{p.title}</h4><p>{p.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="nutrition-form-card fade-in">
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-title">Request a Consultation</div>
                  <div className="form-sub">Complete this form and we&apos;ll reach out within 24 hours to confirm your session.</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" name="name" placeholder="Your name" value={formData.name} onChange={handleInput} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email / Phone</label>
                      <input className="form-input" name="email" placeholder="email or +254..." value={formData.email} onChange={handleInput} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Care Context</label>
                    <select className="form-select" name="condition" value={formData.condition} onChange={handleInput} required>
                      <option value="">Select your situation...</option>
                      <option>Active cancer treatment (chemotherapy/radiation)</option>
                      <option>Post-surgery recovery & rehabilitation</option>
                      <option>Palliative & comfort care</option>
                      <option>Cancer survivor — long-term wellness</option>
                      <option>Caregiver seeking guidance & support</option>
                      <option>General oncology nutrition advice</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Focus</label>
                    <select className="form-select" name="focus" value={formData.focus} onChange={handleInput}>
                      <option value="">What matters most right now?</option>
                      <option>Personalised meal planning</option>
                      <option>Caregiver support & burnout prevention</option>
                      <option>Home visit & hands-on coaching</option>
                      <option>Digital platform subscription</option>
                      <option>Comprehensive holistic package</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Additional Notes</label>
                    <textarea className="form-textarea" name="notes" placeholder="Share anything that will help us prepare for your session..." value={formData.notes} onChange={handleInput} />
                  </div>
                  <button type="submit" className="btn-full">Request Free First Consultation →</button>
                </form>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
                  <div className="form-title" style={{ marginBottom: 8 }}>Thank you, {formData.name || "friend"}.</div>
                  <div className="form-sub" style={{ marginBottom: 24 }}>Your consultation request has been received. Salome or a member of the E-Vive team will reach out within 24 hours to confirm your session. You are not alone in this.</div>
                  <button className="btn-outline" onClick={() => setSubmitted(false)} style={{ padding: "10px 28px", borderRadius: "100px", border: "1px solid rgba(94,201,148,0.3)", background: "transparent", color: "var(--mint)", cursor: "pointer" }}>Submit Another →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="plans-section" id="plans">
        <div className="section-inner">
          <div className="section-header fade-in" style={{ textAlign: "center" }}>
            <div className="section-tag" style={{ margin: "0 auto 16px" }}>Subscription Plans</div>
            <h2 className="section-title">Care that fits <em>your life</em></h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>Flexible, transparent plans designed for patients, caregivers, survivors and diaspora families. All prices in Kenyan Shillings.</p>
            <div className="divider" style={{ margin: "16px auto 0" }} />
          </div>
          <div className="plans-grid">
            {plans.map((p, i) => (
              <div className={`plan-card fade-in ${p.popular ? "popular" : ""}`} key={i} style={{ transitionDelay: `${i * 120}ms` }}>
                {p.popular && <div className="popular-ribbon">MOST LOVED</div>}
                <div className="plan-tier">{p.tier}</div>
                <div className="plan-name-big">{p.name}</div>
                <div className="plan-price">
                  <span className="price-currency">KES</span>
                  <span className="price-amount">{p.price}</span>
                  <span className="price-period">{p.period}</span>
                </div>
                <div className="plan-divider" />
                <ul className="plan-features-list">
                  {p.features.map((f, j) => <li className="plan-feature" key={j}><span className="check">✓</span><span>{f}</span></li>)}
                </ul>
                <button className={`plan-btn ${p.btn}`} onClick={() => document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" })}>
                  {p.popular ? "Choose Guardian →" : "Get Started →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="community-section" id="community">
        <div className="section-inner">
          <div className="community-grid">
            <div className="testimonials fade-in">
              {testimonials.map((t, i) => (
                <div className="testimonial-card" key={i}>
                  <div className="stars">★★★★★</div>
                  <div className="test-quote">{`“${t.quote}”`}</div>
                  <div className="test-author">
                    <div className="test-avatar" style={{ background: t.bg }}>{t.avatar}</div>
                    <div><div className="test-name">{t.name}</div><div className="test-role">{t.role}</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="community-right fade-in">
              <div className="section-tag">Community & Impact</div>
              <h3>You are not facing this <em>alone</em></h3>
              <p>E-Vive is more than a service — it is a community of patients, survivors, and caregivers walking this journey together. Our forum, support groups, and shared resources remind everyone that connection is as healing as nutrition.</p>
              <div className="community-stats">
                {[["300+", "Lives Supported"], ["92%", "Client Satisfaction"], ["5", "Counties Reached"], ["3", "Diaspora Nations"]].map(([n, l]) => (
                  <div className="c-stat" key={l}><div className="c-stat-num">{n}</div><div className="c-stat-label">{l}</div></div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" })}>Join the Community →</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-section">
        <div className="section-inner">
          <div className="contact-inner fade-in">
            <div className="contact-tag">Get In Touch</div>
            <h2>Ready to take the<br/><em>first step?</em></h2>
            <p>Whether you&apos;re a patient beginning treatment, a caregiver seeking support, or a diaspora family looking for trusted home care — E-Vive is here for you.</p>
            <div className="contact-actions">
              <button className="btn-primary" onClick={() => document.getElementById("consult")?.scrollIntoView({ behavior: "smooth" })}>Book a Free Consultation →</button>
              <button className="btn-outline" onClick={() => window.open('https://wa.me/254720053455?text=Hello%20E-Vive%2C%20I%20would%20like%20to%20book%20a%20consultation.', '_blank', 'noopener,noreferrer')}>WhatsApp Us</button>
            </div>
            <div className="contact-info">
              {[["📍","South C, Mugoya Estate, Nairobi, Kenya"], ["📧","salome@e-vive.app"], ["📞","+254 123 456789"], ["🌐","app.evive.co.ke"]].map(([ic, tx]) => (
                <div className="c-info-item" key={tx}><span className="c-info-icon">{ic}</span><span>{tx}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-copy">© 2025–2026 E-Vive Wellness Initiative · Star Delight Enterprises Ltd · Nairobi, Kenya</div>
          <div className="footer-links">
            {["Privacy Policy", "Terms of Use", "Accessibility", "Press"].map(l => <a href="#" key={l}>{l}</a>)}
          </div>
        </div>
      </footer>
    </>
  );
}
