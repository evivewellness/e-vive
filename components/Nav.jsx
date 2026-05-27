import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const NAV_CSS = `
  .nav {
    position:fixed; top:0; left:0; right:0; z-index:1000;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 5vw; height:72px;
    background:rgba(255,255,255,0.92);
    backdrop-filter:blur(20px) saturate(1.4);
    border-bottom:1px solid rgba(0,74,153,0.12);
    transition:all 0.4s;
  }
  .nav.scrolled { height:60px; background:rgba(255,255,255,0.99); }
  .nav-logo { display:flex; align-items:center; gap:10px; cursor:pointer; text-decoration:none; }
  .logo-mark {
    width:36px; height:36px; border-radius:50%;
    background:conic-gradient(from 120deg,#84BD60,#004A99,#003580,#84BD60);
    display:flex; align-items:center; justify-content:center;
    font-size:15px; font-weight:800; color:#fff;
    box-shadow:0 0 20px rgba(0,74,153,0.35);
    animation:spin-slow 14s linear infinite; flex-shrink:0;
  }
  .logo-text { font-family:'Playfair Display',Georgia,serif; font-size:22px; font-weight:700; letter-spacing:-0.3px; color:#0F2035; }
  .logo-text span { color:#004A99; }
  .logo-sub { font-size:9px; color:rgba(15,32,53,0.45); font-family:'DM Mono',monospace; letter-spacing:1.5px; text-transform:uppercase; line-height:1; }
  .nav-links { display:flex; gap:2px; list-style:none; align-items:center; }
  .nav-link {
    color:rgba(15,32,53,0.65); text-decoration:none; font-size:13px; font-weight:500;
    letter-spacing:0.2px; transition:all 0.2s; padding:7px 13px; border-radius:9px; white-space:nowrap;
  }
  .nav-link:hover { color:#004A99; background:rgba(0,74,153,0.07); }
  .nav-link.active { color:#004A99; background:rgba(0,74,153,0.1); border:1px solid rgba(0,74,153,0.15); }
  .nav-link.gold-link { color:rgba(232,132,90,0.85); }
  .nav-link.gold-link:hover { color:#E8845A; background:rgba(232,132,90,0.08); }
  .nav-link.gold-link.active { color:#E8845A; background:rgba(232,132,90,0.1); border-color:rgba(232,132,90,0.2); }
  .nav-cta {
    background:linear-gradient(135deg,#F0A98B,#E8845A);
    color:#0F2035; border:none; padding:9px 20px; border-radius:100px;
    font-family:'DM Sans',system-ui,sans-serif; font-size:13px; font-weight:600; cursor:pointer;
    box-shadow:0 4px 16px rgba(232,132,90,0.4); transition:all 0.25s;
    letter-spacing:0.2px; text-decoration:none; white-space:nowrap;
  }
  .nav-cta:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,132,90,0.5); }
  .hamburger { display:none; background:none; border:none; cursor:pointer; color:#0F2035; font-size:22px; padding:4px; }
  .nav-right { display:flex; align-items:center; gap:12px; }
  .mobile-menu {
    position:fixed; top:72px; left:0; right:0;
    background:rgba(244,247,246,0.99); backdrop-filter:blur(20px);
    padding:16px 5vw 24px; border-bottom:1px solid rgba(0,74,153,0.12);
    flex-direction:column; gap:4px; z-index:999; display:none;
  }
  .mobile-menu.open { display:flex; }
  .mobile-menu .nav-link { font-size:15px; padding:12px 16px; border-radius:12px; }
  .mobile-cta { margin-top:12px; text-align:center; border-radius:100px; padding:13px; }
  @media (max-width:960px) {
    .nav-links { display:none; }
    .hamburger { display:block; }
    .nav-cta-desk { display:none; }
  }
`;

const NAV_ITEMS = [
  { label: "Home",           href: "/" },
  { label: "Find a Carer",  href: "/match" },
  { label: "For Assistants",href: "/assistants" },
  { label: "Family Hub",    href: "/caregivers" },
  { label: "About",         href: "/about" },
  { label: "Contact",       href: "/contact" },
  // { label: "Partners", href: "/partners", gold: true },  // Coming soon
  // { label: "Products", href: "/products" },              // Coming soon
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [router.pathname]);

  return (
    <>
      <style>{NAV_CSS}</style>
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <Link href="/" className="nav-logo">
          <div className="logo-mark">E</div>
          <div>
            <div className="logo-text">e<span>-</span>vive</div>
            <div className="logo-sub">HomeCare Platform</div>
          </div>
        </Link>

        <ul className="nav-links">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav-link${router.pathname === item.href ? " active" : ""}${item.gold ? " gold-link" : ""}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <Link href="/match" className="nav-cta nav-cta-desk">Get Care Now →</Link>
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${router.pathname === item.href ? " active" : ""}${item.gold ? " gold-link" : ""}`}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/match" className="nav-cta mobile-cta">Get Care Now →</Link>
      </div>
    </>
  );
}
