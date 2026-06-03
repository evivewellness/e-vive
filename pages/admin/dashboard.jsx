import { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DASH_BASE } from "../../components/SharedStyles";
import {
  getAdminSession,
  clearAdminSession,
  getAllClients,
  getAllHcaApplications,
  getAllHcaProfiles,
  getAllInvoices,
  getAllShifts,
  getAllCalendarEvents,
  getActivityLog,
  advanceClientJourney,
  createCalendarEvent,
  deleteCalendarEvent,
  createShiftWithEvent,
  getCalendarItemsForMonth,
  createHcaProfile,
  updateHcaApplication,
  updateHcaProfile,
  updateClient,
  createInvoice,
  getRbacRules,
  setRbacRule,
  removeRbacRule,
  ALL_PERMISSIONS,
  ROLE_DEFAULTS,
  JOURNEY_STAGES,
  JOURNEY_LABELS,
  logActivity,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllNewsletters,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  markNewsletterSent,
  getPricingConfig,
  savePricingConfig,
  getAllDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  getAllCardexEntries,
  addCardexQaComment,
  updateClientCoords,
  updateHcaCoords,
  sendVisitScheduledNotification,
  sendInvoiceNotification,
  sendHcaMatchedNotification,
  getLmsCourses,
  createLmsCourse,
  updateLmsCourse,
  deleteLmsCourse,
  getAllLmsEnrollments,
  getLmsSubmissions,
  updateLmsSubmission,
  getHubReferrals,
  updateHubReferral,
  getHubAccessRequests,
  updateHubAccessRequest,
  setClientSession,
  setHcaSession,
} from "../../lib/store";

const CSS = `
  .quality-bar { height:8px; border-radius:100px; background:rgba(255,255,255,0.08); overflow:hidden; margin-top:6px; }
  .quality-fill { height:100%; border-radius:100px; }
  .alert-item { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .alert-item:last-child { border-bottom:none; }
  .alert-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:4px; }
  .hca-rank { width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; font-family:var(--mono); flex-shrink:0; }
  .hca-rank.top { background:linear-gradient(135deg,var(--gold),var(--amber)); color:var(--deep); }
  .filter-bar { display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
  .filter-chip { padding:6px 14px; border-radius:100px; font-size:12px; font-weight:500; font-family:var(--mono); border:1px solid rgba(168,0,64,0.18); background:transparent; color:var(--muted); cursor:pointer; transition:all 0.2s; }
  .filter-chip:hover  { border-color:rgba(168,0,64,0.35); color:var(--text); }
  .filter-chip.active { background:rgba(168,0,64,0.12); border-color:var(--mint); color:var(--mint); }
  .search-bar { background:rgba(255,255,255,0.05); border:1px solid rgba(168,0,64,0.18); border-radius:10px; padding:9px 14px; color:var(--text); font-family:var(--sans); font-size:13px; outline:none; width:220px; }
  .search-bar:focus { border-color:var(--mint); }

  /* journey mini-dots */
  .jmini { width:12px; height:12px; border-radius:3px; }

  /* Modal overlay */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal-box { background:#fff; border:1px solid rgba(0,74,153,0.14); border-radius:22px; padding:32px; max-width:580px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 80px rgba(0,0,0,0.18); color:#0F2035; }
  .modal-title { font-family:var(--serif); font-size:20px; font-weight:700; margin-bottom:20px; color:#0F2035; }
  .modal-field { margin-bottom:16px; }
  .modal-label { font-size:11px; color:#5A7080; font-family:var(--mono); letter-spacing:0.5px; text-transform:uppercase; margin-bottom:7px; display:block; }
  .modal-input { width:100%; background:#f4f7fb; border:1.5px solid rgba(0,74,153,0.18); border-radius:10px; padding:11px 14px; color:#0F2035; font-family:var(--sans); font-size:14px; outline:none; box-sizing:border-box; }
  .modal-input:focus { border-color:var(--jade); box-shadow:0 0 0 3px rgba(0,74,153,0.08); }
  .modal-sel { width:100%; background:#f4f7fb; border:1.5px solid rgba(0,74,153,0.18); border-radius:10px; padding:11px 14px; color:#0F2035; font-family:var(--sans); font-size:14px; outline:none; box-sizing:border-box; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:24px; border-top:1px solid rgba(0,74,153,0.08); padding-top:20px; }

  /* Calendar */
  .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .cal-head { text-align:center; font-size:11px; font-family:var(--mono); color:var(--muted); padding:6px 0; }
  .cal-cell { min-height:84px; background:rgba(255,255,255,0.03); border:1px solid rgba(168,0,64,0.08); border-radius:8px; padding:6px; cursor:pointer; transition:background 0.2s; }
  .cal-cell:hover { background:rgba(168,0,64,0.06); }
  .cal-cell.today { border-color:rgba(0,74,153,0.4); background:rgba(0,74,153,0.06); }
  .cal-cell.other-month { opacity:0.35; }
  .cal-day { font-size:12px; font-weight:700; font-family:var(--mono); margin-bottom:4px; }
  .cal-event { font-size:10px; border-radius:4px; padding:2px 5px; margin-bottom:2px; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cal-nav { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .cal-month { font-family:var(--serif); font-size:18px; font-weight:700; }

  /* Cal legend */
  .cal-legend { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px; }
  .cal-legend-item { display:flex; align-items:center; gap:5px; font-size:11px; font-family:var(--mono); color:var(--muted); }
  .cal-legend-dot { width:10px; height:10px; border-radius:3px; }

  /* Cal filter */
  .cal-filter { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; align-items:center; }
  .cal-filter-lbl { font-size:11px; font-family:var(--mono); color:var(--muted); }

  /* RBAC */
  .rbac-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.06); flex-wrap:wrap; }
  .rbac-row:last-child { border-bottom:none; }
  .perm-chip { padding:4px 10px; border-radius:100px; font-size:11px; font-family:var(--mono); border:1px solid rgba(0,74,153,0.18); cursor:pointer; transition:all 0.18s; background:transparent; color:var(--muted); }
  .perm-chip.on { background:rgba(0,74,153,0.14); border-color:var(--jade); color:var(--mint); font-weight:700; }

  /* Schedule shift modal fields */
  .sched-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

  /* Announcements */
  .ann-row { display:flex; align-items:flex-start; gap:12px; padding:14px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .ann-row:last-child { border-bottom:none; }
  .ann-type { display:inline-flex; align-items:center; padding:3px 10px; border-radius:100px; font-size:10px; font-family:var(--mono); font-weight:700; letter-spacing:0.04em; }

  /* Newsletter */
  .nl-row { display:grid; grid-template-columns:1fr 100px 100px 120px 80px; gap:12px; align-items:center; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .nl-row:last-child { border-bottom:none; }

  /* Pricing */
  .rate-row { display:grid; grid-template-columns:1fr 160px 120px; gap:14px; align-items:center; padding:11px 0; border-bottom:1px solid rgba(168,0,64,0.06); }
  .rate-row:last-child { border-bottom:none; }
  .rate-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(168,0,64,0.18); border-radius:8px; padding:8px 12px; color:var(--text); font-family:var(--mono); font-size:13px; outline:none; box-sizing:border-box; }
  .rate-input:focus { border-color:var(--mint); }
  .disc-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid rgba(168,0,64,0.06); flex-wrap:wrap; }
  .disc-row:last-child { border-bottom:none; }

  /* Cardex QA */
  .cqa-row { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid rgba(168,0,64,0.06); cursor:pointer; }
  .cqa-row:hover { background:rgba(255,255,255,0.02); }
  .cqa-row:last-child { border-bottom:none; }
  .cqa-comment { background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.12); border-radius:8px; padding:8px 12px; margin-top:8px; font-size:12px; color:var(--muted); }
  .cqa-flag { color:var(--coral); }

  /* Location edit modal */
  .loc-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
`;

const NAV = [
  { icon:"📊", label:"Overview",          key:"overview"       },
  { icon:"🩺", label:"HCA Management",    key:"hcas"           },
  { icon:"👥", label:"Client Management", key:"clients"        },
  { icon:"📋", label:"Care Quality",      key:"quality"        },
  { icon:"🎓", label:"Training",          key:"training"       },
  { icon:"📅", label:"Calendar / HR",     key:"calendar"       },
  { icon:"💰", label:"Finance",           key:"finance",  href:"/admin/finance" },
  { icon:"📣", label:"Announcements",     key:"announcements"  },
  { icon:"📧", label:"Newsletter",        key:"newsletter"     },
  { icon:"🏷️", label:"Pricing & Offers",  key:"pricing"        },
  { icon:"🏠", label:"Family Hub",        key:"hub"            },
  { icon:"⚙️", label:"Settings / RBAC",   key:"settings"       },
  { icon:"🗺️", label:"Map View",          key:"map",      href:"/admin/map" },
];


const EVENT_COLORS = {
  visit:    { bg:"rgba(0,74,153,0.3)",    text:"#93c5fd" },
  shift:    { bg:"rgba(0,100,50,0.35)",   text:"#86efac" },
  offday:   { bg:"rgba(180,50,50,0.3)",   text:"#fca5a5" },
  training: { bg:"rgba(120,80,0,0.35)",   text:"#fcd34d" },
  meeting:  { bg:"rgba(90,0,120,0.35)",   text:"#d8b4fe" },
  other:    { bg:"rgba(60,60,80,0.4)",    text:"#d1d5db" },
};

function fmt(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); }
  catch { return iso?.slice(0,10) || "—"; }
}

function fmtShort(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short" }); }
  catch { return iso?.slice(0,10) || "—"; }
}

