import { useState } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  /* Hero */
  .pt-hero {
    background: radial-gradient(ellipse 80% 60% at 72% 32%, rgba(0,74,153,0.08) 0%, transparent 60%),
                radial-gradient(ellipse 50% 55% at 5% 78%, rgba(132,189,96,0.06) 0%, transparent 55%),
                linear-gradient(155deg, #EBF1FA 0%, #F4F7F6 55%, #EEF5EE 100%);
    padding: 80px 24px 64px; position: relative; overflow: hidden;
  }

  /* Photo background layers */
  .pt-hero-photos { position:absolute; inset:0; z-index:1; overflow:hidden; pointer-events:none; }
  .pt-hp2 {
    position:absolute; top:0; right:0; height:100%; width:62%; object-fit:cover; display:block;
    object-position:55% 15%; opacity:0.45;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, black 50%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, black 50%, black 100%);
  }
  .pt-hp1 {
    position:absolute; top:0; right:0; height:100%; width:44%; object-fit:cover; display:block;
    object-position:52% 10%; opacity:0.38;
    -webkit-mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 20%, black 48%, black 100%);
    mask-image:linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 20%, black 48%, black 100%);
  }
  .pt-hp-btm {
    position:absolute; bottom:0; left:0; right:0; height:200px;
    background:linear-gradient(to bottom, transparent 0%, rgba(235,241,250,0.97) 100%);
  }
  .pt-hero-overlay {
    position:absolute; inset:0; z-index:2; pointer-events:none;
    background:linear-gradient(to right,
      rgba(235,241,250,0.97) 0%, rgba(235,241,250,0.93) 30%,
      rgba(235,241,250,0.78) 50%, rgba(235,241,250,0.50) 64%,
      rgba(235,241,250,0.18) 80%, transparent 92%);
  }

  .pt-hero-inner { position:relative; z-index:3; max-width:1100px; margin:0 auto; text-align:center; }
  .pt-hero-tag {
    display:inline-block;
    background:rgba(0,74,153,0.08); border:1px solid rgba(0,74,153,0.22);
    color:var(--jade); padding:6px 18px; border-radius:999px;
    font-size:0.75rem; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:24px;
  }
  .pt-hero h1 { font-size:clamp(2rem,4.5vw,3rem); margin-bottom:18px; color:var(--text); }
  .pt-hero h1 span { color:var(--jade); }
  .pt-hero p  { font-size:1.05rem; color:rgba(15,32,53,0.72); max-width:600px; margin:0 auto 32px; line-height:1.7; }
  .pt-hero-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }

  /* Partner logos strip */
  .partner-strip {
    background:rgba(255,255,255,0.85); border-top:1px solid rgba(0,74,153,0.08);
    border-bottom:1px solid rgba(0,74,153,0.08); padding:28px 24px;
  }
  .partner-strip-inner { max-width:1100px; margin:0 auto; }
  .partner-strip h4 { text-align:center; font-size:0.75rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:24px; }
  .partner-logos { display:flex; gap:24px; justify-content:center; flex-wrap:wrap; align-items:center; }
  .partner-logo-badge {
    background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.15);
    border-radius:10px; padding:10px 22px; font-size:0.88rem; font-weight:700;
    color:var(--jade); letter-spacing:0.03em;
    transition: border-color 0.2s, background 0.2s;
  }
  .partner-logo-badge:hover { border-color:rgba(0,74,153,0.3); background:rgba(0,74,153,0.08); }

  /* Section commons */
  .pt-section { padding:64px 24px; }
  .pt-section-alt { background:rgba(255,255,255,0.02); }
  .pt-inner { max-width:1100px; margin:0 auto; }
  .pt-section-head { text-align:center; margin-bottom:48px; }
  .pt-section-head .tag { font-size:0.72rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; display:block; }
  .pt-section-head h2 { font-size:clamp(1.5rem,3vw,2.2rem); margin-bottom:12px; }
  .pt-section-head p  { color:var(--muted); max-width:560px; margin:0 auto; line-height:1.7; }

  /* Value proposition */
  .vp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
  .vp-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:16px; padding:24px;
    transition:border-color 0.2s, transform 0.2s;
  }
  .vp-card:hover { border-color:rgba(251,191,36,0.3); transform:translateY(-3px); }
  .vp-icon { font-size:2rem; margin-bottom:14px; }
  .vp-card h3 { font-size:1rem; margin-bottom:8px; }
  .vp-card p  { font-size:0.84rem; color:var(--muted); line-height:1.6; }

  /* How it works */
  .flow-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; position:relative; }
  .flow-step {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:16px; padding:24px; text-align:center;
    position:relative;
  }
  .flow-num {
    width:44px; height:44px; border-radius:50%;
    background:rgba(251,191,36,0.1); border:2px solid rgba(251,191,36,0.35);
    display:flex; align-items:center; justify-content:center;
    font-size:0.95rem; font-weight:700; color:var(--gold);
    margin:0 auto 16px;
  }
  .flow-step h4 { font-size:0.95rem; margin-bottom:8px; }
  .flow-step p  { font-size:0.82rem; color:var(--muted); line-height:1.5; }

  /* Partner portal preview */
  .portal-preview {
    display:grid; grid-template-columns:1fr 1fr; gap:28px;
    background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
    border-radius:20px; padding:32px; overflow:hidden;
  }
  @media(max-width:768px){ .portal-preview { grid-template-columns:1fr; } }

  .portal-preview h3 { font-size:1.05rem; margin-bottom:8px; color:var(--gold); }
  .portal-preview p  { font-size:0.84rem; color:var(--muted); line-height:1.6; margin-bottom:20px; }
  .preview-stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .prev-stat {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    border-radius:10px; padding:14px; text-align:center;
  }
  .prev-stat .val { font-size:1.4rem; font-weight:700; color:var(--gold); }
  .prev-stat .lab { font-size:0.72rem; color:var(--muted); margin-top:3px; }

  .referral-flow { display:flex; flex-direction:column; gap:12px; }
  .ref-step-row {
    display:flex; align-items:center; gap:12px; padding:12px 16px;
    background:rgba(255,255,255,0.04); border-radius:10px;
    border:1px solid rgba(255,255,255,0.07);
  }
  .ref-step-icon { font-size:1.2rem; flex-shrink:0; }
  .ref-step-text { font-size:0.84rem; color:var(--muted); line-height:1.4; }
  .ref-step-text strong { color:var(--text); }

  /* Onboarding form */
  .onboard-wrap {
    display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:start;
  }
  @media(max-width:768px){ .onboard-wrap { grid-template-columns:1fr; } }

  .onboard-info h3 { font-size:1.2rem; margin-bottom:14px; }
  .onboard-info p  { font-size:0.88rem; color:var(--muted); line-height:1.7; margin-bottom:24px; }
  .onboard-points { display:flex; flex-direction:column; gap:12px; }
  .onboard-point { display:flex; align-items:flex-start; gap:12px; font-size:0.85rem; }
  .onboard-point .chk { color:var(--gold); font-size:1rem; margin-top:1px; flex-shrink:0; }

  .onboard-form {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
    border-radius:20px; padding:32px;
  }
  .onboard-form h3 { font-size:1.1rem; margin-bottom:24px; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  @media(max-width:540px){ .form-row { grid-template-columns:1fr; } }
  .form-group { display:flex; flex-direction:column; gap:6px; }
  .form-group label { font-size:0.8rem; color:var(--muted); }
  .form-group.full { grid-column:1/-1; }
  .form-success {
    text-align:center; padding:32px 16px;
  }
  .form-success .icon { font-size:3.5rem; margin-bottom:16px; }
  .form-success h3 { font-size:1.2rem; margin-bottom:10px; }
  .form-success p  { font-size:0.87rem; color:var(--muted); }

  /* Testimonials */
  .testimonials-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:20px; }
  .testimonial-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:16px; padding:24px;
  }
  .test-quote { font-size:0.9rem; color:var(--text); line-height:1.7; margin-bottom:20px; font-style:italic; }
  .test-quote::before { content:'"'; font-size:2rem; color:var(--gold); line-height:0; vertical-align:-0.4em; margin-right:4px; }
  .test-author { display:flex; align-items:center; gap:12px; }
  .test-avatar {
    width:40px; height:40px; border-radius:50%;
    background:linear-gradient(135deg,var(--gold),var(--amber));
    display:flex; align-items:center; justify-content:center;
    font-weight:700; font-size:0.85rem; color:#1a1200; flex-shrink:0;
  }
  .test-name { font-size:0.88rem; font-weight:700; }
  .test-role { font-size:0.75rem; color:var(--muted); }

  /* CTA */
  .pt-cta {
    background:linear-gradient(135deg,rgba(232,213,168,0.08),rgba(168,0,64,0.05));
    border:1px solid rgba(251,191,36,0.2);
    border-radius:20px; padding:56px 32px; text-align:center;
  }
  .pt-cta h2 { font-size:clamp(1.6rem,3vw,2.2rem); margin-bottom:14px; }
  .pt-cta p  { color:var(--muted); max-width:500px; margin:0 auto 32px; }
  .pt-cta-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
