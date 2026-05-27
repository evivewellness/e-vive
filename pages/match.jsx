import { useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { BASE_CSS } from "../components/SharedStyles";

const PAGE_CSS = `
  body { padding-top:72px; }

  .match-wrap { display:flex; min-height:calc(100vh - 72px); position:relative; z-index:1; }

  /* ── Filter Sidebar ── */
  .filter-side {
    width:296px; min-width:296px;
    background:rgba(237,241,249,0.98);
    border-right:1px solid rgba(0,74,153,0.12);
    overflow-y:auto; position:sticky; top:72px; height:calc(100vh - 72px);
    padding:0 0 0;
    display:flex; flex-direction:column;
    scrollbar-width:thin; scrollbar-color:rgba(0,74,153,0.2) transparent;
  }
  .filter-side::-webkit-scrollbar { width:4px; }
  .filter-side::-webkit-scrollbar-thumb { background:rgba(0,74,153,0.2); border-radius:2px; }

  .filter-header {
    padding:16px 20px 12px;
    border-bottom:1px solid rgba(0,74,153,0.1);
    position:sticky; top:0; background:rgba(237,241,249,0.99); z-index:2;
    flex-shrink:0;
  }
  .filter-header-row { display:flex; align-items:center; justify-content:space-between; }
  .filter-title  { font-size:13px; font-weight:700; font-family:var(--mono); letter-spacing:0.04em; }
  .filter-reset  { font-size:11px; color:var(--coral); cursor:pointer; font-family:var(--mono); background:none; border:none; font-weight:600; padding:4px 8px; border-radius:6px; transition:background 0.2s; }
  .filter-reset:hover { background:rgba(249,112,102,0.1); }
  .filter-count-badge { background:var(--jade); color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:100px; font-family:var(--mono); }

  /* Pending-changes bar */
  .pending-bar {
    padding:7px 20px; background:rgba(240,169,139,0.14);
    border-bottom:1px solid rgba(232,132,90,0.2);
    font-size:11px; color:var(--gold); font-family:var(--mono);
    display:flex; align-items:center; gap:6px; font-weight:600; flex-shrink:0;
  }
  .pending-dot { width:6px; height:6px; border-radius:50%; background:var(--gold); flex-shrink:0; animation:blink 1.4s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* Scrollable filter body */
  .filter-body { flex:1; overflow-y:auto; padding-bottom:8px; }

  .filter-section { padding:13px 20px; border-bottom:1px solid rgba(0,74,153,0.07); }
  .fs-label { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:var(--mono); color:var(--muted); margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .fs-icon  { font-size:13px; }
  .fs-count { margin-left:auto; font-size:10px; font-weight:600; color:var(--jade); font-family:var(--mono); background:rgba(0,74,153,0.08); padding:1px 7px; border-radius:100px; }

  .filter-chips { display:flex; flex-wrap:wrap; gap:6px; }
  .fchip {
    padding:4px 10px; border-radius:100px; font-size:11px; font-weight:500; font-family:var(--mono);
    border:1px solid rgba(0,74,153,0.18); background:rgba(255,255,255,0.7); color:var(--muted);
    cursor:pointer; transition:all 0.18s; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;
  }
  .fchip:hover  { border-color:rgba(0,74,153,0.38); color:var(--text); background:#fff; }
  .fchip.active { background:rgba(0,74,153,0.1); border-color:var(--jade); color:var(--jade); font-weight:600; }
  .fchip.fchip-zero { opacity:0.38; cursor:default; }
  .fchip.sky    { border-color:rgba(14,165,233,0.2); }
  .fchip.sky.active { background:rgba(14,165,233,0.12); border-color:var(--sky); color:var(--sky); }
  .fchip.gold   { border-color:rgba(232,132,90,0.22); }
  .fchip.gold.active { background:rgba(240,169,139,0.14); border-color:var(--gold); color:var(--gold); }
  .fchip.coral  { border-color:rgba(249,112,102,0.22); }
  .fchip.coral.active { background:rgba(249,112,102,0.12); border-color:var(--coral); color:var(--coral); }
  .chip-ct {
    font-size:9px; font-weight:700; font-family:var(--mono);
    background:rgba(0,74,153,0.1); color:var(--muted);
    padding:1px 5px; border-radius:100px; line-height:1.4;
  }
  .fchip.active .chip-ct { background:rgba(0,74,153,0.18); color:var(--jade); }
  .fchip.sky.active .chip-ct  { background:rgba(14,165,233,0.18); color:var(--sky); }
  .fchip.gold.active .chip-ct { background:rgba(232,132,90,0.18); color:var(--gold); }

  .filter-avail-toggle {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 12px; border-radius:10px; cursor:pointer;
    background:rgba(255,255,255,0.7); border:1px solid rgba(0,74,153,0.1);
    transition:all 0.2s; user-select:none;
  }
  .filter-avail-toggle:hover { border-color:rgba(0,74,153,0.3); }
  .filter-avail-toggle.on { background:rgba(0,74,153,0.08); border-color:rgba(0,74,153,0.35); }
  .toggle-pill {
    width:34px; height:18px; border-radius:100px; position:relative;
    background:rgba(15,32,53,0.15); transition:background 0.2s;
  }
  .toggle-pill.on { background:var(--jade); }
  .toggle-pill::after {
    content:''; position:absolute; top:3px; left:3px;
    width:12px; height:12px; border-radius:50%; background:#fff;
    transition:transform 0.2s;
  }
  .toggle-pill.on::after { transform:translateX(16px); }

  .date-input {
    background:#fff; border:1px solid rgba(0,74,153,0.18);
    border-radius:8px; padding:8px 11px; color:var(--text); font-family:var(--mono);
    font-size:11px; outline:none; width:100%; margin-top:8px;
  }
  .date-input:focus { border-color:var(--jade); }

  /* ── Apply footer (sticky at bottom of sidebar) ── */
  .filter-footer {
    position:sticky; bottom:0; flex-shrink:0;
    padding:14px 20px 18px;
    background:rgba(237,241,249,0.99);
    border-top:1px solid rgba(0,74,153,0.1);
  }
  .apply-btn {
    width:100%; padding:11px 16px; border-radius:12px;
    border:none; font-family:var(--sans); font-size:13px; font-weight:700;
    cursor:pointer; transition:all 0.22s;
    display:flex; align-items:center; justify-content:center; gap:8px;
    background:linear-gradient(135deg,#F0A98B,#E8845A); color:#0F2035;
    box-shadow:0 4px 16px rgba(232,132,90,0.35);
  }
  .apply-btn:hover { transform:translateY(-1px); box-shadow:0 8px 22px rgba(232,132,90,0.45); }
  .apply-btn.synced {
    background:rgba(0,74,153,0.06); color:var(--muted);
    box-shadow:none; cursor:default;
  }
  .apply-btn.synced:hover { transform:none; box-shadow:none; }
  .apply-badge {
    background:rgba(15,32,53,0.15); color:#0F2035;
    font-size:11px; font-weight:800; padding:2px 9px;
    border-radius:100px; font-family:var(--mono);
  }
  .apply-btn.synced .apply-badge { background:rgba(0,74,153,0.1); color:var(--jade); }
  .revert-btn {
    width:100%; margin-top:8px; padding:7px;
    text-align:center; font-size:11px; color:var(--coral);
    background:none; border:none; cursor:pointer;
    font-family:var(--mono); font-weight:600; border-radius:8px; transition:background 0.2s;
  }
  .revert-btn:hover { background:rgba(249,112,102,0.08); }

  /* Active filter pills (results topbar) */
  .active-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  .active-pill {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-family:var(--mono); font-weight:500;
    padding:3px 10px; border-radius:100px;
    background:rgba(0,74,153,0.1); border:1px solid rgba(0,74,153,0.22); color:var(--jade);
  }
  .active-pill.gold { background:rgba(240,169,139,0.12); border-color:rgba(232,132,90,0.3); color:var(--gold); }
  .active-pill.sky  { background:rgba(14,165,233,0.1); border-color:rgba(14,165,233,0.3); color:var(--sky); }
  .active-pill button { background:none; border:none; cursor:pointer; color:inherit; padding:0; font-size:12px; line-height:1; }

  /* ── Results ── */
  .results-area { flex:1; overflow-y:auto; min-width:0; }
  .results-topbar {
    padding:16px 24px; border-bottom:1px solid rgba(0,74,153,0.1);
    background:rgba(244,247,246,0.9); position:sticky; top:0; z-index:5;
    backdrop-filter:blur(12px);
  }
  .topbar-row1 { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
  .results-count   { font-size:14px; font-weight:600; }
  .results-count span { color:var(--jade); font-family:var(--mono); }
  .sort-row { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); }
  .sort-sel { background:#fff; border:1px solid rgba(0,74,153,0.18); border-radius:8px; padding:6px 11px; color:var(--text); font-family:var(--sans); font-size:12px; outline:none; cursor:pointer; }

  /* pending-in-topbar banner */
  .topbar-pending {
    margin-top:10px; padding:8px 12px;
    background:rgba(240,169,139,0.12); border:1px solid rgba(232,132,90,0.22);
    border-radius:9px; font-size:12px; color:var(--gold); font-family:var(--mono);
    display:flex; align-items:center; gap:8px; font-weight:600;
  }

  /* Mobile filter button */
  .mobile-filter-btn {
    display:none; align-items:center; gap:7px; padding:8px 16px;
    background:rgba(0,74,153,0.08); border:1px solid rgba(0,74,153,0.22);
    border-radius:100px; color:var(--text); font-size:13px; font-weight:600;
    cursor:pointer; font-family:var(--sans);
  }

  /* Bottom sheet chrome */
  .sheet-handle { display:none; flex-shrink:0; }
  .mobile-close-btn {
    display:none; align-items:center; justify-content:center;
    width:30px; height:30px; border-radius:8px;
    background:rgba(15,32,53,0.06); border:1px solid rgba(15,32,53,0.1);
    color:var(--muted); cursor:pointer; font-size:15px; flex-shrink:0;
  }
  @keyframes sheet-up { from{transform:translateY(100%)} to{transform:translateY(0)} }

  @media(max-width:900px) {
    .filter-side { display:none; }
    .filter-side.mobile-open {
      display:flex; flex-direction:column;
      position:fixed; left:0; right:0; bottom:0; top:auto;
      height:88vh; z-index:100;
      border-radius:22px 22px 0 0;
      box-shadow:0 -6px 40px rgba(0,74,153,0.14);
      animation:sheet-up 0.28s cubic-bezier(0.32,0.72,0,1);
    }
    .sheet-handle {
      display:block; width:40px; height:4px;
      background:rgba(15,32,53,0.14); border-radius:2px;
      margin:12px auto 4px; flex-shrink:0;
    }
    .mobile-close-btn { display:flex; }
    .mobile-filter-btn { display:flex; }
    .apply-btn { padding:13px 16px; font-size:14px; border-radius:14px; }
    .fchip { padding:6px 12px; font-size:12px; }
    .filter-section { padding:12px 18px; }
    .filter-footer { padding:14px 18px 24px; }
  }
  .mobile-overlay {
    display:none; position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:99;
  }
  .mobile-overlay.open { display:block; }

  /* ── Results grid ── */
  .results-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; padding:22px 24px; }
  @media(max-width:1200px) { .results-grid { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:900px)  { .results-grid { grid-template-columns:repeat(2,1fr); padding:16px; } }
  @media(max-width:600px)  { .results-grid { grid-template-columns:1fr; } }

  .empty-state { padding:80px 24px; text-align:center; }
  .empty-icon  { font-size:48px; margin-bottom:16px; opacity:0.5; }
  .empty-text  { font-size:15px; color:var(--muted); line-height:1.6; }

  /* ── HCA Card ── */
  .hca-card {
    background:rgba(255,255,255,0.88);
    border:1px solid rgba(0,74,153,0.12);
    border-radius:20px; padding:18px; transition:all 0.28s; position:relative;
    display:flex; flex-direction:column; gap:0;
  }
  .hca-card:hover { border-color:rgba(0,74,153,0.28); transform:translateY(-3px); box-shadow:0 14px 40px rgba(0,74,153,0.1); }
  .hca-card.shortlisted { border-color:rgba(232,132,90,0.45); background:linear-gradient(145deg,rgba(240,169,139,0.08),rgba(255,255,255,0.9)); }
  .hca-card.unavailable { opacity:0.72; }

  .hc-cert  { position:absolute; top:14px; right:14px; }
  .hc-top   { display:flex; gap:11px; align-items:flex-start; margin-bottom:11px; }
  .hc-av    { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; border:2px solid rgba(0,74,153,0.15); overflow:hidden; }
  .hc-av img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
  .hc-name  { font-weight:700; font-size:14px; margin-bottom:1px; padding-right:70px; }
  .hc-role  { font-size:10px; color:var(--jade); font-family:var(--mono); margin-bottom:4px; line-height:1.4; }
  .hc-rat   { font-size:11px; color:var(--gold); display:flex; align-items:center; gap:3px; }
  .hc-rat .rev { color:var(--muted); font-size:10px; }

  .hc-dist-avail { display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
  .dist-badge { display:inline-flex; align-items:center; gap:4px; font-size:10px; color:var(--muted); font-family:var(--mono); background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.13); padding:3px 8px; border-radius:100px; }
  .avail-badge { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-family:var(--mono); font-weight:600; padding:3px 8px; border-radius:100px; }
  .avail-badge.yes { background:rgba(132,189,96,0.12); color:#3e7c1f; border:1px solid rgba(132,189,96,0.35); }
  .avail-badge.no  { background:rgba(249,112,102,0.08); color:var(--coral); border:1px solid rgba(249,112,102,0.2); }
  .avail-badge .dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .avail-badge.yes .dot { background:var(--mint); animation:pulse-dot 2s infinite; }
  .avail-badge.no  .dot { background:var(--coral); }

  /* Rota week dots */
  .rota-row { margin-bottom:11px; }
  .rota-label { font-size:9px; font-family:var(--mono); color:var(--muted); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:5px; }
  .rota-days  { display:flex; gap:4px; }
  .rota-day   { display:flex; flex-direction:column; align-items:center; gap:2px; }
  .rota-day-name { font-size:8px; font-family:var(--mono); color:var(--muted); }
  .rota-dot   { width:14px; height:14px; border-radius:4px; }
  .rota-dot.day   { background:rgba(0,74,153,0.25); border:1px solid rgba(0,74,153,0.4); }
  .rota-dot.night { background:rgba(14,165,233,0.25); border:1px solid rgba(14,165,233,0.4); }
  .rota-dot.full  { background:rgba(132,189,96,0.3);  border:1px solid rgba(132,189,96,0.5); }
  .rota-dot.off   { background:rgba(15,32,53,0.06); border:1px solid rgba(15,32,53,0.1); }

  .hc-tags  { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px; }
  .hc-langs { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; }
  .lang-pill { padding:2px 8px; border-radius:100px; font-size:10px; font-weight:500; font-family:var(--mono); background:rgba(14,165,233,0.09); color:var(--sky); border:1px solid rgba(14,165,233,0.15); }
  .hc-meta  { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
  .hc-meta-item { font-size:10px; color:var(--muted); display:flex; align-items:center; gap:3px; }
  .hc-meta-item strong { color:var(--text); font-weight:600; font-size:11px; }

  .hc-foot  { display:flex; justify-content:space-between; align-items:center; padding-top:11px; border-top:1px solid rgba(0,74,153,0.08); margin-top:auto; }
  .hc-acts  { display:flex; gap:6px; align-items:center; }
  .sl-btn   { width:32px; height:32px; border-radius:9px; background:rgba(255,255,255,0.7); border:1px solid rgba(0,74,153,0.14); display:flex; align-items:center; justify-content:center; font-size:15px; cursor:pointer; transition:all 0.2s; }
  .sl-btn:hover  { background:rgba(240,169,139,0.14); border-color:rgba(232,132,90,0.35); }
  .sl-btn.active { background:rgba(240,169,139,0.2); border-color:var(--gold); }
  .view-btn { padding:7px 14px; border-radius:9px; background:linear-gradient(135deg,#F0A98B,#E8845A); color:#0F2035; border:none; font-family:var(--sans); font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s; text-decoration:none; }
  .view-btn:hover { box-shadow:0 4px 16px rgba(232,132,90,0.4); }

  /* Shortlist banner */
  .sl-banner {
    position:sticky; bottom:0; z-index:20;
    background:linear-gradient(135deg,rgba(237,241,249,0.97),rgba(244,247,246,0.99));
    border-top:1px solid rgba(232,132,90,0.3);
    padding:12px 24px; display:flex; align-items:center; justify-content:space-between;
    gap:14px; flex-wrap:wrap; backdrop-filter:blur(14px);
  }
  .sl-banner-left { display:flex; align-items:center; gap:11px; }
  .sl-cnt  { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--amber)); color:#0F2035; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; font-family:var(--mono); }
  .sl-names { font-size:12px; color:var(--muted); max-width:340px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  /* Profile modal */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.72); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(5px); }
  .modal-box { background:linear-gradient(145deg,rgba(255,255,255,0.99),rgba(244,247,246,0.99)); border:1px solid rgba(0,74,153,0.18); border-radius:26px; max-width:620px; width:100%; max-height:88vh; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(0,74,153,0.2) transparent; }
  .modal-head { padding:22px 26px 16px; border-bottom:1px solid rgba(0,74,153,0.1); display:flex; align-items:flex-start; justify-content:space-between; gap:14px; position:sticky; top:0; background:rgba(255,255,255,0.99); z-index:2; }
  .modal-close { background:rgba(15,32,53,0.05); border:1px solid rgba(0,74,153,0.15); border-radius:9px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; color:var(--muted); flex-shrink:0; transition:all 0.2s; }
  .modal-close:hover { color:var(--text); background:rgba(15,32,53,0.1); }
  .modal-body { padding:20px 26px 26px; }
  .msec-title { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:var(--mono); color:var(--muted); margin:18px 0 10px; display:flex; align-items:center; gap:7px; }
  .msec-title::before { content:''; display:block; width:20px; height:2px; background:var(--jade); border-radius:1px; }
  .m-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .m-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .detail-box { background:rgba(255,255,255,0.85); border:1px solid rgba(0,74,153,0.1); border-radius:11px; padding:12px; }
  .detail-label { font-size:10px; color:var(--muted); font-family:var(--mono); margin-bottom:3px; }
  .detail-val   { font-size:13px; font-weight:600; }
  .modal-bio    { font-size:13px; color:var(--muted); line-height:1.7; background:rgba(0,74,153,0.03); border:1px solid rgba(0,74,153,0.08); border-radius:12px; padding:14px 16px; }
  .modal-rota   { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
  .modal-rota-day { text-align:center; }
  .modal-rota-day .d-name { font-size:9px; font-family:var(--mono); color:var(--muted); margin-bottom:4px; }
  .modal-rota-day .d-dot  { width:28px; height:28px; border-radius:7px; margin:0 auto; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; font-family:var(--mono); }
  .d-dot.day   { background:rgba(0,74,153,0.14);   color:var(--jade);  border:1px solid rgba(0,74,153,0.35); }
  .d-dot.night { background:rgba(14,165,233,0.14); color:var(--sky);   border:1px solid rgba(14,165,233,0.35); }
  .d-dot.full  { background:rgba(132,189,96,0.18); color:#3e7c1f;      border:1px solid rgba(132,189,96,0.45); }
  .d-dot.off   { background:rgba(15,32,53,0.05);   color:var(--muted); border:1px solid rgba(15,32,53,0.1); }
  .rota-legend { display:flex; gap:14px; margin-top:10px; flex-wrap:wrap; }
  .rota-legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:var(--muted); font-family:var(--mono); }
  .rota-legend-dot { width:10px; height:10px; border-radius:3px; }
`;

// ── Data constants ──────────────────────────────────────────────────────────
const CARE_TYPES = ["Palliative","Dementia","Companionship","Critical Care","Diabetic Care","Cerebral Palsy","Visual Impairment","Mobility Assistance","Driver / Transport","Child Care","Post-Surgery","Mental Health","Other"];
const LANGUAGES  = ["English","Kiswahili","Kikuyu","Dholuo","Luhya","Kalenjin","Maasai","Kamba","French","German","Arabic","Sign Language"];
const AGE_RANGES = ["21–25","26–30","31–35","36–40","41–45","46–50","51+"];
const SHIFTS     = ["Day Shift","Night Shift","24-Hour Care"];
const PERIODS    = ["Short Term (1–2 wks)","Long Term (2+ wks)"];
const URGENCY    = ["Immediate","Planned"];
const TRAVEL     = ["Local Travel","International"];
const GENDERS    = ["Any","Female","Male"];
const DAYS       = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// rota: per day - "day" | "night" | "full" | "off"
const ALL_HCAS = [
  {
    id:1, av:"👩🏾", bg:"rgba(107,0,40,0.22)", photo:"/images/portraits/hca-amina-njeri.svg", name:"Amina Njeri", gender:"Female", age:"26–30",
    role:"Certified Nursing Assistant", cert:true, rat:4.9, reviews:42, dist:1.2,
    care:["Palliative","Post-Surgery"], langs:["English","Kiswahili","Kikuyu"],
    shifts:["Day Shift","Night Shift"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:800, exp:5, placements:18, avail:true,
    bio:"Compassionate nursing assistant with 5 years' specialist experience in post-surgical recovery and end-of-life palliative care. Known for her calm bedside manner and thorough Cardex documentation.",
    cultural:"Extensive experience with Kikuyu, Swahili and English-speaking households. Comfortable in both urban and rural Nairobi settings.",
    rota:{ Mon:"day", Tue:"day", Wed:"night", Thu:"day", Fri:"day", Sat:"off", Sun:"off" },
  },
  {
    id:2, av:"👨🏿", bg:"rgba(14,165,233,0.18)", photo:"/images/portraits/hca-john-omondi.svg", name:"John Omondi", gender:"Male", age:"31–35",
    role:"Home Care Specialist", cert:true, rat:4.8, reviews:31, dist:2.7,
    care:["Dementia","Critical Care"], langs:["English","Dholuo","Kiswahili"],
    shifts:["Night Shift","24-Hour Care"], period:"Long Term (2+ wks)", travel:["Local Travel","International"],
    rate:650, exp:8, placements:24, avail:true,
    bio:"Specialist in dementia and critical care with 8 years' experience across hospital and home settings. Holds a valid international travel document and has worked in the UK and UAE.",
    cultural:"Fluent in Dholuo and deeply familiar with Luo cultural practices around illness and family care.",
    rota:{ Mon:"night", Tue:"night", Wed:"full", Thu:"off", Fri:"night", Sat:"full", Sun:"night" },
  },
  {
    id:3, av:"👩🏽", bg:"rgba(232,213,168,0.18)", photo:"/images/portraits/hca-grace-otieno.svg", name:"Grace Otieno", gender:"Female", age:"36–40",
    role:"Palliative Care Aide", cert:true, rat:4.6, reviews:18, dist:3.4,
    care:["Palliative","Child Care"], langs:["Luhya","Kiswahili","English"],
    shifts:["Day Shift"], period:"Short Term (1–2 wks)", travel:["Local Travel"],
    rate:700, exp:4, placements:12, avail:false,
    bio:"Palliative and child care specialist trained at AMPATH. Currently on placement until end of month - available from the 2nd of next month.",
    cultural:"Experienced working with Luhya and Kikuyu families. Strong understanding of community-based palliative practices in Western Kenya.",
    rota:{ Mon:"off", Tue:"off", Wed:"off", Thu:"off", Fri:"off", Sat:"off", Sun:"off" },
  },
  {
    id:4, av:"👩🏿", bg:"rgba(0,74,153,0.12)", photo:"/images/portraits/hca-faith-wanjiku.svg", name:"Faith Wanjiku", gender:"Female", age:"26–30",
    role:"Companion & Mobility Carer", cert:false, rat:4.3, reviews:9, dist:1.8,
    care:["Companionship","Mobility Assistance"], langs:["Kikuyu","Kiswahili"],
    shifts:["Day Shift"], period:"Short Term (1–2 wks)", travel:["Local Travel"],
    rate:450, exp:2, placements:6, avail:true,
    bio:"Warm and attentive companion carer with 2 years' experience supporting elderly clients with mobility challenges. Skilled in safe patient transfers and daily routine support.",
    cultural:"Raised in Kiambu; highly familiar with Kikuyu family dynamics and expectations.",
    rota:{ Mon:"day", Tue:"day", Wed:"day", Thu:"day", Fri:"day", Sat:"off", Sun:"off" },
  },
  {
    id:5, av:"👨🏾", bg:"rgba(249,112,102,0.16)", photo:"/images/portraits/hca-samuel-kamau.svg", name:"Samuel Kamau", gender:"Male", age:"41–45",
    role:"Driver & Companion Carer", cert:false, rat:4.7, reviews:22, dist:4.1,
    care:["Driver / Transport","Companionship"], langs:["Kikuyu","Kiswahili","English"],
    shifts:["Day Shift","Night Shift"], period:"Long Term (2+ wks)", travel:["Local Travel","International"],
    rate:550, exp:6, placements:15, avail:true,
    bio:"Experienced driver-carer with a clean Class B license and 6 years accompanying clients to medical appointments, therapy sessions, and social engagements.",
    cultural:"Conversant in both urban Nairobi and upcountry contexts. Holds a valid passport and has accompanied clients to India for medical treatment.",
    rota:{ Mon:"day", Tue:"off", Wed:"day", Thu:"day", Fri:"day", Sat:"day", Sun:"off" },
  },
  {
    id:6, av:"👩🏾", bg:"rgba(232,213,168,0.2)", photo:"/images/portraits/hca-rose-adhiambo.svg", name:"Rose Adhiambo", gender:"Female", age:"21–25",
    role:"Child & Disability Specialist", cert:true, rat:4.5, reviews:14, dist:2.2,
    care:["Child Care","Cerebral Palsy"], langs:["Dholuo","Kiswahili","English"],
    shifts:["Day Shift"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:600, exp:3, placements:9, avail:true,
    bio:"Certified carer specialising in children with cerebral palsy and developmental disabilities. Trained in physiotherapy support techniques and augmentative communication.",
    cultural:"Strong understanding of Luo family structures. Experienced in working within faith-based family settings.",
    rota:{ Mon:"day", Tue:"day", Wed:"day", Thu:"off", Fri:"day", Sat:"day", Sun:"off" },
  },
  {
    id:7, av:"👨🏽", bg:"rgba(14,165,233,0.2)", photo:"/images/portraits/hca-peter-mutua.svg", name:"Peter Mutua", gender:"Male", age:"36–40",
    role:"Diabetic & Critical Care HCA", cert:true, rat:4.9, reviews:36, dist:5.0,
    care:["Diabetic Care","Critical Care"], langs:["Kamba","Kiswahili","English"],
    shifts:["24-Hour Care","Night Shift"], period:"Long Term (2+ wks)", travel:["International","Local Travel"],
    rate:900, exp:9, placements:30, avail:true,
    bio:"Senior HCA with 9 years' specialised experience in diabetic management and critical care. Proficient in insulin administration, wound care, and post-ICU home recovery protocols.",
    cultural:"Has worked with Kamba, Kikuyu, and Maasai families across Machakos, Nairobi, and Kajiado counties.",
    rota:{ Mon:"full", Tue:"night", Wed:"full", Thu:"night", Fri:"full", Sat:"off", Sun:"night" },
  },
  {
    id:8, av:"👩🏾", bg:"rgba(132,189,96,0.15)", photo:"/images/portraits/hca-mary-chebet.svg", name:"Mary Chebet", gender:"Female", age:"46–50",
    role:"Elderly & Dementia Care", cert:true, rat:4.7, reviews:28, dist:3.8,
    care:["Dementia","Palliative"], langs:["Kalenjin","Kiswahili","English"],
    shifts:["Day Shift","Night Shift"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:750, exp:12, placements:38, avail:false,
    bio:"Highly experienced dementia and palliative care specialist with 12 years in the field. Expert in validation therapy, sundowning management, and family education.",
    cultural:"Kalenjin-speaking, well-versed in Rift Valley communities. Trusted by over 38 families across Nakuru, Eldoret, and Nairobi.",
    rota:{ Mon:"off", Tue:"day", Wed:"day", Thu:"day", Fri:"day", Sat:"off", Sun:"off" },
  },
  {
    id:9, av:"👩🏿", bg:"rgba(249,112,102,0.12)", photo:"/images/portraits/hca-esther-kariuki.svg", name:"Esther Kariuki", gender:"Female", age:"31–35",
    role:"Mobility & Visual Impairment", cert:true, rat:4.4, reviews:11, dist:2.0,
    care:["Visual Impairment","Mobility Assistance"], langs:["Kikuyu","Kiswahili","French"],
    shifts:["Day Shift","24-Hour Care"], period:"Short Term (1–2 wks)", travel:["Local Travel","International"],
    rate:700, exp:5, placements:14, avail:true,
    bio:"Specialist carer for clients with visual impairments and mobility restrictions. Fluent in French - has supported clients in Kenya and France. Trained in guide techniques and white cane navigation.",
    cultural:"Bicultural exposure in Kenyan and Francophone African contexts. Experienced with international families and expatriate communities in Nairobi.",
    rota:{ Mon:"day", Tue:"off", Wed:"day", Thu:"full", Fri:"day", Sat:"off", Sun:"full" },
  },
  {
    id:10, av:"👨🏿", bg:"rgba(107,0,40,0.2)", photo:"/images/portraits/hca-david-barasa.svg", name:"David Barasa", gender:"Male", age:"41–45",
    role:"Critical & Post-Surgical Care", cert:true, rat:4.8, reviews:24, dist:6.2,
    care:["Critical Care","Post-Surgery","Mobility Assistance"], langs:["Luhya","Kiswahili","English"],
    shifts:["Day Shift","Night Shift","24-Hour Care"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:850, exp:10, placements:27, avail:true,
    bio:"Decade of experience in post-surgical and critical home care. Trained in stoma care, catheter management, and complex wound dressing. Trusted by cardiac surgery teams at Nairobi Hospital.",
    cultural:"Luhya-speaking, experienced in Western Kenya communities. Patient, methodical and trusted by families managing complex conditions.",
    rota:{ Mon:"night", Tue:"full", Wed:"night", Thu:"full", Fri:"night", Sat:"day", Sun:"off" },
  },
  {
    id:11, av:"👩🏽", bg:"rgba(200,149,42,0.14)", photo:"/images/portraits/hca-lillian-waweru.svg", name:"Lillian Waweru", gender:"Female", age:"31–35",
    role:"Mental Health Support Carer", cert:true, rat:4.6, reviews:17, dist:3.1,
    care:["Mental Health","Companionship"], langs:["Kikuyu","English","Kiswahili"],
    shifts:["Day Shift"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:720, exp:6, placements:16, avail:true,
    bio:"Trained in mental health first aid and psychosocial support. Works with clients managing depression, anxiety, and early dementia in home settings. Empathetic, non-judgmental approach.",
    cultural:"Nairobi-based with experience across Kikuyu, Luo, and mixed urban households.",
    rota:{ Mon:"day", Tue:"day", Wed:"off", Thu:"day", Fri:"day", Sat:"day", Sun:"off" },
  },
  {
    id:12, av:"👨🏾", bg:"rgba(14,165,233,0.15)", photo:"/images/portraits/hca-hassan-abdalla.svg", name:"Hassan Abdalla", gender:"Male", age:"26–30",
    role:"Palliative & Companion Care", cert:true, rat:4.5, reviews:13, dist:4.5,
    care:["Palliative","Companionship"], langs:["Arabic","Kiswahili","English"],
    shifts:["Day Shift","Night Shift"], period:"Short Term (1–2 wks)", travel:["Local Travel","International"],
    rate:680, exp:4, placements:11, avail:true,
    bio:"Arabic-speaking carer with training in Islamic palliative care protocols. Highly recommended for Muslim families requiring culturally aligned end-of-life care.",
    cultural:"Deeply versed in Somali, Arab, and Swahili Coast cultural norms around illness, death, and family roles.",
    rota:{ Mon:"day", Tue:"day", Wed:"night", Thu:"night", Fri:"off", Sat:"day", Sun:"day" },
  },
  {
    id:13, av:"👩🏾", bg:"rgba(232,132,90,0.14)", photo:"/images/portraits/hca-agnes-ndungu.svg", name:"Agnes Ndungu", gender:"Female", age:"46–50",
    role:"Child Care & Special Needs", cert:false, rat:4.2, reviews:8, dist:2.9,
    care:["Child Care","Cerebral Palsy","Visual Impairment"], langs:["Kikuyu","Kiswahili"],
    shifts:["Day Shift"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:500, exp:7, placements:19, avail:true,
    bio:"Experienced non-certified carer with 7 years working with children with special needs. Highly regarded by families for patience, creativity in play therapy, and communication.",
    cultural:"Based in Githurai. Comfortable in Kikuyu-speaking households and familiar with Nairobi's northern corridor communities.",
    rota:{ Mon:"day", Tue:"day", Wed:"day", Thu:"day", Fri:"off", Sat:"day", Sun:"off" },
  },
  {
    id:14, av:"👨🏽", bg:"rgba(249,112,102,0.14)", photo:"/images/portraits/hca-kelvin-rop.svg", name:"Kelvin Rop", gender:"Male", age:"21–25",
    role:"Mobility & Exercise Support", cert:false, rat:4.4, reviews:7, dist:1.5,
    care:["Mobility Assistance","Companionship"], langs:["Kalenjin","Kiswahili","English"],
    shifts:["Day Shift"], period:"Short Term (1–2 wks)", travel:["Local Travel"],
    rate:400, exp:2, placements:5, avail:true,
    bio:"Young, energetic carer with sports science background. Specialises in mobility exercises, physiotherapy support, and active ageing. Perfect for clients who need daily exercise supervision.",
    cultural:"Kalenjin from Eldoret - experienced with Rift Valley communities and recently relocated to Nairobi.",
    rota:{ Mon:"day", Tue:"day", Wed:"off", Thu:"day", Fri:"day", Sat:"off", Sun:"off" },
  },
  {
    id:15, av:"👩🏿", bg:"rgba(232,213,168,0.18)", photo:"/images/portraits/hca-jane-njambi.svg", name:"Jane Njambi", gender:"Female", age:"51+",
    role:"Senior Dementia Specialist", cert:true, rat:4.9, reviews:51, dist:5.5,
    care:["Dementia","Palliative","Companionship"], langs:["Kikuyu","Kiswahili","English"],
    shifts:["Day Shift","24-Hour Care"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:950, exp:18, placements:55, avail:true,
    bio:"18 years as one of Kenya's most experienced dementia carers. Mentor to over 30 junior HCAs. Renowned for her life review therapy techniques and family education sessions.",
    cultural:"Extensive cross-community experience, trusted across Kikuyu, Luo, Luhya, and Kamba families throughout her career.",
    rota:{ Mon:"day", Tue:"full", Wed:"day", Thu:"full", Fri:"day", Sat:"off", Sun:"off" },
  },
  {
    id:16, av:"👩🏾", bg:"rgba(14,165,233,0.18)", photo:"/images/portraits/hca-sylvia-achieng.svg", name:"Sylvia Achieng", gender:"Female", age:"36–40",
    role:"Diabetic Home Management", cert:true, rat:4.7, reviews:20, dist:3.3,
    care:["Diabetic Care","Post-Surgery"], langs:["Dholuo","Kiswahili","English"],
    shifts:["Day Shift","Night Shift"], period:"Long Term (2+ wks)", travel:["Local Travel"],
    rate:780, exp:7, placements:21, avail:false,
    bio:"Diabetic care specialist experienced in insulin management, dietary supervision, and foot care for Type 1 and Type 2 diabetes patients. Currently placed - available mid-next month.",
    cultural:"Luo-speaking from Kisumu. Well-regarded in both Nairobi and Nyanza region families.",
    rota:{ Mon:"off", Tue:"off", Wed:"off", Thu:"off", Fri:"off", Sat:"off", Sun:"off" },
  },
  {
    id:17, av:"👨🏿", bg:"rgba(0,74,153,0.12)", photo:"/images/portraits/hca-michael-oduya.svg", name:"Michael Oduya", gender:"Male", age:"36–40",
    role:"Driver & Medical Transport", cert:false, rat:4.6, reviews:16, dist:2.4,
    care:["Driver / Transport","Mobility Assistance"], langs:["Dholuo","Kiswahili","English"],
    shifts:["Day Shift"], period:"Short Term (1–2 wks)", travel:["Local Travel","International"],
    rate:520, exp:5, placements:13, avail:true,
    bio:"Dedicated driver-carer with 5 years' experience in medical transport. Skilled in wheelchair-accessible vehicle operation and accompanying clients to dialysis, chemotherapy, and outpatient appointments.",
    cultural:"Luo-speaking, Nairobi-based. Has driven clients across East Africa for regional medical travel.",
    rota:{ Mon:"day", Tue:"day", Wed:"day", Thu:"off", Fri:"day", Sat:"day", Sun:"off" },
  },
  {
    id:18, av:"👩🏽", bg:"rgba(249,112,102,0.18)", photo:"/images/portraits/hca-priya-mehta.svg", name:"Priya Mehta", gender:"Female", age:"26–30",
    role:"Critical Care & ICU Step-Down", cert:true, rat:4.8, reviews:19, dist:7.1,
    care:["Critical Care","Post-Surgery","Diabetic Care"], langs:["English","Kiswahili","German"],
    shifts:["24-Hour Care","Night Shift"], period:"Long Term (2+ wks)", travel:["Local Travel","International"],
    rate:1100, exp:6, placements:20, avail:true,
    bio:"Trained in Kenya and Germany, Priya specialises in ICU step-down home care for complex cardiac, respiratory, and surgical patients. German-speaking, ideal for expatriate families.",
    cultural:"Cross-cultural specialist - works with Kenyan, Asian, European and expatriate families across Nairobi and Karen.",
    rota:{ Mon:"full", Tue:"night", Wed:"off", Thu:"full", Fri:"night", Sat:"full", Sun:"night" },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const EMPTY = {
  care:[], langs:[], ages:[], shifts:[],
  period:"", urgency:"", startDate:"", travel:[],
  gender:"Any", availOnly:false,
};

function applyFilters(hcas, f) {
  return hcas.filter(h => {
    if (f.availOnly && !h.avail)                                          return false;
    if (f.gender !== "Any" && h.gender !== f.gender)                     return false;
    if (f.ages.length   && !f.ages.includes(h.age))                      return false;
    if (f.care.length   && !f.care.some(c  => h.care.includes(c)))       return false;
    if (f.langs.length  && !f.langs.some(l  => h.langs.includes(l)))     return false;
    if (f.shifts.length && !f.shifts.some(s  => h.shifts.includes(s)))   return false;
    if (f.period        && h.period !== f.period)                         return false;
    if (f.travel.length && !f.travel.some(t  => h.travel.includes(t)))   return false;
    return true;
  });
}

function countFilters(f) {
  return f.care.length + f.langs.length + f.ages.length + f.shifts.length
    + (f.period ? 1 : 0) + (f.urgency ? 1 : 0) + f.travel.length
    + (f.gender !== "Any" ? 1 : 0) + (f.availOnly ? 1 : 0);
}

function tog(arr, val) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

function RotaDots({ rota, compact = false }) {
  if (compact) {
    return (
      <div className="rota-row">
        <div className="rota-label">This week&apos;s availability</div>
        <div className="rota-days">
          {DAYS.map(d => (
            <div className="rota-day" key={d}>
              <div className="rota-day-name">{d[0]}</div>
              <div className={`rota-dot ${rota[d] || "off"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="modal-rota">
        {DAYS.map(d => (
          <div className="modal-rota-day" key={d}>
            <div className="d-name">{d}</div>
            <div className={`d-dot ${rota[d] || "off"}`}>
              {rota[d] === "day" ? "D" : rota[d] === "night" ? "N" : rota[d] === "full" ? "24" : "–"}
            </div>
          </div>
        ))}
      </div>
      <div className="rota-legend">
        {[["day","Day shift","rgba(0,74,153,0.2)"],["night","Night shift","rgba(14,165,233,0.25)"],["full","24-hr care","rgba(132,189,96,0.3)"],["off","Unavailable","rgba(15,32,53,0.07)"]].map(([k,l,bg]) => (
          <div className="rota-legend-item" key={k}><div className="rota-legend-dot" style={{background:bg}} />{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────
export default function MatchPage() {
  const [draft,        setDraft]        = useState(structuredClone(EMPTY));
  const [applied,      setApplied]      = useState(structuredClone(EMPTY));
  const [sort,         setSort]         = useState("distance");
  const [shortlist,    setShortlist]    = useState([]);
  const [modal,        setModal]        = useState(null);
  const [mobileFilter, setMobileFilter] = useState(false);

  // Live draft preview count (updates on every chip click)
  const draftCount = useMemo(() => applyFilters(ALL_HCAS, draft).length, [draft]);

  // Stable results - only update when Apply is hit
  const results = useMemo(() => {
    let r = applyFilters(ALL_HCAS, applied);
    if (sort === "distance")   r = [...r].sort((a,b) => a.dist - b.dist);
    if (sort === "rating")     r = [...r].sort((a,b) => b.rat  - a.rat);
    if (sort === "experience") r = [...r].sort((a,b) => b.exp  - a.exp);
    return r;
  }, [applied, sort]);

  const draftFilterCount   = countFilters(draft);
  const appliedFilterCount = countFilters(applied);
  const hasPending = JSON.stringify(draft) !== JSON.stringify(applied);

  // Per-chip counts: how many HCAs match all OTHER draft filters + this chip value
  // (ignores current selection in the chip's own category so counts stay nonzero)
  const chipCounts = useMemo(() => {
    const cc = {};
    const base = (omitField) => {
      const d = {...draft, [omitField]: Array.isArray(draft[omitField]) ? [] : (omitField === "gender" ? "Any" : "")};
      return applyFilters(ALL_HCAS, d);
    };
    CARE_TYPES.forEach(v  => { cc[`care:${v}`]   = base("care").filter(h => h.care.includes(v)).length; });
    LANGUAGES.forEach(v   => { cc[`langs:${v}`]  = base("langs").filter(h => h.langs.includes(v)).length; });
    AGE_RANGES.forEach(v  => { cc[`ages:${v}`]   = base("ages").filter(h => h.age === v).length; });
    SHIFTS.forEach(v      => { cc[`shifts:${v}`] = base("shifts").filter(h => h.shifts.includes(v)).length; });
    PERIODS.forEach(v     => { cc[`period:${v}`] = base("period").filter(h => h.period === v).length; });
    URGENCY.forEach(v     => { cc[`urgency:${v}`]= base("urgency").filter(h => !!h).length; }); // urgency not on HCA
    TRAVEL.forEach(v      => { cc[`travel:${v}`] = base("travel").filter(h => h.travel.includes(v)).length; });
    GENDERS.forEach(v     => { cc[`gender:${v}`] = base("gender").filter(h => v === "Any" || h.gender === v).length; });
    return cc;
  }, [draft]);

  function setDraftField(field, value) {
    setDraft(prev => ({...prev, [field]: value}));
  }

  function applyDraft() {
    setApplied(structuredClone(draft));
    setMobileFilter(false);
  }

  function revertDraft() {
    setDraft(structuredClone(applied));
  }

  function resetAll() {
    const empty = structuredClone(EMPTY);
    setDraft(empty);
    setApplied(empty);
  }

  // Applied-filter pills shown in results topbar
  const pills = [
    ...applied.care.map(c   => ({ label:c, type:"mint", remove:() => { const next={...applied, care: applied.care.filter(x=>x!==c)}; setApplied(next); setDraft(structuredClone(next)); } })),
    ...applied.langs.map(l  => ({ label:l, type:"sky",  remove:() => { const next={...applied, langs: applied.langs.filter(x=>x!==l)}; setApplied(next); setDraft(structuredClone(next)); } })),
    ...applied.ages.map(a   => ({ label:a, type:"mint", remove:() => { const next={...applied, ages: applied.ages.filter(x=>x!==a)}; setApplied(next); setDraft(structuredClone(next)); } })),
    ...applied.shifts.map(s => ({ label:s, type:"gold", remove:() => { const next={...applied, shifts: applied.shifts.filter(x=>x!==s)}; setApplied(next); setDraft(structuredClone(next)); } })),
    ...applied.travel.map(t => ({ label:t, type:"mint", remove:() => { const next={...applied, travel: applied.travel.filter(x=>x!==t)}; setApplied(next); setDraft(structuredClone(next)); } })),
    ...(applied.period    ? [{ label:applied.period,  type:"mint", remove:() => { const n={...applied,period:""}; setApplied(n); setDraft(structuredClone(n)); } }] : []),
    ...(applied.urgency   ? [{ label:applied.urgency, type:"gold", remove:() => { const n={...applied,urgency:"",startDate:""}; setApplied(n); setDraft(structuredClone(n)); } }] : []),
    ...(applied.gender!=="Any" ? [{ label:applied.gender, type:"mint", remove:() => { const n={...applied,gender:"Any"}; setApplied(n); setDraft(structuredClone(n)); } }] : []),
    ...(applied.availOnly ? [{ label:"Available Now", type:"gold", remove:() => { const n={...applied,availOnly:false}; setApplied(n); setDraft(structuredClone(n)); } }] : []),
  ];

  // ── Filter panel (sidebar content) ──────────────────────────────────────
  const FilterPanel = () => (
    <>
      <div className="sheet-handle" />
      <div className="filter-header">
        <div className="filter-header-row">
          <div className="filter-title">Filter Assistants</div>
          {appliedFilterCount > 0 && (
            <span className="filter-count-badge">{appliedFilterCount} applied</span>
          )}
          <button
            className="mobile-close-btn"
            onClick={() => { revertDraft(); setMobileFilter(false); }}
            aria-label="Close filters"
          >✕</button>
        </div>
        {draftFilterCount > 0 && (
          <div style={{marginTop:6,fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>
            {draftCount} of {ALL_HCAS.length} match your selections
          </div>
        )}
      </div>

      {hasPending && (
        <div className="pending-bar">
          <div className="pending-dot" />
          {draftFilterCount === 0 ? "All filters cleared" : `${draftFilterCount} filter${draftFilterCount!==1?"s":""} selected`} - not yet applied
        </div>
      )}

      <div className="filter-body">

        {/* Available Now toggle */}
        <div className="filter-section">
          <div
            className={`filter-avail-toggle${draft.availOnly ? " on" : ""}`}
            onClick={() => setDraftField("availOnly", !draft.availOnly)}
          >
            <span style={{fontSize:"13px",fontWeight:600,color:draft.availOnly?"var(--jade)":"var(--text)"}}>
              <span style={{marginRight:7}}>🟢</span>Available Now Only
              {chipCounts["gender:Any"] != null && (
                <span style={{marginLeft:6,fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",fontWeight:500}}>
                  ({ALL_HCAS.filter(h=>h.avail).length})
                </span>
              )}
            </span>
            <div className={`toggle-pill${draft.availOnly ? " on" : ""}`} />
          </div>
        </div>

        {/* Gender */}
        <div className="filter-section">
          <div className="fs-label">
            <span className="fs-icon">⚧</span>Gender
          </div>
          <div className="filter-chips">
            {GENDERS.map(g => {
              const ct = chipCounts[`gender:${g}`] ?? 0;
              return (
                <button
                  key={g}
                  className={`fchip${draft.gender===g?" active":""}${ct===0&&g!=="Any"?" fchip-zero":""}`}
                  onClick={() => setDraftField("gender", g)}
                  disabled={ct===0 && g!=="Any"}
                >
                  {g}
                  {g !== "Any" && <span className="chip-ct">{ct}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Age Range */}
        <div className="filter-section">
          <div className="fs-label">
            <span className="fs-icon">🎂</span>Age Range
            {draft.ages.length > 0 && <span className="fs-count">{draft.ages.length} selected</span>}
          </div>
          <div className="filter-chips">
            {AGE_RANGES.map(a => {
              const ct = chipCounts[`ages:${a}`] ?? 0;
              return (
                <button
                  key={a}
                  className={`fchip${draft.ages.includes(a)?" active":""}${ct===0?" fchip-zero":""}`}
                  onClick={() => ct > 0 && setDraftField("ages", tog(draft.ages, a))}
                >
                  {a}
                  <span className="chip-ct">{ct}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Care Type */}
        <div className="filter-section">
          <div className="fs-label">
            <span className="fs-icon">🩺</span>Type of Care Needed
            {draft.care.length > 0 && <span className="fs-count">{draft.care.length} selected</span>}
          </div>
          <div className="filter-chips">
            {CARE_TYPES.map(c => {
              const ct = chipCounts[`care:${c}`] ?? 0;
              return (
                <button
                  key={c}
                  className={`fchip${draft.care.includes(c)?" active":""}${ct===0?" fchip-zero":""}`}
                  onClick={() => ct > 0 && setDraftField("care", tog(draft.care, c))}
                >
                  {c}
                  <span className="chip-ct">{ct}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="filter-section">
          <div className="fs-label">
            <span className="fs-icon">🗣️</span>Language Preference
            {draft.langs.length > 0 && <span className="fs-count">{draft.langs.length} selected</span>}
          </div>
          <div className="filter-chips">
            {LANGUAGES.map(l => {
              const ct = chipCounts[`langs:${l}`] ?? 0;
              return (
                <button
                  key={l}
                  className={`fchip sky${draft.langs.includes(l)?" active":""}${ct===0?" fchip-zero":""}`}
                  onClick={() => ct > 0 && setDraftField("langs", tog(draft.langs, l))}
                >
                  {l}
                  <span className="chip-ct">{ct}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shifts */}
        <div className="filter-section">
          <div className="fs-label">
            <span className="fs-icon">🌓</span>Shift Type
            {draft.shifts.length > 0 && <span className="fs-count">{draft.shifts.length} selected</span>}
          </div>
          <div className="filter-chips">
            {SHIFTS.map(s => {
              const ct = chipCounts[`shifts:${s}`] ?? 0;
              return (
                <button
                  key={s}
                  className={`fchip gold${draft.shifts.includes(s)?" active":""}${ct===0?" fchip-zero":""}`}
                  onClick={() => ct > 0 && setDraftField("shifts", tog(draft.shifts, s))}
                >
                  {s}
                  <span className="chip-ct">{ct}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Period */}
        <div className="filter-section">
          <div className="fs-label"><span className="fs-icon">📅</span>Care Period</div>
          <div className="filter-chips">
            {PERIODS.map(p => {
              const ct = chipCounts[`period:${p}`] ?? 0;
              return (
                <button
                  key={p}
                  className={`fchip${draft.period===p?" active":""}${ct===0?" fchip-zero":""}`}
                  onClick={() => ct > 0 && setDraftField("period", draft.period===p ? "" : p)}
                >
                  {p}
                  <span className="chip-ct">{ct}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgency */}
        <div className="filter-section">
          <div className="fs-label"><span className="fs-icon">⏰</span>Urgency &amp; Start Date</div>
          <div className="filter-chips">
            {URGENCY.map(u => (
              <button
                key={u}
                className={`fchip coral${draft.urgency===u?" active":""}`}
                onClick={() => setDraftField("urgency", draft.urgency===u ? "" : u)}
              >
                {u}
              </button>
            ))}
          </div>
          {draft.urgency && (
            <div style={{marginTop:10}}>
              <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase"}}>
                {draft.urgency === "Immediate" ? "Starting Date" : "Expected Start Date"}
              </div>
              <input
                type="date" className="date-input"
                value={draft.startDate}
                onChange={e => setDraftField("startDate", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Travel */}
        <div className="filter-section">
          <div className="fs-label">
            <span className="fs-icon">✈️</span>Travel Availability
            {draft.travel.length > 0 && <span className="fs-count">{draft.travel.length} selected</span>}
          </div>
          <div className="filter-chips">
            {TRAVEL.map(t => {
              const ct = chipCounts[`travel:${t}`] ?? 0;
              return (
                <button
                  key={t}
                  className={`fchip${draft.travel.includes(t)?" active":""}${ct===0?" fchip-zero":""}`}
                  onClick={() => ct > 0 && setDraftField("travel", tog(draft.travel, t))}
                >
                  {t === "International" ? "🌍 " : ""}{t}
                  <span className="chip-ct">{ct}</span>
                </button>
              );
            })}
          </div>
          {draft.travel.includes("International") && (
            <div style={{marginTop:8,fontSize:10,color:"var(--gold)",fontFamily:"var(--mono)",background:"rgba(240,169,139,0.1)",border:"1px solid rgba(232,132,90,0.2)",borderRadius:7,padding:"7px 10px"}}>
              ✓ Only HCAs with valid travel documents shown
            </div>
          )}
        </div>

      </div>{/* end .filter-body */}

      {/* ── Sticky apply footer ── */}
      <div className="filter-footer">
        <button
          className={`apply-btn${!hasPending?" synced":""}`}
          onClick={hasPending ? applyDraft : undefined}
        >
          {hasPending ? (
            <>Show <span className="apply-badge">{draftCount}</span> assistant{draftCount!==1?"s":""} →</>
          ) : (
            <>✓ Showing <span className="apply-badge">{results.length}</span> assistant{results.length!==1?"s":""}</>
          )}
        </button>
        {hasPending && draftFilterCount > 0 && (
          <button className="revert-btn" onClick={revertDraft}>
            ↩ Undo changes
          </button>
        )}
        {hasPending && draftFilterCount === 0 && (
          <button className="revert-btn" onClick={revertDraft}>
            ↩ Restore previous filters
          </button>
        )}
        {!hasPending && appliedFilterCount > 0 && (
          <button className="revert-btn" onClick={resetAll}>
            Clear all filters
          </button>
        )}
      </div>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Find a HomeCare Assistant - E-Vive Kenya</title>
        <meta name="description" content="Search verified HomeCare Assistants by care type, language, shift, location and availability." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      <div className="match-wrap">

        <div className={`mobile-overlay${mobileFilter?" open":""}`} onClick={() => { revertDraft(); setMobileFilter(false); }} />

        <aside className={`filter-side${mobileFilter?" mobile-open":""}`}>
          <FilterPanel />
        </aside>

        <div className="results-area">
          <div className="results-topbar">
            <div className="topbar-row1">
              <div className="results-count">
                <span>{results.length}</span> of {ALL_HCAS.length} assistants
                {appliedFilterCount > 0 && " match your filters"}
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <button className="mobile-filter-btn" onClick={() => setMobileFilter(v=>!v)}>
                  ⚙ Filters
                  {appliedFilterCount > 0 && <span className="filter-count-badge" style={{marginLeft:4}}>{appliedFilterCount}</span>}
                  {hasPending && <span style={{marginLeft:4,width:7,height:7,borderRadius:"50%",background:"var(--gold)",display:"inline-block"}} />}
                </button>
                <div className="sort-row">
                  <span>Sort:</span>
                  <select className="sort-sel" value={sort} onChange={e=>setSort(e.target.value)}>
                    <option value="distance">Nearest first</option>
                    <option value="rating">Highest rated</option>
                    <option value="experience">Most experienced</option>
                  </select>
                </div>
              </div>
            </div>

            {hasPending && (
              <div className="topbar-pending">
                ◎ Filter changes pending —
                <button
                  onClick={applyDraft}
                  style={{background:"none",border:"none",cursor:"pointer",color:"var(--jade)",fontFamily:"var(--mono)",fontSize:12,fontWeight:700,padding:"0 4px",textDecoration:"underline"}}
                >
                  Show {draftCount}
                </button>
                or
                <button
                  onClick={revertDraft}
                  style={{background:"none",border:"none",cursor:"pointer",color:"var(--coral)",fontFamily:"var(--mono)",fontSize:12,fontWeight:600,padding:"0 4px"}}
                >
                  undo
                </button>
              </div>
            )}

            {pills.length > 0 && (
              <div className="active-pills">
                {pills.map((p,i) => (
                  <span key={i} className={`active-pill ${p.type}`}>
                    {p.label}
                    <button onClick={p.remove} title="Remove filter">×</button>
                  </span>
                ))}
                <button
                  style={{fontSize:11,color:"var(--coral)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontWeight:600}}
                  onClick={resetAll}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">
                No assistants match your current filters.<br/>
                <span style={{fontSize:13}}>Try removing some criteria or clearing all filters.</span>
              </div>
              <button className="btn-o" style={{marginTop:20}} onClick={resetAll}>Clear All Filters</button>
            </div>
          ) : (
            <div className="results-grid">
              {results.map(h => {
                const isSL = shortlist.includes(h.id);
                return (
                  <div key={h.id} className={`hca-card${isSL?" shortlisted":""}${!h.avail?" unavailable":""}`}>
                    <div className="hc-cert">
                      {h.cert
                        ? <span className="badge badge-mint">✓ Certified</span>
                        : <span className="badge badge-dim">Non-Certified</span>}
                    </div>

                    <div className="hc-top">
                      <div className="hc-av" style={{background:h.photo ? 'transparent' : h.bg}}>
                        {h.photo
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={h.photo} alt={h.name} />
                          : h.av}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="hc-name">{h.name}</div>
                        <div className="hc-role">{h.role}</div>
                        <div className="hc-rat">
                          {"★".repeat(Math.round(h.rat))} {h.rat}
                          <span className="rev">({h.reviews})</span>
                        </div>
                      </div>
                    </div>

                    <div className="hc-dist-avail">
                      <div className="dist-badge">📍 {h.dist} km</div>
                      <div className={`avail-badge ${h.avail?"yes":"no"}`}>
                        <div className="dot" />
                        {h.avail ? "Available" : "On Placement"}
                      </div>
                    </div>

                    <RotaDots rota={h.rota} compact />

                    <div className="hc-tags">
                      {h.care.slice(0,3).map(c => <span className="tag" key={c}>{c}</span>)}
                      {h.care.length > 3 && <span className="tag" style={{color:"var(--muted)"}}>+{h.care.length-3}</span>}
                    </div>
                    <div className="hc-langs">
                      {h.langs.map(l => <span className="lang-pill" key={l}>{l}</span>)}
                    </div>
                    <div className="hc-meta">
                      <div className="hc-meta-item">⏳ <strong>{h.exp} yrs</strong></div>
                      <div className="hc-meta-item">📋 <strong>{h.placements}</strong> placements</div>
                      {h.travel.includes("International") && <div className="hc-meta-item">✈️ Intl travel</div>}
                    </div>

                    <div className="hc-foot">
                      <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>
                        {h.shifts.join(" · ")}
                      </div>
                      <div className="hc-acts">
                        <button
                          className={`sl-btn${isSL?" active":""}`}
                          title={isSL?"Remove from shortlist":"Shortlist"}
                          onClick={() => setShortlist(p => isSL ? p.filter(x=>x!==h.id) : [...p, h.id])}
                        >{isSL?"★":"☆"}</button>
                        <button className="view-btn" onClick={() => setModal(h)}>View Profile</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shortlist.length > 0 && (
            <div className="sl-banner">
              <div className="sl-banner-left">
                <div className="sl-cnt">{shortlist.length}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>Shortlisted</div>
                  <div className="sl-names">{ALL_HCAS.filter(h=>shortlist.includes(h.id)).map(h=>h.name).join(", ")}</div>
                </div>
              </div>
              <Link href="/client/register" className="btn-a">Continue - Create Account →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <div className="modal-head">
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:modal.photo ? 'transparent' : modal.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,border:"2px solid rgba(0,74,153,0.18)",flexShrink:0,overflow:"hidden"}}>
                  {modal.photo
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={modal.photo} alt={modal.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    : modal.av}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:17,marginBottom:2}}>{modal.name}</div>
                  <div style={{fontSize:11,color:"var(--jade)",fontFamily:"var(--mono)",marginBottom:7}}>{modal.role}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {modal.cert?<span className="badge badge-mint">✓ Certified</span>:<span className="badge badge-dim">Non-Certified</span>}
                    <span className="badge badge-gold">★ {modal.rat} ({modal.reviews})</span>
                    <span className="badge badge-sky">📍 {modal.dist} km</span>
                    {modal.avail?<span className="badge badge-mint">🟢 Available</span>:<span className="badge badge-coral">🔴 On Placement</span>}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="msec-title">Profile Summary</div>
              <div className="modal-bio">{modal.bio}</div>

              <div className="msec-title">Key Details</div>
              <div className="m-grid3">
                {[["Gender",modal.gender],["Age Range",modal.age],["Experience",modal.exp+" yrs"],["Placements",modal.placements+" done"],["Period",modal.period]].map(([l,v])=>(
                  <div className="detail-box" key={l}><div className="detail-label">{l}</div><div className="detail-val">{v}</div></div>
                ))}
              </div>

              <div className="msec-title">Weekly Rota - This Week</div>
              <RotaDots rota={modal.rota} compact={false} />

              <div className="msec-title">Care Specialisations</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {modal.care.map(c=><span className="tag" key={c}>{c}</span>)}
              </div>

              <div className="msec-title">Languages</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {modal.langs.map(l=><span className="lang-pill" key={l}>{l}</span>)}
              </div>

              <div className="msec-title">Shift Availability</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {modal.shifts.map(s=><span className="badge badge-gold" key={s}>{s}</span>)}
              </div>

              <div className="msec-title">Travel</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {modal.travel.map(t=><span className="badge badge-sky" key={t}>{t}</span>)}
              </div>

              <div className="msec-title">Cultural &amp; Language Context</div>
              <div className="modal-bio" style={{fontStyle:"italic"}}>{modal.cultural}</div>

              <div style={{display:"flex",gap:10,marginTop:22}}>
                <button
                  className={`btn-${shortlist.includes(modal.id)?"o":"a"}`}
                  style={{flex:1}}
                  onClick={() => setShortlist(p => p.includes(modal.id) ? p.filter(x=>x!==modal.id) : [...p, modal.id])}
                >
                  {shortlist.includes(modal.id)?"★ Remove from Shortlist":"☆ Add to Shortlist"}
                </button>
                <Link href="/client/register" className="btn-p" style={{flex:1,textAlign:"center"}}>
                  Book This HCA →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
