import { useState } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  /* Hero */
  .ct-hero {
    background: linear-gradient(150deg, var(--deep) 0%, #0c1228 55%, var(--forest) 100%);
    padding: 72px 5vw 56px; text-align: center; position: relative; overflow: hidden;
  }
  .ct-hero::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 25% 50%, rgba(168,0,64,0.07) 0%, transparent 55%),
      radial-gradient(ellipse at 75% 30%, rgba(56,189,248,0.05) 0%, transparent 55%);
  }
  .ct-hero-inner { position: relative; max-width: 640px; margin: 0 auto; }
  .ct-hero h1 {
    font-family: var(--serif); font-size: clamp(2rem, 4.5vw, 3rem);
    line-height: 1.18; margin-bottom: 16px; font-weight: 700;
  }
  .ct-hero h1 em { font-style: italic; color: var(--mint); }
  .ct-hero p { font-size: 1.05rem; color: var(--muted); line-height: 1.7; }

  /* Layout */
  .ct-section { padding: 64px 5vw; }
  .ct-section-alt { background: rgba(255,255,255,0.02); }
  .ct-inner { max-width: 1100px; margin: 0 auto; }

  /* Main grid: form + sidebar */
  .ct-main-grid {
    display: grid; grid-template-columns: 1fr 360px; gap: 40px; align-items: start;
  }
  @media(max-width: 860px) { .ct-main-grid { grid-template-columns: 1fr; } }

  /* Form card */
  .ct-form-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px; padding: 36px;
  }
  .ct-form-card h2 { font-family: var(--serif); font-size: 1.4rem; margin-bottom: 6px; }
  .ct-form-card .sub { font-size: 0.85rem; color: var(--muted); margin-bottom: 28px; line-height: 1.5; }

  .ct-form { display: flex; flex-direction: column; gap: 18px; }
  .ct-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media(max-width: 560px) { .ct-row { grid-template-columns: 1fr; } }
  .ct-field { display: flex; flex-direction: column; gap: 7px; }
  .ct-field label { font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.07em; text-transform: uppercase; color: var(--mint); font-weight: 600; }
  .ct-field input, .ct-field select, .ct-field textarea {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(168,0,64,0.2);
    border-radius: 10px; padding: 12px 15px; color: var(--text);
    font-family: var(--sans); font-size: 0.9rem; transition: all 0.22s; outline: none; width: 100%;
  }
  .ct-field input:focus, .ct-field select:focus, .ct-field textarea:focus {
    border-color: var(--mint); background: rgba(168,0,64,0.06);
    box-shadow: 0 0 0 3px rgba(168,0,64,0.1);
  }
  .ct-field select option { background: var(--forest); }
  .ct-field textarea { resize: vertical; min-height: 120px; line-height: 1.6; }
  .ct-field.full { grid-column: 1 / -1; }

  .ct-form-success {
    text-align: center; padding: 48px 24px;
  }
  .ct-form-success .icon { font-size: 3.5rem; margin-bottom: 18px; display: block; }
  .ct-form-success h3 { font-family: var(--serif); font-size: 1.4rem; margin-bottom: 10px; }
  .ct-form-success p  { font-size: 0.88rem; color: var(--muted); line-height: 1.6; }

  /* Sidebar */
  .ct-sidebar { display: flex; flex-direction: column; gap: 16px; }

  .ct-info-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 22px;
    transition: border-color 0.2s;
  }
  .ct-info-card:hover { border-color: rgba(168,0,64,0.25); }
  .ct-info-card h4 {
    font-size: 0.78rem; font-family: var(--mono); letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--mint); margin-bottom: 12px;
  }
  .ct-info-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
  .ct-info-row:last-child { margin-bottom: 0; }
  .ct-info-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
  .ct-info-text .label { font-size: 0.78rem; color: var(--muted); margin-bottom: 2px; }
  .ct-info-text .val   { font-size: 0.88rem; font-weight: 500; }
  .ct-info-text .val a { color: var(--text); text-decoration: none; }
  .ct-info-text .val a:hover { color: var(--mint); }

  .ct-hours-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ct-hour-row   { display: flex; flex-direction: column; gap: 2px; }
  .ct-hour-row .day  { font-size: 0.72rem; color: var(--muted); }
  .ct-hour-row .time { font-size: 0.85rem; font-weight: 500; }

  /* Department cards */
  .dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
  .dept-card {
    border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.08);
    transition: border-color 0.2s, transform 0.2s;
  }
  .dept-card:hover { transform: translateY(-3px); }
  .dept-icon { font-size: 1.8rem; margin-bottom: 12px; display: block; }
  .dept-card h3 { font-size: 0.95rem; margin-bottom: 6px; }
  .dept-card .dept-role { font-size: 0.78rem; margin-bottom: 10px; }
  .dept-card p  { font-size: 0.82rem; color: var(--muted); line-height: 1.55; margin-bottom: 14px; }
  .dept-contact { display: flex; flex-direction: column; gap: 5px; }
  .dept-contact a {
    font-size: 0.8rem; color: var(--muted); text-decoration: none;
    display: flex; align-items: center; gap: 6px; transition: color 0.2s;
  }
  .dept-contact a:hover { color: var(--text); }

  .dept-card.mint  { background: rgba(168,0,64,0.05);  border-color: rgba(168,0,64,0.15); }
  .dept-card.sky   { background: rgba(56,189,248,0.05);   border-color: rgba(56,189,248,0.15); }
  .dept-card.gold  { background: rgba(232,213,168,0.05);   border-color: rgba(200,149,42,0.15); }
  .dept-card.coral { background: rgba(249,112,102,0.05);  border-color: rgba(249,112,102,0.15); }
  .dept-card.mint  .dept-role { color: var(--mint); }
  .dept-card.sky   .dept-role { color: var(--sky); }
  .dept-card.gold  .dept-role { color: var(--amber); }
  .dept-card.coral .dept-role { color: var(--coral); }
  .dept-card.mint:hover  { border-color: rgba(168,0,64,0.35); }
  .dept-card.sky:hover   { border-color: rgba(56,189,248,0.35); }
  .dept-card.gold:hover  { border-color: rgba(232,213,168,0.35); }
  .dept-card.coral:hover { border-color: rgba(249,112,102,0.35); }

  /* FAQ strip */
  .faq-strip { display: flex; flex-direction: column; gap: 10px; }
  .faq-row {
    display: flex; align-items: center; gap: 14px; padding: 16px 20px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; cursor: pointer; transition: border-color 0.2s;
  }
  .faq-row:hover { border-color: rgba(168,0,64,0.3); }
  .faq-q-icon { font-size: 1rem; flex-shrink: 0; }
  .faq-q-text { flex: 1; font-size: 0.9rem; }
  .faq-q-arr  { font-size: 0.8rem; color: var(--muted); transition: transform 0.2s; }
  .faq-row:hover .faq-q-arr { color: var(--mint); transform: translateX(3px); }
  .faq-answer {
    padding: 0 20px 16px 50px; font-size: 0.85rem; color: var(--muted); line-height: 1.65;
  }

  /* Social row */
  .social-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
  .social-link {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 10px 16px; font-size: 0.83rem;
    color: var(--muted); text-decoration: none; transition: all 0.2s;
  }
  .social-link:hover { border-color: rgba(168,0,64,0.3); color: var(--text); background: rgba(168,0,64,0.06); }
  .social-icon { font-size: 1.1rem; }

  /* CTA */
  .ct-cta {
    background: linear-gradient(135deg, rgba(168,0,64,0.07), rgba(56,189,248,0.04));
    border: 1px solid rgba(168,0,64,0.18); border-radius: 20px;
    padding: 48px 40px; text-align: center;
  }
  .ct-cta h2 { font-family: var(--serif); font-size: clamp(1.4rem,3vw,2rem); margin-bottom: 12px; }
  .ct-cta p  { color: var(--muted); max-width: 480px; margin: 0 auto 28px; }
  .ct-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
