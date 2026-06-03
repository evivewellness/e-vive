import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { BASE_CSS } from "../components/SharedStyles";

const PAGE_CSS = `
  body { padding-top: 72px; }

  /* ── HERO ── */
  .hero { min-height: calc(100vh - 72px); display:flex; align-items:center; position:relative; overflow:hidden; padding:70px 5vw 60px; }
  .hero-bg {
    position:absolute; inset:0; z-index:0;
    background:
      radial-gradient(ellipse 90% 60% at 70% 30%, rgba(0,74,153,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 55% at 5% 80%,  rgba(132,189,96,0.07) 0%, transparent 55%),
      linear-gradient(155deg, #EBF1FA 0%, #F4F7F6 55%, #EEF5EE 100%);
  }
  .orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:3; }
  .orb1 { width:560px; height:560px; right:-100px; top:-80px; background:radial-gradient(circle,rgba(0,74,153,0.12) 0%,transparent 70%); animation:float 9s ease-in-out infinite; }
  .orb2 { width:300px; height:300px; left:5%; bottom:10%; background:radial-gradient(circle,rgba(14,165,233,0.08) 0%,transparent 70%); animation:float 11s ease-in-out infinite 4s; }
  .orb3 { width:220px; height:220px; right:25%; bottom:15%; background:radial-gradient(circle,rgba(132,189,96,0.1) 0%,transparent 70%); animation:float 8s ease-in-out infinite 2s; }

  /* ── Hero photo layers ── */
  .hero-photos { position:absolute; inset:0; z-index:1; overflow:hidden; pointer-events:none; }
  .hp1,.hp2 { position:absolute; top:0; height:100%; object-fit:cover; display:block; }
  /* Photo 2: wide soft background layer — full group visible, gentle fade */
  .hp2 {
    right:0; width:82%; object-position:76% center; opacity:0.38;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 18%, black 42%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 18%, black 42%, black 100%);
  }
  /* Photo 1: dominant foreground layer — anchored right so Salome (rightmost) is most prominent */
  .hp1 {
    right:0; width:66%; object-position:76% center;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 12%, rgba(0,0,0,0.85) 28%, black 46%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 12%, rgba(0,0,0,0.85) 28%, black 46%, black 100%);
  }
  /* Bottom fade so photos dissolve into the next section */
  .hp-btm {
    position:absolute; bottom:0; left:0; right:0; height:220px;
    background:linear-gradient(to bottom, transparent 0%, rgba(235,241,250,0.97) 100%);
  }
  /* Gradient overlay - hard left protection for text, soft right to reveal photos */
  .hero-overlay {
    position:absolute; inset:0; z-index:2; pointer-events:none;
    background:linear-gradient(to right,
      rgba(235,241,250,0.98) 0%,
      rgba(235,241,250,0.96) 26%,
      rgba(235,241,250,0.74) 42%,
      rgba(235,241,250,0.32) 56%,
      rgba(235,241,250,0.09) 70%,
      transparent 82%
    );
  }
  .hero-inner { max-width:1200px; margin:0 auto; width:100%; position:relative; z-index:4; display:grid; grid-template-columns:1.1fr 1fr; gap:64px; align-items:center; }
  .hero-eyebrow { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
  .eyebrow-line { width:36px; height:2px; background:linear-gradient(90deg,var(--jade),var(--mint)); border-radius:2px; }
  .eyebrow-txt { font-size:11px; font-weight:600; letter-spacing:2.5px; color:var(--jade); text-transform:uppercase; font-family:var(--mono); }
  .hero h1 { font-family:var(--serif); font-size:clamp(36px,4.8vw,64px); font-weight:700; line-height:1.1; letter-spacing:-1px; margin-bottom:20px; color:var(--text); }
  .hero h1 em { font-style:italic; color:var(--mint); }
  .hero h1 .gold { color:var(--gold); }
  .hero-sub { font-size:17px; line-height:1.78; color:rgba(15,32,53,0.72); max-width:500px; margin-bottom:34px; font-weight:400; }
  .hero-btns { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:44px; }
  .hero-stats { display:flex; gap:32px; padding-top:28px; border-top:1px solid rgba(0,74,153,0.12); flex-wrap:wrap; }
  .hstat-num { font-family:var(--serif); font-size:28px; font-weight:700; color:var(--jade); }
  .hstat-lbl { font-size:12px; color:rgba(15,32,53,0.58); font-weight:500; margin-top:2px; }

  /* Hero right - user-type cards */
  .user-cards { display:flex; flex-direction:column; gap:14px; }
  .user-card { display:flex; align-items:center; gap:16px; padding:18px 20px; border-radius:18px; border:1px solid rgba(0,74,153,0.18); background:rgba(255,255,255,0.82); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); cursor:pointer; text-decoration:none; transition:all 0.3s; box-shadow:0 2px 16px rgba(0,74,153,0.08); }
  .user-card:hover { border-color:rgba(0,74,153,0.3); transform:translateX(6px); background:rgba(255,255,255,0.95); box-shadow:0 8px 28px rgba(0,74,153,0.1); }
  .user-card.family { border-color:rgba(0,74,153,0.2); background:linear-gradient(135deg,rgba(0,74,153,0.06),rgba(255,255,255,0.88)); }
  .user-card.hca    { border-color:rgba(14,165,233,0.2); background:linear-gradient(135deg,rgba(14,165,233,0.06),rgba(255,255,255,0.88)); }
  .user-card.org    { border-color:rgba(232,132,90,0.2); background:linear-gradient(135deg,rgba(240,169,139,0.08),rgba(255,255,255,0.88)); }
  .uc-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
  .uc-icon.green { background:rgba(0,74,153,0.1); border:1px solid rgba(0,74,153,0.18); }
  .uc-icon.blue  { background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.18); }
  .uc-icon.gold  { background:rgba(232,132,90,0.1); border:1px solid rgba(232,132,90,0.18); }
  .uc-title  { font-size:14px; font-weight:700; margin-bottom:3px; color:var(--text); }
  .uc-sub    { font-size:12px; color:var(--muted); }
  .uc-arrow  { margin-left:auto; font-size:20px; color:var(--jade); transition:transform 0.25s; }
  .user-card:hover .uc-arrow { transform:translateX(4px); }
  .user-card.hca .uc-arrow  { color:var(--sky); }
  .user-card.org .uc-arrow  { color:var(--gold); }

  /* ── PARTNER STRIP ── */
  .pstrip { border-top:1px solid rgba(0,74,153,0.08); border-bottom:1px solid rgba(0,74,153,0.08); background:rgba(237,241,249,0.75); }
  .pstrip-in { max-width:1200px; margin:0 auto; padding:22px 5vw; display:flex; align-items:center; gap:28px; flex-wrap:wrap; }
  .pstrip-lbl { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; font-family:var(--mono); color:rgba(15,32,53,0.4); white-space:nowrap; }
  .pstrip-logos { display:flex; gap:16px; flex-wrap:wrap; align-items:center; }
  .plchip { padding:6px 18px; border-radius:8px; background:rgba(255,255,255,0.8); border:1px solid rgba(0,74,153,0.1); font-size:12px; font-weight:600; color:rgba(15,32,53,0.52); font-family:var(--mono); transition:all 0.2s; }
  .plchip:hover { border-color:rgba(0,74,153,0.25); color:rgba(15,32,53,0.82); }

  /* ── PORTALS ── */
  .portals-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .pg-card { border-radius:22px; padding:30px; position:relative; overflow:hidden; border:1px solid rgba(0,74,153,0.12); background:rgba(255,255,255,0.88); transition:all 0.38s; cursor:pointer; text-decoration:none; display:block; }
  .pg-card::after { content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.38s; border-radius:22px; }
  .pg-card:hover { transform:translateY(-6px); box-shadow:0 22px 60px rgba(0,74,153,0.1); }
  .pg-card:hover::after { opacity:1; }
  .pg-card.match  { border-color:rgba(0,74,153,0.2); background:linear-gradient(145deg,rgba(0,74,153,0.06),rgba(255,255,255,0.92)); }
  .pg-card.match::after  { background:linear-gradient(135deg,rgba(0,74,153,0.05),transparent); }
  .pg-card.report { border-color:rgba(14,165,233,0.18); background:linear-gradient(145deg,rgba(14,165,233,0.06),rgba(255,255,255,0.92)); }
  .pg-card.report::after { background:linear-gradient(135deg,rgba(14,165,233,0.05),transparent); }
  .pg-card.care   { border-color:rgba(232,132,90,0.18); background:linear-gradient(145deg,rgba(240,169,139,0.07),rgba(255,255,255,0.92)); }
  .pg-card.care::after   { background:linear-gradient(135deg,rgba(240,169,139,0.06),transparent); }
  .pg-card.partner{ border-color:rgba(249,112,102,0.16); background:linear-gradient(145deg,rgba(249,112,102,0.05),rgba(255,255,255,0.92)); }
  .pg-card.soon   { opacity:0.7; }
  .pg-icon { width:58px; height:58px; border-radius:17px; display:flex; align-items:center; justify-content:center; font-size:28px; margin-bottom:18px; }
  .pg-icon.green { background:rgba(0,74,153,0.1); border:1px solid rgba(0,74,153,0.18); }
  .pg-icon.blue  { background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.18); }
  .pg-icon.gold  { background:rgba(232,132,90,0.1); border:1px solid rgba(232,132,90,0.18); }
  .pg-icon.coral { background:rgba(249,112,102,0.1); border:1px solid rgba(249,112,102,0.18); }
  .pg-icon.grey  { background:rgba(15,32,53,0.05); border:1px solid rgba(15,32,53,0.1); }
  .pg-tag { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; font-family:var(--mono); margin-bottom:7px; }
  .pg-tag.green { color:var(--jade); } .pg-tag.blue { color:var(--sky); } .pg-tag.gold { color:var(--gold); } .pg-tag.coral { color:var(--coral); } .pg-tag.grey { color:var(--muted); }
  .pg-title { font-family:var(--serif); font-size:20px; font-weight:700; margin-bottom:9px; line-height:1.3; color:var(--text); }
  .pg-desc  { font-size:13px; color:rgba(15,32,53,0.65); line-height:1.7; font-weight:400; margin-bottom:18px; }
  .pg-link  { font-size:13px; font-weight:600; display:flex; align-items:center; gap:6px; transition:gap 0.22s; }
  .pg-link.green { color:var(--jade); } .pg-link.blue { color:var(--sky); } .pg-link.gold { color:var(--gold); } .pg-link.coral { color:var(--coral); }
  .pg-card:hover .pg-link { gap:10px; }
  .soon-badge { position:absolute; top:14px; right:14px; background:rgba(15,32,53,0.07); color:var(--muted); font-size:10px; font-weight:700; padding:4px 10px; border-radius:100px; font-family:var(--mono); letter-spacing:1px; }

  /* ── HOW IT WORKS ── */
  .how-bg { background:linear-gradient(180deg,transparent,rgba(0,74,153,0.03),transparent); }
  .how-tabs { display:flex; gap:8px; margin-bottom:44px; flex-wrap:wrap; }
  .how-tab { padding:9px 22px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.25s; border:1px solid rgba(0,74,153,0.18); background:rgba(255,255,255,0.7); color:var(--muted); font-family:var(--sans); }
  .how-tab:hover { border-color:rgba(0,74,153,0.35); color:var(--jade); }
  .how-tab.active { background:var(--jade); color:#fff; border-color:var(--jade); box-shadow:0 4px 14px rgba(0,74,153,0.28); }
  .steps-row { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
  .step-card { background:rgba(255,255,255,0.88); border:1px solid rgba(0,74,153,0.1); border-radius:18px; padding:26px 20px; position:relative; }
  .step-n { font-family:var(--mono); font-size:10px; color:rgba(0,74,153,0.4); letter-spacing:1px; margin-bottom:13px; font-weight:700; }
  .step-icon { font-size:26px; margin-bottom:13px; }
  .step-title { font-weight:700; font-size:14px; margin-bottom:7px; color:var(--text); }
  .step-desc  { font-size:13px; color:rgba(15,32,53,0.65); line-height:1.65; font-weight:400; }
  .step-conn  { position:absolute; top:38px; right:-11px; width:22px; height:2px; background:linear-gradient(90deg,rgba(0,74,153,0.28),rgba(0,74,153,0.05)); z-index:2; }

  /* ── SAMPLE HCAs ── */
  .hca-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .hca-card { background:rgba(255,255,255,0.88); border:1px solid var(--border); border-radius:20px; padding:22px; transition:all 0.32s; }
  .hca-card:hover { border-color:rgba(0,74,153,0.28); transform:translateY(-4px); box-shadow:0 14px 44px rgba(0,74,153,0.1); }
  .hca-top  { display:flex; gap:13px; align-items:flex-start; margin-bottom:14px; }
  .hca-av   { width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:23px; flex-shrink:0; border:2px solid rgba(0,74,153,0.15); overflow:hidden; }
  .hca-av img { width:100%; height:100%; object-fit:cover; display:block; border-radius:50%; }
  .hca-name { font-weight:700; font-size:14px; margin-bottom:2px; color:var(--text); }
  .hca-role { font-size:11px; color:var(--jade); font-family:var(--mono); margin-bottom:5px; }
  .hca-rat  { font-size:12px; color:var(--gold); font-weight:600; }
  .hca-dist { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--muted); font-family:var(--mono); margin-bottom:10px; }
  .hca-tags { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:13px; }
  .hca-foot { display:flex; justify-content:flex-end; align-items:center; padding-top:12px; border-top:1px solid rgba(0,74,153,0.08); }
  .avail-pill { font-size:11px; font-weight:600; padding:4px 10px; border-radius:100px; font-family:var(--mono); }
  .avail-yes  { background:rgba(132,189,96,0.14); color:#3e7c1f; border:1px solid rgba(132,189,96,0.32); }
  .avail-no   { background:rgba(249,112,102,0.1); color:var(--coral); border:1px solid rgba(249,112,102,0.2); }

  /* ── TRUST ── */
  .trust-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  .trust-card { background:rgba(255,255,255,0.88); border:1px solid rgba(0,74,153,0.1); border-radius:18px; padding:26px 20px; text-align:center; }
  .trust-icon  { font-size:30px; margin-bottom:12px; }
  .trust-title { font-weight:700; font-size:14px; margin-bottom:7px; color:var(--text); }
  .trust-desc  { font-size:13px; color:rgba(15,32,53,0.65); line-height:1.6; font-weight:400; }

  /* ── CTA BOX ── */
  .cta-box { background:linear-gradient(135deg,rgba(0,74,153,0.07),rgba(237,241,249,0.95)); border:1px solid rgba(0,74,153,0.18); border-radius:30px; padding:72px 56px; text-align:center; position:relative; overflow:hidden; }
  .cta-box::before { content:''; position:absolute; top:-80px; right:-80px; width:360px; height:360px; border-radius:50%; background:radial-gradient(circle,rgba(132,189,96,0.08),transparent 70%); pointer-events:none; }
  .cta-box h2 { font-family:var(--serif); font-size:clamp(26px,3.5vw,46px); font-weight:700; margin-bottom:14px; line-height:1.2; color:var(--text); }
  .cta-box p  { font-size:16px; color:rgba(15,32,53,0.68); max-width:480px; margin:0 auto 32px; line-height:1.75; font-weight:400; }
  .cta-acts   { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }

  @media (max-width:960px) {
    .hero-inner    { grid-template-columns:1fr; }
    .user-cards    { display:none; }
    .portals-grid  { grid-template-columns:1fr 1fr; }
    .steps-row     { grid-template-columns:1fr 1fr; }
    .hca-grid      { grid-template-columns:1fr 1fr; }
    .trust-grid    { grid-template-columns:1fr 1fr; }
    .step-conn     { display:none; }
    /* Full-width photo, shifted down so Salome's face (bottom-right) is in frame */
    .hp1 {
      width: 100%;
      object-position: 76% 60%;
      -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0.78) 42%, black 58%, black 100%);
      mask-image:         linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0.78) 42%, black 58%, black 100%);
    }
    .hp2 { display: none; }
    /* Pull back right-side fade to reveal face; keep left wall solid for text */
    .hero-overlay {
      background: linear-gradient(to right,
        rgba(235,241,250,0.98) 0%,
        rgba(235,241,250,0.95) 30%,
        rgba(235,241,250,0.76) 48%,
        rgba(235,241,250,0.32) 63%,
        rgba(235,241,250,0.07) 78%,
        transparent 90%
      );
    }
  }
  @media (max-width:600px) {
    .portals-grid, .hca-grid, .trust-grid { grid-template-columns:1fr; }
    .steps-row     { grid-template-columns:1fr; }
    .hero-stats    { gap:18px; }
    .cta-box       { padding:44px 24px; }
  }
`;