// ─── Client action modal ───────────────────────────────────────────────────────
function ClientModal({ client, hcaProfiles, onClose, onRefresh }) {
  const [action,     setAction]     = useState(""); // "call"|"visit"|"match"|"invoice"
  const [visitDate,  setVisitDate]  = useState("");
  const [visitTime,  setVisitTime]  = useState("10:00");
  const [hcaId,      setHcaId]      = useState("");
  const [invDesc,    setInvDesc]    = useState("Placement & Assessment Fee");
  const [invAmount,  setInvAmount]  = useState(3500);
  const [invDue,     setInvDue]     = useState("");
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState("");

  const stageIdx = JOURNEY_STAGES.indexOf(client.journeyStage);

  function canDo(act) {
    if (act === "call")    return stageIdx >= 2 && stageIdx < 4;  // acknowledged → call_made
    if (act === "visit")   return stageIdx >= 3 && stageIdx < 5;  // call_made → visit_scheduled
    if (act === "match")   return stageIdx >= 5 && stageIdx < 7;  // visit_done → hca_matched
    if (act === "invoice") return stageIdx >= 0;
    return true;
  }

  async function doAction() {
    setSaving(true);
    try {
      if (action === "call") {
        await advanceClientJourney(client.id, "call_made");
        setMsg("✓ Call Made — journey updated.");
      } else if (action === "visit") {
        if (!visitDate) { setMsg("Please pick a visit date."); setSaving(false); return; }
        await advanceClientJourney(client.id, "visit_scheduled", { visitDate: `${visitDate}T${visitTime}:00` });
        await createCalendarEvent({
          title: `Home Visit — ${client.name}`,
          date: visitDate,
          time: visitTime,
          type: "visit",
          clientId: client.id,
          notes: `Initial home assessment visit for ${client.name}`,
          createdBy: "admin",
        });
        setMsg(`✓ Visit scheduled for ${visitDate} at ${visitTime}.`);
      } else if (action === "match") {
        if (!hcaId) { setMsg("Please select an HCA."); setSaving(false); return; }
        await advanceClientJourney(client.id, "hca_matched", { assignedHcaId: hcaId });
        await logActivity({ type: "hca_matched", clientId: client.id, clientName: client.name, hcaId });
        setMsg("✓ HCA matched to client.");
      } else if (action === "invoice") {
        if (!invDesc || !invAmount || !invDue) { setMsg("Fill all invoice fields."); setSaving(false); return; }
        await createInvoice({
          clientId: client.id,
          description: invDesc,
          lineItems: [{ label: invDesc, amount: Number(invAmount) }],
          subtotal: Number(invAmount),
          total: Number(invAmount),
          dueDate: invDue,
        });
        // Advance to payment_pending if not already past it
        if (stageIdx >= 6 && stageIdx < 8) {
          await advanceClientJourney(client.id, "payment_pending");
        }
        setMsg(`✓ Invoice for KES ${Number(invAmount).toLocaleString()} created.`);
      }
      setTimeout(() => { onRefresh(); onClose(); }, 900);
    } catch (e) {
      setMsg("⚠ " + (e.message || "Error"));
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Manage Client: {client.name}</div>

        <div style={{background:"#f4f7fb",border:"1px solid rgba(0,74,153,0.14)",borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#0F2035"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <span>📍 {client.location || "—"}</span>
            <span>👥 {(client.patients||[]).length} patient{(client.patients||[]).length!==1?"s":""}</span>
            <span>📅 {fmt(client.createdAt)}</span>
          </div>
          <div style={{marginTop:8}}>Current Stage: <strong style={{color:"var(--mint)"}}>{JOURNEY_LABELS[client.journeyStage]}</strong></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[
            { act:"call",    label:"📞 Mark Call Made",     disabled:!canDo("call")    },
            { act:"visit",   label:"📅 Schedule Visit",     disabled:!canDo("visit")   },
            { act:"match",   label:"🤝 Match HCA",          disabled:!canDo("match")   },
            { act:"invoice", label:"💳 Create Invoice",     disabled:!canDo("invoice") },
          ].map(b => (
            <button
              key={b.act}
              onClick={() => setAction(action === b.act ? "" : b.act)}
              disabled={b.disabled}
              style={{
                padding:"10px 14px", borderRadius:10, border:"1px solid",
                borderColor: action === b.act ? "var(--mint)" : "rgba(168,0,64,0.2)",
                background: action === b.act ? "rgba(0,74,153,0.15)" : "transparent",
                color: b.disabled ? "var(--muted)" : action === b.act ? "var(--mint)" : "var(--text)",
                fontSize:13, cursor: b.disabled ? "not-allowed" : "pointer", opacity: b.disabled ? 0.45 : 1,
                fontFamily:"var(--sans)",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {action === "visit" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div className="modal-field">
              <label className="modal-label">Visit Date</label>
              <input type="date" className="modal-input" value={visitDate} onChange={e=>setVisitDate(e.target.value)} min={new Date().toISOString().slice(0,10)} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Visit Time</label>
              <input type="time" className="modal-input" value={visitTime} onChange={e=>setVisitTime(e.target.value)} />
            </div>
          </div>
        )}

        {action === "match" && (
          <div className="modal-field">
            <label className="modal-label">Select HCA</label>
            <select className="modal-sel" value={hcaId} onChange={e=>setHcaId(e.target.value)}>
              <option value="">Choose an HCA...</option>
              {hcaProfiles.filter(h=>h.status==="active").map(h=>(
                <option key={h.id} value={h.id}>{h.name} — {h.employeeId} ({h.certLevel||"HCA"})</option>
              ))}
            </select>
          </div>
        )}

        {action === "invoice" && (
          <div>
            <div className="modal-field">
              <label className="modal-label">Description</label>
              <input className="modal-input" value={invDesc} onChange={e=>setInvDesc(e.target.value)} placeholder="e.g. Placement fee" />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="modal-field">
                <label className="modal-label">Amount (KES)</label>
                <input type="number" className="modal-input" value={invAmount} onChange={e=>setInvAmount(e.target.value)} min={0} />
              </div>
              <div className="modal-field">
                <label className="modal-label">Due Date</label>
                <input type="date" className="modal-input" value={invDue} onChange={e=>setInvDue(e.target.value)} min={new Date().toISOString().slice(0,10)} />
              </div>
            </div>
          </div>
        )}

        {msg && (
          <div style={{background: msg.startsWith("⚠") ? "rgba(244,63,94,0.07)" : "rgba(132,189,96,0.1)", border:`1px solid ${msg.startsWith("⚠") ? "rgba(244,63,94,0.3)" : "rgba(132,189,96,0.35)"}`, borderRadius:10,padding:"10px 14px",fontSize:13,color:msg.startsWith("⚠") ? "#c0392b" : "#2d7a1f",marginBottom:12,fontWeight:500}}>
            {msg}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-o btn-sm" onClick={onClose}>Close</button>
          {action && !msg && (
            <button className="btn-p btn-sm" onClick={doAction} disabled={saving}>
              {saving ? "Saving…" : "Confirm Action"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HCA approve modal ─────────────────────────────────────────────────────────
function HcaApproveModal({ app, onClose, onRefresh }) {
  const [rate,   setRate]   = useState(2000);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState("");

  async function approve() {
    setSaving(true);
    try {
      const profile = await createHcaProfile({
        applicationId: app.id,
        name:          app.fullName || app.name,
        email:         app.email,
        password:      app.password || "",  // HCA must set password via first-login flow
        mobile:        app.mobile,
        certLevel:     app.certLevel || "HCA",
        yearsExp:      app.yearsExp || 0,
        specialisations: app.specialisations || [],
        county:        app.county || "",
        rate:          Number(rate),
        rateSetAt:     new Date().toISOString(),
      });
      await updateHcaApplication(app.id, { status: "approved" });
      setMsg(`✓ ${profile.name} approved as ${profile.employeeId}.`);
      setTimeout(() => { onRefresh(); onClose(); }, 900);
    } catch (e) {
      setMsg("⚠ " + (e.message||"Error"));
      setSaving(false);
    }
  }

  async function reject() {
    await updateHcaApplication(app.id, { status: "rejected" });
    onRefresh();
    onClose();
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Review Application: {app.fullName || app.name}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[["Email",app.email||"—"],["Mobile",app.mobile||"—"],["Cert Level",app.certLevel||"—"],["Years Exp",app.yearsExp||"—"],["County",app.county||"—"],["Applied",fmtShort(app.appliedAt)]].map(([l,v])=>(
            <div key={l} style={{background:"#f4f7fb",border:"1px solid rgba(0,74,153,0.12)",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:10,color:"#5A7080",fontFamily:"var(--mono)",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.5px"}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600,color:"#0F2035"}}>{v}</div>
            </div>
          ))}
        </div>
        <div className="modal-field">
          <label className="modal-label">Set HCA Rate (KES/shift)</label>
          <input type="number" className="modal-input" value={rate} onChange={e=>setRate(e.target.value)} min={500} />
        </div>
        {msg && <div style={{background: msg.startsWith("⚠") ? "rgba(244,63,94,0.07)" : "rgba(132,189,96,0.1)", border:`1px solid ${msg.startsWith("⚠") ? "rgba(244,63,94,0.3)" : "rgba(132,189,96,0.35)"}`, borderRadius:10,padding:"10px 14px",fontSize:13,color:msg.startsWith("⚠") ? "#c0392b" : "#2d7a1f",marginBottom:12,fontWeight:500}}>{msg}</div>}
        <div className="modal-actions">
          <button onClick={reject} style={{padding:"8px 16px",borderRadius:10,border:"1px solid rgba(244,63,94,0.35)",background:"rgba(244,63,94,0.05)",color:"#c0392b",fontSize:13,cursor:"pointer",fontFamily:"var(--sans)",fontWeight:600}}>Reject</button>
          <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-p btn-sm" onClick={approve} disabled={saving}>{saving?"Saving…":"Approve & Set Rate"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── HCA edit modal ────────────────────────────────────────────────────────────
function HcaEditModal({ hca, onClose, onRefresh }) {
  const SPEC_OPTS = ["Elderly Care","Dementia Care","Post-Surgery","Palliative","Child Care","Diabetic Care","Critical Care","Cerebral Palsy","Mobility Assistance","Companionship","Driver / Transport"];
  const LANG_OPTS = ["English","Kiswahili","Kikuyu","Luhya","Dholuo","Kamba","Meru","Somali","Kalenjin"];
  const SHIFT_OPTS = ["Day Shift","Night Shift","24-Hour Care"];
  const TRAVEL_OPTS = ["Local Travel","International"];

  function tog(arr, v) { return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v]; }

  const [form, setForm] = useState({
    name:             hca.name || '',
    email:            hca.email || '',
    mobile:           hca.mobile || '',
    certLevel:        hca.certLevel || '',
    yearsExp:         hca.yearsExp || 0,
    rate:             hca.rate || 2000,
    county:           hca.county || '',
    gender:           hca.gender || 'Not specified',
    ageRange:         hca.ageRange || '',
    bio:              hca.bio || '',
    specialisations:  hca.specialisations || [],
    languages:        hca.languages || ['English','Kiswahili'],
    shiftPreferences: hca.shiftPreferences || ['Day Shift'],
    periodPreference: hca.periodPreference || 'Long Term (2+ wks)',
    travelOptions:    hca.travelOptions || ['Local Travel'],
    available:        hca.available !== false,
    lat:              hca.lat ? String(hca.lat) : '',
    lng:              hca.lng ? String(hca.lng) : '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const upd = (f,v) => setForm(p=>({...p,[f]:v}));

  async function save() {
    if (!form.name.trim()) { setMsg('Name is required.'); return; }
    setSaving(true);
    try {
      await updateHcaProfile(hca.id, {
        name: form.name, email: form.email, mobile: form.mobile,
        certLevel: form.certLevel, yearsExp: Number(form.yearsExp),
        rate: Number(form.rate), county: form.county,
        gender: form.gender, ageRange: form.ageRange, bio: form.bio,
        specialisations: form.specialisations,
        languages: form.languages, shiftPreferences: form.shiftPreferences,
        periodPreference: form.periodPreference, travelOptions: form.travelOptions,
        available: form.available,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      });
      setMsg('✓ Saved.');
      setTimeout(() => { onRefresh(); onClose(); }, 700);
    } catch(e) { setMsg('⚠ ' + (e.message||'Error')); setSaving(false); }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:580,maxHeight:'90vh',overflowY:'auto'}}>
        <div className="modal-title">Edit HCA — {hca.name}</div>
        <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--muted)',marginBottom:16}}>ID: {hca.employeeId}</div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4}}>
          <div className="modal-field"><label className="modal-label">Full Name *</label><input className="modal-input" value={form.name} onChange={e=>upd('name',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Email</label><input className="modal-input" type="email" value={form.email} onChange={e=>upd('email',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Mobile</label><input className="modal-input" value={form.mobile} onChange={e=>upd('mobile',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">County</label><input className="modal-input" value={form.county} onChange={e=>upd('county',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Cert Level</label>
            <select className="modal-sel" value={form.certLevel} onChange={e=>upd('certLevel',e.target.value)}>
              {['HCA','Certificate III','Diploma','RN','BSN'].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="modal-field"><label className="modal-label">Years Exp</label><input className="modal-input" type="number" min={0} value={form.yearsExp} onChange={e=>upd('yearsExp',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Rate (KES/shift)</label><input className="modal-input" type="number" min={0} value={form.rate} onChange={e=>upd('rate',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Gender</label>
            <select className="modal-sel" value={form.gender} onChange={e=>upd('gender',e.target.value)}>
              {['Not specified','Female','Male','Non-binary'].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="modal-field"><label className="modal-label">Age Range</label>
            <select className="modal-sel" value={form.ageRange} onChange={e=>upd('ageRange',e.target.value)}>
              {['','21–25','26–30','31–35','36–40','41–45','46–50','51+'].map(v=><option key={v} value={v}>{v||'Not specified'}</option>)}
            </select>
          </div>
          <div className="modal-field"><label className="modal-label">Period Preference</label>
            <select className="modal-sel" value={form.periodPreference} onChange={e=>upd('periodPreference',e.target.value)}>
              {['Short Term (1–2 wks)','Long Term (2+ wks)','Both'].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-field">
          <label className="modal-label">Bio / Profile Summary</label>
          <textarea className="modal-input" rows={3} value={form.bio} onChange={e=>upd('bio',e.target.value)} style={{resize:'vertical'}} placeholder="Short professional profile shown to clients…" />
        </div>

        <div className="modal-field">
          <label className="modal-label">Specialisations</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {SPEC_OPTS.map(v=><button key={v} type="button" onClick={()=>upd('specialisations',tog(form.specialisations,v))} style={{padding:'4px 10px',borderRadius:'100px',fontSize:11,fontFamily:'var(--mono)',border:'1px solid rgba(168,0,64,0.25)',background:form.specialisations.includes(v)?'rgba(132,189,96,0.2)':'transparent',color:form.specialisations.includes(v)?'var(--mint)':'var(--muted)',cursor:'pointer'}}>{v}</button>)}
          </div>
        </div>

        <div className="modal-field">
          <label className="modal-label">Languages</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {LANG_OPTS.map(v=><button key={v} type="button" onClick={()=>upd('languages',tog(form.languages,v))} style={{padding:'4px 10px',borderRadius:'100px',fontSize:11,fontFamily:'var(--mono)',border:'1px solid rgba(168,0,64,0.25)',background:form.languages.includes(v)?'rgba(0,74,153,0.15)':'transparent',color:form.languages.includes(v)?'var(--sky)':'var(--muted)',cursor:'pointer'}}>{v}</button>)}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="modal-field">
            <label className="modal-label">Shift Preferences</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
              {SHIFT_OPTS.map(v=><button key={v} type="button" onClick={()=>upd('shiftPreferences',tog(form.shiftPreferences,v))} style={{padding:'4px 10px',borderRadius:'100px',fontSize:11,fontFamily:'var(--mono)',border:'1px solid rgba(168,0,64,0.25)',background:form.shiftPreferences.includes(v)?'rgba(0,74,153,0.15)':'transparent',color:form.shiftPreferences.includes(v)?'var(--sky)':'var(--muted)',cursor:'pointer'}}>{v}</button>)}
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">Travel Options</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
              {TRAVEL_OPTS.map(v=><button key={v} type="button" onClick={()=>upd('travelOptions',tog(form.travelOptions,v))} style={{padding:'4px 10px',borderRadius:'100px',fontSize:11,fontFamily:'var(--mono)',border:'1px solid rgba(168,0,64,0.25)',background:form.travelOptions.includes(v)?'rgba(0,74,153,0.15)':'transparent',color:form.travelOptions.includes(v)?'var(--sky)':'var(--muted)',cursor:'pointer'}}>{v}</button>)}
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="modal-field"><label className="modal-label">Latitude</label><input className="modal-input" type="number" step="any" value={form.lat} onChange={e=>upd('lat',e.target.value)} placeholder="-1.2921" /></div>
          <div className="modal-field"><label className="modal-label">Longitude</label><input className="modal-input" type="number" step="any" value={form.lng} onChange={e=>upd('lng',e.target.value)} placeholder="36.8219" /></div>
        </div>

        <div className="modal-field">
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13}}>
            <input type="checkbox" checked={form.available} onChange={e=>upd('available',e.target.checked)} />
            Available for new placements
          </label>
        </div>

        {msg && <div style={{padding:'10px 14px',borderRadius:10,fontSize:13,marginBottom:12,background:msg.startsWith('✓')?'rgba(0,74,153,0.08)':'rgba(249,112,102,0.08)',border:msg.startsWith('✓')?'1px solid rgba(0,74,153,0.2)':'1px solid rgba(249,112,102,0.25)',color:msg.startsWith('✓')?'var(--mint)':'var(--coral)'}}>{msg}</div>}
        <div className="modal-actions">
          <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-p btn-sm" onClick={save} disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add calendar event modal ──────────────────────────────────────────────────
function AddEventModal({ defaultDate, clients, hcaProfiles, onClose, onRefresh }) {
  const [title,    setTitle]    = useState("");
  const [date,     setDate]     = useState(defaultDate || new Date().toISOString().slice(0,10));
  const [time,     setTime]     = useState("09:00");
  const [type,     setType]     = useState("other");
  const [clientId, setClientId] = useState("");
  const [hcaId,    setHcaId]    = useState("");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);

  async function save() {
    if (!title || !date) return;
    setSaving(true);
    await createCalendarEvent({ title, date, time, type, clientId: clientId||undefined, hcaId: hcaId||undefined, notes, createdBy:"admin" });
    onRefresh();
    onClose();
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-title">Add Calendar Event</div>
        <div className="modal-field">
          <label className="modal-label">Event Title *</label>
          <input className="modal-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Home Visit – Client Name" autoFocus />
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div className="modal-field">
            <label className="modal-label">Date *</label>
            <input type="date" className="modal-input" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="modal-field">
            <label className="modal-label">Time</label>
            <input type="time" className="modal-input" value={time} onChange={e=>setTime(e.target.value)} />
          </div>
          <div className="modal-field">
            <label className="modal-label">Type</label>
            <select className="modal-sel" value={type} onChange={e=>setType(e.target.value)}>
              {["visit","shift","offday","training","meeting","other"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div className="modal-field">
            <label className="modal-label">Link Client (optional)</label>
            <select className="modal-sel" value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value="">None</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <label className="modal-label">Link HCA (optional)</label>
            <select className="modal-sel" value={hcaId} onChange={e=>setHcaId(e.target.value)}>
              <option value="">None</option>
              {hcaProfiles.map(h=><option key={h.id} value={h.id}>{h.name} ({h.employeeId})</option>)}
            </select>
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">Notes</label>
          <textarea className="modal-input" value={notes} onChange={e=>setNotes(e.target.value)} rows={2} style={{resize:"vertical"}} />
        </div>
        <div className="modal-actions">
          <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-p btn-sm" onClick={save} disabled={!title||!date||saving}>Add Event</button>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule HCA Shift modal ─────────────────────────────────────────────────
function ScheduleShiftModal({ clients, hcaProfiles, defaultDate, onClose, onRefresh }) {
  const [hcaId,    setHcaId]    = useState("");
  const [clientId, setClientId] = useState("");
  const [patId,    setPatId]    = useState("");
  const [date,     setDate]     = useState(defaultDate || new Date().toISOString().slice(0,10));
  const [startTime,setStartTime]= useState("07:00");
  const [type,     setType]     = useState("day");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");

  const selectedClient = clients.find(c=>c.id===clientId);
  const patients = selectedClient?.patients || [];

  async function save() {
    if (!hcaId || !clientId || !date) { setMsg("HCA, client and date are required."); return; }
    setSaving(true);
    try {
      await createShiftWithEvent({ hcaId, clientId, patientId: patId||undefined, date, startTime, type, notes, status:"scheduled" });
      setMsg("✓ Shift scheduled and added to calendar.");
      setTimeout(() => { onRefresh(); onClose(); }, 800);
    } catch(e) { setMsg("⚠ " + (e.message||"Error")); setSaving(false); }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-title">📅 Schedule HCA Shift</div>
        <div className="sched-row" style={{marginBottom:14}}>
          <div className="modal-field" style={{margin:0}}>
            <label className="modal-label">HCA *</label>
            <select className="modal-sel" value={hcaId} onChange={e=>setHcaId(e.target.value)}>
              <option value="">Select HCA…</option>
              {hcaProfiles.filter(h=>h.status==="active").map(h=><option key={h.id} value={h.id}>{h.name} ({h.employeeId})</option>)}
            </select>
          </div>
          <div className="modal-field" style={{margin:0}}>
            <label className="modal-label">Client *</label>
            <select className="modal-sel" value={clientId} onChange={e=>{setClientId(e.target.value);setPatId("");}}>
              <option value="">Select client…</option>
              {clients.filter(c=>c.status==="active").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        {patients.length > 0 && (
          <div className="modal-field">
            <label className="modal-label">Patient</label>
            <select className="modal-sel" value={patId} onChange={e=>setPatId(e.target.value)}>
              <option value="">All patients / general</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div className="sched-row" style={{marginBottom:14}}>
          <div className="modal-field" style={{margin:0}}>
            <label className="modal-label">Date *</label>
            <input type="date" className="modal-input" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="modal-field" style={{margin:0}}>
            <label className="modal-label">Start Time</label>
            <input type="time" className="modal-input" value={startTime} onChange={e=>setStartTime(e.target.value)} />
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">Shift Type</label>
          <select className="modal-sel" value={type} onChange={e=>setType(e.target.value)}>
            <option value="day">Day Shift</option>
            <option value="night">Night Shift</option>
            <option value="live-in">Live-In</option>
          </select>
        </div>
        <div className="modal-field">
          <label className="modal-label">Notes</label>
          <textarea className="modal-input" value={notes} onChange={e=>setNotes(e.target.value)} rows={2} style={{resize:"vertical"}} placeholder="Special instructions for this shift…" />
        </div>
        {msg && <div style={{padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12,background:msg.startsWith("✓")?"rgba(0,74,153,0.08)":"rgba(249,112,102,0.08)",border:msg.startsWith("✓")?"1px solid rgba(0,74,153,0.2)":"1px solid rgba(249,112,102,0.25)",color:msg.startsWith("✓")?"var(--mint)":"var(--coral)"}}>{msg}</div>}
        <div className="modal-actions">
          <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-p btn-sm" onClick={save} disabled={saving||!hcaId||!clientId||!date}>{saving?"Saving…":"Schedule Shift"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit client location form (used inside modal) ────────────────────────────
function EditClientLocForm({ client, onClose, onRefresh }) {
  const [addr, setAddr] = useState(client.address || client.location || "");
  const [lat,  setLat]  = useState(client.lat ? String(client.lat) : "");
  const [lng,  setLng]  = useState(client.lng ? String(client.lng) : "");
  const [msg,  setMsg]  = useState("");
  async function save() {
    if (!lat || !lng) { setMsg("Enter latitude and longitude."); return; }
    await updateClient(client.id, { address: addr, location: addr, lat: Number(lat), lng: Number(lng) });
    setMsg("✓ Location saved.");
    setTimeout(() => { onRefresh(); onClose(); }, 700);
  }
  return (
    <>
      <div className="modal-field">
        <label className="modal-label">Address / Location</label>
        <input className="modal-input" value={addr} onChange={e=>setAddr(e.target.value)} placeholder="e.g. Karen, Nairobi" />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div className="modal-field" style={{margin:0}}>
          <label className="modal-label">Latitude</label>
          <input className="modal-input" type="number" step="any" value={lat} onChange={e=>setLat(e.target.value)} placeholder="-1.3173" />
        </div>
        <div className="modal-field" style={{margin:0}}>
          <label className="modal-label">Longitude</label>
          <input className="modal-input" type="number" step="any" value={lng} onChange={e=>setLng(e.target.value)} placeholder="36.7069" />
        </div>
      </div>
      <div style={{padding:"10px 14px",background:"rgba(0,74,153,0.06)",border:"1px solid rgba(0,74,153,0.12)",borderRadius:10,fontSize:12,color:"var(--muted)",marginBottom:14}}>
        💡 Find coordinates on <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" style={{color:"var(--mint)"}}>openstreetmap.org</a> — right-click any point → &ldquo;Show address&rdquo;. Then view the URL for lat/lon.
      </div>
      {msg && <div style={{padding:"10px 14px",borderRadius:10,fontSize:13,marginBottom:12,background:msg.startsWith("✓")?"rgba(0,74,153,0.08)":"rgba(249,112,102,0.08)",border:msg.startsWith("✓")?"1px solid rgba(0,74,153,0.2)":"1px solid rgba(249,112,102,0.25)",color:msg.startsWith("✓")?"var(--mint)":"var(--coral)"}}>{msg}</div>}
      <div className="modal-actions">
        <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn-p btn-sm" onClick={save}>Save Location</button>
      </div>
    </>
  );
}

// ─── Client + patient edit modal ───────────────────────────────────────────────
function ClientEditModal({ client, onClose, onRefresh }) {
  const [form, setForm] = useState({
    name:     client.name || '',
    email:    client.email || '',
    mobile:   client.mobile || '',
    location: client.location || '',
    address:  client.address || '',
    password: '',
  });
  const [patients, setPatients] = useState(
    (client.patients || []).map(p => ({ ...p }))
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]     = useState('');

  const upd  = (f,v) => setForm(p=>({...p,[f]:v}));
  const updP = (i,f,v) => setPatients(pp => pp.map((p,j) => j===i ? {...p,[f]:v} : p));

  async function save() {
    if (!form.name.trim()) { setMsg('Name is required.'); return; }
    setSaving(true);
    try {
      const patch = { name:form.name, email:form.email, mobile:form.mobile, location:form.location, address:form.address };
      if (form.password.trim()) patch.password = form.password.trim();
      await updateClient(client.id, { ...patch, patients });
      setMsg('✓ Saved.');
      setTimeout(() => { onRefresh(); onClose(); }, 700);
    } catch(e) { setMsg('⚠ ' + (e.message||'Error')); setSaving(false); }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:560,maxHeight:'90vh',overflowY:'auto'}}>
        <div className="modal-title">Edit Client — {client.name}</div>

        <div style={{marginBottom:14,fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:'var(--muted)',letterSpacing:'0.05em'}}>CLIENT DETAILS</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4}}>
          <div className="modal-field"><label className="modal-label">Full Name *</label><input className="modal-input" value={form.name} onChange={e=>upd('name',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Email</label><input className="modal-input" type="email" value={form.email} onChange={e=>upd('email',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Mobile</label><input className="modal-input" value={form.mobile} onChange={e=>upd('mobile',e.target.value)} /></div>
          <div className="modal-field"><label className="modal-label">Location</label><input className="modal-input" value={form.location} onChange={e=>upd('location',e.target.value)} placeholder="e.g. Karen, Nairobi" /></div>
          <div className="modal-field" style={{gridColumn:'1/-1'}}><label className="modal-label">Address</label><input className="modal-input" value={form.address} onChange={e=>upd('address',e.target.value)} placeholder="Full postal/street address" /></div>
          <div className="modal-field" style={{gridColumn:'1/-1'}}><label className="modal-label">Reset Password (leave blank to keep current)</label><input className="modal-input" type="password" value={form.password} onChange={e=>upd('password',e.target.value)} placeholder="New password…" /></div>
        </div>

        {patients.length > 0 && (
          <>
            <div style={{margin:'18px 0 10px',fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:'var(--muted)',letterSpacing:'0.05em'}}>PATIENTS ({patients.length})</div>
            {patients.map((p,i)=>(
              <div key={p.id||i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(168,0,64,0.1)',borderRadius:12,padding:'14px',marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',marginBottom:10,fontFamily:'var(--mono)'}}>{p.name || `Patient ${i+1}`}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div className="modal-field" style={{margin:0}}><label className="modal-label">Name</label><input className="modal-input" value={p.name||''} onChange={e=>updP(i,'name',e.target.value)} /></div>
                  <div className="modal-field" style={{margin:0}}><label className="modal-label">Age</label><input className="modal-input" type="number" value={p.age||''} onChange={e=>updP(i,'age',Number(e.target.value))} /></div>
                  <div className="modal-field" style={{margin:0}}><label className="modal-label">Gender</label>
                    <select className="modal-sel" value={p.gender||''} onChange={e=>updP(i,'gender',e.target.value)}>
                      {['','Male','Female','Other'].map(v=><option key={v} value={v}>{v||'Not specified'}</option>)}
                    </select>
                  </div>
                  <div className="modal-field" style={{margin:0}}><label className="modal-label">Relationship</label><input className="modal-input" value={p.relationship||''} onChange={e=>updP(i,'relationship',e.target.value)} /></div>
                  <div className="modal-field" style={{margin:0,gridColumn:'1/-1'}}><label className="modal-label">Care Type</label><input className="modal-input" value={p.careType||''} onChange={e=>updP(i,'careType',e.target.value)} /></div>
                  <div className="modal-field" style={{margin:0,gridColumn:'1/-1'}}><label className="modal-label">Conditions</label><input className="modal-input" value={p.conditions||''} onChange={e=>updP(i,'conditions',e.target.value)} /></div>
                  <div className="modal-field" style={{margin:0,gridColumn:'1/-1'}}><label className="modal-label">Notes</label><textarea className="modal-input" rows={2} value={p.notes||''} onChange={e=>updP(i,'notes',e.target.value)} style={{resize:'vertical'}} /></div>
                </div>
              </div>
            ))}
          </>
        )}

        {msg && <div style={{padding:'10px 14px',borderRadius:10,fontSize:13,marginBottom:12,background:msg.startsWith('✓')?'rgba(0,74,153,0.08)':'rgba(249,112,102,0.08)',border:msg.startsWith('✓')?'1px solid rgba(0,74,153,0.2)':'1px solid rgba(249,112,102,0.25)',color:msg.startsWith('✓')?'var(--mint)':'var(--coral)'}}>{msg}</div>}
        <div className="modal-actions">
          <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-p btn-sm" onClick={save} disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authed,    setAuthed]   = useState(false);
  const [tab,       setTab]      = useState("overview");
  const [sideOpen,  setSideOpen] = useState(false);
  const [hcaFilter, setHcaFilter]= useState("All");
  const [search,    setSearch]   = useState("");
  const [clients,   setClients]  = useState([]);
  const [hcaApps,   setHcaApps]  = useState([]);
  const [hcaProfiles, setHcaProfiles] = useState([]);
  const [invoices,  setInvoices] = useState([]);
  const [shifts,    setShifts]   = useState([]);
  const [events,    setEvents]   = useState([]);
  const [activity,  setActivity] = useState([]);

  // Modals
  const [clientModal,    setClientModal]    = useState(null);
  const [hcaModal,       setHcaModal]       = useState(null);
  const [editHcaModal,   setEditHcaModal]   = useState(null);
  const [editClientModal,setEditClientModal] = useState(null);
  const [addEvent,       setAddEvent]       = useState(null);
  const [addShift,       setAddShift]       = useState(null); // date string | true

  // Calendar state
  const today = new Date();
  const [calYear,      setCalYear]      = useState(today.getFullYear());
  const [calMonth,     setCalMonth]     = useState(today.getMonth());
  const [calFilter,    setCalFilter]    = useState("all"); // all|shifts|events|hcaId
  const [calHcaFilter, setCalHcaFilter] = useState("");

  // RBAC state
  const [rbacRules,    setRbacRules]    = useState({});
  const [newRbacUser,  setNewRbacUser]  = useState({ userId:"", role:"client_coordinator", permissions:[] });

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title:"", body:"", target:"all", type:"info", priority:"normal" });
  const [annSaved, setAnnSaved] = useState(false);

  // Newsletter state
  const [newsletters, setNewsletters] = useState([]);
  const [newNl, setNewNl] = useState({ name:"", subject:"", body:"", targetAudience:"all" });
  const [nlSaved, setNlSaved] = useState(false);
  const [nlPreview, setNlPreview] = useState(null);

  // Pricing state
  const [pricingConfig, setPricingConfig] = useState(null);
  const [localRates, setLocalRates] = useState({});
  const [localPlanPrices, setLocalPlanPrices] = useState({});
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({ code:"", type:"percent", value:"", minSpend:"", description:"", expiresAt:"" });
  const [discountMsg, setDiscountMsg] = useState("");
  const [pricingMsg, setPricingMsg] = useState("");

  // Cardex QA state
  const [cardexEntries, setCardexEntries] = useState([]);
  const [expandedCardex, setExpandedCardex] = useState(null);
  const [qaInputs, setQaInputs] = useState({}); // { [entryId]: { comment, flagged } }

  // Calendar items state (async-loaded)
  const [calItems, setCalItems] = useState([]);

  // Client location edit modal
  const [editClientLoc, setEditClientLoc] = useState(null);

  // Family Hub state
  const [hubSubTab,        setHubSubTab]        = useState("courses");
  const [lmsCourses,       setLmsCourses]       = useState([]);
  const [lmsEnrollments,   setLmsEnrollments]   = useState([]);
  const [lmsSubmissions,   setLmsSubmissions]   = useState([]);
  const [hubReferrals,     setHubReferrals]     = useState([]);
  const [hubAccessReqs,    setHubAccessReqs]    = useState([]);
  const [courseModal,      setCourseModal]      = useState(null);
  const [courseForm,       setCourseForm]       = useState({ title:'', description:'', category:'Clinical Skills', difficulty:'Beginner', duration_mins:60, cover_emoji:'📚', target:'all' });
  const [editingLessons,   setEditingLessons]   = useState([]);

  const refresh = useCallback(async () => {
    const [clients, apps, profiles, invoices, shifts, events, activity, rbac, anns, nls, cardex, pc, discounts] = await Promise.all([
      getAllClients(), getAllHcaApplications(), getAllHcaProfiles(), getAllInvoices(),
      getAllShifts(), getAllCalendarEvents(), getActivityLog(), getRbacRules(),
      getAllAnnouncements(), getAllNewsletters(), getAllCardexEntries(), getPricingConfig(), getAllDiscountCodes(),
    ]);
    setClients(clients);
    setHcaApps(apps);
    setHcaProfiles(profiles);
    setInvoices(invoices);
    setShifts(shifts);
    setEvents(events);
    setActivity(activity.slice(0, 20));
    setRbacRules(rbac);
    setAnnouncements(anns);
    setNewsletters(nls);
    setCardexEntries(cardex);
    setPricingConfig(pc);
    const rates = {};
    Object.entries(pc.rates || {}).forEach(([k, v]) => { rates[k] = v.kes; });
    setLocalRates(rates);
    const planPrices = {};
    Object.entries(pc.plans || {}).forEach(([k, v]) => { planPrices[k] = v.price; });
    setLocalPlanPrices(planPrices);
    setDiscounts(discounts);
  }, []);

  // ── Auth guard ──
  useEffect(() => {
    try {
      const session = getAdminSession();
      if (!session?.id) { router.replace("/admin/login"); return; }
      setAuthed(true);
    } catch { router.replace("/admin/login"); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (authed) refresh(); }, [authed, refresh]);

  useEffect(() => {
    if (!authed) return;
    getCalendarItemsForMonth(calYear, calMonth).then(setCalItems);
  }, [authed, calYear, calMonth]);

  useEffect(() => {
    if (tab !== "hub") return;
    async function loadHub() {
      const [courses, enrollments, submissions, referrals, accessReqs] = await Promise.all([
        getLmsCourses(),
        getAllLmsEnrollments(),
        getLmsSubmissions(),
        getHubReferrals(),
        getHubAccessRequests(),
      ]);
      setLmsCourses(courses);
      setLmsEnrollments(enrollments);
      setLmsSubmissions(submissions);
      setHubReferrals(referrals);
      setHubAccessReqs(accessReqs);
    }
    loadHub();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── quality metrics computed from real store data ──
  const qualityMetrics = useMemo(() => {
    const completedShifts = shifts.filter(s => s.status === "completed");
    const ratings = hcaProfiles.filter(h => h.rating).map(h => Number(h.rating));
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const cardexRate = completedShifts.length
      ? Math.min(Math.round((cardexEntries.length / completedShifts.length) * 100), 100)
      : null;
    const flagged = cardexEntries.filter(c => c.flagged).length;
    return [
      { label:"Average HCA Rating (MTD)",       val:avgRating ? `${avgRating.toFixed(2)} / 5` : "—",          bar:avgRating ? Math.round(avgRating*20) : 0, color:"var(--mint)"  },
      { label:"Cardex Completion Rate",         val:cardexRate !== null ? `${cardexRate}%` : "—",               bar:cardexRate ?? 0,                          color:"var(--jade)"  },
      { label:"Completed Shifts (MTD)",         val:String(completedShifts.length),                             bar:Math.min(completedShifts.length*5,100),    color:"var(--sky)"   },
      { label:"Active HCAs",                    val:String(hcaProfiles.filter(h=>h.status==="active").length), bar:Math.min(hcaProfiles.filter(h=>h.status==="active").length*10,100), color:"var(--amber)" },
      { label:"Cardex Entries Total",           val:String(cardexEntries.length),                               bar:Math.min(cardexEntries.length*5,100),      color:"var(--mint)"  },
      { label:"Flagged Entries",                val:flagged > 0 ? String(flagged) : "None",                    bar:flagged>0 ? Math.min(flagged*10,100) : 100, color:flagged>0?"var(--coral)":"var(--sky)" },
    ];
  }, [shifts, hcaProfiles, cardexEntries]);

  // ── derived stats ──
  const activeClients    = clients.filter(c => c.status === "active");
  const pendingApps      = hcaApps.filter(a => a.status === "pending");
  const activeHCAs       = hcaProfiles.filter(h => h.status === "active");
  const activePlacements = clients.filter(c => c.journeyStage === "placement_active");
  const outstandingTotal = invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.total||0),0);

  // ── HCA filter/search ──
  const filteredHCAs = hcaProfiles.filter(h => {
    const matchFilter =
      hcaFilter === "All"     ? true :
      hcaFilter === "Active"  ? h.status === "active" :
      hcaFilter === "Inactive"? h.status !== "active" : true;
    const q = search.toLowerCase();
    return matchFilter && (!q || h.name?.toLowerCase().includes(q) || h.employeeId?.includes(q) || h.email?.toLowerCase().includes(q));
  });

  const filteredApps = hcaApps.filter(a =>
    hcaFilter === "Pending" ? a.status === "pending" :
    hcaFilter === "All"     ? true : a.status === hcaFilter.toLowerCase()
  );

  // ── Calendar build ──
  const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const calFirstDay = new Date(calYear, calMonth, 1);
  const calLastDay  = new Date(calYear, calMonth + 1, 0);
  const startPad    = calFirstDay.getDay();
  const calCells    = [];
  for (let i = 0; i < startPad; i++) {
    const d = new Date(calYear, calMonth, -startPad + i + 1);
    calCells.push({ date: d, otherMonth: true });
  }
  for (let d = 1; d <= calLastDay.getDate(); d++) {
    calCells.push({ date: new Date(calYear, calMonth, d), otherMonth: false });
  }
  while (calCells.length % 7 !== 0) {
    const last = calCells[calCells.length-1].date;
    calCells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate()+1), otherMonth: true });
  }
  const isoDate = d => d.toISOString().slice(0,10);
  const todayIso = isoDate(today);

  // Block render until auth check passes
  if (!authed) return null;

  return (
    <>
      <Head>
        <title>Admin Dashboard — E-Vive Kenya</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      {/* Modals */}
      {clientModal && (
        <ClientModal
          client={clientModal}
          hcaProfiles={hcaProfiles}
          onClose={() => setClientModal(null)}
          onRefresh={refresh}
        />
      )}
      {hcaModal && (
        <HcaApproveModal
          app={hcaModal}
          onClose={() => setHcaModal(null)}
          onRefresh={refresh}
        />
      )}
      {editHcaModal && <HcaEditModal hca={editHcaModal} onClose={()=>setEditHcaModal(null)} onRefresh={refresh} />}
      {editClientModal && <ClientEditModal client={editClientModal} onClose={()=>setEditClientModal(null)} onRefresh={refresh} />}
      {addEvent && (
        <AddEventModal
          defaultDate={typeof addEvent === "string" ? addEvent : ""}
          clients={clients}
          hcaProfiles={hcaProfiles}
          onClose={() => setAddEvent(null)}
          onRefresh={refresh}
        />
      )}
      {addShift && (
        <ScheduleShiftModal
          defaultDate={typeof addShift === "string" ? addShift : ""}
          clients={clients}
          hcaProfiles={hcaProfiles}
          onClose={() => setAddShift(null)}
          onRefresh={refresh}
        />
      )}
      {editClientLoc && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setEditClientLoc(null)}>
          <div className="modal-box">
            <div className="modal-title">📍 Edit Location — {editClientLoc.name}</div>
            <EditClientLocForm client={editClientLoc} onClose={()=>setEditClientLoc(null)} onRefresh={refresh} />
          </div>
        </div>
      )}

      <div className="dash-wrap">
        {/* ── SIDEBAR OVERLAY (mobile) ── */}
        <div className={`dash-side-overlay${sideOpen?" open":""}`} onClick={()=>setSideOpen(false)} />

        {/* ── SIDEBAR ── */}
        <aside className={`dash-side${sideOpen?" open":""}`}>
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
                : <button key={n.key} className={`dash-nav-item${tab===n.key?" active":""}`} onClick={()=>{setTab(n.key);setSideOpen(false);}} style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
                    <span className="dash-nav-icon">{n.icon}</span>{n.label}
                    {n.key==="hcas" && pendingApps.length > 0 && <span className="dash-nav-badge">{pendingApps.length}</span>}
                  </button>
            ))}
          </nav>
          <div className="dash-footer">
            <Link href="/">← Public Site</Link>
            <button onClick={()=>{ clearAdminSession(); router.push("/admin/login"); }} style={{marginTop:8,width:"100%",background:"rgba(249,112,102,0.1)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"8px 12px",color:"var(--coral)",fontSize:12,fontFamily:"var(--mono)",fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>
              🔒 Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="dash-main">
          <div className="dash-topbar">
            <button className="dash-hamburger" onClick={()=>setSideOpen(o=>!o)} aria-label="Toggle menu">☰</button>
            <div>
              <div className="dash-title">Admin <span>Dashboard</span></div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)"}}>
                {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                {" · "}{activeHCAs.length} HCAs · {activeClients.length} Clients
              </div>
            </div>
            <div className="dash-actions">
              <button className="btn-p btn-sm" onClick={()=>setTab("hcas")}>+ HCA Apps ({pendingApps.length})</button>
              <button className="btn-a btn-sm" onClick={()=>setTab("clients")}>View Clients</button>
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
                    {icon:"🩺",lbl:"Active HCAs",        val:activeHCAs.length.toString(),           delta:`${hcaProfiles.length} total`,          color:"mint",  up:true  },
                    {icon:"👥",lbl:"Active Clients",      val:activeClients.length.toString(),        delta:`${clients.length} registered`,          color:"sky",   up:true  },
                    {icon:"🏥",lbl:"Active Placements",   val:activePlacements.length.toString(),     delta:"Placement Active stage",                color:"amber", up:true  },
                    {icon:"💰",lbl:"Outstanding (KES)",   val:outstandingTotal > 0 ? outstandingTotal.toLocaleString() : "0", delta:`${invoices.filter(i=>i.status!=="paid").length} invoices`, color: outstandingTotal > 0 ? "coral" : "mint", up: outstandingTotal === 0 },
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
                    {icon:"📋",lbl:"Pending HCA Apps",  val:pendingApps.length.toString(),           delta:"Awaiting review",               color:"coral", up:false },
                    {icon:"⏳",lbl:"Clients Pending HCA",val:clients.filter(c=>JOURNEY_STAGES.indexOf(c.journeyStage)<JOURNEY_STAGES.indexOf("hca_matched")).length.toString(), delta:"Not yet matched",color:"amber",up:false},
                    {icon:"💳",lbl:"Invoices Sent",      val:invoices.filter(i=>i.status==="sent").length.toString(),delta:"Awaiting payment",         color:"coral", up:false },
                    {icon:"📅",lbl:"Events This Month",  val:events.filter(e=>e.date?.slice(0,7)===new Date().toISOString().slice(0,7)).length.toString(),delta:"Calendar events",color:"sky",up:true},
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
                  {/* Activity log */}
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">📋 Recent Activity</div><span className="badge badge-mint">{activity.length}</span></div>
                    <div className="panel-body">
                      {activity.length === 0 && (
                        <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>
                          No activity yet. Register a client or HCA to get started.
                        </div>
                      )}
                      {activity.map((a,i)=>(
                        <div key={a.id||i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<activity.length-1?"1px solid rgba(168,0,64,0.06)":"none"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:"var(--mint)",flexShrink:0,marginTop:5}} />
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.5}}>
                              <strong style={{color:"var(--text)"}}>{(JOURNEY_LABELS[a.type?.replace("journey_","")] || a.type?.replace(/_/g," "))}</strong>
                              {a.clientName ? ` — ${a.clientName}` : ""}
                              {a.hcaName ? ` — ${a.hcaName}` : ""}
                            </div>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{a.timestamp ? new Date(a.timestamp).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"}) : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Care Quality Snapshot */}
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">📊 Care Quality Snapshot</div></div>
                    <div className="panel-body">
                      {qualityMetrics.map((m,i)=>(
                        <div key={i} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <div style={{fontSize:12,color:"var(--muted)"}}>{m.label}</div>
                            <div style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:700,color:m.color}}>{m.val}</div>
                          </div>
                          <div className="quality-bar"><div className="quality-fill" style={{width:`${m.bar}%`,background:m.color}} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Client Pipeline */}
                <div className="panel" style={{marginTop:18}}>
                  <div className="panel-head"><div className="panel-title">Client Pipeline — Latest Registrations</div></div>
                  <div className="panel-body">
                    {clients.length === 0 ? (
                      <div style={{textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:13}}>No clients registered yet.</div>
                    ) : (
                      <div className="dash-table-wrap">
                        <table className="dash-table">
                          <thead><tr><th>Client</th><th>Patients</th><th>Stage</th><th>Registered</th><th>Actions</th></tr></thead>
                          <tbody>
                            {clients.slice().reverse().slice(0,8).map((c,i)=>{
                              const stageIdx = JOURNEY_STAGES.indexOf(c.journeyStage);
                              return (
                                <tr key={c.id||i}>
                                  <td>
                                    <div style={{fontWeight:600}}>{c.name}</div>
                                    <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{c.email}</div>
                                  </td>
                                  <td style={{textAlign:"center"}}>{(c.patients||[]).length}</td>
                                  <td>
                                    <span className={`badge ${c.journeyStage==="placement_active"?"badge-mint":c.journeyStage==="payment_pending"?"badge-coral":"badge-gold"}`}>
                                      {JOURNEY_LABELS[c.journeyStage]}
                                    </span>
                                  </td>
                                  <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{fmt(c.createdAt)}</td>
                                  <td>
                                    <button className="btn-p btn-sm" onClick={()=>setClientModal(c)}>Manage</button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── HCA MANAGEMENT ── */}
            {tab==="hcas" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"🩺",lbl:"Total HCA Profiles",val:hcaProfiles.length,color:"mint"},
                    {icon:"✅",lbl:"Active",val:activeHCAs.length,color:"sky"},
                    {icon:"⏳",lbl:"Pending Applications",val:pendingApps.length,color:"amber"},
                    {icon:"❌",lbl:"Rejected",val:hcaApps.filter(a=>a.status==="rejected").length,color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>

                {pendingApps.length > 0 && (
                  <div className="panel" style={{marginBottom:18}}>
                    <div className="panel-head"><div className="panel-title">⏳ Pending Applications</div><span className="badge badge-coral">{pendingApps.length}</span></div>
                    <div className="panel-body">
                      <div className="dash-table-wrap">
                        <table className="dash-table">
                          <thead><tr><th>Name</th><th>Email</th><th>Cert Level</th><th>Applied</th><th>Actions</th></tr></thead>
                          <tbody>
                            {pendingApps.map((a,i)=>(
                              <tr key={a.id||i}>
                                <td style={{fontWeight:600}}>{a.fullName||a.name}</td>
                                <td style={{fontSize:12,color:"var(--muted)"}}>{a.email}</td>
                                <td><span className="badge badge-sky">{a.certLevel||"HCA"}</span></td>
                                <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{fmtShort(a.appliedAt)}</td>
                                <td><button className="btn-p btn-sm" onClick={()=>setHcaModal(a)}>Review</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="filter-bar">
                  {["All","Active","Inactive"].map(f=>(
                    <button key={f} className={`filter-chip${hcaFilter===f?" active":""}`} onClick={()=>setHcaFilter(f)}>{f}</button>
                  ))}
                  <input className="search-bar" placeholder="Search by name, ID, or email..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginLeft:"auto"}} />
                </div>

                {filteredHCAs.length === 0 ? (
                  <div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)"}}>
                    <div style={{fontSize:40,marginBottom:12}}>🩺</div>
                    <div style={{fontSize:14}}>No HCA profiles yet. Approve applications above to create profiles.</div>
                  </div>
                ) : (
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead><tr><th>HCA</th><th>ID</th><th>Cert Level</th><th>Exp.</th><th>Rate (KES)</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filteredHCAs.map((h,i)=>(
                          <tr key={h.id||i}>
                            <td>
                              <div style={{fontWeight:700,fontSize:13}}>{h.name}</div>
                              <div style={{fontSize:11,color:"var(--muted)"}}>{h.email}</div>
                            </td>
                            <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{h.employeeId}</td>
                            <td><span className="badge badge-mint">{h.certLevel||"HCA"}</span></td>
                            <td style={{fontFamily:"var(--mono)",fontSize:12}}>{h.yearsExp||0}y</td>
                            <td style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--amber)"}}>{h.rate ? h.rate.toLocaleString() : "—"}</td>
                            <td><span className={`badge ${h.status==="active"?"badge-mint":"badge-dim"}`}>{h.status}</span></td>
                            <td>
                              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                <button className="btn-p btn-sm" onClick={()=>setEditHcaModal(h)}>Edit</button>
                                <button className="btn-o btn-sm" onClick={async ()=>{
                                  const newStatus = h.status === "active" ? "inactive" : "active";
                                  await updateHcaProfile(h.id, { status: newStatus });
                                  await refresh();
                                }}>
                                  {h.status === "active" ? "Deactivate" : "Activate"}
                                </button>
                                <button className="btn-sky btn-sm" title="Log in as this HCA" onClick={()=>{
                                  setHcaSession({ id:h.id, name:h.name, email:h.email, employeeId:h.employeeId });
                                  window.open("/hca/dashboard","_blank");
                                }}>🔐 Login as</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── CLIENTS ── */}
            {tab==="clients" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"👥",lbl:"Total Clients",      val:clients.length,                color:"mint"},
                    {icon:"👨‍👩‍👧",lbl:"Total Patients",    val:clients.reduce((s,c)=>s+(c.patients||[]).length,0), color:"sky"},
                    {icon:"🏥",lbl:"Placement Active",   val:activePlacements.length,        color:"amber"},
                    {icon:"📅",lbl:"Visits Scheduled",   val:events.filter(e=>e.type==="visit").length, color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>

                <div className="filter-bar">
                  <input className="search-bar" placeholder="Search clients..." value={search} onChange={e=>setSearch(e.target.value)} />
                </div>

                {clients.length === 0 ? (
                  <div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)"}}>
                    <div style={{fontSize:40,marginBottom:12}}>👥</div>
                    <div style={{fontSize:14}}>No clients registered yet.</div>
                  </div>
                ) : (
                  <div className="dash-table-wrap">
                    <table className="dash-table">
                      <thead><tr><th>Client</th><th>Location</th><th>Patients</th><th>Stage</th><th>Journey</th><th>Registered</th><th>Actions</th></tr></thead>
                      <tbody>
                        {clients.filter(c=>!search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())).slice().reverse().map((c,i)=>{
                          const stageIdx = JOURNEY_STAGES.indexOf(c.journeyStage);
                          return (
                            <tr key={c.id||i}>
                              <td>
                                <div style={{fontWeight:700}}>{c.name}</div>
                                <div style={{fontSize:11,color:"var(--muted)"}}>{c.email}</div>
                              </td>
                              <td style={{fontSize:12,color:"var(--muted)"}}>{c.location||"—"}</td>
                              <td style={{textAlign:"center"}}>{(c.patients||[]).length}</td>
                              <td>
                                <span className={`badge ${c.journeyStage==="placement_active"?"badge-mint":c.journeyStage==="payment_pending"?"badge-coral":"badge-gold"}`}>
                                  {JOURNEY_LABELS[c.journeyStage]}
                                </span>
                              </td>
                              <td>
                                <div style={{display:"flex",gap:2}}>
                                  {JOURNEY_STAGES.map((_,j)=>(
                                    <div key={j} title={JOURNEY_LABELS[JOURNEY_STAGES[j]]} className="jmini" style={{background:j<stageIdx?"var(--jade)":j===stageIdx?"var(--amber)":"rgba(255,255,255,0.06)"}} />
                                  ))}
                                </div>
                              </td>
                              <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>{fmt(c.createdAt)}</td>
                              <td>
                                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                  <button className="btn-p btn-sm" onClick={()=>setClientModal(c)}>Manage</button>
                                  <button className="btn-o btn-sm" onClick={()=>setEditClientModal(c)}>Edit</button>
                                  <button className="btn-o btn-sm" onClick={()=>setEditClientLoc(c)} title="Edit map location">📍</button>
                                  <button className="btn-sky btn-sm" title="Log in as this client" onClick={()=>{
                                    setClientSession({ id:c.id, name:c.name, email:c.email, mobile:c.mobile });
                                    window.open("/client/dashboard","_blank");
                                  }}>🔐 Login as</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── CARE QUALITY ── */}
            {tab==="quality" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"⭐",lbl:"Avg. HCA Rating",  val:qualityMetrics[0]?.val||"—", color:"amber"},
                    {icon:"📋",lbl:"Cardex Rate",       val:qualityMetrics[1]?.val||"—", color:"mint" },
                    {icon:"✅",lbl:"Completed Shifts",  val:qualityMetrics[2]?.val||"—", color:"sky"  },
                    {icon:"🚩",lbl:"Flagged Entries",   val:qualityMetrics[5]?.val||"—", color:"coral"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Quality Metrics</div></div>
                    <div className="panel-body">
                      {qualityMetrics.map((m,i)=>(
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
                    <div className="panel-head"><div className="panel-title">Shift Summary</div></div>
                    <div className="panel-body">
                      {shifts.length === 0 ? (
                        <div style={{textAlign:"center",padding:"32px 0",color:"var(--muted)",fontSize:13}}>No shifts recorded yet.</div>
                      ) : (
                        <table className="dash-table">
                          <thead><tr><th>Date</th><th>Type</th><th>Status</th></tr></thead>
                          <tbody>
                            {shifts.slice(0,8).map(s=>(
                              <tr key={s.id}><td style={{fontFamily:"var(--mono)",fontSize:11}}>{s.date}</td><td>{s.type}</td><td><span className={`badge ${s.status==="completed"?"badge-mint":"badge-gold"}`}>{s.status}</span></td></tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cardex QA */}
                <div className="panel" style={{marginTop:18}}>
                  <div className="panel-head">
                    <div className="panel-title">📝 Cardex QA Review</div>
                    <span className="badge badge-sky">{cardexEntries.length} entries</span>
                  </div>
                  <div className="panel-body">
                    {cardexEntries.length === 0 ? (
                      <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>No cardex entries yet. HCAs submit these from their dashboard after each shift.</div>
                    ) : cardexEntries.slice(0,10).map(entry => {
                      const expanded = expandedCardex === entry.id;
                      const qa = qaInputs[entry.id] || { comment:"", flagged:false };
                      const hca = hcaProfiles.find(h=>h.id===entry.hcaId);
                      const client2 = clients.find(c=>c.id===entry.clientId);
                      return (
                        <div key={entry.id}>
                          <div className="cqa-row" onClick={()=>setExpandedCardex(expanded?null:entry.id)}>
                            <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(0,74,153,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📋</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:600,display:"flex",gap:8,alignItems:"center"}}>
                                {hca?.name||"Unknown HCA"}
                                {entry.flagged && <span style={{color:"var(--coral)"}}>🚩 Flagged</span>}
                              </div>
                              <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>
                                Patient: {client2?.patients?.find(p=>p.id===entry.patientId)?.name||"—"}
                                {" · "}{entry.submittedAt?new Date(entry.submittedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):""}
                                {(entry.qaComments||[]).length>0&&<span style={{color:"var(--jade)"}}> · {(entry.qaComments||[]).length} QA note{(entry.qaComments||[]).length!==1?"s":""}</span>}
                              </div>
                            </div>
                            <span style={{fontSize:12,color:"var(--muted)"}}>{expanded?"▲":"▼"}</span>
                          </div>
                          {expanded && (
                            <div style={{padding:"12px 14px 14px 56px",background:"rgba(0,0,0,0.12)",borderRadius:10,marginBottom:8}}>
                              {entry.vitalSigns&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:8}}><strong style={{color:"var(--text)"}}>Vitals: </strong>{entry.vitalSigns.bp&&`BP: ${entry.vitalSigns.bp}  `}{entry.vitalSigns.pulse&&`Pulse: ${entry.vitalSigns.pulse}  `}{entry.vitalSigns.temp&&`Temp: ${entry.vitalSigns.temp}`}</div>}
                              {entry.notes&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:10}}><strong style={{color:"var(--text)"}}>Notes: </strong>{entry.notes}</div>}
                              {(entry.qaComments||[]).map(c2=>(
                                <div key={c2.id} className="cqa-comment"><strong>{c2.adminId}</strong>: {c2.comment}{c2.flagged&&" 🚩"}<span style={{float:"right",fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>{new Date(c2.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span></div>
                              ))}
                              <div style={{marginTop:10,display:"flex",gap:8,alignItems:"flex-end"}}>
                                <textarea className="modal-input" style={{flex:1,resize:"vertical",minHeight:48,fontSize:12}} placeholder="Add QA comment..." value={qa.comment} onChange={e=>setQaInputs(p=>({...p,[entry.id]:{...qa,comment:e.target.value}}))} />
                                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                  <label style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--muted)",cursor:"pointer"}}><input type="checkbox" checked={qa.flagged} onChange={e=>setQaInputs(p=>({...p,[entry.id]:{...qa,flagged:e.target.checked}}))} /> 🚩 Flag</label>
                                  <button className="btn-p btn-sm" disabled={!qa.comment.trim()} onClick={async ()=>{await addCardexQaComment(entry.id,{comment:qa.comment,flagged:qa.flagged});setQaInputs(p=>({...p,[entry.id]:{comment:"",flagged:false}}));await refresh();}}>Save</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── TRAINING ── */}
            {tab==="training" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <div style={{fontWeight:700,fontSize:16}}>Training Management</div>
                  <button className="btn-p btn-sm" onClick={()=>setAddEvent(true)}>+ Add Training Event</button>
                </div>
                <div className="stat-grid">
                  {[
                    {icon:"📅",lbl:"Training Events",val:events.filter(e=>e.type==="training").length,color:"sky"},
                    {icon:"🩺",lbl:"HCA Profiles",   val:hcaProfiles.length,                          color:"mint"},
                    {icon:"📜",lbl:"Certs Expiring",  val:"0",                                         color:"coral"},
                    {icon:"🎓",lbl:"Completion Rate", val:"91%",                                       color:"amber"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Upcoming Training Events</div></div>
                  <div className="panel-body">
                    {events.filter(e=>e.type==="training").length === 0 ? (
                      <div style={{textAlign:"center",padding:"32px 0",color:"var(--muted)",fontSize:13}}>No training events scheduled. Add one via the calendar or button above.</div>
                    ) : (
                      <div className="dash-table-wrap">
                        <table className="dash-table">
                          <thead><tr><th>Training</th><th>Date</th><th>Time</th><th>Notes</th><th>Actions</th></tr></thead>
                          <tbody>
                            {events.filter(e=>e.type==="training").map(e=>(
                              <tr key={e.id}>
                                <td style={{fontWeight:600}}>{e.title}</td>
                                <td style={{fontFamily:"var(--mono)",fontSize:12}}>{e.date}</td>
                                <td style={{fontFamily:"var(--mono)",fontSize:12}}>{e.time||"—"}</td>
                                <td style={{fontSize:12,color:"var(--muted)"}}>{e.notes||"—"}</td>
                                <td><button className="btn-o btn-sm" onClick={async ()=>{await deleteCalendarEvent(e.id);await refresh();}}>Remove</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── CALENDAR / HR ── */}
            {tab==="calendar" && (() => {
                const filteredItems = calItems.filter(item => {
                  if (calFilter === "shifts") return item.source === "shift";
                  if (calFilter === "events") return item.source === "event";
                  if (calHcaFilter) return item.hcaId === calHcaFilter;
                  return true;
                });

                return (
                  <div>
                    <div className="panel">
                      <div className="panel-body">
                        {/* Nav */}
                        <div className="cal-nav">
                          <button className="btn-o btn-sm" onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else{setCalMonth(m=>m-1);}}}>← Prev</button>
                          <div className="cal-month">{new Date(calYear,calMonth).toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</div>
                          <button className="btn-o btn-sm" onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else{setCalMonth(m=>m+1);}}}>Next →</button>
                        </div>

                        {/* Action buttons */}
                        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          <button className="btn-o btn-sm" onClick={()=>setAddEvent(true)}>+ Add Event</button>
                          <button className="btn-p btn-sm" onClick={()=>setAddShift(true)}>📅 Schedule Shift</button>
                        </div>

                        {/* Filters */}
                        <div className="cal-filter">
                          <span className="cal-filter-lbl">SHOW:</span>
                          {[["all","All"],["shifts","HCA Shifts"],["events","Events"]].map(([k,l])=>(
                            <button key={k} className={`filter-chip${calFilter===k?" active":""}`}
                              onClick={()=>{setCalFilter(k);setCalHcaFilter("");}}>{l}</button>
                          ))}
                          <select style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(168,0,64,0.18)",borderRadius:8,padding:"5px 10px",color:"var(--text)",fontSize:12,fontFamily:"var(--mono)",outline:"none"}}
                            value={calHcaFilter} onChange={e=>{setCalHcaFilter(e.target.value);setCalFilter("all");}}>
                            <option value="">All HCAs</option>
                            {hcaProfiles.filter(h=>h.status==="active").map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                        </div>

                        {/* Legend */}
                        <div className="cal-legend">
                          {Object.entries(EVENT_COLORS).map(([type,c])=>(
                            <div key={type} className="cal-legend-item">
                              <div className="cal-legend-dot" style={{background:c.bg,border:`1px solid ${c.text}`}} />
                              {type.charAt(0).toUpperCase()+type.slice(1)}
                            </div>
                          ))}
                          <div className="cal-legend-item">
                            <div className="cal-legend-dot" style={{background:"rgba(0,100,50,0.35)",border:"1px solid #86efac"}} />
                            HCA Shift (live)
                          </div>
                        </div>

                        {/* Day headers */}
                        <div className="cal-grid">
                          {DAYS_OF_WEEK.map(d=><div key={d} className="cal-head">{d}</div>)}
                          {calCells.map((cell,i)=>{
                            const iso = isoDate(cell.date);
                            const dayItems = filteredItems.filter(item=>item.date===iso);
                            return (
                              <div
                                key={i}
                                className={`cal-cell${iso===todayIso?" today":""}${cell.otherMonth?" other-month":""}`}
                                onClick={()=>setAddEvent(iso)}
                              >
                                <div className="cal-day">{cell.date.getDate()}</div>
                                {dayItems.slice(0,3).map(item=>{
                                  const colors = EVENT_COLORS[item.type] || EVENT_COLORS.other;
                                  const isShift = item.source === "shift";
                                  return (
                                    <div
                                      key={item.id}
                                      className="cal-event"
                                      title={`${item.title}${item.time?" @ "+item.time:""}${item.shiftType?" ("+item.shiftType+")":""}${item.status?" ["+item.status+"]":""}`}
                                      style={{background:colors.bg,color:colors.text,border:isShift?"1px solid rgba(132,189,96,0.3)":"none"}}
                                    >
                                      {item.time?`${item.time} `:""}
                                      {isShift ? "⏱ " : ""}
                                      {item.title}
                                    </div>
                                  );
                                })}
                                {dayItems.length > 3 && (
                                  <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)"}}>+{dayItems.length-3} more</div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Combined list below grid */}
                        {filteredItems.length > 0 && (
                          <div style={{marginTop:22}}>
                            <div style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--muted)",marginBottom:10,letterSpacing:"0.05em"}}>
                              ALL SCHEDULED ITEMS THIS MONTH ({filteredItems.length})
                            </div>
                            {filteredItems.sort((a,b)=>a.date<b.date?-1:1).map(item=>{
                              const colors = EVENT_COLORS[item.type] || EVENT_COLORS.other;
                              const linkedClient = item.clientId ? clients.find(c=>c.id===item.clientId) : null;
                              const linkedHca    = item.hcaId   ? hcaProfiles.find(h=>h.id===item.hcaId) : null;
                              const isShift = item.source === "shift";
                              return (
                                <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(168,0,64,0.07)",flexWrap:"wrap"}}>
                                  <div style={{width:10,height:10,borderRadius:2,background:colors.bg,border:`1px solid ${colors.text}`,flexShrink:0}} />
                                  <div style={{flex:1,minWidth:180}}>
                                    <div style={{fontSize:13,fontWeight:600}}>{item.title}</div>
                                    <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>
                                      {item.date}{item.time?` @ ${item.time}`:""}
                                      {linkedClient?` · Client: ${linkedClient.name}`:""}
                                      {linkedHca?` · HCA: ${linkedHca.name}`:""}
                                      {isShift && item.status?` · ${item.status}`:""}
                                    </div>
                                  </div>
                                  <span className="badge" style={{background:colors.bg,color:colors.text}}>
                                    {isShift ? `⏱ ${item.shiftType||"shift"}` : item.type}
                                  </span>
                                  {isShift && (
                                    <span className={`badge ${item.status==="completed"?"badge-mint":item.status==="in-progress"?"badge-sky":item.status==="missed"?"badge-coral":"badge-dim"}`}>
                                      {item.status||"scheduled"}
                                    </span>
                                  )}
                                  {!isShift && (
                                    <button className="btn-o btn-sm" onClick={async e=>{e.stopPropagation();await deleteCalendarEvent(item.id);await refresh();}}>✕</button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {filteredItems.length === 0 && (
                          <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>
                            <div style={{fontSize:32,marginBottom:12}}>📅</div>
                            <div style={{fontSize:13,marginBottom:16}}>No events or shifts scheduled for this month.</div>
                            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                              <button className="btn-o btn-sm" onClick={()=>setAddEvent(true)}>+ Add Event</button>
                              <button className="btn-p btn-sm" onClick={()=>setAddShift(true)}>📅 Schedule Shift</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shift summary by HCA */}
                    {shifts.length > 0 && (
                      <div className="panel" style={{marginTop:16}}>
                        <div className="panel-head">
                          <div className="panel-title">HCA Schedule Summary — {new Date(calYear,calMonth).toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</div>
                        </div>
                        <div className="panel-body">
                          {hcaProfiles.filter(h=>h.status==="active").map(hca=>{
                            const hcaShifts = shifts.filter(s=>s.hcaId===hca.id&&s.date?.slice(0,7)===`${calYear}-${String(calMonth+1).padStart(2,"0")}`);
                            if (hcaShifts.length===0) return null;
                            const done = hcaShifts.filter(s=>s.status==="completed").length;
                            const scheduled = hcaShifts.filter(s=>s.status==="scheduled").length;
                            return (
                              <div key={hca.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderBottom:"1px solid rgba(168,0,64,0.07)",flexWrap:"wrap"}}>
                                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--jade),var(--emerald))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🩺</div>
                                <div style={{flex:1,minWidth:140}}>
                                  <div style={{fontWeight:700,fontSize:13}}>{hca.name}</div>
                                  <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{hca.employeeId} · {hca.certLevel||"HCA"}</div>
                                </div>
                                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                  <span className="badge badge-dim">{hcaShifts.length} shifts</span>
                                  {done>0&&<span className="badge badge-mint">{done} done</span>}
                                  {scheduled>0&&<span className="badge badge-sky">{scheduled} upcoming</span>}
                                </div>
                                <button className="btn-o btn-sm" onClick={()=>{setCalHcaFilter(hca.id);setCalFilter("all");}}>View</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )()}

            {/* ── ANNOUNCEMENTS ── */}
            {tab==="announcements" && (
              <div>
                <div className="stat-grid">
                  {[
                    {icon:"📣",lbl:"Total",val:announcements.length,color:"mint"},
                    {icon:"✅",lbl:"Published",val:announcements.filter(a=>a.published).length,color:"sky"},
                    {icon:"👥",lbl:"Client Targeted",val:announcements.filter(a=>a.target==="clients"||a.target==="all").length,color:"amber"},
                    {icon:"🩺",lbl:"HCA Targeted",val:announcements.filter(a=>a.target==="hcas"||a.target==="all").length,color:"coral"},
                  ].map(s=>(<div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>))}
                </div>
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head"><div className="panel-title">➕ Create Announcement</div></div>
                  <div className="panel-body">
                    <div className="modal-field">
                      <label className="modal-label">Title *</label>
                      <input className="modal-input" value={newAnn.title} onChange={e=>setNewAnn(p=>({...p,title:e.target.value}))} placeholder="Announcement headline..." />
                    </div>
                    <div className="modal-field">
                      <label className="modal-label">Body / Message *</label>
                      <textarea className="modal-input" rows={4} style={{resize:"vertical"}} value={newAnn.body} onChange={e=>setNewAnn(p=>({...p,body:e.target.value}))} placeholder="Full announcement text..." />
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
                      <div><label className="modal-label">Target Audience</label><select className="modal-sel" value={newAnn.target} onChange={e=>setNewAnn(p=>({...p,target:e.target.value}))}><option value="all">All Users</option><option value="clients">Clients Only</option><option value="hcas">HCAs Only</option><option value="admin">Admin Only</option></select></div>
                      <div><label className="modal-label">Display Type</label><select className="modal-sel" value={newAnn.type} onChange={e=>setNewAnn(p=>({...p,type:e.target.value}))}><option value="info">Info Banner</option><option value="alert">Alert</option><option value="promo">Promotion</option><option value="maintenance">Maintenance</option></select></div>
                      <div><label className="modal-label">Priority</label><select className="modal-sel" value={newAnn.priority} onChange={e=>setNewAnn(p=>({...p,priority:e.target.value}))}><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                    </div>
                    {annSaved && <div style={{padding:"8px 14px",borderRadius:8,fontSize:12,color:"var(--mint)",background:"rgba(0,74,153,0.08)",border:"1px solid rgba(0,74,153,0.15)",marginBottom:12}}>✓ Announcement published.</div>}
                    <button className="btn-p btn-sm" disabled={!newAnn.title||!newAnn.body} onClick={async ()=>{await createAnnouncement(newAnn);setNewAnn({title:"",body:"",target:"all",type:"info",priority:"normal"});setAnnSaved(true);await refresh();setTimeout(()=>setAnnSaved(false),2500);}}>Publish Announcement</button>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Active Announcements</div><span className="badge badge-mint">{announcements.length}</span></div>
                  <div className="panel-body">
                    {announcements.length===0 ? (
                      <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)",fontSize:13}}>No announcements yet.</div>
                    ) : announcements.map(a=>{
                      const tc={info:{bg:"rgba(0,74,153,0.15)",text:"var(--sky)"},alert:{bg:"rgba(249,112,102,0.15)",text:"var(--coral)"},promo:{bg:"rgba(0,120,70,0.15)",text:"var(--mint)"},maintenance:{bg:"rgba(180,130,0,0.15)",text:"var(--amber)"}}[a.type]||{bg:"rgba(0,74,153,0.15)",text:"var(--sky)"};
                      return (
                        <div key={a.id} className="ann-row">
                          <div style={{flex:1}}>
                            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                              <div style={{fontWeight:700,fontSize:13}}>{a.title}</div>
                              <span style={{padding:"2px 8px",borderRadius:100,fontSize:10,fontFamily:"var(--mono)",fontWeight:700,background:tc.bg,color:tc.text}}>{a.type}</span>
                              <span className="badge badge-dim">{a.target}</span>
                              {a.priority==="high"&&<span className="badge badge-coral">HIGH</span>}
                              {a.priority==="critical"&&<span className="badge badge-coral">⚠ CRITICAL</span>}
                              <span className={`badge ${a.published?"badge-mint":"badge-dim"}`}>{a.published?"Live":"Draft"}</span>
                            </div>
                            <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{a.body.slice(0,160)}{a.body.length>160?"…":""}</div>
                            <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:4}}>{new Date(a.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0,marginLeft:12}}>
                            <button className="btn-o btn-sm" onClick={async ()=>{await updateAnnouncement(a.id,{published:!a.published});await refresh();}}>{a.published?"Unpublish":"Publish"}</button>
                            <button className="btn-o btn-sm" style={{color:"var(--coral)"}} onClick={async ()=>{await deleteAnnouncement(a.id);await refresh();}}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── NEWSLETTER ── */}
            {tab==="newsletter" && (
              <div>
                <div className="stat-grid">
                  {[
                    {icon:"📧",lbl:"Total Campaigns",val:newsletters.length,color:"mint"},
                    {icon:"✅",lbl:"Sent",val:newsletters.filter(n=>n.status==="sent").length,color:"sky"},
                    {icon:"📝",lbl:"Drafts",val:newsletters.filter(n=>n.status==="draft").length,color:"amber"},
                    {icon:"👥",lbl:"Total Subscribers",val:clients.length+hcaProfiles.length,color:"coral"},
                  ].map(s=>(<div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>))}
                </div>
                {nlPreview ? (
                  <div className="panel" style={{marginBottom:18}}>
                    <div className="panel-head"><div className="panel-title">👁 Preview: {nlPreview.name}</div><button className="btn-o btn-sm" onClick={()=>setNlPreview(null)}>← Back</button></div>
                    <div className="panel-body">
                      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(168,0,64,0.12)",borderRadius:12,padding:"20px 24px",maxWidth:600}}>
                        <div style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)",marginBottom:4}}>SUBJECT</div>
                        <div style={{fontWeight:700,fontSize:16,marginBottom:16}}>{nlPreview.subject}</div>
                        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{nlPreview.body}</div>
                        <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid rgba(168,0,64,0.1)",fontSize:11,color:"var(--muted)"}}>Target: {nlPreview.targetAudience} · Recipients: {nlPreview.recipientCount||"—"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="panel" style={{marginBottom:18}}>
                    <div className="panel-head"><div className="panel-title">✍️ New Campaign</div></div>
                    <div className="panel-body">
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                        <div className="modal-field" style={{margin:0}}><label className="modal-label">Campaign Name</label><input className="modal-input" value={newNl.name} onChange={e=>setNewNl(p=>({...p,name:e.target.value}))} placeholder="e.g. July 2025 Update" /></div>
                        <div className="modal-field" style={{margin:0}}><label className="modal-label">Target Audience</label><select className="modal-sel" value={newNl.targetAudience} onChange={e=>setNewNl(p=>({...p,targetAudience:e.target.value}))}><option value="all">All (Clients + HCAs)</option><option value="clients">Clients Only</option><option value="hcas">HCAs Only</option></select></div>
                      </div>
                      <div className="modal-field"><label className="modal-label">Subject Line</label><input className="modal-input" value={newNl.subject} onChange={e=>setNewNl(p=>({...p,subject:e.target.value}))} placeholder="Email subject line..." /></div>
                      <div className="modal-field"><label className="modal-label">Email Body</label><textarea className="modal-input" rows={7} style={{resize:"vertical"}} value={newNl.body} onChange={e=>setNewNl(p=>({...p,body:e.target.value}))} placeholder={"Dear [Name],\n\nYour message here...\n\nWarm regards,\nThe E-Vive Team"} /></div>
                      {nlSaved && <div style={{padding:"8px 14px",borderRadius:8,fontSize:12,color:"var(--mint)",background:"rgba(0,74,153,0.08)",border:"1px solid rgba(0,74,153,0.15)",marginBottom:12}}>✓ Campaign saved as draft.</div>}
                      <button className="btn-o btn-sm" disabled={!newNl.name||!newNl.subject||!newNl.body} onClick={async ()=>{const nl=await createNewsletter(newNl);setNlPreview(nl);setNewNl({name:"",subject:"",body:"",targetAudience:"all"});setNlSaved(true);await refresh();setTimeout(()=>setNlSaved(false),2500);}}>Save Draft &amp; Preview</button>
                    </div>
                  </div>
                )}
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">All Campaigns</div><span className="badge badge-mint">{newsletters.length}</span></div>
                  <div className="panel-body">
                    {newsletters.length===0 ? (
                      <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted)",fontSize:13}}>No campaigns yet. Create one above.</div>
                    ) : newsletters.map(n=>(
                      <div key={n.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 80px auto",gap:12,alignItems:"center",padding:"12px 0",borderBottom:"1px solid rgba(168,0,64,0.06)"}}>
                        <div><div style={{fontSize:13,fontWeight:600}}>{n.name}</div><div style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",marginTop:2}}>{n.targetAudience} · {new Date(n.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></div>
                        <div style={{fontSize:12,color:"var(--muted)"}}>{n.subject.slice(0,32)}{n.subject.length>32?"…":""}</div>
                        <span className={`badge ${n.status==="sent"?"badge-mint":"badge-dim"}`}>{n.status}</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:12}}>{n.status==="sent"?n.recipientCount:"—"}</span>
                        <div style={{display:"flex",gap:6}}>
                          <button className="btn-o btn-sm" onClick={()=>setNlPreview(n)}>Preview</button>
                          {n.status==="draft"&&<button className="btn-p btn-sm" onClick={async ()=>{await markNewsletterSent(n.id);await refresh();}}>Send</button>}
                          <button className="btn-o btn-sm" style={{color:"var(--coral)"}} onClick={async ()=>{await deleteNewsletter(n.id);await refresh();}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PRICING & OFFERS ── */}
            {tab==="pricing" && pricingConfig && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16}}>Pricing &amp; Offers Management</div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>Set service rates for invoicing; manage discount codes and promotions.</div>
                  </div>
                </div>

                {/* Service Rates */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head">
                    <div className="panel-title">💰 Service Rates (KES)</div>
                    {pricingConfig.updatedAt&&<span style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)"}}>Updated {new Date(pricingConfig.updatedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>}
                  </div>
                  <div className="panel-body">
                    <div style={{display:"grid",gridTemplateColumns:"1.5fr 160px",gap:8,paddingBottom:8,borderBottom:"1px solid rgba(168,0,64,0.1)",marginBottom:4}}>
                      <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",letterSpacing:"0.05em"}}>SERVICE TYPE</span>
                      <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",letterSpacing:"0.05em"}}>RATE (KES)</span>
                    </div>
                    {Object.entries(pricingConfig.rates||{}).map(([key,val])=>(
                      <div key={key} className="rate-row">
                        <div><div style={{fontSize:13,fontWeight:600}}>{val.label}</div><div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{key.replace(/_/g," ")}</div></div>
                        <input type="number" className="rate-input" min={0} value={localRates[key]??val.kes} onChange={e=>setLocalRates(p=>({...p,[key]:Number(e.target.value)}))} />
                      </div>
                    ))}
                    {pricingMsg&&<div style={{padding:"8px 14px",borderRadius:8,fontSize:12,color:"var(--mint)",background:"rgba(0,74,153,0.08)",border:"1px solid rgba(0,74,153,0.15)",margin:"12px 0"}}>{pricingMsg}</div>}
                    <button className="btn-p btn-sm" style={{marginTop:14}} onClick={async ()=>{
                      const newRates={};
                      Object.entries(pricingConfig.rates||{}).forEach(([k,v])=>{newRates[k]={...v,kes:localRates[k]??v.kes};});
                      const newPlans={};
                      Object.entries(pricingConfig.plans||{}).forEach(([k,v])=>{newPlans[k]={...v,price:Number(localPlanPrices[k]??v.price)};});
                      const newCfg={...pricingConfig,rates:newRates,plans:newPlans};
                      await savePricingConfig(newCfg);setPricingConfig(newCfg);
                      setPricingMsg("✓ Rates saved.");setTimeout(()=>setPricingMsg(""),2500);
                    }}>Save Rates &amp; Plans</button>
                  </div>
                </div>

                {/* HCA Subscription Plans */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head">
                    <div className="panel-title">📋 HCA Subscription Plans (KES/month)</div>
                    <span style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>Shown to HCAs on the Apply page</span>
                  </div>
                  <div className="panel-body">
                    <div style={{display:"grid",gridTemplateColumns:"1.5fr 160px",gap:8,paddingBottom:8,borderBottom:"1px solid rgba(168,0,64,0.1)",marginBottom:4}}>
                      <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",letterSpacing:"0.05em"}}>PLAN NAME</span>
                      <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",letterSpacing:"0.05em"}}>PRICE (KES/month)</span>
                    </div>
                    {Object.entries(pricingConfig.plans||{}).map(([key,val])=>(
                      <div key={key} className="rate-row">
                        <div><div style={{fontSize:13,fontWeight:600}}>{val.name}</div><div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{val.badge}</div></div>
                        <input type="number" className="rate-input" min={0} value={localPlanPrices[key]??val.price} onChange={e=>setLocalPlanPrices(p=>({...p,[key]:Number(e.target.value)}))} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount Codes */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head"><div className="panel-title">🏷️ Discount Codes</div><span className="badge badge-sky">{discounts.length} codes</span></div>
                  <div className="panel-body">
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr) 1fr 1fr",gap:10,marginBottom:12,paddingBottom:12,borderBottom:"1px solid rgba(168,0,64,0.1)"}}>
                      <div><label className="modal-label">Code</label><input className="rate-input" value={newDiscount.code} onChange={e=>setNewDiscount(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="EVIVE20" /></div>
                      <div><label className="modal-label">Type</label><select className="modal-sel" value={newDiscount.type} onChange={e=>setNewDiscount(p=>({...p,type:e.target.value}))}><option value="percent">Percent (%)</option><option value="fixed">Fixed (KES)</option></select></div>
                      <div><label className="modal-label">Value</label><input type="number" className="rate-input" value={newDiscount.value} onChange={e=>setNewDiscount(p=>({...p,value:e.target.value}))} placeholder={newDiscount.type==="percent"?"20":"500"} /></div>
                      <div><label className="modal-label">Min Spend (KES)</label><input type="number" className="rate-input" value={newDiscount.minSpend} onChange={e=>setNewDiscount(p=>({...p,minSpend:e.target.value}))} placeholder="0" /></div>
                      <div><label className="modal-label">Expires</label><input type="date" className="rate-input" value={newDiscount.expiresAt} onChange={e=>setNewDiscount(p=>({...p,expiresAt:e.target.value}))} /></div>
                    </div>
                    <div style={{marginBottom:12}}><label className="modal-label">Description (optional)</label><input className="rate-input" value={newDiscount.description} onChange={e=>setNewDiscount(p=>({...p,description:e.target.value}))} placeholder="e.g. New client — 20% off first month" /></div>
                    {discountMsg&&<div style={{padding:"8px 14px",borderRadius:8,fontSize:12,marginBottom:10,color:discountMsg.startsWith("✓")?"var(--mint)":"var(--coral)",background:discountMsg.startsWith("✓")?"rgba(0,74,153,0.08)":"rgba(249,112,102,0.08)",border:discountMsg.startsWith("✓")?"1px solid rgba(0,74,153,0.15)":"1px solid rgba(249,112,102,0.25)"}}>{discountMsg}</div>}
                    <button className="btn-p btn-sm" disabled={!newDiscount.code||!newDiscount.value} onClick={async ()=>{
                      try{await createDiscountCode({code:newDiscount.code,type:newDiscount.type,value:newDiscount.value,minSpend:newDiscount.minSpend||0,description:newDiscount.description,expiresAt:newDiscount.expiresAt||null});
                      setNewDiscount({code:"",type:"percent",value:"",minSpend:"",description:"",expiresAt:""});
                      setDiscountMsg("✓ Code created.");await refresh();setTimeout(()=>setDiscountMsg(""),2500);}catch(e){setDiscountMsg("⚠ "+e.message);}
                    }}>Create Code</button>
                    {discounts.length>0&&(
                      <div style={{marginTop:18}}>
                        <div style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--muted)",letterSpacing:"0.05em",marginBottom:8}}>ACTIVE CODES ({discounts.length})</div>
                        {discounts.map(d=>(
                          <div key={d.id} className="disc-row">
                            <code style={{background:"rgba(0,74,153,0.12)",border:"1px solid rgba(0,74,153,0.2)",borderRadius:6,padding:"3px 10px",fontSize:13,fontFamily:"var(--mono)",color:"var(--mint)",letterSpacing:"0.08em"}}>{d.code}</code>
                            <span className="badge badge-gold">{d.type==="percent"?`${d.value}% off`:`KES ${Number(d.value).toLocaleString()} off`}</span>
                            {d.minSpend>0&&<span style={{fontSize:11,color:"var(--muted)"}}>min KES {Number(d.minSpend).toLocaleString()}</span>}
                            {d.expiresAt&&<span style={{fontSize:11,fontFamily:"var(--mono)",color:"var(--muted)"}}>exp {d.expiresAt}</span>}
                            {d.description&&<span style={{fontSize:11,color:"var(--muted)",flex:1}}>{d.description}</span>}
                            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                              <button className="btn-o btn-sm" onClick={async ()=>{await updateDiscountCode(d.id,{active:!d.active});await refresh();}}>{d.active?"Deactivate":"Activate"}</button>
                              <button className="btn-o btn-sm" style={{color:"var(--coral)"}} onClick={async ()=>{await deleteDiscountCode(d.id);await refresh();}}>Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice tip */}
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">💡 How Pricing Applies to Invoices</div></div>
                  <div className="panel-body">
                    <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7}}>
                      <p style={{marginBottom:10}}>When creating an invoice from Client Management (Manage → Create Invoice), the rates above serve as default line-item values. You can still override the amount per invoice.</p>
                      <p style={{marginBottom:10}}>Discount codes can be applied by referencing the code in the invoice description. Automatic deduction is applied in the Finance module.</p>
                      <p style={{margin:0}}>→ <Link href="/admin/finance" style={{color:"var(--mint)"}}>Go to Finance Dashboard</Link></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SETTINGS / RBAC ── */}
            {tab==="settings" && (
              <div>
                <div style={{marginBottom:20,fontWeight:700,fontSize:16}}>Access Control &amp; Permissions (RBAC)</div>

                {/* Role reference table */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head"><div className="panel-title">System Roles</div></div>
                  <div className="panel-body">
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Role</th><th>Default Permissions</th><th>Description</th></tr></thead>
                        <tbody>
                          {Object.entries(ROLE_DEFAULTS).map(([key,val])=>(
                            <tr key={key}>
                              <td><span className="badge badge-mint">{val.label}</span></td>
                              <td style={{fontSize:11,color:"var(--mint)",fontFamily:"var(--mono)"}}>{val.permissions.join(", ")}</td>
                              <td style={{fontSize:12,color:"var(--muted)"}}>{key==="super_admin"?"Full platform access — all modules, RBAC, pricing":key==="finance_admin"?"Invoices, payroll, expense management":key==="client_coordinator"?"Client onboarding, visit scheduling, journey tracking":key==="hca_manager"?"HCA recruitment, placement, quality monitoring":"HR, training, welfare monitoring"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Active RBAC grants */}
                <div className="panel" style={{marginBottom:18}}>
                  <div className="panel-head">
                    <div className="panel-title">Active Access Grants</div>
                    <span className="badge badge-sky">{Object.keys(rbacRules).length} users</span>
                  </div>
                  <div className="panel-body">
                    {Object.keys(rbacRules).length === 0 ? (
                      <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>
                        No custom access grants. Use the form below to grant calendar or other module access to team members.
                      </div>
                    ) : (
                      Object.entries(rbacRules).map(([userId, rule])=>(
                        <div key={userId} className="rbac-row">
                          <div style={{fontFamily:"var(--mono)",fontSize:12,minWidth:160,color:"var(--text)"}}>{userId}</div>
                          <span className="badge badge-gold">{ROLE_DEFAULTS[rule.role]?.label||rule.role}</span>
                          <div style={{flex:1,display:"flex",gap:6,flexWrap:"wrap"}}>
                            {(rule.permissions||[]).map(p=>(
                              <span key={p} className="badge badge-sky">{p}</span>
                            ))}
                          </div>
                          <button className="btn-o btn-sm" style={{color:"var(--coral)"}}
                            onClick={async ()=>{await removeRbacRule(userId);setRbacRules(await getRbacRules());}}>Revoke</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Grant new access */}
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Grant Calendar / Module Access</div></div>
                  <div className="panel-body">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      <div>
                        <div className="dash-label">User ID or Email</div>
                        <input className="dash-input" placeholder="e.g. admin@evive.co.ke"
                          value={newRbacUser.userId} onChange={e=>setNewRbacUser(p=>({...p,userId:e.target.value}))} />
                      </div>
                      <div>
                        <div className="dash-label">Assign Role</div>
                        <select className="dash-select" value={newRbacUser.role}
                          onChange={e=>setNewRbacUser(p=>({...p,role:e.target.value,permissions:ROLE_DEFAULTS[e.target.value]?.permissions.filter(x=>x!=="all")||[]}))}>
                          {Object.entries(ROLE_DEFAULTS).filter(([k])=>k!=="super_admin").map(([k,v])=>(
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="dash-label" style={{marginBottom:8}}>Custom Permissions (override role defaults)</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                      {ALL_PERMISSIONS.map(p=>{
                        const on = newRbacUser.permissions.includes(p.key);
                        return (
                          <button key={p.key} className={`perm-chip${on?" on":""}`}
                            onClick={()=>setNewRbacUser(prev=>({...prev,permissions:on?prev.permissions.filter(x=>x!==p.key):[...prev.permissions,p.key]}))}>
                            {p.label}
                          </button>
                        );
                      })}
                    </div>

                    <button className="btn-p btn-sm" disabled={!newRbacUser.userId}
                      onClick={async ()=>{
                        if(!newRbacUser.userId) return;
                        const perms = newRbacUser.permissions.length>0 ? newRbacUser.permissions : (ROLE_DEFAULTS[newRbacUser.role]?.permissions||[]).filter(x=>x!=="all");
                        await setRbacRule(newRbacUser.userId, newRbacUser.role, perms);
                        setRbacRules(await getRbacRules());
                        setNewRbacUser({userId:"",role:"client_coordinator",permissions:[]});
                      }}>
                      Grant Access
                    </button>

                    <div style={{marginTop:14,padding:"12px 14px",background:"rgba(0,74,153,0.06)",border:"1px solid rgba(0,74,153,0.12)",borderRadius:10,fontSize:12,color:"var(--muted)"}}>
                      ℹ️ <strong style={{color:"var(--text)"}}>Calendar access</strong> grants the user the ability to view and add events in the Calendar / HR tab. Use the permission chips above to fine-tune access per user.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab==="hub" && (
              <div>
                {/* Sub-tab navigation */}
                <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:'1px solid rgba(168,0,64,0.12)',paddingBottom:0}}>
                  {[
                    {key:'courses',     label:'📚 Courses',             count: lmsCourses.length},
                    {key:'submissions', label:'📬 Partner Submissions',  count: lmsSubmissions.filter(s=>s.status==='pending').length},
                    {key:'referrals',   label:'💬 Referrals',            count: hubReferrals.filter(r=>r.status==='new').length},
                    {key:'access',      label:'🔑 Access Requests',      count: hubAccessReqs.filter(r=>r.status==='pending').length},
                  ].map(st=>(
                    <button key={st.key}
                      onClick={()=>setHubSubTab(st.key)}
                      style={{padding:'10px 18px',background:'none',border:'none',borderBottom: hubSubTab===st.key?'2px solid var(--mint)':'2px solid transparent',cursor:'pointer',fontSize:13,fontWeight:hubSubTab===st.key?700:400,color:hubSubTab===st.key?'var(--mint)':'var(--muted)',transition:'all 0.2s',display:'flex',alignItems:'center',gap:6}}>
                      {st.label}
                      {st.count > 0 && <span style={{background:'rgba(168,0,64,0.18)',color:'var(--mint)',borderRadius:100,padding:'1px 7px',fontSize:10,fontFamily:'var(--mono)',fontWeight:700}}>{st.count}</span>}
                    </button>
                  ))}
                </div>

                {/* ── COURSES sub-tab ── */}
                {hubSubTab==='courses' && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                      <div style={{fontSize:13,color:'var(--muted)'}}>
                        {lmsCourses.length} courses · {lmsEnrollments.length} total enrollments
                      </div>
                      <button className="btn-p btn-sm" onClick={()=>{
                        setCourseForm({title:'',description:'',category:'Clinical Skills',difficulty:'Beginner',duration_mins:60,cover_emoji:'📚',target:'all'});
                        setEditingLessons([]);
                        setCourseModal('new');
                      }}>+ New Course</button>
                    </div>
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Course</th><th>Target</th><th>Difficulty</th><th>Lessons</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {lmsCourses.map(c=>{
                            const enrolled = lmsEnrollments.filter(e=>e.course_id===c.id).length;
                            const completed = lmsEnrollments.filter(e=>e.course_id===c.id && e.progress_pct===100).length;
                            return (
                              <tr key={c.id}>
                                <td><div style={{fontWeight:600}}>{c.cover_emoji} {c.title}</div><div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{c.category} · {Math.round((c.duration_mins||0)/60*10)/10} hrs</div></td>
                                <td><span className="badge badge-dim" style={{fontSize:11}}>{c.target==='clients'?'Family':c.target==='hcas'?'HCAs':'All'}</span></td>
                                <td style={{fontSize:12,color:'var(--muted)'}}>{c.difficulty}</td>
                                <td style={{fontFamily:'var(--mono)',fontSize:12}}>{Array.isArray(c.lessons)?c.lessons.length:0}</td>
                                <td><div style={{fontFamily:'var(--mono)',fontSize:12}}>{enrolled}</div><div style={{fontSize:10,color:'var(--mint)'}}>({completed} complete)</div></td>
                                <td><span className={`badge ${c.status==='active'?'badge-mint':'badge-dim'}`}>{c.status}</span></td>
                                <td>
                                  <div style={{display:'flex',gap:6}}>
                                    <button className="btn-o btn-sm" onClick={()=>{
                                      setCourseForm({title:c.title,description:c.description||'',category:c.category||'',difficulty:c.difficulty||'Beginner',duration_mins:c.duration_mins||60,cover_emoji:c.cover_emoji||'📚',target:c.target||'all'});
                                      setEditingLessons(Array.isArray(c.lessons)?c.lessons:[]);
                                      setCourseModal(c);
                                    }}>Edit</button>
                                    <button className="btn-sm" style={{background:'rgba(168,0,64,0.1)',border:'1px solid rgba(168,0,64,0.2)',borderRadius:8,padding:'4px 10px',color:'var(--coral)',fontSize:12,cursor:'pointer'}}
                                      onClick={async()=>{
                                        if(!confirm('Archive this course?')) return;
                                        await updateLmsCourse(c.id, {status: c.status==='active'?'archived':'active'});
                                        setLmsCourses(await getLmsCourses());
                                      }}>
                                      {c.status==='active'?'Archive':'Activate'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── PARTNER SUBMISSIONS sub-tab ── */}
                {hubSubTab==='submissions' && (
                  <div>
                    <div style={{marginBottom:16,fontSize:13,color:'var(--muted)'}}>{lmsSubmissions.filter(s=>s.status==='pending').length} pending · {lmsSubmissions.length} total submissions</div>
                    {lmsSubmissions.length===0 ? (
                      <div style={{textAlign:'center',padding:'48px 0',color:'var(--muted)'}}>No partner submissions yet.</div>
                    ) : lmsSubmissions.map(s=>(
                      <div key={s.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(168,0,64,0.1)',borderRadius:14,padding:'18px 20px',marginBottom:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{s.course_title}</div>
                            <div style={{fontSize:12,color:'var(--muted)',marginBottom:6}}>
                              {s.org_name} · {s.contact_email} · {new Date(s.submitted_at).toLocaleDateString('en-GB')}
                            </div>
                            <div style={{fontSize:12,color:'var(--muted)',marginBottom:4}}>{s.description}</div>
                            {s.content_url && <a href={s.content_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:'var(--sky)'}}>{s.content_url}</a>}
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                            <span className={`badge ${s.status==='pending'?'badge-gold':s.status==='approved'?'badge-mint':'badge-coral'}`}>{s.status}</span>
                            {s.status==='pending' && (
                              <div style={{display:'flex',gap:6}}>
                                <button className="btn-p btn-sm" onClick={async()=>{
                                  await updateLmsSubmission(s.id,{status:'approved',reviewed_by:'admin',review_notes:'Approved by Super Admin'});
                                  setLmsSubmissions(await getLmsSubmissions());
                                }}>Approve</button>
                                <button className="btn-sm" style={{background:'rgba(249,112,102,0.1)',border:'1px solid rgba(249,112,102,0.2)',borderRadius:8,padding:'4px 10px',color:'var(--coral)',fontSize:12,cursor:'pointer'}} onClick={async()=>{
                                  await updateLmsSubmission(s.id,{status:'rejected',reviewed_by:'admin'});
                                  setLmsSubmissions(await getLmsSubmissions());
                                }}>Reject</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── REFERRALS sub-tab ── */}
                {hubSubTab==='referrals' && (
                  <div>
                    <div style={{marginBottom:16,fontSize:13,color:'var(--muted)'}}>{hubReferrals.filter(r=>r.status==='new').length} new · {hubReferrals.length} total</div>
                    {hubReferrals.length===0 ? (
                      <div style={{textAlign:'center',padding:'48px 0',color:'var(--muted)'}}>No counselling referral requests yet.</div>
                    ) : hubReferrals.map(r=>(
                      <div key={r.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(168,0,64,0.1)',borderRadius:14,padding:'18px 20px',marginBottom:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{r.name}</div>
                            <div style={{fontSize:12,color:'var(--muted)',marginBottom:6}}>
                              {r.phone && <span style={{marginRight:14}}>📞 {r.phone}</span>}
                              {r.email && <span>📧 {r.email}</span>}
                              <span style={{marginLeft:14,color:'var(--muted)'}}>· {new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div style={{fontSize:13,color:'var(--text)',lineHeight:1.6}}>{r.message}</div>
                            {r.admin_notes && <div style={{marginTop:8,fontSize:12,color:'var(--mint)',fontStyle:'italic'}}>Note: {r.admin_notes}</div>}
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                            <span className={`badge ${r.status==='new'?'badge-gold':r.status==='contacted'?'badge-mint':'badge-dim'}`}>{r.status}</span>
                            {r.status==='new' && (
                              <button className="btn-p btn-sm" onClick={async()=>{
                                await updateHubReferral(r.id,{status:'contacted',contacted_at:new Date().toISOString()});
                                setHubReferrals(await getHubReferrals());
                              }}>Mark Contacted</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── ACCESS REQUESTS sub-tab ── */}
                {hubSubTab==='access' && (
                  <div>
                    <div style={{marginBottom:16,fontSize:13,color:'var(--muted)'}}>{hubAccessReqs.filter(r=>r.status==='pending').length} pending · {hubAccessReqs.length} total</div>
                    {hubAccessReqs.length===0 ? (
                      <div style={{textAlign:'center',padding:'48px 0',color:'var(--muted)'}}>No access requests yet.</div>
                    ) : hubAccessReqs.map(r=>(
                      <div key={r.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(168,0,64,0.1)',borderRadius:14,padding:'18px 20px',marginBottom:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{r.name}</div>
                            <div style={{fontSize:12,color:'var(--muted)',marginBottom:6}}>{r.organisation && `${r.organisation} · `}{r.email} · {new Date(r.created_at).toLocaleDateString('en-GB')}</div>
                            <div style={{fontSize:13,lineHeight:1.6}}>{r.message}</div>
                            {r.designation && <div style={{marginTop:6,fontSize:12,color:'var(--sky)'}}>Designation: {r.designation}</div>}
                            {r.admin_notes && <div style={{marginTop:4,fontSize:12,color:'var(--mint)',fontStyle:'italic'}}>Note: {r.admin_notes}</div>}
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                            <span className={`badge ${r.status==='pending'?'badge-gold':r.status==='approved'?'badge-mint':'badge-coral'}`}>{r.status}</span>
                            {r.status==='pending' && (
                              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                                <select
                                  defaultValue="partner"
                                  id={`desig-${r.id}`}
                                  style={{background:'#14182a',border:'1px solid rgba(168,0,64,0.18)',borderRadius:8,padding:'4px 8px',color:'var(--text)',fontSize:12,outline:'none'}}>
                                  <option value="partner">Partner Organisation</option>
                                  <option value="healthcare_provider">Healthcare Provider</option>
                                  <option value="training_provider">Training Provider</option>
                                  <option value="researcher">Researcher</option>
                                </select>
                                <button className="btn-p btn-sm" onClick={async()=>{
                                  const sel = document.getElementById(`desig-${r.id}`);
                                  await updateHubAccessRequest(r.id,{status:'approved',designation:sel.value,reviewed_by:'admin',reviewed_at:new Date().toISOString()});
                                  setHubAccessReqs(await getHubAccessRequests());
                                }}>Approve</button>
                                <button className="btn-sm" style={{background:'rgba(249,112,102,0.1)',border:'1px solid rgba(249,112,102,0.2)',borderRadius:8,padding:'4px 10px',color:'var(--coral)',fontSize:12,cursor:'pointer'}} onClick={async()=>{
                                  await updateHubAccessRequest(r.id,{status:'rejected',reviewed_by:'admin',reviewed_at:new Date().toISOString()});
                                  setHubAccessReqs(await getHubAccessRequests());
                                }}>Reject</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── COURSE EDITOR MODAL ── */}
                {courseModal && (
                  <div className="modal-bg" onClick={()=>setCourseModal(null)}>
                    <div className="modal-box" style={{maxWidth:700}} onClick={e=>e.stopPropagation()}>
                      <div className="modal-title">{courseModal==='new'?'Add New Course':'Edit Course'}</div>

                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                        <div style={{gridColumn:'1/-1'}} className="modal-field">
                          <label className="modal-label">Course Title</label>
                          <input className="modal-input" value={courseForm.title} onChange={e=>setCourseForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Advanced Wound Care" />
                        </div>
                        <div style={{gridColumn:'1/-1'}} className="modal-field">
                          <label className="modal-label">Description</label>
                          <textarea className="modal-input" rows={3} value={courseForm.description} onChange={e=>setCourseForm(p=>({...p,description:e.target.value}))} placeholder="What will learners achieve?" style={{resize:'vertical'}} />
                        </div>
                        <div className="modal-field">
                          <label className="modal-label">Category</label>
                          <select className="modal-sel" value={courseForm.category} onChange={e=>setCourseForm(p=>({...p,category:e.target.value}))}>
                            {['Clinical Skills','Specialist Care','Palliative Care','Caregiver Wellness','Professional Practice','Mental Health','Communication','General'].map(c=><option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="modal-field">
                          <label className="modal-label">Difficulty</label>
                          <select className="modal-sel" value={courseForm.difficulty} onChange={e=>setCourseForm(p=>({...p,difficulty:e.target.value}))}>
                            {['Beginner','Intermediate','Advanced','All Levels'].map(d=><option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="modal-field">
                          <label className="modal-label">Target Audience</label>
                          <select className="modal-sel" value={courseForm.target} onChange={e=>setCourseForm(p=>({...p,target:e.target.value}))}>
                            <option value="all">All Users</option>
                            <option value="clients">Family Caregivers</option>
                            <option value="hcas">HomeCare Assistants</option>
                          </select>
                        </div>
                        <div className="modal-field">
                          <label className="modal-label">Duration (minutes)</label>
                          <input className="modal-input" type="number" value={courseForm.duration_mins} onChange={e=>setCourseForm(p=>({...p,duration_mins:Number(e.target.value)}))} />
                        </div>
                        <div className="modal-field">
                          <label className="modal-label">Cover Emoji</label>
                          <input className="modal-input" value={courseForm.cover_emoji} onChange={e=>setCourseForm(p=>({...p,cover_emoji:e.target.value}))} placeholder="📚" maxLength={2} />
                        </div>
                      </div>

                      {/* Lessons editor */}
                      <div style={{marginTop:20,borderTop:'1px solid rgba(168,0,64,0.1)',paddingTop:16}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                          <div style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Lessons ({editingLessons.length})</div>
                          <button className="btn-o btn-sm" onClick={()=>setEditingLessons(p=>[...p,{idx:p.length,title:'',objectives:[''],summary:'',key_points:[''],resource_url:'',duration_mins:20}])}>+ Add Lesson</button>
                        </div>
                        {editingLessons.map((lesson,li)=>(
                          <div key={li} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(168,0,64,0.08)',borderRadius:10,padding:14,marginBottom:10}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                              <div style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--sky)'}}>Lesson {li+1}</div>
                              <button onClick={()=>setEditingLessons(p=>p.filter((_,i)=>i!==li))} style={{background:'none',border:'none',color:'var(--coral)',cursor:'pointer',fontSize:14}}>✕</button>
                            </div>
                            <div className="modal-field">
                              <label className="modal-label">Title</label>
                              <input className="modal-input" style={{fontSize:13,padding:'8px 12px'}} value={lesson.title} onChange={e=>setEditingLessons(p=>p.map((l,i)=>i===li?{...l,title:e.target.value}:l))} placeholder="Lesson title" />
                            </div>
                            <div className="modal-field">
                              <label className="modal-label">Summary</label>
                              <textarea className="modal-input" rows={2} style={{fontSize:13,padding:'8px 12px',resize:'vertical'}} value={lesson.summary||''} onChange={e=>setEditingLessons(p=>p.map((l,i)=>i===li?{...l,summary:e.target.value}:l))} placeholder="Lesson content summary..." />
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                              <div className="modal-field">
                                <label className="modal-label">Objectives (comma-separated)</label>
                                <input className="modal-input" style={{fontSize:13,padding:'8px 12px'}} value={(lesson.objectives||[]).join(', ')} onChange={e=>setEditingLessons(p=>p.map((l,i)=>i===li?{...l,objectives:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}:l))} placeholder="Objective 1, Objective 2" />
                              </div>
                              <div className="modal-field">
                                <label className="modal-label">Key Points (comma-separated)</label>
                                <input className="modal-input" style={{fontSize:13,padding:'8px 12px'}} value={(lesson.key_points||[]).join(', ')} onChange={e=>setEditingLessons(p=>p.map((l,i)=>i===li?{...l,key_points:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}:l))} placeholder="Key point 1, Key point 2" />
                              </div>
                              <div className="modal-field">
                                <label className="modal-label">Resource URL</label>
                                <input className="modal-input" style={{fontSize:13,padding:'8px 12px'}} value={lesson.resource_url||''} onChange={e=>setEditingLessons(p=>p.map((l,i)=>i===li?{...l,resource_url:e.target.value}:l))} placeholder="https://..." />
                              </div>
                              <div className="modal-field">
                                <label className="modal-label">Duration (minutes)</label>
                                <input className="modal-input" type="number" style={{fontSize:13,padding:'8px 12px'}} value={lesson.duration_mins||20} onChange={e=>setEditingLessons(p=>p.map((l,i)=>i===li?{...l,duration_mins:Number(e.target.value)}:l))} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="modal-actions">
                        <button className="btn-o btn-sm" onClick={()=>setCourseModal(null)}>Cancel</button>
                        <button className="btn-p" onClick={async()=>{
                          const lessons = editingLessons.map((l,i)=>({...l,idx:i}));
                          const payload = { ...courseForm, lessons, tags: [] };
                          try {
                            if (courseModal==='new') {
                              await createLmsCourse(payload);
                            } else {
                              await updateLmsCourse(courseModal.id, payload);
                            }
                            setLmsCourses(await getLmsCourses());
                            setCourseModal(null);
                          } catch(e) { alert('Error saving course: ' + e.message); }
                        }}>
                          {courseModal==='new' ? 'Create Course' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}
