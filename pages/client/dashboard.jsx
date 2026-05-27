import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DASH_BASE } from "../../components/SharedStyles";

const CSS = `
  /* Journey tracker */
  .journey-bar { background:rgba(237,241,249,0.95); border:1px solid rgba(0,74,153,0.12); border-radius:18px; padding:22px 28px; margin-bottom:24px; overflow-x:auto; }
  .jb-title { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:var(--mono); color:var(--muted); margin-bottom:16px; }
  .jb-steps { display:flex; align-items:center; min-width:700px; }
  .jb-step  { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; }
  .jb-dot   { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; transition:all 0.3s; }
  .jb-dot.done    { background:linear-gradient(135deg,var(--jade),var(--emerald)); color:#fff; box-shadow:0 0 12px rgba(0,74,153,0.25); }
  .jb-dot.current { background:linear-gradient(135deg,rgba(240,169,139,0.5),rgba(232,132,90,0.4)); border:2px solid var(--gold); color:var(--gold); animation:pulse-dot 2s infinite; }
  .jb-dot.pending { background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.15); color:var(--muted); font-family:var(--mono); font-size:11px; }
  .jb-conn { flex:1; height:2px; max-width:none; margin-bottom:28px; }
  .jb-conn.done    { background:linear-gradient(90deg,var(--jade),var(--emerald)); }
  .jb-conn.pending { background:rgba(0,74,153,0.1); }
  .jb-lbl { font-size:10px; text-align:center; line-height:1.4; font-family:var(--mono); max-width:72px; }
  .jb-lbl.done    { color:var(--mint); }
  .jb-lbl.current { color:var(--gold); font-weight:700; }
  .jb-lbl.pending { color:var(--muted); }

  /* Patient accounts */
  .patient-tabs { display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; padding-bottom:4px; }
  .pat-tab { padding:8px 18px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.22s; border:1px solid rgba(0,74,153,0.18); background:transparent; color:var(--muted); font-family:var(--sans); white-space:nowrap; }
  .pat-tab.active { background:rgba(0,74,153,0.1); border-color:var(--jade); color:var(--jade); }

  /* HCA shortlist */
  .shortlist-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  .sl-card { background:rgba(255,255,255,0.88); border:1px solid rgba(0,74,153,0.12); border-radius:16px; padding:16px; transition:all 0.28s; }
  .sl-card.placed { border-color:rgba(0,74,153,0.3); background:linear-gradient(145deg,rgba(0,74,153,0.06),rgba(255,255,255,0.92)); }
  .sl-card.shadow { border-color:rgba(14,165,233,0.25); background:linear-gradient(145deg,rgba(14,165,233,0.06),rgba(255,255,255,0.9)); }
  .sl-card-av { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:2px solid rgba(0,74,153,0.18); margin-bottom:10px; }
  .sl-card-name { font-weight:700; font-size:13px; margin-bottom:2px; }
  .sl-card-role { font-size:11px; color:var(--jade); font-family:var(--mono); margin-bottom:8px; }

  /* Billing */
  .invoice-row { display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid rgba(0,74,153,0.08); }
  .invoice-row:last-child { border-bottom:none; }
  .inv-num    { font-family:var(--mono); font-size:12px; color:var(--muted); min-width:80px; }
  .inv-desc   { flex:1; font-size:13px; }
  .inv-date   { font-size:12px; color:var(--muted); min-width:90px; text-align:center; font-family:var(--mono); }
  .inv-amt    { font-family:var(--serif); font-size:16px; font-weight:700; color:var(--gold); min-width:100px; text-align:right; }
  .inv-status { min-width:80px; text-align:right; }

  /* Activity feed */
  .activity-item { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid rgba(0,74,153,0.07); }
  .activity-item:last-child { border-bottom:none; }
  .act-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
  .act-txt  { font-size:13px; color:var(--muted); line-height:1.5; flex:1; }
  .act-txt strong { color:var(--text); }
  .act-time { font-size:11px; color:var(--muted); font-family:var(--mono); margin-top:3px; }

  /* Shift calendar */
  .shift-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(0,74,153,0.08); }
  .shift-date { font-family:var(--mono); font-size:12px; color:var(--muted); min-width:90px; }
  .shift-hca  { flex:1; font-size:13px; }
  .shift-type { font-size:11px; color:var(--gold); font-family:var(--mono); }
  .shift-status { font-size:11px; font-weight:600; font-family:var(--mono); }

  @media (max-width:900px) { .shortlist-grid { grid-template-columns:1fr 1fr; } }
  @media (max-width:600px) { .shortlist-grid { grid-template-columns:1fr; } }
`;

