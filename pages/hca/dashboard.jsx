import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { DASH_BASE } from "../../components/SharedStyles";

const CSS = `
  /* Clock-in panel */
  .clockin-panel { background:linear-gradient(145deg,rgba(0,20,60,0.3),rgba(0,14,40,0.5)); border:2px solid rgba(0,74,153,0.3); border-radius:22px; padding:28px; margin-bottom:24px; }
  .clockin-panel.clocked { background:linear-gradient(145deg,rgba(14,165,233,0.12),rgba(0,14,40,0.4)); border-color:rgba(14,165,233,0.35); }
  .clockin-panel.clocked-out { background:linear-gradient(145deg,rgba(249,112,102,0.08),rgba(0,14,40,0.3)); border-color:rgba(249,112,102,0.2); }
  .clock-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:12px; }
  .clock-time { font-family:var(--mono); font-size:36px; font-weight:700; color:var(--mint); letter-spacing:2px; }
  .clock-time.blue { color:var(--sky); }
  .clock-meta { font-size:12px; color:var(--muted); font-family:var(--mono); margin-top:4px; }
  .gps-badge { display:inline-flex; align-items:center; gap:7px; padding:7px 14px; background:rgba(0,74,153,0.1); border:1px solid rgba(0,74,153,0.22); border-radius:100px; font-size:12px; font-weight:600; color:var(--mint); font-family:var(--mono); }
  .gps-dot { width:8px; height:8px; border-radius:50%; background:var(--mint); animation:pulse-dot 1.5s infinite; }
  .patient-banner { background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.15); border-radius:14px; padding:14px 18px; display:flex; align-items:center; gap:14px; margin-bottom:16px; }
  .pat-av { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,var(--jade),var(--emerald)); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .pat-name { font-weight:700; font-size:14px; margin-bottom:2px; }
  .pat-meta { font-size:12px; color:var(--muted); }
  .shift-timer { background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.2); border-radius:12px; padding:12px 18px; font-family:var(--mono); font-size:13px; color:var(--sky); display:flex; align-items:center; gap:10px; }
  .clockin-btns { display:flex; gap:12px; flex-wrap:wrap; }

  /* Cardex */
  .cardex-wrap { background:rgba(0,8,24,0.9); border:1px solid rgba(14,165,233,0.2); border-radius:20px; overflow:hidden; }
  .cardex-header { background:linear-gradient(135deg,rgba(14,165,233,0.12),rgba(0,14,40,0.4)); padding:20px 26px; border-bottom:1px solid rgba(14,165,233,0.15); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
  .cardex-title  { font-family:var(--serif); font-size:18px; font-weight:700; }
  .cardex-meta   { font-size:12px; color:var(--muted); font-family:var(--mono); margin-top:3px; }
  .cardex-body   { padding:22px 26px; }
  .cardex-section { margin-bottom:24px; }
  .cs-title { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:var(--mono); color:var(--sky); margin-bottom:14px; display:flex; align-items:center; gap:8px; padding-bottom:8px; border-bottom:1px solid rgba(14,165,233,0.1); }
  .vital-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  .vital-box  { background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.15); border-radius:12px; padding:12px; }
  .vital-label { font-size:11px; color:var(--muted); font-family:var(--mono); margin-bottom:5px; }
  .vital-input { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(0,74,153,0.28); color:var(--text); font-family:var(--mono); font-size:16px; font-weight:700; padding:4px 0; outline:none; transition:border-color 0.2s; }
  .vital-input:focus { border-bottom-color:var(--mint); }
  .vital-unit  { font-size:10px; color:var(--muted); margin-top:3px; font-family:var(--mono); }
  .med-row { display:flex; gap:10px; margin-bottom:10px; align-items:flex-start; }
  .med-row input, .med-row select { flex:1; background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.18); border-radius:8px; padding:8px 12px; color:var(--text); font-family:var(--sans); font-size:13px; outline:none; transition:border-color 0.2s; }
  .med-row input:focus, .med-row select:focus { border-color:var(--mint); }
  .med-row option { background:var(--forest); }
  .add-row-btn { background:transparent; border:1px dashed rgba(0,74,153,0.3); border-radius:8px; padding:8px 14px; color:var(--mint); font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .add-row-btn:hover { border-color:var(--mint); background:rgba(0,74,153,0.06); }
  .del-btn { background:rgba(249,112,102,0.1); border:1px solid rgba(249,112,102,0.2); border-radius:8px; padding:8px 10px; color:var(--coral); cursor:pointer; font-size:14px; transition:all 0.2s; flex-shrink:0; }
  .del-btn:hover { background:rgba(249,112,102,0.18); }
  .incident-row { display:grid; grid-template-columns:1fr 1fr 2fr; gap:10px; margin-bottom:10px; }
  .incidents-area { width:100%; background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.18); border-radius:10px; padding:12px; color:var(--text); font-family:var(--sans); font-size:13px; outline:none; resize:vertical; min-height:100px; line-height:1.65; }
  .incidents-area:focus { border-color:var(--mint); }
  .checklist-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; background:rgba(0,74,153,0.04); border:1px solid rgba(0,74,153,0.1); margin-bottom:8px; cursor:pointer; transition:all 0.2s; }
  .checklist-item:hover { border-color:rgba(0,74,153,0.22); }
  .checklist-item.checked { background:rgba(0,74,153,0.1); border-color:rgba(0,74,153,0.25); }
  .checklist-item.flagged { background:rgba(249,112,102,0.06); border-color:rgba(249,112,102,0.2); }
  .cl-check { width:20px; height:20px; border-radius:6px; border:2px solid rgba(0,74,153,0.35); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; transition:all 0.2s; }
  .cl-check.checked { background:var(--jade); border-color:var(--jade); color:var(--cream); }
  .cl-check.flagged { background:rgba(249,112,102,0.15); border-color:var(--coral); color:var(--coral); }
  .cl-text { flex:1; font-size:13px; }
  .flag-btn { padding:5px 10px; border-radius:8px; background:rgba(249,112,102,0.1); border:1px solid rgba(249,112,102,0.2); color:var(--coral); font-size:11px; font-weight:700; cursor:pointer; font-family:var(--mono); }
  .cardex-footer { padding:18px 26px; border-top:1px solid rgba(14,165,233,0.12); background:rgba(14,165,233,0.04); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .save-info { font-size:12px; color:var(--muted); font-family:var(--mono); }
  .save-info span { color:var(--mint); }

  /* Shift history */
  .shift-hist-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(0,74,153,0.1); }
  .shift-hist-row:last-child { border-bottom:none; }
  .shr-date { font-family:var(--mono); font-size:12px; color:var(--muted); min-width:80px; }
  .shr-pat  { flex:1; font-size:13px; }
  .shr-type { font-size:11px; color:var(--amber); font-family:var(--mono); min-width:80px; }
  .shr-dur  { font-size:12px; color:var(--muted); font-family:var(--mono); min-width:60px; }

  /* Welfare */
  .welfare-opts { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px; }
  .welfare-opt  { background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.15); border-radius:14px; padding:18px; cursor:pointer; transition:all 0.28s; text-align:center; }
  .welfare-opt:hover { border-color:rgba(0,74,153,0.3); transform:translateY(-2px); }
  .welfare-opt-icon { font-size:28px; margin-bottom:8px; }
  .welfare-opt-title { font-size:13px; font-weight:700; margin-bottom:4px; }
  .welfare-opt-sub   { font-size:12px; color:var(--muted); }
`;

