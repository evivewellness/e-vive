import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { DASH_BASE } from "../../components/SharedStyles";

const CSS = `
  .quality-bar { height:8px; border-radius:100px; background:rgba(255,255,255,0.08); overflow:hidden; margin-top:6px; }
  .quality-fill { height:100%; border-radius:100px; }
  .alert-item { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .alert-item:last-child { border-bottom:none; }
  .alert-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:4px; }
  .metric-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .metric-row:last-child { border-bottom:none; }
  .metric-label { flex:1; font-size:13px; color:var(--muted); }
  .metric-val   { font-family:var(--mono); font-size:13px; font-weight:700; }
  .hca-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.07); }
  .hca-row:last-child { border-bottom:none; }
  .hca-rank { width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; font-family:var(--mono); flex-shrink:0; }
  .hca-rank.top { background:linear-gradient(135deg,var(--gold),var(--amber)); color:var(--deep); }
  .filter-bar { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
  .filter-chip { padding:6px 14px; border-radius:100px; font-size:12px; font-weight:500; font-family:var(--mono); border:1px solid rgba(168,0,64,0.18); background:transparent; color:var(--muted); cursor:pointer; transition:all 0.2s; }
  .filter-chip:hover  { border-color:rgba(168,0,64,0.35); color:var(--text); }
  .filter-chip.active { background:rgba(168,0,64,0.12); border-color:var(--mint); color:var(--mint); }
  .search-bar { background:rgba(255,255,255,0.05); border:1px solid rgba(168,0,64,0.18); border-radius:10px; padding:9px 14px; color:var(--text); font-family:var(--sans); font-size:13px; outline:none; width:240px; }
  .search-bar:focus { border-color:var(--mint); }
`;

const NAV = [
  { icon:"📊", label:"Overview",        key:"overview" },
  { icon:"🩺", label:"HCA Management",  key:"hcas"    },
  { icon:"👥", label:"Client Management",key:"clients" },
  { icon:"📋", label:"Care Quality",    key:"quality"  },
  { icon:"🎓", label:"Training",        key:"training" },
  { icon:"📅", label:"Calendar / HR",   key:"calendar" },
  { icon:"💰", label:"Finance",         key:"finance",  href:"/admin/finance" },
  { icon:"⚙️", label:"Settings / RBAC", key:"settings" },
];

const HCA_DATA = [
  { rank:1, av:"👩🏾", name:"Amina Njeri",   id:"HCA-012", cert:true,  rating:4.9, shifts:42, timeliness:98, status:"Active", flag:false },
  { rank:2, av:"👨🏽", name:"Peter Mutua",    id:"HCA-031", cert:true,  rating:4.9, shifts:38, timeliness:100,status:"Active", flag:false },
  { rank:3, av:"👩🏿", name:"Mary Chebet",   id:"HCA-008", cert:true,  rating:4.7, shifts:61, timeliness:95, status:"Active", flag:false },
  { rank:4, av:"👨🏿", name:"John Mwangi",   id:"HCA-019", cert:true,  rating:4.8, shifts:35, timeliness:92, status:"Active", flag:false },
  { rank:5, av:"👩🏽", name:"Rose Adhiambo", id:"HCA-025", cert:true,  rating:4.5, shifts:22, timeliness:97, status:"Active", flag:false },
  { rank:6, av:"👩🏾", name:"Grace Otieno",  id:"HCA-007", cert:true,  rating:4.6, shifts:18, timeliness:88, status:"On Leave",flag:true },
  { rank:7, av:"👨🏾", name:"Samuel Kamau",  id:"HCA-041", cert:false, rating:4.7, shifts:29, timeliness:90, status:"Active", flag:false },
];

const CLIENTS_DATA = [
  { name:"Jane Wanjiku",       id:"ACC-2026-047", patients:2, status:"Visit Scheduled", journey:4, outstanding:"KES 52,800", cls:"badge-gold"  },
  { name:"Dr. Ochieng Family", id:"ACC-2026-038", patients:1, status:"Placement Active",journey:8, outstanding:"KES 0",      cls:"badge-mint"  },
  { name:"Kamau Holdings Ltd", id:"ACC-2026-051", patients:3, status:"Pending Payment", journey:6, outstanding:"KES 84,000", cls:"badge-coral" },
  { name:"Agnes Mwende",       id:"ACC-2026-044", patients:1, status:"Account Created", journey:1, outstanding:"KES 8,000",  cls:"badge-dim"   },
];

