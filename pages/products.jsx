import { useState } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  /* Hero */
  .prod-hero {
    background: linear-gradient(135deg, #0d0d1a 0%, #0c1228 50%, var(--forest) 100%);
    padding: 80px 24px 64px; position:relative; overflow:hidden; text-align:center;
  }
  .prod-hero::before {
    content:''; position:absolute; inset:0;
    background: radial-gradient(ellipse at 50% 30%, rgba(45,212,191,0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 80%, rgba(168,0,64,0.05) 0%, transparent 60%);
  }
  .prod-hero-inner { position:relative; max-width:680px; margin:0 auto; }

  .cs-badge {
    display:inline-flex; align-items:center; gap:8px;
    background:rgba(45,212,191,0.1); border:1px solid rgba(45,212,191,0.3);
    color:var(--teal); padding:8px 20px; border-radius:999px;
    font-size:0.75rem; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:28px;
  }
  .cs-dot {
    width:8px; height:8px; border-radius:50%; background:var(--teal);
    animation: pulse-teal 1.5s ease-in-out infinite;
  }
  @keyframes pulse-teal {
    0%,100% { box-shadow:0 0 0 0 rgba(45,212,191,0.4); }
    50%      { box-shadow:0 0 0 6px rgba(45,212,191,0); }
  }

  .prod-hero h1 { font-size:clamp(2rem,5vw,3.2rem); line-height:1.15; margin-bottom:18px; }
  .prod-hero h1 span { color:var(--teal); }
  .prod-hero p  { font-size:1.05rem; color:var(--muted); line-height:1.7; margin-bottom:36px; }

  /* Waitlist form */
  .waitlist-form {
    display:flex; gap:10px; max-width:460px; margin:0 auto 16px;
  }
  @media(max-width:540px){ .waitlist-form { flex-direction:column; } }
  .waitlist-form input { flex:1; }
  .wl-note { font-size:0.78rem; color:var(--muted); margin-top:8px; }
  .wl-count {
    display:inline-block; margin-top:16px;
    background:rgba(45,212,191,0.08); border:1px solid rgba(45,212,191,0.2);
    border-radius:999px; padding:6px 18px; font-size:0.82rem; color:var(--teal);
  }

  /* Section commons */
  .prod-section { padding:64px 24px; }
  .prod-section-alt { background:rgba(255,255,255,0.02); }
  .prod-inner { max-width:1100px; margin:0 auto; }
  .prod-section-head { text-align:center; margin-bottom:48px; }
  .prod-section-head .tag { font-size:0.72rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--teal); margin-bottom:12px; display:block; }
  .prod-section-head h2 { font-size:clamp(1.5rem,3vw,2.2rem); margin-bottom:12px; }
  .prod-section-head p  { color:var(--muted); max-width:560px; margin:0 auto; line-height:1.7; }

  /* Category teasers */
  .cat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:24px; }
  .cat-card {
    border-radius:20px; padding:28px; position:relative; overflow:hidden;
    border:1px solid rgba(255,255,255,0.08);
    transition:transform 0.25s, border-color 0.25s;
    cursor:default;
  }
  .cat-card:hover { transform:translateY(-4px); border-color:rgba(45,212,191,0.3); }
  .cat-card-bg {
    position:absolute; inset:0;
    background:rgba(255,255,255,0.04);
  }
  .cat-card-glow {
    position:absolute; top:-40px; right:-40px;
    width:140px; height:140px; border-radius:50%;
    opacity:0.12; filter:blur(30px);
  }
  .cat-card-inner { position:relative; }
  .cat-cs-badge {
    display:inline-block;
    background:rgba(45,212,191,0.12); border:1px solid rgba(45,212,191,0.25);
    color:var(--teal); font-size:0.68rem; padding:3px 10px; border-radius:999px;
    margin-bottom:20px; letter-spacing:0.06em;
  }
  .cat-icon { font-size:2.4rem; margin-bottom:16px; display:block; }
  .cat-card h3 { font-size:1.1rem; margin-bottom:8px; }
  .cat-card p  { font-size:0.84rem; color:var(--muted); line-height:1.6; margin-bottom:20px; }
  .cat-items { display:flex; flex-wrap:wrap; gap:6px; }
  .cat-item {
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
    border-radius:6px; padding:4px 10px; font-size:0.72rem; color:var(--muted);
  }

  /* Product cards (early preview) */
  .products-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
  .product-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:16px; overflow:hidden;
    transition:border-color 0.2s, transform 0.2s;
  }
  .product-card:hover { border-color:rgba(45,212,191,0.3); transform:translateY(-3px); }
  .product-img {
    height:140px; display:flex; align-items:center; justify-content:center;
    font-size:3.5rem; background:rgba(255,255,255,0.03);
    border-bottom:1px solid rgba(255,255,255,0.06);
  }
  .product-body { padding:18px; }
  .product-cat { font-size:0.7rem; color:var(--teal); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:6px; }
  .product-body h4 { font-size:0.92rem; margin-bottom:6px; }
  .product-body p  { font-size:0.8rem; color:var(--muted); line-height:1.5; margin-bottom:14px; }
  .product-footer { display:flex; justify-content:space-between; align-items:center; }
  .product-price { font-size:0.95rem; font-weight:700; color:var(--teal); }
  .product-price span { font-size:0.72rem; color:var(--muted); font-weight:400; }
  .notify-btn {
    background:rgba(45,212,191,0.1); border:1px solid rgba(45,212,191,0.25);
    color:var(--teal); padding:6px 14px; border-radius:8px; font-size:0.78rem;
    cursor:pointer; font-weight:600; transition:background 0.2s;
  }
  .notify-btn:hover { background:rgba(45,212,191,0.2); }

  /* Features */
  .features-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:20px; }
  .feature-card {
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    border-radius:14px; padding:22px;
  }
  .feature-icon { font-size:1.8rem; margin-bottom:12px; }
  .feature-card h4 { font-size:0.92rem; margin-bottom:6px; }
  .feature-card p  { font-size:0.82rem; color:var(--muted); line-height:1.6; }

  /* Timeline */
  .timeline { max-width:600px; margin:0 auto; display:flex; flex-direction:column; gap:0; }
  .tl-item { display:flex; gap:20px; }
  .tl-left { display:flex; flex-direction:column; align-items:center; }
  .tl-dot {
    width:16px; height:16px; border-radius:50%; flex-shrink:0; margin-top:3px;
  }
  .tl-dot.done  { background:var(--teal); }
  .tl-dot.next  { background:rgba(45,212,191,0.4); border:2px solid var(--teal); }
  .tl-dot.later { background:rgba(255,255,255,0.1); border:2px solid rgba(255,255,255,0.2); }
  .tl-line { flex:1; width:2px; background:rgba(255,255,255,0.08); margin:4px auto 0; }
  .tl-item:last-child .tl-line { display:none; }
  .tl-body { padding-bottom:28px; }
  .tl-quarter { font-size:0.72rem; color:var(--teal); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; }
  .tl-body h4 { font-size:0.95rem; margin-bottom:4px; }
  .tl-body p  { font-size:0.82rem; color:var(--muted); line-height:1.5; }

  /* Newsletter / CTA */
  .prod-cta {
    background:linear-gradient(135deg,rgba(45,212,191,0.08),rgba(168,0,64,0.05));
    border:1px solid rgba(45,212,191,0.2);
    border-radius:20px; padding:56px 32px; text-align:center;
  }
  .prod-cta h2 { font-size:clamp(1.5rem,3vw,2rem); margin-bottom:14px; }
  .prod-cta p  { color:var(--muted); max-width:480px; margin:0 auto 28px; }
  .prod-cta-form {
    display:flex; gap:10px; max-width:440px; margin:0 auto;
  }
  @media(max-width:520px){ .prod-cta-form { flex-direction:column; } }
