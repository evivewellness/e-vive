import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { setAdminSession, getAdminSession } from "../../lib/store";

const CORRECT_HASH = process.env.NEXT_PUBLIC_ADMIN_HASH ||
  "a62272989cd2f742263eb83f266507e7810c569b952bb36fef788d21e40ccb5f";
const CORRECT_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@e-vive.co.ke").toLowerCase();
const MAX_ATTEMPTS   = 3;
const LOCKOUT_SECS   = 60;

async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

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

  // Redirect if already authenticated
  useEffect(() => {
    try {
      const session = getAdminSession();
      if (session?.id) router.replace("/admin/dashboard");
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const hash = await sha256hex(password);
      const emailOk = emailNorm === CORRECT_EMAIL;
      const passOk  = hash === CORRECT_HASH;
      if (emailOk && passOk) {
        setAdminSession({ id: "admin", name: "Salome Ruguru", role: "super_admin" });
        router.replace("/admin/dashboard");
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
