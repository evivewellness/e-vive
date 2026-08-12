import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { DASH_BASE } from "../../components/SharedStyles";
import CardexView from "../../components/CardexView";
import {
  getHcaSession,
  getHcaProfileById,
  clearHcaSession,
  getShiftsByHca,
  getCardexByHca,
  createCardexEntry,
  getAllClients,
  requestHcaDeletion,
  clockInHca,
  clockOutHca,
  updateHcaProfile,
  getLmsCourses,
  getEnrollmentsForUser,
  enrollInCourse,
  createHcaRequest,
  advanceHcaJourney,
  HCA_JOURNEY_STAGES,
  HCA_JOURNEY_LABELS,
  getCalendarEventsByHca,
} from "../../lib/store";

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

  /* Journey bar */
  .journey-bar { background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.15); border-radius:18px; padding:22px 26px; margin-bottom:24px; overflow-x:auto; }
  .jb-title { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-family:var(--mono); color:var(--muted); margin-bottom:16px; }
  .jb-steps { display:flex; align-items:center; min-width:560px; }
  .jb-step  { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; }
  .jb-dot   { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; transition:all 0.3s; }
  .jb-dot.done    { background:linear-gradient(135deg,var(--jade),var(--emerald)); color:#fff; box-shadow:0 0 12px rgba(0,74,153,0.25); }
  .jb-dot.current { background:linear-gradient(135deg,rgba(14,165,233,0.5),rgba(14,165,233,0.3)); border:2px solid var(--sky); color:var(--sky); animation:pulse-dot 2s infinite; }
  .jb-dot.pending { background:rgba(0,74,153,0.06); border:1px solid rgba(0,74,153,0.15); color:var(--muted); font-family:var(--mono); font-size:11px; }
  .jb-conn { flex:1; height:2px; max-width:none; margin-bottom:28px; }
  .jb-conn.done    { background:linear-gradient(90deg,var(--jade),var(--emerald)); }
  .jb-conn.pending { background:rgba(0,74,153,0.1); }
  .jb-lbl { font-size:10px; text-align:center; line-height:1.4; font-family:var(--mono); max-width:76px; }
  .jb-lbl.done    { color:var(--mint); }
  .jb-lbl.current { color:var(--sky); font-weight:700; }
  .jb-lbl.pending { color:var(--muted); }

  /* Shift history */
  .shift-hist-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid rgba(0,74,153,0.1); }
  .shift-hist-row:last-child { border-bottom:none; }
  .shr-date { font-family:var(--mono); font-size:12px; color:var(--muted); min-width:80px; }
  .shr-pat  { flex:1; font-size:13px; }
  .shr-type { font-size:11px; color:var(--amber); font-family:var(--mono); min-width:80px; }
  .shr-dur  { font-size:12px; color:var(--muted); font-family:var(--mono); min-width:60px; }

  /* Cardex view modal */
  .cx-view-bg { position:fixed; inset:0; background:rgba(0,8,24,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:20px; z-index:200; }
  .cx-view-box { background:rgba(6,20,44,0.98); border:1px solid rgba(14,165,233,0.25); border-radius:20px; padding:26px; max-width:640px; width:100%; max-height:85vh; overflow-y:auto; box-shadow:0 24px 80px rgba(0,0,0,0.4); }
  .cx-view-section { margin-bottom:20px; }

  /* Welfare */
  .welfare-opts { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px; }
  .welfare-opt  { background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.15); border-radius:14px; padding:18px; cursor:pointer; transition:all 0.28s; text-align:center; }
  .welfare-opt:hover { border-color:rgba(0,74,153,0.3); transform:translateY(-2px); }
  .welfare-opt-icon { font-size:28px; margin-bottom:8px; }
  .welfare-opt-title { font-size:13px; font-weight:700; margin-bottom:4px; }
  .welfare-opt-sub   { font-size:12px; color:var(--muted); }

  @media (max-width:900px) {
    .sidebar-close { display:flex !important; }
    .vital-grid { grid-template-columns:1fr 1fr; }
    .welfare-opts { grid-template-columns:1fr; }
  }
  @media (max-width:600px) {
    .vital-grid { grid-template-columns:1fr 1fr; }
    .incident-row { grid-template-columns:1fr 1fr; }
  }
