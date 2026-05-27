import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { DASH_BASE } from "../../components/SharedStyles";

const CSS = `
  .rev-bar { height:6px; border-radius:100px; background:rgba(255,255,255,0.08); overflow:hidden; margin-top:5px; }
  .rev-fill { height:100%; border-radius:100px; }
  .exp-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .exp-row:last-child { border-bottom:none; }
`;

const NAV = [
  { icon:"📊", label:"Overview",        key:"overview", href:"/admin/dashboard" },
  { icon:"💰", label:"Revenue",         key:"revenue"  },
  { icon:"💳", label:"Client Invoices", key:"invoices" },
  { icon:"🩺", label:"HCA Payroll",     key:"payroll"  },
  { icon:"🧾", label:"Expenses",        key:"expenses" },
  { icon:"📈", label:"Reports",         key:"reports"  },
];

const INVOICES = [
  { num:"INV-2026-001", client:"Jane Wanjiku",         patient:"Margaret Wanjiku",  desc:"Placement fee Week 1",      date:"01 May 2026", due:"07 May 2026", amt:14000, status:"Paid",    cls:"badge-mint"  },
  { num:"INV-2026-002", client:"Jane Wanjiku",         patient:"Margaret Wanjiku",  desc:"Weekly care — 7 shifts",    date:"08 May 2026", due:"14 May 2026", amt:44800, status:"Pending", cls:"badge-gold"  },
  { num:"INV-2026-003", client:"Dr. Ochieng Family",   patient:"Thomas Ochieng",    desc:"Monthly care package",      date:"01 May 2026", due:"07 May 2026", amt:92000, status:"Paid",    cls:"badge-mint"  },
  { num:"INV-2026-004", client:"Kamau Holdings Ltd",   patient:"Robert Kamau",      desc:"Placement + 2 weeks care",  date:"28 Apr 2026", due:"05 May 2026", amt:84000, status:"Overdue", cls:"badge-coral" },
  { num:"INV-2026-005", client:"Agnes Mwende",         patient:"Joseph Mwende",     desc:"Placement fee",             date:"05 May 2026", due:"12 May 2026", amt:8000,  status:"Pending", cls:"badge-gold"  },
];

const PAYROLL = [
  { av:"👩🏾", name:"Amina Njeri",    id:"HCA-012", shifts:14, rate:800, hours:112, gross:89600, deductions:4480, net:85120, status:"Pending"  },
  { av:"👨🏽", name:"Peter Mutua",    id:"HCA-031", shifts:12, rate:900, hours:96,  gross:86400, deductions:4320, net:82080, status:"Pending"  },
  { av:"👩🏿", name:"Mary Chebet",   id:"HCA-008", shifts:16, rate:750, hours:128, gross:96000, deductions:4800, net:91200, status:"Paid"     },
  { av:"👨🏿", name:"John Mwangi",   id:"HCA-019", shifts:11, rate:650, hours:88,  gross:57200, deductions:2860, net:54340, status:"Pending"  },
  { av:"👩🏽", name:"Grace Otieno",  id:"HCA-007", shifts:8,  rate:700, hours:64,  gross:44800, deductions:2240, net:42560, status:"On Hold"  },
];

const EXPENSES = [
  { icon:"⛽", cat:"Transport",        desc:"Supervision visit fuel — Kilimani & Karen",  date:"06 May 2026", amt:3200,  cls:"badge-sky"  },
  { icon:"📞", cat:"Communications",   desc:"Client & HCA call bundle — May",             date:"01 May 2026", amt:4800,  cls:"badge-sky"  },
  { icon:"🖨️", cat:"Printing",         desc:"Contracts, cardex forms, brochures",         date:"03 May 2026", amt:1800,  cls:"badge-dim"  },
  { icon:"🏠", cat:"Supervision Visit",desc:"Client home visits — 8 visits × KES 1,200",  date:"05 May 2026", amt:9600,  cls:"badge-gold" },
  { icon:"🎓", cat:"Training",         desc:"Venue hire — Dementia Care workshop",        date:"04 May 2026", amt:15000, cls:"badge-gold" },
  { icon:"🩺", cat:"HCA Welfare",      desc:"Counsellor sessions × 3 HCAs",              date:"02 May 2026", amt:9000,  cls:"badge-mint" },
  { icon:"💻", cat:"Platform",         desc:"Hosting, SMS API, maps API — monthly",       date:"01 May 2026", amt:12000, cls:"badge-dim"  },
];

