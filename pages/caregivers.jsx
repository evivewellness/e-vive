import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';
import {
  getClientSession, getHcaSession, getAdminSession,
  getLmsCourses, getEnrollmentsForUser, enrollInCourse,
  updateCourseProgress, submitPartnerCourse, getAllClients,
  createHubAccessRequest, createHubReferral,
} from '../lib/store';

// ─── Real free resources ──────────────────────────────────────────────────────
const RESOURCES = [
  {
    type: 'WHO Manual', icon: '📖',
    title: 'Home Care for Patients — WHO Primary Health Care Manual',
    desc: 'The WHO\'s definitive guide for home care workers and family members. Covers assessment, basic nursing, medication, nutrition, and mental health support.',
    meta: 'Free PDF · WHO Publications',
    url: 'https://www.who.int/publications/i/item/9789241503662',
    filterType: 'Guides',
  },
  {
    type: 'Resource Hub', icon: '🏛️',
    title: 'Family Caregiver Alliance — Complete Resource Library',
    desc: 'The world\'s leading caregiver resource. Free fact sheets, guides, and toolkits on every aspect of family caregiving, from dementia to legal planning.',
    meta: 'Free · Online Library · FCA',
    url: 'https://www.caregiver.org/resource/fact-sheets/',
    filterType: 'Online Hubs',
  },
  {
    type: 'Dementia Guide', icon: '🧠',
    title: 'Alzheimer\'s Association Caregiver Resource Centre',
    desc: 'Comprehensive, evidence-based resources for dementia caregiving including stage-by-stage guidance, communication tips, and legal planning tools.',
    meta: 'Free · Online · Alzheimer\'s Association',
    url: 'https://www.alz.org/help-support/caregiving',
    filterType: 'Mental Health',
  },
  {
    type: 'Self-Care Guide', icon: '🧘',
    title: 'Taking Care of YOU: Self-Care for Family Caregivers',
    desc: 'A practical, evidence-based guide to preventing and recovering from caregiver burnout. Covers stress management, building support systems, and protecting your own health.',
    meta: 'Free PDF · Family Caregiver Alliance',
    url: 'https://www.caregiver.org/resource/taking-care-you-self-care-family-caregivers/',
    filterType: 'Guides',
  },
  {
    type: 'Ageing Guide', icon: '👴',
    title: 'Healthy Ageing: A Life Course Perspective — WHO',
    desc: 'WHO factsheet on healthy ageing, covering chronic disease management, functional ability, and supporting older adults to maintain independence at home.',
    meta: 'Free PDF · World Health Organization',
    url: 'https://www.who.int/docs/default-source/documents/healthy-ageing-factsheet.pdf',
    filterType: 'Guides',
  },
  {
    type: 'Caregiver Hub', icon: '❤️',
    title: 'AARP Family Caregiving Resource Centre',
    desc: 'Practical tools including care guides, legal and financial planning resources, and wellbeing tools for caregivers. The largest caregiving resource in English.',
    meta: 'Free · Online · AARP',
    url: 'https://www.aarp.org/caregiving/',
    filterType: 'Online Hubs',
  },
  {
    type: 'Palliative Care', icon: '🕊️',
    title: 'HPCA Africa — Palliative Care for Families Guide',
    desc: 'The Hospice and Palliative Care Association of Africa provides free resources specifically for African contexts, covering pain management, emotional support, and end-of-life care.',
    meta: 'Free · Online · HPCA Africa',
    url: 'https://www.hpca.co.za/page/palliative-care-guidelines',
    filterType: 'End-of-Life',
  },
  {
    type: 'Medication Guide', icon: '💊',
    title: 'Caregiver\'s Guide to Medications and Ageing — FCA',
    desc: 'A comprehensive guide to managing medications safely at home: polypharmacy risks, organising schedules, avoiding errors, and communicating with healthcare providers.',
    meta: 'Free PDF · Family Caregiver Alliance',
    url: 'https://www.caregiver.org/resource/caregivers-guide-medications-and-aging/',
    filterType: 'Guides',
  },
  {
    type: 'NIA Guide', icon: '🏥',
    title: 'Caring for a Person with Alzheimer\'s — National Institute on Aging',
    desc: 'The US National Institute on Aging\'s free online guide covers all stages of Alzheimer\'s care from diagnosis to end of life. Available in downloadable PDF.',
    meta: 'Free PDF/Web · National Institute on Aging',
    url: 'https://www.nia.nih.gov/health/alzheimers-and-dementia/caring-person-alzheimers-disease',
    filterType: 'Mental Health',
  },
  {
    type: 'Mental Health', icon: '🧩',
    title: 'Mental Health First Aid International — Caregiver Edition',
    desc: 'Learn to recognise and respond to mental health challenges in yourself and those you care for. Free resources from Mental Health First Aid International.',
    meta: 'Free · Online · MHFA International',
    url: 'https://mhfa.com.au/mental-health-first-aid-guidelines',
    filterType: 'Mental Health',
  },
  {
    type: 'WHO mhGAP', icon: '📋',
    title: 'WHO mhGAP Intervention Guide v2.0',
    desc: 'The WHO\'s guide for managing mental, neurological, and substance use disorders in non-specialist settings — highly relevant for home care of patients with dementia, depression, or substance issues.',
    meta: 'Free PDF · World Health Organization',
    url: 'https://www.who.int/publications/i/item/mhGAP-intervention-guide---version-2.0',
    filterType: 'Mental Health',
  },
  {
    type: 'End-of-Life', icon: '📝',
    title: 'End-of-Life Planning Guide — National Institute on Aging',
    desc: 'Practical guidance on advance care planning, legal documents, and having end-of-life conversations. Helps families prepare while the patient can still express their wishes.',
    meta: 'Free Web/PDF · National Institute on Aging',
    url: 'https://www.nia.nih.gov/health/end-of-life',
    filterType: 'End-of-Life',
  },
];

