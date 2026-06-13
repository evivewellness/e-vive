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
    background: radial-gradient(ellipse at 50% 60%, rgba(232,213,168,0.07) 0%, transparent 60%);
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
    background: rgba(255,255,255,0.04); border: 1px solid rgba(232,213,168,0.18);
    border-radius: 16px; padding: 24px 28px; margin-bottom: 48px;
  }
  .legal-toc h3 { font-size: 0.78rem; font-family: var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber); margin-bottom: 14px; }
  .legal-toc ol { padding-left: 18px; display: flex; flex-direction: column; gap: 7px; }
  .legal-toc a { font-size: 0.88rem; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .legal-toc a:hover { color: var(--amber); }

  .legal-sec { margin-bottom: 48px; }
  .legal-sec h2 {
    font-family: var(--serif); font-size: 1.3rem; font-weight: 700;
    margin-bottom: 16px; padding-bottom: 12px;
    border-bottom: 1px solid rgba(200,149,42,0.14);
  }
  .legal-sec p { font-size: 0.9rem; color: var(--muted); line-height: 1.8; margin-bottom: 14px; }
  .legal-sec p:last-child { margin-bottom: 0; }
  .legal-sec ul { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
  .legal-sec li { font-size: 0.9rem; color: var(--muted); line-height: 1.7; }
  .legal-sec strong { color: var(--text); }
  .legal-sec a { color: var(--mint); text-decoration: none; }
  .legal-sec a:hover { text-decoration: underline; }

  .legal-highlight {
    background: rgba(232,213,168,0.07); border: 1px solid rgba(232,213,168,0.2);
    border-radius: 12px; padding: 16px 20px; margin: 20px 0;
    font-size: 0.88rem; color: var(--muted); line-height: 1.7;
  }
  .legal-highlight strong { color: var(--amber); }
`;

export default function TermsPage() {
  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      <section className="legal-hero">
        <div className="legal-hero-inner">
          <div className="stag gold" style={{ marginBottom: 16 }}>Legal</div>
          <h1>Terms of Use</h1>
          <p>The rules and conditions that govern your use of the E-Vive platform, website, and services.</p>
          <div className="legal-updated">Last updated: June 2026</div>
        </div>
      </section>

      <div className="legal-wrap">
        <div className="legal-toc">
          <h3>Contents</h3>
          <ol>
            <li><a href="#agreement">1. Agreement to Terms</a></li>
            <li><a href="#platform">2. The E-Vive Platform</a></li>
            <li><a href="#accounts">3. Accounts &amp; Registration</a></li>
            <li><a href="#clients">4. Client Terms</a></li>
            <li><a href="#hcas">5. HCA Terms</a></li>
            <li><a href="#rates">6. Rates &amp; Payments</a></li>
            <li><a href="#conduct">7. Acceptable Use</a></li>
            <li><a href="#ip">8. Intellectual Property</a></li>
            <li><a href="#liability">9. Limitation of Liability</a></li>
            <li><a href="#termination">10. Termination</a></li>
            <li><a href="#noncompete">11. Non-Compete &amp; Non-Solicitation</a></li>
            <li><a href="#governing">12. Governing Law</a></li>
            <li><a href="#contact">13. Contact</a></li>
          </ol>
        </div>

        <div className="legal-sec" id="agreement">
          <h2>1. Agreement to Terms</h2>
          <p>By accessing or using the E-Vive platform, website, or any associated services (collectively, the <strong>&ldquo;Service&rdquo;</strong>), you agree to be bound by these Terms of Use (<strong>&ldquo;Terms&rdquo;</strong>). If you do not agree, you must not use the Service.</p>
          <p>These Terms constitute a legally binding agreement between you and <strong>Star Delight Enterprises</strong> (<strong>&ldquo;E-Vive&rdquo;</strong>, <strong>&ldquo;we&rdquo;</strong>, <strong>&ldquo;us&rdquo;</strong>), a company registered in Kenya with its principal office at Mugoya Phase 4, Nairobi, Kenya.</p>
        </div>

        <div className="legal-sec" id="platform">
          <h2>2. The E-Vive Platform</h2>
          <p>E-Vive is a technology-enabled homecare matching and management platform. We connect families and individuals (<strong>&ldquo;Clients&rdquo;</strong>) with vetted, trained HomeCare Assistants (<strong>&ldquo;HCAs&rdquo;</strong>). We also provide:</p>
          <ul>
            <li>A digital Cardex for HCAs to record patient vitals, medications, and care notes.</li>
            <li>GPS clock-in and shift management tools.</li>
            <li>A Family Hub with caregiver resources and training materials.</li>
            <li>Payroll and invoicing administration.</li>
          </ul>
          <div className="legal-highlight">
            <strong>Important:</strong> E-Vive is a platform operator, not a registered healthcare provider. We facilitate introductions between Clients and HCAs and provide management tools. Care decisions remain the responsibility of the HCA, the Client, and any supervising clinical professionals.
          </div>
        </div>

        <div className="legal-sec" id="accounts">
          <h2>3. Accounts &amp; Registration</h2>
          <p>To access certain features of the Service, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information during registration.</li>
            <li>Maintain the security of your login credentials and not share them with others.</li>
            <li>Notify E-Vive immediately at <a href="mailto:hello@e-vive.co.ke">hello@e-vive.co.ke</a> if you suspect unauthorised access to your account.</li>
            <li>Accept responsibility for all activity that occurs under your account.</li>
          </ul>
          <p>We reserve the right to suspend or terminate any account that we reasonably believe has been misused, is inactive, or violates these Terms.</p>
        </div>

        <div className="legal-sec" id="clients">
          <h2>4. Client Terms</h2>
          <p>As a Client, you agree to:</p>
          <ul>
            <li>Provide accurate information about the care recipient&apos;s needs, medical conditions, and living environment.</li>
            <li>Treat all HCAs with dignity and respect. Any abusive, discriminatory, or unsafe behaviour towards an HCA will result in immediate termination of the placement.</li>
            <li>Ensure the care environment is safe for the HCA to work in.</li>
            <li>Pay invoices by the agreed due date. Late payment may result in suspension of the placement.</li>
            <li>Give reasonable notice (minimum 48 hours) for cancellation of a placement, except in genuine emergency situations.</li>
            <li><strong>Non-solicitation obligation:</strong> You agree not to directly hire, contract, or engage in any private care arrangement with any HCA introduced to you through the E-Vive platform for a period of <strong>24 months</strong> after you cease to be an active E-Vive client or after the conclusion of any E-Vive-managed placement — whichever is later. This obligation applies regardless of how or where the engagement takes place.</li>
          </ul>
        </div>

        <div className="legal-sec" id="hcas">
          <h2>5. HCA Terms</h2>
          <p>As an HCA, you agree to:</p>
          <ul>
            <li>Maintain the accuracy of your profile, certificates, and availability information on the platform at all times.</li>
            <li>Attend all confirmed placements punctually. Unexplained absences will be escalated and may result in suspension from the platform.</li>
            <li>Complete Cardex entries accurately and in real time during your shift.</li>
            <li>Clock in and out using the GPS-verified system for every shift.</li>
            <li>Maintain patient confidentiality at all times. You must not disclose any information about a patient or their family outside the E-Vive platform without explicit consent.</li>
            <li>Report any incident, concern, or safeguarding issue immediately to E-Vive&apos;s Clinical Quality team.</li>
            <li><strong>Smartphone &amp; internet access:</strong> You must maintain a working smartphone and reliable mobile internet access for the duration of your engagement on the E-Vive platform. These are required to clock in and out via GPS, submit Cardex reports in real time, receive placement notifications, and communicate with E-Vive coordinators and clients. Failure to maintain adequate device or connectivity standards may result in suspension from the platform.</li>
            <li><strong>Non-compete obligation:</strong> You agree not to directly provide care services to, or accept private employment from, any client or patient introduced to you through the E-Vive platform for a period of <strong>24 months</strong> after you leave the E-Vive network or after the conclusion of any E-Vive-managed placement with that client — whichever is later. This restriction applies regardless of how the private arrangement is initiated.</li>
          </ul>
        </div>

        <div className="legal-sec" id="rates">
          <h2>6. Rates &amp; Payments</h2>
          <p>HCA rates are set exclusively by E-Vive&apos;s Super Admin based on the HCA&apos;s certification level, years of experience, and care specialisation. HCAs do not set their own rates.</p>
          <p>Clients are invoiced by E-Vive on a per-shift or weekly basis, depending on the placement type. All payments are processed in Kenyan Shillings (KES) via M-Pesa or bank transfer.</p>
          <p>E-Vive retains a platform and management fee from each placement. The HCA&apos;s net rate is communicated to them upon approval and before their first placement.</p>
          <p>In the event of a billing dispute, contact <a href="mailto:hello@e-vive.co.ke">hello@e-vive.co.ke</a>. We will investigate and respond within 5 business days.</p>
        </div>

        <div className="legal-sec" id="conduct">
          <h2>7. Acceptable Use</h2>
          <p>You must not use the Service to:</p>
          <ul>
            <li>Circumvent the platform by arranging private placements directly with HCAs found through E-Vive.</li>
            <li>Post false, misleading, or defamatory reviews or reports.</li>
            <li>Harvest contact details of HCAs or Clients for commercial purposes.</li>
            <li>Attempt to gain unauthorised access to any part of the platform.</li>
            <li>Use the Service for any purpose that is illegal under Kenyan law.</li>
          </ul>
          <p>Violation of these rules may result in immediate account termination and, where appropriate, referral to relevant authorities.</p>
        </div>

        <div className="legal-sec" id="ip">
          <h2>8. Intellectual Property</h2>
          <p>All content on the E-Vive platform - including the E-Vive name, logo, design, text, and software - is owned by Star Delight Enterprises and is protected by Kenyan intellectual property law.</p>
          <p>You may not reproduce, distribute, or create derivative works from any E-Vive content without prior written permission.</p>
        </div>

        <div className="legal-sec" id="liability">
          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by Kenyan law, E-Vive&apos;s liability for any claim arising from the use of the Service is limited to the amount you have paid to E-Vive in the 30 days preceding the event giving rise to the claim.</p>
          <p>E-Vive is not liable for any indirect, consequential, or incidental loss arising from your use of the Service, including loss of income, loss of data, or personal injury caused by an HCA acting outside the scope of their care plan.</p>
          <p>We do not guarantee that the Service will be uninterrupted or error-free. We will endeavour to give reasonable notice of planned maintenance.</p>
        </div>

        <div className="legal-sec" id="termination">
          <h2>10. Termination</h2>
          <p>Either party may terminate the service relationship at any time by giving 7 days&apos; written notice. E-Vive may terminate immediately without notice if you breach these Terms, particularly in cases involving abuse, fraud, or patient safety concerns.</p>
          <p>Upon termination, your access to the platform will be suspended. Data will be retained in line with our <Link href="/privacy">Privacy Policy</Link>.</p>
        </div>

        <div className="legal-sec" id="noncompete">
          <h2>11. Non-Compete &amp; Non-Solicitation</h2>
          <p>This section sets out the obligations of both Clients and HCAs to protect E-Vive&apos;s business relationships and proprietary matching services.</p>

          <div className="legal-highlight">
            <strong>HCA Restriction (24 months):</strong> An HCA who leaves the E-Vive network — whether voluntarily, through suspension, or by non-renewal — may not directly provide care services to, or accept private employment from, any Client or patient they were introduced to through the E-Vive platform for a period of <strong>24 months</strong> from the date of departure or the conclusion of their last E-Vive-managed placement, whichever is later.
          </div>

          <div className="legal-highlight">
            <strong>Client Restriction (24 months):</strong> A Client who ceases to use E-Vive services may not directly hire, contract, or engage in any private care arrangement with any HCA introduced to them through the E-Vive platform for a period of <strong>24 months</strong> from the date they cease to be an active E-Vive client or from the conclusion of their last E-Vive-managed placement, whichever is later.
          </div>

          <p>These restrictions apply:</p>
          <ul>
            <li>Regardless of whether the private arrangement is initiated by the Client, the HCA, or a third party.</li>
            <li>To direct employment, informal care arrangements, sub-contracting, and any other form of private engagement.</li>
            <li>Even if the HCA or Client claims the relationship arose independently of E-Vive — the burden of proof lies with the party seeking to demonstrate independence.</li>
          </ul>

          <div className="legal-highlight" style={{borderColor:"rgba(244,63,94,0.3)",background:"rgba(244,63,94,0.05)"}}>
            <strong style={{color:"#b91c1c"}}>Penalty for Non-Compliance:</strong> Any Client or HCA found to have violated this non-compete or non-solicitation clause shall be liable to pay E-Vive a penalty equivalent to <strong>three (3) months&apos; worth of the applicable monthly care fee</strong> for the placement or care arrangement in question. This penalty is in addition to — and does not replace — E-Vive&apos;s right to seek injunctive relief or damages under Kenyan law. The applicable monthly care fee shall be calculated at E-Vive&apos;s standard live-in care rate in effect at the time of the breach, unless a higher agreed rate was in place.
          </div>

          <p>E-Vive reserves the right to pursue recovery of this penalty through the courts of Kenya and to blacklist the offending party from the platform indefinitely.</p>
        </div>

        <div className="legal-sec" id="governing">
          <h2>12. Governing Law</h2>
          <p>These Terms are governed by the laws of Kenya. Any dispute arising from these Terms shall be referred first to mediation under the Nairobi Centre for International Arbitration rules. If mediation fails, disputes shall be resolved in the courts of Kenya.</p>
        </div>

        <div className="legal-sec" id="contact">
          <h2>13. Contact</h2>
          <p>For questions about these Terms of Use:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:hello@e-vive.co.ke">hello@e-vive.co.ke</a></li>
            <li><strong>Post:</strong> Legal Team, Star Delight Enterprises, off Riara Road, Nairobi, Kenya</li>
            <li><strong>Phone:</strong> <a href="tel:+254141888340">+254 141 888 340</a></li>
          </ul>
        </div>
      </div>

      <Footer />
    </>
  );
}