const PORTALS = [
  { cls:"match",  icon:"🗺️",  iconCls:"green", tagCls:"green", tag:"For Families",     title:"Find & Match Carers",        desc:"Browse HCAs by location, care type, language, shift and more. Shortlist your preferred carers and book a placement.",           href:"/match",        linkCls:"green", link:"Search Assistants →" },
  { cls:"report", icon:"📍",  iconCls:"blue",  tagCls:"blue",  tag:"For HCAs",          title:"Check-In & Cardex Portal",   desc:"Log in, clock in with GPS, complete your shift Cardex, log vitals and incidents, perform handovers and clock out securely.",     href:"/hca/login",    linkCls:"blue",  link:"HCA Login →" },
  { cls:"care",   icon:"🫂",  iconCls:"gold",  tagCls:"gold",  tag:"Family Caregivers", title:"Training & Support Hub",     desc:"Training modules, peer community, professional counselling and resources for family members navigating caregiving.",             href:"/caregivers",   linkCls:"gold",  link:"Explore Hub →" },
  // { cls:"partner",icon:"🏥",  iconCls:"coral", tagCls:"coral", tag:"Partners",        title:"Healthcare Provider Portal", desc:"Hospitals and clinics can refer patients and receive structured care quality outcome reports.",                                    href:"/partners",     linkCls:"coral", link:"Partner With Us →" },   // Coming soon
  // { cls:"soon",   icon:"🛒",  iconCls:"grey",  tagCls:"grey",  tag:"Coming Soon",     title:"Homecare Products",          desc:"Medical equipment, mobility aids, consumables - curated by our clinical team, delivered to your door.",                         href:"/products",     linkCls:"green", link:"Join Waitlist →", soon:true },  // Coming soon
];

