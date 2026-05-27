import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { DASH_BASE } from "../../components/SharedStyles";

const CSS = `
  body { display:flex; min-height:100vh; align-items:flex-start; justify-content:center; padding:40px 16px 60px; background:var(--deep); }
  .reg-wrap { width:100%; max-width:700px; }
  .reg-logo { text-align:center; margin-bottom:28px; }
  .reg-logo-text { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--text); }
  .reg-logo-text span { color:var(--amber); }
  .reg-logo-sub { font-size:11px; color:var(--muted); font-family:var(--mono); letter-spacing:2px; text-transform:uppercase; margin-top:4px; }
  .stepper { display:flex; align-items:center; justify-content:center; margin-bottom:32px; }
  .sdot { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; font-family:var(--mono); transition:all 0.3s; flex-shrink:0; }
  .sdot.done    { background:var(--jade); color:var(--cream); }
  .sdot.current { background:linear-gradient(135deg,var(--teal),#0284c7); color:#fff; box-shadow:0 0 0 4px rgba(14,165,233,0.2); }
  .sdot.pending { background:rgba(255,255,255,0.06); color:var(--muted); border:1px solid rgba(168,0,64,0.12); }
  .sline { flex:1; height:2px; max-width:50px; }
  .sline.done { background:var(--jade); } .sline.pending { background:rgba(168,0,64,0.12); }
  .reg-card { background:linear-gradient(145deg,rgba(14,4,9,0.97),rgba(8,2,5,0.99)); border:1px solid rgba(14,165,233,0.18); border-radius:26px; padding:36px; }
  .step-title { font-family:var(--serif); font-size:22px; font-weight:700; margin-bottom:6px; }
  .step-sub   { font-size:14px; color:var(--muted); margin-bottom:26px; line-height:1.6; font-weight:300; }
  .frg  { margin-bottom:16px; }
  .fl   { font-size:11px; font-weight:600; color:var(--sky); letter-spacing:0.5px; font-family:var(--mono); text-transform:uppercase; margin-bottom:7px; display:block; }
  .fi, .fsel, .fta { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(14,165,233,0.2); border-radius:10px; padding:11px 15px; color:var(--text); font-family:var(--sans); font-size:14px; transition:all 0.22s; outline:none; }
  .fi:focus, .fsel:focus, .fta:focus { border-color:var(--sky); background:rgba(14,165,233,0.06); box-shadow:0 0 0 3px rgba(14,165,233,0.08); }
  .fsel option { background:var(--forest); }
  .fta { resize:vertical; min-height:80px; }
  .fr2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .fr3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .section-head { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:var(--mono); color:var(--muted); margin:22px 0 14px; display:flex; align-items:center; gap:8px; }
  .chip-grid { display:flex; flex-wrap:wrap; gap:8px; }
  .chip { padding:6px 14px; border-radius:100px; font-size:12px; font-weight:500; font-family:var(--mono); border:1px solid rgba(14,165,233,0.2); background:transparent; color:var(--muted); cursor:pointer; transition:all 0.2s; }
  .chip:hover  { border-color:rgba(14,165,233,0.4); color:var(--text); }
  .chip.active { background:rgba(14,165,233,0.14); border-color:var(--sky); color:var(--sky); }
  .cert-block { background:rgba(255,255,255,0.03); border:1px solid rgba(14,165,233,0.12); border-radius:14px; padding:16px; margin-bottom:12px; }
  .cert-block-title { font-size:13px; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
  .upload-box { border:1px dashed rgba(14,165,233,0.3); border-radius:10px; padding:16px; text-align:center; cursor:pointer; transition:all 0.22s; color:var(--muted); font-size:13px; }
  .upload-box:hover { border-color:var(--sky); color:var(--sky); background:rgba(14,165,233,0.04); }
  .radio-group { display:flex; gap:10px; flex-wrap:wrap; }
  .radio-item  { display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; color:var(--muted); padding:8px 14px; border-radius:10px; border:1px solid rgba(14,165,233,0.15); background:transparent; transition:all 0.2s; }
  .radio-item:hover { border-color:rgba(14,165,233,0.3); color:var(--text); }
  .radio-item.active { background:rgba(14,165,233,0.1); border-color:var(--sky); color:var(--sky); }
  .radio-item input { accent-color:var(--teal); }
  .info-box { background:rgba(14,165,233,0.07); border:1px solid rgba(14,165,233,0.18); border-radius:10px; padding:12px 16px; font-size:13px; color:var(--muted); margin-top:12px; line-height:1.6; }
  .plans-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
  .plan-card { border-radius:18px; padding:22px; border:1px solid rgba(14,165,233,0.15); background:rgba(255,255,255,0.03); cursor:pointer; transition:all 0.28s; }
  .plan-card.selected { background:linear-gradient(145deg,rgba(14,165,233,0.12),rgba(26,8,18,0.3)); border-color:var(--sky); }
  .plan-name  { font-family:var(--serif); font-size:18px; font-weight:700; margin-bottom:4px; }
  .plan-price { font-family:var(--serif); font-size:26px; font-weight:700; color:var(--sky); margin-bottom:12px; }
  .plan-price span { font-family:var(--sans); font-size:12px; color:var(--muted); font-weight:400; }
  .plan-feat  { font-size:12px; color:var(--muted); line-height:1.8; }
  .plan-feat li { list-style:none; display:flex; gap:7px; }
  .plan-feat li::before { content:"✓"; color:var(--sky); font-weight:700; }
  .success-box { text-align:center; padding:16px 0; }
  .reg-nav { display:flex; justify-content:space-between; align-items:center; margin-top:24px; gap:12px; }

  @media (max-width:580px) { .fr2,.fr3 { grid-template-columns:1fr; } .plans-grid { grid-template-columns:1fr; } .reg-card { padding:20px; } }
`;