`;


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

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

const HCA_JOURNEY_UI = {
  application_submitted: { lbl:"Application\nSubmitted", icon:"📝" },
  tc_accepted:            { lbl:"T&C\nAccepted",         icon:"📄" },
  under_review:           { lbl:"Under\nReview",          icon:"🔍" },
  approved:               { lbl:"Approved",                icon:"✅" },
  account_activated:      { lbl:"Account\nActivated",     icon:"🔐" },
  placement_assigned:     { lbl:"Placement\nAssigned",    icon:"🤝" },
};

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
  const [hcaProfile,setHcaProfile]= useState(null);
  const [liveShifts,setLiveShifts]= useState([]);
  const [cardexLog, setCardexLog] = useState([]);
  const [assignedClient, setAssignedClient] = useState(null);
  const [clients,   setClients]   = useState([]);
  const [viewCardex,setViewCardex]= useState(null);
  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [enrolling,   setEnrolling]   = useState(null);
  const [offDay, setOffDay] = useState({ from:"", to:"", reason:"" });
  const [offDayMsg, setOffDayMsg] = useState("");
  const [offDaySaving, setOffDaySaving] = useState(false);
  const [offDays, setOffDays] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionSubmitted, setDeletionSubmitted]  = useState(false);
  const [pwdForm, setPwdForm] = useState({ current:"", next:"", confirm:"" });
  const [pwdMsg,  setPwdMsg]  = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [currentShiftId,   setCurrentShiftId]      = useState(null);
  const [gpsLat,     setGpsLat]     = useState(null);
  const [gpsLng,     setGpsLng]     = useState(null);
  const [gpsLabel,   setGpsLabel]   = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsErr,     setGpsErr]     = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Try new store session first
    const session = getHcaSession();
    if (session?.id) {
      async function loadData() {
        const [profile, shifts, cardex, clients, courses, enrollments, calEvents] = await Promise.all([
          getHcaProfileById(session.id),
          getShiftsByHca(session.id),
          // A pre-deploy session has no cookie yet; an empty list is far better
          // than failing the whole dashboard load.
          getCardexByHca(session.id).catch(() => []),
          getAllClients(),
          getLmsCourses('hca'),
          getEnrollmentsForUser(session.id, 'hca'),
          getCalendarEventsByHca(session.id),
        ]);
        if (profile) {
          setHcaProfile(profile);
          setHcaId(profile.employeeId);
          setAuthed(true);
          setLiveShifts(shifts);
          setCardexLog(cardex);
          setClients(clients);
          setCourses(courses);
          setEnrollments(enrollments);
          setOffDays(calEvents.filter(e => e.type === 'offday'));
          const linked = clients.find(c => c.assignedHcaId === profile.id);
          if (linked) {
            setAssignedClient(linked);
            const pat = linked.patients?.[0];
            const needs = [];
            if (pat?.conditions) needs.push(...pat.conditions.split(',').map(c => c.trim()).filter(Boolean));
            if (pat?.notes) needs.push(pat.notes);
            if (needs.length) {
              setSpecialNeeds(needs);
              setChecks(needs.map(() => false));
              setFlags(needs.map(() => false));
            }
          }
          // Journey milestones that only ever advance forward — safe to call
          // on every load since advanceHcaJourney no-ops once a stage (or a
          // later one) is already recorded.
          advanceHcaJourney(profile.id, 'account_activated')
            .then(p => linked ? advanceHcaJourney(p.id, 'placement_assigned') : p)
            .then(setHcaProfile)
            .catch(()=>{});
          return;
        }
        // Profile not found — fall back to legacy
        if (!localStorage.getItem("hca_auth")) {
          window.location.href = "/hca/login";
        } else {
          setAuthed(true);
          setHcaId(localStorage.getItem("hca_id") || "");
        }
      }
      loadData();
      return;
    }
    // Legacy fallback (no session id)
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
  const [specialNeeds, setSpecialNeeds] = useState([]);
  const [checks,   setChecks]   = useState([]);
  const [flags,    setFlags]    = useState([]);
  const [savedAt,  setSavedAt]  = useState(null);

  const time    = useTime();
  const duration= useDuration(clockStart);

  // Computed stats from real store data
  const now = new Date();
  const thisMonthShifts = liveShifts.filter(s => {
    if (s.status === "cancelled") return false;
    const d = new Date(s.date || s.clockIn || "");
    return !isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const completedShifts = thisMonthShifts.filter(s => s.status === "completed");
  const hcaRate = hcaProfile?.rate || 2000;
  const earningsMTD = completedShifts.length * hcaRate;
  const ratingDisplay = hcaProfile?.rating ? `${Number(hcaProfile.rating).toFixed(1)} ★` : "—";
  const patient = assignedClient?.patients?.[0] || null;

  function clientForShift(s) {
    return clients.find(c => c.id === s.clientId) || null;
  }
  function patientNameForShift(s) {
    const c = clientForShift(s);
    if (!c) return null;
    const p = s.patientId ? (c.patients||[]).find(p => p.id === s.patientId) : null;
    return p?.name || c.patients?.[0]?.name || c.name || null;
  }
  function clientNameById(id) {
    if (!id) return null;
    return clients.find(c => c.id === id)?.name || null;
  }

  // Haversine distance in metres between two GPS points
  function haversineM(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async function clockIn() {
    setGpsErr("");

    // Must have an active placement
    if (!assignedClient) {
      setGpsErr("You cannot clock in without an active placement. Contact your E-Vive coordinator.");
      return;
    }

    setGpsLoading(true);
    let lat = null, lng = null, label = "Location unavailable";
    try {
      const pos = await new Promise((res, rej) => {
        if (!navigator?.geolocation) { rej(new Error("GPS not supported")); return; }
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 14000, enableHighAccuracy: true });
      });
      lat   = pos.coords.latitude;
      lng   = pos.coords.longitude;
      label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (e) {
      setGpsLoading(false);
      setGpsErr("GPS access denied or unavailable. Enable location permissions and try again.");
      return;
    }
    setGpsLat(lat); setGpsLng(lng); setGpsLabel(label);
    setGpsLoading(false);

    // Enforce proximity to client premises (≤ 10 m)
    const clientLat = assignedClient?.lat;
    const clientLng = assignedClient?.lng;
    if (clientLat && clientLng) {
      const dist = haversineM(lat, lng, clientLat, clientLng);
      if (dist > 10) {
        setGpsErr(`You are ${Math.round(dist)} m from the client's premises. You must be within 10 m to clock in.`);
        return;
      }
    }

    try {
      const pat = assignedClient?.patients?.[0];
      const shift = await clockInHca(hcaProfile?.id || hcaId, {
        clientId:  assignedClient?.id  || null,
        patientId: pat?.id             || null,
        lat, lng,
      });
      if (shift?.id) setCurrentShiftId(shift.id);
      setLiveShifts(await getShiftsByHca(hcaProfile?.id || hcaId));
    } catch(e) { console.error("Clock-in error:", e); }

    setClockState("in"); setClockStart(Date.now()); setTab("cardex"); setCardexOpen(true);
  }

  // ── Cardex draft persistence ───────────────────────────────────────────────
  // saveDraft() used to only set a timestamp string — the footer promised
  // "auto-saves every 5 minutes" while nothing was written anywhere, so a
  // refresh or a dead battery discarded a form filled in across a 12-hour
  // shift. Drafts are per-HCA and stay on the HCA's own device.
  const draftKey = hcaProfile?.id ? `evive_cardex_draft_${hcaProfile.id}` : null;

  // The draft payload lives in a ref as well as state. The autosave interval
  // reads the ref, so its effect does NOT depend on the form contents — if it
  // did, every keystroke would tear down and restart the timer and the
  // five-minute save would never fire while someone was actually typing,
  // which is the exact case it exists for. Do not "simplify" this away.
  const draftRef = useRef(null);
  draftRef.current = {
    vitals, meds, intakes, nutrition, hygiene, mobility, elimination,
    mentalSt, incidents, handover, shiftRating, welfareNote, checks, flags,
  };

  const writeDraft = useCallback(() => {
    if (!draftKey || typeof window === "undefined") return false;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ savedAt: new Date().toISOString(), data: draftRef.current }));
      setSavedAt(new Date().toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"}));
      return true;
    } catch { return false; }   // quota / private mode — never block the shift
  }, [draftKey]);

  function clearDraft() {
    if (draftKey && typeof window !== "undefined") localStorage.removeItem(draftKey);
  }

  function saveDraft() { writeDraft(); }

  // Restore once the profile is known (draftKey depends on it).
  const draftRestored = useRef(false);
  useEffect(() => {
    if (!draftKey || draftRestored.current || typeof window === "undefined") return;
    draftRestored.current = true;
    let saved;
    try { saved = JSON.parse(localStorage.getItem(draftKey) || "null"); } catch { return; }
    const d = saved?.data;
    if (!d) return;
    if (d.vitals)      setVitals(d.vitals);
    if (d.meds)        setMeds(d.meds);
    if (d.intakes)     setIntakes(d.intakes);
    if (d.nutrition)   setNutrition(d.nutrition);
    if (d.hygiene)     setHygiene(d.hygiene);
    if (d.mobility)    setMobility(d.mobility);
    if (d.elimination) setElim(d.elimination);
    if (d.mentalSt)    setMentalSt(d.mentalSt);
    if (d.incidents)   setIncidents(d.incidents);
    if (d.handover)    setHandover(d.handover);
    if (d.shiftRating) setShiftRating(d.shiftRating);
    if (d.welfareNote) setWelfareNote(d.welfareNote);
    if (Array.isArray(d.checks)) setChecks(d.checks);
    if (Array.isArray(d.flags))  setFlags(d.flags);
    if (saved.savedAt) setSavedAt(new Date(saved.savedAt).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"}));
  }, [draftKey]);

  // Autosave every 5 minutes while clocked in. Depends only on writeDraft
  // (stable) and clockState — never on the form data. See the ref note above.
  useEffect(() => {
    if (clockState !== "in" || !draftKey) return;
    const id = setInterval(writeDraft, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [clockState, draftKey, writeDraft]);


  const SHIFT_HOURS = 12;
  const shiftElapsedMs   = clockStart ? Date.now() - clockStart : 0;
  const shiftComplete    = shiftElapsedMs >= SHIFT_HOURS * 3600 * 1000;
  const shiftRemainingMs = Math.max(0, SHIFT_HOURS * 3600 * 1000 - shiftElapsedMs);
  const shiftRemainingH  = Math.floor(shiftRemainingMs / 3600000);
  const shiftRemainingM  = Math.floor((shiftRemainingMs % 3600000) / 60000);

  async function submitCardex() {
    if (!shiftComplete && clockStart) {
      alert(`⏱ Shift not yet complete. ${shiftRemainingH}h ${shiftRemainingM}m remaining before you can submit.`);
      return;
    }
    if (hcaProfile?.id) {
      try {
        const pat = assignedClient?.patients?.[0];
        await createCardexEntry({
          hcaId:     hcaProfile.id,
          clientId:  assignedClient?.id || null,
          patientId: pat?.id            || null,
          shiftId:   currentShiftId     || null,
          vitals,
          medications: meds,
          intakes,
          nutrition,
          hygiene,
          mobility,
          elimination,
          mentalState: mentalSt,
          incidents,
          handover,
          shiftRating,
          welfareNote,
          specialNeedsChecks: specialNeeds.map((n,i)=>({ need:n, done:checks[i]||false, flagged:flags[i]||false })),
        });
        if (currentShiftId) {
          await clockOutHca(hcaProfile.id, currentShiftId);
        }
        setCurrentShiftId(null);
        clearDraft();   // clinical data must not linger after submission
        setCardexLog(await getCardexByHca(hcaProfile.id));
        setLiveShifts(await getShiftsByHca(hcaProfile.id));
      } catch(e) { console.error("Cardex save error:", e); }
    }
    setClockState("submitted"); setTab("today");
  }

  async function clockOut() {
    if (!shiftComplete && clockStart) {
      alert(`⏱ Shift not yet complete. ${shiftRemainingH}h ${shiftRemainingM}m remaining. Please complete the full 12-hour shift before clocking out.`);
      return;
    }
    // Enforce GPS proximity on clock-out (≤ 10 m)
    const clientLat = assignedClient?.lat;
    const clientLng = assignedClient?.lng;
    if (clientLat && clientLng) {
      setGpsLoading(true);
      setGpsErr("");
      try {
        const pos = await new Promise((res, rej) => {
          if (!navigator?.geolocation) { rej(new Error("GPS not supported")); return; }
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 12000 });
        });
        const { latitude: lat, longitude: lng } = pos.coords;
        const dist = haversineM(lat, lng, clientLat, clientLng);
        if (dist > 10) {
          setGpsErr(`You are ${Math.round(dist)} m from the client's premises. You must be within 10 m to clock out.`);
          setGpsLoading(false);
          return;
        }
      } catch {
        setGpsErr("GPS access denied or unavailable. Enable location permissions and try again.");
        setGpsLoading(false);
        return;
      }
      setGpsLoading(false);
    }
    setClockState("out"); setClockStart(null); setCardexOpen(false);
    setGpsLat(null); setGpsLng(null); setGpsLabel("");
  }
  function logout() {
    clearDraft();   // never leave clinical data on a shared device
    clearHcaSession();
    if (typeof window !== "undefined") {
      localStorage.removeItem("hca_auth");
      localStorage.removeItem("hca_id");
    }
    window.location.href = "/hca/login";
  }

  async function handleDeleteRequest() {
    if (hcaProfile?.id) {
      await requestHcaDeletion(hcaProfile.id);
    }
    setDeletionSubmitted(true);
    setShowDeleteConfirm(false);
  }

  async function handleChangePassword() {
    setPwdMsg("");
    if (!pwdForm.current || !pwdForm.next || !pwdForm.confirm) { setPwdMsg("⚠ All fields are required."); return; }
    if (pwdForm.current !== hcaProfile?.password) { setPwdMsg("⚠ Current password is incorrect."); return; }
    if (pwdForm.next.length < 8) { setPwdMsg("⚠ New password must be at least 8 characters."); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdMsg("⚠ New password and confirmation do not match."); return; }
    setPwdSaving(true);
    try {
      await updateHcaProfile(hcaProfile.id, { password: pwdForm.next });
      setHcaProfile(p => ({ ...p, password: pwdForm.next }));
      setPwdForm({ current:"", next:"", confirm:"" });
      setPwdMsg("✓ Password changed successfully.");
    } catch (e) { setPwdMsg("⚠ " + (e.message || "Failed to change password.")); }
    setPwdSaving(false);
  }

  async function handleEnrol(course) {
    if (!hcaProfile?.id) return;
    setEnrolling(course.id);
    try {
      await enrollInCourse(hcaProfile.id, 'hca', course.id);
      setEnrollments(await getEnrollmentsForUser(hcaProfile.id, 'hca'));
    } catch (e) { alert(e.message || "Could not enrol. Please try again."); }
    setEnrolling(null);
  }

  async function handleRequestTraining() {
    const topic = prompt("What training topic would you like E-Vive to offer? (e.g. Wound care, Dementia refresher)");
    if (!topic) return;
    try {
      await createHcaRequest({
        hcaId: hcaProfile?.id, hcaName: hcaProfile?.name, hcaEmail: hcaProfile?.email,
        origin: 'hca_training_request', subject: `Training request from ${hcaProfile?.name || hcaId}`,
        message: topic,
      });
      alert("✓ Request sent to the E-Vive training team.");
    } catch (e) { alert(e.message || "Could not send request. Please try again."); }
  }

  async function handleWelfareOption(origin, subject, promptLabel) {
    const details = prompt(promptLabel);
    if (details === null) return;
    try {
      await createHcaRequest({
        hcaId: hcaProfile?.id, hcaName: hcaProfile?.name, hcaEmail: hcaProfile?.email,
        origin, subject: `${subject} — ${hcaProfile?.name || hcaId}`,
        message: details || "(no additional details provided)",
      });
      alert("✓ Submitted confidentially to the E-Vive welfare team.");
    } catch (e) { alert(e.message || "Could not submit. Please try again."); }
  }

  async function handleSubmitOffDay() {
    setOffDayMsg("");
    if (!offDay.from || !offDay.to) { setOffDayMsg("⚠ Please select both dates."); return; }
    setOffDaySaving(true);
    try {
      await createHcaRequest({
        hcaId: hcaProfile?.id, hcaName: hcaProfile?.name, hcaEmail: hcaProfile?.email,
        origin: 'hca_off_day_request',
        subject: `Off-day request from ${hcaProfile?.name || hcaId}`,
        message: `From: ${offDay.from}\nTo: ${offDay.to}\nReason: ${offDay.reason || "—"}`,
        metadata: { fromDate: offDay.from, toDate: offDay.to, reason: offDay.reason || "" },
      });
      setOffDay({ from:"", to:"", reason:"" });
      setOffDayMsg("✓ Off-day request submitted. Your coordinator will confirm shortly.");
    } catch (e) { setOffDayMsg("⚠ " + (e.message || "Could not submit request.")); }
    setOffDaySaving(false);
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

      {/* Mobile overlay */}
      {mobileMenuOpen && <div className="dash-side-overlay open" onClick={()=>setMobileMenuOpen(false)} />}

      <div className="dash-wrap">
        {/* ── SIDEBAR ── */}
        <aside className={`dash-side${mobileMenuOpen?" open":""}`}>
          <div className="dash-logo" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <Link href="/" style={{textDecoration:"none"}}>
              <div className="dash-logo-text">e<span>-</span>vive</div>
              <div className="dash-logo-sub">HCA Portal</div>
            </Link>
            <button onClick={()=>setMobileMenuOpen(false)} style={{display:"none",background:"none",border:"none",cursor:"pointer",fontSize:20,color:"var(--muted)",lineHeight:1,padding:"4px"}} className="sidebar-close">✕</button>
          </div>
          <div className="dash-user">
            <div className="dash-avatar">🩺</div>
            <div>
              <div className="dash-user-name">{hcaProfile?.name || hcaId || "HCA Staff"}</div>
              <div className="dash-user-role">{hcaProfile?.certLevel || "HCA"} · {hcaProfile?.employeeId || hcaId || "HCA Portal"}</div>
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
              <button key={n.key} className={`dash-nav-item${tab===n.key?" active sky":""}`}
                onClick={()=>{setTab(n.key);setMobileMenuOpen(false);}}
                style={{width:"100%",textAlign:"left",background:"none",border:"none",cursor:"pointer",color:"inherit",font:"inherit"}}>
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
            <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0,flex:1}}>
              {/* Hamburger — mobile only */}
              <button className="dash-hamburger" onClick={()=>setMobileMenuOpen(o=>!o)} aria-label="Open menu">☰</button>
              <div style={{minWidth:0}}>
                <div className="dash-title" style={{color:"var(--sky)"}}>Welcome, <span>{hcaProfile?.name?.split(" ")[0] || hcaId || "HCA"}</span></div>
                <div style={{fontSize:12,color:"var(--muted)",marginTop:3,fontFamily:"var(--mono)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                </div>
              </div>
            </div>
            <div className="dash-actions" style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <div style={{fontFamily:"var(--mono)",fontSize:14,color:"var(--mint)",background:"rgba(0,74,153,0.1)",border:"1px solid rgba(0,74,153,0.22)",padding:"6px 14px",borderRadius:8}}>{time}</div>
              {/* Mobile sign-out */}
              <button className="topbar-logout" onClick={logout} title="Sign out">🔒 Sign Out</button>
            </div>
          </div>

          <div className="dash-content">

            {/* ── TODAY ── */}
            {(tab==="today"||tab==="cardex") && (
              <>
                {tab==="today" && hcaProfile && (
                  <div className="journey-bar">
                    <div className="jb-title">Your HCA Journey — {HCA_JOURNEY_LABELS[hcaProfile.journeyStage] || hcaProfile.journeyStage}</div>
                    <div className="jb-steps">
                      {HCA_JOURNEY_STAGES.map((stage,i)=>{
                        const currentIdx = HCA_JOURNEY_STAGES.indexOf(hcaProfile.journeyStage);
                        const status = i < currentIdx ? "done" : i === currentIdx ? "current" : "pending";
                        const ui = HCA_JOURNEY_UI[stage];
                        return (
                          <div key={stage} style={{display:"contents"}}>
                            <div className="jb-step">
                              <div className={`jb-dot ${status}`}>{status==="done"?"✓":ui.icon}</div>
                              <div className={`jb-lbl ${status}`} style={{whiteSpace:"pre-line"}}>{ui.lbl}</div>
                              {hcaProfile.journeyDates?.[stage] && (
                                <div style={{fontSize:9,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{new Date(hcaProfile.journeyDates[stage]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>
                              )}
                            </div>
                            {i < HCA_JOURNEY_STAGES.length-1 && (
                              <div className={`jb-conn ${i<currentIdx?"done":"pending"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clock-In Panel */}
                <div className={`clockin-panel${clockState==="in"?" clocked":clockState==="submitted"?" clocked-out":""}`}>
                  <div className="clock-top">
                    <div>
                      <div className={`clock-time${clockState==="in"?" blue":""}`}>{time}</div>
                      <div className="clock-meta">{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · Nairobi, Kenya</div>
                    </div>
                    {clockState==="in" && (
                      <div className="gps-badge">
                        <div className="gps-dot" />
                        {gpsLabel ? `GPS Verified · ${gpsLabel}` : "GPS Captured"}
                      </div>
                    )}
                    {gpsLoading && (
                      <div className="gps-badge" style={{borderColor:"rgba(232,213,168,0.3)",color:"var(--amber)"}}>
                        <div className="gps-dot" style={{background:"var(--amber)"}} />Capturing GPS…
                      </div>
                    )}
                  </div>

                  {/* Patient banner */}
                  <div className="patient-banner">
                    <div className="pat-av">{patient ? "👩🏼" : "👤"}</div>
                    <div style={{flex:1}}>
                      <div className="pat-name">{patient?.name || assignedClient?.name || "No patient assigned"}</div>
                      <div className="pat-meta">
                        {patient?.conditions ? `${patient.conditions} · ` : ""}
                        {assignedClient?.location || "Location not set"}
                      </div>
                    </div>
                    <span className={`badge ${patient ? "badge-gold" : "badge-dim"}`}>
                      {patient ? "Active Placement" : "No Active Placement"}
                    </span>
                  </div>

                  {clockState==="in" && (
                    <div className="shift-timer" style={{marginBottom:16}}>
                      ⏱️ Shift Duration: <strong style={{fontSize:16}}>{duration}</strong>
                      {clockStart && (
                        <span style={{marginLeft:"auto",fontSize:11,color:"rgba(56,189,248,0.5)"}}>
                          Clocked in at {new Date(clockStart).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})}
                        </span>
                      )}
                    </div>
                  )}

                  {gpsErr && (
                    <div style={{background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.25)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--coral)",marginBottom:12,lineHeight:1.55}}>
                      ⚠ {gpsErr}
                    </div>
                  )}

                  <div className="clockin-btns">
                    {clockState==="out" && (
                      <button className="btn-sky" style={{fontSize:15,padding:"12px 28px"}} onClick={clockIn} disabled={gpsLoading}>
                        📍 {gpsLoading ? "Capturing GPS…" : "Clock In — GPS Location Confirm"}
                      </button>
                    )}
                    {clockState==="in" && (
                      <>
                        <button className="btn-sky" onClick={()=>setTab("cardex")}>📋 Open Cardex →</button>
                        <button className="btn-o" onClick={saveDraft}>💾 Save Draft</button>
                        <button
                          className="btn-p"
                          onClick={submitCardex}
                          disabled={!shiftComplete}
                          title={!shiftComplete ? `${shiftRemainingH}h ${shiftRemainingM}m remaining` : ""}
                          style={{background:shiftComplete?"linear-gradient(135deg,var(--jade),var(--emerald))":"rgba(0,74,153,0.3)",opacity:shiftComplete?1:0.6,cursor:shiftComplete?"pointer":"not-allowed"}}
                        >
                          ✅ Submit Cardex &amp; Clock Out
                        </button>
                      </>
                    )}
                    {clockState==="submitted" && (
                      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                        <div style={{fontSize:14,color:"var(--mint)",fontWeight:600}}>✅ Cardex submitted. Awaiting handover with next HCA.</div>
                        <button className="btn-o" onClick={clockOut}>🚪 Complete Clock-Out</button>
                      </div>
                    )}
                  </div>

                  {clockState==="in" && !shiftComplete && clockStart && (
                    <div style={{marginTop:12,fontSize:12,color:"var(--amber)",lineHeight:1.6,background:"rgba(240,169,139,0.07)",border:"1px solid rgba(240,169,139,0.2)",borderRadius:8,padding:"8px 12px"}}>
                      ⏱ <strong>{shiftRemainingH}h {shiftRemainingM}m</strong> remaining before you can submit. Full 12-hour shift must be completed.
                    </div>
                  )}

                  {clockState==="out" && (
                    <div style={{marginTop:14,fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                      📍 You must be <strong style={{color:"var(--amber)"}}>within 10 m</strong> of the client&apos;s address to clock in and clock out. GPS location is verified automatically. Shift starts <strong style={{color:"var(--text)"}}>07:00</strong>.
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="stat-grid">
                  {[
                    {icon:"📋",lbl:"Shifts This Month", val:String(thisMonthShifts.length),                                        color:"mint" },
                    {icon:"⭐",lbl:"Current Rating",    val:ratingDisplay,                                                         color:"amber"},
                    {icon:"⏱️",lbl:"Shifts Completed",  val:String(completedShifts.length),                                       color:"sky"  },
                    {icon:"💳",lbl:"Earnings MTD",      val:earningsMTD>0?`KES ${earningsMTD.toLocaleString()}`:"—",               color:"mint" },
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
                      <div className="panel-head"><div className="panel-title">Recent Shifts</div></div>
                      <div className="panel-body">
                        {liveShifts.length === 0 ? (
                          <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13}}>No shifts on record yet. Your schedule will appear here once a placement is confirmed.</div>
                        ) : liveShifts.slice().sort((a,b)=>new Date(b.date||b.clockIn||0)-new Date(a.date||a.clockIn||0)).slice(0,7).map(s=>{
                          const typeLabel = s.type==="day"?"Day Shift":s.type==="night"?"Night Shift":"Live-In";
                          const [stLabel,stCls] = s.status==="completed"?["Completed","badge-mint"]:s.status==="in-progress"?["In Progress","badge-gold"]:s.status==="missed"?["Missed","badge-coral"]:s.status==="cancelled"?["Cancelled","badge-coral"]:["Scheduled","badge-dim"];
                          const dur = s.clockIn&&s.clockOut?`${Math.round((new Date(s.clockOut)-new Date(s.clockIn))/3600000)}h`:s.status==="in-progress"?"Active":"—";
                          const dateDisplay = s.date?new Date(s.date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}):"—";
                          const shiftCardex = cardexLog.find(c => c.shiftId === s.id);
                          return (
                            <div key={s.id} className="shift-hist-row">
                              <div className="shr-date">{dateDisplay}</div>
                              <div className="shr-pat">{patientNameForShift(s)||"—"}</div>
                              <div className="shr-type">{typeLabel}</div>
                              <div className="shr-dur">{dur}</div>
                              <span className={`badge ${stCls}`}>{stLabel}</span>
                              {s.status==="completed"&&shiftCardex&&<button className="btn-o btn-sm" onClick={()=>setViewCardex(shiftCardex)}>View Cardex</button>}
                            </div>
                          );
                        })}
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
                    <div className="cardex-title">Shift Cardex — {patient?.name || "Patient"}</div>
                    <div className="cardex-meta">{patient?.id?.slice(0,8).toUpperCase() || "—"} · {new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"})} · HCA: {hcaProfile?.name || hcaId}</div>
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
                    <span style={{color:"var(--muted)",marginLeft:8}}>{patient?.conditions||"No conditions recorded"}{patient?.notes?` · ${patient.notes}`:""}</span>
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
                    {specialNeeds.length === 0 && <div style={{fontSize:13,color:"var(--muted)",padding:"8px 0"}}>No special needs on record for this patient.</div>}
                    {specialNeeds.map((need,i)=>(
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

            {/* ── MY PROFILE ── */}
            {tab==="profile" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,alignItems:"start"}}>
                <div style={{display:"flex",flexDirection:"column",gap:18}}>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Profile Details</div></div>
                  <div className="panel-body">
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,paddingBottom:16,borderBottom:"1px solid rgba(0,74,153,0.08)"}}>
                      {hcaProfile?.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hcaProfile.photo} alt={hcaProfile.name} style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(0,74,153,0.2)",flexShrink:0}} />
                      ) : (
                        <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(0,74,153,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{(hcaProfile?.name||"?")[0]}</div>
                      )}
                      <div>
                        <div style={{fontWeight:700,fontSize:15}}>{hcaProfile?.name || hcaId || "—"}</div>
                        <div style={{fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)"}}>{hcaProfile?.employeeId || "—"}</div>
                      </div>
                    </div>
                    {[
                      ["Age",          ageFromDob(hcaProfile?.dob) ? `${ageFromDob(hcaProfile.dob)} years` : (hcaProfile?.ageRange || "—")],
                      ["Email",        hcaProfile?.email || "—"],
                      ["Mobile",       hcaProfile?.mobile || "—"],
                      ["Gender",       hcaProfile?.gender || "—"],
                      ["Education",    hcaProfile?.education || "—"],
                      ["Certificate",  hcaProfile?.certLevel || "—"],
                      ["Experience",   hcaProfile?.yearsExp ? `${hcaProfile.yearsExp} years` : "—"],
                      ["Smartphone",   hcaProfile?.smartphone || "—"],
                      ["Specialisations", (hcaProfile?.specialisations||[]).join(", ")||"General HCA"],
                      ...(hcaProfile?.culturalExp ? [["Cultural Experience", hcaProfile.culturalExp]] : []),
                      ["Home Location", hcaProfile?.location || "—"],
                      ["GPS Coordinates", (hcaProfile?.lat && hcaProfile?.lng) ? `${Number(hcaProfile.lat).toFixed(5)}, ${Number(hcaProfile.lng).toFixed(5)}` : "—"],
                      ["Status",       hcaProfile?.status || "Active"],
                    ].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(0,74,153,0.08)",gap:12}}>
                        <span style={{fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)",flexShrink:0}}>{l}</span>
                        <span style={{fontSize:13,fontWeight:600,maxWidth:220,textAlign:"right",wordBreak:"break-word"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Certificates</div></div>
                  <div className="panel-body">
                    {(hcaProfile?.certifications||[]).length===0 ? (
                      <div style={{fontSize:13,color:"var(--muted)"}}>No certificates on record.</div>
                    ) : hcaProfile.certifications.map((c,i)=>{
                      const isImage = c.fileType?.startsWith("image/");
                      return (
                        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<hcaProfile.certifications.length-1?"1px solid rgba(0,74,153,0.08)":"none"}}>
                          {c.fileDataUrl && isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.fileDataUrl} alt={c.name} style={{width:44,height:44,borderRadius:8,objectFit:"cover",border:"1px solid rgba(0,74,153,0.15)",flexShrink:0}} />
                          ) : (
                            <div style={{width:44,height:44,borderRadius:8,background:"rgba(0,74,153,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📄</div>
                          )}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:13}}>{c.name || "Certificate"}</div>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)"}}>{c.issuer||"—"}{c.year?` · ${c.year}`:""}</div>
                          </div>
                          {c.fileDataUrl && <a href={c.fileDataUrl} target="_blank" rel="noreferrer" className="btn-o btn-sm" style={{flexShrink:0}}>View</a>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:18}}>
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">Contact E-Vive</div></div>
                    <div className="panel-body">
                      {[["📧 Email","hello@e-vive.co.ke","mailto:hello@e-vive.co.ke"],["📞 Phone","+254 141 888 340","tel:+254141888340"]].map(([lbl,val,href])=>(
                        <div key={lbl} style={{background:"rgba(0,74,153,0.03)",border:"1px solid rgba(0,74,153,0.1)",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                          <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginBottom:3}}>{lbl}</div>
                          <a href={href} style={{fontSize:13,fontWeight:600,color:"var(--jade)",textDecoration:"none"}}>{val}</a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="panel">
                    <div className="panel-head"><div className="panel-title">🔒 Change Password</div></div>
                    <div className="panel-body">
                      <div style={{marginBottom:10}}>
                        <label style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",display:"block",marginBottom:4}}>Current Password</label>
                        <input type="password" value={pwdForm.current} onChange={e=>setPwdForm(p=>({...p,current:e.target.value}))} style={{width:"100%",background:"rgba(0,74,153,0.04)",border:"1px solid rgba(0,74,153,0.15)",borderRadius:8,padding:"9px 12px",fontSize:13,color:"var(--text)"}} />
                      </div>
                      <div style={{marginBottom:10}}>
                        <label style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",display:"block",marginBottom:4}}>New Password</label>
                        <input type="password" value={pwdForm.next} onChange={e=>setPwdForm(p=>({...p,next:e.target.value}))} style={{width:"100%",background:"rgba(0,74,153,0.04)",border:"1px solid rgba(0,74,153,0.15)",borderRadius:8,padding:"9px 12px",fontSize:13,color:"var(--text)"}} />
                      </div>
                      <div style={{marginBottom:14}}>
                        <label style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",display:"block",marginBottom:4}}>Confirm New Password</label>
                        <input type="password" value={pwdForm.confirm} onChange={e=>setPwdForm(p=>({...p,confirm:e.target.value}))} style={{width:"100%",background:"rgba(0,74,153,0.04)",border:"1px solid rgba(0,74,153,0.15)",borderRadius:8,padding:"9px 12px",fontSize:13,color:"var(--text)"}} />
                      </div>
                      {pwdMsg && <div style={{fontSize:12,marginBottom:10,color:pwdMsg.startsWith("✓")?"var(--mint)":"var(--coral)"}}>{pwdMsg}</div>}
                      <button className="btn-p btn-sm" onClick={handleChangePassword} disabled={pwdSaving}>{pwdSaving?"Saving…":"Update Password"}</button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="panel" style={{border:"1px solid rgba(249,112,102,0.2)"}}>
                    <div className="panel-head" style={{borderBottom:"1px solid rgba(249,112,102,0.12)"}}>
                      <div className="panel-title" style={{color:"var(--coral)"}}>⚠️ Danger Zone</div>
                    </div>
                    <div className="panel-body">
                      <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.6}}>
                        Request to have your HCA profile and account removed from the E-Vive platform. Our team will contact you before any data is deleted.
                      </p>
                      {deletionSubmitted || hcaProfile?.deletionRequested ? (
                        <div style={{background:"rgba(249,112,102,0.07)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:10,padding:"12px 14px",fontSize:13,color:"var(--coral)"}}>
                          ✓ Deletion request received. Our team will contact you within 2 business days.
                        </div>
                      ) : showDeleteConfirm ? (
                        <div style={{background:"rgba(249,112,102,0.07)",border:"1px solid rgba(249,112,102,0.2)",borderRadius:12,padding:"16px"}}>
                          <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"var(--coral)"}}>Are you sure?</div>
                          <p style={{fontSize:13,color:"var(--muted)",marginBottom:14,lineHeight:1.6}}>This will submit a deletion request to E-Vive. Any active placements will need to be concluded first.</p>
                          <div style={{display:"flex",gap:10}}>
                            <button className="btn-danger" onClick={handleDeleteRequest}>Yes, Request Deletion</button>
                            <button className="btn-o btn-sm" onClick={()=>setShowDeleteConfirm(false)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-danger" onClick={()=>setShowDeleteConfirm(true)}>
                          🗑 Request Profile Deletion
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CALENDAR ── */}
            {tab==="calendar" && (
              <>
                {offDays.length > 0 && (
                  <div className="panel" style={{marginBottom:16}}>
                    <div className="panel-head"><div className="panel-title">✅ Approved Off-Days</div></div>
                    <div className="panel-body" style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {offDays.map(e=>(
                        <span key={e.id} className="badge badge-mint">{new Date(e.date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="panel">
                <div className="panel-head"><div className="panel-title">My Schedule</div></div>
                <div className="panel-body">
                  {liveShifts.length === 0 ? (
                    <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>
                      <div style={{fontSize:40,marginBottom:12}}>📅</div>
                      <div style={{fontSize:13}}>No shifts scheduled yet. Your schedule will appear here once a placement is confirmed.</div>
                    </div>
                  ) : (
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Date</th><th>Client</th><th>Type</th><th>Status</th></tr></thead>
                        <tbody>
                          {liveShifts.map(s=>(
                            <tr key={s.id}>
                              <td style={{fontFamily:"var(--mono)",fontSize:12}}>{s.date}</td>
                              <td>{clientNameById(s.clientId)||"—"}</td>
                              <td><span className="badge badge-gold">{s.type}</span></td>
                              <td><span className={`badge ${s.status==="completed"?"badge-mint":(s.status==="missed"||s.status==="cancelled")?"badge-coral":"badge-dim"}`}>{s.status}</span></td>
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

            {/* ── TRAINING ── */}
            {tab==="training" && (
              <div>
                <div style={{marginBottom:20,fontWeight:700,fontSize:16}}>Training & Development</div>
                <div className="stat-grid">
                  {(()=>{
                    const completed = enrollments.filter(e=>e.progress_pct===100).length;
                    const avgProgress = enrollments.length ? Math.round(enrollments.reduce((s,e)=>s+(e.progress_pct||0),0)/enrollments.length) : 0;
                    return [
                      {icon:"🎓",lbl:"Modules Completed",val:String(completed),color:"mint"},
                      {icon:"📚",lbl:"Modules Available",val:String(courses.length),color:"amber"},
                      {icon:"📝",lbl:"Enrolled",val:String(enrollments.length),color:"sky"},
                      {icon:"📊",lbl:"Avg. Progress",val:enrollments.length?`${avgProgress}%`:"—",color:"sky"},
                    ];
                  })().map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Available Training Modules</div><button className="btn-p btn-sm" onClick={handleRequestTraining}>Request Training</button></div>
                  <div className="panel-body">
                    {courses.length===0 ? (
                      <div style={{textAlign:"center",padding:"32px 0",color:"var(--muted)",fontSize:13}}>No training modules published yet. Use &quot;Request Training&quot; to suggest a topic to the E-Vive training team.</div>
                    ) : courses.map((c,i)=>{
                      const enr = enrollments.find(e=>e.course_id===c.id);
                      const status = enr ? (enr.progress_pct===100?"Completed":"Enrolled") : "Available";
                      return (
                        <div key={c.id} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:i<courses.length-1?"1px solid rgba(0,74,153,0.1)":"none"}}>
                          <span style={{fontSize:24}}>{c.cover_emoji||"📚"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:13}}>{c.title}</div>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"var(--mono)",marginTop:2}}>{c.category||"General"} · {c.difficulty||"Beginner"} · {c.duration_mins||60} min{enr&&enr.progress_pct>0&&enr.progress_pct<100?` · ${enr.progress_pct}% complete`:""}</div>
                          </div>
                          <span className={`badge ${status==="Completed"?"badge-mint":status==="Enrolled"?"badge-gold":"badge-dim"}`}>{status}</span>
                          {status==="Available" && <button className="btn-p btn-sm" disabled={enrolling===c.id} onClick={()=>handleEnrol(c)}>{enrolling===c.id?"Enrolling…":"Enrol"}</button>}
                        </div>
                      );
                    })}
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
                    {icon:"💬",title:"Request Counselling",sub:"Book a confidential session with a welfare counsellor",origin:"hca_welfare_counselling",prompt:"Briefly share what you'd like to discuss (optional — a counsellor will reach out to schedule):"},
                    {icon:"🆘",title:"Report a Safety Concern",sub:"Report unsafe working conditions or misconduct",origin:"hca_welfare_safety",prompt:"Describe the safety concern or misconduct you'd like to report:"},
                    {icon:"📅",title:"Request Time Off",sub:"Submit an off-day request (48hrs notice required)",scrollTo:"offday-panel"},
                    {icon:"📝",title:"Submit Welfare Note",sub:"Share feedback about your working conditions",origin:"hca_welfare_note",prompt:"Share your feedback about your working conditions:"},
                  ].map(w=>(
                    <div key={w.title} className="welfare-opt" onClick={()=>{
                      if (w.scrollTo) { document.getElementById(w.scrollTo)?.scrollIntoView({behavior:"smooth",block:"center"}); return; }
                      handleWelfareOption(w.origin, w.title, w.prompt);
                    }}>
                      <div className="welfare-opt-icon">{w.icon}</div>
                      <div className="welfare-opt-title">{w.title}</div>
                      <div className="welfare-opt-sub">{w.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="panel" id="offday-panel">
                  <div className="panel-head"><div className="panel-title">Off-Day Requests</div></div>
                  <div className="panel-body">
                    <p style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>You must give <strong style={{color:"var(--text)"}}>48 hours notice</strong> for off-day requests when placed with a client.</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:12,marginBottom:14}}>
                      <div><div className="dash-label">From Date</div><input type="date" className="dash-input" value={offDay.from} onChange={e=>setOffDay(p=>({...p,from:e.target.value}))} /></div>
                      <div><div className="dash-label">To Date</div><input type="date" className="dash-input" value={offDay.to} onChange={e=>setOffDay(p=>({...p,to:e.target.value}))} /></div>
                      <div><div className="dash-label">Reason</div><input className="dash-input" placeholder="e.g. Medical appointment" value={offDay.reason} onChange={e=>setOffDay(p=>({...p,reason:e.target.value}))} /></div>
                    </div>
                    {offDayMsg && <div style={{fontSize:12,marginBottom:10,color:offDayMsg.startsWith("✓")?"var(--mint)":"var(--coral)"}}>{offDayMsg}</div>}
                    <button className="btn-sky" disabled={offDaySaving} onClick={handleSubmitOffDay}>{offDaySaving?"Submitting…":"Submit Off-Day Request"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── EARNINGS ── */}
            {tab==="earnings" && (
              <div>
                <div className="stat-grid">
                  {[
                    {icon:"💰",lbl:"Total Earned MTD",  val:earningsMTD>0?`KES ${earningsMTD.toLocaleString()}`:"—",              color:"mint" },
                    {icon:"📅",lbl:"Next Payment",       val:"15th of month",                                                      color:"amber"},
                    {icon:"📋",lbl:"Shifts Completed",   val:String(completedShifts.length),                                      color:"sky"  },
                    {icon:"💵",lbl:"Rate per Shift",     val:hcaRate?`KES ${hcaRate.toLocaleString()}`:"—",                        color:"mint" },
                  ].map(s=>(
                    <div className="stat-box" key={s.lbl}><div className="stat-box-icon">{s.icon}</div><div className={`stat-box-val ${s.color}`}>{s.val}</div><div className="stat-box-label">{s.lbl}</div></div>
                  ))}
                </div>
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Shift Payment Record</div></div>
                  <div className="panel-body">
                    <div className="dash-table-wrap">
                      <table className="dash-table">
                        <thead><tr><th>Date</th><th>Type</th><th>Rate/Shift</th><th>Total</th><th>Status</th></tr></thead>
                        <tbody>
                          {liveShifts.filter(s=>s.status==="completed").length===0 ? (
                            <tr><td colSpan={5} style={{textAlign:"center",padding:"24px",color:"var(--muted)"}}>No completed shifts on record yet.</td></tr>
                          ) : liveShifts.filter(s=>s.status==="completed").slice().reverse().map(s=>(
                            <tr key={s.id}>
                              <td style={{fontFamily:"var(--mono)",fontSize:12}}>{s.date?new Date(s.date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—"}</td>
                              <td>{s.type==="day"?"Day (8h)":s.type==="night"?"Night (12h)":"Live-In"}</td>
                              <td style={{color:"var(--amber)"}}>KES {hcaRate.toLocaleString()}</td>
                              <td style={{fontFamily:"var(--serif)",fontSize:16,fontWeight:700,color:"var(--mint)"}}>KES {hcaRate.toLocaleString()}</td>
                              <td><span className="badge badge-mint">Completed</span></td>
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

      {viewCardex && (
        <div className="cx-view-bg" onClick={e => e.target === e.currentTarget && setViewCardex(null)}>
          <div className="cx-view-box">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div style={{fontFamily:"var(--serif)",fontSize:18,fontWeight:700}}>
                Cardex — {viewCardex.date?new Date(viewCardex.date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric"}):"—"}
              </div>
              <button className="btn-o btn-sm" onClick={()=>setViewCardex(null)}>✕ Close</button>
            </div>
            <CardexView
              entry={viewCardex}
              audience="hca"
              patientName={patientNameForShift({ clientId: viewCardex.clientId, patientId: viewCardex.patientId })}
            />
          </div>
        </div>
      )}
    </>
  );
}