const HCA_SAMPLES = [
  { av:"👩🏾", photo:"/images/portraits/hca-amina-njeri.svg",  bg:"rgba(0,74,153,0.12)",    name:"Amina Njeri",    role:"CNA · Certified",          rat:"★★★★★ 4.9 (42)", dist:"1.2 km", tags:["Elderly","Post-Op","Palliative"], langs:["English","Swahili","Kikuyu"], rate:"KES 800", per:"/hr", avail:true },
  { av:"👨🏿", photo:"/images/portraits/hca-john-omondi.svg",  bg:"rgba(14,165,233,0.14)",  name:"John Mwangi",    role:"Home Care Specialist",     rat:"★★★★★ 4.8 (31)", dist:"2.7 km", tags:["Dementia","Critical Care"],       langs:["English","Luo","Swahili"],   rate:"KES 650", per:"/hr", avail:true },
  { av:"👩🏽", photo:"/images/portraits/hca-grace-otieno.svg", bg:"rgba(132,189,96,0.16)",  name:"Grace Otieno",   role:"Palliative Care Aide",     rat:"★★★★☆ 4.6 (18)", dist:"3.4 km", tags:["Palliative","Child Care"],        langs:["Luhya","Swahili","English"], rate:"KES 700", per:"/hr", avail:false },
];

