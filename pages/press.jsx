import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  .pr-hero {
    background: linear-gradient(150deg, var(--deep) 0%, #0c1228 55%, var(--forest) 100%);
    padding: 80px 5vw 64px; position: relative; overflow: hidden;
  }
  .pr-hero::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 20% 60%, rgba(168,0,64,0.08) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 25%, rgba(232,213,168,0.06) 0%, transparent 55%);
  }
  .pr-hero-inner { position: relative; max-width: 820px; margin: 0 auto; text-align: center; }
  .pr-hero h1 {
    font-family: var(--serif); font-size: clamp(2rem, 4.5vw, 3.2rem);
    line-height: 1.18; margin-bottom: 18px; font-weight: 700;
  }
  .pr-hero h1 em { font-style: italic; color: var(--mint); }
  .pr-hero p { font-size: 1.05rem; color: var(--muted); line-height: 1.72; max-width: 580px; margin: 0 auto 32px; }

  .pr-section { padding: 64px 5vw; }
  .pr-section-alt { background: rgba(255,255,255,0.02); }
  .pr-inner { max-width: 1100px; margin: 0 auto; }

  /* Media kit */
  .kit-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;
    margin-top: 32px;
  }
  .kit-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(168,0,64,0.14);
    border-radius: 16px; padding: 24px; text-align: center;
    transition: border-color 0.25s, transform 0.25s;
  }
  .kit-card:hover { border-color: rgba(168,0,64,0.35); transform: translateY(-3px); }
  .kit-icon { font-size: 2.2rem; margin-bottom: 12px; display: block; }
  .kit-card h3 { font-size: 0.95rem; margin-bottom: 6px; }
  .kit-card p  { font-size: 0.82rem; color: var(--muted); line-height: 1.55; margin-bottom: 16px; }
  .kit-btn {
    display: inline-block; padding: 7px 18px; border-radius: 100px;
    background: rgba(168,0,64,0.1); border: 1px solid rgba(168,0,64,0.25);
    color: var(--mint); font-size: 12px; font-weight: 600;
    text-decoration: none; transition: all 0.2s;
  }
  .kit-btn:hover { background: rgba(168,0,64,0.18); border-color: var(--mint); }

  /* Coverage */
  .coverage-list { display: flex; flex-direction: column; gap: 14px; margin-top: 32px; }
  .coverage-row {
    display: flex; align-items: flex-start; gap: 20px; padding: 20px 24px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; transition: border-color 0.2s;
  }
  .coverage-row:hover { border-color: rgba(168,0,64,0.25); }
  .coverage-pub {
    font-size: 0.72rem; font-family: var(--mono); letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--amber); font-weight: 700;
    min-width: 120px; margin-top: 3px;
  }
  .coverage-content { flex: 1; }
  .coverage-content h4 { font-size: 0.95rem; margin-bottom: 5px; }
  .coverage-content p  { font-size: 0.82rem; color: var(--muted); line-height: 1.55; }
  .coverage-date { font-size: 0.75rem; color: var(--muted); font-family: var(--mono); white-space: nowrap; margin-top: 3px; }

  /* Quotes */
  .quote-strip {
    background: linear-gradient(135deg, rgba(107,0,40,0.08), rgba(232,213,168,0.05));
    border: 1px solid rgba(168,0,64,0.15); border-radius: 20px;
    padding: 48px 40px; margin-top: 32px;
  }
  .quote-strip blockquote {
    font-family: var(--serif); font-size: clamp(1.1rem, 2.5vw, 1.5rem);
    font-style: italic; line-height: 1.65; color: var(--text);
    border-left: 3px solid var(--mint); padding-left: 24px; margin: 0 0 16px;
  }
  .quote-strip .attr { font-size: 0.85rem; color: var(--muted); padding-left: 27px; }

  /* Contact card */
  .press-contact-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 32px;
  }
  @media(max-width: 640px) { .press-contact-grid { grid-template-columns: 1fr; } }
  .press-contact-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 24px;
  }
  .press-contact-card h4 { font-size: 0.78rem; font-family: var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--mint); margin-bottom: 12px; }
  .press-contact-card p  { font-size: 0.88rem; color: var(--muted); line-height: 1.6; margin-bottom: 8px; }
  .press-contact-card a  { color: var(--text); text-decoration: none; font-weight: 500; }
  .press-contact-card a:hover { color: var(--mint); }

  /* Stats */
  .pr-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; margin-top: 32px; }
  .pr-stat { text-align: center; padding: 24px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; }
  .pr-stat .val { font-family: var(--serif); font-size: 2rem; font-weight: 700; color: var(--mint); display: block; margin-bottom: 6px; }
  .pr-stat .val.gold { color: var(--amber); }
  .pr-stat .lab { font-size: 0.8rem; color: var(--muted); line-height: 1.4; }