const RESOURCE_FILTERS = ['All', 'Guides', 'Mental Health', 'End-of-Life', 'Online Hubs'];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  body { padding-top: 72px; }

  /* ── Hero ── */
  .cg-hero {
    background: radial-gradient(ellipse 80% 60% at 75% 35%, rgba(0,74,153,0.08) 0%, transparent 58%),
                radial-gradient(ellipse 50% 55% at 5% 75%, rgba(132,189,96,0.07) 0%, transparent 55%),
                linear-gradient(155deg, #EBF1FA 0%, #F4F7F6 55%, #EEF5EE 100%);
    padding: 80px 24px 60px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cg-hero-photos { position:absolute; inset:0; z-index:1; overflow:hidden; pointer-events:none; }
  .cg-hp2 {
    position:absolute; top:0; right:0; height:100%; width:62%; object-fit:cover; display:block;
    object-position:55% 15%; opacity:0.45;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, black 50%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, black 50%, black 100%);
  }
  .cg-hp1 {
    position:absolute; top:0; right:0; height:100%; width:44%; object-fit:cover; display:block;
    object-position:52% 10%; opacity:0.38;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 20%, black 48%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 20%, black 48%, black 100%);
  }
  .cg-hp-btm {
    position:absolute; bottom:0; left:0; right:0; height:200px;
    background:linear-gradient(to bottom, transparent 0%, rgba(235,241,250,0.97) 100%);
  }
  .cg-hero-overlay {
    position:absolute; inset:0; z-index:2; pointer-events:none;
    background:linear-gradient(to right,
      rgba(235,241,250,0.97) 0%, rgba(235,241,250,0.94) 30%,
      rgba(235,241,250,0.80) 48%, rgba(235,241,250,0.55) 62%,
      rgba(235,241,250,0.22) 78%, transparent 90%);
  }
  .cg-hero-inner { position: relative; z-index: 3; max-width: 720px; margin: 0 auto; }
  .cg-hero-tag {
    display: inline-block;
    background: rgba(0,74,153,0.08);
    border: 1px solid rgba(0,74,153,0.22);
    color: var(--jade);
    padding: 6px 18px;
    border-radius: 999px;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .cg-hero h1 { font-size: clamp(2rem,5vw,3.2rem); margin-bottom: 18px; color: var(--text); }
  .cg-hero p { font-size: 1.1rem; color: rgba(15,32,53,0.72); max-width: 540px; margin: 0 auto 32px; line-height: 1.7; }
  .cg-hero-stats { display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; margin-top: 40px; }
  .cg-hero-stat { text-align: center; }
  .cg-hero-stat .val { font-size: 2rem; font-weight: 700; color: var(--jade); }
  .cg-hero-stat .lab { font-size: 0.8rem; color: var(--muted); }

  /* ── Auth gate ── */
  .gate-overlay {
    position: absolute; inset: 0; z-index: 5;
    background: linear-gradient(to bottom, rgba(235,241,250,0.6) 0%, rgba(235,241,250,0.97) 70%);
    display: flex; align-items: flex-end; justify-content: center; padding-bottom: 40px;
  }
  .gate-lock {
    text-align: center;
  }
  .gate-lock-icon { font-size: 2.4rem; margin-bottom: 12px; }
  .gate-lock h2 { font-size: 1.5rem; margin-bottom: 8px; color: var(--text); }
  .gate-lock p { font-size: 0.95rem; color: var(--muted); margin-bottom: 24px; }
  .gate-cards {
    max-width: 900px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; padding: 0 24px 48px;
  }
  .gate-card {
    background: rgba(255,255,255,0.92); border: 1px solid rgba(0,74,153,0.14);
    border-radius: 18px; padding: 28px 24px; text-align: center;
    box-shadow: 0 4px 24px rgba(0,74,153,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .gate-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,74,153,0.14); }
  .gate-card .gate-icon { font-size: 2rem; margin-bottom: 12px; }
  .gate-card h3 { font-size: 1rem; margin-bottom: 8px; }
  .gate-card p { font-size: 0.83rem; color: var(--muted); line-height: 1.55; margin-bottom: 18px; }
  .partner-gate-form { display: flex; flex-direction: column; gap: 10px; text-align: left; }
  .partner-gate-form input, .partner-gate-form textarea {
    width: 100%; background: rgba(255,255,255,0.9); border: 1px solid rgba(0,74,153,0.18);
    border-radius: 8px; padding: 9px 12px; color: var(--text); font-family: var(--sans);
    font-size: 0.82rem; outline: none; transition: border-color 0.2s;
  }
  .partner-gate-form input:focus, .partner-gate-form textarea:focus { border-color: var(--jade); }
  .partner-gate-form textarea { min-height: 70px; resize: vertical; }

  /* ── User badge ── */
  .user-badge {
    background: rgba(0,74,153,0.05); border-bottom: 1px solid rgba(0,74,153,0.1);
    padding: 10px 24px; text-align: center; font-size: 0.82rem; color: var(--muted);
  }
  .user-badge a { color: var(--jade); text-decoration: none; font-weight: 600; }
  .user-badge a:hover { text-decoration: underline; }

  /* ── Section layout ── */
  .cg-section { padding: 64px 24px; }
  .cg-inner { max-width: 1100px; margin: 0 auto; }
  .cg-section-head { text-align: center; margin-bottom: 48px; }
  .cg-section-head .tag {
    display: inline-block;
    font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--mint); margin-bottom: 12px;
  }
  .cg-section-head h2 { font-size: clamp(1.5rem,3vw,2.2rem); margin-bottom: 12px; }
  .cg-section-head p { color: var(--muted); max-width: 560px; margin: 0 auto; line-height: 1.7; }

  /* ── Tab nav ── */
  .tab-nav {
    border-bottom: 1px solid rgba(0,74,153,0.1); background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    position: sticky; top: 72px; z-index: 80;
  }
  .tab-nav-inner {
    max-width: 1100px; margin: 0 auto; display: flex;
    overflow-x: auto; gap: 4px; padding: 0 20px;
  }
  .tab-btn {
    padding: 16px 22px; background: none; border: none; cursor: pointer;
    font-size: 0.88rem; white-space: nowrap; transition: color 0.2s;
    border-bottom: 2px solid transparent;
  }
  .tab-btn.active {
    font-weight: 700; color: var(--jade); border-bottom-color: var(--jade);
  }
  .tab-btn:not(.active) { font-weight: 400; color: var(--muted); }

  /* ── LMS Filter chips ── */
  .lms-filter-row {
    display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 28px;
  }
  .lms-filter-label { font-size: 0.82rem; color: var(--muted); }
  .filter-chip {
    padding: 6px 16px; border-radius: 999px; border: 1px solid rgba(0,74,153,0.2);
    background: transparent; cursor: pointer; font-size: 0.8rem; font-family: var(--sans);
    color: var(--muted); transition: all 0.2s;
  }
  .filter-chip.active {
    background: var(--jade); color: #fff; border-color: var(--jade); font-weight: 600;
  }
  .filter-chip:not(.active):hover { border-color: var(--jade); color: var(--jade); }

  /* ── Course cards ── */
  .courses-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 22px;
  }
  .course-card {
    background: rgba(255,255,255,0.9); border: 1px solid rgba(0,74,153,0.12);
    border-radius: 18px; padding: 24px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    display: flex; flex-direction: column;
  }
  .course-card:hover {
    border-color: rgba(0,74,153,0.28); transform: translateY(-3px);
    box-shadow: 0 10px 32px rgba(0,74,153,0.1);
  }
  .course-emoji {
    width: 54px; height: 54px; border-radius: 14px;
    background: rgba(0,74,153,0.07); display: flex; align-items: center;
    justify-content: center; font-size: 1.6rem; margin-bottom: 16px; flex-shrink: 0;
  }
  .course-card h3 { font-size: 1rem; margin-bottom: 8px; line-height: 1.4; }
  .course-card > p { font-size: 0.83rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; flex: 1; }
  .course-meta {
    display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 14px;
    font-size: 0.75rem;
  }
  .course-meta .diff-badge {
    padding: 3px 10px; border-radius: 999px; font-weight: 600;
    font-size: 0.72rem;
  }
  .diff-beginner { background: rgba(132,189,96,0.12); color: var(--mint); border: 1px solid rgba(132,189,96,0.25); }
  .diff-intermediate { background: rgba(240,169,139,0.12); color: var(--gold); border: 1px solid rgba(232,132,90,0.2); }
  .diff-advanced { background: rgba(249,112,102,0.12); color: var(--coral); border: 1px solid rgba(249,112,102,0.2); }
  .diff-all { background: rgba(14,165,233,0.1); color: var(--sky); border: 1px solid rgba(14,165,233,0.2); }
  .target-chip {
    padding: 3px 9px; border-radius: 999px; font-size: 0.7rem;
    background: rgba(0,74,153,0.07); color: var(--jade); border: 1px solid rgba(0,74,153,0.15);
  }
  .course-meta .meta-item { color: var(--muted); display: flex; align-items: center; gap: 3px; }
  .course-progress-bar-wrap {
    height: 5px; background: rgba(0,74,153,0.1); border-radius: 999px;
    margin-bottom: 6px; overflow: hidden;
  }
  .course-progress-bar { height: 100%; border-radius: 999px; background: var(--mint); transition: width 0.4s; }
  .course-progress-pct { font-size: 0.72rem; color: var(--muted); margin-bottom: 12px; }
  .cert-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(132,189,96,0.1); color: var(--mint);
    border: 1px solid rgba(132,189,96,0.3); border-radius: 999px;
    padding: 4px 12px; font-size: 0.75rem; font-weight: 600; margin-bottom: 12px;
  }
  .course-actions { display: flex; gap: 10px; margin-top: auto; }

  /* ── Skeleton loader ── */
  .skeleton-card {
    background: rgba(255,255,255,0.9); border: 1px solid rgba(0,74,153,0.08);
    border-radius: 18px; padding: 24px; height: 280px;
    animation: skeleton-pulse 1.4s ease-in-out infinite;
  }
  @keyframes skeleton-pulse {
    0%,100% { opacity: 1; } 50% { opacity: 0.5; }
  }
  .skel-line {
    height: 14px; background: rgba(0,74,153,0.07); border-radius: 7px; margin-bottom: 12px;
  }
  .skel-emoji {
    width: 54px; height: 54px; background: rgba(0,74,153,0.07); border-radius: 14px; margin-bottom: 16px;
  }

  /* ── Lesson viewer modal ── */
  .lv-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
    display: flex; align-items: stretch; justify-content: center;
  }
  .lv-modal {
    background: #fff; width: 100%; max-width: 1100px; margin: 20px;
    border-radius: 20px; display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,0.22);
  }
  .lv-header {
    background: linear-gradient(135deg, #EBF1FA, #F4F7F6);
    border-bottom: 1px solid rgba(0,74,153,0.12);
    padding: 20px 28px; display: flex; align-items: center; gap: 16px; flex-shrink: 0;
  }
  .lv-header-emoji { font-size: 2rem; flex-shrink: 0; }
  .lv-header-info { flex: 1; min-width: 0; }
  .lv-header-info h2 { font-size: 1.1rem; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lv-header-meta { display: flex; gap: 10px; flex-wrap: wrap; }
  .lv-close {
    background: rgba(0,74,153,0.08); border: none; border-radius: 50%; width: 36px; height: 36px;
    font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--text); flex-shrink: 0; transition: background 0.2s;
  }
  .lv-close:hover { background: rgba(0,74,153,0.15); }
  .lv-body {
    flex: 1; display: flex; overflow: hidden; min-height: 0;
  }
  .lv-sidebar {
    width: 240px; min-width: 240px; border-right: 1px solid rgba(0,74,153,0.1);
    overflow-y: auto; padding: 16px 12px; flex-shrink: 0;
    background: rgba(244,247,246,0.6);
  }
  .lv-sidebar-title { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; padding: 0 8px; }
  .lv-lesson-btn {
    width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px;
    border: none; background: transparent; cursor: pointer;
    font-family: var(--sans); font-size: 0.82rem; color: var(--text);
    display: flex; align-items: flex-start; gap: 10px; margin-bottom: 4px;
    transition: background 0.15s;
    line-height: 1.4;
  }
  .lv-lesson-btn:hover { background: rgba(0,74,153,0.06); }
  .lv-lesson-btn.active { background: rgba(0,74,153,0.1); font-weight: 600; color: var(--jade); }
  .lv-lesson-num {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; font-size: 0.7rem;
    display: flex; align-items: center; justify-content: center; font-weight: 700;
    background: rgba(0,74,153,0.1); color: var(--jade);
  }
  .lv-lesson-num.done { background: var(--mint); color: #fff; }
  .lv-lesson-num.active-num { background: var(--jade); color: #fff; }
  .lv-content {
    flex: 1; overflow-y: auto; padding: 28px 32px;
  }
  .lv-content h3 { font-size: 1.2rem; margin-bottom: 16px; color: var(--text); }
  .lv-objectives {
    background: rgba(0,74,153,0.04); border: 1px solid rgba(0,74,153,0.12);
    border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;
  }
  .lv-objectives h4 { font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--jade); margin-bottom: 10px; }
  .lv-objectives ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .lv-objectives li { font-size: 0.85rem; color: var(--text); display: flex; gap: 8px; }
  .lv-objectives li::before { content: '→'; color: var(--jade); flex-shrink: 0; }
  .lv-summary { font-size: 0.92rem; color: var(--muted); line-height: 1.75; margin-bottom: 24px; }
  .lv-keypoints { margin-bottom: 24px; }
  .lv-keypoints h4 { font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mint); margin-bottom: 10px; }
  .lv-keypoints ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .lv-keypoints li {
    font-size: 0.88rem; color: var(--text); display: flex; gap: 10px;
    background: rgba(132,189,96,0.06); border: 1px solid rgba(132,189,96,0.15);
    border-radius: 10px; padding: 10px 14px; line-height: 1.5;
  }
  .lv-keypoints li::before { content: '✓'; color: var(--mint); font-weight: 700; flex-shrink: 0; }
  .lv-resource-link {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 10px;
    background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.2);
    color: var(--sky); text-decoration: none; font-size: 0.85rem; font-weight: 500;
    transition: background 0.2s; margin-bottom: 24px; display: inline-flex;
  }
  .lv-resource-link:hover { background: rgba(14,165,233,0.15); }
  .lv-complete-btn {
    background: linear-gradient(135deg, var(--mint), #5a9e38);
    color: #fff; border: none; border-radius: 10px; padding: 12px 24px;
    font-family: var(--sans); font-size: 0.9rem; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
  }
  .lv-complete-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .lv-complete-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .lv-completed-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(132,189,96,0.1); color: var(--mint);
    border: 1px solid rgba(132,189,96,0.3); border-radius: 10px;
    padding: 10px 18px; font-size: 0.88rem; font-weight: 600;
  }
  .lv-footer {
    border-top: 1px solid rgba(0,74,153,0.1);
    padding: 14px 28px; display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0; background: #fafbfc; flex-wrap: wrap; gap: 10px;
  }
  .lv-nav-btns { display: flex; gap: 10px; }
  .lv-cert-banner {
    background: linear-gradient(135deg, rgba(132,189,96,0.12), rgba(0,74,153,0.06));
    border: 1px solid rgba(132,189,96,0.3); border-radius: 14px;
    padding: 24px; text-align: center; margin-top: 24px;
  }
  .lv-cert-banner h3 { font-size: 1.1rem; margin-bottom: 6px; color: var(--mint); }
  .lv-cert-banner p { font-size: 0.85rem; color: var(--muted); margin-bottom: 16px; }

  /* Mobile lesson nav row */
  .lv-mobile-progress {
    display: none; overflow-x: auto; padding: 12px 16px; gap: 8px;
    border-bottom: 1px solid rgba(0,74,153,0.1); background: rgba(244,247,246,0.6);
    flex-shrink: 0;
  }
  .lv-mob-step {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 0.72rem;
    font-weight: 700; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;
    background: rgba(0,74,153,0.08); color: var(--jade);
  }
  .lv-mob-step.done { background: var(--mint); color: #fff; border-color: var(--mint); }
  .lv-mob-step.active-step { border-color: var(--jade); background: var(--jade); color: #fff; }
  @media (max-width: 700px) {
    .lv-modal { margin: 0; border-radius: 0; }
    .lv-sidebar { display: none; }
    .lv-mobile-progress { display: flex; }
    .lv-content { padding: 20px 18px; }
    .lv-header { padding: 14px 16px; }
    .lv-footer { padding: 12px 16px; }
  }

  /* ── Partner panel ── */
  .partner-panel {
    margin-top: 40px; border: 1px solid rgba(0,74,153,0.15); border-radius: 16px;
    overflow: hidden;
  }
  .partner-toggle {
    width: 100%; padding: 18px 24px; background: rgba(0,74,153,0.04);
    border: none; border-radius: 0; cursor: pointer; font-family: var(--sans);
    font-size: 0.9rem; font-weight: 600; color: var(--jade); text-align: left;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    transition: background 0.2s;
  }
  .partner-toggle:hover { background: rgba(0,74,153,0.08); }
  .partner-form-wrap {
    padding: 24px; background: rgba(255,255,255,0.8);
    border-top: 1px solid rgba(0,74,153,0.1);
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }
  @media (max-width: 600px) { .partner-form-wrap { grid-template-columns: 1fr; } }
  .partner-form-full { grid-column: 1 / -1; }
  .pf-label { font-size: 0.75rem; font-weight: 600; color: var(--jade); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; display: block; }
  .pf-input, .pf-select, .pf-textarea {
    width: 100%; background: rgba(255,255,255,0.9); border: 1px solid rgba(0,74,153,0.18);
    border-radius: 9px; padding: 10px 14px; color: var(--text); font-family: var(--sans);
    font-size: 0.85rem; outline: none; transition: border-color 0.2s;
  }
  .pf-input:focus, .pf-select:focus, .pf-textarea:focus { border-color: var(--jade); box-shadow: 0 0 0 3px rgba(0,74,153,0.08); }
  .pf-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
  .pf-note { font-size: 0.78rem; color: var(--muted); margin-top: 8px; grid-column: 1 / -1; }

  /* ── Counselling ── */
  .counsel-contact-card {
    background: rgba(255,255,255,0.92); border: 1px solid rgba(0,74,153,0.14);
    border-radius: 20px; padding: 32px; max-width: 620px; margin: 0 auto 36px;
    box-shadow: 0 4px 28px rgba(0,74,153,0.08);
  }
  .counsel-contact-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 20px; color: var(--text); }
  .counsel-contact-list { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
  .counsel-contact-list li { display: flex; align-items: flex-start; gap: 12px; font-size: 0.9rem; }
  .counsel-contact-list .ci-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
  .counsel-contact-list .ci-text { line-height: 1.5; color: var(--text); }
  .counsel-contact-list a { color: var(--jade); text-decoration: none; }
  .counsel-contact-list a:hover { text-decoration: underline; }
  .counsel-info-note {
    background: rgba(0,74,153,0.04); border: 1px solid rgba(0,74,153,0.1);
    border-radius: 10px; padding: 14px 18px; font-size: 0.85rem; color: var(--muted); line-height: 1.6;
  }
  .counsel-referral-box {
    max-width: 620px; margin: 0 auto;
    background: rgba(255,255,255,0.92); border: 1px solid rgba(0,74,153,0.14);
    border-radius: 20px; padding: 32px; box-shadow: 0 4px 28px rgba(0,74,153,0.08);
  }
  .counsel-referral-box h3 { font-size: 1rem; margin-bottom: 6px; }
  .counsel-referral-box > p { font-size: 0.85rem; color: var(--muted); margin-bottom: 22px; line-height: 1.6; }
  .counsel-form { display: flex; flex-direction: column; gap: 14px; }
  .counsel-success {
    text-align: center; padding: 28px 16px;
  }
  .counsel-success .cs-icon { font-size: 2.4rem; margin-bottom: 12px; }
  .counsel-success h3 { font-size: 1.05rem; margin-bottom: 8px; color: var(--mint); }
  .counsel-success p { font-size: 0.85rem; color: var(--muted); line-height: 1.6; }

  /* ── Resources ── */
  .resources-filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
  .resources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
  .resource-card {
    background: rgba(255,255,255,0.9); border: 1px solid rgba(0,74,153,0.1);
    border-radius: 14px; padding: 22px; display: flex; flex-direction: column;
    transition: border-color 0.2s, transform 0.2s;
  }
  .resource-card:hover { border-color: rgba(0,74,153,0.25); transform: translateY(-2px); }
  .resource-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .resource-icon { font-size: 1.6rem; flex-shrink: 0; }
  .resource-type-badge {
    font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--gold); font-weight: 600;
  }
  .resource-card h4 { font-size: 0.9rem; margin-bottom: 8px; line-height: 1.4; }
  .resource-card p { font-size: 0.8rem; color: var(--muted); line-height: 1.55; margin-bottom: 14px; flex: 1; }
  .resource-meta { font-size: 0.72rem; color: var(--muted); margin-bottom: 14px; }
  .resource-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px;
    background: rgba(0,74,153,0.06); border: 1px solid rgba(0,74,153,0.2);
    color: var(--jade); text-decoration: none; font-size: 0.8rem; font-weight: 600;
    transition: background 0.2s; margin-top: auto; align-self: flex-start;
  }
  .resource-btn:hover { background: rgba(0,74,153,0.12); }

  /* ── CTA bottom ── */
  .cg-cta {
    background: linear-gradient(135deg, rgba(0,74,153,0.06), rgba(132,189,96,0.05));
    border: 1px solid rgba(0,74,153,0.14);
    border-radius: 20px; padding: 48px 32px; text-align: center; margin-top: 24px;
  }
  .cg-cta h2 { font-size: clamp(1.4rem,3vw,2rem); margin-bottom: 12px; }
  .cg-cta p  { color: var(--muted); max-width: 480px; margin: 0 auto 28px; line-height: 1.7; }
  .cg-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function diffClass(d) {
  if (!d) return 'diff-beginner';
  const dl = d.toLowerCase();
  if (dl.includes('intermediate')) return 'diff-intermediate';
  if (dl.includes('advanced')) return 'diff-advanced';
  if (dl.includes('all')) return 'diff-all';
  return 'diff-beginner';
}