const MONTHLY = [
  { mo:"Nov 2025", rev:840000,  exp:210000, profit:630000 },
  { mo:"Dec 2025", rev:960000,  exp:230000, profit:730000 },
  { mo:"Jan 2026", rev:1100000, exp:270000, profit:830000 },
  { mo:"Feb 2026", rev:1380000, exp:310000, profit:1070000},
  { mo:"Mar 2026", rev:1820000, exp:380000, profit:1440000},
  { mo:"Apr 2026", rev:2180000, exp:440000, profit:1740000},
  { mo:"May 2026", rev:2400000, exp:460000, profit:1940000},
];

const fmtK = n => n >= 1000000 ? `KES ${(n/1000000).toFixed(1)}M` : `KES ${(n/1000).toFixed(0)}K`;

export default function AdminFinance() {
  const [tab, setTab]       = useState("revenue");
  const [payFilter,setPayFilter]=useState("All");

  const filteredPayroll = payFilter==="All" ? PAYROLL : PAYROLL.filter(p=>p.status===payFilter);
  const totalOutstanding = INVOICES.filter(i=>i.status!=="Paid").reduce((a,b)=>a+b.amt,0);
  const totalPaid        = INVOICES.filter(i=>i.status==="Paid").reduce((a,b)=>a+b.amt,0);
  const totalPayroll     = PAYROLL.filter(p=>p.status==="Pending").reduce((a,b)=>a+b.net,0);
  const totalExpenses    = EXPENSES.reduce((a,b)=>a+b.amt,0);
  const maxRev           = Math.max(...MONTHLY.map(m=>m.rev));

  return (
    <>
      <Head>
        <title>Finance — E-Vive Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      <div className="dash-wrap">
        {/* ── SIDEBAR ── */}
        <aside className="dash-side">
          <div className="dash-logo">
            <Link href="/" style={{textDecoration:"none"}}>
              <div className="dash-logo-text">e<span>-</span>vive</div>
              <div className="dash-logo-sub">Finance Module</div>
            </Link>
          </div>
          <div className="dash-user">
            <div className="dash-avatar" style={{background:"linear-gradient(135deg,var(--gold),var(--amber))"}}>👑</div>
            <div><div className="dash-user-name">Salome Ruguru</div><div className="dash-user-role" style={{color:"var(--amber)"}}>SUPER ADMIN</div></div>
          </div>
          <nav className="dash-nav">
            <div className="dash-nav-section">Finance</div>
            {NAV.map(n=>(
              n.href
                ? <Link key={n.key} href={n.href} className="dash-nav-item"><span className="dash-nav-icon">{n.icon}</span>{n.label}</Link>
                : <button key={n.key} className={`dash-nav-item${tab===n.key?" active gold":""}`} onClick={()=>setTab(n.key)} style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
                    <span className="dash-nav-icon">{n.icon}</span>{n.label}
                  </button>
            ))}
          </nav>
          <div className="dash-footer">
            <Link href="/admin/dashboard">← Admin Dashboard</Link>
            <button onClick={()=>window.location.href="/"} style={{marginTop:8,width:"100%",background:"rgba(249,112,102,0.1)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"8px 12px",color:"var(--coral)",fontSize:12,fontFamily:"var(--mono)",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
              🔒 Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="dash-main">
          <div className="dash-topbar">
            <div>
              <div className="dash-title">Finance <span>Module</span></div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)"}}>May 2026 · All figures in KES</div>
            </div>
            <div className="dash-actions">
              <button className="btn-p btn-sm">📤 Export</button>
              <button className="btn-a btn-sm">+ New Invoice</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="dash-tabs">
            {NAV.filter(n=>!n.href).map(n=>(
              <button key={n.key} className={`dash-tab${tab===n.key?" active":""}`} onClick={()=>setTab(n.key)}>{n.icon} {n.label}</button>
            ))}
          </div>

          <div className="dash-content">

            {/* ── REVENUE OVERVIEW ── */}
            {tab==="revenue" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"💰",lbl:"Revenue MTD",        val:"KES 2.4M",  delta:"+14.4% vs Apr",   color:"mint",  up:true  },
                    {icon:"📈",lbl:"MRR",                val:"KES 2.1M",  delta:"Recurring clients",color:"amber", up:true  },
                    {icon:"💳",lbl:"Outstanding",        val:fmtK(totalOutstanding), delta:`${INVOICES.filter(i=>i.status!=="Paid").length} invoices`,color:"coral",up:false},
                    {icon:"📊",lbl:"Profit MTD (est.)",  val:"KES 1.94M", delta:"Margin: 80.8%",    color:"mint",  up:true  },
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                      <div className={`stat-box-delta ${s.up?"up":"down"}`}>{s.delta}</div>
                    </div>
                  ))}
                </div>

                {/* Revenue trend */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head"><div className="panel-title">Monthly Revenue Trend</div><span className="badge badge-mint">Last 7 months</span></div>
                  <div className="panel-body">
                    <div style={{display:"flex",alignItems:"flex-end",gap:12,height:140,paddingBottom:8}}>
                      {MONTHLY.map((m,i)=>(
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                          <div style={{fontSize:10,color:"var(--mint)",fontFamily:"var(--mono)",fontWeight:700}}>{fmtK(m.rev)}</div>
                          <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",gap:2}}>
                            <div style={{height:`${(m.profit/maxRev)*100}%`,background:"linear-gradient(0deg,var(--jade),var(--mint))",borderRadius:"4px 4px 0 0",minHeight:4}} />
                            <div style={{height:`${(m.exp/maxRev)*100}%`,background:"rgba(200,149,42,0.4)",borderRadius:0,minHeight:2}} />
                          </div>
                          <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",textAlign:"center"}}>{m.mo.split(" ")[0]}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:16,marginTop:8}}>
                      {[["var(--mint)","Profit"],["rgba(200,149,42,0.4)","Expenses"]].map(([c,l])=>(
                        <div key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--muted)"}}>
                          <div style={{width:12,height:12,borderRadius:3,background:c}} />{l}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue by category */}
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Revenue by Category — MTD</div></div>
                  <div className="panel-body">
                    {[
                      {cat:"Placement Fees",       rev:480000,  pct:20},
                      {cat:"Weekly/Monthly Care",  rev:1560000, pct:65},
                      {cat:"HCA Subscriptions",    rev:240000,  pct:10},
                      {cat:"Training Fees",        rev:72000,   pct:3 },
                      {cat:"Partner Referral Fees",rev:48000,   pct:2 },
                    ].map((r,i)=>(
                      <div key={i} style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <div style={{fontSize:13}}>{r.cat}</div>
                          <div style={{display:"flex",gap:12}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>{r.pct}%</div>
                            <div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,color:"var(--mint)",minWidth:90,textAlign:"right"}}>{fmtK(r.rev)}</div>
                          </div>
                        </div>
                        <div className="rev-bar"><div className="rev-fill" style={{width:`${r.pct*5}%`,background:"linear-gradient(90deg,var(--jade),var(--mint))"}} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── INVOICES ── */}
            {tab==="invoices" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"📄",lbl:"Total Invoiced",  val:fmtK(INVOICES.reduce((a,b)=>a+b.amt,0)), color:"mint"  },
                    {icon:"✅",lbl:"Collected",        val:fmtK(totalPaid),                         color:"mint"  },
                    {icon:"⏳",lbl:"Pending",          val:fmtK(totalOutstanding),                   color:"amber" },
                    {icon:"🚨",lbl:"Overdue",          val:fmtK(INVOICES.filter(i=>i.status==="Overdue").reduce((a,b)=>a+b.amt,0)), color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Invoice #</th><th>Client</th><th>Patient</th><th>Description</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {INVOICES.map((inv,i)=>(
                        <tr key={i}>
                          <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>{inv.num}</td>
                          <td style={{fontWeight:600}}>{inv.client}</td>
                          <td style={{fontSize:12,color:"var(--muted)"}}>{inv.patient}</td>
                          <td style={{fontSize:12}}>{inv.desc}</td>
                          <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{inv.date}</td>
                          <td style={{fontFamily:"var(--mono)",fontSize:11,color:inv.status==="Overdue"?"var(--coral)":"var(--muted)"}}>{inv.due}</td>
                          <td style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,color:inv.status==="Paid"?"var(--mint)":inv.status==="Overdue"?"var(--coral)":"var(--amber)"}}>KES {inv.amt.toLocaleString()}</td>
                          <td><span className={`badge ${inv.cls}`}>{inv.status}</span></td>
                          <td><div style={{display:"flex",gap:6}}>
                            <button className="btn-o btn-sm">PDF</button>
                            {inv.status!=="Paid" && <button className="btn-p btn-sm">{inv.status==="Overdue"?"Send Reminder":"Mark Paid"}</button>}
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── HCA PAYROLL ── */}
            {tab==="payroll" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"💳",lbl:"Payroll Due",      val:fmtK(totalPayroll),   color:"amber"},
                    {icon:"✅",lbl:"Paid This Month",  val:fmtK(PAYROLL.filter(p=>p.status==="Paid").reduce((a,b)=>a+b.net,0)), color:"mint"},
                    {icon:"🩺",lbl:"HCAs on Payroll",  val:PAYROLL.length+"",   color:"sky"  },
                    {icon:"🚫",lbl:"On Hold",          val:PAYROLL.filter(p=>p.status==="On Hold").length+"", color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                  {["All","Pending","Paid","On Hold"].map(f=>(
                    <button key={f} className={`filter-chip${payFilter===f?" active":""}`} style={{padding:"6px 14px",borderRadius:"100px",fontSize:12,fontWeight:500,fontFamily:"var(--mono)",border:"1px solid rgba(168,0,64,0.18)",background:"transparent",color:"var(--muted)",cursor:"pointer",transition:"all 0.2s"}} onClick={()=>setPayFilter(f)}>{f}</button>
                  ))}
                  <button className="btn-a btn-sm" style={{marginLeft:"auto"}}>💳 Process All Pending</button>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>HCA</th><th>ID</th><th>Shifts</th><th>Hrs</th><th>Rate/hr</th><th>Gross</th><th>Deductions (5%)</th><th>Net Pay</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredPayroll.map((p,i)=>(
                        <tr key={i}>
                          <td style={{display:"flex",alignItems:"center",gap:8,padding:"13px 14px"}}>
                            <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(14,165,233,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{p.av}</div>
                            <span style={{fontWeight:600,fontSize:13}}>{p.name}</span>
                          </td>
                          <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{p.id}</td>
                          <td>{p.shifts}</td>
                          <td>{p.hours}</td>
                          <td style={{color:"var(--amber)",fontFamily:"var(--mono)",fontSize:12}}>KES {p.rate}</td>
                          <td style={{fontFamily:"var(--mono)",fontSize:12}}>KES {p.gross.toLocaleString()}</td>
                          <td style={{color:"var(--coral)",fontFamily:"var(--mono)",fontSize:12}}>- KES {p.deductions.toLocaleString()}</td>
                          <td style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,color:p.status==="Paid"?"var(--mint)":"var(--amber)"}}>KES {p.net.toLocaleString()}</td>
                          <td><span className={`badge ${p.status==="Paid"?"badge-mint":p.status==="On Hold"?"badge-coral":"badge-gold"}`}>{p.status}</span></td>
                          <td>
                            {p.status==="Pending" && <button className="btn-p btn-sm">Pay Now</button>}
                            {p.status==="On Hold" && <button className="btn-o btn-sm">Review</button>}
                            {p.status==="Paid"    && <button className="btn-o btn-sm">Receipt</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── EXPENSES ── */}
            {tab==="expenses" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"🧾",lbl:"Total Expenses MTD", val:fmtK(totalExpenses),color:"coral"},
                    {icon:"⛽",lbl:"Transport",           val:"KES 3,200",        color:"amber"},
                    {icon:"🎓",lbl:"Training",            val:"KES 15,000",       color:"sky"  },
                    {icon:"💻",lbl:"Platform/Tech",       val:"KES 12,000",       color:"mint" },
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:18}}>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Expense Log — May 2026</div><button className="btn-p btn-sm">+ Add Expense</button></div>
                    <div className="panel-body">
                      {EXPENSES.map((e,i)=>(
                        <div key={i} className="exp-row">
                          <span style={{fontSize:22}}>{e.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:13}}>{e.desc}</div>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{e.cat} · {e.date}</div>
                          </div>
                          <span className={`badge ${e.cls}`}>{e.cat}</span>
                          <div style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:700,color:"var(--coral)",minWidth:90,textAlign:"right"}}>KES {e.amt.toLocaleString()}</div>
                          <button className="btn-o btn-sm">Edit</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Expense Breakdown</div></div>
                    <div className="panel-body">
                      {[
                        {cat:"Training",            amt:15000, pct:28},
                        {cat:"Platform/Tech",       amt:12000, pct:22},
                        {cat:"Supervision Visits",  amt:9600,  pct:18},
                        {cat:"HCA Welfare",         amt:9000,  pct:17},
                        {cat:"Communications",      amt:4800,  pct:9 },
                        {cat:"Transport",           amt:3200,  pct:6 },
                      ].map((r,i)=>(
                        <div key={i} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <div style={{fontSize:13}}>{r.cat}</div>
                            <div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,color:"var(--coral)"}}>KES {r.amt.toLocaleString()}</div>
                          </div>
                          <div className="rev-bar"><div className="rev-fill" style={{width:`${r.pct*3}%`,background:"linear-gradient(90deg,rgba(249,112,102,0.6),rgba(249,112,102,0.9))"}} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── REPORTS ── */}
            {tab==="reports" && (
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  {[
                    {icon:"📊",title:"P&L Statement",       sub:"Monthly profit & loss summary",          period:"May 2026"},
                    {icon:"💳",title:"Accounts Receivable",  sub:"Outstanding client invoices & aging",    period:"Current"},
                    {icon:"🩺",title:"HCA Payroll Summary",  sub:"Shift earnings by HCA — exportable",     period:"May 2026"},
                    {icon:"📈",title:"Revenue Forecast",     sub:"6-month projection based on trends",     period:"Jun–Nov 2026"},
                    {icon:"🧾",title:"Expense Report",       sub:"Full expense ledger with categories",    period:"May 2026"},
                    {icon:"📋",title:"Care Quality Report",  sub:"Quality metrics, flags, ratings summary",period:"May 2026"},
                  ].map((r,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(168,0,64,0.12)",borderRadius:16,padding:20,display:"flex",alignItems:"center",gap:14}}>
                      <span style={{fontSize:32}}>{r.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{r.title}</div>
                        <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>{r.sub}</div>
                        <span className="badge badge-dim">{r.period}</span>
                      </div>
                      <div style={{display:"flex",gap:8,flexDirection:"column"}}>
                        <button className="btn-p btn-sm">📤 Export</button>
                        <button className="btn-o btn-sm">Preview</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