const JOURNEY = [
  { lbl:"Account\nCreated",  status:"done",    icon:"✓",  date:"30 Apr 2026" },
  { lbl:"T&C\nAccepted",     status:"done",    icon:"✓",  date:"30 Apr 2026" },
  { lbl:"Acknowledged",      status:"done",    icon:"✓",  date:"30 Apr 2026" },
  { lbl:"Call\nMade",        status:"done",    icon:"✓",  date:"01 May 2026" },
  { lbl:"Visit\nDone",       status:"current", icon:"📅", date:"03 May 2026" },
  { lbl:"HCA\nMatched",      status:"pending", icon:"6",  date:"—" },
  { lbl:"Payment\nMade",     status:"pending", icon:"7",  date:"—" },
  { lbl:"Placement\nActive", status:"pending", icon:"8",  date:"—" },
];

const PATIENTS = [
  {
    id:"PAT-001", name:"Margaret Wanjiku", gender:"Female", age:74, care:"Dementia", notes:"Stage 2 Alzheimer's. Dairy allergy. Prefers Kikuyu-speaking carer.",
    placed:{ av:"👩🏾", bg:"rgba(107,0,40,0.2)", name:"Amina Njeri", role:"CNA · Certified", status:"Placed", dist:"1.2 km" },
    shadows:[
      { av:"👩🏽", bg:"rgba(200,149,42,0.15)", name:"Mary Chebet", role:"Dementia Specialist", status:"Shadow HCA" },
    ],
    shifts:[
      { date:"Mon 5 May", hca:"Amina Njeri", type:"Day Shift", status:"Completed", statusCls:"badge-mint" },
      { date:"Tue 6 May", hca:"Amina Njeri", type:"Day Shift", status:"Completed", statusCls:"badge-mint" },
      { date:"Wed 7 May", hca:"Amina Njeri", type:"Day Shift", status:"Today",     statusCls:"badge-gold" },
      { date:"Thu 8 May", hca:"Amina Njeri", type:"Day Shift", status:"Upcoming",  statusCls:"badge-dim"  },
    ],
    invoices:[
      { num:"INV-2026-001", desc:"Placement fee — Amina Njeri (Week 1)",   date:"01 May 2026", amt:"KES 14,000", status:"Paid",    cls:"badge-mint" },
      { num:"INV-2026-002", desc:"Weekly care — 7 shifts × Day rate",       date:"08 May 2026", amt:"KES 44,800", status:"Pending", cls:"badge-gold" },
    ],
  },
  {
    id:"PAT-002", name:"Peter Wanjiku", gender:"Male", age:78, care:"Mobility Assistance",  notes:"Hip replacement (March 2026). Needs physiotherapy-trained carer. Diabetic.",
    placed:null,
    shadows:[],
    shifts:[],
    invoices:[
      { num:"INV-2026-003", desc:"Placement fee — to be confirmed after visit", date:"10 May 2026", amt:"KES 8,000", status:"Quote", cls:"badge-dim" },
    ],
  },
];