const SHIFT_HIST = [
  { date:"Mon 5 May", pat:"Margaret Wanjiku", type:"Day Shift",   dur:"8h 12m", status:"Submitted",  cls:"badge-mint"  },
  { date:"Tue 6 May", pat:"Margaret Wanjiku", type:"Day Shift",   dur:"8h 05m", status:"Submitted",  cls:"badge-mint"  },
  { date:"Wed 7 May", pat:"Margaret Wanjiku", type:"Day Shift",   dur:"Active", status:"In Progress",cls:"badge-gold"  },
  { date:"Thu 8 May", pat:"Margaret Wanjiku", type:"Day Shift",   dur:"—",      status:"Upcoming",   cls:"badge-dim"   },
  { date:"Fri 9 May", pat:"Margaret Wanjiku", type:"Night Shift", dur:"—",      status:"Upcoming",   cls:"badge-dim"   },
];

const SPECIAL_NEEDS = [
  "Turn patient every 2 hours to prevent pressure sores",
  "No dairy products — lactose intolerant",
  "Administer prescribed dementia medication at 8AM & 8PM",
  "Ensure patient has glasses when awake",
  "Encourage 6–8 glasses of fluid daily",
  "Daily skin inspection for redness or sores",
  "Gentle range-of-motion exercises twice daily",
];

const NAV_ITEMS = [
  { icon:"📊", label:"Today",       key:"today"    },
  { icon:"📋", label:"Cardex",      key:"cardex"   },
  { icon:"📅", label:"Calendar",    key:"calendar" },
  { icon:"👤", label:"My Profile",  key:"profile"  },
  { icon:"🎓", label:"Training",    key:"training" },
  { icon:"💙", label:"Welfare",     key:"welfare"  },
  { icon:"💳", label:"Earnings",    key:"earnings" },
];

const ROUTES_ADMIN = ["Kileleshwa","Karen","Kilimani","Westlands","Lavington","Langata","Upper Hill","Parklands"];

function useTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    };
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useDuration(start) {
  const [dur, setDur] = useState("00:00:00");
  useEffect(() => {
    if (!start) return;
    const tick = () => {
      const secs = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(secs/3600)).padStart(2,"0");
      const m = String(Math.floor((secs%3600)/60)).padStart(2,"0");
      const s = String(secs%60).padStart(2,"0");
      setDur(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);
  return dur;
}

export default function HCADashboard() {
  const [tab,       setTab]       = useState("today");
  const [clockState,setClockState]= useState("out"); // out | in | submitted
  const [clockStart,setClockStart]= useState(null);
  const [cardexOpen,setCardexOpen]= useState(false);
  const [authed,    setAuthed]    = useState(false);
  const [hcaId,     setHcaId]     = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("hca_auth")) {
      window.location.href = "/hca/login";
    } else {
      setAuthed(true);
      setHcaId(localStorage.getItem("hca_id") || "");
    }
  }, []);

  // Cardex state
  const [vitals,  setVitals]   = useState({ temp:"36.8",pulse:"74",bpSys:"120",bpDia:"80",spo2:"97",rr:"16",gcs:"15",pain:"2",bgl:"" });
  const [meds,    setMeds]     = useState([{ time:"08:00",drug:"Donepezil",dose:"5mg",route:"Oral",notes:"Given with water" }]);
  const [intakes, setIntakes]  = useState([{ type:"Oral Fluids",amount:"200",unit:"ml" }]);
  const [nutrition,setNutrition]=useState({ breakfast:"Full",lunch:"Half",dinner:"",supplement:"" });
  const [hygiene, setHygiene]  = useState({ bath:false,oral:false,reposition:false,skin:false });
  const [mobility,setMobility] = useState({ exercises:false,transfer:false,ambulation:false });
  const [elimination,setElim]  = useState({ urine:"Yes",bowel:"No",notes:"" });
  const [mentalSt,setMentalSt] = useState({ orientation:"Partially",mood:"Calm",behaviour:"No concerns" });
  const [incidents,setIncidents]=useState("");
  const [handover, setHandover] = useState("");
  const [shiftRating,setShiftRating]=useState(0);
  const [welfareNote,setWelfareNote]=useState("");
  const [checks,   setChecks]   = useState(SPECIAL_NEEDS.map(()=>false));
  const [flags,    setFlags]    = useState(SPECIAL_NEEDS.map(()=>false));
  const [savedAt,  setSavedAt]  = useState(null);

  const time    = useTime();
  const duration= useDuration(clockStart);

  function clockIn() { setClockState("in"); setClockStart(Date.now()); setTab("cardex"); setCardexOpen(true); }
  function saveDraft() { setSavedAt(new Date().toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})); }
  function submitCardex() { setClockState("submitted"); setTab("today"); }
  function clockOut() { setClockState("out"); setClockStart(null); setCardexOpen(false); }
  function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hca_auth");
      localStorage.removeItem("hca_id");
    }
    window.location.href = "/hca/login";
  }

  if (!authed) return null;

  const updVital = (k,v) => setVitals(p=>({...p,[k]:v}));
  const addMed   = () => setMeds(p=>[...p,{time:"",drug:"",dose:"",route:"Oral",notes:""}]);
  const addIntake= () => setIntakes(p=>[...p,{type:"",amount:"",unit:"ml"}]);
  const toggleCheck = i => setChecks(p=>p.map((v,idx)=>idx===i?!v:v));
  const toggleFlag  = i => setFlags(p=>p.map((v,idx)=>idx===i?!v:v));

  return (
    <>
      <Head>
        <title>HCA Dashboard — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      <div className="dash-wrap">
        {/* ── SIDEBAR ── */}
        <aside className="dash-side">
          <div className="dash-logo">
            <Link href="/" style={{textDecoration:"none"}}>
              <div className="dash-logo-text">e<span>-</span>vive</div>
              <div className="dash-logo-sub">HCA Portal</div>
            </Link>
          </div>
          <div className="dash-user">
            <div className="dash-avatar">👩🏾</div>
            <div>
              <div className="dash-user-name">{hcaId || "HCA Staff"}</div>
              <div className="dash-user-role">CNA · {hcaId || "HCA Portal"}</div>
            </div>
          </div>
          <div style={{padding:"10px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:10,background:clockState==="in"?"rgba(14,165,233,0.1)":"rgba(0,74,153,0.04)",border:clockState==="in"?"1px solid rgba(14,165,233,0.2)":"1px solid rgba(0,74,153,0.1)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:clockState==="in"?"var(--sky)":clockState==="submitted"?"var(--mint)":"var(--coral)",animation:clockState==="in"?"pulse-dot 1.5s infinite":"none",flexShrink:0}} />
              <div style={{fontSize:11,fontFamily:"var(--mono)",color:clockState==="in"?"var(--sky)":clockState==="submitted"?"var(--mint)":"var(--coral)",fontWeight:700}}>{clockState==="in"?"CLOCKED IN":clockState==="submitted"?"SHIFT SUBMITTED":"OFF DUTY"}</div>
            </div>
          </div>
          <nav className="dash-nav">
            <div className="dash-nav-section">Navigation</div>
            {NAV_ITEMS.map(n=>(
              <button key={n.key} className={`dash-nav-item${tab===n.key?" active sky":""}`} onClick={()=>setTab(n.key)} style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
                <span className="dash-nav-icon">{n.icon}</span>{n.label}
              </button>
            ))}
          </nav>
          <div className="dash-footer">
            <Link href="/">← Back to Platform</Link>
            <button onClick={logout} style={{marginTop:8,width:"100%",background:"rgba(249,112,102,0.1)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"8px 12px",color:"var(--coral)",fontSize:12,fontFamily:"var(--mono)",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
              🔒 Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="dash-main">
          <div className="dash-topbar">
            <div>
              <div className="dash-title" style={{color:"var(--sky)"}}>Welcome, <span>{hcaId || "HCA"}</span></div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)"}}>Wed 7 May 2026 · Day Shift · Margaret Wanjiku</div>
            </div>
            <div className="dash-actions">
              <div style={{fontFamily:"var(--mono)",fontSize:14,color:"var(--mint)",background:"rgba(0,74,153,0.1)",border:"1px solid rgba(0,74,153,0.22)",padding:"6px 14px",borderRadius:8}}>{time}</div>
            </div>
          </div>

          <div className="dash-content">

            {/* ── TODAY ── */}
            {(tab==="today"||tab==="cardex") && (
              <>
                {/* Clock-In Panel */}
                <div className={`clockin-panel${clockState==="in"?" clocked":clockState==="submitted"?" clocked-out":""}`}>
                  <div className="clock-top">
                    <div>
                      <div className={`clock-time${clockState==="in"?" blue":""}`}>{time}</div>
                      <div className="clock-meta">Wednesday, 7 May 2026 · Nairobi, Kenya</div>
                    </div>
                    {clockState==="in" && (
                      <div className="gps-badge"><div className="gps-dot" />GPS Verified · Kilimani (0.2 km from patient)</div>
                    )}
                  </div>

                  {/* Patient banner */}
                  <div className="patient-banner">
                    <div className="pat-av">👩🏼</div>
                    <div style={{flex:1}}>
                      <div className="pat-name">Margaret Wanjiku</div>
                      <div className="pat-meta">PAT-001 · Dementia Care · Day Shift 07:00–15:00 · Kilimani</div>
                    </div>
                    <span className="badge badge-gold">Active Placement</span>
                  </div>

                  {clockState==="in" && (
                    <div className="shift-timer" style={{marginBottom:16}}>
                      ⏱️ Shift Duration: <strong style={{fontSize:16}}>{duration}</strong>
                      <span style={{marginLeft:"auto",fontSize:11,color:"rgba(56,189,248,0.5)"}}>Clocked in at 06:52 (8 min early ✓)</span>
                    </div>
                  )}

                  <div className="clockin-btns">
                    {clockState==="out" && (
                      <button className="btn-sky" style={{fontSize:15,padding:"12px 28px"}} onClick={clockIn}>
                        📍 Clock In — GPS Location Confirm
                      </button>
                    )}
                    {clockState==="in" && (
                      <>
                        <button className="btn-sky" onClick={()=>setTab("cardex")}>📋 Open Cardex →</button>
                        <button className="btn-o" onClick={saveDraft}>💾 Save Draft</button>
                        <button className="btn-p" onClick={submitCardex} style={{background:"linear-gradient(135deg,var(--jade),var(--emerald))"}}>✅ Submit Cardex & Clock Out</button>
                      </>
                    )}
                    {clockState==="submitted" && (
                      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                        <div style={{fontSize:14,color:"var(--mint)",fontWeight:600}}>✅ Cardex submitted. Awaiting handover with next HCA.</div>
                        <button className="btn-o" onClick={clockOut}>🚪 Complete Clock-Out</button>
                      </div>
                    )}
                  </div>

                  {clockState==="out" && (
                    <div style={{marginTop:14,fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                      ⏰ Shift starts <strong style={{color:"var(--text)"}}>07:00</strong>. Please clock in <strong style={{color:"var(--amber)"}}>15 minutes early</strong> for handover from the departing HCA. GPS location will be auto-captured.
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="stat-grid">
                  {[
                    {icon:"📋",lbl:"Shifts This Month", val:"14",       color:"mint" },
                    {icon:"⭐",lbl:"Current Rating",    val:"4.9 ★",    color:"amber"},
                    {icon:"⏱️",lbl:"Avg. Timeliness",  val:"98%",       color:"sky"  },
                    {icon:"💳",lbl:"Earnings MTD",      val:"KES 44,800",color:"mint" },
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {tab==="today" && (
                  <>
                    {/* Shift history */}
                    <div className="panel">
                      <div className="panel-head"><div className="panel-title">Shift Schedule — This Week</div></div>
                      <div className="panel-body">
                        {SHIFT_HIST.map((s,i)=>(
                          <div key={i} className="shift-hist-row">
                            <div className="shr-date">{s.date}</div>
                            <div className="shr-pat">{s.pat}</div>
                            <div className="shr-type">{s.type}</div>
                            <div className="shr-dur">{s.dur}</div>
                            <span className={`badge ${s.cls}`}>{s.status}</span>
                            {s.status==="Submitted"&&<button className="btn-o btn-sm">View Cardex</button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── CARDEX ── */}
            {tab==="cardex" && clockState==="in" && (
              <div className="cardex-wrap">
                <div className="cardex-header">
                  <div>
                    <div className="cardex-title">Shift Cardex — Margaret Wanjiku</div>
                    <div className="cardex-meta">PAT-001 · Wed 7 May 2026 · Day Shift 07:00–15:00 · HCA: Amina Njeri</div>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    {savedAt && <div style={{fontSize:11,color:"var(--mint)",fontFamily:"var(--mono)"}}>💾 Saved {savedAt}</div>}
                    <button className="btn-o btn-sm" onClick={saveDraft}>Save Draft</button>
                  </div>
                </div>

                <div className="cardex-body">
                  {/* Patient Notes */}
                  <div style={{background:"rgba(232,213,168,0.07)",border:"1px solid rgba(232,213,168,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:24,fontSize:13}}>
                    <strong style={{color:"var(--amber)"}}>⚠️ Patient Special Needs:</strong>
                    <span style={{color:"var(--muted)",marginLeft:8}}>Dementia Stage 2 · No dairy · Donepezil 5mg AM+PM · Fluid encouragement · Turn every 2hrs</span>
                  </div>

                  {/* 1. VITALS */}
                  <div className="cardex-section">
                    <div className="cs-title">🩺 Vital Signs</div>
                    <div className="vital-grid">
                      {[
                        ["Temperature","temp","°C"],["Pulse","pulse","bpm"],["BP Systolic","bpSys","mmHg"],
                        ["BP Diastolic","bpDia","mmHg"],["SpO₂","spo2","%"],["Respiratory Rate","rr","br/min"],
                        ["GCS Score","gcs","/15"],["Pain Score","pain","/10"],["Blood Glucose","bgl","mmol/L"],
                      ].map(([l,k,u])=>(
                        <div className="vital-box" key={k}>
                          <div className="vital-label">{l}</div>
                          <input className="vital-input" value={vitals[k]} onChange={e=>updVital(k,e.target.value)} placeholder="—" />
                          <div className="vital-unit">{u}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. MEDICATIONS */}
                  <div className="cardex-section">
                    <div className="cs-title">💊 Medications Administered</div>
                    {meds.map((m,i)=>(
                      <div className="med-row" key={i}>
                        <input type="time" value={m.time} onChange={e=>setMeds(p=>p.map((x,j)=>j===i?{...x,time:e.target.value}:x))} style={{maxWidth:90}} />
                        <input placeholder="Drug name" value={m.drug} onChange={e=>setMeds(p=>p.map((x,j)=>j===i?{...x,drug:e.target.value}:x))} />
                        <input placeholder="Dose" value={m.dose} onChange={e=>setMeds(p=>p.map((x,j)=>j===i?{...x,dose:e.target.value}:x))} style={{maxWidth:80}} />
                        <select value={m.route} onChange={e=>setMeds(p=>p.map((x,j)=>j===i?{...x,route:e.target.value}:x))} style={{maxWidth:100}}>
                          {["Oral","IV","IM","SC","Topical","Sublingual","Nasal"].map(r=><option key={r}>{r}</option>)}
                        </select>
                        <input placeholder="Notes" value={m.notes} onChange={e=>setMeds(p=>p.map((x,j)=>j===i?{...x,notes:e.target.value}:x))} />
                        <button className="del-btn" onClick={()=>setMeds(p=>p.filter((_,j)=>j!==i))}>✕</button>
                      </div>
                    ))}
                    <button className="add-row-btn" onClick={addMed}>+ Add Medication</button>
                  </div>

                  {/* 3. FLUID BALANCE */}
                  <div className="cardex-section">
                    <div className="cs-title">💧 Fluid & Nutrition</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,marginBottom:14}}>
                      {[["Breakfast","breakfast","Full / Partial / Refused / N/A"],["Lunch","lunch","Full / Partial / Refused / N/A"],["Dinner","dinner","Full / Partial / Refused / N/A"],["Supplement","supplement","e.g. Ensure given"]].map(([l,k,ph])=>(
                        <div key={k} style={{background:"rgba(0,74,153,0.06)",border:"1px solid rgba(0,74,153,0.15)",borderRadius:12,padding:12}}>
                          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:5}}>{l}</div>
                          <input value={nutrition[k]} onChange={e=>setNutrition(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid rgba(0,74,153,0.25)",color:"var(--text)",fontFamily:"var(--sans)",fontSize:13,padding:"4px 0",outline:"none"}} />
                        </div>
                      ))}
                    </div>
                    {intakes.map((it,i)=>(
                      <div className="med-row" key={i}>
                        <input placeholder="Fluid type (e.g. Water, Juice, Soup)" value={it.type} onChange={e=>setIntakes(p=>p.map((x,j)=>j===i?{...x,type:e.target.value}:x))} />
                        <input type="number" placeholder="Amount" value={it.amount} onChange={e=>setIntakes(p=>p.map((x,j)=>j===i?{...x,amount:e.target.value}:x))} style={{maxWidth:90}} />
                        <select value={it.unit} onChange={e=>setIntakes(p=>p.map((x,j)=>j===i?{...x,unit:e.target.value}:x))} style={{maxWidth:80}}>
                          {["ml","L","cups"].map(u=><option key={u}>{u}</option>)}
                        </select>
                        <button className="del-btn" onClick={()=>setIntakes(p=>p.filter((_,j)=>j!==i))}>✕</button>
                      </div>
                    ))}
                    <button className="add-row-btn" onClick={addIntake}>+ Add Fluid Entry</button>
                  </div>

                  {/* 4. PERSONAL CARE & MOBILITY */}
                  <div className="cardex-section">
                    <div className="cs-title">🛁 Personal Care & Mobility</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                      {[
                        ["hygiene","bath","🛁 Bath/Wash Given"],
                        ["hygiene","oral","🦷 Oral Hygiene"],
                        ["hygiene","reposition","🔄 Repositioned (2-hrly)"],
                        ["hygiene","skin","🔍 Skin Inspection Done"],
                        ["mobility","exercises","🏋️ Range-of-Motion Exercises"],
                        ["mobility","transfer","🪑 Transfer Assist"],
                      ].map(([grp,k,l])=>{
                        const val = grp==="hygiene"?hygiene[k]:mobility[k];
                        const setFn= grp==="hygiene"?setHygiene:setMobility;
                        return (
                          <div key={k} onClick={()=>setFn(p=>({...p,[k]:!p[k]}))} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:10,background:val?"rgba(0,74,153,0.1)":"rgba(0,74,153,0.04)",border:val?"1px solid rgba(0,74,153,0.28)":"1px solid rgba(0,74,153,0.1)",cursor:"pointer",transition:"all 0.2s",fontSize:12}}>
                            <div style={{width:18,height:18,borderRadius:5,border:val?"2px solid var(--jade)":"2px solid rgba(0,74,153,0.28)",background:val?"var(--jade)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"var(--cream)",flexShrink:0}}>{val?"✓":""}</div>
                            {l}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. ELIMINATION */}
                  <div className="cardex-section">
                    <div className="cs-title">🚽 Elimination</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:12}}>
                      <div>
                        <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:6}}>Urine Output</div>
                        <select value={elimination.urine} onChange={e=>setElim(p=>({...p,urine:e.target.value}))} style={{width:"100%",background:"rgba(0,74,153,0.06)",border:"1px solid rgba(0,74,153,0.2)",borderRadius:9,padding:"9px 12px",color:"var(--text)",fontFamily:"var(--sans)",fontSize:13,outline:"none"}}>
                          {["Yes","No","Reduced","Incontinence","Catheter"].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:6}}>Bowel Movement</div>
                        <select value={elimination.bowel} onChange={e=>setElim(p=>({...p,bowel:e.target.value}))} style={{width:"100%",background:"rgba(0,74,153,0.06)",border:"1px solid rgba(0,74,153,0.2)",borderRadius:9,padding:"9px 12px",color:"var(--text)",fontFamily:"var(--sans)",fontSize:13,outline:"none"}}>
                          {["Yes","No","Diarrhea","Constipated","Stoma"].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:6}}>Notes</div>
                        <input value={elimination.notes} onChange={e=>setElim(p=>({...p,notes:e.target.value}))} placeholder="e.g. Encouraged fluid intake, no BM today..." style={{width:"100%",background:"rgba(0,74,153,0.06)",border:"1px solid rgba(0,74,153,0.2)",borderRadius:9,padding:"9px 12px",color:"var(--text)",fontFamily:"var(--sans)",fontSize:13,outline:"none"}} />
                      </div>
                    </div>
                  </div>

                  {/* 6. MENTAL STATUS */}
                  <div className="cardex-section">
                    <div className="cs-title">🧠 Mental & Behavioural Status</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                      {[["Orientation","orientation",["Fully","Partially","Confused","Unresponsive"]],["Mood","mood",["Calm","Anxious","Agitated","Depressed","Elated"]],["Behaviour","behaviour",["No concerns","Wandering","Aggression","Sundowning","Withdrawn"]]].map(([l,k,opts])=>(
                        <div key={k}>
                          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:6}}>{l}</div>
                          <select value={mentalSt[k]} onChange={e=>setMentalSt(p=>({...p,[k]:e.target.value}))} style={{width:"100%",background:"rgba(0,74,153,0.06)",border:"1px solid rgba(0,74,153,0.2)",borderRadius:9,padding:"9px 12px",color:"var(--text)",fontFamily:"var(--sans)",fontSize:13,outline:"none"}}>
                            {opts.map(o=><option key={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 7. INCIDENTS */}
                  <div className="cardex-section">
                    <div className="cs-title">⚠️ Incidents & Observations</div>
                    <textarea className="incidents-area" value={incidents} onChange={e=>setIncidents(e.target.value)} placeholder="Record any incidents, concerns or notable observations during this shift. Include time, description and action taken. e.g. 10:15 — Patient complained of knee pain. Applied warm compress. Pain reduced to 2/10 by 10:45." />
                  </div>

                  {/* 8. SPECIAL NEEDS CHECKLIST */}
                  <div className="cardex-section">
                    <div className="cs-title">✅ Special Needs Compliance Checklist</div>
                    {SPECIAL_NEEDS.map((need,i)=>(
                      <div key={i} className={`checklist-item${checks[i]?" checked":""}${flags[i]?" flagged":""}`} onClick={()=>toggleCheck(i)}>
                        <div className={`cl-check${checks[i]?" checked":flags[i]?" flagged":""}`}>{checks[i]?"✓":flags[i]?"!":""}</div>
                        <div className="cl-text">{need}</div>
                        <button className="flag-btn" onClick={e=>{e.stopPropagation();toggleFlag(i);}}>
                          {flags[i]?"🚩 Flagged":"🚩 Flag"}
                        </button>
                      </div>
                    ))}
                    {flags.some(Boolean) && (
                      <div style={{background:"rgba(249,112,102,0.08)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"var(--muted)",marginTop:10}}>
                        ⚠️ <strong style={{color:"var(--coral)"}}>{flags.filter(Boolean).length} special need(s) flagged.</strong> These will be reported to the admin care quality team.
                      </div>
                    )}
                  </div>

                  {/* 9. HANDOVER NOTES */}
                  <div className="cardex-section">
                    <div className="cs-title">🤝 Handover Notes for Next HCA</div>
                    <textarea className="incidents-area" value={handover} onChange={e=>setHandover(e.target.value)} placeholder="Key points for the incoming HCA: patient mood, care priority, any pending medications, family communication, special observations..." />
                  </div>

                  {/* 10. HCA WELFARE */}
                  <div className="cardex-section">
                    <div className="cs-title">💙 Shift Experience & Working Conditions (Confidential)</div>
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:10}}>Rate your shift experience:</div>
                      <div style={{display:"flex",gap:8}}>
                        {[1,2,3,4,5].map(n=>(
                          <button key={n} onClick={()=>setShiftRating(n)} style={{width:36,height:36,borderRadius:10,border:shiftRating>=n?"1px solid var(--amber)":"1px solid rgba(0,74,153,0.18)",background:shiftRating>=n?"rgba(200,149,42,0.15)":"rgba(0,74,153,0.04)",color:shiftRating>=n?"var(--amber)":"var(--muted)",cursor:"pointer",fontSize:16}}>★</button>
                        ))}
                        {shiftRating>0 && <span style={{fontSize:12,color:"var(--muted)",alignSelf:"center",marginLeft:8,fontFamily:"var(--mono)"}}>{shiftRating}/5</span>}
                      </div>
                    </div>
                    <textarea className="incidents-area" style={{minHeight:70}} value={welfareNote} onChange={e=>setWelfareNote(e.target.value)} placeholder="Optional: Any concerns about working conditions, facilities, safety or wellbeing during this shift? This is confidential and reviewed by E-Vive welfare team..." />
                  </div>
                </div>

                <div className="cardex-footer">
                  <div className="save-info">
                    {savedAt ? <>Last saved: <span>{savedAt}</span></> : "Cardex auto-saves every 5 minutes"}
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn-o btn-sm" onClick={saveDraft}>💾 Save Draft</button>
                    <button className="btn-p" onClick={submitCardex} style={{background:"linear-gradient(135deg,var(--jade),var(--emerald))"}}>✅ Submit Cardex &amp; Clock Out →</button>
                  </div>
                </div>
              </div>
            )}

            {tab==="cardex" && clockState!=="in" && (
              <div style={{textAlign:"center",padding:"80px 0",color:"var(--muted)"}}>
                <div style={{fontSize:48,marginBottom:16}}>{clockState==="submitted"?"✅":"📋"}</div>
                <div style={{fontSize:16,marginBottom:12}}>{clockState==="submitted"?"Cardex submitted for this shift.":"You are not currently clocked in. Clock in to access the Cardex."}</div>
                {clockState==="out" && <button className="btn-sky" onClick={()=>{setTab("today");}}>Go to Today →</button>}
              </div>
            )}

            {/* ── TRAINING ── */}
            {tab==="training" && (
              <div>
                <div style={{marginBottom:20,fontWeight:700,fontSize:16}}>Training & Development</div>
                <div className="stat-grid">
                  {[{icon:"🎓",lbl:"Modules Completed",val:"8",color:"mint"},{icon:"📅",lbl:"Next Training",val:"15 May",color:"amber"},{icon:"📜",lbl:"Certs Expiring",val:"1",color:"coral"},{icon:"📊",lbl:"Training Score",val:"94%",color:"sky"}].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Available Training Modules</div><button className="btn-p btn-sm">Request Training</button></div>
                  <div className="panel-body">
                    {[
                      {icon:"🧠",title:"Advanced Dementia Care",date:"15 May 2026",type:"In-Person",status:"Enrolled"},
                      {icon:"💊",title:"Medication Administration",date:"22 May 2026",type:"Online",status:"Available"},
                      {icon:"🩺",title:"Palliative Care Principles",date:"Jun 2026",type:"Online",status:"Available"},
                      {icon:"🏋️",title:"Mobility & Physiotherapy Assist",date:"Jun 2026",type:"In-Person",status:"Available"},
                    ].map((t,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:i<3?"1px solid rgba(0,74,153,0.1)":"none"}}>
                        <span style={{fontSize:24}}>{t.icon}</span>
                        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{t.title}</div><div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{t.date} · {t.type}</div></div>
                        <span className={`badge ${t.status==="Enrolled"?"badge-mint":"badge-dim"}`}>{t.status}</span>
                        {t.status==="Available" && <button className="btn-p btn-sm">Enrol</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── WELFARE ── */}
            {tab==="welfare" && (
              <div>
                <div style={{marginBottom:20,fontWeight:700,fontSize:16}}>Welfare & Support</div>
                <p style={{fontSize:14,color:"var(--muted)",marginBottom:24,lineHeight:1.7}}>E-Vive is committed to your wellbeing. All welfare requests are confidential and handled by our dedicated welfare officer.</p>
                <div className="welfare-opts">
                  {[
                    {icon:"💬",title:"Request Counselling",sub:"Book a confidential session with a welfare counsellor"},
                    {icon:"🆘",title:"Report a Safety Concern",sub:"Report unsafe working conditions or misconduct"},
                    {icon:"📅",title:"Request Time Off",sub:"Submit an off-day request (48hrs notice required)"},
                    {icon:"📝",title:"Submit Welfare Note",sub:"Share feedback about your working conditions"},
                  ].map(w=>(
                    <div key={w.title} className="welfare-opt">
                      <div className="welfare-opt-icon">{w.icon}</div>
                      <div className="welfare-opt-title">{w.title}</div>
                      <div className="welfare-opt-sub">{w.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Off-Day Requests</div></div>
                  <div className="panel-body">
                    <p style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>You must give <strong style={{color:"var(--text)"}}>48 hours notice</strong> for off-day requests when placed with a client.</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:12,marginBottom:14}}>
                      <div><div className="dash-label">From Date</div><input type="date" className="dash-input" /></div>
                      <div><div className="dash-label">To Date</div><input type="date" className="dash-input" /></div>
                      <div><div className="dash-label">Reason</div><input className="dash-input" placeholder="e.g. Medical appointment" /></div>
                    </div>
                    <button className="btn-sky">Submit Off-Day Request</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── EARNINGS ── */}
            {tab==="earnings" && (
              <div>
                <div className="stat-grid">
                  {[{icon:"💰",lbl:"Total Earned MTD",val:"KES 44,800",color:"mint"},{icon:"📅",lbl:"Next Payment",val:"15 May",color:"amber"},{icon:"📋",lbl:"Shifts Completed",val:"14",color:"sky"},{icon:"⭐",lbl:"Placement Bonus",val:"KES 2,000",color:"mint"}].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Payment History</div></div>
                  <div className="panel-body">
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Period</th><th>Shifts</th><th>Rate/hr</th><th>Total</th><th>Status</th></tr></thead>
                        <tbody>
                          {[["1–15 Apr 2026","10","KES 800","KES 32,000","Paid"],["16–30 Apr 2026","10","KES 800","KES 32,000","Paid"],["1–7 May 2026","4","KES 800","KES 12,800","Pending"]].map(([p,s,r,t,st],i)=>(
                            <tr key={i}>
                              <td style={{fontFamily:"var(--mono)",fontSize:12}}>{p}</td>
                              <td>{s}</td>
                              <td style={{color:"var(--amber)"}}>{r}</td>
                              <td style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,color:"var(--mint)"}}>{t}</td>
                              <td><span className={`badge ${st==="Paid"?"badge-mint":"badge-gold"}`}>{st}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
