import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DASH_BASE } from "../../components/SharedStyles";
import {
  createClient,
  authenticateClient,
  getAllClients,
  getClientByEmail,
  setClientSession,
  advanceClientJourney,
  updateClient,
} from "../../lib/store";

const CSS = `
  body { display:flex; min-height:100vh; align-items:center; justify-content:center; padding:40px 16px; background:var(--deep); }
  .reg-wrap { width:100%; max-width:640px; }
  .reg-logo { text-align:center; margin-bottom:32px; }
  .reg-logo-text { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--text); }
  .reg-logo-text span { color:var(--jade); }
  .reg-logo-sub { font-size:11px; color:var(--muted); font-family:var(--mono); letter-spacing:2px; text-transform:uppercase; margin-top:4px; }

  /* Progress stepper */
  .stepper { display:flex; align-items:center; justify-content:center; gap:0; margin-bottom:36px; }
  .step-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; font-family:var(--mono); transition:all 0.3s; flex-shrink:0; }
  .step-dot.done    { background:var(--jade); color:#fff; }
  .step-dot.current { background:linear-gradient(135deg,var(--jade),var(--emerald)); color:#fff; box-shadow:0 0 0 4px rgba(0,74,153,0.18); }
  .step-dot.pending { background:rgba(0,74,153,0.06); color:var(--muted); border:1px solid rgba(0,74,153,0.15); }
  .step-line { flex:1; height:2px; background:rgba(0,74,153,0.12); max-width:60px; transition:background 0.3s; }
  .step-line.done { background:var(--jade); }
  .step-label { font-size:10px; color:var(--muted); text-align:center; margin-top:6px; font-family:var(--mono); letter-spacing:0.5px; }

  /* Card */
  .reg-card { background:rgba(255,255,255,0.97); border:1px solid rgba(0,74,153,0.12); border-radius:26px; padding:36px; box-shadow:0 8px 40px rgba(0,74,153,0.08); }
  .reg-step-title { font-family:var(--serif); font-size:22px; font-weight:700; margin-bottom:6px; color:var(--text); }
  .reg-step-sub { font-size:14px; color:var(--muted); margin-bottom:28px; line-height:1.6; }

  /* Form elements */
  .frg { margin-bottom:16px; }
  .fl  { font-size:11px; font-weight:700; color:var(--jade); letter-spacing:0.5px; font-family:var(--mono); text-transform:uppercase; margin-bottom:7px; display:block; }
  .fi, .fsel, .fta { width:100%; background:#fff; border:1px solid rgba(0,74,153,0.18); border-radius:10px; padding:12px 15px; color:var(--text); font-family:var(--sans); font-size:14px; transition:all 0.22s; outline:none; box-sizing:border-box; }
  .fi:focus, .fsel:focus, .fta:focus { border-color:var(--jade); box-shadow:0 0 0 3px rgba(0,74,153,0.1); }
  .fsel option { background:#fff; color:var(--text); }
  .fta { resize:vertical; min-height:80px; }
  .fr2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  /* Patient block */
  .patient-block { background:rgba(0,74,153,0.03); border:1px solid rgba(0,74,153,0.1); border-radius:14px; padding:18px; margin-bottom:14px; }
  .patient-block-title { font-size:13px; font-weight:700; margin-bottom:14px; display:flex; align-items:center; gap:8px; color:var(--text); }
  .add-patient-btn { width:100%; padding:12px; border-radius:12px; border:1px dashed rgba(0,74,153,0.25); background:transparent; color:var(--jade); font-family:var(--sans); font-weight:600; font-size:14px; cursor:pointer; transition:all 0.22s; display:flex; align-items:center; justify-content:center; gap:8px; }
  .add-patient-btn:hover { border-color:var(--jade); background:rgba(0,74,153,0.04); }

  /* T&C */
  .tc-box { background:rgba(0,74,153,0.03); border:1px solid rgba(0,74,153,0.1); border-radius:14px; padding:20px; max-height:220px; overflow-y:auto; font-size:13px; color:var(--muted); line-height:1.7; margin-bottom:16px; }
  .tc-box h4 { color:var(--text); font-size:14px; margin-bottom:8px; }
  .tc-box p  { margin-bottom:10px; }
  .tc-accept { display:flex; align-items:flex-start; gap:10px; cursor:pointer; font-size:13px; color:var(--muted); margin-bottom:20px; }
  .tc-accept input { accent-color:var(--jade); width:16px; height:16px; margin-top:1px; cursor:pointer; flex-shrink:0; }
  .tc-accept span { line-height:1.5; }

  /* ── Gate / Check screen ── */
  .gate-wrap { text-align:center; }
  .gate-icon  { font-size:48px; margin-bottom:16px; }
  .gate-title { font-family:var(--serif); font-size:22px; font-weight:700; margin-bottom:8px; color:var(--text); }
  .gate-sub   { font-size:14px; color:var(--muted); margin-bottom:28px; line-height:1.6; }
  .gate-input-wrap { text-align:left; margin-bottom:20px; }
  .gate-divider { display:flex; align-items:center; gap:12px; margin:20px 0; font-size:12px; color:var(--muted); font-family:var(--mono); }
  .gate-divider::before, .gate-divider::after { content:''; flex:1; height:1px; background:rgba(0,74,153,0.1); }

  /* ── Reset password ── */
  .reset-notice { background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.14); border-radius:12px; padding:14px 16px; font-size:13px; color:var(--muted); line-height:1.6; margin-bottom:20px; }
  .reset-code-box { background:rgba(132,189,96,0.08); border:2px dashed rgba(132,189,96,0.4); border-radius:14px; padding:20px; text-align:center; margin-bottom:20px; }
  .reset-code { font-family:var(--mono); font-size:34px; font-weight:700; letter-spacing:10px; color:var(--jade); }
  .reset-code-label { font-size:11px; color:var(--muted); font-family:var(--mono); margin-top:6px; }
  .reset-success { text-align:center; padding:12px 0; }

  /* ── Login screen ── */
  .login-error { background:rgba(249,112,102,0.08); border:1px solid rgba(249,112,102,0.22); border-radius:10px; padding:10px 14px; font-size:13px; color:var(--coral); margin-bottom:16px; display:flex; align-items:center; gap:8px; }

  /* Success */
  .success-box { text-align:center; padding:20px 0; }
  .success-icon  { font-size:56px; margin-bottom:18px; }
  .success-title { font-family:var(--serif); font-size:26px; font-weight:700; margin-bottom:10px; color:var(--text); }
  .success-sub   { font-size:15px; color:var(--muted); line-height:1.7; max-width:480px; margin:0 auto 28px; }
  .journey-preview { background:rgba(0,74,153,0.03); border:1px solid rgba(0,74,153,0.1); border-radius:14px; padding:20px; margin-bottom:24px; }
  .jp-title { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:var(--mono); color:var(--muted); margin-bottom:14px; }
  .jp-dot.done    { background:var(--jade); }
  .jp-dot.current { background:rgba(232,132,90,0.2); border:2px solid var(--gold); }
  .jp-dot.pending { background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.12); }

  /* Nav footer */
  .reg-nav { display:flex; justify-content:space-between; align-items:center; margin-top:24px; gap:12px; }

  .ghost-btn { background:none; border:none; cursor:pointer; color:var(--muted); font-size:13px; font-family:var(--mono); padding:0; transition:color 0.2s; }
  .ghost-btn:hover { color:var(--text); }

  @media (max-width:580px) { .fr2 { grid-template-columns:1fr; } .reg-card { padding:22px; } }
`;

