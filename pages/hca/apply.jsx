import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { BASE_CSS } from "../../components/SharedStyles";
import { createHcaApplication } from "../../lib/store";

/* ─── Light-theme CSS ─────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --jade:   #004A99; --emerald:#002E6E; --mint:#84BD60;
    --gold:   #E8845A; --amber:  #F0A98B; --sky:#38bdf8;
    --teal:   #0ea5e9; --coral:  #f43f5e; --deep:#F0F4FA;
    --text:   #0F2035; --muted:  #5A7080; --border:rgba(0,74,153,0.14);
    --serif:  'Playfair Display',Georgia,serif;
    --sans:   'DM Sans',system-ui,sans-serif;
    --mono:   'DM Mono',monospace;
  }
  body {
    min-height:100vh; font-family:var(--sans); color:var(--text);
    background:linear-gradient(150deg,#EBF2FF 0%,#F0F4FA 50%,#EDF8F0 100%);
    padding:40px 16px 80px;
  }

  .reg-wrap { width:100%; max-width:720px; margin:0 auto; }
  .reg-logo  { text-align:center; margin-bottom:24px; }
  .reg-logo-text { font-family:var(--serif); font-size:28px; font-weight:700; color:var(--text); }
  .reg-logo-text span { color:var(--jade); }
  .reg-logo-sub { font-size:11px; color:var(--muted); font-family:var(--mono); letter-spacing:2px; text-transform:uppercase; margin-top:4px; }

  /* Stepper */
  .stepper { display:flex; align-items:center; justify-content:center; margin-bottom:30px; gap:0; }
  .sdot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; font-family:var(--mono); transition:all 0.3s; flex-shrink:0; }
  .sdot.done    { background:var(--jade); color:#fff; }
  .sdot.current { background:linear-gradient(135deg,var(--jade),var(--teal)); color:#fff; box-shadow:0 0 0 4px rgba(0,74,153,0.18); }
  .sdot.pending { background:#fff; color:var(--muted); border:2px solid rgba(0,74,153,0.18); }
  .sline       { flex:1; height:2px; max-width:60px; }
  .sline.done  { background:var(--jade); }
  .sline.pending { background:rgba(0,74,153,0.12); }
  .step-lbl    { font-size:10px; text-align:center; font-family:var(--mono); color:var(--muted); margin-top:6px; }
  .step-lbl.cur { color:var(--jade); font-weight:700; }
  .step-wrap   { display:flex; flex-direction:column; align-items:center; }

  /* Card */
  .reg-card {
    background:#fff;
    border:1px solid rgba(0,74,153,0.13);
    border-radius:24px;
    padding:40px;
    box-shadow:0 4px 40px rgba(0,74,153,0.08);
  }
  .step-title { font-family:var(--serif); font-size:22px; font-weight:700; color:var(--text); margin-bottom:5px; }
  .step-sub   { font-size:14px; color:var(--muted); margin-bottom:28px; line-height:1.65; font-weight:300; }

  /* Form fields */
  .frg   { margin-bottom:18px; }
  .fl    { font-size:11px; font-weight:700; color:var(--jade); letter-spacing:0.6px; font-family:var(--mono); text-transform:uppercase; margin-bottom:7px; display:block; }
  .fl .req { color:var(--coral); margin-left:2px; }
  .fi, .fsel, .fta {
    width:100%;
    background:#fff;
    border:1.5px solid rgba(0,74,153,0.18);
    border-radius:11px;
    padding:12px 15px;
    color:var(--text);
    font-family:var(--sans);
    font-size:14px;
    outline:none;
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .fi::placeholder  { color:rgba(90,112,128,0.5); }
  .fi:focus, .fsel:focus, .fta:focus {
    border-color:var(--jade);
    box-shadow:0 0 0 3px rgba(0,74,153,0.1);
  }
  .fsel  { cursor:pointer; }
  .fsel option { background:#fff; color:var(--text); }
  .fta   { resize:vertical; min-height:88px; line-height:1.6; }
  .fr2   { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .fr3   { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }

  /* Error */
  .ferr  { background:rgba(249,112,102,0.08); border:1px solid rgba(249,112,102,0.25); border-radius:10px; padding:11px 14px; font-size:13px; color:#c0392b; margin-bottom:16px; display:flex; align-items:center; gap:8px; }

  /* Section heading */
  .sec-head {
    font-size:11px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase;
    font-family:var(--mono); color:var(--jade);
    margin:26px 0 14px; display:flex; align-items:center; gap:8px;
    padding-bottom:8px; border-bottom:1px solid rgba(0,74,153,0.1);
  }

  /* Chips */
  .chip-grid { display:flex; flex-wrap:wrap; gap:8px; }
  .chip {
    padding:7px 14px; border-radius:100px; font-size:12px; font-weight:500;
    font-family:var(--mono); border:1.5px solid rgba(0,74,153,0.18);
    background:#fff; color:var(--muted); cursor:pointer; transition:all 0.2s; user-select:none;
  }
  .chip:hover  { border-color:rgba(0,74,153,0.4); color:var(--jade); background:rgba(0,74,153,0.04); }
  .chip.active { background:rgba(0,74,153,0.08); border-color:var(--jade); color:var(--jade); font-weight:700; }

  /* Certification block */
  .cert-block {
    background:linear-gradient(135deg,rgba(0,74,153,0.02),rgba(0,74,153,0.04));
    border:1.5px solid rgba(0,74,153,0.12);
    border-radius:16px; padding:20px; margin-bottom:14px;
  }
  .cert-block-title { font-size:13px; font-weight:700; color:var(--jade); margin-bottom:14px; display:flex; align-items:center; gap:8px; }
  .cert-num { width:26px; height:26px; border-radius:50%; background:var(--jade); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }

  /* Upload zone */
  .upload-zone {
    border:2px dashed rgba(0,74,153,0.25); border-radius:12px; padding:18px 16px;
    text-align:center; cursor:pointer; transition:all 0.22s;
    background:rgba(0,74,153,0.02);
  }
  .upload-zone:hover { border-color:var(--jade); background:rgba(0,74,153,0.05); }
  .upload-zone.has-file { border-color:var(--mint); background:rgba(132,189,96,0.05); border-style:solid; }
  .upload-zone-icon { font-size:24px; margin-bottom:6px; }
  .upload-zone-text { font-size:13px; color:var(--muted); }
  .upload-zone-text strong { color:var(--jade); }
  .upload-file-name { font-size:12px; color:var(--mint); font-family:var(--mono); font-weight:700; margin-top:4px; word-break:break-all; }
  .upload-file-size { font-size:11px; color:var(--muted); font-family:var(--mono); }
  .upload-change { font-size:11px; color:var(--jade); text-decoration:underline; cursor:pointer; margin-top:4px; display:inline-block; }
  .upload-thumb { max-width:80px; max-height:60px; border-radius:6px; margin:6px auto 0; display:block; border:1px solid rgba(0,74,153,0.15); object-fit:cover; }
  .add-cert-btn {
    width:100%; padding:12px; border-radius:11px;
    border:1.5px dashed rgba(0,74,153,0.25);
    background:#fff; color:var(--jade); cursor:pointer; font-weight:700; font-size:13px;
    font-family:var(--sans); transition:all 0.2s; margin-top:4px;
  }
  .add-cert-btn:hover { border-color:var(--jade); background:rgba(0,74,153,0.03); }

  /* Radio / check items */
  .radio-group { display:flex; gap:8px; flex-wrap:wrap; }
  .radio-item  {
    display:flex; align-items:center; gap:8px; cursor:pointer;
    font-size:13px; color:var(--muted); padding:8px 14px;
    border-radius:10px; border:1.5px solid rgba(0,74,153,0.15);
    background:#fff; transition:all 0.2s; user-select:none;
  }
  .radio-item:hover  { border-color:rgba(0,74,153,0.35); color:var(--text); }
  .radio-item.active { background:rgba(0,74,153,0.07); border-color:var(--jade); color:var(--jade); font-weight:600; }
  .radio-item input  { accent-color:var(--jade); flex-shrink:0; }

  /* Info box */
  .info-box {
    background:rgba(0,74,153,0.05); border:1.5px solid rgba(0,74,153,0.14);
    border-radius:11px; padding:13px 16px; font-size:13px; color:var(--muted);
    margin-top:14px; line-height:1.65;
  }
  .info-box.amber { background:rgba(240,169,139,0.08); border-color:rgba(232,132,90,0.2); }

  /* Plan */
  .plan-single {
    border-radius:18px; padding:28px 24px; border:2px solid var(--jade);
    background:rgba(0,74,153,0.04); margin-bottom:22px;
    box-shadow:0 0 0 3px rgba(0,74,153,0.08);
  }
  .plan-badge { display:inline-block; font-size:10px; font-weight:700; font-family:var(--mono); padding:2px 8px; border-radius:100px; margin-bottom:8px; background:rgba(132,189,96,0.15); color:#3a7d1c; }
  .plan-name  { font-family:var(--serif); font-size:20px; font-weight:700; margin-bottom:4px; }
  .plan-price { font-family:var(--serif); font-size:28px; font-weight:700; color:var(--jade); margin-bottom:14px; }
  .plan-price span { font-family:var(--sans); font-size:13px; color:var(--muted); font-weight:400; }
  .plan-feat  { font-size:13px; color:var(--muted); line-height:2.1; }
  .plan-feat li { list-style:none; display:flex; gap:6px; }
  .plan-feat li::before { content:"✓"; color:var(--mint); font-weight:700; }
  .pay-later-note {
    background:rgba(240,169,139,0.1); border:1.5px solid rgba(232,132,90,0.25);
    border-radius:12px; padding:14px 16px; font-size:13px; color:var(--muted);
    line-height:1.7; margin-bottom:16px;
  }

  /* Profile photo upload */
  .photo-zone {
    border:2px dashed rgba(0,74,153,0.25); border-radius:14px; padding:20px;
    text-align:center; cursor:pointer; transition:all 0.22s;
    background:rgba(0,74,153,0.02); display:flex; align-items:center; gap:18px;
  }
  .photo-zone:hover { border-color:var(--jade); background:rgba(0,74,153,0.05); }
  .photo-zone.has-photo { border-color:var(--mint); background:rgba(132,189,96,0.05); border-style:solid; }
  .photo-preview { width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid rgba(0,74,153,0.2); flex-shrink:0; }
  .photo-placeholder { width:80px; height:80px; border-radius:50%; background:rgba(0,74,153,0.07); display:flex; align-items:center; justify-content:center; font-size:32px; flex-shrink:0; }

  /* Success */
  .success-box { text-align:center; padding:12px 0; }

  /* Nav */
  .reg-nav { display:flex; justify-content:space-between; align-items:center; margin-top:28px; gap:12px; }
  .btn-p   { background:linear-gradient(135deg,#F0A98B,#E8845A); color:#0F2035; padding:12px 26px; border-radius:100px; border:none; font-family:var(--sans); font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 18px rgba(232,132,90,0.35); transition:all 0.25s; }
  .btn-p:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(232,132,90,0.48); }
  .btn-p:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
  .btn-o   { background:#fff; color:var(--text); padding:12px 26px; border-radius:100px; border:1.5px solid rgba(0,74,153,0.22); font-family:var(--sans); font-weight:600; font-size:14px; cursor:pointer; transition:all 0.25s; text-decoration:none; display:inline-flex; align-items:center; }
  .btn-o:hover { border-color:var(--jade); color:var(--jade); background:rgba(0,74,153,0.04); }
  .btn-sky { background:linear-gradient(135deg,var(--teal),#0284c7); color:#fff; padding:12px 26px; border-radius:100px; border:none; font-family:var(--sans); font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 16px rgba(14,165,233,0.32); transition:all 0.25s; }
  .btn-sky:hover { transform:translateY(-2px); }
  .btn-sky:disabled { opacity:0.45; cursor:not-allowed; transform:none; }

  @media(max-width:600px) {
    .fr2,.fr3 { grid-template-columns:1fr; }
    .plans-grid { grid-template-columns:1fr; }
    .reg-card { padding:22px 18px; }
    .step-lbl { display:none; }
  }
`;

const CARE_OPTS  = ["Elderly Care","Palliative","Dementia","Companionship","Critical Care","Diabetic Care","Cerebral Palsy","Visual Impairment","Mobility Assistance","Driver / Transport","Child Care","Post-Surgery","Mental Health"];
const LANG_OPTS  = ["English","Kiswahili","Kikuyu","Dholuo","Luhya","Kalenjin","Maasai","Kamba","French","German","Arabic","Sign Language"];
const SHIFT_OPTS = ["Day Shift","Night Shift","24-Hour Care"];
const PERIOD_OPTS= ["Short Term (1–2 weeks)","Long Term (2 weeks+)","Both"];
const TRAVEL_OPTS= ["Local Travel Only","International (with travel docs)"];
const LOCATIONS  = ["Nairobi CBD","Westlands","Karen","Kilimani","Kileleshwa","Lavington","Langata","Eastlands","Kasarani","Thika Road","Mombasa","Kisumu","Nakuru","Eldoret","Nyeri","Other"];
const RADIUS_OPTS= ["5 km","10 km","15 km","20 km","25 km","30 km","40 km+"];
const LISTING_FEE = { price: 100, per: "/month", feats: ["Profile listed on E-Vive platform","Placement match notifications","Training Hub access","WhatsApp & email support","Certificate badge on profile"] };
const STEP_LABELS = ["Personal","Professional","Skills","Review & Submit","Done"];
const MAX_DOB = new Date().toISOString().split("T")[0];

function toggle(arr, v) { return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v]; }
function fmtBytes(n) { if(n<1024)return `${n}B`; if(n<1048576)return `${(n/1024).toFixed(1)}KB`; return `${(n/1048576).toFixed(1)}MB`; }

/* ─── File upload zone per certificate ─────────────────────────────────────── */
function CertUploadZone({ cert, certIdx, onChange }) {
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Enforce 10 MB size limit — large base64 strings can crash localStorage
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      alert(`File too large (${fmtBytes(file.size)}). Please upload a file under 10 MB.`);
      e.target.value = "";
      return;
    }
    // Only allow image and PDF MIME types regardless of extension
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Invalid file type. Please upload a JPG, PNG, or PDF.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(certIdx, {
        ...cert,
        fileName:    file.name,
        fileType:    file.type,
        fileSize:    file.size,
        fileDataUrl: ev.target.result,
      });
    };
    reader.readAsDataURL(file);
  }

  const hasFile = !!cert.fileName;
  const isImage = cert.fileType?.startsWith("image/");

  return (
    <div className={`upload-zone${hasFile?" has-file":""}`}
      onClick={() => inputRef.current?.click()}
      style={{cursor:"pointer"}}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{display:"none"}}
        onChange={handleFile}
      />
      {hasFile ? (
        <>
          <div className="upload-zone-icon">{isImage ? "🖼️" : "📄"}</div>
          {isImage && cert.fileDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cert.fileDataUrl} alt="cert preview" className="upload-thumb" />
          )}
          <div className="upload-file-name">✓ {cert.fileName}</div>
          <div className="upload-file-size">{fmtBytes(cert.fileSize || 0)}</div>
          <span className="upload-change">Click to replace</span>
        </>
      ) : (
        <>
          <div className="upload-zone-icon">📎</div>
          <div className="upload-zone-text">
            <strong>Click to upload</strong> certificate scan<br/>
            <span style={{fontSize:11}}>PDF, JPG or PNG · max 10 MB</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────  */
export default function HCAApply() {
  const [step,   setStep]   = useState(0);
  const [care,   setCare]   = useState([]);
  const [langs,  setLangs]  = useState([]);
  const [shifts, setShifts] = useState([]);
  const [period, setPeriod] = useState([]);
  const [travel, setTravel] = useState([]);
  const [applyErr, setApplyErr] = useState("");
  const [certs,  setCerts]  = useState([{ name:"", issuer:"", year:"", fileName:"", fileType:"", fileSize:0, fileDataUrl:"" }]);
  const [profilePhoto, setProfilePhoto] = useState({ fileName:"", fileType:"", fileSize:0, fileDataUrl:"" });
  const profilePhotoRef = useRef(null);
  const [form,   setForm]   = useState({
    fname:"", lname:"", dob:"", gender:"", mobile:"", email:"",
    location:"", address:"", idNo:"", education:"", yearsExp:"", radius:"", bio:"", culturalExp:"",
    smartphone:"",
  });

  const upd = (f,v) => setForm(p=>({...p,[f]:v}));

  function updateCert(idx, newCert) {
    setCerts(p => p.map((c,j) => j===idx ? newCert : c));
  }
  function updateCertField(idx, field, val) {
    setCerts(p => p.map((c,j) => j===idx ? {...c,[field]:val} : c));
  }

  const can0 = !!(form.fname&&form.lname&&form.dob&&form.gender&&form.mobile&&form.email&&form.location&&form.idNo);
  const can1 = !!(form.education&&form.yearsExp&&form.smartphone&&certs[0]?.name&&certs[0]?.fileName&&profilePhoto.fileName);
  const can2 = !!(care.length>0&&langs.length>0&&shifts.length>0&&form.radius);
  const can3 = true;

  const canCurrent = [can0,can1,can2,can3,true][step];

  async function next() {
    if (!canCurrent) return;
    if (step===3) {
      try {
        await createHcaApplication({
          fullName:       `${form.fname} ${form.lname}`,
          email:          form.email,
          mobile:         form.mobile,
          password:       "evive2026",
          dob:            form.dob,
          gender:         form.gender,
          nationalId:     form.idNo,
          county:         form.location,
          address:        form.address,
          education:      form.education,
          yearsExp:       Number(form.yearsExp) || 0,
          certLevel:      certs[0]?.name || "HCA",
          certifications: certs.map(c => ({
            name:        c.name,
            issuer:      c.issuer,
            year:        c.year,
            fileName:    c.fileName || null,
            fileType:    c.fileType || null,
            fileSize:    c.fileSize || 0,
            fileDataUrl: c.fileDataUrl || null,
          })),
          profilePhoto: profilePhoto.fileName ? profilePhoto : null,
          specialisations: care,
          languages:      langs,
          shiftTypes:     shifts,
          period,
          travel,
          radius:         form.radius,
          bio:            form.bio,
          culturalExp:    form.culturalExp,
          smartphone:     form.smartphone,
          plan:           "Review and Listing Fee",
        });
        setApplyErr("");
      } catch(e) {
        setApplyErr(e?.message || "Application submission failed. Please try again.");
        return;
      }
    }
    setStep(s=>s+1);
  }

  return (
    <>
      <Head>
        <title>Apply as HCA — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{CSS}</style>

      <div className="reg-wrap">
        {/* Logo */}
        <div className="reg-logo">
          <Link href="/" style={{textDecoration:"none"}}>
            <div className="reg-logo-text">e<span>-</span>vive</div>
            <div className="reg-logo-sub">HomeCare Assistant — Registration</div>
          </Link>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEP_LABELS.map((lbl,i) => (
            <div key={i} style={{display:"contents"}}>
              <div className="step-wrap">
                <div className={`sdot ${i<step?"done":i===step?"current":"pending"}`}>
                  {i<step ? "✓" : i+1}
                </div>
                <div className={`step-lbl${i===step?" cur":""}`}>{lbl}</div>
              </div>
              {i < STEP_LABELS.length-1 && (
                <div className={`sline ${i<step?"done":"pending"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="reg-card">

          {applyErr && <div className="ferr">⚠ {applyErr}</div>}

          {/* ── STEP 0: Personal ── */}
          {step===0 && (
            <>
              <div className="step-title">Personal Information</div>
              <div className="step-sub">Your details are reviewed by E-Vive admin before your profile goes live. No contact information is publicly shared.</div>

              <div className="fr2">
                <div className="frg"><label className="fl">First Name <span className="req">*</span></label><input className="fi" placeholder="Jane" value={form.fname} onChange={e=>upd("fname",e.target.value)} /></div>
                <div className="frg"><label className="fl">Last Name <span className="req">*</span></label><input className="fi" placeholder="Wanjiku" value={form.lname} onChange={e=>upd("lname",e.target.value)} /></div>
              </div>
              <div className="frg"><label className="fl">Date of Birth <span className="req">*</span></label><input className="fi" type="date" max={MAX_DOB} value={form.dob} onChange={e=>upd("dob",e.target.value)} style={{display:"block",width:"100%"}} /></div>
              <div className="fr2">
                <div className="frg">
                  <label className="fl">Gender <span className="req">*</span></label>
                  <select className="fsel" value={form.gender} onChange={e=>upd("gender",e.target.value)}>
                    <option value="">Select…</option>
                    <option>Female</option><option>Male</option><option>Prefer not to say</option>
                  </select>
                </div>
                <div className="frg"><label className="fl">National ID No. <span className="req">*</span></label><input className="fi" placeholder="12345678" value={form.idNo} onChange={e=>upd("idNo",e.target.value)} /></div>
              </div>
              <div className="fr2">
                <div className="frg"><label className="fl">Mobile Number <span className="req">*</span></label><input className="fi" placeholder="+254 7…" value={form.mobile} onChange={e=>upd("mobile",e.target.value)} /></div>
                <div className="frg"><label className="fl">Email Address <span className="req">*</span></label><input className="fi" type="email" placeholder="jane@example.com" value={form.email} onChange={e=>upd("email",e.target.value)} /></div>
              </div>
              <div className="fr2">
                <div className="frg">
                  <label className="fl">Home Location <span className="req">*</span></label>
                  <select className="fsel" value={form.location} onChange={e=>upd("location",e.target.value)}>
                    <option value="">Select…</option>
                    {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="frg"><label className="fl">Estate / Street</label><input className="fi" placeholder="e.g. Kilimani, Rose Ave" value={form.address} onChange={e=>upd("address",e.target.value)} /></div>
              </div>
              <div className="info-box">ℹ️ Your home location calculates <strong style={{color:"var(--jade)"}}>service radius and travel time</strong> for placement matching — it is not displayed publicly.</div>
            </>
          )}

          {/* ── STEP 1: Professional ── */}
          {step===1 && (
            <>
              <div className="step-title">Education & Qualifications</div>
              <div className="step-sub">Upload your certificates — our admin team verifies each one before your profile goes live. Accepted formats: PDF, JPG, PNG.</div>

              <div className="fr2">
                <div className="frg">
                  <label className="fl">Highest Education <span className="req">*</span></label>
                  <select className="fsel" value={form.education} onChange={e=>upd("education",e.target.value)}>
                    <option value="">Select…</option>
                    <option>Certificate</option><option>Diploma</option><option>Bachelor&apos;s Degree</option><option>Higher National Diploma</option><option>Other</option>
                  </select>
                </div>
                <div className="frg"><label className="fl">Years of Experience <span className="req">*</span></label><input className="fi" type="number" min="0" max="40" placeholder="e.g. 5" value={form.yearsExp} onChange={e=>upd("yearsExp",e.target.value)} /></div>
              </div>
              <div className="frg">
                <label className="fl">Smartphone Make &amp; Model <span className="req">*</span></label>
                <input className="fi" placeholder="e.g. Samsung Galaxy A15, iPhone 13, Tecno Spark 20" value={form.smartphone} onChange={e=>upd("smartphone",e.target.value)} />
                <div style={{fontSize:11,color:"var(--muted)",marginTop:5,lineHeight:1.5}}>📱 E-Vive requires HCAs to maintain a working smartphone with mobile internet for GPS clock-in, Cardex submission, and platform communication.</div>
              </div>
              <div className="frg"><label className="fl">Professional Bio</label><textarea className="fta" placeholder="Describe your background, approach to care, and what makes you a great HCA…" value={form.bio} onChange={e=>upd("bio",e.target.value)} /></div>

              <div className="sec-head">🎓 Certifications &amp; Qualifications <span style={{color:"var(--coral)"}}>*</span></div>

              {certs.map((c,i) => (
                <div className="cert-block" key={i}>
                  <div className="cert-block-title">
                    <span className="cert-num">{i+1}</span>
                    Certification {i+1}
                    {certs.length>1 && (
                      <button style={{marginLeft:"auto",background:"none",border:"none",color:"var(--coral)",cursor:"pointer",fontSize:18,lineHeight:1,padding:"2px 6px"}}
                        onClick={()=>setCerts(p=>p.filter((_,j)=>j!==i))}>×</button>
                    )}
                  </div>
                  <div className="fr3">
                    <div className="frg">
                      <label className="fl">Certificate Name <span className="req">*</span></label>
                      <input className="fi" placeholder="e.g. CNA Certificate" value={c.name}
                        onChange={e=>updateCertField(i,"name",e.target.value)} />
                    </div>
                    <div className="frg">
                      <label className="fl">Issuing Body</label>
                      <input className="fi" placeholder="e.g. Kenya MoH" value={c.issuer}
                        onChange={e=>updateCertField(i,"issuer",e.target.value)} />
                    </div>
                    <div className="frg">
                      <label className="fl">Year Obtained</label>
                      <input className="fi" placeholder="2022" value={c.year} maxLength={4}
                        onChange={e=>updateCertField(i,"year",e.target.value)} />
                    </div>
                  </div>
                  <CertUploadZone cert={c} certIdx={i} onChange={updateCert} />
                </div>
              ))}

              <button className="add-cert-btn" onClick={()=>setCerts(p=>[...p,{name:"",issuer:"",year:"",fileName:"",fileType:"",fileSize:0,fileDataUrl:""}])}>
                + Add Another Certification
              </button>

              <div className="info-box" style={{marginTop:14}}>
                📎 <strong style={{color:"var(--jade)"}}>Upload required:</strong> You must upload a certificate file (PDF or image) for at least your first certification to proceed. Certifications must be renewed every <strong style={{color:"var(--jade)"}}>6 months</strong>.
              </div>

              <div className="sec-head" style={{marginTop:22}}>📸 Profile Photo <span style={{color:"var(--coral)"}}>*</span></div>
              <div style={{fontSize:13,color:"var(--muted)",marginBottom:12}}>Upload a clear, professional headshot. This photo will appear on your public E-Vive profile once approved. JPG or PNG, max 5 MB.</div>

              <input
                ref={profilePhotoRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                style={{display:"none"}}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { alert("Photo too large. Max 5 MB."); e.target.value = ""; return; }
                  if (!["image/jpeg","image/png"].includes(file.type)) { alert("Please upload a JPG or PNG photo."); e.target.value = ""; return; }
                  const reader = new FileReader();
                  reader.onload = ev => setProfilePhoto({ fileName: file.name, fileType: file.type, fileSize: file.size, fileDataUrl: ev.target.result });
                  reader.readAsDataURL(file);
                }}
              />
              <div
                className={`photo-zone${profilePhoto.fileName?" has-photo":""}`}
                onClick={() => profilePhotoRef.current?.click()}
              >
                {profilePhoto.fileDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhoto.fileDataUrl} alt="Profile" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">👤</div>
                )}
                <div style={{flex:1,textAlign:"left"}}>
                  {profilePhoto.fileName ? (
                    <>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--jade)"}}>{profilePhoto.fileName}</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{fmtBytes(profilePhoto.fileSize)} · Click to replace</div>
                    </>
                  ) : (
                    <>
                      <div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}><strong>Click to upload</strong> your profile photo</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>JPG or PNG · max 5 MB · must be a clear headshot</div>
                    </>
                  )}
                </div>
              </div>
              {!profilePhoto.fileName && (
                <div style={{fontSize:12,color:"var(--coral)",marginTop:8,fontWeight:600}}>⚠ Profile photo is required to proceed to the next step.</div>
              )}
            </>
          )}

          {/* ── STEP 2: Skills & Service ── */}
          {step===2 && (
            <>
              <div className="step-title">Skills, Languages &amp; Service Area</div>
              <div className="step-sub">This powers location-based matching. Be accurate — clients filter by exactly these criteria.</div>

              <div className="sec-head">🩺 Care Specialisations <span style={{color:"var(--coral)"}}>*</span></div>
              <div className="chip-grid">
                {CARE_OPTS.map(c=><button key={c} className={`chip${care.includes(c)?" active":""}`} onClick={()=>setCare(p=>toggle(p,c))}>{c}</button>)}
              </div>

              <div className="sec-head">🗣️ Languages Spoken <span style={{color:"var(--coral)"}}>*</span></div>
              <div className="chip-grid">
                {LANG_OPTS.map(l=><button key={l} className={`chip${langs.includes(l)?" active":""}`} onClick={()=>setLangs(p=>toggle(p,l))}>{l}</button>)}
              </div>

              <div className="sec-head">🌍 Cultural Exposure</div>
              <div className="frg"><textarea className="fta" style={{minHeight:64}} placeholder="e.g. Experienced with Somali, South Asian, Kenyan diaspora families. Comfortable with halal dietary requirements…" value={form.culturalExp} onChange={e=>upd("culturalExp",e.target.value)} /></div>

              <div className="sec-head">🌓 Shift Availability <span style={{color:"var(--coral)"}}>*</span></div>
              <div className="radio-group">
                {SHIFT_OPTS.map(s=><label key={s} className={`radio-item${shifts.includes(s)?" active":""}`} onClick={()=>setShifts(p=>toggle(p,s))}><input type="checkbox" checked={shifts.includes(s)} readOnly />{s}</label>)}
              </div>

              <div className="sec-head">📅 Preferred Care Period</div>
              <div className="radio-group">
                {PERIOD_OPTS.map(p=><label key={p} className={`radio-item${period.includes(p)?" active":""}`} onClick={()=>setPeriod(x=>toggle(x,p))}><input type="checkbox" checked={period.includes(p)} readOnly />{p}</label>)}
              </div>

              <div className="sec-head">✈️ Travel Availability</div>
              <div className="radio-group">
                {TRAVEL_OPTS.map(t=><label key={t} className={`radio-item${travel.includes(t)?" active":""}`} onClick={()=>setTravel(x=>toggle(x,t))}><input type="checkbox" checked={travel.includes(t)} readOnly />{t}</label>)}
              </div>

              <div className="sec-head">📍 Service Radius <span style={{color:"var(--coral)"}}>*</span></div>
              <div className="frg">
                <select className="fsel" value={form.radius} onChange={e=>upd("radius",e.target.value)}>
                  <option value="">Select maximum radius from home…</option>
                  {RADIUS_OPTS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="info-box">📍 Clients see you ranked by distance. A smaller radius means <strong style={{color:"var(--jade)"}}>faster matching</strong> and higher responsiveness scores.</div>
              <div className="info-box amber" style={{marginTop:10}}>💰 <strong style={{color:"var(--gold)"}}>Rates are set by E-Vive admin</strong> based on certification level, experience, and specialisation. Your assigned rate is communicated upon approval.</div>
            </>
          )}

          {/* ── STEP 3: Review & Submit ── */}
          {step===3 && (
            <>
              <div className="step-title">Review &amp; Submit Application</div>
              <div className="step-sub">Submit your application now. Our admin team will review it and contact you with payment instructions before your profile goes live.</div>

              <div className="plan-single">
                <span className="plan-badge">Review &amp; Listing</span>
                <div className="plan-name">Review and Listing Fee</div>
                <div className="plan-price">KSh {LISTING_FEE.price.toLocaleString()}<span>{LISTING_FEE.per}</span></div>
                <ul className="plan-feat">
                  {LISTING_FEE.feats.map(f=><li key={f}>{f}</li>)}
                </ul>
              </div>

              <div className="pay-later-note">
                💡 <strong style={{color:"var(--gold)"}}>Pay after review —</strong> you do <strong>not</strong> need to pay now. Submit your application first. Once E-Vive admin completes the review and interview, you will receive a payment link via email and WhatsApp. Your profile goes live after payment is confirmed.
              </div>

              <div style={{background:"rgba(0,74,153,0.04)",border:"1.5px solid rgba(0,74,153,0.12)",borderRadius:16,padding:"18px 20px",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>💳 Payment Options (after review)</div>
                <div className="fr2">
                  <div style={{padding:"14px 16px",background:"#fff",border:"1.5px solid rgba(0,74,153,0.15)",borderRadius:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>📱 M-Pesa STK Push</div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>Enter number → receive push → confirm</div>
                  </div>
                  <div style={{padding:"14px 16px",background:"#fff",border:"1.5px solid rgba(0,74,153,0.15)",borderRadius:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>💳 Card Payment</div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>Visa / Mastercard accepted</div>
                  </div>
                </div>
              </div>
              <div className="info-box">🔒 Your application is reviewed within <strong style={{color:"var(--jade)"}}>2 business days</strong>. You&apos;ll receive an interview invitation and payment instructions by email.</div>
            </>
          )}

          {/* ── STEP 4: Success ── */}
          {step===4 && (
            <div className="success-box">
              <div style={{fontSize:60,marginBottom:16}}>🩺</div>
              <div className="step-title">Application Received!</div>
              <div style={{fontSize:14,color:"var(--muted)",margin:"0 auto 24px",maxWidth:460,lineHeight:1.7,textAlign:"center"}}>
                Thank you for applying to the E-Vive HCA network. Our team will review your application and contact you within <strong style={{color:"var(--jade)"}}>2 business days</strong> to schedule an interview.
              </div>

              <div style={{background:"rgba(0,74,153,0.04)",border:"1.5px solid rgba(0,74,153,0.12)",borderRadius:16,padding:"18px 22px",marginBottom:24,textAlign:"left"}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:"var(--jade)"}}>📋 What Happens Next</div>
                {[
                  "Application acknowledged by E-Vive Admin",
                  "Interview scheduled (video or in-person)",
                  "Certificate & ID verification completed",
                  "Payment link sent — Review & Listing Fee (KSh 100/month)",
                  "Profile goes live once payment is confirmed — receive placement notifications",
                ].map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"9px 0",borderBottom:i<4?"1px solid rgba(0,74,153,0.07)":"none",fontSize:13,color:"var(--muted)",alignItems:"flex-start"}}>
                    <span style={{width:22,height:22,borderRadius:50,background:"var(--jade)",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</span>
                    {s}
                  </div>
                ))}
              </div>

              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <Link href="/hca/login" style={{background:"linear-gradient(135deg,var(--jade),var(--teal))",color:"#fff",padding:"12px 26px",borderRadius:"100px",textDecoration:"none",fontWeight:700,fontSize:14}}>
                  Go to HCA Login →
                </Link>
                <Link href="/" className="btn-o">Back to Home</Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="reg-nav">
              <div>
                {step>0
                  ? <button className="btn-o" onClick={()=>setStep(s=>s-1)}>← Back</button>
                  : <Link href="/" className="btn-o">← Home</Link>}
              </div>
              <button
                className="btn-sky"
                onClick={next}
                disabled={!canCurrent}
                style={{opacity:canCurrent?1:0.45,cursor:canCurrent?"pointer":"not-allowed"}}
              >
                {step===3 ? "Submit Application →" : "Continue →"}
              </button>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:22,fontSize:13,color:"var(--muted)"}}>
          Already registered? <Link href="/hca/login" style={{color:"var(--jade)",textDecoration:"none",fontWeight:600}}>Sign In to Dashboard →</Link>
        </div>
      </div>
    </>
  );
}
