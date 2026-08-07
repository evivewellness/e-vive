import { useState, useEffect, useMemo, useCallback } from "react";
import CardexView from "./CardexView";
import TrendChart from "./TrendChart";
import {
  DATA_TYPES, NUMERIC_VITALS, RANGE_PRESETS, filterEntries, seriesFor,
  buildSummary, precedingPeriod, fmtValue, typicalRangeNote,
} from "../lib/cardexSummary";
import { todayIso, addDays } from "../lib/scheduling";

/**
 * "Care Reports" — the family-facing view of Cardex data.
 *
 * Called "Care Reports", not "Cardex": the clinical term means nothing to a
 * family and makes the feature feel like it is not for them.
 *
 * All data arrives from /api/cardex/reports, which derives the client id from
 * a signed session cookie and never selects the staff-confidential or QA
 * columns. Nothing here can widen that.
 *
 * Clinical safety (see also lib/cardexSummary): nothing grades, scores or
 * interprets. Out-of-range values get neutral wording and a prompt to speak
 * to a doctor — never "high", "abnormal" or a colour-coded warning.
 */
export default function CareReports({ onShare }) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [entries, setEntries]   = useState([]);
  const [patients, setPatients] = useState([]);
  const [hcaNames, setHcaNames] = useState({});

  const [patientId, setPatientId]       = useState("");
  const [preset, setPreset]             = useState("30");
  const [customStart, setCustomStart]   = useState("");
  const [customEnd, setCustomEnd]       = useState("");
  const [types, setTypes]               = useState(DATA_TYPES.map(d => d.key));
  const [incidentsOnly, setIncidentsOnly] = useState(false);
  const [openId, setOpenId]             = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cardex/reports")
      .then(async r => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Could not load your care reports.");
        return j;
      })
      .then(j => {
        if (cancelled) return;
        setEntries(j.entries || []);
        setPatients(j.patients || []);
        setHcaNames(j.hcaNames || {});
        // With more than one patient, never show a mixed view by default.
        if ((j.patients || []).length === 1) setPatientId(j.patients[0].id);
      })
      .catch(e => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const range = useMemo(() => {
    if (preset === "custom" && customStart && customEnd) return { start: customStart, end: customEnd };
    const days = RANGE_PRESETS.find(p => p.key === preset)?.days || 30;
    const end = todayIso();
    return { start: addDays(end, -(days - 1)), end };
  }, [preset, customStart, customEnd]);

  const mustPickPatient = patients.length > 1 && !patientId;

  const scoped = useMemo(
    () => mustPickPatient ? [] : filterEntries(entries, { ...range, patientId: patientId || undefined, incidentsOnly }),
    [entries, range, patientId, incidentsOnly, mustPickPatient]
  );

  const summary = useMemo(() => {
    if (mustPickPatient || !types.includes("vitals")) return null;
    const prior = precedingPeriod(range.start, range.end);
    const priorEntries = filterEntries(entries, { ...prior, patientId: patientId || undefined });
    return buildSummary(entries, { ...range, patientId: patientId || undefined, priorEntries });
  }, [entries, range, patientId, types, mustPickPatient]);

  const toggleType = useCallback((k) => {
    setTypes(t => t.includes(k) ? t.filter(x => x !== k) : [...t, k]);
  }, []);

  // Which sections the detail view should hide, from the type filter.
  const omit = useMemo(() => {
    const o = [];
    if (!types.includes("vitals"))      o.push("vitals");
    if (!types.includes("medications")) o.push("medications");
    if (!types.includes("nutrition"))   o.push("intakes", "nutrition");
    if (!types.includes("care"))        o.push("hygiene", "mobility", "elimination");
    if (!types.includes("mental"))      o.push("mental_state");
    if (!types.includes("incidents"))   o.push("incidents");
    return o;
  }, [types]);

  const patientName = (id) => patients.find(p => p.id === id)?.name || "Patient";
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";

  if (loading) return <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>Loading your care reports…</div>;

  if (error) {
    return (
      <div className="panel">
        <div className="panel-body" style={{ padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, color: "var(--coral)", marginBottom: 8 }}>{error}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            If this persists, contact <a href="mailto:hello@e-vive.co.ke" style={{ color: "var(--jade)" }}>hello@e-vive.co.ke</a>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Care Reports</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
          A report is filed after every completed shift. {entries.length} on record.
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-body">
          {patients.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <div className="dash-label">Patient</div>
              <select className="dash-input" value={patientId} onChange={e => setPatientId(e.target.value)}>
                <option value="">— select a patient —</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="dash-label">Period</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {RANGE_PRESETS.map(p => (
              <button key={p.key} className={`filter-chip${preset === p.key ? " active" : ""}`} onClick={() => setPreset(p.key)}>{p.label}</button>
            ))}
            <button className={`filter-chip${preset === "custom" ? " active" : ""}`} onClick={() => setPreset("custom")}>Custom</button>
          </div>
          {preset === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div><div className="dash-label">From</div><input type="date" className="dash-input" value={customStart} max={customEnd || todayIso()} onChange={e => setCustomStart(e.target.value)} /></div>
              <div><div className="dash-label">To</div><input type="date" className="dash-input" value={customEnd} min={customStart} max={todayIso()} onChange={e => setCustomEnd(e.target.value)} /></div>
            </div>
          )}

          <div className="dash-label">Show</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {DATA_TYPES.map(d => (
              <button key={d.key} className={`filter-chip${types.includes(d.key) ? " active" : ""}`} onClick={() => toggleType(d.key)}>{d.label}</button>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={incidentsOnly} onChange={e => setIncidentsOnly(e.target.checked)} />
            Only show shifts where something was recorded as an incident
          </label>
        </div>
      </div>

      {mustPickPatient ? (
        <div className="panel">
          <div className="panel-body" style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 14 }}>Choose a patient above to see their care reports.</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Reports are never combined across patients.</div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Summary + trends ─────────────────────────────────────────── */}
          {summary && summary.vitals.length > 0 && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-head"><div className="panel-title">Vital signs — {RANGE_PRESETS.find(p => p.key === preset)?.label || "selected period"}</div></div>
              <div className="panel-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 18 }}>
                  {summary.vitals.map(v => {
                    const note = typicalRangeNote(v.key, v.latest);
                    const delta = v.changeVsPrior;
                    return (
                      <div key={v.key} style={{ background: "rgba(0,74,153,0.04)", border: "1px solid rgba(0,74,153,0.1)", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--muted)" }}>{v.label}</div>
                        <div style={{ fontSize: 19, fontWeight: 700 }}>
                          {fmtValue(v.latest, v.dp)} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>{v.unit}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: 3, lineHeight: 1.6 }}>
                          avg {fmtValue(v.mean, v.dp)} · {fmtValue(v.min, v.dp)}–{fmtValue(v.max, v.dp)}<br />
                          {v.count} reading{v.count !== 1 ? "s" : ""}
                          {Number.isFinite(delta) && Math.abs(delta) >= 0.05 && (
                            <> · {delta > 0 ? "+" : ""}{fmtValue(delta, v.dp)} vs previous period</>
                          )}
                        </div>
                        {note && (
                          <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 6, lineHeight: 1.5 }}>ℹ️ {note}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Blood pressure shares one axis; everything else stands alone. */}
                {(seriesFor(scoped, "bpSys").length > 0 || seriesFor(scoped, "bpDia").length > 0) && (
                  <div style={{ marginBottom: 18 }}>
                    <TrendChart
                      series={seriesFor(scoped, "bpSys")} label="Systolic" unit="mmHg"
                      secondary={seriesFor(scoped, "bpDia")} secondaryLabel="Diastolic"
                    />
                  </div>
                )}
                {NUMERIC_VITALS.filter(v => v.key !== "bpSys" && v.key !== "bpDia").map(v => {
                  const s = seriesFor(scoped, v.key);
                  if (s.length === 0) return null;
                  return (
                    <div key={v.key} style={{ marginBottom: 18 }}>
                      <TrendChart series={s} label={v.label} unit={v.unit} />
                    </div>
                  );
                })}

                <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, borderTop: "1px solid rgba(0,74,153,0.1)", paddingTop: 10 }}>
                  Typical ranges shown are for a healthy adult and may not apply to this patient, whose age or condition can make a
                  different range normal. This is a record of care delivered, not a medical assessment, and does not replace advice
                  from a doctor or nurse.
                </div>
              </div>
            </div>
          )}

          {/* ── Care delivered ──────────────────────────────────────────── */}
          {summary && (
            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-head"><div className="panel-title">Care delivered</div></div>
              <div className="panel-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                  {[
                    ["Reports", summary.measures.reportCount],
                    ["Days covered", summary.measures.daysCovered],
                    ["Doses recorded", summary.measures.dosesRecorded],
                    ["Fluids / day", summary.measures.fluidMlPerDay ? `${summary.measures.fluidMlPerDay} ml` : "—"],
                    ["Meals recorded", summary.measures.mealsRecorded],
                    ["Repositioning", summary.measures.repositioningRate !== null ? `${summary.measures.repositioningRate}% of shifts` : "—"],
                    ["Incidents", summary.measures.incidentCount],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: "rgba(0,74,153,0.04)", border: "1px solid rgba(0,74,153,0.1)", borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
                      <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--muted)", marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                {onShare && (
                  <button className="btn-p btn-sm" style={{ marginTop: 16 }}
                    onClick={() => onShare({ patientId: patientId || null, patientName: patientName(patientId), range, types })}>
                    📤 Share this summary with a doctor
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Report list ─────────────────────────────────────────────── */}
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">Reports</div>
              <span className="badge badge-dim">{scoped.length}</span>
            </div>
            <div className="panel-body">
              {scoped.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0", color: "var(--muted)" }}>
                  <div style={{ fontSize: 34, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 13 }}>
                    {incidentsOnly
                      ? "No incidents were recorded in this period — that is good news."
                      : "No reports in this period. A report appears here after every completed shift."}
                  </div>
                </div>
              ) : scoped.map(e => {
                const open = openId === e.id;
                return (
                  <div key={e.id} style={{ borderBottom: "1px solid rgba(0,74,153,0.08)" }}>
                    <div
                      onClick={() => setOpenId(open ? null : e.id)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", flexWrap: "wrap" }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {fmtDate(e.submittedAt)}
                          {String(e.incidents || "").trim() && <span style={{ color: "var(--gold)", marginLeft: 8 }}>⚠️ incident noted</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)", marginTop: 2 }}>
                          {patientName(e.patientId)} · {hcaNames[e.hcaId] || "Assistant"}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{open ? "▲" : "▼"}</span>
                    </div>
                    {open && (
                      <div style={{ padding: "4px 0 18px" }}>
                        <CardexView
                          entry={e} audience="client" omit={omit}
                          hcaName={hcaNames[e.hcaId]} patientName={patientName(e.patientId)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
