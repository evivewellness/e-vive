import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  /* Hero */
  .ab-hero {
    background: linear-gradient(150deg, var(--deep) 0%, #0f1030 55%, var(--forest) 100%);
    padding: 88px 5vw 72px;
    position: relative; overflow: hidden;
  }
  .ab-hero::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 15% 60%, rgba(168,0,64,0.07) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 25%, rgba(232,213,168,0.06) 0%, transparent 55%);
  }
  .ab-hero-inner {
    position: relative; max-width: 1100px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 440px; gap: 64px; align-items: center;
  }
  @media(max-width: 860px) { .ab-hero-inner { grid-template-columns: 1fr; gap: 40px; } }

  .ab-hero h1 {
    font-family: var(--serif); font-size: clamp(2.2rem, 4.5vw, 3.4rem);
    line-height: 1.15; margin-bottom: 20px; font-weight: 700;
  }
  .ab-hero h1 em { font-style: italic; color: var(--mint); }
  .ab-hero p { font-size: 1.05rem; color: var(--muted); line-height: 1.75; margin-bottom: 32px; max-width: 520px; }

  .ab-hero-visual {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(168,0,64,0.18);
    border-radius: 24px; padding: 32px;
    backdrop-filter: blur(12px);
  }
  .ab-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ab-stat-box {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 20px; text-align: center;
  }
  .ab-stat-box .val { font-family: var(--serif); font-size: 2rem; font-weight: 700; color: var(--mint); }
  .ab-stat-box .val.gold { color: var(--amber); }
  .ab-stat-box .lab { font-size: 0.75rem; color: var(--muted); margin-top: 4px; line-height: 1.4; }
  .ab-founded {
    margin-top: 16px; padding: 16px 20px;
    background: rgba(232,213,168,0.07); border: 1px solid rgba(232,213,168,0.18);
    border-radius: 12px; text-align: center;
    font-size: 0.85rem; color: var(--muted);
  }
  .ab-founded strong { color: var(--amber); }

  /* Section base */
  .ab-section { padding: 72px 5vw; }
  .ab-section-alt { background: rgba(255,255,255,0.02); }
  .ab-inner { max-width: 1100px; margin: 0 auto; }
  .ab-head { margin-bottom: 48px; }
  .ab-head.center { text-align: center; }
  .ab-head.center .ssub { margin: 0 auto; }
  .ab-head .stag { margin-bottom: 14px; }
  .ab-head .stitle { margin-bottom: 12px; }

  /* Story two-column */
  .ab-story {
    display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start;
  }
  @media(max-width: 760px) { .ab-story { grid-template-columns: 1fr; } }
  .ab-story-text p {
    font-size: 0.95rem; color: var(--muted); line-height: 1.85; margin-bottom: 18px;
  }
  .ab-story-text p:last-child { margin-bottom: 0; }
  .ab-story-text strong { color: var(--text); }
  .ab-pull-quote {
    border-left: 3px solid var(--mint); padding: 20px 24px;
    background: rgba(168,0,64,0.05); border-radius: 0 12px 12px 0;
    font-family: var(--serif); font-size: 1.15rem; font-style: italic;
    color: var(--text); line-height: 1.6; margin: 24px 0;
  }
  .ab-story-aside { display: flex; flex-direction: column; gap: 16px; }
  .ab-milestone {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 20px;
    display: flex; gap: 16px; align-items: flex-start;
  }
  .ab-milestone-year {
    font-family: var(--mono); font-size: 0.75rem; font-weight: 600;
    color: var(--mint); background: rgba(168,0,64,0.1); border: 1px solid rgba(168,0,64,0.2);
    border-radius: 8px; padding: 4px 10px; flex-shrink: 0; white-space: nowrap;
  }
  .ab-milestone-year.gold { color: var(--amber); background: rgba(232,213,168,0.1); border-color: rgba(232,213,168,0.2); }
  .ab-milestone h4 { font-size: 0.9rem; margin-bottom: 4px; }
  .ab-milestone p  { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }

  /* Mission / Vision */
  .mv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  @media(max-width: 640px) { .mv-grid { grid-template-columns: 1fr; } }
  .mv-card {
    border-radius: 20px; padding: 32px; position: relative; overflow: hidden;
  }
  .mv-card.mission {
    background: linear-gradient(135deg, rgba(107,0,40,0.15), rgba(26,8,18,0.3));
    border: 1px solid rgba(168,0,64,0.22);
  }
  .mv-card.vision {
    background: linear-gradient(135deg, rgba(232,213,168,0.1), rgba(26,8,18,0.3));
    border: 1px solid rgba(200,149,42,0.22);
  }
  .mv-card-label {
    font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.12em;
    text-transform: uppercase; margin-bottom: 16px;
  }
  .mv-card.mission .mv-card-label { color: var(--mint); }
  .mv-card.vision  .mv-card-label { color: var(--amber); }
  .mv-card p { font-size: 1rem; line-height: 1.75; color: var(--text); }

  /* Values */
  .values-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
  .value-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 24px;
    transition: border-color 0.25s, transform 0.25s;
  }
  .value-card:hover { border-color: rgba(168,0,64,0.3); transform: translateY(-3px); }
  .value-icon { font-size: 2rem; margin-bottom: 14px; display: block; }
  .value-card h3 { font-size: 1rem; margin-bottom: 8px; }
  .value-card p  { font-size: 0.84rem; color: var(--muted); line-height: 1.65; }

  /* Team */
  .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 24px; }
  .team-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 28px; text-align: center;
    transition: border-color 0.25s, transform 0.25s;
  }
  .team-card:hover { border-color: rgba(168,0,64,0.3); transform: translateY(-3px); }
  .team-avatar {
    width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--serif); font-size: 1.8rem; font-weight: 700; color: #fff;
  }
  .team-card h3 { font-size: 1rem; margin-bottom: 4px; }
  .team-card .role { font-size: 0.8rem; color: var(--mint); margin-bottom: 12px; }
  .team-card p { font-size: 0.82rem; color: var(--muted); line-height: 1.6; margin-bottom: 14px; }
  .team-langs { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; }
  .team-lang {
    font-size: 0.7rem; padding: 3px 8px; border-radius: 999px;
    background: rgba(168,0,64,0.08); border: 1px solid rgba(168,0,64,0.18); color: var(--mint);
  }

  /* Impact bar */
  .impact-strip {
    background: linear-gradient(135deg, rgba(107,0,40,0.1), rgba(232,213,168,0.06));
    border: 1px solid rgba(168,0,64,0.15); border-radius: 20px;
    padding: 40px 48px; display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 32px;
  }
  @media(max-width: 640px) { .impact-strip { padding: 32px 24px; } }
  .impact-item { text-align: center; }
  .impact-item .val {
    font-family: var(--serif); font-size: 2.2rem; font-weight: 700; color: var(--mint);
    display: block; margin-bottom: 6px;
  }
  .impact-item .val.gold { color: var(--amber); }
  .impact-item .lab { font-size: 0.82rem; color: var(--muted); line-height: 1.4; }

  /* Partners trust */
  .trust-row {
    display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 32px;
  }
  .trust-badge {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 10px 22px; font-size: 0.85rem;
    font-weight: 600; color: var(--muted);
    transition: border-color 0.2s, color 0.2s;
  }
  .trust-badge:hover { border-color: rgba(232,213,168,0.35); color: var(--amber); }

  /* Testimonials */
  .testi-track-wrap {
    overflow: hidden; position: relative; margin-top: 32px;
  }
  .testi-track-wrap::before, .testi-track-wrap::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none;
  }
  .testi-track-wrap::before { left: 0; background: linear-gradient(to right, var(--deep), transparent); }
  .testi-track-wrap::after  { right: 0; background: linear-gradient(to left, var(--deep), transparent); }
  .testi-track {
    display: flex; gap: 20px; width: max-content;
    animation: scroll-testi 50s linear infinite;
  }
  .testi-track:hover { animation-play-state: paused; }
  @keyframes scroll-testi {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .testi-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(168,0,64,0.14);
    border-radius: 18px; padding: 24px 26px; width: 300px; flex-shrink: 0;
    transition: border-color 0.25s;
  }
  .testi-card:hover { border-color: rgba(168,0,64,0.35); }
  .testi-stars { color: var(--amber); font-size: 0.78rem; margin-bottom: 10px; letter-spacing: 2px; }
  .testi-quote {
    font-size: 0.87rem; color: var(--muted); line-height: 1.72;
    margin-bottom: 18px; font-style: italic;
  }
  .testi-author { display: flex; align-items: center; gap: 10px; }
  .testi-av {
    width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff;
  }
  .testi-name { font-size: 0.84rem; font-weight: 600; }
  .testi-loc  { font-size: 0.73rem; color: var(--muted); margin-top: 1px; }

  /* CTA */
  .ab-cta {
    background: linear-gradient(135deg, rgba(168,0,64,0.08), rgba(232,213,168,0.05));
    border: 1px solid rgba(168,0,64,0.18); border-radius: 22px;
    padding: 56px 40px; text-align: center;
  }
  .ab-cta h2 { font-family: var(--serif); font-size: clamp(1.5rem, 3vw, 2.2rem); margin-bottom: 14px; }
  .ab-cta p  { color: var(--muted); max-width: 500px; margin: 0 auto 32px; line-height: 1.7; }
  .ab-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