const CARE_OPTS  = ["Elderly Care","Palliative","Dementia","Companionship","Critical Care","Diabetic Care","Cerebral Palsy","Visual Impairment","Mobility Assistance","Driver / Transport","Child Care","Post-Surgery","Mental Health"];
const LANG_OPTS  = ["English","Kiswahili","Kikuyu","Dholuo","Luhya","Kalenjin","Maasai","Kamba","French","German","Arabic","Sign Language"];
const SHIFT_OPTS = ["Day Shift","Night Shift","24-Hour Care"];
const PERIOD_OPTS= ["Short Term (1–2 weeks)","Long Term (2 weeks+)","Both"];
const TRAVEL_OPTS= ["Local Travel Only","International (with travel docs)"];
const LOCATIONS  = ["Nairobi CBD","Westlands","Karen","Kilimani","Kileleshwa","Lavington","Langata","Eastlands","Kasarani","Thika Road","Mombasa","Kisumu","Nakuru","Eldoret","Nyeri","Other"];
const RADIUS_OPTS= ["5 km","10 km","15 km","20 km","25 km","30 km","40 km+"];
const PLANS = [
  { name:"Basic", price:"KES 500", per:"/month", feats:["Listed in search results","1 active placement","Basic profile","Email support"] },
  { name:"Professional", price:"KES 1,200", per:"/month", feats:["Priority search listing","3 active placements","Full profile + cert badges","WhatsApp support","Training access"] },
  { name:"Premium", price:"KES 2,500", per:"/month", feats:["Top-of-search placement","Unlimited placements","Verified badge","Dedicated HCA manager","International placement eligible"] },
];

const STEP_LABELS = ["Personal","Professional","Skills & Service","Subscription","Done"];

function toggle(arr, v) { return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]; }

