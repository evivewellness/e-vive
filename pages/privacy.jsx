import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  .legal-hero {
    background: linear-gradient(150deg, var(--deep) 0%, #0c1228 60%, var(--forest) 100%);
    padding: 72px 5vw 56px; text-align: center; position: relative;
  }
  .legal-hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 60%, rgba(168,0,64,0.07) 0%, transparent 60%);
  }
  .legal-hero-inner { position: relative; max-width: 680px; margin: 0 auto; }
  .legal-hero h1 {
    font-family: var(--serif); font-size: clamp(1.8rem, 4vw, 2.8rem);
    line-height: 1.2; margin-bottom: 14px; font-weight: 700;
  }
  .legal-hero p { font-size: 0.95rem; color: var(--muted); line-height: 1.7; }
  .legal-updated {
    display: inline-block; margin-top: 14px; padding: 5px 14px;
    background: rgba(232,213,168,0.1); border: 1px solid rgba(200,149,42,0.22);
    border-radius: 100px; font-size: 0.78rem; color: var(--amber); font-family: var(--mono);
  }

  .legal-wrap { max-width: 780px; margin: 0 auto; padding: 56px 5vw 80px; }

  .legal-toc {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(168,0,64,0.14);
    border-radius: 16px; padding: 24px 28px; margin-bottom: 48px;
  }
  .legal-toc h3 { font-size: 0.78rem; font-family: var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--mint); margin-bottom: 14px; }
  .legal-toc ol { padding-left: 18px; display: flex; flex-direction: column; gap: 7px; }
  .legal-toc a { font-size: 0.88rem; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .legal-toc a:hover { color: var(--mint); }

  .legal-sec { margin-bottom: 48px; }
  .legal-sec h2 {
    font-family: var(--serif); font-size: 1.3rem; font-weight: 700;
    margin-bottom: 16px; padding-bottom: 12px;
    border-bottom: 1px solid rgba(168,0,64,0.12);
  }
  .legal-sec p { font-size: 0.9rem; color: var(--muted); line-height: 1.8; margin-bottom: 14px; }
  .legal-sec p:last-child { margin-bottom: 0; }
  .legal-sec ul { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
  .legal-sec li { font-size: 0.9rem; color: var(--muted); line-height: 1.7; }
  .legal-sec strong { color: var(--text); }
  .legal-sec a { color: var(--mint); text-decoration: none; }
  .legal-sec a:hover { text-decoration: underline; }

  .legal-highlight {
    background: rgba(168,0,64,0.06); border: 1px solid rgba(168,0,64,0.18);
    border-radius: 12px; padding: 16px 20px; margin: 20px 0;
    font-size: 0.88rem; color: var(--muted); line-height: 1.7;
  }
  .legal-highlight strong { color: var(--mint); }
`;

export default function PrivacyPage() {
  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      <section className="legal-hero">
        <div className="legal-hero-inner">
          <div className="stag" style={{ marginBottom: 16 }}>Legal</div>
          <h1>Privacy Policy</h1>
          <p>How E-Vive collects, uses, and protects your personal information.</p>
          <div className="legal-updated">Last updated: 1 January 2025</div>
        </div>
      </section>

      <div className="legal-wrap">
        <div className="legal-toc">
          <h3>Contents</h3>
          <ol>
            <li><a href="#who">1. Who We Are</a></li>
            <li><a href="#data-collect">2. Data We Collect</a></li>
            <li><a href="#how-use">3. How We Use Your Data</a></li>
            <li><a href="#sharing">4. Sharing Your Data</a></li>
            <li><a href="#retention">5. Data Retention</a></li>
            <li><a href="#rights">6. Your Rights</a></li>
            <li><a href="#cookies">7. Cookies &amp; Tracking</a></li>
            <li><a href="#security">8. Security</a></li>
            <li><a href="#children">9. Children&apos;s Privacy</a></li>
            <li><a href="#changes">10. Changes to This Policy</a></li>
            <li><a href="#contact">11. Contact Us</a></li>
          </ol>
        </div>

        <div className="legal-sec" id="who">
          <h2>1. Who We Are</h2>
          <p>E-Vive is operated by <strong>Star Delight Enterprises Ltd</strong>, a company registered in Kenya (the <strong>&ldquo;Company&rdquo;</strong>, <strong>&ldquo;we&rdquo;</strong>, <strong>&ldquo;us&rdquo;</strong>, or <strong>&ldquo;our&rdquo;</strong>). Our registered office is at KARM Apts, Mararo Lane, off Riara Road, Nairobi, Kenya.</p>
          <p>E-Vive is a location-based homecare matching platform that connects families and individuals (&ldquo;Clients&rdquo;) with verified HomeCare Assistants (&ldquo;HCAs&rdquo;). We are the data controller for personal data processed through our platform and website at <strong>evive.co.ke</strong>.</p>
        </div>

        <div className="legal-sec" id="data-collect">
          <h2>2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul>
            <li><strong>Identity data:</strong> full name, date of birth, national ID number, passport (for international travel-enabled HCAs), profile photograph.</li>
            <li><strong>Contact data:</strong> mobile phone number, email address, physical address, sub-county.</li>
            <li><strong>Health data:</strong> patient care requirements, medical conditions relevant to care planning, medication schedules (entered into the Cardex by HCAs with client consent).</li>
            <li><strong>Employment data (HCAs):</strong> professional certificates, training records, employment history, references, DBS/police clearance certificate.</li>
            <li><strong>Location data:</strong> GPS clock-in and clock-out coordinates, shift location history.</li>
            <li><strong>Financial data:</strong> M-Pesa phone number for payroll; invoice and payment records.</li>
            <li><strong>Usage data:</strong> pages visited, features used, device type, browser, IP address.</li>
          </ul>
          <div className="legal-highlight">
            <strong>Special category data:</strong> Health information about patients is processed under Article 9 of the Kenya Data Protection Act 2019, on the basis of explicit consent and the vital interests of the data subject. This data is encrypted and access-controlled to authorised parties only.
          </div>
        </div>

        <div className="legal-sec" id="how-use">
          <h2>3. How We Use Your Data</h2>
          <p>We use personal data for the following purposes:</p>
          <ul>
            <li>To match Clients with suitable, verified HCAs in their area.</li>
            <li>To verify HCA qualifications, identity, and criminal record status.</li>
            <li>To facilitate the digital Cardex — the shift record updated by HCAs and shared with families.</li>
            <li>To process payments and maintain financial records.</li>
            <li>To communicate with you about placements, schedules, and platform updates.</li>
            <li>To ensure the safety and quality of care through GPS verification and incident reporting.</li>
            <li>To comply with our legal obligations under Kenyan law.</li>
            <li>To improve our platform through anonymised, aggregated usage analytics.</li>
          </ul>
          <p>We do not use your data for automated decision-making or profiling that produces significant legal effects without human review.</p>
        </div>

        <div className="legal-sec" id="sharing">
          <h2>4. Sharing Your Data</h2>
          <p>We share personal data only where necessary:</p>
          <ul>
            <li><strong>Between Clients and HCAs:</strong> Name, contact details, and care requirements are shared to facilitate the placement and ongoing care relationship.</li>
            <li><strong>Service providers:</strong> We use Supabase (database hosting), Vercel (web hosting), and M-Pesa (payments). All processors are contractually bound to protect your data.</li>
            <li><strong>Legal obligations:</strong> We may disclose data to regulatory or law enforcement authorities if required by Kenyan law or court order.</li>
          </ul>
          <p>We do not sell personal data to third parties. We do not share data with advertisers.</p>
        </div>

        <div className="legal-sec" id="retention">
          <h2>5. Data Retention</h2>
          <p>We retain personal data for the following periods:</p>
          <ul>
            <li><strong>Active accounts:</strong> for the duration of the active placement or account relationship.</li>
            <li><strong>Cardex records:</strong> 7 years from the date of the last entry, to comply with Kenyan healthcare documentation standards.</li>
            <li><strong>Financial records:</strong> 7 years, as required by the Kenya Revenue Authority.</li>
            <li><strong>Inactive accounts:</strong> 2 years from last login, after which data is anonymised or deleted.</li>
          </ul>
        </div>

        <div className="legal-sec" id="rights">
          <h2>6. Your Rights</h2>
          <p>Under the Kenya Data Protection Act 2019, you have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal data we hold about you.</li>
            <li><strong>Correct</strong> inaccurate or incomplete data.</li>
            <li><strong>Delete</strong> your data (subject to retention obligations).</li>
            <li><strong>Object</strong> to processing where we rely on legitimate interests.</li>
            <li><strong>Withdraw consent</strong> for any processing based solely on your consent.</li>
            <li><strong>Data portability</strong> — receive your data in a machine-readable format.</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href="mailto:privacy@evive.co.ke">privacy@evive.co.ke</a>. We will respond within 21 days as required by law.</p>
        </div>

        <div className="legal-sec" id="cookies">
          <h2>7. Cookies &amp; Tracking</h2>
          <p>We use essential cookies to maintain your session and platform preferences. We do not use third-party advertising cookies. Analytics cookies (where used) are anonymised and can be disabled in your browser settings.</p>
          <p>Local storage is used on the HCA dashboard to maintain session state. This data does not leave your device and is cleared on logout.</p>
        </div>

        <div className="legal-sec" id="security">
          <h2>8. Security</h2>
          <p>We implement industry-standard technical and organisational measures to protect your data, including TLS encryption in transit, AES-256 encryption at rest, row-level security on our database, and access controls limiting who can view sensitive patient data.</p>
          <p>In the event of a data breach that is likely to result in risk to your rights and freedoms, we will notify the Office of the Data Protection Commissioner and affected individuals within 72 hours of becoming aware of the breach.</p>
        </div>

        <div className="legal-sec" id="children">
          <h2>9. Children&apos;s Privacy</h2>
          <p>Our platform may process data relating to child patients where parents or guardians have engaged E-Vive for paediatric or child care services. In such cases, consent is obtained from the parent or legal guardian. We do not knowingly collect personal data from children under 18 for account registration without parental consent.</p>
        </div>

        <div className="legal-sec" id="changes">
          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Material changes will be communicated by email or a prominent notice on the platform. Your continued use of E-Vive after such notice constitutes acceptance of the updated policy.</p>
        </div>

        <div className="legal-sec" id="contact">
          <h2>11. Contact Us</h2>
          <p>For privacy-related enquiries, data subject requests, or to report a concern:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:privacy@evive.co.ke">privacy@evive.co.ke</a></li>
            <li><strong>Post:</strong> Data Protection Officer, Star Delight Enterprises Ltd, KARM Apts, Mararo Lane, off Riara Road, Nairobi, Kenya</li>
            <li><strong>Phone:</strong> <a href="tel:+254720053455">+254 720 053 455</a></li>
          </ul>
          <p>You also have the right to lodge a complaint with the <strong>Office of the Data Protection Commissioner of Kenya</strong> (odpc.go.ke) if you believe your rights have been infringed.</p>
        </div>
      </div>

      <Footer />
    </>
  );
}