const STEPS_FAM = [
  { n:"01", icon:"📍", title:"Enter Your Location",   desc:"Share your area to see matching HCAs within your preferred radius - no travel hassle." },
  { n:"02", icon:"🔍", title:"Filter & Shortlist",    desc:"Filter by care type, gender, language, shifts and period. Shortlist your top choices." },
  { n:"03", icon:"📋", title:"Create Account",        desc:"Register as a client, add patient details and accept T&Cs to proceed to placement." },
  { n:"04", icon:"✅", title:"Placement & Care",      desc:"Our team calls, visits and confirms the match. Pay and your HCA is placed - care begins." },
];
const STEPS_HCA = [
  { n:"01", icon:"📝", title:"Apply & Upload Docs",   desc:"Submit your full profile, certifications, languages and service area via the online form." },
  { n:"02", icon:"🎓", title:"Vetting & Approval",    desc:"Our admin team verifies your credentials, conducts an interview and pre-approves your profile." },
  { n:"03", icon:"📅", title:"Set Availability",      desc:"Mark your available days on the eVive calendar. Receive placement notifications for your area." },
  { n:"04", icon:"💳", title:"Get Placed & Paid",     desc:"Accept placements, clock in on-site, complete Cardex each shift and receive timely payment." },
];

export default function Home() {
  const [tab, setTab] = useState("family");
  const steps = tab === "family" ? STEPS_FAM : STEPS_HCA;

  // Filter Assistants - draft + apply model
  const [filterDraft, setFilterDraft] = useState({});
  const [filterApplied, setFilterApplied] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(entries =>
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.07 }
    );
    document.querySelectorAll(".fade-in").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>E-Vive - Kenya&apos;s HomeCare Matching Platform</title>
        <meta name="description" content="Connect with certified HomeCare Assistants near you. Location-based matching, Cardex reporting, family caregiver support, partner hospitals and more." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />

        {/* Photo background layer - two real photos blended into the hero */}
        <div className="hero-photos" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hp2" src="/images/hero-photo-2.jpg" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hp1" src="/images/hero-photo-1.jpg" alt="" />
          <div className="hp-btm" />
        </div>

        {/* Gradient overlay - protects left-column text, reveals photos on right */}
        <div className="hero-overlay" aria-hidden="true" />

        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow"><div className="eyebrow-line" /><span className="eyebrow-txt">Nairobi · Kenya · Pan-East Africa · Est. 2025</span></div>
            <h1>Certified Care,<br/><em>Matched to</em><br/>Your <span className="gold">Location</span></h1>
            <p className="hero-sub">E-Vive connects families with pre-vetted Home Care Assistants closest to them - with live Cardex reporting, quality monitoring and family support all in one platform.</p>
            <div className="hero-btns">
              <Link href="/match" className="btn-p">Find a Carer Near Me →</Link>
              <Link href="/hca/apply" className="btn-o">Join as an Assistant</Link>
            </div>
            <div className="hero-stats">
              {[["∞","Registered HCAs"],["∞","Families Served"],["47","Sub-Counties"],["4.8★","Avg. Rating"]].map(([n,l]) => (
                <div key={l}><div className="hstat-num">{n}</div><div className="hstat-lbl">{l}</div></div>
              ))}
            </div>
          </div>

          <div className="user-cards">
            <Link href="/match" className="user-card family">
              <div className="uc-icon green">👨‍👩‍👧</div>
              <div><div className="uc-title">I need care for a family member</div><div className="uc-sub">Search, shortlist and hire a certified HCA near you</div></div>
              <div className="uc-arrow">›</div>
            </Link>
            <Link href="/hca/apply" className="user-card hca">
              <div className="uc-icon blue">🩺</div>
              <div><div className="uc-title">I am a HomeCare Assistant</div><div className="uc-sub">Register your profile, set your service area and get placed</div></div>
              <div className="uc-arrow" style={{color:"var(--sky)"}}>›</div>
            </Link>
            {/* Partners portal - coming soon
            <Link href="/partners" className="user-card org">
              <div className="uc-icon gold">🏥</div>
              <div><div className="uc-title">We are a healthcare organisation</div><div className="uc-sub">Refer patients, access HCA network and get care reports</div></div>
              <div className="uc-arrow" style={{color:"var(--amber)"}}>›</div>
            </Link>
            */}
          </div>
        </div>
      </section>

      {/* ── HERO SCENE IMAGE ── */}
      <section style={{padding:'0 0 8px', background:'var(--bg)'}}>
        <div className="si" style={{paddingTop:0,paddingBottom:0}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/scenes/hero-home.png"
            alt="An E-Vive HomeCare Assistant tending to an elderly patient in a warm home setting"
            style={{
              width:'100%', borderRadius:'20px', display:'block',
              boxShadow:'0 12px 48px rgba(0,53,128,0.14)',
              maxHeight:'420px', objectFit:'cover'
            }}
          />
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section id="portals">
        <div className="si">
          <div className="fade-in" style={{marginBottom:44}}>
            <div className="stag">Platform Portals</div>
            <h2 className="stitle" style={{marginTop:12}}>One platform,<br/><em>three powerful portals</em></h2>
            <p className="ssub">Families, HomeCare Assistants, and family caregivers each have a dedicated, purpose-built portal - with more coming soon.</p>
            <div className="divider" />
          </div>
          <div className="portals-grid">
            {PORTALS.map((p, i) => (
              <Link href={p.href} className={`pg-card ${p.cls} fade-in`} key={i} style={{transitionDelay:`${i*70}ms`}}>
                {p.soon && <div className="soon-badge">COMING SOON</div>}
                <div className={`pg-icon ${p.iconCls}`}>{p.icon}</div>
                <div className={`pg-tag ${p.tagCls}`}>{p.tag}</div>
                <div className="pg-title">{p.title}</div>
                <div className="pg-desc">{p.desc}</div>
                <div className={`pg-link ${p.linkCls}`}>{p.link}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-bg">
        <div className="si">
          <div className="fade-in" style={{marginBottom:36}}>
            <div className="stag">How It Works</div>
            <h2 className="stitle" style={{marginTop:12}}>Simple steps to <em>quality care</em></h2>
            <div className="divider" />
          </div>
          <div className="how-tabs">
            {[["family","👨‍👩‍👧 For Families"],["hca","🩺 For HCA Assistants"]].map(([k,l]) => (
              <button key={k} className={`how-tab${tab===k?" active":""}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
          {tab === "family" && (
            <div style={{marginBottom:32}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/scenes/how-it-works-families.svg"
                alt="E-Vive app showing location-based HCA matching on a smartphone"
                style={{
                  width:'100%', maxWidth:'400px', display:'block', margin:'0 auto',
                  borderRadius:'14px', boxShadow:'0 8px 32px rgba(0,74,153,0.12)'
                }}
              />
            </div>
          )}
          <div className="steps-row">
            {steps.map((s,i) => (
              <div className="step-card fade-in" key={i} style={{transitionDelay:`${i*90}ms`}}>
                {i < steps.length-1 && <div className="step-conn" />}
                <div className="step-n">Step {s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE HCAs ── */}
      <section>
        <div className="si">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:40,flexWrap:"wrap",gap:16}}>
            <div className="fade-in">
              <div className="stag">Available Near You</div>
              <h2 className="stitle" style={{marginTop:12}}>Featured <em>Assistants</em></h2>
              <div className="divider" />
            </div>
            <Link href="/match" className="btn-o fade-in">View All Assistants →</Link>
          </div>
          <div className="hca-grid">
            {HCA_SAMPLES.map((h,i) => (
              <div className="hca-card fade-in" key={i} style={{transitionDelay:`${i*90}ms`}}>
                <div className="hca-top">
                  <div className="hca-av" style={{background:h.photo ? 'transparent' : h.bg}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {h.photo ? <img src={h.photo} alt={h.name} /> : h.av}
                  </div>
                  <div>
                    <div className="hca-name">{h.name}</div>
                    <div className="hca-role">{h.role}</div>
                    <div className="hca-rat">{h.rat}</div>
                  </div>
                </div>
                <div className="hca-dist">📍 {h.dist} from Westlands</div>
                <div className="hca-tags">
                  {[...h.tags,...h.langs].map(t=><span className="tag" key={t}>{t}</span>)}
                </div>
                <div className="hca-foot">
                  <div className={`avail-pill ${h.avail?"avail-yes":"avail-no"}`}>{h.avail?"Available":"Engaged"}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:32}}>
            <Link href="/match" className="btn-p">Browse All Assistants → Apply Filters</Link>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section style={{background:"linear-gradient(180deg,transparent,rgba(0,74,153,0.04),transparent)"}}>
        <div className="si">
          <div className="fade-in" style={{textAlign:"center",marginBottom:44}}>
            <div className="stag" style={{margin:"0 auto 12px"}}>Safety & Quality</div>
            <h2 className="stitle" style={{textAlign:"center"}}>Every assistant is <em>verified</em></h2>
          </div>
          <div className="trust-grid">
            {[
              {icon:"🪪",title:"Identity Verified",       desc:"National ID and biometric verification for every registered assistant before activation."},
              {icon:"🎓",title:"Credentials Checked",     desc:"We verify education certificates, nursing qualifications and care certifications directly with issuers."},
              {icon:"🔍",title:"Background Screened",     desc:"Criminal background checks and reference verification before any client-facing placement."},
              {icon:"🛡️",title:"Ongoing Quality Monitoring",desc:"Shift Cardex data, timeliness, client ratings and care compliance are tracked and reviewed continuously."},
            ].map((t,i)=>(
              <div className="trust-card fade-in" key={i} style={{transitionDelay:`${i*70}ms`}}>
                <div className="trust-icon">{t.icon}</div>
                <div className="trust-title">{t.title}</div>
                <div className="trust-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section>
        <div className="si">
          <div className="cta-box fade-in">
            <div className="stag gold" style={{margin:"0 auto 18px"}}>Get Started Today</div>
            <h2>Care that comes <em>to you</em></h2>
            <p>Whether you need care for a loved one, you&apos;re a skilled assistant ready to serve, or a healthcare provider seeking trusted home care partnerships.</p>
            <div className="cta-acts">
              <Link href="/match"     className="btn-p">Find a Carer Near Me →</Link>
              <Link href="/hca/apply" className="btn-a">Register as an Assistant</Link>
              <Link href="/partners"  className="btn-o">Partner With Us</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
