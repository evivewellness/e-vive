import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DASH_BASE } from "../../components/SharedStyles";
import {
  getAllInvoices, createInvoice, approveInvoicePayment,
  getAllClients, advanceClientJourney, JOURNEY_STAGES,
  getAdminSession, clearAdminSession,
  getAllHcaProfiles, getAllShifts,
  getAllExpenses, createExpense, deleteExpense,
  getPayrollPayments, createPayrollPayment,
} from "../../lib/store";

const CSS = `
  .rev-bar  { height:6px; border-radius:100px; background:rgba(255,255,255,0.08); overflow:hidden; margin-top:5px; }
  .rev-fill { height:100%; border-radius:100px; }
  .exp-row  { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .exp-row:last-child { border-bottom:none; }
  .finmodal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px; }
  .finmodal { background:#fff;border-radius:20px;padding:28px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,0.18); }
  .finmodal h3 { margin:0 0 18px;font-size:18px;font-weight:700; }
  .finmodal label { font-size:11px;font-weight:600;color:var(--jade);letter-spacing:.5px;font-family:var(--mono);text-transform:uppercase;display:block;margin-bottom:5px;margin-top:12px; }
  .finmodal input,.finmodal select,.finmodal textarea { width:100%;border:1px solid rgba(0,74,153,.18);border-radius:9px;padding:10px 14px;font-size:13px;font-family:var(--sans);outline:none;box-sizing:border-box; }
  .finmodal input:focus,.finmodal select:focus { border-color:var(--jade); }
  .finmodal .row2 { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
  .finmodal .actions { display:flex;justify-content:flex-end;gap:10px;margin-top:20px; }
  @media(max-width:900px){
    .dash-hamburger{display:flex;}
    .dash-side{position:fixed;top:0;left:-260px;bottom:0;width:240px;z-index:199;transition:left .28s cubic-bezier(.4,0,.2,1);box-shadow:none;}
    .dash-side.open{left:0;box-shadow:6px 0 40px rgba(0,74,153,.2);}
  }
`;

const NAV = [
  { icon:"📊", label:"Overview",        key:"overview", href:"/admin/dashboard" },
  { icon:"💰", label:"Revenue",         key:"revenue"  },
  { icon:"💳", label:"Client Invoices", key:"invoices" },
  { icon:"🩺", label:"HCA Payroll",     key:"payroll"  },
  { icon:"🧾", label:"Expenses",        key:"expenses" },
  { icon:"📈", label:"Reports",         key:"reports"  },
];

const EXPENSE_ICONS = ["💳","⛽","📞","🖨️","🏠","🎓","🩺","💻","📦","🏢","✈️","🍽️"];
const INVOICE_TYPES = ["Placement & Assessment Fee","Weekly Care","Monthly Care","Home Assessment","HCA Subscription","Training Fee","Consultation Fee","Other"];

const fmtK    = n => n >= 1000000 ? `KES ${(n/1e6).toFixed(2)}M` : n >= 1000 ? `KES ${(n/1000).toFixed(0)}K` : `KES ${n}`;
const fmtAmt  = n => `KES ${Number(n||0).toLocaleString()}`;
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return iso?.slice(0,10)||"—"; } };