function targetLabel(t) {
  if (t === 'clients') return 'Family Caregivers';
  if (t === 'hcas') return 'HCAs';
  return 'All Users';
}

// ─── Partner gate form (inline, client-side only) ─────────────────────────────
function PartnerGateForm() {
  const [form, setForm] = useState({ name: '', email: '', org: '', message: '' });
  const [sent, setSent] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createHubAccessRequest({ name: form.name, email: form.email, organisation: form.org, message: form.message });
    } catch (err) {
      console.error('Access request error:', err);
    }
    setSent(true);
  }
  if (sent) return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>✅</div>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Request received. We will be in touch shortly.</p>
    </div>
  );
  return (
    <form className="partner-gate-form" onSubmit={handleSubmit}>
      <input required placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      <input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      <input required placeholder="Organisation name" value={form.org} onChange={e => setForm(p => ({ ...p, org: e.target.value }))} />
      <textarea placeholder="Brief message (optional)" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
      <button type="submit" className="btn-p btn-sm btn-full">Request Access</button>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CaregiversPage() {
  // ── State
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [clientCount, setClientCount] = useState(0);
  const [activeTab, setActiveTab] = useState('training');
  const [lmsFilter, setLmsFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(-1);
  const [partnerFormOpen, setPartnerFormOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ orgName: '', contactEmail: '', courseTitle: '', description: '', contentUrl: '', target: 'all' });
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('All');
  const [counselForm, setCounselForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [counselSent, setCounselSent] = useState(false);
  const [enrolling, setEnrolling] = useState(null);

  // ── Load on mount
  useEffect(() => {
    async function init() {
      try {
        // Determine session
        const clientSess = getClientSession();
        const hcaSess    = getHcaSession();
        const adminSess  = getAdminSession();

        let resolvedUser = null;
        if (adminSess?.id) {
          resolvedUser = { id: adminSess.id, name: adminSess.name || adminSess.email || 'Admin', type: 'admin' };
        } else if (hcaSess?.id) {
          resolvedUser = { id: hcaSess.id, name: hcaSess.name || 'HCA', type: 'hca' };
        } else if (clientSess?.id) {
          resolvedUser = { id: clientSess.id, name: clientSess.name || 'Client', type: 'client' };
        }

        setUser(resolvedUser);
        setAuthed(!!resolvedUser);

        // Load courses & stats (available to all — used even on gate)
        const [fetchedCourses, fetchedClients] = await Promise.all([
          getLmsCourses(),
          getAllClients(),
        ]);
        setCourses(fetchedCourses);
        setClientCount(fetchedClients.length);

        // Load enrollments if authed
        if (resolvedUser) {
          const fetchedEnrollments = await getEnrollmentsForUser(resolvedUser.id, resolvedUser.type);
          setEnrollments(fetchedEnrollments);

          // Default lmsFilter based on user type
          if (resolvedUser.type === 'hca') setLmsFilter('hcas');
          else if (resolvedUser.type === 'client') setLmsFilter('clients');
        }
      } catch (err) {
        console.error('Caregivers hub init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ── Helpers
  function getEnrollment(courseId) {
    return enrollments.find(e => e.course_id === courseId) || null;
  }

  function isLessonComplete(enrollment, idx) {
    if (!enrollment) return false;
    return (enrollment.completed_lessons || []).includes(idx);
  }

  // ── Filter courses
  const filteredCourses = courses.filter(c => {
    if (lmsFilter === 'all') return true;
    return c.target === 'all' || c.target === lmsFilter;
  });

  // ── Enrol + open lesson viewer
  async function handleOpenCourse(course) {
    if (!user) return;
    const enr = getEnrollment(course.id);
    if (!enr) {
      setEnrolling(course.id);
      try {
        const newEnr = await enrollInCourse(user.id, user.type, course.id);
        setEnrollments(prev => [...prev, newEnr]);
      } catch (err) {
        console.error('Enrol error:', err);
      } finally {
        setEnrolling(null);
      }
    }
    setSelectedCourse(course);
    setSelectedLesson(0);
    document.body.style.overflow = 'hidden';
  }

  function closeLessonViewer() {
    setSelectedCourse(null);
    setSelectedLesson(-1);
    document.body.style.overflow = '';
  }

  async function handleMarkComplete() {
    if (!user || !selectedCourse || selectedLesson < 0) return;
    const lessons = selectedCourse.lessons || [];
    setMarkingComplete(true);
    try {
      const updated = await updateCourseProgress(user.id, selectedCourse.id, selectedLesson, lessons.length);
      if (updated) {
        setEnrollments(prev => prev.map(e => e.course_id === selectedCourse.id ? { ...e, ...updated } : e));
      }
    } catch (err) {
      console.error('Progress update error:', err);
    } finally {
      setMarkingComplete(false);
    }
  }

  async function handlePartnerSubmit(e) {
    e.preventDefault();
    setPartnerSubmitting(true);
    try {
      await submitPartnerCourse(partnerForm);
      setPartnerSubmitted(true);
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setPartnerSubmitting(false);
    }
  }

  async function handleCounselSubmit(e) {
    e.preventDefault();
    try {
      await createHubReferral({ name: counselForm.name, phone: counselForm.phone, email: counselForm.email, message: counselForm.message });
    } catch (err) {
      console.error('Referral submission error:', err);
    }
    setCounselSent(true);
  }

  const tabs = [
    { id: 'training',    label: 'Training' },
    { id: 'resources',   label: 'Resource Library' },
    { id: 'counselling', label: 'Counselling' },
    // COMMUNITY & SUPPORT GROUPS — COMING SOON. Activate after moderation system is ready.
  ];

  // ── Stats
  const statsClientLabel = clientCount > 0 ? `${clientCount}+` : 'Growing';

  // ── Auth gate
  if (!loading && !authed) {
    return (
      <>
        <style>{BASE_CSS + PAGE_CSS}</style>
        <Nav />

        {/* Hero with lock overlay */}
        <section className="cg-hero" style={{ minHeight: 440, paddingBottom: 0 }}>
          <div className="cg-hero-photos" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cg-hp2" src="/images/hero-group-care.png" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cg-hp1" src="/images/hero-group-care.png" alt="" />
            <div className="cg-hp-btm" />
          </div>
          <div className="cg-hero-overlay" aria-hidden="true" />
          <div className="cg-hero-inner" style={{ paddingBottom: 60 }}>
            <div className="cg-hero-tag">Family Caregiver Hub</div>
            <h1>You Are Not Alone in This</h1>
            <p>Training, professional counselling, and resources designed for family members who care for a loved one at home. Members only.</p>
          </div>
          <div className="gate-overlay" aria-label="Access restricted">
            <div className="gate-lock">
              <div className="gate-lock-icon">🔒</div>
              <h2>Members Only</h2>
              <p>Sign in or create an account to access the Caregiver Hub.</p>
            </div>
          </div>
        </section>

        {/* Gate cards */}
        <div className="gate-cards">
          <div className="gate-card">
            <div className="gate-icon">👨‍👩‍👧</div>
            <h3>I&apos;m a Family Client</h3>
            <p>Access training courses, resource library, and counselling support.</p>
            <Link href="/client/register" className="btn-p btn-full" style={{ textAlign: 'center' }}>Create Account</Link>
            <div style={{ marginTop: 10 }}>
              <Link href="/client/login" className="btn-o btn-sm btn-full" style={{ textAlign: 'center', marginTop: 8, display: 'block' }}>Already a member? Sign In</Link>
            </div>
          </div>

          <div className="gate-card">
            <div className="gate-icon">👩‍⚕️</div>
            <h3>I&apos;m an HCA</h3>
            <p>Access professional development courses and HCA-specific training resources.</p>
            <Link href="/hca/login" className="btn-sky btn-full" style={{ textAlign: 'center' }}>HCA Sign In</Link>
          </div>

          <div className="gate-card">
            <div className="gate-icon">🤝</div>
            <h3>Apply for Partner Access</h3>
            <p>Healthcare organisations can submit learning content for E-Vive&apos;s platform.</p>
            <PartnerGateForm />
          </div>
        </div>

        <Footer />
      </>
    );
  }

  // ─── Lesson viewer modal ────────────────────────────────────────────────────
  const lessonViewerOpen = !!selectedCourse && selectedLesson >= 0;
  const currentLessons   = selectedCourse?.lessons || [];
  const currentLesson    = currentLessons[selectedLesson] || null;
  const currentEnr       = selectedCourse ? getEnrollment(selectedCourse.id) : null;
  const lessonDone       = currentLesson ? isLessonComplete(currentEnr, selectedLesson) : false;
  const allDone          = currentEnr?.progress_pct === 100;

  // ─── Render main hub ────────────────────────────────────────────────────────
  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* User badge */}
      {user && (
        <div className="user-badge">
          👤 Logged in as <strong>{user.name}</strong> ·{' '}
          {user.type === 'client' ? 'Family Client' : user.type === 'hca' ? 'HomeCare Assistant' : 'E-Vive Staff'}
          {' · '}
          <Link href={user.type === 'hca' ? '/hca/dashboard' : user.type === 'admin' ? '/admin/dashboard' : '/client/dashboard'}>
            Go to dashboard →
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="cg-hero">
        <div className="cg-hero-photos" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cg-hp2" src="/images/hero-group-care.png" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cg-hp1" src="/images/hero-group-care.png" alt="" />
          <div className="cg-hp-btm" />
        </div>
        <div className="cg-hero-overlay" aria-hidden="true" />
        <div className="cg-hero-inner">
          <div className="cg-hero-tag">Family Caregiver Hub</div>
          <h1>You Are Not Alone in This</h1>
          <p>Training, professional counselling, and resources designed for family members who care for a loved one at home.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-p" onClick={() => setActiveTab('training')}>Explore Training →</button>
            <button className="btn-o" onClick={() => setActiveTab('counselling')}>Contact Counselling</button>
          </div>
          <div className="cg-hero-stats">
            <div className="cg-hero-stat">
              <div className="val">{statsClientLabel}</div>
              <div className="lab">Families supported</div>
            </div>
            <div className="cg-hero-stat">
              <div className="val">{courses.length > 0 ? courses.length : '—'}</div>
              <div className="lab">Training courses</div>
            </div>
            <div className="cg-hero-stat">
              <div className="val">Free</div>
              <div className="lab">Core resources free</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY & SUPPORT GROUPS — COMING SOON. Activate after moderation system is ready. */}

      {/* Tab navigation — only 3 active tabs */}
      <div className="tab-nav">
        <div className="tab-nav-inner">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── TRAINING TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'training' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Self-Paced Learning</div>
              <h2>Caregiver Training Courses</h2>
              <p>Evidence-based courses developed with nurses, doctors, and specialist caregiving organisations. Learn at your own pace.</p>
            </div>

            {/* Filter chips */}
            <div className="lms-filter-row">
              <span className="lms-filter-label">Showing courses for:</span>
              {[
                { val: 'all',     label: 'All Users' },
                { val: 'clients', label: 'Family Caregivers' },
                { val: 'hcas',    label: 'All HCAs' },
              ].map(chip => (
                <button
                  key={chip.val}
                  className={`filter-chip${lmsFilter === chip.val ? ' active' : ''}`}
                  onClick={() => setLmsFilter(chip.val)}
                >{chip.label}</button>
              ))}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="courses-grid">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div className="skeleton-card" key={n}>
                    <div className="skel-emoji" />
                    <div className="skel-line" style={{ width: '70%' }} />
                    <div className="skel-line" style={{ width: '90%' }} />
                    <div className="skel-line" style={{ width: '55%' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Course grid */}
            {!loading && filteredCourses.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
                No courses found for this filter. Try &ldquo;All Users&rdquo;.
              </p>
            )}

            {!loading && filteredCourses.length > 0 && (
              <div className="courses-grid">
                {filteredCourses.map(course => {
                  const enr = getEnrollment(course.id);
                  const pct = enr?.progress_pct || 0;
                  const done = pct === 100;
                  const lessons = course.lessons || [];
                  const isEnrolling = enrolling === course.id;

                  return (
                    <div className="course-card" key={course.id}>
                      <div className="course-emoji">{course.cover_emoji || '📚'}</div>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>

                      <div className="course-meta">
                        <span className={`diff-badge ${diffClass(course.difficulty)}`}>{course.difficulty || 'Beginner'}</span>
                        <span className="target-chip">{targetLabel(course.target)}</span>
                        <span className="meta-item">⏱ {course.duration_mins} min</span>
                        <span className="meta-item">📚 {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
                      </div>

                      {done && (
                        <div className="cert-badge">🎓 Completed</div>
                      )}

                      {enr && !done && (
                        <>
                          <div className="course-progress-bar-wrap">
                            <div className="course-progress-bar" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="course-progress-pct">{pct}% complete</div>
                        </>
                      )}

                      <div className="course-actions">
                        <button
                          className="btn-p btn-sm"
                          style={{ flex: 1 }}
                          disabled={isEnrolling}
                          onClick={() => handleOpenCourse(course)}
                        >
                          {isEnrolling ? 'Enrolling…' : enr ? (done ? 'Review Course' : 'Continue →') : 'Enrol & Start →'}
                        </button>
                        {done && (
                          <button className="btn-o btn-sm" onClick={() => handleOpenCourse(course)}>🎓 Certificate</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Partner submission panel */}
            <div className="partner-panel">
              <button className="partner-toggle" onClick={() => setPartnerFormOpen(p => !p)}>
                <span>🤝 Submit Learning Content as a Partner Organisation</span>
                <span style={{ fontSize: '1rem' }}>{partnerFormOpen ? '▲' : '▼'}</span>
              </button>

              {partnerFormOpen && (
                <div className="partner-form-wrap">
                  {partnerSubmitted ? (
                    <div className="partner-form-full" style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 10 }}>✅</div>
                      <strong>Submission received.</strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 6 }}>E-Vive&apos;s clinical team will review your content and contact you within 5 business days.</p>
                    </div>
                  ) : (
                    <form onSubmit={handlePartnerSubmit} style={{ display: 'contents' }}>
                      <div>
                        <label className="pf-label">Organisation Name *</label>
                        <input className="pf-input" required value={partnerForm.orgName}
                          onChange={e => setPartnerForm(p => ({ ...p, orgName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="pf-label">Contact Email *</label>
                        <input className="pf-input" required type="email" value={partnerForm.contactEmail}
                          onChange={e => setPartnerForm(p => ({ ...p, contactEmail: e.target.value }))} />
                      </div>
                      <div>
                        <label className="pf-label">Course Title *</label>
                        <input className="pf-input" required value={partnerForm.courseTitle}
                          onChange={e => setPartnerForm(p => ({ ...p, courseTitle: e.target.value }))} />
                      </div>
                      <div>
                        <label className="pf-label">Target Audience</label>
                        <select className="pf-select" value={partnerForm.target}
                          onChange={e => setPartnerForm(p => ({ ...p, target: e.target.value }))}>
                          <option value="all">All Users</option>
                          <option value="clients">Family Caregivers</option>
                          <option value="hcas">HCAs</option>
                        </select>
                      </div>
                      <div className="partner-form-full">
                        <label className="pf-label">Description</label>
                        <textarea className="pf-textarea" value={partnerForm.description}
                          onChange={e => setPartnerForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Brief description of the course content…" />
                      </div>
                      <div className="partner-form-full">
                        <label className="pf-label">Content URL (optional)</label>
                        <input className="pf-input" type="url" value={partnerForm.contentUrl}
                          onChange={e => setPartnerForm(p => ({ ...p, contentUrl: e.target.value }))}
                          placeholder="https://…" />
                      </div>
                      <div className="partner-form-full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-p btn-sm" disabled={partnerSubmitting}>
                          {partnerSubmitting ? 'Submitting…' : 'Submit for Review →'}
                        </button>
                      </div>
                      <p className="pf-note">All submissions are reviewed by E-Vive&apos;s clinical team before publication. We will contact you within 5 business days.</p>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── RESOURCE LIBRARY TAB ─────────────────────────────────────────────── */}
      {activeTab === 'resources' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Free Professional Resources</div>
              <h2>Resource Library</h2>
              <p>Curated free resources from the world&apos;s leading healthcare and caregiving organisations. All links go directly to the original source.</p>
            </div>

            {/* Filter row */}
            <div className="resources-filter-row">
              {RESOURCE_FILTERS.map(f => (
                <button
                  key={f}
                  className={`filter-chip${resourceFilter === f ? ' active' : ''}`}
                  onClick={() => setResourceFilter(f)}
                >{f}</button>
              ))}
            </div>

            <div className="resources-grid">
              {RESOURCES
                .filter(r => resourceFilter === 'All' || r.filterType === resourceFilter)
                .map(r => (
                  <div className="resource-card" key={r.url}>
                    <div className="resource-card-top">
                      <span className="resource-icon">{r.icon}</span>
                      <span className="resource-type-badge">{r.type}</span>
                    </div>
                    <h4>{r.title}</h4>
                    <p>{r.desc}</p>
                    <div className="resource-meta">{r.meta}</div>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-btn">
                      Open Resource →
                    </a>
                  </div>
                ))
              }
            </div>
          </div>
        </section>
      )}

      {/* ── COUNSELLING TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'counselling' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Professional Support</div>
              <h2>Counselling &amp; Mental Health Support</h2>
              <p>Our clinical team can connect you with an appropriate counsellor based on your specific needs. Sessions conducted via phone, video call, or in person.</p>
            </div>

            {/* E-Vive contact card */}
            <div className="counsel-contact-card">
              <div className="counsel-contact-title">📞 Contact E-Vive Directly</div>
              <ul className="counsel-contact-list">
                <li>
                  <span className="ci-icon">📧</span>
                  <span className="ci-text">Email: <a href="mailto:hello@e-vive.co.ke">hello@e-vive.co.ke</a></span>
                </li>
                <li>
                  <span className="ci-icon">📞</span>
                  <span className="ci-text">Phone: <a href="tel:+254720053455">+254 720 053 455</a></span>
                </li>
                <li>
                  <span className="ci-icon">💬</span>
                  <span className="ci-text">
                    WhatsApp: <a href="https://wa.me/254720053455" target="_blank" rel="noopener noreferrer">+254 720 053 455</a>
                  </span>
                </li>
                <li>
                  <span className="ci-icon">📍</span>
                  <span className="ci-text">Mararo Avenue, off Riara Road, Nairobi</span>
                </li>
                <li>
                  <span className="ci-icon">🕐</span>
                  <span className="ci-text">Mon–Sat, 7:00am – 8:00pm</span>
                </li>
              </ul>
              <div className="counsel-info-note">
                Our clinical team can connect you with an appropriate counsellor based on your specific needs. Sessions are conducted via phone, video call, or in person. First sessions for new clients are offered at a reduced rate — ask us for details.
              </div>
            </div>

            {/* Referral request form */}
            <div className="counsel-referral-box">
              <h3>Request a Counselling Referral</h3>
              <p>Fill in this short form and our team will call you within 24 hours to discuss what support would be most helpful.</p>

              {counselSent ? (
                <div className="counsel-success">
                  <div className="cs-icon">✅</div>
                  <h3>Request received.</h3>
                  <p>Our team will call you within 24 hours. You can also reach us directly at <a href="tel:+254720053455" style={{ color: 'var(--jade)' }}>+254 720 053 455</a>.</p>
                </div>
              ) : (
                <form className="counsel-form" onSubmit={handleCounselSubmit}>
                  <div>
                    <label className="pf-label">Your Name *</label>
                    <input className="pf-input" required value={counselForm.name}
                      onChange={e => setCounselForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Full name" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="pf-label">Phone *</label>
                      <input className="pf-input" required value={counselForm.phone}
                        onChange={e => setCounselForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+254 7XX XXX XXX" />
                    </div>
                    <div>
                      <label className="pf-label">Email</label>
                      <input className="pf-input" type="email" value={counselForm.email}
                        onChange={e => setCounselForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="Optional" />
                    </div>
                  </div>
                  <div>
                    <label className="pf-label">What support do you need? *</label>
                    <textarea className="pf-textarea" required value={counselForm.message}
                      onChange={e => setCounselForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Briefly describe what you are going through and what kind of support you are looking for…"
                      style={{ minHeight: 90 }} />
                  </div>
                  <button type="submit" className="btn-p" style={{ alignSelf: 'flex-start' }}>
                    Send Request →
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="cg-section">
        <div className="cg-inner">
          <div className="cg-cta">
            <h2>Need a Professional HomeCare Assistant?</h2>
            <p>When caregiving becomes too much for one person, our vetted HCAs provide skilled, compassionate support at home.</p>
            <div className="cg-cta-btns">
              <Link href="/match" className="btn-p">Find a Carer →</Link>
              <Link href="/client/register" className="btn-o">Create Client Account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── LESSON VIEWER MODAL ──────────────────────────────────────────────── */}
      {lessonViewerOpen && selectedCourse && (
        <div className="lv-overlay" onClick={closeLessonViewer}>
          <div className="lv-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="lv-header">
              <span className="lv-header-emoji">{selectedCourse.cover_emoji || '📚'}</span>
              <div className="lv-header-info">
                <h2>{selectedCourse.title}</h2>
                <div className="lv-header-meta">
                  <span className={`diff-badge ${diffClass(selectedCourse.difficulty)}`}>{selectedCourse.difficulty}</span>
                  <span className="target-chip" style={{ fontSize: '0.72rem' }}>{targetLabel(selectedCourse.target)}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>⏱ {selectedCourse.duration_mins} min total</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {currentLessons.length} lesson{currentLessons.length !== 1 ? 's' : ''}
                  </span>
                  {allDone && <span className="cert-badge" style={{ padding: '2px 10px', fontSize: '0.7rem' }}>🎓 Complete</span>}
                </div>
              </div>
              <button className="lv-close" onClick={closeLessonViewer} aria-label="Close">×</button>
            </div>

            {/* Mobile progress row */}
            <div className="lv-mobile-progress">
              {currentLessons.map((_, idx) => (
                <button
                  key={idx}
                  className={`lv-mob-step${isLessonComplete(currentEnr, idx) ? ' done' : ''}${selectedLesson === idx ? ' active-step' : ''}`}
                  onClick={() => setSelectedLesson(idx)}
                >
                  {isLessonComplete(currentEnr, idx) ? '✓' : idx + 1}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="lv-body">
              {/* Sidebar */}
              <div className="lv-sidebar">
                <div className="lv-sidebar-title">Lessons</div>
                {currentLessons.map((lesson, idx) => {
                  const done = isLessonComplete(currentEnr, idx);
                  const active = selectedLesson === idx;
                  return (
                    <button
                      key={idx}
                      className={`lv-lesson-btn${active ? ' active' : ''}`}
                      onClick={() => setSelectedLesson(idx)}
                    >
                      <span className={`lv-lesson-num${done ? ' done' : active ? ' active-num' : ''}`}>
                        {done ? '✓' : idx + 1}
                      </span>
                      <span>{lesson.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="lv-content">
                {!currentLesson && (
                  <p style={{ color: 'var(--muted)' }}>Select a lesson to begin.</p>
                )}

                {currentLesson && (
                  <>
                    <h3>{currentLesson.title}</h3>

                    {/* Objectives */}
                    {currentLesson.objectives?.length > 0 && (
                      <div className="lv-objectives">
                        <h4>Learning Objectives</h4>
                        <ul>
                          {currentLesson.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Summary */}
                    {currentLesson.summary && (
                      <p className="lv-summary">{currentLesson.summary}</p>
                    )}

                    {/* Key points */}
                    {currentLesson.key_points?.length > 0 && (
                      <div className="lv-keypoints">
                        <h4>Key Points</h4>
                        <ul>
                          {currentLesson.key_points.map((kp, i) => (
                            <li key={i}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* External resource */}
                    {currentLesson.resource_url && (
                      <a
                        href={currentLesson.resource_url}
                        target="_blank" rel="noopener noreferrer"
                        className="lv-resource-link"
                      >
                        📄 Open Reference Resource ↗
                      </a>
                    )}

                    {/* Mark complete / done state */}
                    {lessonDone ? (
                      <div className="lv-completed-badge">✓ Lesson completed</div>
                    ) : (
                      <button
                        className="lv-complete-btn"
                        onClick={handleMarkComplete}
                        disabled={markingComplete}
                      >
                        {markingComplete ? 'Saving…' : '✓ Mark as Complete'}
                      </button>
                    )}

                    {/* Certificate section — shown when 100% */}
                    {allDone && (
                      <div className="lv-cert-banner">
                        <h3>🎓 Course Complete!</h3>
                        <p>
                          Congratulations on completing <strong>{selectedCourse.title}</strong>.<br />
                          Completed on {currentEnr?.completed_at ? new Date(currentEnr.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'today'}.
                        </p>
                        <button
                          className="btn-p btn-sm"
                          onClick={() => {
                            alert(`🎓 Certificate of Completion\n\nThis certifies that ${user?.name || 'you'} successfully completed:\n\n"${selectedCourse.title}"\n\nCompleted: ${currentEnr?.completed_at ? new Date(currentEnr.completed_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()}\n\nE-Vive HomeCare Kenya\nhello@e-vive.co.ke`);
                          }}
                        >
                          Download Certificate
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="lv-footer">
              <div className="lv-nav-btns">
                <button
                  className="btn-o btn-sm"
                  disabled={selectedLesson <= 0}
                  onClick={() => setSelectedLesson(p => p - 1)}
                >
                  ← Previous
                </button>
                <button
                  className="btn-p btn-sm"
                  disabled={selectedLesson >= currentLessons.length - 1}
                  onClick={() => setSelectedLesson(p => p + 1)}
                >
                  Next →
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Lesson {selectedLesson + 1} of {currentLessons.length}
                {currentEnr && <span> · {currentEnr.progress_pct || 0}% complete</span>}
              </div>
              <button className="btn-o btn-sm" onClick={closeLessonViewer}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
