import Link from "next/link";

const FOOTER_CSS = `
  .footer {
    border-top:1px solid rgba(0,74,153,0.1);
    background:rgba(237,241,249,0.8);
    position:relative; z-index:1;
  }
  .footer-main {
    max-width:1200px; margin:0 auto; padding:60px 5vw 40px;
    display:grid; grid-template-columns:2fr 1fr 1fr; gap:48px;
  }
  .footer-brand .logo-text { font-family:'Playfair Display',Georgia,serif; font-size:22px; font-weight:700; color:#0F2035; margin-bottom:4px; }
  .footer-brand .logo-text span { color:#004A99; }
  .footer-brand p { font-size:13px; color:rgba(15,32,53,0.55); line-height:1.7; margin-top:12px; max-width:260px; }
  .footer-socials { display:flex; gap:10px; margin-top:20px; }
  .social-btn { width:36px; height:36px; border-radius:10px; background:rgba(0,74,153,0.07); border:1px solid rgba(0,74,153,0.15); display:flex; align-items:center; justify-content:center; font-size:16px; cursor:pointer; transition:all 0.2s; text-decoration:none; }
  .social-btn:hover { background:rgba(0,74,153,0.13); border-color:rgba(0,74,153,0.3); transform:translateY(-2px); }
  .footer-col h4 { font-size:13px; font-weight:700; color:#0F2035; letter-spacing:1px; text-transform:uppercase; font-family:'DM Mono',monospace; margin-bottom:16px; }
  .footer-col ul { list-style:none; display:flex; flex-direction:column; gap:10px; }
  .footer-col a { font-size:13px; color:rgba(15,32,53,0.55); text-decoration:none; transition:color 0.2s; }
  .footer-col a:hover { color:#004A99; }
  .footer-bottom {
    border-top:1px solid rgba(0,74,153,0.08);
    max-width:1200px; margin:0 auto; padding:20px 5vw;
    display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;
  }
  .footer-copy { font-size:12px; color:rgba(15,32,53,0.45); }
  .footer-legal { display:flex; gap:20px; }
  .footer-legal a { font-size:12px; color:rgba(15,32,53,0.45); text-decoration:none; transition:color 0.2s; }
  .footer-legal a:hover { color:rgba(15,32,53,0.7); }
  .footer-cert { display:flex; align-items:center; gap:8px; padding:8px 14px; background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.12); border-radius:10px; margin-top:16px; }
  .footer-cert-text { font-size:11px; color:rgba(15,32,53,0.55); font-family:'DM Mono',monospace; }
  @media (max-width:900px) {
    .footer-main { grid-template-columns:1fr 1fr; gap:32px; }
    .footer-brand { grid-column:1/-1; }
  }
  @media (max-width:580px) {
    .footer-main { grid-template-columns:1fr; }
    .footer-bottom { flex-direction:column; text-align:center; }
  }
`;

export default function Footer() {
  return (
    <>
      <style>{FOOTER_CSS}</style>
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="logo-text">e<span>-</span>vive</div>
            <p>Kenya&apos;s premier location-based homecare assistant matching platform — connecting certified carers with families who need them most.</p>
            <div className="footer-socials">
              {["📘", "🐦", "📸", "💼"].map((s, i) => <a key={i} href="#" className="social-btn">{s}</a>)}
            </div>
            <div className="footer-cert">
              <span>🏥</span>
              <span className="footer-cert-text">Certified Homecare Assistants</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              {[["Find a Carer", "/match"], ["For Assistants", "/assistants"], ["Family Hub", "/caregivers"], ["Client Login", "/client/register"], ["HCA Login", "/hca/login"]].map(([l, h]) => (
                <li key={l}><Link href={h}>{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Partners portal — coming soon, hidden from footer
          <div className="footer-col">
            <h4>Partners</h4>
            <ul>
              {[["AgaKhan Hospital", "/partners"], ["MP Shah Hospital", "/partners"], ["Nairobi Hospital", "/partners"], ["Become a Partner", "/partners"]].map(([l, h]) => (
                <li key={l}><Link href={h}>{l}</Link></li>
              ))}
            </ul>
          </div>
          */}

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {[["About Us", "/about"], ["Contact Us", "/contact"], ["Press", "/press"], ["Privacy Policy", "/privacy"], ["Terms of Use", "/terms"]].map(([l, h]) => (
                <li key={l}><Link href={h}>{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2025–2026 E-Vive Wellness Initiative · Star Delight Enterprises Ltd · Nairobi, Kenya</div>
          <div className="footer-legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="#">Accessibility</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
    </>
  );
}
