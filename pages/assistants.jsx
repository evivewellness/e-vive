import { useState } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  /* Hero */
  .ast-hero {
    background: radial-gradient(ellipse 90% 60% at 70% 30%, rgba(0,74,153,0.08) 0%, transparent 60%),
                radial-gradient(ellipse 50% 55% at 5% 80%, rgba(132,189,96,0.06) 0%, transparent 55%),
                linear-gradient(155deg, #EBF1FA 0%, #F4F7F6 55%, #EEF5EE 100%);
    padding: 80px 24px 60px;
    position: relative; overflow: hidden;
  }

  /* Photo background layers */
  .ast-hero-photos { position:absolute; inset:0; z-index:1; overflow:hidden; pointer-events:none; }
  .ast-hp2 {
    position:absolute; top:0; right:0; height:100%; width:72%; object-fit:cover; display:block;
    object-position:55% 12%; opacity:0.58;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 14%, black 36%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.45) 14%, black 36%, black 100%);
  }
  .ast-hp1 {
    position:absolute; top:0; right:0; height:100%; width:52%; object-fit:cover; display:block;
    object-position:48% 10%;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 16%, black 40%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 16%, black 40%, black 100%);
  }
  .ast-hp-btm {
    position:absolute; bottom:0; left:0; right:0; height:200px;
    background:linear-gradient(to bottom, transparent 0%, rgba(235,241,250,0.97) 100%);
  }
  .ast-hero-overlay {
    position:absolute; inset:0; z-index:2; pointer-events:none;
    background:linear-gradient(to right,
      rgba(235,241,250,0.98) 0%, rgba(235,241,250,0.96) 28%,
      rgba(235,241,250,0.72) 44%, rgba(235,241,250,0.28) 58%,
      rgba(235,241,250,0.06) 72%, transparent 84%);
  }

  .ast-hero-inner {
    position:relative; z-index:3; max-width:1100px; margin:0 auto;
    display:grid; grid-template-columns:1fr 420px; gap:48px; align-items:center;
  }
  @media(max-width:820px){ .ast-hero-inner { grid-template-columns:1fr; } }

  .ast-hero-tag {
    display:inline-block;
    background:rgba(0,74,153,0.08); border:1px solid rgba(0,74,153,0.22);
    color:var(--jade); padding:6px 18px; border-radius:999px;
    font-size:0.75rem; letter-spacing:0.08em; text-transform:uppercase;
    margin-bottom:24px;
  }
  .ast-hero h1 { font-size:clamp(2rem,4.5vw,3rem); line-height:1.15; margin-bottom:18px; color:var(--text); }
  .ast-hero h1 span { color:var(--jade); }
  .ast-hero p  { font-size:1.05rem; color:rgba(15,32,53,0.72); line-height:1.7; margin-bottom:28px; max-width:480px; }
  .ast-hero-btns { display:flex; gap:14px; flex-wrap:wrap; }

  .ast-hero-card {
    background:rgba(255,255,255,0.82); border:1px solid rgba(0,74,153,0.15);
    border-radius:20px; padding:28px; backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
    box-shadow:0 4px 24px rgba(0,74,153,0.1);
  }
  .ast-hero-card h4 { font-size:0.85rem; color:var(--jade); margin-bottom:18px; text-transform:uppercase; letter-spacing:0.07em; }
  .hca-sample-profile { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
  .hca-sp-avatar {
    width:56px; height:56px; border-radius:50%;
    background:linear-gradient(135deg,var(--jade),var(--emerald));
    display:flex; align-items:center; justify-content:center;
    font-size:1.3rem; font-weight:700; color:#fff; flex-shrink:0;
    overflow:hidden;
  }
  .hca-sp-avatar img { width:100%; height:100%; object-fit:cover; display:block; border-radius:50%; }
  .hca-sp-info .name { font-size:1rem; font-weight:700; margin-bottom:2px; color:var(--text); }
  .hca-sp-info .role { font-size:0.8rem; color:var(--jade); }
  .hca-sp-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
  .hca-sp-stat { background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.1); border-radius:10px; padding:10px 12px; text-align:center; }
  .hca-sp-stat .val { font-size:1.2rem; font-weight:700; color:var(--jade); }
  .hca-sp-stat .lab { font-size:0.7rem; color:var(--muted); }
  .hca-sp-tags { display:flex; flex-wrap:wrap; gap:6px; }
  .tag-sky { background:rgba(0,74,153,0.08); border:1px solid rgba(0,74,153,0.2); color:var(--jade); padding:4px 10px; border-radius:6px; font-size:0.72rem; }

  /* Section commons */
  .ast-section { padding:64px 24px; }
  .ast-section-alt { background:rgba(255,255,255,0.02); }
  .ast-inner { max-width:1100px; margin:0 auto; }
  .ast-section-head { text-align:center; margin-bottom:48px; }
  .ast-section-head .tag { font-size:0.72rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--sky); margin-bottom:12px; display:block; }
  .ast-section-head h2 { font-size:clamp(1.6rem,3vw,2.2rem); margin-bottom:12px; }
  .ast-section-head p  { color:var(--muted); max-width:540px; margin:0 auto; line-height:1.7; }

  /* Benefits */
  .benefits-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
  .benefit-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:16px; padding:24px;
    transition:border-color 0.2s, transform 0.2s;
  }
  .benefit-card:hover { border-color:rgba(56,189,248,0.3); transform:translateY(-3px); }
  .benefit-icon { font-size:2rem; margin-bottom:14px; }
  .benefit-card h3 { font-size:1rem; margin-bottom:8px; }
  .benefit-card p  { font-size:0.85rem; color:var(--muted); line-height:1.6; }

  /* Plans */
  .plans-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  @media(max-width:820px){ .plans-grid { grid-template-columns:1fr; max-width:400px; margin:0 auto; } }

  .plan-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
    border-radius:20px; padding:28px; position:relative;
    transition:border-color 0.2s, transform 0.2s;
  }
  .plan-card:hover { transform:translateY(-4px); }
  .plan-card.featured {
    border-color:rgba(56,189,248,0.5);
    background:rgba(56,189,248,0.06);
  }
  .plan-badge {
    position:absolute; top:-12px; left:50%; transform:translateX(-50%);
    background:var(--sky); color:#031a24; font-size:0.7rem; font-weight:700;
    padding:4px 14px; border-radius:999px; white-space:nowrap;
  }
  .plan-name { font-size:0.8rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px; }
  .plan-price { font-size:2.4rem; font-weight:700; margin-bottom:4px; color:#fff; }
  .plan-price span { font-size:1rem; font-weight:400; color:var(--muted); }
  .plan-desc { font-size:0.82rem; color:var(--muted); margin-bottom:20px; line-height:1.5; }
  .plan-divider { height:1px; background:rgba(255,255,255,0.08); margin:20px 0; }
  .plan-features { display:flex; flex-direction:column; gap:10px; margin-bottom:24px; }
  .plan-feat { display:flex; align-items:flex-start; gap:10px; font-size:0.83rem; }
  .plan-feat .check { color:var(--sky); font-size:0.85rem; margin-top:1px; flex-shrink:0; }
  .plan-feat .text  { color:var(--text); line-height:1.4; }
  .plan-feat .text.muted { color:var(--muted); }

  /* How to join */
  .join-steps { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
  .join-step {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:16px; padding:24px; text-align:center;
  }
  .step-num {
    width:44px; height:44px; border-radius:50%;
    background:rgba(56,189,248,0.12); border:2px solid rgba(56,189,248,0.3);
    display:flex; align-items:center; justify-content:center;
    font-size:1rem; font-weight:700; color:var(--sky);
    margin:0 auto 16px;
  }
  .join-step h4 { font-size:0.95rem; margin-bottom:8px; }
  .join-step p  { font-size:0.82rem; color:var(--muted); line-height:1.5; }

  /* Metrics / what HCAs earn */
  .earnings-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
  .earn-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:14px; padding:22px; text-align:center;
  }
  .earn-card .val { font-size:1.8rem; font-weight:700; color:var(--sky); }
  .earn-card .lab { font-size:0.8rem; color:var(--muted); margin-top:4px; }

  /* FAQ */
  .faq-list { max-width:700px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }
  .faq-item {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:12px; overflow:hidden;
  }
  .faq-q {
    width:100%; background:none; border:none; cursor:pointer;
    display:flex; justify-content:space-between; align-items:center;
    padding:18px 20px; color:var(--text); font-size:0.92rem; font-weight:600;
    text-align:left;
  }
  .faq-q .chevron { transition:transform 0.2s; font-size:1rem; }
  .faq-a { padding:0 20px 18px; font-size:0.85rem; color:var(--muted); line-height:1.7; }

  /* CTA */
  .ast-cta {
    background:linear-gradient(135deg,rgba(56,189,248,0.1),rgba(168,0,64,0.06));
    border:1px solid rgba(56,189,248,0.2);
    border-radius:20px; padding:56px 32px; text-align:center;
  }
  .ast-cta h2 { font-size:clamp(1.6rem,3vw,2.2rem); margin-bottom:14px; }
  .ast-cta p  { color:var(--muted); max-width:500px; margin:0 auto 32px; }
  .ast-cta-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
`;

const BENEFITS = [
  { icon: '📍', title: 'Location-Based Matching', desc: 'Our algorithm matches you with clients within your defined service radius, minimising commute time and transport costs.' },
  { icon: '💰', title: 'Competitive, Transparent Pay', desc: 'Rates are set by E-Vive administration based on your certification, experience, and care specialisation - clearly communicated before your first placement.' },
  { icon: '🛡️', title: 'Verified & Protected', desc: 'Your identity is verified, your certifications are showcased, and your profile is backed by the E-Vive quality assurance badge.' },
  { icon: '📱', title: 'Digital Cardex System', desc: 'GPS clock-in, digital shift reports, and automated payroll. No more paper records - everything is tracked and timestamped.' },
  { icon: '📚', title: 'Free Ongoing Training', desc: 'Access CPD training modules, certification courses, and skill upgrades at no extra cost on Professional and Premium plans.' },
  { icon: '💬', title: 'HCA Community & Welfare', desc: 'Peer support, confidential counselling, off-day request system, and a welfare line - we care for our carers.' },
];

const PLANS = [
  {
    name: 'Basic', price: 'KSh 75', period: '/month', featured: false,
    desc: 'Get listed and start receiving placement enquiries.',
    features: [
      { text: 'Verified profile listing', active: true },
      { text: 'Location-based search visibility', active: true },
      { text: 'Up to 2 active placements', active: true },
      { text: 'Basic digital Cardex', active: true },
      { text: 'GPS clock-in & clock-out', active: true },
      { text: 'Training modules access', active: false },
      { text: 'Priority placement ranking', active: false },
      { text: 'Welfare & counselling line', active: false },
    ],
  },
  {
    name: 'Professional', price: 'KSh 100', period: '/month', featured: true, badge: 'Most Popular',
    desc: 'Everything you need to build a thriving homecare career.',
    features: [
      { text: 'Everything in Basic', active: true },
      { text: 'Unlimited active placements', active: true },
      { text: 'Priority search ranking', active: true },
      { text: 'Full training module library', active: true },
      { text: 'Welfare & counselling line', active: true },
      { text: 'Earnings analytics dashboard', active: true },
      { text: 'CPD certification support', active: false },
      { text: 'Featured profile badge', active: false },
    ],
  },
  {
    name: 'Premium', price: 'KSh 150', period: '/month', featured: false,
    desc: 'For experienced HCAs who want maximum visibility and growth.',
    features: [
      { text: 'Everything in Professional', active: true },
      { text: 'Featured profile badge', active: true },
      { text: 'CPD certification support', active: true },
      { text: 'Partner hospital referrals', active: true },
      { text: 'Dedicated account manager', active: true },
      { text: 'Advanced skill verification', active: true },
      { text: 'Profile highlighted in search', active: true },
      { text: 'Early access to new features', active: true },
    ],
  },
];

const JOIN_STEPS = [
  { n: '01', title: 'Submit Application', desc: 'Complete the 5-step online application including personal details, certifications, skills, and service preferences.' },
  { n: '02', title: 'Verification', desc: 'Our team verifies your ID, certificates, and references within 2–3 business days.' },
  { n: '03', title: 'Choose Your Plan', desc: 'Select the subscription plan that fits your career goals and activate your profile.' },
  { n: '04', title: 'Go Live', desc: 'Your profile becomes searchable by families and coordinators. Start receiving placement enquiries.' },
  { n: '05', title: 'Get Placed', desc: 'Accept a placement, complete orientation with the client family, and begin your first shift.' },
];

const FAQS = [
  { q: 'Do I need to be a registered nurse to apply?', a: 'Not necessarily. We accept Certificate-level HCAs, Diploma nurses, and specialists. What matters is your certification, experience, and commitment to quality care. Each profile shows your exact qualifications so clients can make informed choices.' },
  { q: 'How does the location matching work?', a: 'You set a service radius (e.g. 5 km, 10 km) from your home location. Clients searching within that radius will see your profile. The closer you are to a client, the higher your match ranking for that search.' },
  { q: 'When and how do I get paid?', a: 'Payments are processed weekly via M-Pesa or bank transfer. Your earnings are calculated from your GPS-verified clock-in/clock-out records in the digital Cardex system.' },
  { q: 'Can I take time off or reject placements?', a: 'Yes. You control your calendar. Submit off-day requests with 48 hours notice through your dashboard. You can also decline placements that don\'t fit your skills or availability.' },
  { q: 'What happens if there is a problem with a client?', a: 'Contact our HCA support line immediately. We have a welfare officer and a conflict resolution process. Your safety and wellbeing are our priority.' },
  { q: 'Is my home location shared with clients?', a: 'No. Clients only see your approximate service area (e.g. "Westlands area"). Your exact home address is never shared.' },
];

export default function AssistantsPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* Hero */}
      <section className="ast-hero">
        <div className="ast-hero-photos" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ast-hp2" src="/images/hero-group-care.png" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ast-hp1" src="/images/hero-group-care.png" alt="" />
          <div className="ast-hp-btm" />
        </div>
        <div className="ast-hero-overlay" aria-hidden="true" />
        <div className="ast-hero-inner">
          <div>
            <div className="ast-hero-tag">For HomeCare Assistants</div>
            <h1>Build a Career <span>You Are Proud Of</span></h1>
            <p>Join Kenya&apos;s leading homecare platform. Get matched with clients near you, manage your shifts digitally, and grow your career.</p>
            <div className="ast-hero-btns">
              <Link href="/hca/apply" className="btn-p">Apply Now - It&apos;s Free →</Link>
            </div>
          </div>
          <div className="ast-hero-card">
            <h4>Sample HCA Profile</h4>
            <div className="hca-sample-profile">
              <div className="hca-sp-avatar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/portraits/hca-jane-njambi.svg" alt="Florence Njeri - Senior HCA" />
              </div>
              <div className="hca-sp-info">
                <div className="name">Florence Njeri</div>
                <div className="role">Senior HomeCare Assistant · Westlands</div>
              </div>
            </div>
            <div className="hca-sp-stats">
              <div className="hca-sp-stat"><div className="val">4.9★</div><div className="lab">Rating</div></div>
              <div className="hca-sp-stat"><div className="val">148</div><div className="lab">Shifts</div></div>
              <div className="hca-sp-stat"><div className="val">97%</div><div className="lab">Timeliness</div></div>
              <div className="hca-sp-stat"><div className="val">12</div><div className="lab">Placements</div></div>
            </div>
            <div className="hca-sp-tags">
              {['Palliative','Dementia','Diabetes','English','Kikuyu','Kiswahili'].map(t => (
                <div className="tag-sky" key={t}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="ast-section">
        <div className="ast-inner">
          <div className="ast-section-head">
            <span className="tag">Why E-Vive</span>
            <h2>Everything You Need to Thrive</h2>
            <p>We built this platform with HCAs, not just for them. Your success is our success.</p>
          </div>
          <div className="benefits-grid">
            {BENEFITS.map(b => (
              <div className="benefit-card" key={b.title}>
                <div className="benefit-icon">{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to join */}
      <section className="ast-section">
        <div className="ast-inner">
          <div className="ast-section-head">
            <span className="tag">Simple Process</span>
            <h2>How to Join</h2>
            <p>From application to first placement in as little as 5 days.</p>
          </div>
          <div className="join-steps">
            {JOIN_STEPS.map(s => (
              <div className="join-step" key={s.n}>
                <div className="step-num">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="ast-section ast-section-alt">
        <div className="ast-inner">
          <div className="ast-section-head">
            <span className="tag">Common Questions</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <div className="faq-item" key={i}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq===i ? null : i)}>
                  {f.q}
                  <span className="chevron" style={{ transform: openFaq===i ? 'rotate(180deg)' : 'none' }}>▾</span>
                </button>
                {openFaq===i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ast-section">
        <div className="ast-inner">
          <div className="ast-cta">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join 850+ HomeCare Assistants already building their careers on E-Vive. Applications take under 15 minutes.</p>
            <div className="ast-cta-btns">
              <Link href="/hca/apply" className="btn-sky">Apply Now →</Link>
              <Link href="/match" className="btn-o">See Sample Profiles</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
