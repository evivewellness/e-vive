import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { setAdminSession } from "../../lib/store";
import { fetchServerSession } from "../../lib/session";

// Credentials are verified server-side against the `admin_users` table, which
// stores scrypt hashes. The browser never sees a hash and never decides whether
// a password is correct — /api/auth/login does, and answers with a signed
// HttpOnly cookie or with 401.
const MAX_ATTEMPTS   = 3;
const LOCKOUT_SECS   = 60;

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0d1a; }
  .login-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(ellipse at 30% 20%, rgba(168,0,64,0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 80%, rgba(0,74,153,0.12) 0%, transparent 60%),
                #0a0d1a;
    padding: 24px;
  }
  .login-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(168,0,64,0.2);
    border-radius: 24px;
    padding: 48px 40px;
    width: 100%; max-width: 420px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset;
  }
  .login-logo { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; color: #f0e6d3; margin-bottom: 4px; }
  .login-logo span { color: #a80040; }
  .login-sub { font-size: 11px; font-family: 'DM Mono', monospace; color: rgba(240,230,211,0.4); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 36px; }
  .login-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: #f0e6d3; margin-bottom: 8px; }
  .login-desc { font-size: 13px; color: rgba(240,230,211,0.45); margin-bottom: 28px; line-height: 1.6; }
  .login-label { display: block; font-size: 11px; font-family: 'DM Mono', monospace; color: rgba(240,230,211,0.5); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
  .login-input {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(168,0,64,0.2);
    border-radius: 12px; padding: 13px 16px; color: #f0e6d3;
    font-family: 'DM Mono', monospace; font-size: 14px; outline: none;
    transition: border-color 0.2s; margin-bottom: 18px;
  }
  .login-input:focus { border-color: rgba(168,0,64,0.6); }
  .login-input::placeholder { color: rgba(240,230,211,0.25); }
  .login-btn {
    width: 100%; padding: 14px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #a80040, #7a002e);
    color: #f0e6d3; font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 700;
    letter-spacing: 0.5px; transition: opacity 0.2s, transform 0.1s;
    margin-top: 4px;
  }
  .login-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .login-btn:active:not(:disabled) { transform: translateY(0); }
  .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .login-err { background: rgba(168,0,64,0.12); border: 1px solid rgba(168,0,64,0.3); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #f97066; margin-bottom: 18px; line-height: 1.5; }
  .login-lockout { background: rgba(255,150,0,0.1); border: 1px solid rgba(255,150,0,0.25); border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #f59e0b; margin-bottom: 18px; font-family: 'DM Mono', monospace; }
  .login-attempts { font-size: 11px; color: rgba(240,230,211,0.3); font-family: 'DM Mono', monospace; text-align: center; margin-top: 16px; }
  .login-field { margin-bottom: 0; }
`;

export default function AdminLogin() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked,   setLocked]   = useState(false);
  const [lockSecs, setLockSecs] = useState(0);

  // Redirect if already authenticated — asks the server, not localStorage.
  useEffect(() => {
    let cancelled = false;
    fetchServerSession().then(s => {
      if (!cancelled && s?.role === "admin") router.replace("/admin/dashboard");
    });
    return () => { cancelled = true; };
  }, [router])

  // Lockout countdown
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      setLockSecs(s => {
        if (s <= 1) { setLocked(false); setAttempts(0); clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading || locked) return;
    setError("");
    setLoading(true);
    try {
      const emailNorm = email.trim().toLowerCase();

      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", identifier: emailNorm, password }),
      }).catch(() => null);
      if (res && res.ok) {
        const { session } = await res.json();
        // Kept only so the sidebar can greet the admin by name. Every page
        // guard and every API route re-checks the cookie regardless.
        setAdminSession({ id: session.id, name: session.name || "Administrator", role: session.adminRole || "super_admin" });
        router.replace("/admin/dashboard");
        return;
      }
      if (res && res.status === 503) {
        setError("Admin sign-in is not configured on this deployment. SESSION_SECRET and SUPABASE_SERVICE_ROLE_KEY must be set.");
        return;
      }
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true);
        setLockSecs(LOCKOUT_SECS);
        setError("");
      } else {
        setError(`Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`);
      }
    } catch {
      setError("Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, locked, attempts, router]);

  return (
    <>
      <Head>
        <title>Admin Login · E-Vive</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <style>{CSS}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">e<span>-</span>vive</div>
          <div className="login-sub">Secure Admin Access</div>
          <div className="login-title">Sign in to Dashboard</div>
          <div className="login-desc">This area is restricted to authorised E-Vive administrators only.</div>

          {locked && (
            <div className="login-lockout">
              🔒 Too many failed attempts. Please wait {lockSecs}s before trying again.
            </div>
          )}
          {error && !locked && <div className="login-err">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                className="login-input"
                placeholder="admin@e-vive.co.ke"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={locked || loading}
                autoComplete="username"
                required
              />
            </div>
            <div className="login-field">
              <label className="login-label" htmlFor="admin-pass">Password</label>
              <input
                id="admin-pass"
                type="password"
                className="login-input"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={locked || loading}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={locked || loading || !email || !password}>
              {loading ? "Verifying…" : "Sign In →"}
            </button>
          </form>

          {attempts > 0 && !locked && (
            <div className="login-attempts">
              {attempts} failed attempt{attempts !== 1 ? "s" : ""} · Account locks after {MAX_ATTEMPTS}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