const ALERTS = [
  { dot:"var(--coral)",  txt:"Grace Otieno (HCA-007) has 3 flagged special-needs compliance items — review required.",           time:"2h ago" },
  { dot:"var(--amber)",  txt:"Invoice INV-2026-002 (Jane Wanjiku) overdue in 3 days — KES 44,800 outstanding.",                   time:"5h ago" },
  { dot:"var(--sky)",    txt:"New HCA application received: Faith Achieng — credentials verification pending.",                   time:"8h ago" },
  { dot:"var(--mint)",   txt:"Placement confirmed: Peter Mutua → Kamau Holdings Ltd (Patient: Robert Kamau).",                   time:"Yesterday" },
  { dot:"var(--coral)",  txt:"HCA timeliness alert: John Mwangi clocked in 22 minutes late on 2 consecutive shifts.",            time:"2 days ago" },
  { dot:"var(--amber)",  txt:"Certification expiring: Samuel Kamau's First Aid cert expires 31 May 2026 — notify HCA.",          time:"2 days ago" },
];

const QUALITY_METRICS = [
  { label:"Average HCA Rating (MTD)",        val:"4.76 / 5",   bar:95, color:"var(--mint)"  },
  { label:"Avg. Shift Timeliness",           val:"93%",        bar:93, color:"var(--sky)"   },
  { label:"Cardex Completion Rate",          val:"98.2%",      bar:98, color:"var(--jade)"  },
  { label:"Placement Responsiveness (hrs)",  val:"18h avg",    bar:72, color:"var(--amber)" },
  { label:"Client Satisfaction Score",       val:"4.8 / 5",   bar:96, color:"var(--mint)"  },
  { label:"Special Needs Compliance",        val:"91%",        bar:91, color:"var(--sky)"   },
  { label:"Escalations This Month",          val:"3",          bar:6,  color:"var(--coral)" },
  { label:"HCA Welfare Concerns Resolved",   val:"5 of 5",    bar:100,color:"var(--jade)"  },
];

const JOURNEY_STEPS = ["Account Created","T&C Accepted","Acknowledged","Call Made","Visit Done","HCA Matched","Payment Made","Placement Active"];

