import { useState } from "react";
import { DATA_TYPES } from "../lib/cardexSummary";

const RELATIONSHIPS = [
  { value: "treating_doctor", label: "Treating doctor" },
  { value: "specialist",      label: "Specialist" },
  { value: "family",          label: "Family member" },
  { value: "other",           label: "Other" },
];

const blankRecipient = () => ({ fullName: "", email: "", relationship: "treating_doctor", relationshipOther: "", justification: "" });

/**
 * Share a care summary outward.
 *
 * The justification per recipient is not decoration — it is the record of the
 * lawful basis for the disclosure, it makes the client pause over who is on
 * the list, and it is what E-Vive produces if the disclosure is questioned.
 * The server enforces its minimum length independently of this form.
 */
export default function ShareReportModal({ context, settings, onClose, onShared }) {
  const s = settings || {};
  const [types, setTypes]         = useState(context?.types?.length ? context.types : ["vitals", "incidents"]);
  const [includeHandover, setIncludeHandover] = useState(false);
  const [recipients, setRecipients] = useState([blankRecipient()]);
  const [expiryDays, setExpiryDays] = useState(s.shareDefaultExpiryDays || 7);
  const [consent, setConsent]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");
  const [issued, setIssued]       = useState(null);

  const minJust = s.shareMinJustificationLen ?? 20;
  const maxRec  = s.shareMaxRecipients ?? 5;

  const upd = (i, k, v) => setRecipients(rs => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));

  async function submit() {
    setMsg(""); setSaving(true);
    try {
      const res = await fetch("/api/cardex/share", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: context?.patientId || null,
          rangeStart: context?.range?.start, rangeEnd: context?.range?.end,
          dataTypes: types, includeHandover, recipients,
          consentAgreed: consent, expiryDays: Number(expiryDays),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg("⚠ " + (json.error || "Could not create the share.")); setSaving(false); return; }
      setIssued(json);
      onShared?.();
    } catch (e) { setMsg("⚠ " + (e.message || "Could not create the share.")); }
    setSaving(false);
  }

  if (issued) {
    const withCodes = issued.recipients.filter(r => r.accessCode);
    return (
      <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box" style={{ maxWidth: 520 }}>
          <div className="modal-title">✅ Summary shared</div>
          <div style={{ fontSize: 13, color: "#5A7080", lineHeight: 1.7, marginBottom: 14 }}>
            Each recipient has been emailed a private link. The link expires on{" "}
            <strong>{new Date(issued.expiresAt).toLocaleDateString("en-GB")}</strong> and you can withdraw it at any time
            from your sharing history.
          </div>
          {withCodes.length > 0 && (
            <div style={{ background: "rgba(200,149,42,0.1)", border: "1px solid rgba(200,149,42,0.3)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🔑 Give each person their access code</div>
              <div style={{ fontSize: 12, color: "#5A7080", marginBottom: 10, lineHeight: 1.6 }}>
                Pass these on by phone or in person — not by email. They are shown only once, so that a mistyped email address
                cannot disclose the record on its own.
              </div>
              {withCodes.map(r => (
                <div key={r.email} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", fontSize: 13 }}>
                  <span>{r.name}</span>
                  <strong style={{ fontFamily: "var(--mono)", letterSpacing: 2 }}>{r.accessCode}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="modal-actions"><button className="btn-p" onClick={onClose}>Done</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 620, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="modal-title">📤 Share a care summary</div>
        <div style={{ fontSize: 12, color: "#5A7080", marginBottom: 16, lineHeight: 1.6 }}>
          For <strong>{context?.patientName || "your patient"}</strong>, covering{" "}
          {context?.range?.start} → {context?.range?.end}.
        </div>

        <div className="modal-field">
          <label className="modal-label">What to include</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {DATA_TYPES.map(d => (
              <button key={d.key} type="button"
                onClick={() => setTypes(t => t.includes(d.key) ? t.filter(x => x !== d.key) : [...t, d.key])}
                style={{ padding: "4px 11px", borderRadius: 100, fontSize: 12, fontFamily: "var(--mono)", cursor: "pointer",
                  border: "1px solid rgba(0,74,153,0.25)",
                  background: types.includes(d.key) ? "rgba(0,74,153,0.12)" : "transparent",
                  color: types.includes(d.key) ? "var(--jade)" : "#5A7080" }}>{d.label}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#5A7080", marginTop: 8, lineHeight: 1.6 }}>
            Share the least that serves the purpose. Staff welfare notes and internal quality-assurance notes are never included,
            whatever you select here.
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={includeHandover} onChange={e => setIncludeHandover(e.target.checked)} />
            Also include handover notes written between assistants
          </label>
        </div>

        <div className="modal-field">
          <label className="modal-label">Link expires after</label>
          <select className="modal-sel" value={expiryDays} onChange={e => setExpiryDays(e.target.value)}>
            {[1, 3, 7, 14, 30].filter(d => d <= (s.shareMaxExpiryDays ?? 30)).map(d => (
              <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#5A7080", textTransform: "uppercase", letterSpacing: "0.05em", margin: "18px 0 8px" }}>
          Recipients ({recipients.length}/{maxRec})
        </div>
        {recipients.map((r, i) => (
          <div key={i} style={{ border: "1px solid rgba(0,74,153,0.14)", borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">Full name *</label>
                <input className="modal-input" value={r.fullName} onChange={e => upd(i, "fullName", e.target.value)} />
              </div>
              <div className="modal-field" style={{ margin: 0 }}>
                <label className="modal-label">Email *</label>
                <input className="modal-input" type="email" value={r.email} onChange={e => upd(i, "email", e.target.value)} />
              </div>
            </div>
            <div className="modal-field">
              <label className="modal-label">Relationship to the patient *</label>
              <select className="modal-sel" value={r.relationship} onChange={e => upd(i, "relationship", e.target.value)}>
                {RELATIONSHIPS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </div>
            {r.relationship === "other" && (
              <div className="modal-field">
                <label className="modal-label">Describe the relationship *</label>
                <input className="modal-input" value={r.relationshipOther} onChange={e => upd(i, "relationshipOther", e.target.value)} />
              </div>
            )}
            <div className="modal-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Why should this person receive it? *</label>
              <textarea className="modal-input" rows={2} style={{ resize: "vertical" }} value={r.justification}
                onChange={e => upd(i, "justification", e.target.value)}
                placeholder="e.g. Dr Otieno is my mother's treating physician and is reviewing her blood pressure." />
              <div style={{ fontSize: 10, color: r.justification.trim().length >= minJust ? "var(--mint)" : "#5A7080", fontFamily: "var(--mono)", marginTop: 4 }}>
                {r.justification.trim().length}/{minJust} characters — kept as the record of why this was shared
              </div>
            </div>
            {recipients.length > 1 && (
              <button className="btn-o btn-sm" style={{ marginTop: 10, color: "var(--coral)" }}
                onClick={() => setRecipients(rs => rs.filter((_, j) => j !== i))}>Remove</button>
            )}
          </div>
        ))}
        {recipients.length < maxRec && (
          <button className="btn-o btn-sm" onClick={() => setRecipients(rs => [...rs, blankRecipient()])}>+ Add another recipient</button>
        )}

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 18, fontSize: 12, lineHeight: 1.6, cursor: "pointer" }}>
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
          <span>{s.consentStatement || "I confirm I have the authority to share this patient’s health information, and that each recipient has a legitimate reason to receive it."}</span>
        </label>

        {msg && <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, marginTop: 12, background: "rgba(249,112,102,0.08)", border: "1px solid rgba(249,112,102,0.25)", color: "var(--coral)" }}>{msg}</div>}

        <div className="modal-actions">
          <button className="btn-o btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-p btn-sm" onClick={submit} disabled={saving || !consent || types.length === 0}>
            {saving ? "Sharing…" : "Share Summary →"}
          </button>
        </div>
      </div>
    </div>
  );
}