`;

const CATEGORIES = [
  {
    icon: '🛏️', glowColor: '#2dd4bf', title: 'Mobility & Positioning Aids',
    desc: 'Hospital-grade equipment for safe repositioning, transfers, and daily mobility support at home.',
    items: ['Adjustable beds','Bed rails','Transfer belts','Slide sheets','Wheelchair cushions','Positioning wedges'],
  },
  {
    icon: '🩺', glowColor: '#34d399', title: 'Monitoring & Diagnostics',
    desc: 'Easy-to-use devices for tracking vitals, blood glucose, and oxygen saturation at home.',
    items: ['BP monitors','Pulse oximeters','Digital thermometers','Blood glucose meters','Weighing scales','Stethoscopes'],
  },
  {
    icon: '🚿', glowColor: '#60a5fa', title: 'Personal Care & Hygiene',
    desc: 'Dignity-preserving products for personal care, continence management, and bathing assistance.',
    items: ['Adult diapers','Bed baths','Shower chairs','Commodes','Skincare range','Oral hygiene kits'],
  },
  {
    icon: '💊', glowColor: '#f59e0b', title: 'Medication Management',
    desc: 'Tools to ensure safe, organised, and timely medication administration for complex regimens.',
    items: ['Pill organisers','Medication alarms','Liquid dispensers','Sharps containers','Insulin kits','Blister packs'],
  },
  {
    icon: '🍲', glowColor: '#a78bfa', title: 'Nutrition & Feeding Aids',
    desc: 'Specialised nutrition products and feeding equipment for patients with swallowing or appetite challenges.',
    items: ['Nutritional supplements','Thickening agents','Adaptive cutlery','Feeding tubes','High-calorie drinks','Sippy cups'],
  },
  {
    icon: '🧤', glowColor: '#f87171', title: 'Caregiver Supplies & PPE',
    desc: 'Professional-grade disposables and PPE to keep both caregiver and patient safe during care.',
    items: ['Gloves','Aprons','Masks','Wound dressing kits','Antiseptics','Disposal bags'],
  },
];

const SAMPLE_PRODUCTS = [
  { icon: '🩺', cat: 'Monitoring', name: 'Smart BP Monitor', desc: 'Bluetooth-enabled blood pressure monitor synced to the E-Vive Cardex system.', price: 'KES 4,500', priceSub: 'est.' },
  { icon: '🛏️', cat: 'Mobility', name: 'Adjustable Bed Rail', desc: 'Hospital-grade folding bed rail. Universal fit. Non-slip base. Easy clip installation.', price: 'KES 6,200', priceSub: 'est.' },
  { icon: '💊', cat: 'Medication', name: '7-Day Pill Organiser', desc: 'Large compartment weekly organiser with alarm reminders. Medication-safe plastic.', price: 'KES 850', priceSub: 'est.' },
  { icon: '🚿', cat: 'Personal Care', name: 'Shower Transfer Bench', desc: 'Adjustable-height bench for safe bathing. Non-slip feet. Max load 150 kg.', price: 'KES 8,800', priceSub: 'est.' },
  { icon: '🧤', cat: 'PPE', name: 'Care Starter Pack', desc: '50 nitrile gloves, 10 aprons, 20 masks, and 2 wound dressing kits. 1-month supply.', price: 'KES 1,200', priceSub: 'est.' },
  { icon: '🍲', cat: 'Nutrition', name: 'Resource HP Supplement (12-pack)', desc: 'High-protein, high-calorie nutritional supplement. Chocolate and vanilla variants.', price: 'KES 3,600', priceSub: 'est.' },
  { icon: '📏', cat: 'Monitoring', name: 'Fingertip Pulse Oximeter', desc: 'Lightweight SpO₂ and heart rate monitor. Instant digital readout. Battery included.', price: 'KES 2,100', priceSub: 'est.' },
  { icon: '🛋️', cat: 'Mobility', name: 'Memory Foam Positioning Wedge', desc: 'Medical-grade wedge for pressure relief and correct positioning. Washable cover.', price: 'KES 5,400', priceSub: 'est.' },
];

const FEATURES = [
  { icon: '🔗', title: 'HCA-Linked Ordering', desc: 'HCAs can recommend and order supplies directly through the platform, charged to the client account.' },
  { icon: '🚚', title: 'Same-Day Nairobi Delivery', desc: 'Orders placed before 12 noon delivered to Nairobi addresses the same day. Nationwide in 2–3 days.' },
  { icon: '📦', title: 'Subscription Bundles', desc: 'Monthly care bundles tailored to the patient\'s condition - automatically replenished so caregivers never run out.' },
  { icon: '✅', title: 'Clinically Vetted', desc: 'All products are reviewed by our clinical team and sourced from registered suppliers. No counterfeit risk.' },
];

const TIMELINE = [
  { q: 'Q2 2026', title: 'Beta launch - Nairobi', desc: 'Select range of monitoring and mobility products available to E-Vive platform clients and HCAs.', state: 'next' },
  { q: 'Q3 2026', title: 'Full product range', desc: 'All six categories live, including personalised bundle builder and HCA ordering workflow.', state: 'later' },
  { q: 'Q4 2026', title: 'Nationwide delivery', desc: 'Expansion beyond Nairobi to all 47 counties via logistics partner network.', state: 'later' },
  { q: 'Q1 2027', title: 'Subscription model & insurance integration', desc: 'Recurring monthly bundles and NHIF/insurance-covered product categories.', state: 'later' },
];

export default function ProductsPage() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaJoined, setCtaJoined] = useState(false);
  const [notified, setNotified] = useState({});

  function handleWaitlist(e) {
    e.preventDefault();
    if (email.trim()) setJoined(true);
  }
  function handleCta(e) {
    e.preventDefault();
    if (ctaEmail.trim()) setCtaJoined(true);
  }
  function handleNotify(name) {
    setNotified(p => ({ ...p, [name]: true }));
  }

  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* Hero */}
      <section className="prod-hero">
        <div className="prod-hero-inner">
          <div className="cs-badge"><div className="cs-dot" />Coming Soon</div>
          <h1>Homecare Products, <span>Delivered to the Door</span></h1>
          <p>Everything your home care team needs - from monitoring devices and mobility aids to nutrition supplements and caregiver supplies - sourced, vetted, and delivered.</p>

          {!joined ? (
            <form className="waitlist-form" onSubmit={handleWaitlist}>
              <input className="input" type="email" required placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" className="btn-p">Join Waitlist →</button>
            </form>
          ) : (
            <div style={{ marginBottom:16 }}>
              <div className="wl-count">✅ You&apos;re on the waitlist! We&apos;ll notify you at launch.</div>
            </div>
          )}
          <div className="wl-note">Be first to know. No spam. Unsubscribe anytime.</div>
          <div className="wl-count">🧡 1,240+ people already on the waitlist</div>
        </div>
      </section>

      {/* Categories */}
      <section className="prod-section">
        <div className="prod-inner">
          <div className="prod-section-head">
            <span className="tag">Product Categories</span>
            <h2>Six Essential Categories</h2>
            <p>Curated to cover every aspect of professional home care. Products are clinically reviewed and sourced from registered suppliers.</p>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map(c => (
              <div className="cat-card" key={c.title}>
                <div className="cat-card-bg" />
                <div className="cat-card-glow" style={{ background: c.glowColor }} />
                <div className="cat-card-inner">
                  <div className="cat-cs-badge">Coming Soon</div>
                  <span className="cat-icon">{c.icon}</span>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <div className="cat-items">
                    {c.items.map(i => <div className="cat-item" key={i}>{i}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample products */}
      <section className="prod-section prod-section-alt">
        <div className="prod-inner">
          <div className="prod-section-head">
            <span className="tag">Early Preview</span>
            <h2>Sample Products</h2>
            <p>A snapshot of what will be available at launch. Click &quot;Notify Me&quot; to be first to purchase when that product goes live.</p>
          </div>
          <div className="products-grid">
            {SAMPLE_PRODUCTS.map(p => (
              <div className="product-card" key={p.name}>
                <div className="product-img">{p.icon}</div>
                <div className="product-body">
                  <div className="product-cat">{p.cat}</div>
                  <h4>{p.name}</h4>
                  <p>{p.desc}</p>
                  <div className="product-footer">
                    <div className="product-price">{p.price} <span>{p.priceSub}</span></div>
                    {notified[p.name] ? (
                      <span style={{ fontSize:'0.78rem', color:'var(--teal)' }}>✓ Notified</span>
                    ) : (
                      <button className="notify-btn" onClick={() => handleNotify(p.name)}>Notify Me</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="prod-section">
        <div className="prod-inner">
          <div className="prod-section-head">
            <span className="tag">Platform Integration</span>
            <h2>Built for Home Care Teams</h2>
            <p>The products portal is designed to work alongside the E-Vive platform - not as a standalone shop.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="prod-section prod-section-alt">
        <div className="prod-inner">
          <div className="prod-section-head">
            <span className="tag">Launch Roadmap</span>
            <h2>When to Expect It</h2>
            <p>We&apos;re building this carefully, starting with Nairobi and expanding nationwide.</p>
          </div>
          <div className="timeline">
            {TIMELINE.map(t => (
              <div className="tl-item" key={t.q}>
                <div className="tl-left">
                  <div className={`tl-dot ${t.state}`} />
                  <div className="tl-line" />
                </div>
                <div className="tl-body">
                  <div className="tl-quarter">{t.q}</div>
                  <h4>{t.title}</h4>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="prod-section">
        <div className="prod-inner">
          <div className="prod-cta">
            <h2>Be First When We Launch</h2>
            <p>Join the waitlist to get early access, launch discounts, and product announcements before anyone else.</p>
            {!ctaJoined ? (
              <form className="prod-cta-form" onSubmit={handleCta}>
                <input className="input" type="email" required placeholder="your@email.com" value={ctaEmail} onChange={e => setCtaEmail(e.target.value)} />
                <button type="submit" className="btn-p">Join Waitlist →</button>
              </form>
            ) : (
              <div style={{ color:'var(--teal)', fontWeight:700 }}>✅ You&apos;re on the list! We&apos;ll be in touch soon.</div>
            )}
            <p style={{ marginTop:20, marginBottom:0, fontSize:'0.8rem' }}>Meanwhile, <Link href="/match" style={{ color:'var(--teal)' }}>find a HomeCare Assistant</Link> or <Link href="/caregivers" style={{ color:'var(--teal)' }}>explore caregiver training</Link>.</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
