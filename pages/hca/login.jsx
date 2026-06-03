import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { BASE_CSS } from "../../components/SharedStyles";
import { getAllHcaProfiles, setHcaSession } from "../../lib/store";

const PAGE_CSS = `
  body { margin:0; }

  /* ── Split layout ── */
  .login-page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* ── Hero panel (left) ── */
  .login-hero {
    position: relative;
    overflow: hidden;
    min-height: 100vh;
  }
  .login-hero-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center 30%;
    display: block;
  }
  /* Teal-toned overlay matching scrubs colour */
  .login-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      150deg,
      rgba(0,74,153,0.62) 0%,
      rgba(0,100,72,0.48) 55%,
      rgba(0,74,153,0.35) 100%
    );
  }
  .login-hero-body {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    justify-content: flex-end;
    padding: 48px 44px;
    color: #fff;
  }
  .login-hero-tag {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; font-family: var(--mono);
    color: rgba(255,255,255,0.7);
    margin-bottom: 12px;
  }
  .login-hero-title {
    font-family: var(--serif); font-size: clamp(1.6rem, 2.6vw, 2.2rem);
    font-weight: 700; line-height: 1.2; margin-bottom: 14px;
  }
  .login-hero-title em { font-style: italic; color: #7df2c5; }
  .login-hero-sub {
    font-size: 14px; line-height: 1.65; color: rgba(255,255,255,0.78);
    max-width: 340px; margin-bottom: 28px;
  }
  .login-hero-chips {
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .login-hero-chip {
    padding: 5px 14px; border-radius: 100px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.28);
    font-size: 11px; font-weight: 600; color: #fff;
    font-family: var(--mono); letter-spacing: 0.5px;
  }

  /* ── Form panel (right) ── */
  .login-form-panel {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 60px 48px;
    background: linear-gradient(
      170deg,
      #edf3fb 0%,
      #f2f8f4 60%,
      #edf3fb 100%
    );
    overflow-y: auto;
  }

  .login-wrap { width: 100%; max-width: 400px; }

  .login-logo { text-align: center; margin-bottom: 40px; }
  .login-logo-mark {
    width: 58px; height: 58px; border-radius: 50%; margin: 0 auto 14px;
    background: linear-gradient(135deg, var(--jade), var(--emerald));
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800; color: #fff;
    box-shadow: 0 6px 24px rgba(0,74,153,0.25);
  }
  .login-logo-text {
    font-family: var(--serif); font-size: 26px; font-weight: 700;
    letter-spacing: -0.3px; color: var(--text);
  }
  .login-logo-text span { color: var(--jade); }
  .login-logo-sub {
    font-size: 11px; color: var(--muted); font-family: var(--mono);
    letter-spacing: 1.8px; text-transform: uppercase; margin-top: 4px;
  }

  .login-card {
    background: rgba(255,255,255,0.88);
    border: 1px solid rgba(0,74,153,0.14);
    border-radius: 22px; padding: 38px;
    box-shadow: 0 8px 40px rgba(0,74,153,0.09);
  }
  .login-card h2 {
    font-family: var(--serif); font-size: 1.45rem; font-weight: 700;
    margin-bottom: 6px; text-align: center; color: var(--text);
  }
  .login-card .login-sub {
    font-size: 0.84rem; color: var(--muted); text-align: center;
    margin-bottom: 30px; line-height: 1.6;
  }

  .lf-group { margin-bottom: 18px; }
  .lf-label {
    display: block; font-size: 11px; font-weight: 600;
    color: var(--jade); letter-spacing: 0.06em; text-transform: uppercase;
    font-family: var(--mono); margin-bottom: 7px;
  }
  .lf-input {
    width: 100%; background: #fff;
    border: 1px solid rgba(0,74,153,0.2); border-radius: 11px;
    padding: 12px 15px; color: var(--text);
    font-family: var(--sans); font-size: 14px;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .lf-input:focus {
    border-color: var(--jade);
    box-shadow: 0 0 0 3px rgba(0,74,153,0.09);
  }
  .lf-input::placeholder { color: rgba(15,32,53,0.3); }

  .login-error {
    background: rgba(249,112,102,0.08); border: 1px solid rgba(249,112,102,0.3);
    border-radius: 10px; padding: 10px 14px;
    font-size: 13px; color: #e05252; margin-bottom: 18px;
    display: flex; align-items: center; gap: 8px;
  }

  .login-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--jade), var(--emerald));
    color: #fff; border: none; padding: 13px 24px; border-radius: 100px;
    font-family: var(--sans); font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 18px rgba(0,74,153,0.22);
    transition: all 0.25s; margin-top: 6px;
  }
  .login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(0,74,153,0.32); }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .login-hint {
    margin-top: 24px; padding: 14px 16px;
    background: rgba(0,74,153,0.05); border: 1px solid rgba(0,74,153,0.14);
    border-radius: 11px; font-size: 12px; color: var(--muted); line-height: 1.6;
  }
  .login-hint strong { color: var(--jade); }

  .login-footer {
    text-align: center; margin-top: 24px;
    font-size: 13px; color: var(--muted);
  }
  .login-footer a { color: var(--jade); text-decoration: none; font-weight: 600; }
  .login-footer a:hover { text-decoration: underline; }

  .back-link {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-bottom: 32px; font-size: 13px;
    color: var(--muted); text-decoration: none; transition: color 0.2s;
  }
  .back-link:hover { color: var(--jade); }

  /* ── Mobile: stack vertically ── */
  @media (max-width: 760px) {
    .login-page { grid-template-columns: 1fr; }
    .login-hero  { min-height: 280px; }
    .login-hero-body { padding: 24px 24px 28px; }
    .login-hero-title { font-size: 1.35rem; }
    .login-hero-sub { display: none; }
    .login-form-panel { padding: 36px 20px 48px; }
    .login-card { padding: 28px 22px; }
  }
`;