export default function AdminDashboard() {
  const [tab,      setTab]    = useState("overview");
  const [hcaFilter,setHcaFilter]=useState("All");
  const [search,   setSearch] = useState("");

  const filteredHCAs = HCA_DATA.filter(h => {
    const matchFilter =
      hcaFilter === "All"       ? true :
      hcaFilter === "Flagged"   ? h.flag :
      hcaFilter === "Active"    ? h.status === "Active" :
      hcaFilter === "Certified" ? h.cert : true;
    return matchFilter && (h.name.toLowerCase().includes(search.toLowerCase()) || h.id.includes(search));
  });

  return (
    <>
      <Head>
        <title>Admin Dashboard — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      <div className="dash-wrap">
        {/* ── SIDEBAR ── */}
        <aside className="dash-side">
          <div className="dash-logo">
            <Link href="/" style={{textDecoration:"none"}}>
              <div className="dash-logo-text">e<span>-</span>vive</div>
              <div className="dash-logo-sub">Super Admin</div>
            </Link>
          </div>
          <div className="dash-user">
            <div className="dash-avatar" style={{background:"linear-gradient(135deg,var(--gold),var(--amber))"}}>👑</div>
            <div>
              <div className="dash-user-name">Salome Ruguru</div>
              <div className="dash-user-role" style={{color:"var(--amber)"}}>SUPER ADMIN</div>
            </div>
          </div>
          <nav className="dash-nav">
            <div className="dash-nav-section">Management</div>
            {NAV.map(n=>(
              n.href
                ? <Link key={n.key} href={n.href} className={`dash-nav-item${tab===n.key?" active gold":""}`}><span className="dash-nav-icon">{n.icon}</span>{n.label}</Link>
                : <button key={n.key} className={`dash-nav-item${tab===n.key?" active":""}`} onClick={()=>setTab(n.key)} style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
                    <span className="dash-nav-icon">{n.icon}</span>{n.label}
                    {n.key==="hcas"&&<span className="dash-nav-badge">2</span>}
                  </button>
            ))}
          </nav>
          <div className="dash-footer">
            <Link href="/">← Public Site</Link>
            <button onClick={()=>window.location.href="/"} style={{marginTop:8,width:"100%",background:"rgba(249,112,102,0.1)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"8px 12px",color:"var(--coral)",fontSize:12,fontFamily:"var(--mono)",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
              🔒 Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="dash-main">
          <div className="dash-topbar">
            <div>
              <div className="dash-title">Admin <span>Dashboard</span></div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)"}}>Wednesday, 7 May 2026 · 850 HCAs · 2,400 Clients</div>
            </div>
            <div className="dash-actions">
              <button className="btn-p btn-sm">+ New HCA</button>
              <button className="btn-a btn-sm">+ New Client</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="dash-tabs">
            {NAV.filter(n=>!n.href).map(n=>(
              <button key={n.key} className={`dash-tab${tab===n.key?" active":""}`} onClick={()=>setTab(n.key)}>{n.icon} {n.label}</button>
            ))}
          </div>

          <div className="dash-content">

            {/* ── OVERVIEW ── */}
            {tab==="overview" && (
              <>
                <div className="stat-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
                  {[
                    {icon:"🩺",lbl:"Active HCAs",          val:"712",       delta:"+18 this month",  color:"mint",  up:true  },
                    {icon:"👥",lbl:"Active Clients",        val:"248",       delta:"+12 this month",  color:"sky",   up:true  },
                    {icon:"🏥",lbl:"Active Placements",     val:"194",       delta:"78% fill rate",   color:"amber", up:true  },
                    {icon:"💰",lbl:"Revenue MTD",           val:"KES 2.4M",  delta:"+14% vs last mo", color:"mint",  up:true  },
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                      <div className={`stat-box-delta ${s.up?"up":"down"}`}>{s.delta}</div>
                    </div>
                  ))}
                </div>
                <div className="stat-grid" style={{gridTemplateColumns:"repeat(4,1fr)",marginTop:0}}>
                  {[
                    {icon:"📋",lbl:"Pending Applications",  val:"14",        delta:"HCAs awaiting review",color:"coral", up:false },
                    {icon:"⏳",lbl:"Pending Placements",    val:"31",        delta:"Clients awaiting HCA",color:"amber", up:false },
                    {icon:"💳",lbl:"Outstanding Invoices",  val:"KES 840K",  delta:"23 invoices overdue", color:"coral", up:false },
                    {icon:"⭐",lbl:"Avg. Platform Rating",  val:"4.76★",     delta:"Based on 1,240 reviews",color:"amber",up:true },
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                      <div className={`stat-box-delta ${s.up?"up":"down"}`}>{s.delta}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:18}}>
                  {/* Alerts */}
                  <div className="panel">
                    <div className="panel-head">
                      <div className="panel-title">⚠️ Alerts & Actions Required</div>
                      <span className="badge badge-coral">{ALERTS.length}</span>
                    </div>
                    <div className="panel-body">
                      {ALERTS.map((a,i)=>(
                        <div key={i} className="alert-item">
                          <div className="alert-dot" style={{background:a.dot}} />
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.5}}>{a.txt}</div>
                            <div style={{fontSize:11,color:"rgba(254,240,232,0.28)",fontFamily:"var(--mono)",marginTop:3}}>{a.time}</div>
                          </div>
                          <button className="btn-o btn-sm" style={{flexShrink:0}}>Review</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Care Quality Snapshot */}
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">📊 Care Quality Snapshot</div></div>
                    <div className="panel-body">
                      {QUALITY_METRICS.slice(0,6).map((m,i)=>(
                        <div key={i} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <div style={{fontSize:12,color:"var(--muted)"}}>{m.label}</div>
                            <div className="metric-val" style={{color:m.color}}>{m.val}</div>
                          </div>
                          <div className="quality-bar"><div className="quality-fill" style={{width:`${m.bar}%`,background:m.color}} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Client Pipeline */}
                <div className="panel" style={{marginTop:18}}>
                  <div className="panel-head"><div className="panel-title">Client Pipeline — Recent Accounts</div><Link href="#" style={{fontSize:13,color:"var(--mint)",textDecoration:"none"}}>View All →</Link></div>
                  <div className="panel-body">
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Client</th><th>Account</th><th>Patients</th><th>Stage</th><th>Journey</th><th>Outstanding</th><th>Actions</th></tr></thead>
                        <tbody>
                          {CLIENTS_DATA.map((c,i)=>(
                            <tr key={i}>
                              <td style={{fontWeight:600}}>{c.name}</td>
                              <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{c.id}</td>
                              <td style={{textAlign:"center"}}>{c.patients}</td>
                              <td><span className={`badge ${c.cls}`}>{c.status}</span></td>
                              <td>
                                <div style={{display:"flex",gap:3}}>
                                  {JOURNEY_STEPS.map((_,j)=>(
                                    <div key={j} style={{width:10,height:10,borderRadius:2,background:j<c.journey?"var(--jade)":j===c.journey?"var(--amber)":"rgba(255,255,255,0.06)"}} />
                                  ))}
                                </div>
                                <div style={{fontSize:10,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)"}}>{JOURNEY_STEPS[c.journey-1]||"—"}</div>
                              </td>
                              <td style={{color:"var(--coral)",fontFamily:"var(--mono)",fontSize:13}}>{c.outstanding}</td>
                              <td><div style={{display:"flex",gap:6}}><button className="btn-p btn-sm">View</button><button className="btn-o btn-sm">Call</button></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── HCA MANAGEMENT ── */}
            {tab==="hcas" && (
              <>
                <div className="stat-grid">
                  {[{icon:"🩺",lbl:"Total HCAs",val:"850",color:"mint"},{icon:"✅",lbl:"Active",val:"712",color:"sky"},{icon:"⏳",lbl:"Pending Review",val:"14",color:"amber"},{icon:"🚩",lbl:"Flagged",val:"3",color:"coral"}].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="filter-bar">
                  {["All","Active","On Leave","Certified","Flagged","Pending"].map(f=>(
                    <button key={f} className={`filter-chip${hcaFilter===f?" active":""}`} onClick={()=>setHcaFilter(f)}>{f}</button>
                  ))}
                  <input className="search-bar" placeholder="Search by name or ID..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginLeft:"auto"}} />
                  <button className="btn-p btn-sm">+ Add HCA</button>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>#</th><th>HCA</th><th>ID</th><th>Cert.</th><th>Rating</th><th>Shifts</th><th>Timeliness</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredHCAs.map((h,i)=>(
                        <tr key={i}>
                          <td><div className={`hca-rank${i<3?" top":""}`}>{h.rank}</div></td>
                          <td style={{display:"flex",alignItems:"center",gap:9,padding:"13px 14px"}}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(168,0,64,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{h.av}</div>
                            <div>
                              <div style={{fontWeight:700,fontSize:13}}>{h.name}</div>
                              {h.flag && <span className="badge badge-coral" style={{fontSize:10}}>🚩 Flagged</span>}
                            </div>
                          </td>
                          <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{h.id}</td>
                          <td><span className={`badge ${h.cert?"badge-mint":"badge-dim"}`}>{h.cert?"✓ Cert.":"Non-Cert."}</span></td>
                          <td style={{color:"var(--amber)",fontWeight:700}}>★ {h.rating}</td>
                          <td>{h.shifts}</td>
                          <td>
                            <span style={{color:h.timeliness>=95?"var(--mint)":h.timeliness>=85?"var(--amber)":"var(--coral)",fontFamily:"var(--mono)",fontWeight:700}}>{h.timeliness}%</span>
                          </td>
                          <td><span className={`badge ${h.status==="Active"?"badge-mint":h.status==="On Leave"?"badge-gold":"badge-dim"}`}>{h.status}</span></td>
                          <td><div style={{display:"flex",gap:6}}><button className="btn-p btn-sm">Profile</button><button className="btn-o btn-sm">Cardex</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── CLIENTS ── */}
            {tab==="clients" && (
              <>
                <div className="stat-grid">
                  {[{icon:"👥",lbl:"Total Clients",val:"248",color:"mint"},{icon:"👨‍👩‍👧",lbl:"Total Patients",val:"312",color:"sky"},{icon:"🏥",lbl:"Active Placements",val:"194",color:"amber"},{icon:"📅",lbl:"Pending Visits",val:"8",color:"coral"}].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Client</th><th>Account</th><th>Patients</th><th>Stage</th><th>Journey Progress</th><th>Outstanding</th><th>Actions</th></tr></thead>
                    <tbody>
                      {CLIENTS_DATA.map((c,i)=>(
                        <tr key={i}>
                          <td style={{fontWeight:700}}>{c.name}</td>
                          <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{c.id}</td>
                          <td style={{textAlign:"center"}}>{c.patients}</td>
                          <td><span className={`badge ${c.cls}`}>{c.status}</span></td>
                          <td>
                            <div style={{display:"flex",gap:3,marginBottom:4}}>
                              {JOURNEY_STEPS.map((_,j)=>(
                                <div key={j} title={JOURNEY_STEPS[j]} style={{width:14,height:14,borderRadius:3,background:j<c.journey?"var(--jade)":j===c.journey?"var(--amber)":"rgba(255,255,255,0.06)",cursor:"pointer"}} />
                              ))}
                            </div>
                            <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)"}}>{JOURNEY_STEPS[c.journey-1]}</div>
                          </td>
                          <td style={{color:c.outstanding==="KES 0"?"var(--mint)":"var(--coral)",fontFamily:"var(--mono)",fontSize:13,fontWeight:700}}>{c.outstanding}</td>
                          <td><div style={{display:"flex",gap:6}}><button className="btn-p btn-sm">Dashboard</button><button className="btn-o btn-sm">Invoice</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── CARE QUALITY ── */}
            {tab==="quality" && (
              <>
                <div className="stat-grid">
                  {[{icon:"⭐",lbl:"Avg. HCA Rating",val:"4.76",color:"amber"},{icon:"⏱️",lbl:"Timeliness",val:"93%",color:"mint"},{icon:"📋",lbl:"Cardex Rate",val:"98.2%",color:"sky"},{icon:"🚩",lbl:"Flags This Month",val:"7",color:"coral"}].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Quality Metrics</div></div>
                    <div className="panel-body">
                      {QUALITY_METRICS.map((m,i)=>(
                        <div key={i} style={{marginBottom:16}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <div style={{fontSize:13,color:"var(--muted)"}}>{m.label}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:m.color}}>{m.val}</div>
                          </div>
                          <div className="quality-bar"><div className="quality-fill" style={{width:`${m.bar}%`,background:m.color}} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Recent Flags & Incidents</div><span className="badge badge-coral">7 open</span></div>
                    <div className="panel-body">
                      {[
                        {hca:"Grace Otieno",type:"Special Needs Missed",severity:"High",date:"Today"},
                        {hca:"John Mwangi",type:"Late Clock-In (x2)",severity:"Medium",date:"Yesterday"},
                        {hca:"Samuel Kamau",type:"Cert. Expiring Soon",severity:"Low",date:"2 days ago"},
                        {hca:"—",type:"Client Complaint — Kamau Holdings",severity:"High",date:"3 days ago"},
                      ].map((f,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<3?"1px solid rgba(168,0,64,0.07)":"none"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:f.severity==="High"?"var(--coral)":f.severity==="Medium"?"var(--amber)":"var(--mint)",flexShrink:0}} />
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:600}}>{f.type}</div>
                            <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{f.hca} · {f.date}</div>
                          </div>
                          <span className={`badge ${f.severity==="High"?"badge-coral":f.severity==="Medium"?"badge-gold":"badge-mint"}`}>{f.severity}</span>
                          <button className="btn-o btn-sm">Resolve</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── TRAINING ── */}
            {tab==="training" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <div style={{fontWeight:700,fontSize:16}}>Training Management</div>
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn-sky btn-sm">+ Announce Training</button>
                    <button className="btn-p btn-sm">+ Add Trainer</button>
                  </div>
                </div>
                <div className="stat-grid">
                  {[{icon:"📅",lbl:"Upcoming Trainings",val:"4",color:"sky"},{icon:"🩺",lbl:"HCAs Enrolled",val:"148",color:"mint"},{icon:"📜",lbl:"Certs Expiring 30d",val:"12",color:"coral"},{icon:"🎓",lbl:"Completion Rate",val:"91%",color:"amber"}].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Training</th><th>Type</th><th>Date</th><th>Trainer</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {[
                        ["Advanced Dementia Care","In-Person","15 May 2026","Dr. Achieng","24/30","Upcoming"],
                        ["Medication Administration","Online","22 May 2026","E-Vive Team","41/∞","Open"],
                        ["Palliative Care Principles","Online","Jun 2026","Dr. Karanja","12/∞","Open"],
                        ["Mobility & Physio Assist","In-Person","Jun 2026","PhysioKe","8/25","Open"],
                      ].map(([n,t,d,tr,e,s],i)=>(
                        <tr key={i}>
                          <td style={{fontWeight:600}}>{n}</td>
                          <td><span className={`badge ${t==="Online"?"badge-sky":"badge-gold"}`}>{t}</span></td>
                          <td style={{fontFamily:"var(--mono)",fontSize:12}}>{d}</td>
                          <td style={{fontSize:12,color:"var(--muted)"}}>{tr}</td>
                          <td style={{fontFamily:"var(--mono)",fontSize:12}}>{e}</td>
                          <td><span className={`badge ${s==="Upcoming"?"badge-amber":"badge-mint"}`}>{s}</span></td>
                          <td><div style={{display:"flex",gap:6}}><button className="btn-p btn-sm">Manage</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── CALENDAR / HR ── */}
            {tab==="calendar" && (
              <div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)"}}>
                <div style={{fontSize:48,marginBottom:16}}>📅</div>
                <div style={{fontSize:16,marginBottom:8}}>Calendar & HR Management</div>
                <div style={{fontSize:13,maxWidth:400,margin:"0 auto"}}>Full calendar view showing all HCA shifts, placements, off-day requests and training schedules. Interactive rota management coming Q3 2026.</div>
              </div>
            )}

            {/* ── SETTINGS / RBAC ── */}
            {tab==="settings" && (
              <div>
                <div style={{marginBottom:20,fontWeight:700,fontSize:16}}>User Management & Access Control</div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Role-Based Access Control (RBAC)</div><button className="btn-p btn-sm">+ Add User</button></div>
                  <div className="panel-body">
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Role</th><th>Description</th><th>Permissions</th><th>Users</th><th>Actions</th></tr></thead>
                        <tbody>
                          {[
                            ["Super Admin","Full platform access — all modules, RBAC, pricing","All","1"],
                            ["HCA Account Manager","HCA recruitment, placement, quality monitoring","HCAs, Clients, Cardex (read)","3"],
                            ["Finance Admin","Billing, invoicing, payroll, expense management","Finance module only","2"],
                            ["Client Coordinator","Client onboarding, visits, journey tracking","Clients, Patients, Calendar","4"],
                            ["HCA","Own profile, Cardex, calendar, training, welfare","Own data only","712"],
                            ["Client","Patient accounts, shortlist, billing, shift reports","Own data only","248"],
                          ].map(([r,d,p,u],i)=>(
                            <tr key={i}>
                              <td style={{fontWeight:700}}>{r}</td>
                              <td style={{fontSize:12,color:"var(--muted)"}}>{d}</td>
                              <td style={{fontSize:11,color:"var(--mint)",fontFamily:"var(--mono)"}}>{p}</td>
                              <td style={{textAlign:"center"}}>{u}</td>
                              <td><button className="btn-o btn-sm">Edit</button></td>
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