`;

const COVERAGE = [
  { pub: 'Business Daily', date: 'March 2025', title: 'E-Vive is redefining home care delivery in Kenya with technology-first matching', desc: 'How a platform born from personal experience is professionalising Kenya\'s fragmented home care sector.' },
  { pub: 'The Standard', date: 'January 2025', title: 'Meet the Kenyan startup turning home care into a structured, safe profession', desc: 'E-Vive\'s GPS-verified Cardex and nationwide HCA network are changing what families can expect at home.' },
  { pub: 'Nation Africa', date: 'November 2024', title: 'Kenya\'s digital care revolution: platforms placing verified HCAs in homes', desc: 'A deep dive into how technology startups are filling the gap left by the healthcare system at discharge.' },
  { pub: 'KBC Health', date: 'September 2024', title: 'Interview: Salome Mburu on founding E-Vive and caring for Kenya\'s elderly', desc: 'Founder Salome Mburu speaks about her father\'s illness, the inspiration behind the platform, and what comes next.' },
];

export default function PressPage() {
  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* Hero */}
      <section className="pr-hero">
        <div className="pr-hero-inner">
          <div className="stag" style={{ marginBottom: 20 }}>Newsroom</div>
          <h1>E-Vive in the <em>Press</em></h1>
          <p>News, media resources, and press contacts for journalists and media organisations covering E-Vive and Kenya&apos;s home care sector.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:press@evive.co.ke" className="btn-p">Contact Press Team →</a>
            <Link href="/about" className="btn-o">About E-Vive</Link>
          </div>
        </div>
      </section>

      {/* Key stats */}
      <section className="pr-section">
        <div className="pr-inner">
          <div className="ab-head center">
            <div className="stag">E-Vive by the Numbers</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">Platform at a Glance</h2>
            <div className="divider" style={{ margin: '0 auto 14px' }} />
          </div>
          <div className="pr-stats">
            {[
              { val: '850+', cls: '', lab: 'Verified HCAs' },
              { val: '2,400+', cls: '', lab: 'Families supported' },
              { val: '47', cls: 'gold', lab: 'Sub-counties covered' },
              { val: '18,000+', cls: '', lab: 'Shifts completed' },
              { val: '4.8★', cls: 'gold', lab: 'Average care rating' },
              { val: '2021', cls: '', lab: 'Year founded' },
            ].map(s => (
              <div className="pr-stat" key={s.lab}>
                <span className={`val ${s.cls}`}>{s.val}</span>
                <span className="lab">{s.lab}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder quote */}
      <section className="pr-section pr-section-alt">
        <div className="pr-inner">
          <div className="ab-head">
            <div className="stag">Founder&apos;s Voice</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">In Her Own Words</h2>
            <div className="divider" />
          </div>
          <div className="quote-strip">
            <blockquote>
              &ldquo;When my father needed care at home, I couldn&apos;t find a system that worked for us. I built E-Vive so that no family has to go through what we went through — alone, overwhelmed, and without support. Kenya&apos;s families deserve better, and Kenya&apos;s carers deserve to be seen as the professionals they are.&rdquo;
            </blockquote>
            <div className="attr">— Salome Mburu, Founder &amp; CEO, E-Vive · Nairobi, Kenya</div>
          </div>
        </div>
      </section>

      {/* Recent coverage */}
      <section className="pr-section">
        <div className="pr-inner">
          <div className="ab-head">
            <div className="stag">Media Coverage</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">Recent Press</h2>
            <div className="divider" />
          </div>
          <div className="coverage-list">
            {COVERAGE.map(c => (
              <div className="coverage-row" key={c.title}>
                <div>
                  <div className="coverage-pub">{c.pub}</div>
                  <div className="coverage-date">{c.date}</div>
                </div>
                <div className="coverage-content">
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media kit */}
      <section className="pr-section pr-section-alt">
        <div className="pr-inner">
          <div className="ab-head center">
            <div className="stag">Resources</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">Media Kit</h2>
            <div className="divider" style={{ margin: '0 auto 14px' }} />
            <p className="ssub">Download official assets for editorial use. All assets are provided under E-Vive&apos;s press licence.</p>
          </div>
          <div className="kit-grid">
            {[
              { icon: '🖼️', title: 'Logo Pack', desc: 'SVG and PNG logos in light, dark, and full-colour variants for all backgrounds.', btn: 'Download' },
              { icon: '📸', title: 'Brand Photography', desc: 'High-resolution images of HCAs, families, and the platform in action.', btn: 'Download' },
              { icon: '📄', title: 'Fact Sheet', desc: 'One-page summary of E-Vive\'s mission, figures, and key milestones. Updated March 2025.', btn: 'Download' },
              { icon: '🎥', title: 'Founder Interview', desc: 'Video interview with Salome Mburu discussing E-Vive\'s founding story and vision.', btn: 'Request' },
            ].map(k => (
              <div className="kit-card" key={k.title}>
                <span className="kit-icon">{k.icon}</span>
                <h3>{k.title}</h3>
                <p>{k.desc}</p>
                <a href="mailto:press@evive.co.ke" className="kit-btn">{k.btn} →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press contacts */}
      <section className="pr-section">
        <div className="pr-inner">
          <div className="ab-head">
            <div className="stag">Press Contacts</div>
            <div style={{ height: 12 }} />
            <h2 className="stitle">Get in Touch</h2>
            <div className="divider" />
          </div>
          <div className="press-contact-grid">
            <div className="press-contact-card">
              <h4>Media &amp; Press Enquiries</h4>
              <p>For interview requests, editorial coverage, and media partnerships.</p>
              <p>Email: <a href="mailto:press@evive.co.ke">press@evive.co.ke</a></p>
              <p>Phone: <a href="tel:+254720053455">+254 720 053 455</a></p>
              <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--muted)' }}>Response time: within 4 business hours</p>
            </div>
            <div className="press-contact-card">
              <h4>General &amp; Partnership Enquiries</h4>
              <p>For non-press enquiries, partnerships, and community engagement.</p>
              <p>Email: <a href="mailto:hello@evive.co.ke">hello@evive.co.ke</a></p>
              <p>Address: KARM Apts, Mararo Lane, off Riara Road, Nairobi, Kenya</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