function downloadCSV(filename, rows, headers) {
  const escape = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const lines  = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))];
  const blob   = new Blob([lines.join('\n')], { type:'text/csv' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── New Invoice Modal ────────────────────────────────────────────────────────
function NewInvoiceModal({ clients, onClose, onCreated }) {
  const blank = { clientId:'', description:INVOICE_TYPES[0], amount:'', dueDate:'' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  async function submit() {
    if (!form.clientId || !form.amount) { setMsg('Client and amount are required.'); return; }
    setSaving(true);
    try {
      const inv = await createInvoice({
        clientId: form.clientId,
        description: form.description,
        subtotal: Number(form.amount),
        total: Number(form.amount),
        dueDate: form.dueDate || null,
      });
      onCreated(inv);
    } catch(e) { setMsg(e.message); setSaving(false); }
  }

  return (
    <div className="finmodal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="finmodal">
        <h3>+ New Invoice</h3>
        <label>Client *</label>
        <select value={form.clientId} onChange={e=>upd('clientId',e.target.value)}>
          <option value="">— select client —</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label>Description / Type</label>
        <select value={form.description} onChange={e=>upd('description',e.target.value)}>
          {INVOICE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <div className="row2">
          <div>
            <label>Amount (KES) *</label>
            <input type="number" placeholder="e.g. 3500" value={form.amount} onChange={e=>upd('amount',e.target.value)} min="0" />
          </div>
          <div>
            <label>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e=>upd('dueDate',e.target.value)} />
          </div>
        </div>
        {msg && <div style={{marginTop:10,fontSize:12,color:'var(--coral)'}}>{msg}</div>}
        <div className="actions">
          <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-p btn-sm" disabled={saving} onClick={submit}>{saving?'Creating…':'Create Invoice'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminFinance() {
  const router = useRouter();
  const now    = new Date();
  const curMonth = now.getMonth() + 1;   // 1-based
  const curYear  = now.getFullYear();

  const [authed,     setAuthed]     = useState(false);
  const [sideOpen,   setSideOpen]   = useState(false);
  const [tab,        setTab]        = useState("revenue");
  const [invoices,   setInvoices]   = useState([]);
  const [clients,    setClients]    = useState([]);
  const [payrollRows,setPayrollRows]= useState([]);   // computed from shifts
  const [paidThisMonth, setPaidThisMonth] = useState([]); // payroll_payments records
  const [expenses,   setExpenses]   = useState([]);
  const [expMsg,     setExpMsg]     = useState("");
  const [newExp,     setNewExp]     = useState({ icon:"💳", category:"", description:"", date:now.toISOString().slice(0,10), amount:"" });
  const [showNewInv, setShowNewInv] = useState(false);
  const [payFilter,  setPayFilter]  = useState("All");

  // Auth guard
  useEffect(() => {
    try {
      const s = getAdminSession();
      if (!s?.id) { router.replace("/admin/login"); return; }
      setAuthed(true);
    } catch { router.replace("/admin/login"); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data
  useEffect(() => {
    if (!authed) return;
    async function load() {
      const [invList, clientList, profiles, allShifts, exps, paidList] = await Promise.all([
        getAllInvoices(), getAllClients(), getAllHcaProfiles(),
        getAllShifts(), getAllExpenses(), getPayrollPayments(curMonth, curYear),
      ]);
      setInvoices(invList);
      setClients(clientList);
      setExpenses(exps);
      setPaidThisMonth(paidList);

      // Build payroll rows from active profiles × completed shifts this month
      const active = profiles.filter(h => h.status === 'active');
      const rows = active.map(h => {
        const monthShifts = allShifts.filter(s => {
          if (s.hcaId !== h.id || s.status !== 'completed') return false;
          const d = new Date(s.date || s.clockOut || '');
          return !isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === curYear;
        });
        const rate       = h.rate || 2000;
        const shifts     = monthShifts.length;
        const hours      = shifts * 8;
        const gross      = shifts * rate;
        const deductions = Math.round(gross * 0.05);
        const alreadyPaid = paidList.some(p => p.hcaId === h.id);
        return {
          hcaId: h.id,
          av: (h.name||'?')[0],
          name: h.name || 'Unknown',
          empId: h.employeeId || h.id?.slice(0,8) || '—',
          shifts, rate, hours, gross, deductions,
          net: gross - deductions,
          status: alreadyPaid ? 'Paid' : 'Pending',
        };
      });
      setPayrollRows(rows);
    }
    load();
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived stats ────────────────────────────────────────────────────────────
  const monthStart = new Date(curYear, now.getMonth(), 1);

  const mtdInvoices  = invoices.filter(i => new Date(i.createdAt||i.issuedAt||'') >= monthStart);
  const revenueMTD   = mtdInvoices.reduce((a,b) => a+(b.total||0), 0);
  const expensesMTD  = expenses.filter(e => new Date(e.date||'') >= monthStart).reduce((a,b) => a+(b.amount||0), 0);
  const profitMTD    = revenueMTD - expensesMTD;
  const margin       = revenueMTD > 0 ? ((profitMTD/revenueMTD)*100).toFixed(1) : '0.0';

  // MRR: average monthly revenue across distinct months with data
  const byMonth = {};
  invoices.forEach(inv => {
    const d = new Date(inv.createdAt || inv.issuedAt || '');
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    byMonth[key] = (byMonth[key]||0) + (inv.total||0);
  });
  const monthlyRevs  = Object.values(byMonth);
  const mrr          = monthlyRevs.length ? Math.round(monthlyRevs.reduce((a,b)=>a+b,0)/monthlyRevs.length) : 0;

  const totalOutstanding = invoices.filter(i=>i.status!=='paid').reduce((a,b)=>a+(b.total||0),0);
  const totalPaid        = invoices.filter(i=>i.status==='paid').reduce((a,b)=>a+(b.total||0),0);
  const totalExpenses    = expenses.reduce((a,b)=>a+(b.amount||0),0);
  const totalPayrollDue  = payrollRows.filter(p=>p.status==='Pending').reduce((a,b)=>a+b.net,0);
  const totalPayrollPaid = payrollRows.filter(p=>p.status==='Paid').reduce((a,b)=>a+b.net,0);

  // Monthly chart data (last 6 months)
  const MONTHLY = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d  = new Date(curYear, now.getMonth()-i, 1);
      const mo = d.toLocaleDateString('en-GB',{month:'short',year:'numeric'});
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const rev = byMonth[key] || 0;
      const exp = expenses.filter(e => {
        const ed = new Date(e.date||'');
        return !isNaN(ed) && ed.getMonth()===d.getMonth() && ed.getFullYear()===d.getFullYear();
      }).reduce((a,b)=>a+(b.amount||0),0);
      months.push({ mo, rev, exp, profit: Math.max(0, rev - exp) });
    }
    return months;
  })();
  const maxRev = Math.max(...MONTHLY.map(m=>m.rev), 1);

  // Revenue categories from invoice descriptions
  const REV_CATEGORIES = (() => {
    const cats = {};
    invoices.forEach(inv => {
      const d = inv.description || 'Other';
      const bucket =
        /placement/i.test(d)     ? 'Placement Fees' :
        /weekly|monthly|care/i.test(d) ? 'Ongoing Care' :
        /subscription/i.test(d)  ? 'HCA Subscriptions' :
        /training/i.test(d)      ? 'Training Fees' :
        /partner|referral/i.test(d) ? 'Partner Referrals' :
        /assessment/i.test(d)    ? 'Assessments' : 'Other';
      cats[bucket] = (cats[bucket]||0) + (inv.total||0);
    });
    const total = Object.values(cats).reduce((a,b)=>a+b,0) || 1;
    return Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat,rev])=>({
      cat, rev, pct: Math.round((rev/total)*100),
    }));
  })();

  // ── Payroll helpers ──────────────────────────────────────────────────────────
  const filteredPayroll = payFilter==='All' ? payrollRows : payrollRows.filter(p=>p.status===payFilter);

  async function payHca(row) {
    await createPayrollPayment({
      hcaId: row.hcaId, hcaName: row.name, employeeId: row.empId,
      periodMonth: curMonth, periodYear: curYear,
      shifts: row.shifts, hours: row.hours, rate: row.rate,
      gross: row.gross, deductions: row.deductions, net: row.net,
    });
    setPayrollRows(prev => prev.map(r => r.hcaId===row.hcaId ? {...r, status:'Paid'} : r));
    setPaidThisMonth(prev => [...prev, { hcaId:row.hcaId }]);
  }

  async function payAllPending() {
    const pending = payrollRows.filter(p=>p.status==='Pending');
    await Promise.all(pending.map(row => createPayrollPayment({
      hcaId: row.hcaId, hcaName: row.name, employeeId: row.empId,
      periodMonth: curMonth, periodYear: curYear,
      shifts: row.shifts, hours: row.hours, rate: row.rate,
      gross: row.gross, deductions: row.deductions, net: row.net,
    })));
    setPayrollRows(prev => prev.map(r => ({...r, status:'Paid'})));
  }

  // ── Invoice helpers ──────────────────────────────────────────────────────────
  async function markPaid(invId) {
    await approveInvoicePayment(invId, 'Finance Admin');
    const [fresh, freshClients] = await Promise.all([getAllInvoices(), getAllClients()]);
    setInvoices(fresh);
    const inv = fresh.find(i=>i.id===invId);
    if (inv?.clientId) {
      const client = freshClients.find(c=>c.id===inv.clientId);
      const stageIdx = JOURNEY_STAGES.indexOf(client?.journeyStage);
      if (stageIdx <= JOURNEY_STAGES.indexOf('payment_pending')) {
        await advanceClientJourney(inv.clientId, 'payment_confirmed');
      }
      setClients(await getAllClients());
    }
  }

  // ── Export helpers ───────────────────────────────────────────────────────────
  const monthLabel = now.toLocaleDateString('en-GB',{month:'long',year:'numeric'});

  function exportInvoices() {
    downloadCSV(`invoices-${curYear}-${curMonth}.csv`, invoices.map(i=>[
      i.invoiceNum, clients.find(c=>c.id===i.clientId)?.name||i.clientId,
      i.description, i.total, i.status, i.dueDate, i.issuedAt, i.paidAt||'', i.approvedBy||'',
    ]), ['Invoice #','Client','Description','Amount (KES)','Status','Due Date','Issued','Paid At','Approved By']);
  }

  function exportPayroll() {
    downloadCSV(`payroll-${curYear}-${curMonth}.csv`, payrollRows.map(p=>[
      p.name, p.empId, p.shifts, p.hours, p.rate, p.gross, p.deductions, p.net, p.status,
    ]), ['HCA Name','Employee ID','Shifts','Hours','Rate/hr','Gross','Deductions','Net Pay','Status']);
  }

  function exportExpenses() {
    downloadCSV(`expenses-${curYear}-${curMonth}.csv`, expenses.map(e=>[
      e.date, e.category, e.description, e.amount,
    ]), ['Date','Category','Description','Amount (KES)']);
  }

  function exportPL() {
    const rows = MONTHLY.map(m=>[m.mo, m.rev, m.exp, m.profit]);
    downloadCSV(`pl-statement-${curYear}.csv`, rows, ['Month','Revenue','Expenses','Profit']);
  }

  if (!authed) return null;

  return (
    <>
      <Head>
        <title>Finance — E-Vive Admin</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      {showNewInv && (
        <NewInvoiceModal
          clients={clients}
          onClose={()=>setShowNewInv(false)}
          onCreated={inv=>{setInvoices(p=>[inv,...p]);setShowNewInv(false);setTab('invoices');}}
        />
      )}

      <div className="dash-wrap">
        {/* overlay */}
        <div className={`dash-side-overlay${sideOpen?' open':''}`} onClick={()=>setSideOpen(false)} />

        {/* ── SIDEBAR ── */}
        <aside className={`dash-side${sideOpen?' open':''}`}>
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
                : <button key={n.key} className={`dash-nav-item${tab===n.key?' active gold':''}`}
                    onClick={()=>{setTab(n.key);setSideOpen(false);}}
                    style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
                    <span className="dash-nav-icon">{n.icon}</span>{n.label}
                  </button>
            ))}
          </nav>
          <div className="dash-footer">
            <Link href="/admin/dashboard">← Admin Dashboard</Link>
            <button onClick={()=>{clearAdminSession();router.push("/admin/login");}} style={{marginTop:8,width:"100%",background:"rgba(249,112,102,0.1)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"8px 12px",color:"var(--coral)",fontSize:12,fontFamily:"var(--mono)",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
              🔒 Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="dash-main">
          <div className="dash-topbar">
            <button className="dash-hamburger" onClick={()=>setSideOpen(o=>!o)} aria-label="Toggle menu">☰</button>
            <div>
              <div className="dash-title">Finance <span>Module</span></div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)"}}>{monthLabel} · All figures in KES</div>
            </div>
            <div className="dash-actions">
              <button className="btn-p btn-sm" onClick={()=>setShowNewInv(true)}>+ New Invoice</button>
              <button className="btn-a btn-sm" onClick={exportInvoices}>📤 Export</button>
            </div>
          </div>

          <div className="dash-tabs">
            {NAV.filter(n=>!n.href).map(n=>(
              <button key={n.key} className={`dash-tab${tab===n.key?' active':''}`} onClick={()=>setTab(n.key)}>{n.icon} {n.label}</button>
            ))}
          </div>

          <div className="dash-content">

            {/* ── REVENUE ── */}
            {tab==='revenue' && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"💰",lbl:"Revenue MTD",       val:fmtK(revenueMTD),  delta:`${mtdInvoices.length} invoices this month`, color:"mint",  up:true},
                    {icon:"📈",lbl:"MRR (avg)",          val:fmtK(mrr),         delta:"Avg monthly revenue",                        color:"amber", up:true},
                    {icon:"💳",lbl:"Outstanding",        val:fmtK(totalOutstanding), delta:`${invoices.filter(i=>i.status!=='paid').length} unpaid`, color:"coral", up:false},
                    {icon:"📊",lbl:`Profit MTD (est.)`,  val:fmtK(Math.max(0,profitMTD)), delta:`Margin: ${margin}%`,              color:"mint",  up:true},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                      <div className={`stat-box-delta ${s.up?'up':'down'}`}>{s.delta}</div>
                    </div>
                  ))}
                </div>

                {/* Monthly trend chart */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head">
                    <div className="panel-title">Monthly Revenue Trend</div>
                    <span className="badge badge-mint">Last 6 months</span>
                  </div>
                  <div className="panel-body">
                    {MONTHLY.every(m=>m.rev===0) ? (
                      <div style={{textAlign:'center',padding:'28px',color:'var(--muted)',fontSize:13}}>No invoice data yet — create invoices to see the trend.</div>
                    ) : (
                      <>
                        <div style={{display:"flex",alignItems:"flex-end",gap:12,height:140,paddingBottom:8}}>
                          {MONTHLY.map((m,i)=>(
                            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                              <div style={{fontSize:10,color:"var(--mint)",fontFamily:"var(--mono)",fontWeight:700}}>{m.rev>0?fmtK(m.rev):''}</div>
                              <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",gap:2}}>
                                <div style={{height:`${(m.profit/maxRev)*100}%`,background:"linear-gradient(0deg,var(--jade),var(--mint))",borderRadius:"4px 4px 0 0",minHeight:m.profit>0?4:0}} />
                                <div style={{height:`${(m.exp/maxRev)*100}%`,background:"rgba(200,149,42,0.4)",borderRadius:0,minHeight:m.exp>0?2:0}} />
                              </div>
                              <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",textAlign:"center"}}>{m.mo.split(' ')[0]}</div>
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
                      </>
                    )}
                  </div>
                </div>

                {/* Revenue by category */}
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Revenue by Category (all time)</div></div>
                  <div className="panel-body">
                    {REV_CATEGORIES.length === 0 ? (
                      <div style={{color:'var(--muted)',fontSize:13,padding:'16px 0'}}>No invoice data yet.</div>
                    ) : REV_CATEGORIES.map((r,i)=>(
                      <div key={i} style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <div style={{fontSize:13}}>{r.cat}</div>
                          <div style={{display:"flex",gap:12}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>{r.pct}%</div>
                            <div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,color:"var(--mint)",minWidth:90,textAlign:"right"}}>{fmtK(r.rev)}</div>
                          </div>
                        </div>
                        <div className="rev-bar"><div className="rev-fill" style={{width:`${r.pct}%`,background:"linear-gradient(90deg,var(--jade),var(--mint))"}} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── INVOICES ── */}
            {tab==='invoices' && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"📄",lbl:"Total Invoiced", val:fmtK(invoices.reduce((a,b)=>a+(b.total||0),0)), color:"mint"  },
                    {icon:"✅",lbl:"Collected",       val:fmtK(totalPaid),                                color:"mint"  },
                    {icon:"⏳",lbl:"Pending",         val:fmtK(totalOutstanding),                         color:"amber" },
                    {icon:"🚨",lbl:"Overdue",         val:fmtK(invoices.filter(i=>i.status==='overdue').reduce((a,b)=>a+(b.total||0),0)), color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                  <button className="btn-o btn-sm" onClick={exportInvoices}>📤 Export CSV</button>
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>Invoice #</th><th>Client</th><th>Description</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th><th>Approved By</th><th>Actions</th></tr></thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr><td colSpan={9} style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:13}}>No invoices yet — click &ldquo;+ New Invoice&rdquo; to create one.</td></tr>
                      ) : invoices.slice().reverse().map((inv,i)=>{
                        const client = clients.find(c=>c.id===inv.clientId);
                        const isPaid = inv.status === 'paid';
                        return (
                          <tr key={inv.id||i}>
                            <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--muted)"}}>{inv.invoiceNum||'—'}</td>
                            <td style={{fontWeight:600}}>{client?.name||inv.clientId||'—'}</td>
                            <td style={{fontSize:12}}>{inv.description}</td>
                            <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{fmtDate(inv.issuedAt)}</td>
                            <td style={{fontFamily:"var(--mono)",fontSize:11,color:inv.status==='overdue'?'var(--coral)':'var(--muted)'}}>{fmtDate(inv.dueDate)}</td>
                            <td style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:700,color:isPaid?'var(--mint)':inv.status==='overdue'?'var(--coral)':'var(--amber)'}}>{fmtAmt(inv.total)}</td>
                            <td><span className={`badge ${isPaid?'badge-mint':inv.status==='overdue'?'badge-coral':'badge-gold'}`}>{isPaid?'Paid':inv.status==='overdue'?'Overdue':'Pending'}</span></td>
                            <td style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{inv.approvedBy||'—'}</td>
                            <td>
                              {!isPaid && <button className="btn-p btn-sm" onClick={()=>markPaid(inv.id)}>✓ Confirm Payment</button>}
                              {isPaid  && <span style={{fontSize:12,color:'var(--mint)',fontFamily:'var(--mono)'}}>✓ Settled {fmtDate(inv.paidAt)}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── PAYROLL ── */}
            {tab==='payroll' && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"💳",lbl:"Payroll Due",     val:fmtK(totalPayrollDue),  color:"amber"},
                    {icon:"✅",lbl:"Paid This Month",  val:fmtK(totalPayrollPaid), color:"mint" },
                    {icon:"🩺",lbl:"HCAs on Payroll",  val:String(payrollRows.length), color:"sky" },
                    {icon:"🚫",lbl:"Pending Payment",  val:String(payrollRows.filter(p=>p.status==='Pending').length), color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                  {["All","Pending","Paid"].map(f=>(
                    <button key={f} style={{padding:"6px 14px",borderRadius:"100px",fontSize:12,fontWeight:500,fontFamily:"var(--mono)",border:`1px solid ${payFilter===f?'var(--jade)':'rgba(168,0,64,0.18)'}`,background:payFilter===f?'rgba(0,74,153,0.08)':'transparent',color:payFilter===f?'var(--jade)':'var(--muted)',cursor:"pointer"}} onClick={()=>setPayFilter(f)}>{f}</button>
                  ))}
                  <button className="btn-o btn-sm" style={{marginLeft:'auto'}} onClick={exportPayroll}>📤 Export CSV</button>
                  {payrollRows.some(p=>p.status==='Pending') && (
                    <button className="btn-a btn-sm" onClick={()=>{if(confirm(`Process payroll for all ${payrollRows.filter(p=>p.status==='Pending').length} pending HCAs?`)) payAllPending();}}>💳 Process All Pending</button>
                  )}
                </div>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead><tr><th>HCA</th><th>ID</th><th>Shifts</th><th>Hrs</th><th>Rate/hr</th><th>Gross</th><th>Deductions (5%)</th><th>Net Pay</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredPayroll.length === 0 ? (
                        <tr><td colSpan={10} style={{textAlign:'center',padding:'32px',color:'var(--muted)',fontSize:13}}>No active HCAs found for this period.</td></tr>
                      ) : filteredPayroll.map((p,i)=>(
                        <tr key={p.hcaId||i}>
                          <td style={{display:"flex",alignItems:"center",gap:8,padding:"13px 14px"}}>
                            <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(14,165,233,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{p.av}</div>
                            <span style={{fontWeight:600,fontSize:13}}>{p.name}</span>
                          </td>
                          <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{p.empId}</td>
                          <td>{p.shifts}</td>
                          <td>{p.hours}</td>
                          <td style={{color:"var(--amber)",fontFamily:"var(--mono)",fontSize:12}}>KES {p.rate.toLocaleString()}</td>
                          <td style={{fontFamily:"var(--mono)",fontSize:12}}>KES {p.gross.toLocaleString()}</td>
                          <td style={{color:"var(--coral)",fontFamily:"var(--mono)",fontSize:12}}>− KES {p.deductions.toLocaleString()}</td>
                          <td style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,color:p.status==='Paid'?'var(--mint)':'var(--amber)'}}>KES {p.net.toLocaleString()}</td>
                          <td><span className={`badge ${p.status==='Paid'?'badge-mint':'badge-gold'}`}>{p.status}</span></td>
                          <td>
                            {p.status==='Pending' && (
                              <button className="btn-p btn-sm" onClick={()=>payHca(p)}>Pay Now</button>
                            )}
                            {p.status==='Paid' && (
                              <button className="btn-o btn-sm" onClick={()=>{
                                const paid = paidThisMonth.find(x=>x.hcaId===p.hcaId);
                                alert(`Receipt — ${p.name}\nPeriod: ${monthLabel}\nShifts: ${p.shifts} · Hours: ${p.hours}\nGross: KES ${p.gross.toLocaleString()}\nDeductions: KES ${p.deductions.toLocaleString()}\nNet Paid: KES ${p.net.toLocaleString()}`);
                              }}>Receipt</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── EXPENSES ── */}
            {tab==='expenses' && (
              <>
                {(() => {
                  const byCat = {};
                  expenses.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+(e.amount||0);});
                  const topCats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,2);
                  return (
                    <div className="stat-grid">
                      <div className="stat-box"><div className="stat-box-icon">🧾</div><div className="stat-box-val coral">{fmtK(totalExpenses)}</div><div className="stat-box-label">Total Expenses</div></div>
                      <div className="stat-box"><div className="stat-box-icon">📋</div><div className="stat-box-val sky">{String(expenses.length)}</div><div className="stat-box-label">Expense Entries</div></div>
                      {topCats[0]&&<div className="stat-box"><div className="stat-box-icon">📌</div><div className="stat-box-val amber">{fmtK(topCats[0][1])}</div><div className="stat-box-label">{topCats[0][0]}</div></div>}
                      {topCats[1]&&<div className="stat-box"><div className="stat-box-icon">📌</div><div className="stat-box-val mint">{fmtK(topCats[1][1])}</div><div className="stat-box-label">{topCats[1][0]}</div></div>}
                    </div>
                  );
                })()}
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
                  <button className="btn-o btn-sm" onClick={exportExpenses}>📤 Export CSV</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:18}}>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Expense Log</div><span className="badge badge-dim">{expenses.length} entries</span></div>
                    <div className="panel-body">
                      <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr",gap:8,marginBottom:16,paddingBottom:16,borderBottom:"1px solid rgba(168,0,64,0.1)"}}>
                        <select value={newExp.icon} onChange={e=>setNewExp(p=>({...p,icon:e.target.value}))} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,0,64,0.2)",borderRadius:8,padding:"10px 4px",color:"var(--text)",fontSize:18,textAlign:"center"}}>
                          {EXPENSE_ICONS.map(ic=><option key={ic} value={ic}>{ic}</option>)}
                        </select>
                        <input placeholder="Category" value={newExp.category} onChange={e=>setNewExp(p=>({...p,category:e.target.value}))} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,0,64,0.2)",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13}} />
                        <input placeholder="Description" value={newExp.description} onChange={e=>setNewExp(p=>({...p,description:e.target.value}))} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,0,64,0.2)",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13}} />
                        <input type="date" value={newExp.date} onChange={e=>setNewExp(p=>({...p,date:e.target.value}))} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,0,64,0.2)",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13}} />
                        <input type="number" placeholder="Amount (KES)" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,0,64,0.2)",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13}} />
                        <button className="btn-p btn-sm" disabled={!newExp.category||!newExp.description||!newExp.amount} onClick={async ()=>{
                          try {
                            await createExpense(newExp);
                            setNewExp({icon:"💳",category:"",description:"",date:now.toISOString().slice(0,10),amount:""});
                            setExpenses(await getAllExpenses());
                            setExpMsg("✓ Expense added.");setTimeout(()=>setExpMsg(""),2500);
                          } catch(e){setExpMsg("⚠ "+e.message);}
                        }}>+ Add</button>
                      </div>
                      {expMsg&&<div style={{fontSize:12,padding:"8px 12px",borderRadius:8,marginBottom:12,color:expMsg.startsWith("✓")?"var(--mint)":"var(--coral)",background:"rgba(255,255,255,0.04)"}}>{expMsg}</div>}
                      {expenses.length===0 ? (
                        <div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:13}}>No expenses recorded yet.</div>
                      ) : expenses.map((e,i)=>(
                        <div key={e.id||i} className="exp-row">
                          <span style={{fontSize:22}}>{e.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:13}}>{e.description}</div>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{e.category} · {e.date}</div>
                          </div>
                          <div style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:700,color:"var(--coral)",minWidth:90,textAlign:"right"}}>KES {(e.amount||0).toLocaleString()}</div>
                          <button className="btn-o btn-sm" style={{color:"var(--coral)"}} onClick={async ()=>{await deleteExpense(e.id);setExpenses(await getAllExpenses());}}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Breakdown by Category</div></div>
                    <div className="panel-body">
                      {(() => {
                        const byCat = {};
                        expenses.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+(e.amount||0);});
                        const cats  = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
                        const maxAmt = cats[0]?.[1]||1;
                        if (cats.length===0) return <div style={{color:'var(--muted)',fontSize:13,padding:'20px 0'}}>No expense data yet.</div>;
                        return cats.map(([cat,amt],i)=>(
                          <div key={i} style={{marginBottom:14}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <div style={{fontSize:13}}>{cat}</div>
                              <div style={{fontFamily:"var(--serif)",fontSize:14,fontWeight:700,color:"var(--coral)"}}>KES {amt.toLocaleString()}</div>
                            </div>
                            <div className="rev-bar"><div className="rev-fill" style={{width:`${(amt/maxAmt)*100}%`,background:"linear-gradient(90deg,rgba(249,112,102,0.6),rgba(249,112,102,0.9))"}} /></div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── REPORTS ── */}
            {tab==='reports' && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                {[
                  {icon:"📊",title:"P&L Statement",       sub:"Monthly revenue vs expenses",        fn:exportPL,       period:curYear},
                  {icon:"💳",title:"Accounts Receivable",  sub:"Outstanding & paid invoices",        fn:exportInvoices, period:`${invoices.filter(i=>i.status!=='paid').length} outstanding`},
                  {icon:"🩺",title:"HCA Payroll Summary",  sub:"Shift earnings by HCA this month",   fn:exportPayroll,  period:monthLabel},
                  {icon:"🧾",title:"Expense Report",       sub:"Full expense ledger with categories", fn:exportExpenses, period:`${expenses.length} entries`},
                  {icon:"📈",title:"Revenue by Category",  sub:"Breakdown of income streams",        fn:()=>downloadCSV(`revenue-categories-${curYear}.csv`,REV_CATEGORIES.map(r=>[r.cat,r.rev,r.pct+'%']),['Category','Revenue (KES)','Share']), period:'All time'},
                  {icon:"💰",title:"Invoice History",      sub:"Full audit trail of all invoices",   fn:exportInvoices, period:`${invoices.length} total`},
                ].map((r,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(168,0,64,0.12)",borderRadius:16,padding:20,display:"flex",alignItems:"center",gap:14}}>
                    <span style={{fontSize:32}}>{r.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{r.title}</div>
                      <div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}>{r.sub}</div>
                      <span className="badge badge-dim">{r.period}</span>
                    </div>
                    <button className="btn-p btn-sm" onClick={r.fn}>📤 Export CSV</button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