`;

const VALUE_PROPS = [
  { icon: '🔗', title: 'Seamless Referrals', desc: 'Refer patients who need post-discharge home care directly through our platform. Track every referral in real time.' },
  { icon: '📊', title: 'Care Outcome Reports', desc: 'Receive structured reports on patient progress, HCA performance, and care continuity from our digital Cardex system.' },
  { icon: '🛡️', title: 'Vetted HCA Network', desc: 'All HCAs are identity-verified, certificate-validated, and quality-rated. You can be confident in who enters a patient\'s home.' },
  { icon: '📍', title: 'Location Intelligence', desc: 'Our matching engine surfaces HCAs nearest to the patient\'s home - reducing gaps and improving continuity of care.' },
  { icon: '📱', title: 'Digital Integration', desc: 'Discharge summaries, care plans, and medication lists can be shared directly with the placed HCA via our platform.' },
  { icon: '📞', title: 'Shared Care Team', desc: 'HCAs communicate incidents and observations through timestamped Cardex entries, creating a shared record for your clinical team.' },
];

const FLOW_STEPS = [
  { n: '01', title: 'Sign Partnership Agreement', desc: 'Complete our online partner onboarding form. Agreement is processed within 48 hours.' },
  { n: '02', title: 'Identify Patient for Referral', desc: 'Use the Partner Portal to submit a referral with patient details, care requirements, and urgency level.' },
  { n: '03', title: 'E-Vive Matches & Confirms', desc: 'Our coordination team matches a suitable, nearby HCA and confirms placement within 24 hours.' },
  { n: '04', title: 'Care Begins', desc: 'HCA commences with a verified digital Cardex. Shared care reports are available to your clinical team.' },
  { n: '05', title: 'Ongoing Reporting', desc: 'Receive regular care summaries, incident alerts, and outcome data for continued clinical oversight.' },
];

const TESTIMONIALS = [
  { quote: 'The referral process is seamless. We discharge patients knowing they have a vetted, qualified HCA waiting for them at home. The Cardex reports give us exactly the continuity data we need.', name: 'Dr. Amina Hassan', role: 'Head of Oncology, Aga Khan University Hospital', initials: 'AH' },
  { quote: 'Our palliative patients need specialised home care. E-Vive\'s matching algorithm identifies HCAs with exactly the right skills and proximity. It has transformed our discharge planning.', name: 'Dr. Patrick Mutua', role: 'Clinical Lead, MP Shah Hospital', initials: 'PM' },
  { quote: 'We used to struggle to find reliable HCAs for post-surgery patients. With E-Vive, we have a trusted pipeline and the digital reports mean our team stays informed throughout recovery.', name: 'Sr. Consolata Waweru', role: 'Nursing Director, Nairobi Hospital', initials: 'CW' },
];

const ORG_TYPES = ['Hospital','Clinic','Hospice','NGO / CBO','Insurance Provider','Corporate Wellness','Rehabilitation Centre','Other'];

export default function PartnersPage() {
  const [form, setForm] = useState({ org:'', type:'', contact:'', email:'', phone:'', patients:'', message:'' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* Hero */}
      <section className="pt-hero">
        <div className="pt-hero-photos" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pt-hp2" src="/images/hero-photo-2.jpg" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pt-hp1" src="/images/hero-photo-1.jpg" alt="" />
          <div className="pt-hp-btm" />
        </div>
        <div className="pt-hero-overlay" aria-hidden="true" />
        <div className="pt-hero-inner">
          <div className="pt-hero-tag">Healthcare Partner Portal</div>
          <h1>Extend Your Care <span>Beyond the Ward</span></h1>
          <p>Partner with E-Vive to provide your patients with seamless, vetted home care after discharge. Structured referrals, digital reporting, and a network of 850+ qualified HCAs across 47 sub-counties.</p>
          <div className="pt-hero-btns">
            <button className="btn-a" onClick={() => document.getElementById('onboard').scrollIntoView({ behavior:'smooth' })}>Become a Partner →</button>
            <button className="btn-o" onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior:'smooth' })}>How It Works</button>
          </div>
        </div>
      </section>

      {/* Partner logos */}
      <div className="partner-strip">
        <div className="partner-strip-inner">
          <h4>Trusted by leading healthcare providers</h4>
          <div className="partner-logos">
            {['Aga Khan Hospital','MP Shah Hospital','Nairobi Hospital','Karen Hospital','Kenyatta National Hospital','Gertrude\'s Children\'s','Mater Hospital','AAR Healthcare'].map(p => (
              <div className="partner-logo-badge" key={p}>{p}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Value proposition */}
      <section className="pt-section">
        <div className="pt-inner">
          <div className="pt-section-head">
            <span className="tag">Why Partner</span>
            <h2>Better Outcomes Begin at Home</h2>
            <p>Home recovery reduces readmissions, improves patient wellbeing, and frees hospital beds. We make high-quality home care accessible and accountable.</p>
          </div>
          <div className="vp-grid">
            {VALUE_PROPS.map(v => (
              <div className="vp-card" key={v.title}>
                <div className="vp-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pt-section pt-section-alt" id="how-it-works">
        <div className="pt-inner">
          <div className="pt-section-head">
            <span className="tag">Referral Workflow</span>
            <h2>How the Partnership Works</h2>
            <p>A structured, transparent process from referral to ongoing care.</p>
          </div>
          <div className="flow-grid">
            {FLOW_STEPS.map(s => (
              <div className="flow-step" key={s.n}>
                <div className="flow-num">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal preview */}
      <section className="pt-section">
        <div className="pt-inner">
          <div className="pt-section-head">
            <span className="tag">Partner Dashboard</span>
            <h2>Your Portal at a Glance</h2>
            <p>A dedicated portal to manage referrals, track placed patients, and access care reports - all in one place.</p>
          </div>
          <div className="portal-preview">
            <div>
              <h3>Referral & Placement Overview</h3>
              <p>See all active patients, pending referrals, and care outcomes from your institution in a single dashboard.</p>
              <div className="preview-stat-grid">
                <div className="prev-stat"><div className="val">34</div><div className="lab">Active home care patients</div></div>
                <div className="prev-stat"><div className="val">8</div><div className="lab">Pending placements</div></div>
                <div className="prev-stat"><div className="val">97%</div><div className="lab">Placement rate</div></div>
                <div className="prev-stat"><div className="val">4.8★</div><div className="lab">Avg. HCA rating</div></div>
              </div>
            </div>
            <div>
              <h3>Digital Referral Flow</h3>
              <p>Submit structured referrals in 3 minutes. Our team handles matching and confirmation.</p>
              <div className="referral-flow">
                {[
                  ['📋','Discharge summary shared with E-Vive'],
                  ['🔍','Patient matched to nearest qualified HCA'],
                  ['📞','Coordinator calls family to confirm'],
                  ['✅','HCA placed - care begins within 24 hrs'],
                  ['📊','Weekly Cardex summaries sent to clinical team'],
                ].map(([icon,text]) => (
                  <div className="ref-step-row" key={text}>
                    <div className="ref-step-icon">{icon}</div>
                    <div className="ref-step-text">{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="pt-section pt-section-alt">
        <div className="pt-inner">
          <div className="pt-section-head">
            <span className="tag">Partner Voices</span>
            <h2>What Our Partners Say</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="test-quote">{t.quote}</div>
                <div className="test-author">
                  <div className="test-avatar">{t.initials}</div>
                  <div>
                    <div className="test-name">{t.name}</div>
                    <div className="test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding form */}
      <section className="pt-section" id="onboard">
        <div className="pt-inner">
          <div className="onboard-wrap">
            <div className="onboard-info">
              <h3>Ready to Partner with E-Vive?</h3>
              <p>Fill in the form and our partnerships team will reach out within one business day to walk you through the agreement and portal setup.</p>
              <div className="onboard-points">
                {[
                  'Free to join - no setup fees',
                  'Partnership agreement signed digitally',
                  'Dedicated coordinator assigned to your institution',
                  'Staff training session on referral workflow',
                  'Portal access within 48 hours of sign-up',
                  'Monthly care outcome reports for your team',
                ].map(pt => (
                  <div className="onboard-point" key={pt}>
                    <div className="chk">✓</div>
                    <div>{pt}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="onboard-form">
              {submitted ? (
                <div className="form-success">
                  <div className="icon">🤝</div>
                  <h3>Application Received</h3>
                  <p>Thank you! Our partnerships team will contact you within one business day to discuss next steps.</p>
                </div>
              ) : (
                <>
                  <h3>Partner Onboarding Form</h3>
                  <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Organisation Name *</label>
                        <input className="input" required placeholder="e.g. Aga Khan Hospital" value={form.org} onChange={e => setForm(p=>({...p,org:e.target.value}))} />
                      </div>
                      <div className="form-group">
                        <label>Organisation Type *</label>
                        <select className="input" required value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
                          <option value="">Select type</option>
                          {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Contact Person *</label>
                        <input className="input" required placeholder="Full name & title" value={form.contact} onChange={e => setForm(p=>({...p,contact:e.target.value}))} />
                      </div>
                      <div className="form-group">
                        <label>Work Email *</label>
                        <input className="input" type="email" required placeholder="hello@e-vive.co.ke" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input className="input" required placeholder="+254 7XX XXX XXX" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} />
                      </div>
                      <div className="form-group">
                        <label>Monthly Discharge Volume (approx.)</label>
                        <input className="input" placeholder="e.g. 50–100 patients" value={form.patients} onChange={e => setForm(p=>({...p,patients:e.target.value}))} />
                      </div>
                    </div>
                    <div className="form-group form-row">
                      <div className="form-group full">
                        <label>Message (optional)</label>
                        <textarea className="input" rows={3} placeholder="Any specific requirements or questions..." value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))} style={{ resize:'vertical' }} />
                      </div>
                    </div>
                    <button type="submit" className="btn-a btn-full" style={{ marginTop:4 }}>Submit Partnership Application →</button>
                    <p style={{ fontSize:'0.75rem', color:'var(--muted)', textAlign:'center' }}>Your information is kept strictly confidential and used only for partnership processing.</p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pt-section pt-section-alt">
        <div className="pt-inner">
          <div className="pt-cta">
            <h2>Questions Before You Join?</h2>
            <p>Our partnerships team is happy to walk you through the programme, answer clinical governance questions, or arrange a demo.</p>
            <div className="pt-cta-btns">
              <a href="mailto:hello@e-vive.co.ke" className="btn-a">Email Partnerships Team →</a>
              <Link href="/match" className="btn-o">Browse HCA Profiles</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