const ACTIVITIES = [
  { dot:"var(--mint)", txt:<><strong>Shift Cardex submitted</strong> — Amina Njeri completed Day Shift for Margaret (Wed 7 May)</>, time:"Today, 4:38 PM" },
  { dot:"var(--sky)",  txt:<><strong>E-Vive Admin called</strong> — Visit scheduled for Friday 3 May, 10:00 AM</>, time:"Yesterday, 2:15 PM" },
  { dot:"var(--amber)",txt:<><strong>Invoice INV-2026-002 due</strong> on 8 May 2026 — KES 44,800</>, time:"2 days ago" },
  { dot:"var(--mint)", txt:<><strong>HCA shortlist confirmed</strong> — Amina Njeri placed, Mary Chebet on standby</>, time:"1 May 2026" },
  { dot:"var(--jade)", txt:<><strong>T&C accepted</strong> and account activated</>, time:"30 Apr 2026" },
];

const NAV_ITEMS = [
  { icon:"📊", label:"Overview",      key:"overview" },
  { icon:"👥", label:"Patients",      key:"patients" },
  { icon:"🤝", label:"My HCAs",       key:"hcas" },
  { icon:"💳", label:"Billing",       key:"billing" },
  { icon:"📅", label:"Shift History", key:"shifts" },
  { icon:"📄", label:"Documents",     key:"documents" },
  { icon:"⚙️", label:"Account",       key:"account" },
];

