import { useState, useEffect } from "react";
import {
  DEFAULT_PLATFORM_SETTINGS, CONSENT_OWNER_OPTIONS, RETENTION_FIELDS, GEOFENCE_FIELDS,
} from "../lib/platformSettings";
import { ENFORCEMENT_OPTIONS } from "../lib/geofence";

/**
 * Admin → Settings: retention periods, consent ownership and sharing
 * defaults. These are policy decisions, so they belong to the business and
 * live in the database rather than in the source.
 *
 * Reads and writes /api/settings, which requires an admin session cookie.
 */
export default function PlatformSettingsPanel() {
  const [s, setS]           = useState(DEFAULT_PLATFORM_SETTINGS);
  const [loading, setLoad]  = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");
  const [purging, setPurge] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(async r => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.detail || j.error || "Could not load settings.");
        return j;
      })
      .then(j => setS(j.settings))
      .catch(e => setMsg("⚠ " + e.message))
      .finally(() => setLoad(false));
  }, []);

  const upd = (k, v) => setS(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.detail || j.error || "Save failed.");
      setS(j.settings);
      setMsg("✓ Settings saved.");
    } catch (e) { setMsg("⚠ " + e.message); }
    setSaving(false);
  }

  async function purgeNow() {
    if (!confirm("Delete data that is now past its retention period? This cannot be undone.")) return;
    setPurge(true); setMsg("");
    try {
      const res = await fetch("/api/settings", { method: "PUT" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.detail || j.error || "Purge failed.");
      const p = j.purged || {};
      setMsg(`✓ Purged ${p.deleted_tokens || 0} expired link(s), ${p.deleted_audit || 0} audit row(s), ${p.deleted_notifications || 0} notification(s).`);
    } catch (e) { setMsg("⚠ " + e.message); }
    setPurge(false);
  }

  if (loading) return <div style={{ padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>Loading settings…</div>;

  return (
    <>
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <div className="panel-title">🗄 Data Retention</div>
          <button className="btn-o btn-sm" disabled={purging} onClick={purgeNow}>{purging ? "Purging…" : "Run purge now"}</button>
        </div>
        <div className="panel-body">
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
            How long each kind of record is kept, in days. <strong>0 means keep indefinitely.</strong> Under the Kenyan Data
            Protection Act 2019 these periods should be decided deliberately and documented — they are not technical defaults.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {RETENTION_FIELDS.map(f => (
              <div key={f.key} className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">{f.label}</label>
                <input className="modal-input" type="number" min={0} value={s[f.key]}
                  onChange={e => upd(f.key, e.target.value)} />
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{f.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><div className="panel-title">📝 Consent</div></div>
        <div className="panel-body">
          <div className="modal-field">
            <label className="modal-label">Who may authorise sharing a patient&apos;s health data?</label>
            <select className="modal-sel" value={s.consentOwner} onChange={e => upd("consentOwner", e.target.value)}>
              {CONSENT_OWNER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
              {CONSENT_OWNER_OPTIONS.find(o => o.value === s.consentOwner)?.hint}
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">Consent statement shown before every share</label>
            <textarea className="modal-input" rows={3} style={{ resize: "vertical" }}
              value={s.consentStatement} onChange={e => upd("consentStatement", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><div className="panel-title">📤 Sharing Defaults</div></div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
            {[
              ["shareDefaultExpiryDays", "Default link expiry (days)", "Applied unless the client shortens it."],
              ["shareMaxExpiryDays",     "Maximum link expiry (days)", "The longest a client may choose."],
              ["shareMaxRecipients",     "Max recipients per share",   "A share to many addresses is not a clinical disclosure."],
              ["shareMaxPerHour",        "Max shares per client/hour", "Limits fan-out if an account is compromised."],
              ["shareMinJustificationLen","Min justification length",  "Characters required per recipient."],
            ].map(([k, label, hint]) => (
              <div key={k} className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">{label}</label>
                <input className="modal-input" type="number" min={0} value={s[k]} onChange={e => upd(k, e.target.value)} />
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{hint}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={s.shareRequireAccessCode} onChange={e => upd("shareRequireAccessCode", e.target.checked)} style={{ marginTop: 3 }} />
              <span>Require an access code — recipients must enter a short code the client passes on separately.
                <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>Recommended: a mistyped email address then cannot disclose a health record on its own.</span>
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={s.shareIncludeHandover} onChange={e => upd("shareIncludeHandover", e.target.checked)} style={{ marginTop: 3 }} />
              <span>Allow handover notes to be shared
                <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>Written assistant-to-assistant. Off keeps shares to the minimum; clients can still opt in per share when this is on.</span>
              </span>
            </label>
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(0,74,153,0.05)", border: "1px solid rgba(0,74,153,0.14)", borderRadius: 10, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            Staff welfare notes, shift ratings and internal QA notes are never shareable, under any of these settings.
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><div className="panel-title">📍 Attendance Geofence</div></div>
        <div className="panel-body">
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
            How close an HCA must be to the <strong>patient&apos;s</strong> care address to clock in or out.
            A patient with no pin of their own falls back to the client account&apos;s address — set each
            patient&apos;s pin on the <strong>Map</strong> so attendance is measured against the right house.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {GEOFENCE_FIELDS.map(f => (
              <div key={f.key} className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">{f.label}</label>
                <input className="modal-input" type="number" min={f.min} max={f.max} value={s[f.key]}
                  onChange={e => upd(f.key, e.target.value)} />
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{f.hint}</div>
              </div>
            ))}
          </div>
          <div className="modal-field" style={{ marginTop: 14 }}>
            <label className="modal-label">When an HCA is outside the fence</label>
            <select className="modal-sel" value={s.geofenceEnforcement} onChange={e => upd("geofenceEnforcement", e.target.value)}>
              {ENFORCEMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
              {ENFORCEMENT_OPTIONS.find(o => o.value === s.geofenceEnforcement)?.hint}
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, cursor: "pointer", marginTop: 12 }}>
            <input type="checkbox" checked={s.geofenceRequireReference}
              onChange={e => upd("geofenceRequireReference", e.target.checked)} style={{ marginTop: 3 }} />
            <span>Refuse clock-in when no address is pinned
              <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>
                Off: the HCA can still clock in and the gap is recorded. On: attendance is blocked until
                Admin pins the address — safer, but it will stop shifts at any site not yet on the map.
              </span>
            </span>
          </label>
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(0,74,153,0.05)", border: "1px solid rgba(0,74,153,0.14)", borderRadius: 10, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
            Every clock attempt that is not a clean fix inside the fence is recorded in
            <strong> attendance exceptions</strong>, whether it was allowed or refused — including the
            distance, the accuracy of the reading and which address it was measured against.
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12,
          background: msg.startsWith("✓") ? "rgba(0,74,153,0.08)" : "rgba(249,112,102,0.08)",
          border: msg.startsWith("✓") ? "1px solid rgba(0,74,153,0.2)" : "1px solid rgba(249,112,102,0.25)",
          color: msg.startsWith("✓") ? "var(--mint)" : "var(--coral)" }}>{msg}</div>
      )}
      <button className="btn-p" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Settings"}</button>
    </>
  );
}