export default function HCAApply() {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(1);
  const [care,  setCare]  = useState([]);
  const [langs, setLangs] = useState([]);
  const [shifts,setShifts]= useState([]);
  const [period,setPeriod]= useState([]);
  const [travel,setTravel]= useState([]);
  const [certs, setCerts] = useState([{ name:"", issuer:"", year:"" }]);
  const [form, setForm] = useState({ fname:"",lname:"",dob:"",gender:"",mobile:"",email:"",location:"",address:"",idNo:"",education:"",yearsExp:"",radius:"",bio:"",culturalExp:"" });

  const upd = (f,v) => setForm(p=>({...p,[f]:v}));
  const can0 = form.fname&&form.lname&&form.dob&&form.gender&&form.mobile&&form.email&&form.location&&form.idNo;
  const can1 = form.education&&form.yearsExp&&certs[0].name;
  const can2 = care.length>0&&langs.length>0&&shifts.length>0&&form.radius;
  const can3 = true;

  function next() {
    if(step===0&&!can0) return;
    if(step===1&&!can1) return;
    if(step===2&&!can2) return;
    setStep(s=>s+1);
  }

  return (
    <>
      <Head>
        <title>Apply as HCA — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      <div className="reg-wrap">
        <div className="reg-logo">
          <Link href="/" style={{textDecoration:"none"}}>
            <div className="reg-logo-text">e<span>-</span>vive</div>
            <div className="reg-logo-sub">HomeCare Assistant — Registration</div>
          </Link>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEP_LABELS.map((l,i) => (
            <>
              <div key={`d-${i}`} className={`sdot ${i<step?"done":i===step?"current":"pending"}`}>{i<step?"✓":i+1}</div>
              {i<STEP_LABELS.length-1 && <div key={`l-${i}`} className={`sline ${i<step?"done":"pending"}`} />}
            </>
          ))}
        </div>

        <div className="reg-card">

          {/* ── STEP 0: Personal ── */}
          {step===0 && (
            <>
              <div className="step-title">Personal Information</div>
              <div className="step-sub">Your details will be reviewed by E-Vive admin before your profile goes live. No contact information is publicly shared.</div>
              <div className="fr2">
                <div className="frg"><label className="fl">First Name *</label><input className="fi" placeholder="Jane" value={form.fname} onChange={e=>upd("fname",e.target.value)} /></div>
                <div className="frg"><label className="fl">Last Name *</label><input className="fi" placeholder="Wanjiku" value={form.lname} onChange={e=>upd("lname",e.target.value)} /></div>
              </div>
              <div className="fr3">
                <div className="frg"><label className="fl">Date of Birth *</label><input className="fi" type="date" value={form.dob} onChange={e=>upd("dob",e.target.value)} /></div>
                <div className="frg">
                  <label className="fl">Gender *</label>
                  <select className="fsel" value={form.gender} onChange={e=>upd("gender",e.target.value)}>
                    <option value="">Select...</option>
                    <option>Female</option><option>Male</option><option>Prefer not to say</option>
                  </select>
                </div>
                <div className="frg"><label className="fl">National ID No. *</label><input className="fi" placeholder="12345678" value={form.idNo} onChange={e=>upd("idNo",e.target.value)} /></div>
              </div>
              <div className="fr2">
                <div className="frg"><label className="fl">Mobile Number *</label><input className="fi" placeholder="+254 7..." value={form.mobile} onChange={e=>upd("mobile",e.target.value)} /></div>
                <div className="frg"><label className="fl">Email Address *</label><input className="fi" type="email" placeholder="jane@..." value={form.email} onChange={e=>upd("email",e.target.value)} /></div>
              </div>
              <div className="fr2">
                <div className="frg">
                  <label className="fl">Home Location *</label>
                  <select className="fsel" value={form.location} onChange={e=>upd("location",e.target.value)}>
                    <option value="">Select...</option>
                    {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="frg"><label className="fl">Estate / Street</label><input className="fi" placeholder="e.g. Kilimani, Rose Ave" value={form.address} onChange={e=>upd("address",e.target.value)} /></div>
              </div>
              <div className="info-box">ℹ️ Your home location is used to calculate <strong style={{color:"var(--sky)"}}>service radius and travel time</strong> for placement matching. It will not be displayed publicly.</div>
            </>
          )}

          {/* ── STEP 1: Professional ── */}
          {step===1 && (
            <>
              <div className="step-title">Education & Experience</div>
              <div className="step-sub">Provide your professional background. All certificates must be uploaded and will be verified by our admin team before your profile is approved.</div>
              <div className="fr2">
                <div className="frg">
                  <label className="fl">Highest Education *</label>
                  <select className="fsel" value={form.education} onChange={e=>upd("education",e.target.value)}>
                    <option value="">Select...</option>
                    <option>Certificate</option><option>Diploma</option><option>Bachelor&apos;s Degree</option><option>Higher National Diploma</option><option>Other</option>
                  </select>
                </div>
                <div className="frg"><label className="fl">Years of Experience *</label><input className="fi" type="number" min="0" max="40" placeholder="e.g. 5" value={form.yearsExp} onChange={e=>upd("yearsExp",e.target.value)} /></div>
              </div>
              <div className="frg"><label className="fl">Professional Bio</label><textarea className="fta" placeholder="Briefly describe your background, approach to care, and what makes you a great HCA..." value={form.bio} onChange={e=>upd("bio",e.target.value)} /></div>

              <div className="section-head">🎓 Certifications & Qualifications *</div>
              {certs.map((c,i) => (
                <div className="cert-block" key={i}>
                  <div className="cert-block-title">
                    <span style={{width:24,height:24,borderRadius:"50%",background:"rgba(14,165,233,0.2)",color:"var(--sky)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{i+1}</span>
                    Certification {i+1}
                    {certs.length>1 && <button style={{marginLeft:"auto",background:"none",border:"none",color:"var(--coral)",cursor:"pointer",fontSize:13}} onClick={()=>setCerts(p=>p.filter((_,j)=>j!==i))}>✕</button>}
                  </div>
                  <div className="fr3">
                    <div className="frg"><label className="fl">Certificate Name *</label><input className="fi" placeholder="e.g. CNA Certificate" value={c.name} onChange={e=>setCerts(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} /></div>
                    <div className="frg"><label className="fl">Issuing Body</label><input className="fi" placeholder="e.g. Kenya MoH" value={c.issuer} onChange={e=>setCerts(p=>p.map((x,j)=>j===i?{...x,issuer:e.target.value}:x))} /></div>
                    <div className="frg"><label className="fl">Year Obtained</label><input className="fi" placeholder="2022" value={c.year} onChange={e=>setCerts(p=>p.map((x,j)=>j===i?{...x,year:e.target.value}:x))} /></div>
                  </div>
                  <div className="upload-box" onClick={()=>{}}>📎 Click to upload certificate scan (PDF / JPG)</div>
                </div>
              ))}
              <button style={{width:"100%",padding:"11px",borderRadius:10,border:"1px dashed rgba(14,165,233,0.3)",background:"transparent",color:"var(--sky)",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"var(--sans)",transition:"all 0.2s"}} onClick={()=>setCerts(p=>[...p,{name:"",issuer:"",year:""}])}>+ Add Another Certification</button>
              <div className="info-box" style={{marginTop:14}}>📋 You must update certifications every <strong style={{color:"var(--sky)"}}>6 months</strong>. Expired certifications will trigger a profile hold until renewed.</div>
            </>
          )}

          {/* ── STEP 2: Skills & Service ── */}
          {step===2 && (
            <>
              <div className="step-title">Skills, Languages & Service Area</div>
              <div className="step-sub">This information powers the location-based matching. Be accurate — clients filter by exactly these criteria.</div>

              <div className="section-head"><span>🩺</span>Care Specialisations * (select all that apply)</div>
              <div className="chip-grid">
                {CARE_OPTS.map(c=><button key={c} className={`chip${care.includes(c)?" active":""}`} onClick={()=>setCare(p=>toggle(p,c))}>{c}</button>)}
              </div>

              <div className="section-head"><span>🗣️</span>Languages Spoken *</div>
              <div className="chip-grid">
                {LANG_OPTS.map(l=><button key={l} className={`chip${langs.includes(l)?" active":""}`} onClick={()=>setLangs(p=>toggle(p,l))}>{l}</button>)}
              </div>

              <div className="section-head"><span>🌍</span>Cultural Exposure</div>
              <div className="frg"><textarea className="fta" style={{minHeight:60}} placeholder="e.g. Experienced working with Somali, South Asian and Kenyan diaspora families. Comfortable with halal dietary requirements..." value={form.culturalExp} onChange={e=>upd("culturalExp",e.target.value)} /></div>

              <div className="section-head"><span>🌓</span>Shift Availability *</div>
              <div className="radio-group">
                {SHIFT_OPTS.map(s=><label key={s} className={`radio-item${shifts.includes(s)?" active":""}`} onClick={()=>setShifts(p=>toggle(p,s))}><input type="checkbox" checked={shifts.includes(s)} readOnly />{s}</label>)}
              </div>

              <div className="section-head"><span>📅</span>Preferred Care Period *</div>
              <div className="radio-group">
                {PERIOD_OPTS.map(p=><label key={p} className={`radio-item${period.includes(p)?" active":""}`} onClick={()=>setPeriod(x=>toggle(x,p))}><input type="checkbox" checked={period.includes(p)} readOnly />{p}</label>)}
              </div>

              <div className="section-head"><span>✈️</span>Travel Availability</div>
              <div className="radio-group">
                {TRAVEL_OPTS.map(t=><label key={t} className={`radio-item${travel.includes(t)?" active":""}`} onClick={()=>setTravel(x=>toggle(x,t))}><input type="checkbox" checked={travel.includes(t)} readOnly />{t}</label>)}
              </div>

              <div className="section-head"><span>📍</span>Service Radius</div>
              <div className="frg">
                <label className="fl">Max Service Radius from Home *</label>
                <select className="fsel" value={form.radius} onChange={e=>upd("radius",e.target.value)}>
                  <option value="">Select radius...</option>
                  {RADIUS_OPTS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="info-box">📍 Clients will see you ranked by distance. A smaller service radius means <strong style={{color:"var(--sky)"}}>faster matching</strong> and higher responsiveness scores.</div>
              <div className="info-box" style={{marginTop:10, borderColor:"rgba(232,213,168,0.25)", background:"rgba(232,213,168,0.07)"}}>💰 <strong style={{color:"var(--amber)"}}>Rates are set by E-Vive administration</strong> based on your certification level, experience, and care specialisation. You will be informed of your assigned rate upon approval.</div>
            </>
          )}

          {/* ── STEP 3: Subscription ── */}
          {step===3 && (
            <>
              <div className="step-title">Choose Your Subscription</div>
              <div className="step-sub">Select a plan to list your profile and receive placement notifications. You can upgrade anytime.</div>
              <div className="plans-grid">
                {PLANS.map((p,i)=>(
                  <div key={p.name} className={`plan-card${plan===i?" selected":""}`} onClick={()=>setPlan(i)}>
                    <div className="plan-name">{p.name}</div>
                    <div className="plan-price">{p.price}<span>{p.per}</span></div>
                    <ul className="plan-feat">{p.feats.map(f=><li key={f}>{f}</li>)}</ul>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(168,0,64,0.12)",borderRadius:14,padding:"16px 20px",marginBottom:14}}>
                <div style={{fontWeight:700,marginBottom:6}}>Payment</div>
                <div className="fr2">
                  <div style={{padding:"12px 16px",background:"rgba(14,165,233,0.07)",border:"1px solid rgba(14,165,233,0.18)",borderRadius:10,cursor:"pointer"}}>
                    <div style={{fontSize:13,fontWeight:700}}>📱 M-Pesa STK Push</div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Enter your number → receive push → pay</div>
                  </div>
                  <div style={{padding:"12px 16px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(168,0,64,0.12)",borderRadius:10,cursor:"pointer"}}>
                    <div style={{fontSize:13,fontWeight:700}}>💳 Card Payment</div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Visa / Mastercard accepted</div>
                  </div>
                </div>
              </div>
              <div className="info-box">🔒 Your application will be reviewed by E-Vive admin within <strong style={{color:"var(--sky)"}}>2 business days</strong>. You&apos;ll receive an interview invitation by email.</div>
            </>
          )}

          {/* ── STEP 4: Success ── */}
          {step===4 && (
            <div className="success-box">
              <div style={{fontSize:56,marginBottom:16}}>🩺</div>
              <div className="step-title">Application Received!</div>
              <div className="step-sub" style={{margin:"0 auto 24px",maxWidth:480,display:"block",textAlign:"center"}}>Thank you for applying to join the E-Vive HCA network. Our team will review your application and contact you within <strong style={{color:"var(--sky)"}}>2 business days</strong> to schedule an interview.</div>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(14,165,233,0.15)",borderRadius:14,padding:"18px 22px",marginBottom:24,textAlign:"left"}}>
                <div style={{fontWeight:700,marginBottom:12}}>What Happens Next:</div>
                {["Application acknowledged by E-Vive Admin","Interview scheduled (video or in-person)","Certificate & ID verification","Contract issued for digital signing","Profile goes live — you start receiving placement notifications"].map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<4?"1px solid rgba(168,0,64,0.07)":"none",fontSize:13,color:"var(--muted)"}}>
                    <span style={{color:"var(--sky)",fontWeight:700,minWidth:20}}>{i+1}.</span>{s}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <Link href="/hca/dashboard" className="btn-sky">Go to HCA Dashboard →</Link>
                <Link href="/" className="btn-o">Back to Home</Link>
              </div>
            </div>
          )}

          {/* Nav */}
          {step < 4 && (
            <div className="reg-nav">
              <div>
                {step>0 ? <button className="btn-o" onClick={()=>setStep(s=>s-1)}>← Back</button>
                         : <Link href="/match" className="btn-o">← Browse Platform</Link>}
              </div>
              <button className="btn-sky" onClick={next} disabled={(step===0&&!can0)||(step===1&&!can1)||(step===2&&!can2)} style={{opacity:((step===0&&!can0)||(step===1&&!can1)||(step===2&&!can2))?0.45:1,cursor:((step===0&&!can0)||(step===1&&!can1)||(step===2&&!can2))?"not-allowed":"pointer"}}>
                {step===3?"Submit Application →":"Continue →"}
              </button>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"var(--muted)"}}>
          Already registered? <Link href="/hca/dashboard" style={{color:"var(--sky)",textDecoration:"none",fontWeight:600}}>Go to HCA Dashboard →</Link>
        </div>
      </div>
    </>
  );
}
