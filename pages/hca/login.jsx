import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { BASE_CSS } from "../../components/SharedStyles";
import { getAllHcaProfiles, setHcaSession } from "../../lib/store";

const PAGE_CSS = `
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; }

  .login-page {
    min-height: 100vh;
    background: radial-gradient(ellipse at 20% 50%, rgba(0,74,153,0.14) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.08) 0%, transparent 55%),
                var(--forest);
    display: flex; align-items: center; justify-content: center;
    padding: 40px 20px;
  }

  .login-wrap {
    width: 100%; max-width: 440px;
  }

  .login-logo {
    text-align: center; margin-bottom: 40px;
  }
  .login-logo-mark {
    width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 14px;
    background: conic-gradient(from 120deg,var(--mint),var(--jade),var(--sky),var(--mint));
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800; color: #fff;
    box-shadow: 0 0 32px rgba(0,74,153,0.45);
  }
  .login-logo-text {
    font-family: var(--serif); font-size: 28px; font-weight: 700;
    letter-spacing: -0.3px; color: var(--text);
  }
  .login-logo-text span { color: var(--sky); }
  .login-logo-sub {
    font-size: 11px; color: var(--muted); font-family: var(--mono);
    letter-spacing: 1.8px; text-transform: uppercase; margin-top: 4px;
  }

  .login-card {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(0,74,153,0.28);
    border-radius: 24px; padding: 40px;
    backdrop-filter: blur(20px);
  }

  .login-card h2 {
    font-family: var(--serif); font-size: 1.5rem; font-weight: 700;
    margin-bottom: 6px; text-align: center;
  }
  .login-card .login-sub {
    font-size: 0.84rem; color: var(--muted); text-align: center;
    margin-bottom: 32px; line-height: 1.6;
  }

  .lf-group { margin-bottom: 20px; }
  .lf-label {
    display: block; font-size: 12px; font-weight: 600;
    color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;
    font-family: var(--mono); margin-bottom: 8px;
  }
  .lf-input {
    width: 100%; background: rgba(0,74,153,0.07);
    border: 1px solid rgba(0,74,153,0.25); border-radius: 12px;
    padding: 13px 16px; color: var(--text);
    font-family: var(--sans); font-size: 15px;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .lf-input:focus {
    border-color: var(--sky);
    box-shadow: 0 0 0 3px rgba(14,165,233,0.14);
  }
  .lf-input::placeholder { color: rgba(254,240,232,0.25); }

  .login-error {
    background: rgba(249,112,102,0.1); border: 1px solid rgba(249,112,102,0.3);
    border-radius: 10px; padding: 11px 14px;
    font-size: 13px; color: #f97066; margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }

  .login-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--jade), var(--emerald));
    color: #fff; border: none; padding: 14px 24px; border-radius: 100px;
    font-family: var(--sans); font-size: 15px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,74,153,0.35);
    transition: all 0.25s; letter-spacing: 0.2px; margin-top: 8px;
  }
  .login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,74,153,0.45); }
  .login-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .login-hint {
    margin-top: 28px; padding: 16px 18px;
    background: rgba(0,74,153,0.08); border: 1px solid rgba(0,74,153,0.2);
    border-radius: 12px; font-size: 12px; color: var(--muted); line-height: 1.6;
  }
  .login-hint strong { color: var(--sky); }

  .login-footer {
    text-align: center; margin-top: 28px;
    font-size: 13px; color: var(--muted);
  }
  .login-footer a { color: var(--sky); text-decoration: none; }
  .login-footer a:hover { text-decoration: underline; }

  .back-link {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-bottom: 32px; font-size: 13px;
    color: var(--muted); text-decoration: none; transition: color 0.2s;
  }
  .back-link:hover { color: var(--sky); }
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.empId.trim() || !form.password.trim()) {
      setError("Please enter your Employee ID / email and password.");
      return;
    }
    setLoading(true);
    try {
      const profiles = getAllHcaProfiles();
      const empId = form.empId.trim();
      // Match by employeeId, email, or mobile
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
      // Legacy compatibility
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
        <title>HCA Login - E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{BASE_CSS + PAGE_CSS}</style>

      <div className="login-page">
        <div className="login-wrap">
          <Link href="/" className="back-link">
            ← Back to E-Vive Platform
          </Link>

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
              {error && (
                <div className="login-error">⚠ {error}</div>
              )}

              <div className="lf-group">
                <label className="lf-label" htmlFor="empId">Employee ID</label>
                <input
                  id="empId"
                  name="empId"
                  type="text"
                  className="lf-input"
                  placeholder="Employee ID, email, or mobile"
                  value={form.empId}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>

              <div className="lf-group">
                <label className="lf-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="lf-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Signing in…" : "Sign In to Dashboard →"}
              </button>
            </form>

            <div className="login-hint">
              <strong>New to E-Vive?</strong> Your Employee ID and temporary password are provided by E-Vive after your application is approved. Contact <strong>hello@e-vive.co.ke</strong> if you have not received your credentials.
            </div>
          </div>

          <div className="login-footer">
            Want to join E-Vive? <Link href="/hca/apply">Apply as an HCA →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
