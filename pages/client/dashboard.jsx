import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { DASH_BASE } from "../../components/SharedStyles";
import {
  getClientSession,
  clearClientSession,
  getClientByEmail,
  getClientById,
  updateClient,
  getInvoicesByClient,
  getShiftsByClient,
  getActivityLog,
  advanceClientJourney,
  addPatientToClient,
  updatePatient,
  removePatient,
  toggleHcaShortlist,
  requestHcaMatch,
  getAllHcaProfiles,
  getNotificationsForClient,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  sendTcAcceptedNotification,
  sendWelcomeNotification,
  requestAccountDeletion,
  JOURNEY_STAGES,
  JOURNEY_LABELS,
} from "../../lib/store";

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

  /* T&C accept banner */
  .tc-banner { background:linear-gradient(135deg,rgba(232,132,90,0.12),rgba(200,149,42,0.08)); border:1px solid rgba(200,149,42,0.28); border-radius:16px; padding:18px 22px; margin-bottom:22px; display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
  .tc-banner-icon { font-size:28px; flex-shrink:0; }
  .tc-banner-body { flex:1; min-width:220px; }
  .tc-banner-title { font-weight:700; font-size:14px; margin-bottom:3px; }
  .tc-banner-sub { font-size:12px; color:var(--muted); line-height:1.5; }

  /* Patient accounts */
  .patient-tabs { display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; padding-bottom:4px; }
  .pat-tab { padding:8px 18px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.22s; border:1px solid rgba(0,74,153,0.18); background:transparent; color:var(--muted); font-family:var(--sans); white-space:nowrap; }
  .pat-tab.active { background:rgba(0,74,153,0.1); border-color:var(--jade); color:var(--jade); }

  /* Billing */
  .invoice-row { display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid rgba(0,74,153,0.08); flex-wrap:wrap; }
  .invoice-row:last-child { border-bottom:none; }
  .inv-num    { font-family:var(--mono); font-size:12px; color:var(--muted); min-width:90px; }
  .inv-desc   { flex:1; font-size:13px; min-width:120px; }
  .inv-date   { font-size:12px; color:var(--muted); min-width:90px; text-align:center; font-family:var(--mono); }
  .inv-amt    { font-family:var(--serif); font-size:15px; font-weight:700; color:var(--gold); min-width:110px; text-align:right; }
  .inv-status { min-width:80px; text-align:right; }

  /* Activity feed */
  .activity-item { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid rgba(0,74,153,0.07); }
  .activity-item:last-child { border-bottom:none; }
  .act-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
  .act-txt  { font-size:13px; color:var(--muted); line-height:1.5; flex:1; }
  .act-txt strong { color:var(--text); }
  .act-time { font-size:11px; color:var(--muted); font-family:var(--mono); margin-top:3px; }

  /* HCA cards */
  .hca-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
  .hca-card { background:rgba(255,255,255,0.06); border:1px solid rgba(0,74,153,0.15); border-radius:18px; padding:18px; transition:all 0.25s; }
  .hca-card:hover { border-color:rgba(0,74,153,0.3); transform:translateY(-2px); }
  .hca-card.shortlisted { border-color:rgba(0,74,153,0.4); background:rgba(0,74,153,0.08); }
  .hca-card.requested   { border-color:rgba(132,189,96,0.5); background:rgba(132,189,96,0.07); }
  .hca-av { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,var(--jade),var(--emerald)); display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:10px; }
  .hca-name { font-weight:700; font-size:14px; margin-bottom:2px; }
  .hca-cert { font-size:11px; color:var(--jade); font-family:var(--mono); margin-bottom:8px; }
  .hca-tags { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; }
  .hca-tag  { padding:3px 8px; border-radius:100px; font-size:10px; background:rgba(0,74,153,0.08); border:1px solid rgba(0,74,153,0.15); color:var(--muted); font-family:var(--mono); }
  .hca-actions { display:flex; gap:7px; flex-wrap:wrap; }

  /* Modal overlay */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal-box { background:#fff; border:1px solid rgba(0,74,153,0.15); border-radius:22px; padding:32px; max-width:540px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 80px rgba(0,74,153,0.18); }
  .modal-title { font-family:var(--serif); font-size:20px; font-weight:700; color:var(--text); margin-bottom:20px; }
  .modal-field { margin-bottom:16px; }
  .modal-label { font-size:11px; color:var(--jade); font-family:var(--mono); letter-spacing:0.5px; text-transform:uppercase; margin-bottom:7px; display:block; font-weight:700; }
  .modal-input { width:100%; background:#fff; border:1px solid rgba(0,74,153,0.18); border-radius:10px; padding:11px 14px; color:var(--text); font-family:var(--sans); font-size:14px; outline:none; box-sizing:border-box; transition:border-color 0.2s; }
  .modal-input:focus { border-color:var(--jade); box-shadow:0 0 0 3px rgba(0,74,153,0.08); }
  .modal-sel { width:100%; background:#fff; border:1px solid rgba(0,74,153,0.18); border-radius:10px; padding:11px 14px; color:var(--text); font-family:var(--sans); font-size:14px; outline:none; box-sizing:border-box; }
  .modal-ta  { width:100%; background:#fff; border:1px solid rgba(0,74,153,0.18); border-radius:10px; padding:11px 14px; color:var(--text); font-family:var(--sans); font-size:14px; outline:none; box-sizing:border-box; resize:vertical; min-height:80px; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:22px; }
  .modal-err { background:rgba(249,112,102,0.08); border:1px solid rgba(249,112,102,0.22); border-radius:10px; padding:10px 14px; font-size:13px; color:#c0392b; margin-bottom:14px; }
  .modal-ok  { background:rgba(0,74,153,0.07); border:1px solid rgba(0,74,153,0.18); border-radius:10px; padding:10px 14px; font-size:13px; color:var(--jade); margin-bottom:14px; }

  /* Notification bell */
  .notif-bell { position:relative; cursor:pointer; padding:6px; border-radius:10px; transition:background 0.2s; }
  .notif-bell:hover { background:rgba(0,74,153,0.08); }
  .notif-badge { position:absolute; top:2px; right:2px; min-width:16px; height:16px; border-radius:100px; background:var(--coral); color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; font-family:var(--mono); padding:0 3px; }

  /* Notification drawer */
  .notif-panel { position:fixed; top:0; right:0; width:380px; max-width:100vw; height:100vh; background:#fff; box-shadow:-8px 0 40px rgba(0,74,153,0.18); z-index:400; display:flex; flex-direction:column; }
  .notif-header { padding:22px 24px 16px; border-bottom:1px solid rgba(0,74,153,0.1); display:flex; align-items:center; justify-content:space-between; }
  .notif-header-title { font-family:var(--serif); font-size:18px; font-weight:700; color:var(--text); }
  .notif-list { flex:1; overflow-y:auto; }
  .notif-item { padding:16px 24px; border-bottom:1px solid rgba(0,74,153,0.07); cursor:pointer; transition:background 0.18s; }
  .notif-item:hover { background:rgba(0,74,153,0.03); }
  .notif-item.unread { background:rgba(0,74,153,0.05); border-left:3px solid var(--jade); }
  .notif-subj { font-size:13px; font-weight:700; color:var(--text); margin-bottom:4px; line-height:1.4; }
  .notif-time { font-size:11px; color:var(--muted); font-family:var(--mono); }
  .notif-type-icon { font-size:20px; width:36px; height:36px; border-radius:10px; background:rgba(0,74,153,0.07); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .email-preview { background:rgba(0,74,153,0.04); border:1px solid rgba(0,74,153,0.12); border-radius:12px; padding:18px; margin-top:12px; white-space:pre-wrap; font-size:12px; color:var(--muted); font-family:var(--mono); line-height:1.7; max-height:280px; overflow-y:auto; }

  /* T&C modal scroll */
  .tc-scroll { background:rgba(0,74,153,0.03); border:1px solid rgba(0,74,153,0.1); border-radius:12px; padding:16px 18px; max-height:220px; overflow-y:auto; font-size:13px; color:var(--muted); line-height:1.75; margin-bottom:16px; }
  .tc-scroll h4 { color:var(--text); font-size:14px; margin-bottom:10px; margin-top:14px; }
  .tc-scroll h4:first-child { margin-top:0; }

  /* Account edit form */
  .edit-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  @media (max-width:900px) {
    .sidebar-close { display:flex !important; }
    .hca-grid { grid-template-columns:1fr 1fr; }
  }
  @media (max-width:700px) {
    .edit-grid { grid-template-columns:1fr; }
    .notif-panel { width:100vw; }
    .hca-grid { grid-template-columns:1fr; }
  }
`;

const JOURNEY_UI = {
  account_created:   { lbl:"Account\nCreated",   icon:"🌱" },
  tc_accepted:       { lbl:"T&C\nAccepted",      icon:"📄" },
  acknowledged:      { lbl:"Acknowledged",        icon:"📬" },
  call_made:         { lbl:"Call\nMade",          icon:"📞" },
  visit_scheduled:   { lbl:"Visit\nScheduled",    icon:"📅" },
  visit_done:        { lbl:"Visit\nDone",         icon:"🏠" },
  hca_matched:       { lbl:"HCA\nMatched",        icon:"🤝" },
  payment_pending:   { lbl:"Payment\nPending",    icon:"💳" },
  payment_confirmed: { lbl:"Payment\nConfirmed",  icon:"✅" },
  placement_active:  { lbl:"Placement\nActive",   icon:"🏥" },
};

const NOTIF_ICONS = {
  welcome:           "🌿",
  tc_accepted:       "📄",
  visit_scheduled:   "📅",
  invoice:           "💳",
  hca_matched:       "🤝",
  payment_confirmed: "✅",
  password_reset:    "🔑",
  default:           "📬",
};

const CARE_TYPES = ["Palliative","Dementia","Companionship","Critical Care","Diabetic Care","Cerebral Palsy","Visual Impairment","Mobility Assistance","Child Care","Post-Surgery","Elderly Care","Mental Health","Other"];
const LOCATIONS  = ["Nairobi CBD","Westlands","Karen","Kilimani","Kileleshwa","Lavington","Langata","Eastlands","Kasarani","Thika Road","Mombasa","Kisumu","Nakuru","Eldoret","Nyeri","Other"];

const NAV_ITEMS = [
  { icon:"📊", label:"Overview",      key:"overview"   },
  { icon:"👥", label:"Patients",      key:"patients"   },
  { icon:"🩺", label:"Find an HCA",   key:"hcas"       },
  { icon:"💳", label:"Billing",       key:"billing"    },
  { icon:"📅", label:"Shift History", key:"shifts"     },
  { icon:"📄", label:"Documents",     key:"documents"  },
  { icon:"⚙️", label:"Account",       key:"account"    },
];

function fmt(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); }
  catch { return iso?.slice(0,10) || "—"; }
}
function relTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmt(iso);
}

// ─── Add Patient Modal ────────────────────────────────────────────────────────
function AddPatientModal({ clientId, existing, onClose, onSaved }) {
  const blank = { name:"", gender:"", careType:"", relationship:"", age:"", conditions:"", notes:"" };
  const [form, setForm] = useState(blank);
  const [err,  setErr]  = useState("");
  const [saving, setSaving] = useState(false);
  const upd = (f,v) => setForm(p=>({...p,[f]:v}));

  async function save() {
    if (!form.name || !form.gender || !form.careType) { setErr("Name, gender and care type are required."); return; }
    setSaving(true);
    try {
      const updated = await addPatientToClient(clientId, {
        name: form.name, gender: form.gender, careType: form.careType,
        relationship: form.relationship, age: form.age ? Number(form.age) : undefined,
        conditions: form.conditions, notes: form.notes,
      });
      onSaved(updated);
      onClose();
    } catch(e) {
      console.error("Add patient error:", e);
      setErr("Failed to add patient. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-title">Add a Patient</div>
        {err && <div className="modal-err">⚠ {err}</div>}
        <div className="edit-grid">
          <div className="modal-field">
            <label className="modal-label">Patient Name *</label>
            <input className="modal-input" placeholder="Full name" value={form.name} onChange={e=>upd("name",e.target.value)} autoFocus />
          </div>
          <div className="modal-field">
            <label className="modal-label">Relationship to You</label>
            <input className="modal-input" placeholder="e.g. Mother, Father, Spouse" value={form.relationship} onChange={e=>upd("relationship",e.target.value)} />
          </div>
        </div>
        <div className="edit-grid">
          <div className="modal-field">
            <label className="modal-label">Gender *</label>
            <select className="modal-sel" value={form.gender} onChange={e=>upd("gender",e.target.value)}>
              <option value="">Select...</option>
              <option>Female</option><option>Male</option><option>Other</option>
            </select>
          </div>
          <div className="modal-field">
            <label className="modal-label">Age</label>
            <input className="modal-input" type="number" placeholder="e.g. 72" value={form.age} onChange={e=>upd("age",e.target.value)} min={0} max={120} />
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">Primary Care Need *</label>
          <select className="modal-sel" value={form.careType} onChange={e=>upd("careType",e.target.value)}>
            <option value="">Select care type...</option>
            {CARE_TYPES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="modal-field">
          <label className="modal-label">Medical Conditions / Diagnoses</label>
          <input className="modal-input" placeholder="e.g. Alzheimer's, Hypertension, Diabetes" value={form.conditions} onChange={e=>upd("conditions",e.target.value)} />
        </div>
        <div className="modal-field">
          <label className="modal-label">Special Notes</label>
          <textarea className="modal-ta" placeholder="Allergies, dietary restrictions, mobility needs, medications..." value={form.notes} onChange={e=>upd("notes",e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-o" style={{padding:"9px 20px"}} onClick={onClose}>Cancel</button>
          <button className="btn-p" style={{padding:"9px 20px"}} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Add Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Patient Modal ───────────────────────────────────────────────────────
function EditPatientModal({ clientId, patient, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: patient.name||"", gender: patient.gender||"", careType: patient.careType||patient.conditions||"",
    relationship: patient.relationship||"", age: patient.age||"",
    conditions: patient.conditions||"", notes: patient.notes||"",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const upd = (f,v) => setForm(p=>({...p,[f]:v}));

  async function save() {
    if (!form.name || !form.gender) { setErr("Name and gender are required."); return; }
    setSaving(true);
    try {
      const updated = await updatePatient(clientId, patient.id, {
        name: form.name, gender: form.gender, careType: form.careType,
        relationship: form.relationship, age: form.age ? Number(form.age) : undefined,
        conditions: form.conditions, notes: form.notes,
      });
      onSaved(updated);
      onClose();
    } catch(e) {
      console.error("Edit patient error:", e);
      setErr("Failed to save changes. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-title">Edit Patient — {patient.name}</div>
        {err && <div className="modal-err">⚠ {err}</div>}
        <div className="edit-grid">
          <div className="modal-field">
            <label className="modal-label">Patient Name *</label>
            <input className="modal-input" value={form.name} onChange={e=>upd("name",e.target.value)} />
          </div>
          <div className="modal-field">
            <label className="modal-label">Relationship</label>
            <input className="modal-input" value={form.relationship} onChange={e=>upd("relationship",e.target.value)} />
          </div>
        </div>
        <div className="edit-grid">
          <div className="modal-field">
            <label className="modal-label">Gender *</label>
            <select className="modal-sel" value={form.gender} onChange={e=>upd("gender",e.target.value)}>
              <option value="">Select...</option>
              <option>Female</option><option>Male</option><option>Other</option>
            </select>
          </div>
          <div className="modal-field">
            <label className="modal-label">Age</label>
            <input className="modal-input" type="number" value={form.age} onChange={e=>upd("age",e.target.value)} min={0} />
          </div>
        </div>
        <div className="modal-field">
          <label className="modal-label">Primary Care Need</label>
          <select className="modal-sel" value={form.careType} onChange={e=>upd("careType",e.target.value)}>
            <option value="">Select...</option>
            {CARE_TYPES.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="modal-field">
          <label className="modal-label">Conditions</label>
          <input className="modal-input" value={form.conditions} onChange={e=>upd("conditions",e.target.value)} />
        </div>
        <div className="modal-field">
          <label className="modal-label">Special Notes</label>
          <textarea className="modal-ta" value={form.notes} onChange={e=>upd("notes",e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-o" style={{padding:"9px 20px"}} onClick={onClose}>Cancel</button>
          <button className="btn-p" style={{padding:"9px 20px"}} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── T&C Modal ────────────────────────────────────────────────────────────────
function TcModal({ client, onClose, onAccepted }) {
  const [checked,  setChecked]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  async function accept() {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await advanceClientJourney(client.id, "tc_accepted");
      try { await sendTcAcceptedNotification(updated); } catch(_) { /* non-critical */ }
      onAccepted(updated);
      onClose();
    } catch(e) {
      console.error("T&C acceptance error:", e);
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-title">📄 Terms & Conditions</div>
        <div className="tc-scroll">
          <h4>1. Service Agreement</h4>
          <p>E-Vive provides a platform to match clients with Home Care Assistants (HCAs). E-Vive is not a direct employer of HCAs but acts as a placement and management intermediary.</p>
          <h4>2. Client Obligations</h4>
          <p>The Client agrees to provide accurate information about patients&apos; care needs, maintain safe and respectful conditions for HCAs on premises, and adhere to the agreed payment schedule.</p>
          <h4>3. Placement Process</h4>
          <p>Following account creation, E-Vive will acknowledge the application, call the client, conduct a home visit, confirm the HCA match, and proceed with placement upon receipt of payment.</p>
          <h4>4. Payment</h4>
          <p>Placement commences only after payment is received and confirmed by E-Vive admin. Invoices are issued following the home visit and HCA matching. Payment reminders are sent 5 days before due dates.</p>
          <h4>5. Confidentiality</h4>
          <p>HCA contact details are managed exclusively through the E-Vive platform. Direct solicitation of HCAs outside the platform is prohibited and may result in account termination.</p>
          <h4>6. Care Quality</h4>
          <p>E-Vive monitors care quality through shift Cardex records, timeliness data, and client feedback.</p>
          <h4>7. Account Closure</h4>
          <p>To close an account, give 14 days written notice. Outstanding payments must be cleared before closure is processed.</p>
          <h4>8. Data Protection</h4>
          <p>Client and patient data is handled in accordance with Kenya&apos;s Data Protection Act 2019. Personal information is not shared with third parties without consent.</p>
        </div>
        <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",fontSize:13,color:"var(--muted)",marginBottom:18,lineHeight:1.5}}>
          <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{accentColor:"var(--jade)",width:16,height:16,marginTop:2,flexShrink:0}} />
          <span>I have read and agree to the E-Vive Terms & Conditions. I confirm all information provided is accurate and I have authority to act on behalf of the patients listed.</span>
        </label>
        <div className="modal-actions">
          <button className="btn-o" style={{padding:"9px 20px"}} onClick={onClose}>Cancel</button>
          <button className="btn-p" style={{padding:"9px 20px"}} onClick={accept} disabled={!checked||saving}>
            {saving ? "Accepting…" : "Accept T&Cs →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HCA Request Modal ────────────────────────────────────────────────────────
function HcaRequestModal({ client, hca, onClose, onSaved }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const updated = await requestHcaMatch(client.id, hca.id, notes);
      onSaved(updated);
      setDone(true);
    } catch(e) {
      console.error("HCA request error:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-title">Request HCA — {hca.name}</div>
        {done ? (
          <div>
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <div style={{fontSize:14,color:"var(--muted)",lineHeight:1.6}}>Your request has been sent to E-Vive admin. We will contact you to confirm the match.</div>
            </div>
            <div className="modal-actions"><button className="btn-p" style={{padding:"9px 20px"}} onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <>
            <div style={{background:"rgba(0,74,153,0.05)",border:"1px solid rgba(0,74,153,0.12)",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{hca.name}</div>
              <div style={{fontSize:12,color:"var(--jade)",fontFamily:"var(--mono)",marginBottom:6}}>{hca.employeeId} · {hca.certLevel}</div>
              <div style={{fontSize:12,color:"var(--muted)"}}>Specialisations: {(hca.specialisations||[]).join(", ")||"General HCA"}</div>
            </div>
            <div className="modal-field">
              <label className="modal-label">Additional Notes for Admin (optional)</label>
              <textarea className="modal-ta" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. 'We prefer a Kikuyu-speaking carer' or 'Nights only'" />
            </div>
            <div style={{background:"rgba(200,149,42,0.08)",border:"1px solid rgba(200,149,42,0.22)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"var(--muted)",marginBottom:6}}>
              ℹ️ This is a request — E-Vive admin will confirm the match after reviewing your care requirements.
            </div>
            <div className="modal-actions">
              <button className="btn-o" style={{padding:"9px 20px"}} onClick={onClose}>Cancel</button>
              <button className="btn-p" style={{padding:"9px 20px"}} onClick={submit} disabled={saving}>
                {saving ? "Sending…" : "Submit Request →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Notification email preview modal ─────────────────────────────────────────
function NotifEmailModal({ notif, onClose }) {
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontSize:24}}>{NOTIF_ICONS[notif.type]||"📬"}</span>
          <div>
            <div className="modal-title" style={{marginBottom:2,fontSize:16}}>{notif.subject}</div>
            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{notif.emailTo ? `To: ${notif.emailTo}` : ""} · {relTime(notif.createdAt)}</div>
          </div>
        </div>
        <div style={{background:"rgba(0,74,153,0.04)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:10,padding:"14px 16px",fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)",lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:340,overflowY:"auto"}}>
          {notif.body}
        </div>
        <div style={{marginTop:14,fontSize:12,color:"var(--muted)",padding:"10px 14px",background:"rgba(14,165,233,0.05)",border:"1px solid rgba(14,165,233,0.12)",borderRadius:10}}>
          📧 In a live deployment, this email would be delivered to <strong style={{color:"var(--jade)"}}>{notif.emailTo}</strong> via your email service provider.
        </div>
        <div className="modal-actions"><button className="btn-p" style={{padding:"9px 20px"}} onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

// ─── M-Pesa STK Push Modal ────────────────────────────────────────────────────
function MpesaPayModal({ invoice, defaultPhone, onClose }) {
  const [phone,  setPhone]  = useState(defaultPhone || "");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [msg,    setMsg]    = useState("");

  async function initiatePush() {
    if (!phone.trim()) { setMsg("Enter your M-Pesa registered phone number."); return; }
    setStatus("sending");
    setMsg("");
    try {
      const res  = await fetch("/api/mpesa/stkpush", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          phone:      phone.trim(),
          amount:     invoice.total,
          accountRef: invoice.invoiceNum,
          description: "E-Vive Invoice",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("error");
        setMsg(data.error || "STK Push failed. Please try again.");
      } else {
        setStatus("success");
        setMsg(data.customerMessage || "M-Pesa prompt sent! Check your phone and enter your PIN to complete payment.");
      }
    } catch (err) {
      setStatus("error");
      setMsg("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:420}}>
        <div className="modal-title">📱 Pay with M-Pesa</div>

        <div style={{background:"rgba(0,74,153,0.04)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:12,padding:"14px 18px",marginBottom:20}}>
          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>Invoice</div>
          <div style={{fontWeight:700,fontSize:15}}>{invoice.invoiceNum}</div>
          {invoice.description && <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{invoice.description}</div>}
          <div style={{fontFamily:"var(--serif)",fontSize:22,fontWeight:700,color:"var(--gold)",marginTop:8}}>KES {(invoice.total||0).toLocaleString()}</div>
        </div>

        {status !== "success" && (
          <>
            <div className="modal-field">
              <label className="modal-label">M-Pesa Phone Number</label>
              <input
                className="modal-input"
                placeholder="e.g. 0712 345 678"
                value={phone}
                onChange={e=>{ setPhone(e.target.value); setMsg(""); }}
                type="tel"
                autoFocus
              />
              <div style={{fontSize:11,color:"var(--muted)",marginTop:5}}>Safaricom number registered on M-Pesa</div>
            </div>

            <div style={{fontSize:12,color:"var(--muted)",padding:"10px 14px",background:"rgba(14,165,233,0.05)",border:"1px solid rgba(14,165,233,0.12)",borderRadius:10,marginBottom:16,lineHeight:1.6}}>
              Paybill <strong style={{fontFamily:"var(--mono)"}}>4165689</strong> · Account: <strong style={{fontFamily:"var(--mono)"}}>{invoice.invoiceNum}</strong>
            </div>
          </>
        )}

        {msg && (
          <div style={{
            padding:"12px 14px",borderRadius:10,marginBottom:16,fontSize:13,lineHeight:1.5,
            background: status==="error" ? "rgba(249,112,102,0.08)" : "rgba(0,180,100,0.08)",
            border:     status==="error" ? "1px solid rgba(249,112,102,0.22)" : "1px solid rgba(0,180,100,0.22)",
            color:      status==="error" ? "#c0392b" : "#0a6640",
          }}>
            {status==="success" ? "✅ " : "⚠️ "}{msg}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-o" style={{padding:"9px 20px"}} onClick={onClose}>
            {status==="success" ? "Close" : "Cancel"}
          </button>
          {status !== "success" && (
            <button
              className="btn-p"
              style={{padding:"9px 20px",background:status==="sending"?"#888":undefined,cursor:status==="sending"?"not-allowed":undefined}}
              onClick={initiatePush}
              disabled={status==="sending"}
            >
              {status==="sending" ? "Sending…" : "Send M-Pesa Prompt"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const router = useRouter();
  const [tab,       setTab]      = useState("overview");
  const [patIdx,    setPatIdx]   = useState(0);
  const [client,    setClient]   = useState(null);
  const [invoices,  setInvoices] = useState([]);
  const [shifts,    setShifts]   = useState([]);
  const [activity,  setActivity] = useState([]);
  const [hcaProfiles, setHcaProfiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  // Modals
  const [showAddPatient,  setShowAddPatient]  = useState(false);
  const [editPatient,     setEditPatient]     = useState(null);  // patient object
  const [showTc,          setShowTc]          = useState(false);
  const [requestHca,      setRequestHca]      = useState(null);  // hca profile object
  const [previewNotif,    setPreviewNotif]    = useState(null);  // notification object
  const [showNotifPanel,  setShowNotifPanel]  = useState(false);
  const [mpesaInvoice,    setMpesaInvoice]    = useState(null);  // invoice being paid

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Account editing
  const [editMode,   setEditMode]   = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [editErr,    setEditErr]    = useState("");
  const [editOk,     setEditOk]     = useState("");

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted]  = useState(false);

  const reload = useCallback(async () => {
    const session = getClientSession();
    if (!session) { router.replace("/client/register"); return; }
    async function loadData() {
      let full = session.id ? await getClientById(session.id) : null;
      if (!full && session.email) full = await getClientByEmail(session.email);
      if (!full) {
        full = {
          id: null, name: session.name, email: session.email, mobile: session.mobile,
          location:"", address:"", patients:[], journeyStage:"account_created",
          journeyDates:{}, visitDate:null, assignedHcaId:null, status:"active",
          createdAt: new Date().toISOString(),
        };
      }
      setClient(full);
      setDeletionSubmitted(!!full.deletionRequested);
      if (full.id) {
        const [invs, shfs, notifs, count] = await Promise.all([
          getInvoicesByClient(full.id),
          getShiftsByClient(full.id),
          getNotificationsForClient(full.id),
          getUnreadCount(full.id),
        ]);
        setInvoices(invs);
        setShifts(shfs);
        setNotifications(notifs);
        setUnreadCount(count);
      }
      const log = await getActivityLog();
      setActivity(log.filter(a => !a.clientId || a.clientId === full.id).slice(0, 12));
      const hcas = await getAllHcaProfiles();
      setHcaProfiles(hcas.filter(h => h.status === "active"));
    }
    loadData();
  }, [router]);

  useEffect(() => {
    const session = getClientSession();
    async function init() {
      await reload();
      // Send welcome notification once if account_created and no notifications yet
      if (session) {
        let c = session.id ? await getClientById(session.id) : await getClientByEmail(session.email);
        if (c && c.journeyStage === "account_created") {
          const existing = await getNotificationsForClient(c.id);
          if (!existing.some(n => n.type === "welcome")) {
            await sendWelcomeNotification(c);
          }
        }
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() { clearClientSession(); router.push("/client/register"); }

  if (!client) return null;

  const patients = client.patients || [];
  const pat = patients[patIdx] || null;
  const userName = client.name?.split(" ")[0] || "Client";
  const currentStageIdx = JOURNEY_STAGES.indexOf(client.journeyStage);
  const hasTcPending = client.journeyStage === "account_created";
  const shortlistedHcas = client.shortlistedHcas || [];
  const requestedHcaId  = client.requestedHcaId;

  const displayStages = ["account_created","tc_accepted","acknowledged","call_made","visit_scheduled","visit_done","hca_matched","payment_pending","payment_confirmed","placement_active"];
  const totalInvoiced  = invoices.reduce((s,i) => s+(i.total||0), 0);
  const totalPaid      = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.total||0),0);
  const outstanding    = totalInvoiced - totalPaid;
  const nextDue        = invoices.filter(i=>i.status!=="paid"&&i.dueDate).sort((a,b)=>a.dueDate<b.dueDate?-1:1)[0];
  const pendingInvoices = invoices.filter(i=>i.status!=="paid").length;

  const nextHint = {
    account_created:   "Please accept the Terms & Conditions to begin your onboarding.",
    acknowledged:      "Our team will call you soon to discuss your care requirements.",
    call_made:         "A home visit will be scheduled after the call.",
    visit_scheduled:   client.visitDate ? `Home visit scheduled for ${fmt(client.visitDate)}.` : "A home visit date will be confirmed shortly.",
    visit_done:        "Our team is matching an HCA to your patients.",
    hca_matched:       "An invoice will be issued — payment confirms the placement.",
    payment_pending:   "Please clear the invoice to activate the placement.",
    payment_confirmed: "Your placement is being activated.",
    placement_active:  "Your placement is active. Care is underway.",
  }[client.journeyStage] || "Our team will be in touch soon.";

  // Account edit helpers
  function startEdit() {
    setEditForm({ name:client.name||"", mobile:client.mobile||"", location:client.location||"", address:client.address||"" });
    setEditErr(""); setEditOk(""); setEditMode(true);
  }
  async function saveEdit() {
    if (!editForm.name || !editForm.mobile) { setEditErr("Name and mobile are required."); return; }
    await updateClient(client.id, { name:editForm.name, mobile:editForm.mobile, location:editForm.location, address:editForm.address });
    const fresh = await getClientById(client.id);
    setClient(fresh);
    setEditOk("Profile updated successfully.");
    setEditMode(false);
    reload();
  }

  async function openNotif(n) {
    if (!n.read) await markNotificationRead(n.id);
    setPreviewNotif(n);
    reload();
  }

  async function handleDeleteRequest() {
    if (!client.id) return;
    await requestAccountDeletion(client.id);
    setDeletionSubmitted(true);
    setShowDeleteConfirm(false);
    reload();
  }

  return (
    <>
      <Head>
        <title>Client Dashboard — E-Vive Kenya</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{DASH_BASE + CSS}</style>

      {/* ── Modals ── */}
      {showAddPatient && client.id && (
        <AddPatientModal clientId={client.id} existing={patients} onClose={()=>setShowAddPatient(false)} onSaved={async (updated)=>{await reload();setPatIdx((updated.patients||[]).length-1);setTab("patients");}} />
      )}
      {editPatient && client.id && (
        <EditPatientModal clientId={client.id} patient={editPatient} onClose={()=>setEditPatient(null)} onSaved={()=>reload()} />
      )}
      {showTc && (
        <TcModal client={client} onClose={()=>setShowTc(false)} onAccepted={()=>{reload();setShowTc(false);}} />
      )}
      {requestHca && (
        <HcaRequestModal client={client} hca={requestHca} onClose={()=>setRequestHca(null)} onSaved={()=>reload()} />
      )}
      {previewNotif && (
        <NotifEmailModal notif={previewNotif} onClose={()=>setPreviewNotif(null)} />
      )}
      {mpesaInvoice && (
        <MpesaPayModal invoice={mpesaInvoice} defaultPhone={client?.mobile||""} onClose={()=>setMpesaInvoice(null)} />
      )}

      {/* ── Notification Panel ── */}
      {showNotifPanel && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:399}} onClick={()=>setShowNotifPanel(false)} />
          <div className="notif-panel">
            <div className="notif-header">
              <div className="notif-header-title">📬 Notifications</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {unreadCount > 0 && (
                  <button style={{fontSize:12,color:"var(--jade)",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--mono)",fontWeight:600}} onClick={async ()=>{await markAllNotificationsRead(client.id);reload();}}>
                    Mark all read
                  </button>
                )}
                <button style={{fontSize:18,background:"none",border:"none",cursor:"pointer",color:"var(--muted)",lineHeight:1}} onClick={()=>setShowNotifPanel(false)}>✕</button>
              </div>
            </div>
            <div className="notif-list">
              {notifications.length === 0 && (
                <div style={{textAlign:"center",padding:"40px 24px",color:"var(--muted)",fontSize:13}}>No notifications yet.</div>
              )}
              {notifications.map(n=>(
                <div key={n.id} className={`notif-item${n.read?"":" unread"}`} onClick={()=>openNotif(n)}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div className="notif-type-icon">{NOTIF_ICONS[n.type]||"📬"}</div>
                    <div style={{flex:1}}>
                      <div className="notif-subj">{n.subject}</div>
                      <div className="notif-time">{relTime(n.createdAt)}</div>
                    </div>
                    {!n.read && <div style={{width:8,height:8,borderRadius:"50%",background:"var(--jade)",flexShrink:0,marginTop:4}} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && <div className="dash-side-overlay open" onClick={()=>setMobileMenuOpen(false)} />}

      <div className="dash-wrap">
        {/* ── SIDEBAR ── */}
        <aside className={`dash-side${mobileMenuOpen?" open":""}`}>
          <div className="dash-logo" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <Link href="/" style={{textDecoration:"none"}}>
              <div className="dash-logo-text">e<span>-</span>vive</div>
              <div className="dash-logo-sub">Client Portal</div>
            </Link>
            {/* Close button visible on mobile */}
            <button onClick={()=>setMobileMenuOpen(false)} style={{display:"none",background:"none",border:"none",cursor:"pointer",fontSize:20,color:"var(--muted)",lineHeight:1,padding:"4px"}} className="sidebar-close">✕</button>
          </div>
          <div className="dash-user">
            <div className="dash-avatar">👤</div>
            <div>
              <div className="dash-user-name">{client.name}</div>
              <div className="dash-user-role">CLIENT · {client.location || "Kenya"}</div>
            </div>
          </div>
          <nav className="dash-nav">
            <div className="dash-nav-section">Navigation</div>
            {NAV_ITEMS.map(n=>(
              <button key={n.key} className={`dash-nav-item${tab===n.key?" active":""}`}
                onClick={()=>{setTab(n.key);setMobileMenuOpen(false);}}
                style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
                <span className="dash-nav-icon">{n.icon}</span>{n.label}
                {n.key==="billing" && pendingInvoices>0 && <span className="dash-nav-badge">{pendingInvoices}</span>}
              </button>
            ))}
          </nav>
          <div className="dash-footer">
            {hasTcPending && (
              <button onClick={()=>{setShowTc(true);setMobileMenuOpen(false);}} style={{width:"100%",marginBottom:10,background:"rgba(200,149,42,0.12)",border:"1px solid rgba(200,149,42,0.3)",borderRadius:10,padding:"10px 12px",color:"var(--amber)",fontSize:12,fontFamily:"var(--mono)",fontWeight:700,cursor:"pointer"}}>
                📄 Accept T&Cs
              </button>
            )}
            <button onClick={handleLogout} style={{background:"none",border:"none",cursor:"pointer",color:"var(--coral)",fontFamily:"var(--mono)",fontSize:12,fontWeight:600,padding:"8px 0",textAlign:"left",width:"100%",display:"flex",alignItems:"center",gap:6}}>
              ⎋ Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="dash-main">
          <div className="dash-topbar">
            <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0,flex:1}}>
              {/* Hamburger — mobile only */}
              <button className="dash-hamburger" onClick={()=>setMobileMenuOpen(o=>!o)} aria-label="Open menu">☰</button>
              <div style={{minWidth:0}}>
                <div className="dash-title">Good day, <span>{userName}</span></div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                  {" · "}{patients.length} Patient{patients.length!==1?"s":""}
                </div>
              </div>
            </div>
            <div className="dash-actions" style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              {/* Notification bell */}
              <div className="notif-bell" onClick={()=>setShowNotifPanel(true)} title="Notifications">
                <span style={{fontSize:20}}>🔔</span>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </div>
              {/* Mobile sign-out pill */}
              <button className="topbar-logout" onClick={handleLogout} title="Sign out">⎋ Sign Out</button>
              {hasTcPending && (
                <button className="btn-o btn-sm" onClick={()=>setShowTc(true)}>📄 Accept T&Cs</button>
              )}
            </div>
          </div>

          <div className="dash-content">

            {/* T&C banner */}
            {hasTcPending && (
              <div className="tc-banner">
                <div className="tc-banner-icon">📋</div>
                <div className="tc-banner-body">
                  <div className="tc-banner-title">Please accept our Terms & Conditions to continue your onboarding</div>
                  <div className="tc-banner-sub">This is required before E-Vive can acknowledge your application and assign an HCA to your patients.</div>
                </div>
                <button className="btn-p btn-sm" onClick={()=>setShowTc(true)}>Read & Accept →</button>
              </div>
            )}

            {/* ── OVERVIEW ── */}
            {tab==="overview" && (
              <>
                <div className="journey-bar">
                  <div className="jb-title">Your Client Journey — {JOURNEY_LABELS[client.journeyStage]}</div>
                  <div className="jb-steps">
                    {displayStages.map((stage,i)=>{
                      const stageIdx = JOURNEY_STAGES.indexOf(stage);
                      const status = stageIdx < currentStageIdx ? "done" : stageIdx === currentStageIdx ? "current" : "pending";
                      const ui = JOURNEY_UI[stage];
                      return (
                        <div key={stage} style={{display:"contents"}}>
                          <div className="jb-step">
                            <div className={`jb-dot ${status}`}>{status==="done"?"✓":ui.icon}</div>
                            <div className={`jb-lbl ${status}`} style={{whiteSpace:"pre-line"}}>{ui.lbl}</div>
                            {client.journeyDates?.[stage] && (
                              <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{fmt(client.journeyDates[stage])}</div>
                            )}
                          </div>
                          {i < displayStages.length-1 && (
                            <div className={`jb-conn ${stageIdx<currentStageIdx?"done":"pending"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{marginTop:14,padding:"10px 14px",background:"rgba(232,213,168,0.08)",border:"1px solid rgba(232,213,168,0.2)",borderRadius:10,fontSize:13,color:"var(--muted)"}}>
                    💡 <strong style={{color:"var(--amber)"}}>Next:</strong> {nextHint}
                    {hasTcPending && (
                      <button onClick={()=>setShowTc(true)} style={{marginLeft:12,background:"var(--amber)",color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--sans)"}}>Accept T&Cs →</button>
                    )}
                  </div>
                </div>

                <div className="stat-grid">
                  {[
                    {icon:"👥",lbl:"Patients Registered",val:patients.length.toString(),color:"mint"},
                    {icon:"📋",lbl:"Journey Stage",val:JOURNEY_LABELS[client.journeyStage],color:"amber"},
                    {icon:"💳",lbl:"Invoices Outstanding",val:outstanding>0?`KES ${outstanding.toLocaleString()}`:"Clear",color:outstanding>0?"coral":"mint"},
                    {icon:"📅",lbl:"Next Due Date",val:nextDue?fmt(nextDue.dueDate):"—",color:"sky"},
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}>
                      <div className="stat-box-icon">{s.icon}</div>
                      <div className={`stat-box-val ${s.color}`} style={{fontSize:s.lbl==="Journey Stage"?13:undefined}}>{s.val}</div>
                      <div className="stat-box-label">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:18}}>
                  <div className="panel">
                    <div className="panel-head">
                      <div className="panel-title">Patient Accounts</div>
                      <div style={{display:"flex",gap:8}}>
                        <span className="badge badge-mint">{patients.length} Patient{patients.length!==1?"s":""}</span>
                        {client.id && <button className="btn-p btn-sm" onClick={()=>setShowAddPatient(true)}>+ Add Patient</button>}
                      </div>
                    </div>
                    <div className="panel-body">
                      {patients.length===0 && (
                        <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)"}}>
                          <div style={{fontSize:32,marginBottom:8}}>👥</div>
                          <div style={{fontSize:13,marginBottom:12}}>No patients added yet.</div>
                          {client.id && <button className="btn-p btn-sm" onClick={()=>setShowAddPatient(true)}>+ Add First Patient</button>}
                        </div>
                      )}
                      {patients.map((p,i)=>(
                        <div key={p.id||i} style={{padding:"12px 0",borderBottom:i<patients.length-1?"1px solid rgba(0,74,153,0.08)":"none",cursor:"pointer"}} onClick={()=>{setPatIdx(i);setTab("patients");}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                            <div>
                              <div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
                              <div style={{fontSize:11,color:"var(--mint)",fontFamily:"var(--mono)",margin:"2px 0"}}>{p.careType||p.conditions||"Care"}{p.relationship?` · ${p.relationship}`:""}</div>
                              <div style={{fontSize:12,color:"var(--muted)"}}>{p.gender}{p.age?`, ${p.age}y`:""}</div>
                            </div>
                            <span className={`badge ${client.assignedHcaId?"badge-mint":"badge-gold"}`}>
                              {client.assignedHcaId?"HCA Placed":"Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <div className="panel-title">Recent Activity</div>
                      {unreadCount > 0 && (
                        <button className="btn-o btn-sm" onClick={()=>setShowNotifPanel(true)}>🔔 {unreadCount} new</button>
                      )}
                    </div>
                    <div className="panel-body">
                      {activity.length===0 && <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>No activity yet.</div>}
                      {activity.map((a,i)=>(
                        <div key={a.id||i} className="activity-item">
                          <div className="act-dot" style={{background:"var(--jade)"}} />
                          <div>
                            <div className="act-txt">
                              <strong>{JOURNEY_LABELS[a.type?.replace("journey_","")]||a.type?.replace(/_/g," ")}</strong>
                              {a.clientName?` — ${a.clientName}`:""}
                            </div>
                            <div className="act-time">{relTime(a.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── PATIENTS TAB ── */}
            {tab==="patients" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                  <div style={{fontWeight:700,fontSize:16}}>Patient Accounts</div>
                  {client.id && <button className="btn-p btn-sm" onClick={()=>setShowAddPatient(true)}>+ Add Patient</button>}
                </div>
                {patients.length===0 ? (
                  <div className="panel">
                    <div className="panel-body" style={{textAlign:"center",padding:"40px"}}>
                      <div style={{fontSize:40,marginBottom:12}}>👥</div>
                      <div style={{fontSize:14,color:"var(--muted)",marginBottom:16}}>No patients registered yet.</div>
                      {client.id && <button className="btn-p btn-sm" onClick={()=>setShowAddPatient(true)}>+ Add First Patient</button>}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="patient-tabs">
                      {patients.map((p,i)=>(
                        <button key={p.id||i} className={`pat-tab${patIdx===i?" active":""}`} onClick={()=>setPatIdx(i)}>{p.name}</button>
                      ))}
                    </div>
                    {pat && (
                      <div className="panel">
                        <div className="panel-head">
                          <div>
                            <div className="panel-title">{pat.name}</div>
                            {pat.relationship && <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{pat.relationship}</div>}
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <span className={`badge ${client.assignedHcaId?"badge-mint":"badge-gold"}`}>{client.assignedHcaId?"HCA Placed":"Pending"}</span>
                            {client.id && pat.id && (
                              <>
                                <button className="btn-o btn-sm" onClick={()=>setEditPatient(pat)}>Edit</button>
                                <button className="btn-o btn-sm" style={{color:"var(--coral)"}} onClick={async ()=>{if(confirm(`Remove ${pat.name}?`)){await removePatient(client.id,pat.id);await reload();setPatIdx(0);}}}>Remove</button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="panel-body">
                          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                            {[["Gender",pat.gender||"—"],["Age",pat.age?`${pat.age}y`:"—"],["Primary Care",pat.careType||pat.conditions||"—"]].map(([l,v])=>(
                              <div key={l} style={{background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:12,padding:12}}>
                                <div style={{fontSize:10,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:3}}>{l}</div>
                                <div style={{fontSize:14,fontWeight:600}}>{v}</div>
                              </div>
                            ))}
                          </div>
                          {pat.conditions && (
                            <div style={{marginBottom:12,fontSize:13,color:"var(--muted)",background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.08)",borderRadius:10,padding:"10px 14px"}}>
                              <strong style={{color:"var(--text)"}}>Conditions:</strong> {pat.conditions}
                            </div>
                          )}
                          {pat.notes && (
                            <div style={{fontSize:13,color:"var(--muted)",background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.08)",borderRadius:10,padding:"10px 14px",lineHeight:1.65}}>
                              <strong style={{color:"var(--text)"}}>Special Notes:</strong> {pat.notes}
                            </div>
                          )}
                          {!client.assignedHcaId && (
                            <div style={{textAlign:"center",padding:"22px 0 8px",color:"var(--muted)"}}>
                              <div style={{fontSize:30,marginBottom:8}}>⏳</div>
                              <div style={{fontSize:13,marginBottom:12}}>HCA placement pending — complete onboarding steps to get matched.</div>
                              <button className="btn-p btn-sm" onClick={()=>setTab("hcas")}>Browse Available HCAs →</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── FIND AN HCA ── */}
            {tab==="hcas" && (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16}}>Available HCAs</div>
                    <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>Shortlist your preferred HCA — admin will confirm the match after your home visit.</div>
                  </div>
                </div>

                {requestedHcaId && (
                  <div style={{background:"rgba(132,189,96,0.08)",border:"1px solid rgba(132,189,96,0.25)",borderRadius:14,padding:"14px 18px",marginBottom:18,fontSize:13,color:"var(--muted)"}}>
                    ✅ <strong style={{color:"var(--mint)"}}>HCA request submitted.</strong> E-Vive admin will contact you to confirm the placement.
                  </div>
                )}

                {hcaProfiles.length===0 ? (
                  <div className="panel">
                    <div className="panel-body" style={{textAlign:"center",padding:"40px"}}>
                      <div style={{fontSize:40,marginBottom:12}}>🩺</div>
                      <div style={{fontSize:14,color:"var(--muted)"}}>No HCA profiles available yet. Contact <a href="mailto:hello@e-vive.co.ke" style={{color:"var(--jade)"}}>hello@e-vive.co.ke</a> to discuss your options.</div>
                    </div>
                  </div>
                ) : (
                  <div className="hca-grid">
                    {hcaProfiles.map(h=>{
                      const isShortlisted = shortlistedHcas.includes(h.id);
                      const isRequested   = requestedHcaId === h.id;
                      return (
                        <div key={h.id} className={`hca-card${isShortlisted?" shortlisted":""}${isRequested?" requested":""}`}>
                          <div className="hca-av">🩺</div>
                          <div className="hca-name">{h.name}</div>
                          <div className="hca-cert">{h.employeeId} · {h.certLevel||"HCA"} · {h.yearsExp||0}y exp</div>
                          {(h.specialisations||[]).length>0 && (
                            <div className="hca-tags">
                              {(h.specialisations||[]).slice(0,3).map(s=><span key={s} className="hca-tag">{s}</span>)}
                            </div>
                          )}
                          <div className="hca-actions">
                            {client.id && (
                              <button
                                className={`btn-sm ${isShortlisted?"btn-p":"btn-o"}`}
                                onClick={async ()=>{await toggleHcaShortlist(client.id,h.id);reload();}}
                              >
                                {isShortlisted?"★ Shortlisted":"☆ Shortlist"}
                              </button>
                            )}
                            {client.id && !isRequested && (
                              <button className="btn-p btn-sm" onClick={()=>setRequestHca(h)}>Request →</button>
                            )}
                            {isRequested && <span className="badge badge-mint" style={{fontSize:11}}>✓ Requested</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {shortlistedHcas.length>0 && (
                  <div style={{marginTop:20,padding:"12px 16px",background:"rgba(0,74,153,0.05)",border:"1px solid rgba(0,74,153,0.12)",borderRadius:12,fontSize:13,color:"var(--muted)"}}>
                    ⭐ You have shortlisted <strong style={{color:"var(--jade)"}}>{shortlistedHcas.length}</strong> HCA{shortlistedHcas.length!==1?"s":""}. Use the <strong>Request →</strong> button to formally submit your preference to E-Vive admin.
                  </div>
                )}
              </>
            )}

            {/* ── BILLING ── */}
            {tab==="billing" && (
              <>
                <div className="stat-grid">
                  {[
                    {icon:"💰",lbl:"Total Invoiced",val:totalInvoiced>0?`KES ${totalInvoiced.toLocaleString()}`:"—",color:"amber"},
                    {icon:"✅",lbl:"Paid to Date",  val:totalPaid>0?`KES ${totalPaid.toLocaleString()}`:"—",          color:"mint"},
                    {icon:"⏳",lbl:"Outstanding",   val:outstanding>0?`KES ${outstanding.toLocaleString()}`:"Clear",   color:outstanding>0?"coral":"mint"},
                    {icon:"📅",lbl:"Next Due Date", val:nextDue?fmt(nextDue.dueDate):"—",                              color:"sky"},
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
                    {invoices.length===0 && (
                      <div style={{textAlign:"center",padding:"32px 0",color:"var(--muted)"}}>
                        <div style={{fontSize:36,marginBottom:8}}>💳</div>
                        <div style={{fontSize:13}}>No invoices issued yet. Invoices appear here once a placement is confirmed.</div>
                      </div>
                    )}
                    {invoices.map(inv=>(
                      <div key={inv.id} className="invoice-row">
                        <div className="inv-num">{inv.invoiceNum}</div>
                        <div className="inv-desc">{inv.description}</div>
                        <div className="inv-date">{fmt(inv.dueDate)}</div>
                        <div className="inv-amt">KES {(inv.total||0).toLocaleString()}</div>
                        <div className="inv-status">
                          <span className={`badge ${inv.status==="paid"?"badge-mint":inv.status==="overdue"?"badge-coral":"badge-gold"}`}>
                            {inv.status==="paid"?"Paid":inv.status==="overdue"?"Overdue":"Pending"}
                          </span>
                        </div>
                        {inv.status !== "paid" && (
                          <button
                            onClick={()=>setMpesaInvoice(inv)}
                            style={{marginLeft:"auto",padding:"6px 14px",borderRadius:20,border:"1px solid #0e9a52",background:"rgba(14,154,82,0.08)",color:"#0e9a52",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--mono)",whiteSpace:"nowrap"}}
                          >
                            📱 Pay
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Payment Methods</div></div>
                  <div className="panel-body">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      {[{icon:"📱",title:"M-Pesa Paybill",val:"Paybill: 4165689 · Your Account No."},{icon:"🏦",title:"Bank Transfer",val:"Equity Bank · E-Vive Kenya"}].map(m=>(
                        <div key={m.title} style={{background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:14,padding:"16px 18px"}}>
                          <div style={{fontSize:24,marginBottom:8}}>{m.icon}</div>
                          <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{m.title}</div>
                          <div style={{fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)"}}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:14,fontSize:12,color:"var(--muted)",padding:"10px 14px",background:"rgba(14,165,233,0.06)",border:"1px solid rgba(14,165,233,0.15)",borderRadius:10}}>
                      ℹ️ Contact <a href="mailto:hello@e-vive.co.ke" style={{color:"var(--sky)"}}>hello@e-vive.co.ke</a> for billing queries or payment confirmation.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── SHIFT HISTORY ── */}
            {tab==="shifts" && (
              <div className="panel">
                <div className="panel-head"><div className="panel-title">Shift History</div></div>
                <div className="panel-body">
                  {shifts.length===0 ? (
                    <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>
                      <div style={{fontSize:36,marginBottom:8}}>📅</div>
                      <div style={{fontSize:13}}>No shifts recorded yet. Shifts appear here once your placement is active.</div>
                    </div>
                  ) : (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Date</th><th>HCA</th><th>Type</th><th>Status</th></tr></thead>
                        <tbody>
                          {shifts.map(s=>(
                            <tr key={s.id}>
                              <td style={{fontFamily:"var(--mono)",fontSize:12}}>{s.date}</td>
                              <td>{s.hcaId||"—"}</td>
                              <td><span className="badge badge-gold">{s.type}</span></td>
                              <td><span className={`badge ${s.status==="completed"?"badge-mint":s.status==="missed"?"badge-coral":"badge-gold"}`}>{s.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {tab==="documents" && (
              <div className="panel">
                <div className="panel-head"><div className="panel-title">Documents & Agreements</div></div>
                <div className="panel-body">
                  {[
                    {icon:"📄",name:"Terms & Conditions",date:fmt(client.journeyDates?.tc_accepted)||"Not yet accepted",cls:client.journeyDates?.tc_accepted?"badge-mint":"badge-gold",status:client.journeyDates?.tc_accepted?"Accepted":"Pending"},
                    {icon:"📋",name:`Service Agreement — ${client.name}`,date:fmt(client.createdAt),cls:"badge-dim",status:"On File"},
                    ...invoices.map(inv=>({icon:"💳",name:`Invoice ${inv.invoiceNum}`,date:fmt(inv.issuedAt),cls:inv.status==="paid"?"badge-mint":"badge-gold",status:inv.status==="paid"?"Paid":"Pending"})),
                  ].map(d=>(
                    <div key={d.name} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:"1px solid rgba(0,74,153,0.08)"}}>
                      <span style={{fontSize:22}}>{d.icon}</span>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{d.name}</div><div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{d.date}</div></div>
                      <span className={`badge ${d.cls}`}>{d.status}</span>
                    </div>
                  ))}
                  {!client.journeyDates?.tc_accepted && (
                    <div style={{marginTop:16}}>
                      <button className="btn-p" style={{padding:"10px 22px"}} onClick={()=>setShowTc(true)}>📄 Accept Terms & Conditions →</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ACCOUNT ── */}
            {tab==="account" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,alignItems:"start"}}>
                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">Account Details</div>
                    {client.id && !editMode && <button className="btn-o btn-sm" onClick={startEdit}>Edit Profile</button>}
                  </div>
                  <div className="panel-body">
                    {editErr && <div className="modal-err">⚠ {editErr}</div>}
                    {editOk  && <div className="modal-ok">✓ {editOk}</div>}
                    {editMode ? (
                      <>
                        <div className="edit-grid" style={{marginBottom:14}}>
                          <div className="modal-field" style={{margin:0}}>
                            <label className="modal-label">Full Name *</label>
                            <input className="modal-input" value={editForm.name||""} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))} />
                          </div>
                          <div className="modal-field" style={{margin:0}}>
                            <label className="modal-label">Mobile Number *</label>
                            <input className="modal-input" value={editForm.mobile||""} onChange={e=>setEditForm(p=>({...p,mobile:e.target.value}))} />
                          </div>
                        </div>
                        <div className="edit-grid" style={{marginBottom:16}}>
                          <div className="modal-field" style={{margin:0}}>
                            <label className="modal-label">Location</label>
                            <select className="modal-sel" value={editForm.location||""} onChange={e=>setEditForm(p=>({...p,location:e.target.value}))}>
                              <option value="">Select...</option>
                              {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                            </select>
                          </div>
                          <div className="modal-field" style={{margin:0}}>
                            <label className="modal-label">Estate / Area</label>
                            <input className="modal-input" value={editForm.address||""} onChange={e=>setEditForm(p=>({...p,address:e.target.value}))} placeholder="e.g. Karen, Rose Ave" />
                          </div>
                        </div>
                        <div style={{display:"flex",gap:10}}>
                          <button className="btn-p" style={{padding:"9px 20px"}} onClick={saveEdit}>Save Changes</button>
                          <button className="btn-o" style={{padding:"9px 20px"}} onClick={()=>{setEditMode(false);setEditErr("");setEditOk("");}}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        {[["Client Name",client.name||"—"],["Email",client.email||"—"],["Mobile",client.mobile||"—"],["Location",client.location||"—"],["Address",client.address||"—"],["Member Since",fmt(client.createdAt)],["Status",client.status==="active"?"✓ Active":client.status]].map(([l,v])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(0,74,153,0.08)"}}>
                            <span style={{fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)"}}>{l}</span>
                            <span style={{fontSize:13,fontWeight:600,maxWidth:200,textAlign:"right"}}>{v}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:18}}>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Notifications</div>
                      {unreadCount>0 && <span className="badge badge-coral">{unreadCount} unread</span>}
                    </div>
                    <div className="panel-body">
                      {notifications.slice(0,4).map(n=>(
                        <div key={n.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(0,74,153,0.08)",cursor:"pointer",opacity:n.read?0.7:1}} onClick={()=>openNotif(n)}>
                          <span style={{fontSize:18}}>{NOTIF_ICONS[n.type]||"📬"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:n.read?400:700,color:"var(--text)",lineHeight:1.4}}>{n.subject}</div>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{relTime(n.createdAt)}</div>
                          </div>
                          {!n.read && <div style={{width:7,height:7,borderRadius:"50%",background:"var(--jade)",flexShrink:0,marginTop:4}} />}
                        </div>
                      ))}
                      {notifications.length===0 && <div style={{fontSize:13,color:"var(--muted)",textAlign:"center",padding:"16px 0"}}>No notifications.</div>}
                      {notifications.length>4 && (
                        <button className="btn-o btn-sm" style={{marginTop:12,width:"100%"}} onClick={()=>setShowNotifPanel(true)}>View All ({notifications.length})</button>
                      )}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Support</div></div>
                    <div className="panel-body">
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {[["📧 Email","hello@e-vive.co.ke","mailto:hello@e-vive.co.ke"],["📞 Phone","+254 141 888 340","tel:+254141888340"]].map(([lbl,val,href])=>(
                          <div key={lbl} style={{background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:10,padding:"12px 14px"}}>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:3}}>{lbl}</div>
                            <a href={href} style={{fontSize:13,fontWeight:600,color:"var(--jade)",textDecoration:"none"}}>{val}</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="panel" style={{border:"1px solid rgba(249,112,102,0.2)"}}>
                    <div className="panel-head" style={{borderBottom:"1px solid rgba(249,112,102,0.12)"}}>
                      <div className="panel-title" style={{color:"var(--coral)"}}>⚠️ Danger Zone</div>
                    </div>
                    <div className="panel-body">
                      <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.6}}>
                        Requesting account deletion notifies the E-Vive team. Your account will remain active for 14 days and all outstanding invoices must be settled before closure.
                      </p>
                      {deletionSubmitted || client.deletionRequested ? (
                        <div style={{background:"rgba(249,112,102,0.07)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"12px 14px",fontSize:13,color:"var(--coral)"}}>
                          ✓ Deletion request received. Our team will contact you within 2 business days.
                        </div>
                      ) : showDeleteConfirm ? (
                        <div style={{background:"rgba(249,112,102,0.07)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:12,padding:"16px"}}>
                          <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"var(--coral)"}}>Are you sure?</div>
                          <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.6}}>This will submit a deletion request to E-Vive. You can cancel within 48 hours by contacting support.</p>
                          <div style={{display:"flex",gap:10}}>
                            <button className="btn-danger" onClick={handleDeleteRequest}>Yes, Request Deletion</button>
                            <button className="btn-o btn-sm" onClick={()=>setShowDeleteConfirm(false)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-danger" onClick={()=>setShowDeleteConfirm(true)}>
                          🗑 Request Account Deletion
                        </button>
                      )}
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