`;

const MILESTONES = [
  { year: '2019', yearCls: '', title: 'The Founding Story', desc: 'Salome Mburu became her father\'s primary caregiver after his diagnosis, facing the reality that trained, trustworthy home care was nearly impossible to find in Kenya.' },
  { year: '2021', yearCls: 'gold', title: 'E-Vive Founded', desc: 'E-Vive launched with a mission to close the care gap Salome lived firsthand — starting with a pilot of 40 verified HCAs in Nairobi.' },
  { year: '2022', yearCls: '', title: 'Digital Cardex Introduced', desc: 'We replaced paper-based shift records with a GPS-verified digital Cardex, raising care accountability significantly.' },
  { year: '2024', yearCls: '', title: '850+ HCAs, 47 Sub-Counties', desc: 'E-Vive expanded its network nationwide, establishing presence across all 47 sub-counties in Kenya.' },
  { year: '2025', yearCls: 'gold', title: 'Family Caregiver Hub Launched', desc: 'Training modules, counselling access, and peer support groups launched for the 4.5 million family caregivers in Kenya.' },
];

const VALUES = [
  { icon: '🤝', title: 'Dignity First', desc: 'Every patient and every HCA deserves to be treated with respect, compassion, and professionalism — without exception.' },
  { icon: '📍', title: 'Community-Rooted', desc: 'We match HCAs within their own communities, building trust through cultural familiarity, language, and proximity.' },
  { icon: '🔬', title: 'Evidence-Based Care', desc: 'Our training, protocols, and quality metrics are grounded in clinical evidence and developed with registered nurses.' },
  { icon: '📱', title: 'Transparency by Design', desc: 'Real-time GPS, timestamped Cardex entries, and digital reports keep families fully informed about their loved one\'s care.' },
  { icon: '🌱', title: 'Career Sustainability', desc: 'We invest in HCAs through training, welfare support, and fair pay structures — because a thriving HCA delivers better care.' },
  { icon: '🛡️', title: 'Accountability', desc: 'Our quality assurance process, incident tracking, and rating system ensure every placement meets our standard of care.' },
];

const TEAM = [
  { initials: 'SM', grad: 'linear-gradient(135deg,#7c3aed,#a80040)', name: 'Salome Mburu', role: 'Founder & CEO', bio: 'Founded E-Vive from lived experience — after caring for her ailing father and discovering that quality, trustworthy home care was nearly impossible to find in Kenya.', langs: ['English','Kikuyu','Kiswahili'] },
  { initials: 'AO', grad: 'linear-gradient(135deg,#0ea5e9,#0369a1)', name: 'Auma Otieno', role: 'Head of HCA Operations', bio: 'Community health specialist with 14 years\' experience placing carers across Nairobi, Kisumu, and Mombasa.', langs: ['Dholuo','Kiswahili','English'] },
  { initials: 'KM', grad: 'linear-gradient(135deg,#8b0033,#92400e)', name: 'Kamau Maina', role: 'Head of Technology', bio: 'Builds the matching engine and Cardex platform. Obsessed with reducing the friction between families and quality care.', langs: ['English','Kikuyu'] },
  { initials: 'FS', grad: 'linear-gradient(135deg,#f97066,#be185d)', name: 'Fatuma Said', role: 'Head of Client Experience', bio: 'Oversees the 8-step client journey and ensures every family receives responsive, empathetic coordination.', langs: ['Kiswahili','English','Arabic'] },
  { initials: 'PM', grad: 'linear-gradient(135deg,#a80040,#6b0028)', name: 'Patrick Mutiso', role: 'Clinical Quality Lead', bio: 'Registered nurse and auditor. Leads care quality reviews, HCA training design, and clinical governance frameworks.', langs: ['Kamba','English','Kiswahili'] },
  { initials: 'GN', grad: 'linear-gradient(135deg,#818cf8,#4338ca)', name: 'Grace Njuguna', role: 'Partnerships Manager', bio: 'Manages relationships with hospitals, NGOs, and insurance providers who refer patients into the E-Vive network.', langs: ['English','Kikuyu','French'] },
];

const TESTIMONIALS = [
  { av: 'GW', grad: 'linear-gradient(135deg,#a80040,#6b0028)', name: 'Grace W.', loc: 'Kilimani, Nairobi', stars: 5, text: 'E-Vive matched us with an incredible HCA within 48 hours of my mother\'s discharge. She is still with us six months later — part of the family.' },
  { av: 'PO', grad: 'linear-gradient(135deg,#0ea5e9,#0369a1)', name: 'Peter O.', loc: 'Langata, Nairobi', stars: 5, text: 'My father has dementia. The HCA is patient, gentle, and professional. The digital Cardex gives us real-time peace of mind every single day.' },
  { av: 'AM', grad: 'linear-gradient(135deg,#8b0033,#92400e)', name: 'Amina M.', loc: 'Mombasa', stars: 5, text: 'We had bad experiences before. E-Vive\'s verification process and the quality of their HCAs genuinely surprised and reassured our whole family.' },
  { av: 'JK', grad: 'linear-gradient(135deg,#06b6d4,#0e7490)', name: 'Dr. J. Kimani', loc: 'Westlands, Nairobi', stars: 5, text: 'As a physician, I refer patients to E-Vive with confidence. The clinical handover process is professional and the Cardex reports are genuinely thorough.' },
  { av: 'EN', grad: 'linear-gradient(135deg,#818cf8,#4338ca)', name: 'Esther N.', loc: 'Karen, Nairobi', stars: 5, text: 'They matched us with an HCA who speaks Kikuyu and understands our culture. For my elderly mother, that personal connection made all the difference.' },
  { av: 'JM', grad: 'linear-gradient(135deg,#f97066,#be185d)', name: 'James M.', loc: 'Kisumu', stars: 5, text: 'Getting a placement in Kisumu was seamless. The HCA is certified, punctual, and genuinely caring. E-Vive operates far beyond just Nairobi.' },
  { av: 'RN', grad: 'linear-gradient(135deg,#7c3aed,#a80040)', name: 'Rose N.', loc: 'Kikuyu, Kiambu', stars: 5, text: 'After my husband\'s stroke we needed help urgently. E-Vive had a trained, caring HCA at our door within 24 hours. I cannot thank them enough.' },
  { av: 'DO', grad: 'linear-gradient(135deg,#0ea5e9,#2a0e1c)', name: 'David O.', loc: 'Kisumu', stars: 5, text: 'The GPS clock-in feature gives me real visibility into when the HCA arrives and leaves. That level of accountability was exactly what we needed.' },
];

export default function AboutPage() {
  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* Hero */}
      <section className="ab-hero">
        <div className="ab-hero-inner">
          <div>
            <div className="stag" style={{ marginBottom: 20 }}>Our Story</div>
            <h1 className="ab-hero-h1">
              <span style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,4.5vw,3.4rem)', lineHeight: 1.15, display: 'block', marginBottom: 20 }}>
                Kenya&apos;s Home Care Platform, <em style={{ fontStyle: 'italic', color: 'var(--mint)' }}>Built with Purpose</em>
              </span>
            </h1>
            <p>E-Vive exists to close the gap between hospital discharge and dignified, professional home recovery — by connecting families with vetted, trained, and compassionate HomeCare Assistants in their own community.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/match" className="btn-p">Find a Carer →</Link>
              <Link href="/contact" className="btn-o">Get in Touch</Link>
            </div>
          </div>
          <div className="ab-hero-visual">
            <div className="ab-stat-grid">
              <div className="ab-stat-box"><div className="val">850+</div><div className="lab">Verified HCAs nationwide</div></div>
              <div className="ab-stat-box"><div className="val">2,400+</div><div className="lab">Families served</div></div>
              <div className="ab-stat-box"><div className="val gold">47</div><div className="lab">Sub-counties covered</div></div>
              <div className="ab-stat-box"><div className="val gold">4.8★</div><div className="lab">Average care rating</div></div>
            </div>
            <div className="ab-founded">Founded <strong>2021</strong> · Nairobi, Kenya · <strong>B-Corp Pending</strong></div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="ab-section">
        <div className="ab-inner">
          <div className="ab-head">
            <div className="stag">How We Started</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">A Gap Nobody Should Fall Through</h2>
            <div className="divider" />
          </div>
          <div className="ab-story">
            <div className="ab-story-text">
              <p>E-Vive was founded in 2021 by <strong>Salome Mburu</strong>, who knows the challenge of home caregiving not from a textbook, but from her own life. When her father fell seriously ill, Salome became his primary caregiver — navigating a healthcare system that offered little support once the hospital doors closed behind them.</p>
              <p>Finding a qualified, trustworthy HomeCare Assistant proved almost impossible. There was no way to verify credentials, no proximity-matching, no structured handover from the clinical team. Families like hers were left to manage alone — often with no training, no record-keeping, and no one to call.</p>
              <div className="ab-pull-quote">
                &ldquo;When my father needed care at home, I couldn&apos;t find a system that worked for us. I built E-Vive so that no family has to go through what we went through — alone, overwhelmed, and without support.&rdquo;
                <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'normal' }}>— Salome Mburu, Founder &amp; CEO</div>
              </div>
              <p>Today E-Vive operates across <strong>47 sub-counties</strong>, with a verified network of over <strong>850 HCAs</strong>, a digital Cardex system, GPS clock-in, and formal partnerships with Kenya&apos;s leading hospitals. Our platform has supported over <strong>2,400 families</strong> through post-discharge recovery, chronic illness management, palliative care, and disability support.</p>
            </div>
            <div className="ab-story-aside">
              {MILESTONES.map(m => (
                <div className="ab-milestone" key={m.year}>
                  <div className={`ab-milestone-year ${m.yearCls}`}>{m.year}</div>
                  <div>
                    <h4>{m.title}</h4>
                    <p>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="ab-section ab-section-alt">
        <div className="ab-inner">
          <div className="ab-head center">
            <div className="stag gold">Purpose</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">Mission &amp; Vision</h2>
            <div className="divider" style={{ margin: '0 auto 14px' }} />
          </div>
          <div className="mv-grid">
            <div className="mv-card mission">
              <div className="mv-card-label">Our Mission</div>
              <p>To professionalise home care in Kenya by connecting families with rigorously vetted, digitally empowered HomeCare Assistants — making high-quality care accessible to every family, in every sub-county.</p>
            </div>
            <div className="mv-card vision">
              <div className="mv-card-label">Our Vision</div>
              <p>A Kenya where no patient recovers alone, no HCA works without support, and no family navigates a care crisis without a trusted partner by their side.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="ab-section">
        <div className="ab-inner">
          <div className="ab-head center">
            <div className="stag">What We Stand For</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">Our Values</h2>
            <div className="divider" style={{ margin: '0 auto 14px' }} />
            <p className="ssub">Six principles that guide every decision — from how we verify an HCA to how we handle a client complaint.</p>
          </div>
          <div className="values-grid">
            {VALUES.map(v => (
              <div className="value-card" key={v.title}>
                <span className="value-icon">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="ab-section ab-section-alt">
        <div className="ab-inner">
          <div className="ab-head center">
            <div className="stag">The People</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">Leadership Team</h2>
            <div className="divider" style={{ margin: '0 auto 14px' }} />
            <p className="ssub">A team of clinicians, technologists, and community health specialists united by one goal.</p>
          </div>
          <div className="team-grid">
            {TEAM.map(t => (
              <div className="team-card" key={t.name}>
                <div className="team-avatar" style={{ background: t.grad }}>{t.initials}</div>
                <h3>{t.name}</h3>
                <div className="role">{t.role}</div>
                <p>{t.bio}</p>
                <div className="team-langs">
                  {t.langs.map(l => <div className="team-lang" key={l}>{l}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="ab-section">
        <div className="ab-inner">
          <div className="ab-head center">
            <div className="stag">Impact</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">By the Numbers</h2>
            <div className="divider" style={{ margin: '0 auto 36px' }} />
          </div>
          <div className="impact-strip">
            {[
              { val: '2,400+', cls: '', lab: 'Families supported' },
              { val: '850+',   cls: '', lab: 'Verified HCAs' },
              { val: '18,000+',cls: 'gold', lab: 'Shifts completed' },
              { val: '47',     cls: '', lab: 'Sub-counties covered' },
              { val: '4.8★',   cls: 'gold', lab: 'Average care rating' },
              { val: '97%',    cls: '', lab: 'Placement success rate' },
            ].map(i => (
              <div className="impact-item" key={i.lab}>
                <span className={`val ${i.cls}`}>{i.val}</span>
                <span className="lab">{i.lab}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="ab-section ab-section-alt">
        <div className="ab-inner">
          <div className="ab-head center">
            <div className="stag gold">Families &amp; Carers</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">What People Say About E-Vive</h2>
            <div className="divider" style={{ margin: '0 auto 14px' }} />
            <p className="ssub">Real words from families and healthcare professionals who trust E-Vive every day.</p>
          </div>
        </div>
        <div className="testi-track-wrap">
          <div className="testi-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div className="testi-card" key={i}>
                <div className="testi-stars">{"★".repeat(t.stars)}</div>
                <div className="testi-quote">&ldquo;{t.text}&rdquo;</div>
                <div className="testi-author">
                  <div className="testi-av" style={{ background: t.grad }}>{t.av}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-loc">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ab-section">
        <div className="ab-inner">
          <div className="ab-cta">
            <h2>Join the E-Vive Movement</h2>
            <p>Whether you need care for a loved one, want to build a career as an HCA, or are a healthcare provider seeking a trusted home care partner — we are here.</p>
            <div className="ab-cta-btns">
              <Link href="/match" className="btn-p">Find a Carer →</Link>
              <Link href="/hca/apply" className="btn-sky">Apply as an HCA</Link>
              <Link href="/contact" className="btn-o">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