export default function HCALogin() {
  const router = useRouter();
  const [form, setForm] = useState({ empId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.empId.trim() || !form.password.trim()) {
      setError("Please enter your Employee ID / email and password.");
      return;
    }
    setLoading(true);
    try {
      const profiles = await getAllHcaProfiles();
      const empId = form.empId.trim();
      const profile = profiles.find(p =>
        p.employeeId === empId ||
        p.email?.toLowerCase() === empId.toLowerCase() ||
        p.mobile === empId
      );
      if (!profile) {
        setError("No HCA account found with these credentials. Contact hello@e-vive.co.ke.");
        setLoading(false);
        return;
      }
      if (profile.password && profile.password !== form.password) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }
      setHcaSession(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem("hca_auth", "true");
        localStorage.setItem("hca_id", profile.employeeId);
      }
      router.push("/hca/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>HCA Login — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{BASE_CSS + PAGE_CSS}</style>

      <div className="login-page">

        {/* ── Hero panel ── */}
        <div className="login-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="login-hero-img"
            src="/images/hero-group-care.png"
            alt="E-Vive HomeCare Assistants with a patient"
          />
          <div className="login-hero-overlay" />
          <div className="login-hero-body">
            <div className="login-hero-tag">HomeCare Assistant Portal</div>
            <h1 className="login-hero-title">
              Compassionate Care,<br />
              <em>Powered by You</em>
            </h1>
            <p className="login-hero-sub">
              Log in to access your shift schedule, Cardex entries, GPS clock-in, and patient handover notes — all in one place.
            </p>
            <div className="login-hero-chips">
              {["GPS Clock-in","Live Cardex","Shift Reports","Welfare Support"].map(c => (
                <span className="login-hero-chip" key={c}>{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="login-form-panel">
          <div className="login-wrap">
            <Link href="/" className="back-link">← Back to E-Vive Platform</Link>

            <div className="login-logo">
              <div className="login-logo-mark">E</div>
              <div className="login-logo-text">e<span>-</span>vive</div>
              <div className="login-logo-sub">HomeCare Assistant Portal</div>
            </div>

            <div className="login-card">
              <h2>HCA Sign In</h2>
              <p className="login-sub">
                Access your dashboard, Cardex, and shift schedule.<br />
                Use your assigned Employee ID to log in.
              </p>

              <form onSubmit={handleSubmit}>
                {error && <div className="login-error">⚠ {error}</div>}

                <div className="lf-group">
                  <label className="lf-label" htmlFor="empId">Employee ID</label>
                  <input
                    id="empId" name="empId" type="text" className="lf-input"
                    placeholder="Employee ID, email, or mobile"
                    value={form.empId} onChange={handleChange}
                    autoComplete="username"
                  />
                </div>

                <div className="lf-group">
                  <label className="lf-label" htmlFor="password">Password</label>
                  <input
                    id="password" name="password" type="password" className="lf-input"
                    placeholder="Enter your password"
                    value={form.password} onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "Signing in…" : "Sign In to Dashboard →"}
                </button>
              </form>

              <div className="login-hint">
                <strong>New to E-Vive?</strong> Your Employee ID and temporary password are provided after your application is approved. Contact <strong>hello@e-vive.co.ke</strong> if you have not received your credentials.
              </div>
            </div>

            <div className="login-footer">
              Want to join E-Vive? <Link href="/hca/apply">Apply as an HCA →</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