`;

const SUBJECTS = [
  'General Enquiry',
  'Finding a HomeCare Assistant',
  'HCA Application / Subscription',
  'Client Account — Billing or Invoices',
  'Clinical or Care Quality Concern',
  'Healthcare Partner / Referral',
  'Counselling or Caregiver Support',
  'Media or Press Enquiry',
  'Feedback or Complaint',
  'Other',
];

const DEPTS = [
  { cls: 'mint', icon: '🏠', title: 'Client & Placement Team', role: 'Families & Clients', desc: 'Matching enquiries, placement coordination, account setup, and client journey support.', phone: '+254 700 100 200', email: 'families@evive.co.ke', hours: 'Mon–Sat, 7am–8pm' },
  { cls: 'sky',  icon: '👩‍⚕️', title: 'HCA Support & Welfare', role: 'HomeCare Assistants', desc: 'Application help, subscription queries, welfare concerns, off-day requests, and training access.', phone: '+254 700 100 201', email: 'hca@evive.co.ke', hours: 'Mon–Sat, 7am–8pm' },
  { cls: 'gold', icon: '🏥', title: 'Partnerships', role: 'Hospitals & Organisations', desc: 'Referral agreements, partner portal access, clinical governance, and institutional onboarding.', phone: '+254 720 053 455', email: 'partners@evive.co.ke', hours: 'Mon–Fri, 8am–5pm' },
  { cls: 'coral', icon: '💰', title: 'Finance & Billing', role: 'Invoices & Payroll', desc: 'Invoice queries, payment confirmation, M-Pesa issues, HCA payroll enquiries.', phone: '+254 700 100 203', email: 'finance@evive.co.ke', hours: 'Mon–Fri, 8am–5pm' },
];

const FAQS = [
  { q: 'How quickly can I get an HCA placed?', a: 'Urgent placements can be arranged within 24 hours. Standard placements follow the 8-step journey which typically takes 3–5 business days from account creation to first shift.' },
  { q: 'How do I pay for home care services?', a: 'We accept M-Pesa (Paybill 522600, Account: your invoice number) and bank transfer. Invoices are issued after the home visit and HCA matching confirmation.' },
  { q: 'What if I am unhappy with my assigned HCA?', a: 'Contact our Client Team immediately on +254 700 100 200. We will arrange a replacement HCA as quickly as possible and investigate any quality concerns.' },
  { q: 'I applied as an HCA — how long does verification take?', a: 'Verification of your ID, certificates, and references takes 2–3 business days. You will receive an SMS and email once your profile is approved.' },
  { q: 'Can a hospital refer a patient directly to E-Vive?', a: 'Yes. Partner hospitals submit referrals through our Partner Portal. If your hospital is not yet a partner, contact partners@evive.co.ke to start the onboarding process.' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ fname: '', lname: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* Hero */}
      <section className="ct-hero">
        <div className="ct-hero-inner">
          <div className="stag" style={{ marginBottom: 20 }}>We&apos;re Here to Help</div>
          <h1>Get in Touch with <em>E-Vive</em></h1>
          <p>Whether you have a question, need a placement, want to join as an HCA, or are a healthcare partner — our team typically responds within 2 hours during business hours.</p>
        </div>
      </section>

      {/* Main form + sidebar */}
      <section className="ct-section">
        <div className="ct-inner">
          <div className="ct-main-grid">

            {/* Form */}
            <div className="ct-form-card">
              {sent ? (
                <div className="ct-form-success">
                  <span className="icon">✅</span>
                  <h3>Message Received</h3>
                  <p>Thank you for reaching out. A member of our team will respond to <strong>{form.email}</strong> within 2 business hours.<br /><br />For urgent placement needs call <strong>+254 700 100 200</strong>.</p>
                  <button className="btn-o" style={{ marginTop: 24 }} onClick={() => { setSent(false); setForm({ fname:'',lname:'',email:'',phone:'',subject:'',message:'' }); }}>Send Another Message</button>
                </div>
              ) : (
                <>
                  <h2>Send Us a Message</h2>
                  <div className="sub">Fill in the form and we&apos;ll get back to you within 2 hours. For urgent placements, call us directly.</div>
                  <form className="ct-form" onSubmit={handleSubmit}>
                    <div className="ct-row">
                      <div className="ct-field">
                        <label>First Name *</label>
                        <input required placeholder="e.g. Wanjiku" value={form.fname} onChange={e => setForm(p => ({ ...p, fname: e.target.value }))} />
                      </div>
                      <div className="ct-field">
                        <label>Last Name *</label>
                        <input required placeholder="e.g. Mwangi" value={form.lname} onChange={e => setForm(p => ({ ...p, lname: e.target.value }))} />
                      </div>
                    </div>
                    <div className="ct-row">
                      <div className="ct-field">
                        <label>Email Address *</label>
                        <input type="email" required placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="ct-field">
                        <label>Phone Number</label>
                        <input type="tel" placeholder="+254 7XX XXX XXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                    <div className="ct-field">
                      <label>Subject *</label>
                      <select required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                        <option value="">Select a subject…</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="ct-field">
                      <label>Message *</label>
                      <textarea required placeholder="Tell us how we can help. The more detail you provide, the faster we can assist you." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
                    </div>
                    <button type="submit" className="btn-p btn-full" style={{ marginTop: 4 }}>Send Message →</button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center' }}>Your information is kept strictly confidential. We never share your details with third parties.</p>
                  </form>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="ct-sidebar">
              <div className="ct-info-card">
                <h4>Contact Details</h4>
                <div className="ct-info-row">
                  <div className="ct-info-icon">📞</div>
                  <div className="ct-info-text">
                    <div className="label">Main Line</div>
                    <div className="val"><a href="tel:+254700100200">+254 700 100 200</a></div>
                  </div>
                </div>
                <div className="ct-info-row">
                  <div className="ct-info-icon">📧</div>
                  <div className="ct-info-text">
                    <div className="label">General Enquiries</div>
                    <div className="val"><a href="mailto:hello@evive.co.ke">hello@evive.co.ke</a></div>
                  </div>
                </div>
                <div className="ct-info-row">
                  <div className="ct-info-icon">📍</div>
                  <div className="ct-info-text">
                    <div className="label">Head Office</div>
                    <div className="val">KARM Apts, Mararo Lane, off Riara Road, Nairobi, Kenya</div>
                  </div>
                </div>
                <div className="ct-info-row">
                  <div className="ct-info-icon">📬</div>
                  <div className="ct-info-text">
                    <div className="label">P.O. Box</div>
                    <div className="val">P.O. Box 12840 – 00100, Nairobi</div>
                  </div>
                </div>
              </div>

              <div className="ct-info-card">
                <h4>Office Hours</h4>
                <div className="ct-hours-grid">
                  {[
                    { day: 'Mon – Fri', time: '7:00 AM – 8:00 PM' },
                    { day: 'Saturday',  time: '7:00 AM – 6:00 PM' },
                    { day: 'Sunday',    time: '9:00 AM – 2:00 PM' },
                    { day: 'Emergency', time: '24/7 On Call' },
                  ].map(h => (
                    <div className="ct-hour-row" key={h.day}>
                      <span className="day">{h.day}</span>
                      <span className="time">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ct-info-card">
                <h4>Follow Us</h4>
                <div className="social-row">
                  {[
                    { icon: '𝕏', label: 'Twitter / X' },
                    { icon: 'f', label: 'Facebook' },
                    { icon: '📸', label: 'Instagram' },
                    { icon: 'in', label: 'LinkedIn' },
                    { icon: '▶', label: 'YouTube' },
                  ].map(s => (
                    <a href="#" className="social-link" key={s.label}>
                      <span className="social-icon">{s.icon}</span>
                      <span>{s.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Department contacts */}
      <section className="ct-section ct-section-alt">
        <div className="ct-inner">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="stag" style={{ marginBottom: 14 }}>Direct Lines</div>
            <h2 className="stitle">Reach the Right Team</h2>
            <div className="divider" style={{ margin: '0 auto 14px' }} />
            <p className="ssub">Each department has a dedicated line so you get to the right person fast.</p>
          </div>
          <div className="dept-grid">
            {DEPTS.map(d => (
              <div className={`dept-card ${d.cls}`} key={d.title}>
                <span className="dept-icon">{d.icon}</span>
                <h3>{d.title}</h3>
                <div className="dept-role">{d.role}</div>
                <p>{d.desc}</p>
                <div className="dept-contact">
                  <a href={`tel:${d.phone.replace(/\s/g, '')}`}><span>📞</span>{d.phone}</a>
                  <a href={`mailto:${d.email}`}><span>✉️</span>{d.email}</a>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>🕐 {d.hours}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="ct-section">
        <div className="ct-inner">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="stag" style={{ marginBottom: 14 }}>Quick Answers</div>
            <h2 className="stitle">Frequently Asked Questions</h2>
            <div className="divider" style={{ margin: '0 auto' }} />
          </div>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="faq-strip">
              {FAQS.map((f, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', borderColor: openFaq === i ? 'rgba(168,0,64,0.3)' : undefined }}>
                  <div className="faq-row" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="faq-q-icon">❓</span>
                    <span className="faq-q-text">{f.q}</span>
                    <span className="faq-q-arr" style={{ transform: openFaq === i ? 'rotate(90deg)' : 'none', color: openFaq === i ? 'var(--mint)' : undefined }}>›</span>
                  </div>
                  {openFaq === i && <div className="faq-answer">{f.a}</div>}
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.85rem', color: 'var(--muted)' }}>
              Still have questions? <Link href="/caregivers" style={{ color: 'var(--mint)' }}>Visit the Family Hub</Link> or email us at <a href="mailto:hello@evive.co.ke" style={{ color: 'var(--mint)' }}>hello@evive.co.ke</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ct-section ct-section-alt">
        <div className="ct-inner">
          <div className="ct-cta">
            <h2>Ready to Get Started?</h2>
            <p>You don&apos;t need to figure this out alone. Our care coordinators are ready to walk you through every step.</p>
            <div className="ct-cta-btns">
              <Link href="/match" className="btn-p">Find a Carer →</Link>
              <Link href="/client/register" className="btn-o">Create Client Account</Link>
              <Link href="/hca/apply" className="btn-sky">Apply as HCA</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