const LOCATIONS = ["Nairobi CBD","Westlands","Karen","Kilimani","Kileleshwa","Lavington","Langata","Eastlands","Kasarani","Thika Road","Mombasa","Kisumu","Nakuru","Eldoret","Nyeri"];
const CARE_TYPES_REF = ["Palliative","Dementia","Companionship","Critical Care","Diabetic Care","Cerebral Palsy","Visual Impairment","Mobility Assistance","Child Care","Post-Surgery","Other"];

const JOURNEY_STEPS = [
  {icon:"✅",lbl:"Account\nCreated"},
  {icon:"📄",lbl:"T&C\nAccepted"},
  {icon:"📬",lbl:"Acknowledged"},
  {icon:"📞",lbl:"Call\nMade"},
  {icon:"🏠",lbl:"Visit\nDone"},
  {icon:"🤝",lbl:"HCA\nMatched"},
  {icon:"💳",lbl:"Payment\nMade"},
  {icon:"🏥",lbl:"Placement\nActive"},
];

const STEP_LABELS = ["Your Details","Patient Details","Terms & Confirm","Account Created"];


export default function ClientRegister() {
  const router = useRouter();

  // flow: "signin" | "register" | "reset-request" | "reset-verify"
  const [flow,       setFlow]      = useState("signin");
  const [loginEmail, setLoginEmail] = useState("");
  const [password,   setPassword]  = useState("");
  const [loginErr,   setLoginErr]  = useState("");

  // password reset
  const [resetId,      setResetId]      = useState("");
  const [resetCode,    setResetCode]    = useState("");
  const [resetInput,   setResetInput]   = useState("");
  const [newPwd,       setNewPwd]       = useState("");
  const [confirmNewPwd,setConfirmNewPwd]= useState("");
  const [resetErr,     setResetErr]     = useState("");
  const [resetDone,    setResetDone]    = useState(false);

  // register sub-steps
  const [step,       setStep]       = useState(0);
  const [form,       setForm]       = useState({ name:"", email:"", mobile:"", location:"", address:"", password:"", confirmPassword:"" });
  const [patients,   setPatients]   = useState([{ name:"", gender:"", careType:"", notes:"" }]);
  const [tcAccepted, setTcAccepted] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("evive_client_session") || "null");
      if (session?.email) router.replace("/client/dashboard");
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const upd    = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const updPat = (i, f, v) => setPatients(p => p.map((pt, idx) => idx === i ? { ...pt, [f]: v } : pt));

  const pwdOk    = form.password.length >= 6 && form.password === form.confirmPassword;
  const canNext0 = form.name && form.email && form.mobile && form.location && pwdOk;
  const canNext1 = patients.every(p => p.name && p.gender && p.careType);
  const canNext2 = tcAccepted;

  // ── Sign in: look up by email or phone, verify password ──
  async function handleSignIn() {
    if (!loginEmail.trim() || !password) return;
    try {
      const emailId = loginEmail.trim().toLowerCase();
      let client = await authenticateClient(emailId, password);
      if (!client) {
        const all = await getAllClients();
        const byMobile = all.find(c => c.mobile === loginEmail.trim() && c.password === password);
        if (byMobile) client = byMobile;
      }
      if (client) {
        setClientSession(client);
        router.push("/client/dashboard");
        return;
      }
      const registry = JSON.parse(localStorage.getItem("evive_client_registry") || "[]");
      const user = registry.find(u =>
        u.email?.toLowerCase() === emailId || u.mobile === loginEmail.trim()
      );
      if (!user) {
        setLoginErr("No account found with these details. Check your email / phone or create a new account below.");
      } else if (user.password !== password) {
        setLoginErr("Incorrect password. Please try again.");
      } else {
        localStorage.setItem("evive_client_session", JSON.stringify({
          name: user.name, email: user.email, mobile: user.mobile,
        }));
        router.push("/client/dashboard");
      }
    } catch {
      setLoginErr("Something went wrong. Please try again.");
    }
  }

  // ── Reset: send code (simulated — code shown on screen) ──
  function handleResetRequest() {
    if (!resetId.trim()) return;
    try {
      const registry = JSON.parse(localStorage.getItem("evive_client_registry") || "[]");
      const id = resetId.trim().toLowerCase();
      const user = registry.find(u =>
        u.email?.toLowerCase() === id || u.mobile === id
      );
      if (!user) {
        setResetErr("No account found with that email or mobile number.");
        return;
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setResetCode(code);
      setResetErr("");
      setFlow("reset-verify");
    } catch {
      setResetErr("Something went wrong. Please try again.");
    }
  }

  // ── Reset: verify code and update password ──
  async function handleResetVerify() {
    if (resetInput !== resetCode) { setResetErr("Incorrect code. Please try again."); return; }
    if (newPwd.length < 6)        { setResetErr("Password must be at least 6 characters."); return; }
    if (newPwd !== confirmNewPwd) { setResetErr("Passwords do not match."); return; }
    try {
      const id = resetId.trim().toLowerCase();
      const storeClient = await getClientByEmail(id);
      if (storeClient) await updateClient(storeClient.id, { password: newPwd });
      const registry = JSON.parse(localStorage.getItem("evive_client_registry") || "[]");
      const idx = registry.findIndex(u =>
        u.email?.toLowerCase() === id || u.mobile === resetId.trim()
      );
      if (idx !== -1) {
        registry[idx] = { ...registry[idx], password: newPwd };
        localStorage.setItem("evive_client_registry", JSON.stringify(registry));
      }
      if (!storeClient && idx === -1) { setResetErr("Account not found."); return; }
      setResetErr("");
      setResetDone(true);
    } catch {
      setResetErr("Something went wrong. Please try again.");
    }
  }

  function goBackToSignIn() {
    setFlow("signin");
    setResetId(""); setResetCode(""); setResetInput("");
    setNewPwd(""); setConfirmNewPwd(""); setResetErr(""); setResetDone(false);
  }

  // ── Register: advance steps; save on final step ──
  const [regErr, setRegErr] = useState("");
  async function next() {
    if (step === 0 && !canNext0) return;
    if (step === 1 && !canNext1) return;
    if (step === 2 && !canNext2) return;
    if (step === 2) {
      try {
        const client = await createClient({
          name:     form.name,
          email:    form.email,
          mobile:   form.mobile,
          password: form.password,
          location: form.location,
          address:  form.address,
          patients: patients.map(p => ({
            name:         p.name,
            gender:       p.gender,
            careType:     p.careType,
            conditions:   p.careType,
            notes:        p.notes,
            relationship: "Patient",
          })),
        });
        await advanceClientJourney(client.id, "tc_accepted");
        setClientSession(client);
        setRegErr("");
      } catch (err) {
        setRegErr(err.message || "Registration failed. Please try again.");
        return;
      }
    }
    setStep(s => s + 1);
  }

  const subLabel = flow === "register" ? "New Account" : flow.startsWith("reset") ? "Reset Password" : "Sign In";

  return (
    <>
      <Head>
        <title>Client Account — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      <div className="reg-wrap">
        {/* Logo */}
        <div className="reg-logo">
          <Link href="/" style={{textDecoration:"none"}}>
            <div className="reg-logo-text">e<span>-</span>vive</div>
            <div className="reg-logo-sub">HomeCare · {subLabel}</div>
          </Link>
        </div>

        {/* Stepper — only during registration steps 0–2 */}
        {flow === "register" && step < 3 && (
          <div style={{marginBottom:8}}>
            <div className="stepper">
              {STEP_LABELS.map((l, i) => (
                <div key={l} style={{display:"contents"}}>
                  <div className={`step-dot ${i < step ? "done" : i === step ? "current" : "pending"}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`step-line ${i < step ? "done" : ""}`} />
                  )}
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-around",marginTop:6}}>
              {STEP_LABELS.map((l, i) => (
                <div key={l} className="step-label" style={{
                  color: i === step ? "var(--jade)" : i < step ? "var(--mint)" : "var(--muted)",
                  fontWeight: i === step ? 700 : 400, minWidth:80, textAlign:"center",
                }}>{l}</div>
              ))}
            </div>
          </div>
        )}

        <div className="reg-card">

          {/* ══ SIGN IN ══ */}
          {flow === "signin" && (
            <div className="gate-wrap">
              <div className="gate-icon">🔐</div>
              <div className="gate-title">Client Sign In</div>
              <div className="gate-sub">
                Sign in to access your dashboard, manage patients and track care.
              </div>

              {loginErr && <div className="login-error" style={{textAlign:"left"}}>⚠ {loginErr}</div>}

              <div className="gate-input-wrap">
                <label className="fl">Email address or mobile number</label>
                <input
                  className="fi"
                  placeholder="jane@example.com  or  +254 7..."
                  value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setLoginErr(""); }}
                  onKeyDown={e => e.key === "Enter" && document.getElementById("pwd-field")?.focus()}
                  autoFocus
                />
              </div>

              <div className="gate-input-wrap">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <label className="fl" style={{margin:0}}>Password</label>
                  <button
                    className="ghost-btn"
                    style={{fontSize:12,color:"var(--jade)",fontWeight:600}}
                    onClick={() => { setResetId(loginEmail); setResetErr(""); setFlow("reset-request"); }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="pwd-field"
                  className="fi"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginErr(""); }}
                  onKeyDown={e => e.key === "Enter" && loginEmail.trim() && password && handleSignIn()}
                />
              </div>

              <button
                className="btn-p"
                style={{width:"100%", padding:"13px"}}
                onClick={handleSignIn}
                disabled={!loginEmail.trim() || !password}
              >
                Sign In →
              </button>

              <div className="gate-divider">new to e-vive?</div>

              <button
                className="btn-o"
                style={{width:"100%", padding:"11px"}}
                onClick={() => {
                  if (loginEmail.trim()) {
                    if (loginEmail.includes("@")) upd("email", loginEmail.trim());
                    else upd("mobile", loginEmail.trim());
                  }
                  setFlow("register");
                }}
              >
                Create an Account →
              </button>
            </div>
          )}

          {/* ══ RESET — Step 1: request code ══ */}
          {flow === "reset-request" && (
            <div className="gate-wrap">
              <div className="gate-icon">🔑</div>
              <div className="gate-title">Reset Password</div>
              <div className="gate-sub">
                Enter the email address or mobile number linked to your account.
                We&apos;ll generate a one-time reset code.
              </div>

              {resetErr && <div className="login-error" style={{textAlign:"left"}}>⚠ {resetErr}</div>}

              <div className="gate-input-wrap">
                <label className="fl">Email address or mobile number</label>
                <input
                  className="fi"
                  placeholder="jane@example.com  or  +254 7..."
                  value={resetId}
                  onChange={e => { setResetId(e.target.value); setResetErr(""); }}
                  onKeyDown={e => e.key === "Enter" && handleResetRequest()}
                  autoFocus
                />
              </div>

              <button
                className="btn-p"
                style={{width:"100%", padding:"13px"}}
                onClick={handleResetRequest}
                disabled={!resetId.trim()}
              >
                Send Reset Code →
              </button>

              <div style={{marginTop:16, textAlign:"center"}}>
                <button className="ghost-btn" onClick={goBackToSignIn}>← Back to Sign In</button>
              </div>
            </div>
          )}

          {/* ══ RESET — Step 2: enter code + new password ══ */}
          {flow === "reset-verify" && (
            <div className="gate-wrap">
              <div className="gate-icon">📬</div>
              <div className="gate-title">{resetDone ? "Password Updated" : "Enter Reset Code"}</div>

              {!resetDone ? (
                <>
                  <div className="gate-sub">
                    A reset code has been sent to the email / mobile registered for <strong style={{color:"var(--text)"}}>{resetId}</strong>.
                    Please check your messages and enter the 6-digit code below.
                  </div>

                  {resetErr && <div className="login-error" style={{textAlign:"left"}}>⚠ {resetErr}</div>}

                  <div className="gate-input-wrap">
                    <label className="fl">Enter the 6-digit code</label>
                    <input
                      className="fi"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={resetInput}
                      onChange={e => { setResetInput(e.target.value.replace(/\D/g,"")); setResetErr(""); }}
                      style={{textAlign:"center", fontSize:20, letterSpacing:6, fontFamily:"var(--mono)"}}
                      autoFocus
                    />
                  </div>

                  <div className="fr2" style={{marginBottom:16}}>
                    <div className="frg" style={{margin:0}}>
                      <label className="fl">New Password</label>
                      <input
                        className="fi"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={newPwd}
                        onChange={e => { setNewPwd(e.target.value); setResetErr(""); }}
                      />
                    </div>
                    <div className="frg" style={{margin:0}}>
                      <label className="fl">Confirm Password</label>
                      <input
                        className="fi"
                        type="password"
                        placeholder="Repeat password"
                        value={confirmNewPwd}
                        onChange={e => { setConfirmNewPwd(e.target.value); setResetErr(""); }}
                        style={confirmNewPwd && newPwd !== confirmNewPwd ? {borderColor:"var(--coral)"} : {}}
                      />
                      {confirmNewPwd && newPwd !== confirmNewPwd && (
                        <div style={{fontSize:11,color:"var(--coral)",marginTop:4,fontFamily:"var(--mono)"}}>Passwords do not match</div>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn-p"
                    style={{width:"100%", padding:"13px"}}
                    onClick={handleResetVerify}
                    disabled={resetInput.length < 6 || newPwd.length < 6 || newPwd !== confirmNewPwd}
                  >
                    Set New Password →
                  </button>

                  <div style={{marginTop:14, textAlign:"center"}}>
                    <button className="ghost-btn" onClick={() => setFlow("reset-request")}>← Request a new code</button>
                  </div>
                </>
              ) : (
                <div className="reset-success">
                  <div style={{fontSize:52, marginBottom:16}}>✅</div>
                  <div className="gate-sub">
                    Your password has been updated successfully. You can now sign in with your new password.
                  </div>
                  <button
                    className="btn-p"
                    style={{padding:"12px 32px"}}
                    onClick={goBackToSignIn}
                  >
                    Sign In →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ REGISTER ══ */}
          {flow === "register" && (
            <>
              {/* Step 0: Your Details */}
              {step === 0 && (
                <>
                  <div className="reg-step-title">Your Details</div>
                  <div className="reg-step-sub">
                    You will be the <strong style={{color:"var(--text)"}}>billing client</strong>. You may add one or more patients below in the next step.
                  </div>
                  <div className="fr2">
                    <div className="frg">
                      <label className="fl">Full Name *</label>
                      <input className="fi" placeholder="Jane Wanjiku" value={form.name} onChange={e=>upd("name",e.target.value)} />
                    </div>
                    <div className="frg">
                      <label className="fl">Mobile Number *</label>
                      <input className="fi" placeholder="+254 7..." value={form.mobile} onChange={e=>upd("mobile",e.target.value)} />
                    </div>
                  </div>
                  <div className="frg">
                    <label className="fl">Email Address *</label>
                    <input className="fi" type="email" placeholder="jane@example.com" value={form.email} onChange={e=>upd("email",e.target.value)} />
                  </div>
                  <div className="fr2">
                    <div className="frg">
                      <label className="fl">Location (City / Town) *</label>
                      <select className="fsel" value={form.location} onChange={e=>upd("location",e.target.value)}>
                        <option value="">Select location...</option>
                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="frg">
                      <label className="fl">Estate / Area</label>
                      <input className="fi" placeholder="e.g. Kilimani, Rose Ave" value={form.address} onChange={e=>upd("address",e.target.value)} />
                    </div>
                  </div>
                  <div className="fr2">
                    <div className="frg">
                      <label className="fl">Password *</label>
                      <input
                        className="fi"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={e => upd("password", e.target.value)}
                      />
                    </div>
                    <div className="frg">
                      <label className="fl">Confirm Password *</label>
                      <input
                        className="fi"
                        type="password"
                        placeholder="Repeat password"
                        value={form.confirmPassword}
                        onChange={e => upd("confirmPassword", e.target.value)}
                        style={form.confirmPassword && form.password !== form.confirmPassword ? {borderColor:"var(--coral)"} : {}}
                      />
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <div style={{fontSize:11,color:"var(--coral)",marginTop:4,fontFamily:"var(--mono)"}}>Passwords do not match</div>
                      )}
                    </div>
                  </div>
                  <div style={{background:"rgba(14,165,233,0.08)",border:"1px solid rgba(14,165,233,0.18)",borderRadius:12,padding:"12px 16px",fontSize:13,color:"var(--muted)",marginTop:4}}>
                    ℹ️ A <strong style={{color:"var(--sky)"}}>confirmation link</strong> will be sent to your email. Click it to activate your account.
                  </div>
                </>
              )}

              {/* Step 1: Patient Details */}
              {step === 1 && (
                <>
                  <div className="reg-step-title">Patient Details</div>
                  <div className="reg-step-sub">
                    Each patient receives their own <strong style={{color:"var(--text)"}}>Patient Account</strong> with individual care tracking, Cardex records and billing — all visible in your Client Dashboard.
                  </div>
                  {patients.map((pt, i) => (
                    <div className="patient-block" key={i}>
                      <div className="patient-block-title">
                        <span style={{width:26,height:26,borderRadius:"50%",background:"var(--jade)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,fontFamily:"var(--mono)"}}>{i+1}</span>
                        Patient {i + 1}
                        {patients.length > 1 && (
                          <button style={{marginLeft:"auto",background:"none",border:"none",color:"var(--coral)",cursor:"pointer",fontSize:13}} onClick={() => setPatients(p => p.filter((_,idx) => idx !== i))}>✕ Remove</button>
                        )}
                      </div>
                      <div className="fr2">
                        <div className="frg">
                          <label className="fl">Patient Name *</label>
                          <input className="fi" placeholder="Full name" value={pt.name} onChange={e=>updPat(i,"name",e.target.value)} />
                        </div>
                        <div className="frg">
                          <label className="fl">Gender *</label>
                          <select className="fsel" value={pt.gender} onChange={e=>updPat(i,"gender",e.target.value)}>
                            <option value="">Select...</option>
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="frg">
                        <label className="fl">Primary Care Need *</label>
                        <select className="fsel" value={pt.careType} onChange={e=>updPat(i,"careType",e.target.value)}>
                          <option value="">Select care type...</option>
                          {CARE_TYPES_REF.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="frg">
                        <label className="fl">Special Notes / Conditions</label>
                        <textarea className="fta" placeholder="Allergies, special dietary needs, mobility limitations, medications..." value={pt.notes} onChange={e=>updPat(i,"notes",e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button className="add-patient-btn" onClick={() => setPatients(p => [...p, {name:"",gender:"",careType:"",notes:""}])}>
                    + Add Another Patient
                  </button>
                </>
              )}

              {/* Step 2: T&Cs */}
              {step === 2 && (
                <>
                  <div className="reg-step-title">Terms & Conditions</div>
                  <div className="reg-step-sub">Please read and accept the E-Vive Terms of Service before your account is created.</div>
                  <div className="tc-box">
                    <h4>E-Vive HomeCare — Client Terms of Service</h4>
                    <p><strong>1. Service Agreement.</strong> E-Vive Wellness Initiative (&quot;E-Vive&quot;) provides a platform to match clients with Home Care Assistants (&quot;HCAs&quot;). E-Vive is not a direct employer of HCAs but acts as a placement and management intermediary.</p>
                    <p><strong>2. Client Obligations.</strong> The Client agrees to provide accurate information about patients&apos; care needs, maintain safe and respectful conditions for HCAs on premises, and adhere to the agreed payment schedule.</p>
                    <p><strong>3. Placement Process.</strong> Following account creation, E-Vive will acknowledge the application, call the client, conduct a home visit, confirm the HCA match, and proceed with placement upon receipt of payment.</p>
                    <p><strong>4. Payment.</strong> Placement commences only after payment is received and confirmed by E-Vive admin. Invoices will be issued following the home visit and HCA matching confirmation. Payment reminders will be sent 5 days before due dates.</p>
                    <p><strong>5. Confidentiality.</strong> HCA contact details are managed exclusively through the E-Vive platform. Direct solicitation of HCAs outside the platform is prohibited and may result in account termination and a placement fee penalty.</p>
                    <p><strong>6. Non-Solicitation (24 months).</strong> You agree not to directly hire, contract, or arrange private care with any E-Vive HCA introduced to you through this platform for a period of <strong>24 months</strong> after you cease to be an active E-Vive client or after the conclusion of any E-Vive-managed placement. Violation attracts a penalty of <strong>3 months&apos; worth of monthly care fees</strong>.</p>
                    <p><strong>7. Care Quality.</strong> E-Vive monitors care quality through shift Cardex records, timeliness data, and client feedback.</p>
                    <p><strong>8. Account Closure.</strong> To close an account, the client must give 14 days written notice. Outstanding payments must be cleared before closure is processed.</p>
                    <p><strong>9. Data Protection.</strong> Client and patient data is handled in accordance with Kenya&apos;s Data Protection Act 2019. Personal information is not shared with third parties without consent.</p>
                  </div>
                  <label className="tc-accept">
                    <input type="checkbox" checked={tcAccepted} onChange={e => setTcAccepted(e.target.checked)} />
                    <span>I have read and agree to the E-Vive Terms of Service. I confirm that all information provided is accurate and I have authority to act on behalf of the patients listed.</span>
                  </label>
                  <div style={{background:"rgba(0,74,153,0.05)",border:"1px solid rgba(0,74,153,0.12)",borderRadius:12,padding:"12px 16px",fontSize:13,color:"var(--muted)"}}>
                    📧 After clicking &quot;Create Account&quot;, a confirmation email will be sent to <strong style={{color:"var(--jade)"}}>{form.email || "your email"}</strong>. Click the link to activate your account.
                  </div>
                </>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <div className="success-box">
                  <div className="success-icon">🌿</div>
                  <div className="success-title">Account Created, {form.name.split(" ")[0] || "Friend"}!</div>
                  <div className="success-sub">
                    A confirmation email has been sent to <strong style={{color:"var(--jade)"}}>{form.email}</strong>. Please click the link to activate your account. Our team will reach out within 24 hours.
                  </div>
                  <div className="journey-preview">
                    <div className="jp-title">Your Client Journey — Status Overview</div>
                    <div style={{display:"flex",alignItems:"center",overflowX:"auto",paddingBottom:8}}>
                      {JOURNEY_STEPS.map((js, i) => (
                        <div key={js.lbl} style={{display:"contents"}}>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,minWidth:76}}>
                            <div className={`jp-dot ${i===0?"done":i===1?"current":"pending"}`} style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>
                              {i === 0 ? "✓" : js.icon}
                            </div>
                            <div style={{fontSize:10,color:i===0?"var(--mint)":i===1?"var(--gold)":"var(--muted)",fontFamily:"var(--mono)",textAlign:"center",lineHeight:1.4,whiteSpace:"pre-line"}}>{js.lbl}</div>
                          </div>
                          {i < JOURNEY_STEPS.length - 1 && (
                            <div style={{flex:1,height:2,background:i<1?"var(--jade)":"rgba(0,74,153,0.1)",minWidth:16,marginBottom:24}} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                    <Link href="/client/dashboard" className="btn-p">Go to My Dashboard →</Link>
                    <Link href="/" className="btn-o">Back to Home</Link>
                  </div>
                </div>
              )}

              {/* Registration error */}
              {regErr && (
                <div className="login-error" style={{marginTop:12}}>⚠ {regErr}</div>
              )}

              {/* Navigation */}
              {step < 3 && (
                <div className="reg-nav">
                  <div>
                    {step > 0
                      ? <button className="btn-o" onClick={() => setStep(s => s - 1)}>← Back</button>
                      : <button className="btn-o" onClick={() => { setStep(0); setFlow("signin"); }}>← Back</button>
                    }
                  </div>
                  <button
                    className="btn-p"
                    onClick={next}
                    disabled={(step===0&&!canNext0)||(step===1&&!canNext1)||(step===2&&!canNext2)}
                  >
                    {step === 2 ? "Create Account & Accept T&Cs →" : "Continue →"}
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer links */}
        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"var(--muted)"}}>
          {flow === "register" && step < 3 ? (
            <>Already have an account?{" "}
              <button className="ghost-btn" style={{color:"var(--jade)",fontWeight:600}} onClick={() => { setFlow("signin"); setStep(0); setLoginErr(""); }}>Sign In →</button>
            </>
          ) : flow === "signin" ? (
            <>New to E-Vive?{" "}
              <button className="ghost-btn" style={{color:"var(--jade)",fontWeight:600}} onClick={() => setFlow("register")}>Create an account →</button>
            </>
          ) : null /* reset flows — no footer prompt */}
        </div>
      </div>
    </>
  );
}
