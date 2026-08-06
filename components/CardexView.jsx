import { redactCardexFor, formatBloodPressure, VITAL_FIELDS, CARDEX_STANDING_NOTE } from "../lib/cardexAccess";

/**
 * Renders one Cardex entry for a given audience.
 *
 * IMPORTANT: this component is a usability layer, not a security boundary.
 * It redacts what it is given, but a field that reached the browser has
 * already been disclosed. The caller is responsible for fetching only the
 * columns the audience may see (lib/cardexAccess.cardexColumnsFor).
 *
 * audience: 'admin' | 'hca' | 'client' | 'shared'
 */
export default function CardexView({ entry, audience = "admin", omit = [], hcaName, patientName, compact = false }) {
  const e = redactCardexFor(entry, audience, { omit });
  if (!e) return null;

  const muted = { fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 };
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: compact ? 14 : 18 }}>
      <div style={muted}>{title}</div>
      {children}
    </div>
  );

  const vitals = e.vitals || {};
  const shownVitals = VITAL_FIELDS
    .map(f => ({ ...f, value: f.key === "bp" ? formatBloodPressure(vitals) : vitals[f.key] }))
    .filter(f => f.value !== undefined && f.value !== null && f.value !== "");

  const meds        = e.medications || [];
  const intakes     = e.intakes || [];
  const nutrition   = e.nutrition || {};
  const hygiene     = e.hygiene || {};
  const mobility    = e.mobility || {};
  const elimination = e.elimination || {};
  const mental      = e.mentalState || {};
  const checks      = e.specialNeedsChecks || [];

  const ticked = (obj, labels) =>
    Object.entries(labels).filter(([k]) => obj[k]).map(([, l]) => l);
  const careDone = [
    ...ticked(hygiene,  { bath: "Bath/wash", oral: "Oral hygiene", reposition: "Repositioned 2-hrly", skin: "Skin inspection" }),
    ...ticked(mobility, { exercises: "Range-of-motion exercises", transfer: "Transfer assist", ambulation: "Ambulation" }),
  ];

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
      {(hcaName || patientName || e.submittedAt) && (
        <div style={{ background: "rgba(0,74,153,0.05)", border: "1px solid rgba(0,74,153,0.12)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12 }}>
          {patientName && <div><strong>Patient:</strong> {patientName}</div>}
          {hcaName && <div><strong>Assistant:</strong> {hcaName}</div>}
          {e.submittedAt && <div><strong>Submitted:</strong> {new Date(e.submittedAt).toLocaleString("en-GB")}</div>}
        </div>
      )}

      <Section title="🩺 Vital Signs">
        {shownVitals.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>None recorded.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
            {shownVitals.map(f => (
              <div key={f.key} style={{ background: "rgba(0,74,153,0.04)", border: "1px solid rgba(0,74,153,0.1)", borderRadius: 9, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>{f.label}</div>
                <div style={{ fontWeight: 700 }}>{f.value} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>{f.unit}</span></div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {meds.length > 0 && (
        <Section title="💊 Medications Administered">
          {meds.map((m, i) => (
            <div key={i} style={{ paddingBottom: 4 }}>
              {m.time ? `${m.time} — ` : ""}<strong>{m.drug || "—"}</strong>
              {m.dose ? ` ${m.dose}` : ""}{m.route ? ` (${m.route})` : ""}
              {m.notes ? <span style={{ color: "var(--muted)" }}> · {m.notes}</span> : null}
            </div>
          ))}
        </Section>
      )}

      {(intakes.length > 0 || Object.values(nutrition).some(Boolean)) && (
        <Section title="💧 Fluids & Nutrition">
          {Object.entries(nutrition).filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ textTransform: "capitalize" }}>{k}: <strong>{v}</strong></div>
          ))}
          {intakes.map((it, i) => (
            <div key={i}>{it.type || "Fluid"}: <strong>{it.amount}{it.unit}</strong></div>
          ))}
        </Section>
      )}

      {careDone.length > 0 && (
        <Section title="🛁 Personal Care & Mobility">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {careDone.map(l => <span key={l} className="badge badge-mint">✓ {l}</span>)}
          </div>
        </Section>
      )}

      {(elimination.urine || elimination.bowel || elimination.notes) && (
        <Section title="🚽 Elimination">
          <div>Urine: <strong>{elimination.urine || "—"}</strong> · Bowel: <strong>{elimination.bowel || "—"}</strong></div>
          {elimination.notes && <div style={{ color: "var(--muted)" }}>{elimination.notes}</div>}
        </Section>
      )}

      {(mental.orientation || mental.mood || mental.behaviour) && (
        <Section title="🧠 Mental & Behavioural">
          <div>Orientation: <strong>{mental.orientation || "—"}</strong> · Mood: <strong>{mental.mood || "—"}</strong> · Behaviour: <strong>{mental.behaviour || "—"}</strong></div>
        </Section>
      )}

      {checks.length > 0 && (
        <Section title="✅ Special Needs Checklist">
          {checks.map((c, i) => (
            <div key={i}>{c.done ? "✓" : c.flagged ? "🚩" : "○"} {c.need}</div>
          ))}
        </Section>
      )}

      {e.incidents && (
        <Section title="⚠️ Incidents & Observations">
          <div style={{ whiteSpace: "pre-wrap" }}>{e.incidents}</div>
        </Section>
      )}

      {e.handover && (
        <Section title="🤝 Handover Notes">
          <div style={{ whiteSpace: "pre-wrap" }}>{e.handover}</div>
        </Section>
      )}

      {/* Staff-confidential. redactCardexFor has already removed these for
          client/shared audiences — the guard below is belt-and-braces. */}
      {(audience === "admin" || audience === "hca") && (e.shiftRating > 0 || e.welfareNote) && (
        <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 10, background: "rgba(240,169,139,0.1)", border: "1px solid rgba(232,132,90,0.3)" }}>
          <div style={{ ...muted, color: "var(--gold)" }}>
            💙 Confidential — Staff Welfare
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
            {audience === "admin"
              ? "Not visible to the client, and never included in a shared report."
              : "Only you and the E-Vive welfare team can see this."}
          </div>
          {e.shiftRating > 0 && <div>Shift experience: <strong>{e.shiftRating}/5</strong></div>}
          {e.welfareNote && <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{e.welfareNote}</div>}
        </div>
      )}

      {audience === "admin" && (e.qaComments || []).length > 0 && (
        <Section title="📝 QA Comments">
          {e.qaComments.map((c, i) => (
            <div key={c.id || i} style={{ paddingBottom: 4 }}>
              <strong>{c.adminId}</strong>: {c.comment}{c.flagged ? " 🚩" : ""}
              <span style={{ float: "right", fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)" }}>
                {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
              </span>
            </div>
          ))}
        </Section>
      )}

      {(audience === "client" || audience === "shared") && (
        <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)", lineHeight: 1.6, borderTop: "1px solid rgba(0,74,153,0.1)", paddingTop: 10 }}>
          {CARDEX_STANDING_NOTE}
        </div>
      )}
    </div>
  );
}
