import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { BASE_CSS } from "../../../../components/SharedStyles";
import { getHcaApplicationByEditToken, submitApplicationEdit } from "../../../../lib/store";

const CSS = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --jade:#004A99; --teal:#0ea5e9; --mint:#84BD60; --coral:#f43f5e;
    --text:#0F2035; --muted:#5A7080;
    --serif:'Playfair Display',Georgia,serif; --sans:'DM Sans',system-ui,sans-serif; --mono:'DM Mono',monospace;
  }
  body { min-height:100vh; font-family:var(--sans); color:var(--text); background:linear-gradient(150deg,#EBF2FF 0%,#F0F4FA 50%,#EDF8F0 100%); padding:40px 16px 80px; }
  .wrap { width:100%; max-width:640px; margin:0 auto; }
  .logo { text-align:center; margin-bottom:24px; }
  .logo-text { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--text); }
  .logo-text span { color:var(--jade); }
  .card { background:#fff; border:1px solid rgba(0,74,153,0.13); border-radius:24px; padding:36px; box-shadow:0 4px 40px rgba(0,74,153,0.08); }
  .title { font-family:var(--serif); font-size:22px; font-weight:700; margin-bottom:8px; }
  .sub { font-size:13px; color:var(--muted); line-height:1.6; margin-bottom:24px; }
  .note-box { background:rgba(240,169,139,0.1); border:1px solid rgba(232,132,90,0.3); border-radius:12px; padding:14px 16px; margin-bottom:24px; font-size:13px; }
  .fg { margin-bottom:18px; }
  .fl { display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.4px; }
  .fi { width:100%; border:1.5px solid rgba(0,74,153,0.18); border-radius:10px; padding:11px 14px; font-family:var(--sans); font-size:14px; color:var(--text); background:#F8FAFD; outline:none; }
  .fi:focus { border-color:var(--jade); }
  textarea.fi { resize:vertical; }
  .chip { display:inline-flex; padding:6px 14px; border-radius:100px; font-size:12px; font-family:var(--mono); border:1px solid rgba(0,74,153,0.2); cursor:pointer; margin:0 6px 6px 0; background:transparent; color:var(--muted); }
  .chip.on { background:rgba(132,189,96,0.18); border-color:var(--mint); color:#2d7a1f; font-weight:700; }
  .cert-row { border:1px solid rgba(0,74,153,0.14); border-radius:14px; padding:16px; margin-bottom:14px; }
  .btn-p { background:linear-gradient(135deg,var(--jade),var(--teal)); color:#fff; padding:13px 28px; border-radius:100px; border:none; font-weight:700; font-size:14px; cursor:pointer; width:100%; }
  .btn-p:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-o { background:transparent; border:1.5px solid rgba(0,74,153,0.2); color:var(--text); padding:10px 20px; border-radius:100px; font-size:13px; cursor:pointer; font-family:var(--sans); }
  .photo-preview { width:88px; height:88px; border-radius:50%; object-fit:cover; border:2px solid rgba(0,74,153,0.2); }
  .err { background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.3); color:#c0392b; border-radius:10px; padding:12px 16px; font-size:13px; margin-bottom:20px; }
`;

const SPEC_OPTS = ["Elderly Care","Dementia Care","Post-Surgery","Palliative","Child Care","Diabetic Care","Critical Care","Cerebral Palsy","Mobility Assistance","Companionship","Driver / Transport"];
const CERT_LEVELS = ["HCA","Certificate III","Diploma","RN","BSN"];
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg","image/png","image/webp","application/pdf"];

function fmtBytes(n) { if (n<1024) return `${n}B`; if (n<1048576) return `${(n/1024).toFixed(1)}KB`; return `${(n/1048576).toFixed(1)}MB`; }
function toggle(arr, v) { return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v]; }

function readFileAsDataUrl(file, onLoaded) {
  if (!file) return;
  if (file.size > MAX_BYTES) { alert(`File too large (${fmtBytes(file.size)}). Max 10 MB.`); return; }
  if (!ALLOWED_TYPES.includes(file.type)) { alert("Invalid file type. Please upload a JPG, PNG, or PDF."); return; }
  const reader = new FileReader();
  reader.onload = ev => onLoaded({ fileName: file.name, fileType: file.type, fileSize: file.size, fileDataUrl: ev.target.result });
  reader.readAsDataURL(file);
}

function PhotoField({ value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div className="fg">
      <label className="fl">Profile Photo</label>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        {value?.fileDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.fileDataUrl} alt="Profile" className="photo-preview" />
        ) : (
          <div className="photo-preview" style={{display:"flex",alignItems:"center",justifyContent:"center",background:"#F0F4FA",fontSize:28}}>👤</div>
        )}
        <div>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png" style={{display:"none"}}
            onChange={e => { const f=e.target.files?.[0]; if (f) readFileAsDataUrl(f, onChange); }} />
          <button type="button" className="btn-o" onClick={()=>inputRef.current?.click()}>Choose Photo</button>
        </div>
      </div>
    </div>
  );
}

function CertRow({ cert, idx, onChange, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div className="cert-row">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div className="fg" style={{margin:0}}><label className="fl">Certificate Name</label><input className="fi" value={cert.name||""} onChange={e=>onChange(idx,{...cert,name:e.target.value})} /></div>
        <div className="fg" style={{margin:0}}><label className="fl">Issuer</label><input className="fi" value={cert.issuer||""} onChange={e=>onChange(idx,{...cert,issuer:e.target.value})} /></div>
      </div>
      <div className="fg"><label className="fl">Year</label><input className="fi" style={{maxWidth:140}} value={cert.year||""} onChange={e=>onChange(idx,{...cert,year:e.target.value})} /></div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}}
        onChange={e => { const f=e.target.files?.[0]; if (f) readFileAsDataUrl(f, patch => onChange(idx,{...cert,...patch})); }} />
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <button type="button" className="btn-o" onClick={()=>inputRef.current?.click()}>{cert.fileName ? "Replace File" : "Upload File"}</button>
        {cert.fileName && <span style={{fontSize:12,color:"var(--muted)"}}>✓ {cert.fileName} ({fmtBytes(cert.fileSize||0)})</span>}
        <button type="button" className="btn-o" style={{marginLeft:"auto",color:"var(--coral)",borderColor:"rgba(244,63,94,0.3)"}} onClick={()=>onRemove(idx)}>Remove</button>
      </div>
    </div>
  );
}

export default function EditApplication() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [app,     setApp]     = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const a = await getHcaApplicationByEditToken(token);
        const access = a?.formData?.editAccess;
        if (!a || !access || access.submitted) {
          setLoadErr("This link is invalid, expired, or has already been used. Please contact hello@e-vive.co.ke if you still need to update your application.");
        } else {
          setApp(a);
          setForm({
            fullName: a.fullName || "",
            email: a.email || "",
            mobile: a.mobile || "",
            county: a.county || "",
            certLevel: a.certLevel || "",
            yearsExp: a.yearsExp || 0,
            bio: a.bio || "",
            specialisations: a.specialisations || [],
            profilePhoto: a.formData?.profilePhoto || null,
            certifications: a.formData?.certifications?.length ? a.formData.certifications : [{ name:"", issuer:"", year:"", fileName:"", fileType:"", fileSize:0, fileDataUrl:"" }],
          });
        }
      } catch (e) {
        setLoadErr(e.message || "Could not load your application.");
      }
      setLoading(false);
    })();
  }, [token]);

  const fields = app?.formData?.editAccess?.fields || [];
  const note = app?.formData?.editAccess?.note || "";
  const has = (f) => fields.includes(f);
  const upd = (k,v) => setForm(p => ({ ...p, [k]: v }));

  async function submit() {
    setSaving(true);
    setSaveErr("");
    try {
      await submitApplicationEdit(token, form);
      setDone(true);
    } catch (e) {
      setSaveErr(e.message || "Failed to submit your updates. Please try again.");
    }
    setSaving(false);
  }

  return (
    <>
      <Head><title>Update Your Application — E-Vive</title><meta name="robots" content="noindex,nofollow" /></Head>
      <style>{BASE_CSS + CSS}</style>
      <div className="wrap">
        <div className="logo"><Link href="/" style={{textDecoration:"none"}}><div className="logo-text">e<span>-</span>vive</div></Link></div>
        <div className="card">
          {loading ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>Loading your application…</div>
          ) : loadErr ? (
            <div className="err">⚠ {loadErr}</div>
          ) : done ? (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <div className="title">Updates Submitted</div>
              <div className="sub">Thank you — our team will review your changes shortly. No further action is needed for now.</div>
              <Link href="/" className="btn-o" style={{display:"inline-block"}}>Back to Home</Link>
            </div>
          ) : (
            <>
              <div className="title">Update Your Application</div>
              <div className="sub">Our team has asked you to update the following before your application can proceed.</div>
              {note && <div className="note-box"><strong>Note from E-Vive:</strong> {note}</div>}

              {has("fullName") && <div className="fg"><label className="fl">Full Name</label><input className="fi" value={form.fullName} onChange={e=>upd("fullName",e.target.value)} /></div>}
              {has("email") && <div className="fg"><label className="fl">Email Address</label><input className="fi" type="email" value={form.email} onChange={e=>upd("email",e.target.value)} /></div>}
              {has("mobile") && <div className="fg"><label className="fl">Mobile Number</label><input className="fi" value={form.mobile} onChange={e=>upd("mobile",e.target.value)} /></div>}
              {has("county") && <div className="fg"><label className="fl">County</label><input className="fi" value={form.county} onChange={e=>upd("county",e.target.value)} /></div>}
              {has("certLevel") && (
                <div className="fg">
                  <label className="fl">Certificate Level</label>
                  <select className="fi" value={form.certLevel} onChange={e=>upd("certLevel",e.target.value)}>
                    <option value="">Select…</option>
                    {CERT_LEVELS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              )}
              {has("yearsExp") && <div className="fg"><label className="fl">Years of Experience</label><input className="fi" type="number" min={0} value={form.yearsExp} onChange={e=>upd("yearsExp",e.target.value)} /></div>}
              {has("bio") && <div className="fg"><label className="fl">Bio</label><textarea className="fi" rows={4} value={form.bio} onChange={e=>upd("bio",e.target.value)} /></div>}
              {has("specialisations") && (
                <div className="fg">
                  <label className="fl">Specialisations</label>
                  <div>{SPEC_OPTS.map(v => (
                    <button key={v} type="button" className={`chip${form.specialisations.includes(v)?" on":""}`} onClick={()=>upd("specialisations", toggle(form.specialisations, v))}>{v}</button>
                  ))}</div>
                </div>
              )}
              {has("profilePhoto") && <PhotoField value={form.profilePhoto} onChange={v=>upd("profilePhoto", v)} />}
              {has("certifications") && (
                <div className="fg">
                  <label className="fl">Certificates</label>
                  {form.certifications.map((c,i) => (
                    <CertRow key={i} cert={c} idx={i}
                      onChange={(idx,val)=>upd("certifications", form.certifications.map((x,j)=>j===idx?val:x))}
                      onRemove={(idx)=>upd("certifications", form.certifications.length>1 ? form.certifications.filter((_,j)=>j!==idx) : form.certifications)} />
                  ))}
                  <button type="button" className="btn-o" onClick={()=>upd("certifications", [...form.certifications, { name:"", issuer:"", year:"", fileName:"", fileType:"", fileSize:0, fileDataUrl:"" }])}>+ Add Another Certificate</button>
                </div>
              )}

              {saveErr && <div className="err">⚠ {saveErr}</div>}
              <button className="btn-p" onClick={submit} disabled={saving} style={{marginTop:12}}>{saving ? "Submitting…" : "Submit Updates"}</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