export default function ClientDashboard() {
  const router = useRouter();
  const [tab,     setTab]     = useState("overview");
  const [patIdx,  setPatIdx]  = useState(0);
  const [session, setSession] = useState(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("evive_client_session") || "null");
      if (!s?.email) { router.replace("/client/register"); return; }
      setSession(s);
    } catch { router.replace("/client/register"); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    localStorage.removeItem("evive_client_session");
    router.push("/client/register");
  }

  const pat = PATIENTS[patIdx];
  const userName = session?.name?.split(" ")[0] || "Client";

  return (
    <>
      <Head>
        <title>Client Dashboard — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      <div className="dash-wrap">
        {/* ── SIDEBAR ── */}
        <aside className="dash-side">
          <div className="dash-logo">
            <Link href="/" style={{textDecoration:"none"}}>
              <div className="dash-logo-text">e<span>-</span>vive</div>
              <div className="dash-logo-sub">Client Portal</div>
            </Link>
          </div>
          <div className="dash-user">
            <div className="dash-avatar">👩🏾</div>
            <div>
              <div className="dash-user-name">{session?.name || "Jane Wanjiku"}</div>
              <div className="dash-user-role">CLIENT · ACC-2026-047</div>
            </div>
          </div>
          <nav className="dash-nav">
            <div className="dash-nav-section">Navigation</div>
            {NAV_ITEMS.map(n => (
              <button key={n.key} className={`dash-nav-item${tab===n.key?" active":""}`} onClick={()=>setTab(n.key)} style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
                <span className="dash-nav-icon">{n.icon}</span>{n.label}
                {n.key==="billing" && <span className="dash-nav-badge">1</span>}
              </button>
            ))}
          </nav>
          <div className="dash-footer">
            <Link href="/match">🔍 Find More HCAs</Link>
            <button
              onClick={handleLogout}
              style={{background:"none",border:"none",cursor:"pointer",color:"var(--coral)",fontFamily:"var(--mono)",fontSize:12,fontWeight:600,padding:"8px 0",textAlign:"left",width:"100%",marginTop:8,display:"flex",alignItems:"center",gap:6}}
            >
              ⎋ Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="dash-main">
          <div className="dash-topbar">
            <div>
              <div className="dash-title">Good morning, <span>{userName}</span></div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)"}}>Wednesday, 7 May 2026 · 2 Patients · Account Active</div>
            </div>
            <div className="dash-actions">
              <Link href="/match" className="btn-p btn-sm">+ Find HCA</Link>
            </div>
          </div>

          <div className="dash-content">

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <>
                {/* Journey Tracker */}
                <div className="journey-bar">
                  <div className="jb-title">Your Client Journey — {JOURNEY.find(j=>j.status==="current")?.lbl.replace("\n"," ")} in progress</div>
                  <div className="jb-steps">
                    {JOURNEY.map((j, i) => (
                      <>
                        <div key={`jst-${i}`} className="jb-step">
                          <div className={`jb-dot ${j.status}`}>{j.status==="done"?"✓":j.status==="current"?j.icon:j.icon}</div>
                          <div className={`jb-lbl ${j.status}`} style={{whiteSpace:"pre-line"}}>{j.lbl}</div>
                          {j.date!=="—" && <div style={{fontSize:9,color:"rgba(254,240,232,0.25)",fontFamily:"var(--mono)"}}>{j.date}</div>}
                        </div>
                        {i < JOURNEY.length-1 && <div key={`jc-${i}`} className={`jb-conn ${j.status==="done"?"done":"pending"}`} />}
                      </>
                    ))}
                  </div>
                  <div style={{marginTop:14,padding:"10px 14px",background:"rgba(232,213,168,0.08)",border:"1px solid rgba(232,213,168,0.2)",borderRadius:10,fontSize:13,color:"var(--muted)"}}>
                    📅 <strong style={{color:"var(--amber)"}}>Next step: Home Visit</strong> — E-Vive team will visit on <strong style={{color:"var(--text)"}}>Friday, 3 May 2026 at 10:00 AM</strong> to assess care needs and confirm HCA placement.
                  </div>
                </div>

                {/* Stats */}
                <div className="stat-grid">
                  {[
                    {icon:"👥",lbl:"Active Patients",     val:"2",          color:"mint" },
                    {icon:"🩺",lbl:"Placed HCAs",          val:"1 of 2",      color:"amber"},
                    {icon:"📋",lbl:"Shifts This Week",     val:"4",          color:"sky"  },
                    {icon:"💳",lbl:"Outstanding Invoice",   val:"KES 44,800", color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Two-column */}
                <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:18}}>
                  {/* Patients summary */}
                  <div className="panel">
                    <div className="panel-head">
                      <div className="panel-title">Patient Accounts</div>
                      <span className="badge badge-mint">{PATIENTS.length} Patients</span>
                    </div>
                    <div className="panel-body">
                      {PATIENTS.map((p,i) => (
                        <div key={p.id} style={{padding:"12px 0",borderBottom:i<PATIENTS.length-1?"1px solid rgba(0,74,153,0.08)":"none",cursor:"pointer"}} onClick={()=>{setPatIdx(i);setTab("patients");}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
                              <div style={{fontSize:11,color:"var(--mint)",fontFamily:"var(--mono)",margin:"2px 0"}}>{p.id} · {p.care}</div>
                              <div style={{fontSize:12,color:"var(--muted)"}}>{p.gender}, {p.age}y</div>
                            </div>
                            <span className={`badge ${p.placed?"badge-mint":"badge-gold"}`}>{p.placed?"HCA Placed":"Pending Placement"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Recent Activity</div></div>
                    <div className="panel-body">
                      {ACTIVITIES.map((a,i) => (
                        <div key={i} className="activity-item">
                          <div className="act-dot" style={{background:a.dot}} />
                          <div><div className="act-txt">{a.txt}</div><div className="act-time">{a.time}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── PATIENTS TAB ── */}
            {tab === "patients" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                  <div style={{fontWeight:700,fontSize:16}}>Patient Accounts</div>
                  <Link href="/match" className="btn-p btn-sm">+ Add Patient</Link>
                </div>
                <div className="patient-tabs">
                  {PATIENTS.map((p,i)=>(
                    <button key={p.id} className={`pat-tab${patIdx===i?" active":""}`} onClick={()=>setPatIdx(i)}>
                      {p.name} <span style={{opacity:0.6,fontFamily:"var(--mono)",fontSize:11}}>{p.id}</span>
                    </button>
                  ))}
                </div>

                {/* Patient detail */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head">
                    <div>
                      <div className="panel-title">{pat.name}</div>
                      <div style={{fontSize:11,color:"var(--mint)",fontFamily:"var(--mono)",marginTop:2}}>{pat.id}</div>
                    </div>
                    <span className={`badge ${pat.placed?"badge-mint":"badge-gold"}`}>{pat.placed?"HCA Placed":"Pending Placement"}</span>
                  </div>
                  <div className="panel-body">
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                      {[["Gender",pat.gender],["Age",pat.age+"y"],["Primary Care",pat.care],["Account",pat.id]].map(([l,v])=>(
                        <div key={l} style={{background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:12,padding:12}}>
                          <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:3}}>{l}</div>
                          <div style={{fontSize:14,fontWeight:600}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:13,color:"var(--muted)",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(0,74,153,0.08)",borderRadius:10,padding:"10px 14px",lineHeight:1.65}}>
                      <strong style={{color:"var(--text)"}}>Special Notes:</strong> {pat.notes}
                    </div>
                  </div>
                </div>

                {/* Placed & Shadow HCAs */}
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Assigned HCAs</div><span className="badge badge-dim">{pat.placed?"Placement Active":"Pending"}</span></div>
                  <div className="panel-body">
                    {pat.placed ? (
                      <div className="shortlist-grid">
                        <div className="sl-card placed">
                          <div className="sl-card-av" style={{background:pat.placed.bg}}>{pat.placed.av}</div>
                          <div className="sl-card-name">{pat.placed.name}</div>
                          <div className="sl-card-role">{pat.placed.role}</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            <span className="badge badge-mint">✓ Placed HCA</span>
                            <span className="badge badge-sky">📍 {pat.placed.dist}</span>
                          </div>
                        </div>
                        {pat.shadows.map(s=>(
                          <div className="sl-card shadow" key={s.name}>
                            <div className="sl-card-av" style={{background:s.bg}}>{s.av}</div>
                            <div className="sl-card-name">{s.name}</div>
                            <div className="sl-card-role">{s.role}</div>
                            <span className="badge badge-sky">Shadow HCA — On Standby</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{textAlign:"center",padding:"32px 0",color:"var(--muted)"}}>
                        <div style={{fontSize:36,marginBottom:12}}>⏳</div>
                        <div style={{fontSize:14,marginBottom:16}}>Placement pending. Our team will confirm a matched HCA after the home visit.</div>
                        <Link href="/match" className="btn-p btn-sm">Browse HCAs →</Link>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── BILLING TAB ── */}
            {tab === "billing" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"💰",lbl:"Total Invoiced",  val:"KES 66,800",  color:"amber"},
                    {icon:"✅",lbl:"Paid to Date",    val:"KES 14,000",  color:"mint" },
                    {icon:"⏳",lbl:"Outstanding",     val:"KES 52,800",  color:"coral"},
                    {icon:"📅",lbl:"Next Due Date",   val:"8 May 2026",  color:"sky"  },
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head">
                    <div className="panel-title">Invoices</div>
                    <div style={{fontSize:12,color:"var(--muted)"}}>All prices in KES</div>
                  </div>
                  <div className="panel-body">
                    {PATIENTS.flatMap(p=>p.invoices).map(inv=>(
                      <div key={inv.num} className="invoice-row">
                        <div className="inv-num">{inv.num}</div>
                        <div className="inv-desc">{inv.desc}</div>
                        <div className="inv-date">{inv.date}</div>
                        <div className="inv-amt">{inv.amt}</div>
                        <div className="inv-status"><span className={`badge ${inv.cls}`}>{inv.status}</span></div>
                        <button className="btn-o btn-sm">PDF</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Payment Methods</div></div>
                  <div className="panel-body">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      {[{icon:"📱",title:"M-Pesa Paybill",val:"Paybill: 522100 · Acc: ACC-2026-047"},{icon:"🏦",title:"Bank Transfer",val:"Equity Bank · 0123456789 · E-Vive Ltd"}].map(m=>(
                        <div key={m.title} style={{background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:14,padding:"16px 18px"}}>
                          <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                          <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{m.title}</div>
                          <div style={{fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)"}}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:14,fontSize:12,color:"var(--muted)",padding:"10px 14px",background:"rgba(14,165,233,0.06)",border:"1px solid rgba(14,165,233,0.15)",borderRadius:10}}>
                      ℹ️ Payment reminders are sent <strong style={{color:"var(--sky)"}}>5 days before each due date</strong> via email and SMS. Contact accounts@e-vive.app for queries.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── SHIFT HISTORY ── */}
            {tab === "shifts" && (
              <div className="panel">
                <div className="panel-head"><div className="panel-title">Shift History</div><span className="badge badge-mint">{pat.name}</span></div>
                <div className="panel-body">
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead><tr><th>Date</th><th>HCA</th><th>Shift Type</th><th>Patient</th><th>Status</th><th>Cardex</th></tr></thead>
                      <tbody>
                        {pat.shifts.map((s,i)=>(
                          <tr key={i}>
                            <td style={{fontFamily:"var(--mono)",fontSize:12}}>{s.date}</td>
                            <td>{s.hca}</td>
                            <td><span className="badge badge-gold">{s.type}</span></td>
                            <td style={{fontSize:12,color:"var(--muted)"}}>Margaret W.</td>
                            <td><span className={`badge ${s.statusCls}`}>{s.status}</span></td>
                            <td>{s.status==="Completed"?<button className="btn-o btn-sm">View</button>:<span style={{color:"var(--muted)",fontSize:12}}>—</span>}</td>
                          </tr>
                        ))}
                        {pat.shifts.length === 0 && (
                          <tr><td colSpan={6} style={{textAlign:"center",padding:"32px",color:"var(--muted)"}}>No shifts recorded for this patient yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── DOCUMENTS TAB ── */}
            {tab === "documents" && (
              <div className="panel">
                <div className="panel-head"><div className="panel-title">Documents & Agreements</div></div>
                <div className="panel-body">
                  {[
                    {icon:"📄",name:"Terms & Conditions — Accepted",date:"30 Apr 2026",cls:"badge-mint",status:"Accepted"},
                    {icon:"📋",name:`Service Agreement — ${session?.name||"Client"}`,date:"01 May 2026",cls:"badge-mint",status:"Signed"},
                    {icon:"📑",name:"HCA Placement Contract — Amina Njeri",date:"Pending",cls:"badge-gold",status:"Pending"},
                    {icon:"💳",name:"Invoice INV-2026-001",date:"01 May 2026",cls:"badge-mint",status:"Paid"},
                    {icon:"💳",name:"Invoice INV-2026-002",date:"08 May 2026",cls:"badge-coral",status:"Due Soon"},
                  ].map(d=>(
                    <div key={d.name} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:"1px solid rgba(0,74,153,0.08)"}}>
                      <span style={{fontSize:22}}>{d.icon}</span>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{d.name}</div><div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{d.date}</div></div>
                      <span className={`badge ${d.cls}`}>{d.status}</span>
                      <button className="btn-o btn-sm">Download</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACCOUNT TAB ── */}
            {tab === "account" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Account Details</div></div>
                  <div className="panel-body">
                    {[["Client Name",session?.name||"—"],["Email",session?.email||"—"],["Mobile",session?.mobile||"—"],["Location","Kilimani, Nairobi"],["Account No.","ACC-2026-047"],["Status","Active"]].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(0,74,153,0.08)"}}>
                        <span style={{fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)"}}>{l}</span>
                        <span style={{fontSize:13,fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                    <button className="btn-o" style={{width:"100%",marginTop:16}}>Edit Profile</button>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Account Closure</div></div>
                  <div className="panel-body">
                    <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:16}}>To close your account, you must give <strong style={{color:"var(--text)"}}>14 days written notice</strong>. All outstanding invoices must be cleared. Active HCA placements will be terminated at the end of the notice period.</p>
                    <div style={{padding:"12px 14px",background:"rgba(249,112,102,0.06)",border:"1px solid rgba(249,112,102,0.15)",borderRadius:10,fontSize:12,color:"var(--muted)",marginBottom:14}}>
                      ⚠️ Outstanding balance of <strong style={{color:"var(--coral)"}}>KES 52,800</strong> must be settled before closure is processed.
                    </div>
                    <button className="btn-danger" style={{width:"100%"}}>Request Account Closure</button>
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
