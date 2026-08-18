import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { BASE_CSS } from '../../../components/SharedStyles';
import PageMeta from '../../../components/PageMeta';

/**
 * Redeem a password reset link. Shared by clients and HCAs — the token itself
 * carries which account it belongs to, so the page never has to ask, and a
 * visitor cannot aim a reset at an account they don't hold the link for.
 */

const PAGE_CSS = `
  body { background: var(--bg); }
  .rs-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  .rs-card { background:#fff; border:1px solid rgba(0,74,153,0.13); border-radius:24px;
             padding:40px 36px; max-width:440px; width:100%; box-shadow:0 4px 40px rgba(0,74,153,0.08); }
  .rs-logo { font-family:var(--serif); font-size:26px; font-weight:900; color:var(--jade); margin-bottom:4px; }
  .rs-logo span { color:var(--mint); }
  .rs-sub { font-family:var(--mono); font-size:11px; letter-spacing:1px; text-transform:uppercase;
            color:var(--muted); margin-bottom:24px; }
  .rs-title { font-family:var(--serif); font-size:22px; font-weight:700; margin-bottom:8px; color:var(--text); }
  .rs-desc { font-size:14px; color:var(--muted); line-height:1.6; margin-bottom:24px; }
  .rs-label { display:block; font-family:var(--mono); font-size:11px; text-transform:uppercase;
              letter-spacing:0.5px; color:var(--muted); margin-bottom:6px; }
  .rs-input { width:100%; border:1.5px solid rgba(0,74,153,0.18); border-radius:10px; padding:12px 14px;
              font-family:var(--sans); font-size:14px; color:var(--text); background:#F8FAFD;
              outline:none; margin-bottom:16px; }
  .rs-input:focus { border-color:var(--jade); }
  .rs-btn { width:100%; background:linear-gradient(135deg,var(--jade),var(--emerald)); color:#fff;
            border:none; border-radius:100px; padding:13px 24px; font-weight:700; font-size:14px;
            cursor:pointer; font-family:var(--sans); }
  .rs-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .rs-err { background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.3); color:#c0392b;
            border-radius:10px; padding:12px 14px; font-size:13px; margin-bottom:18px; line-height:1.5; }
  .rs-ok { background:rgba(0,180,100,0.08); border:1px solid rgba(0,180,100,0.25); color:#0a6640;
           border-radius:10px; padding:12px 14px; font-size:13px; margin-bottom:18px; line-height:1.5; }
  .rs-link { display:inline-block; margin-top:18px; font-size:13px; color:var(--jade); text-decoration:none; font-weight:600; }
`;

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [state, setState] = useState('checking');   // checking | ready | invalid | done
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/reset?token=${encodeURIComponent(token)}`);
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) { setEmail(body.email || ''); setState('ready'); }
        else { setErr(body.error || 'This reset link is not valid.'); setState('invalid'); }
      } catch {
        if (!cancelled) { setErr('Could not check this link. Please try again.'); setState('invalid'); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    if (pwd.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pwd !== confirm) { setErr('Passwords do not match.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(body.error || 'Could not update the password.'); setSaving(false); return; }
      setState('done');
    } catch {
      setErr('Something went wrong. Please try again.');
      setSaving(false);
    }
  }, [pwd, confirm, token]);

  return (
    <>
      <PageMeta title="Reset Password" path="/auth/reset/" noindex />
      <style>{BASE_CSS + PAGE_CSS}</style>
      <div className="rs-wrap">
        <div className="rs-card">
          <div className="rs-logo">e<span>-</span>vive</div>
          <div className="rs-sub">Account Security</div>

          {state === 'checking' && <div className="rs-desc">Checking this link…</div>}

          {state === 'invalid' && (
            <>
              <div className="rs-title">Link not valid</div>
              <div className="rs-err">{err}</div>
              <div className="rs-desc">Reset links work once and expire after 45 minutes. Request a new one and it will arrive in the same inbox.</div>
              <Link className="rs-link" href="/client/register/">← Back to sign in</Link>
            </>
          )}

          {state === 'ready' && (
            <>
              <div className="rs-title">Set a new password</div>
              <div className="rs-desc">
                {email ? <>You are resetting the password for <strong>{email}</strong>.</> : 'Choose a new password for your account.'}
              </div>
              {err && <div className="rs-err">⚠ {err}</div>}
              <form onSubmit={submit}>
                <label className="rs-label" htmlFor="rs-new">New password</label>
                <input id="rs-new" className="rs-input" type="password" autoComplete="new-password"
                       placeholder="Min. 6 characters" value={pwd}
                       onChange={e => { setPwd(e.target.value); setErr(''); }} />
                <label className="rs-label" htmlFor="rs-confirm">Confirm password</label>
                <input id="rs-confirm" className="rs-input" type="password" autoComplete="new-password"
                       placeholder="Repeat password" value={confirm}
                       onChange={e => { setConfirm(e.target.value); setErr(''); }} />
                <button className="rs-btn" type="submit" disabled={saving || !pwd || !confirm}>
                  {saving ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </>
          )}

          {state === 'done' && (
            <>
              <div className="rs-title">Password updated</div>
              <div className="rs-ok">✓ Your password has been changed. You can sign in with it now.</div>
              <Link className="rs-link" href="/client/register/">Go to client sign in →</Link><br />
              <Link className="rs-link" href="/hca/login/">Go to HCA sign in →</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
