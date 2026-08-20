import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';
import PageMeta from '../components/PageMeta';

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

export default function AccessibilityPage() {
  return (
    <>
      <PageMeta
        title="Accessibility"
        description="How E-Vive works to be usable by everyone, what we know still falls short, and how to tell us when something blocks you."
        path="/accessibility/"
      />
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      <section className="legal-hero">
        <div className="legal-hero-inner">
          <div className="stag" style={{ marginBottom: 16 }}>Legal</div>
          <h1>Accessibility</h1>
          <p>Care does not wait for a website to work. Here is where we stand, plainly.</p>
          <div className="legal-updated">Last updated: 20 August 2026</div>
        </div>
      </section>

      <div className="legal-wrap">
        <div className="legal-sec" id="commitment">
          <h2>1. Our Commitment</h2>
          <p>The people who use E-Vive include families arranging care for a relative who cannot manage alone, and carers filing reports at the end of a twelve-hour shift. Many are on a phone, on mobile data, in a hurry. An interface that only works for someone young, sighted and unhurried is not doing its job.</p>
          <p>We aim to meet <strong>WCAG 2.1 Level AA</strong>. We are not claiming to have reached it — see section 3.</p>
        </div>

        <div className="legal-sec" id="what-works">
          <h2>2. What We Have Done</h2>
          <ul>
            <li><strong>Every page works on a phone.</strong> All pages declare a viewport and reflow to a single column; nothing requires horizontal scrolling.</li>
            <li><strong>Text scales.</strong> Type is sized in relative units, so browser and system zoom enlarge it rather than clipping it.</li>
            <li><strong>Colour is not the only signal.</strong> Status is carried by words and icons as well as colour, so red-green colour blindness does not hide a rejected application or an overdue invoice.</li>
            <li><strong>Forms have labels.</strong> Inputs are associated with visible labels rather than relying on placeholder text, which disappears as soon as you type.</li>
            <li><strong>Errors say what to do.</strong> Validation messages name the field and the fix in plain words, not a code.</li>
            <li><strong>No motion is essential.</strong> Animation is decorative; nothing depends on seeing it happen.</li>
          </ul>
        </div>

        <div className="legal-sec" id="known-gaps">
          <h2>3. What Still Falls Short</h2>
          <p>We would rather tell you than have you find out.</p>
          <ul>
            <li><strong>No formal audit has been carried out.</strong> Nothing here has been verified by an accessibility specialist or against assistive technology in a structured test. Treat this page as a statement of intent with evidence, not a certification.</li>
            <li><strong>Screen reader testing is incomplete.</strong> The admin dashboard in particular is dense, and its tables and modals have not been walked through with a screen reader end to end.</li>
            <li><strong>Some contrast ratios are unverified.</strong> The darker portal themes use muted greys for secondary text that may fall below 4.5:1.</li>
            <li><strong>Keyboard navigation has gaps.</strong> Most of the platform is reachable by keyboard, but focus handling in some modals has not been checked, and focus indicators are inconsistent.</li>
            <li><strong>Uploaded documents are not accessible.</strong> Certificates and photos are files people upload; we cannot make a scanned PDF readable by a screen reader.</li>
          </ul>
        </div>

        <div className="legal-sec" id="help">
          <h2>4. If Something Blocks You</h2>
          <p>Tell us, and we will help you directly while we fix it. There is no form to fill in and no ticket to raise.</p>
          <ul>
            <li><strong>Phone:</strong> <a href="tel:+254141888340">+254 141 888 340</a></li>
            <li><strong>Email:</strong> <a href="mailto:hello@e-vive.co.ke">hello@e-vive.co.ke</a></li>
          </ul>
          <p>Please say which page you were on and what you were trying to do. If a part of the platform is unusable for you, we will complete the task with you over the phone rather than ask you to wait for a release.</p>
          <p>We treat accessibility reports as bugs, not feedback. They go on the same list as everything else that is broken.</p>
        </div>

        <div className="legal-sec" id="related">
          <h2>5. Related</h2>
          <p>
            See also our <Link href="/privacy">Privacy Policy</Link>, which covers the single
            cookie we set and what we store on your device, and our{' '}
            <Link href="/terms">Terms of Use</Link>.
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
