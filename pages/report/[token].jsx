import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { BASE_CSS } from "../../components/SharedStyles";
import CardexView from "../../components/CardexView";
import { fmtValue, NUMERIC_VITALS } from "../../lib/cardexSummary";

/**
 * Public, token-gated care summary.
 *
 * Holds no data of its own: everything is fetched from /api/report/[token],
 * which verifies the token server-side and assembles the report from its own
 * authorised query. This page only renders what that route returns.
 *
 * Print-optimised rather than a generated PDF — the browser's own "Save as
 * PDF" produces the same artefact without adding a PDF dependency, and
 * nothing is ever written to disk on the server.
 */
const CSS = `
  body { background:#F4F7FB; padding:0; }
  .rp-wrap { max-width:860px; margin:0 auto; padding:32px 20px 60px; }
  .rp-card { background:#fff; border:1px solid rgba(0,74,153,0.14); border-radius:18px; padding:28px; margin-bottom:18px; box-shadow:0 4px 24px rgba(0,74,153,0.06); }
  .rp-head { border-bottom:2px solid rgba(0,74,153,0.12); padding-bottom:16px; margin-bottom:18px; }
  .rp-title { font-family:var(--serif); font-size:24px; font-weight:700; color:#0F2035; }
  .rp-meta { font-size:12px; color:#5A7080; font-family:var(--mono); margin-top:6px; line-height:1.7; }
  .rp-note { background:rgba(0,74,153,0.05); border:1px solid rgba(0,74,153,0.14); border-radius:10px; padding:12px 16px; font-size:12px; color:#5A7080; line-height:1.6; margin-top:14px; }
  .rp-entry { border:1px solid rgba(0,74,153,0.1); border-radius:12px; padding:18px; margin-bottom:14px; }
  .rp-entry-h { font-weight:700; font-size:14px; margin-bottom:10px; color:#0F2035; }
  .rp-foot { font-size:11px; color:#5A7080; text-align:center; line-height:1.7; padding-top:8px; }
  .rp-gate { max-width:420px; margin:80px auto; text-align:center; }
  .rp-input { width:100%; padding:12px 15px; border:1.5px solid rgba(0,74,153,0.2); border-radius:11px; font-size:16px; font-family:var(--mono); text-align:center; letter-spacing:3px; text-transform:uppercase; outline:none; }
  .rp-input:focus { border-color:#004A99; }
  .rp-stat { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
  .rp-stat-box { background:rgba(0,74,153,0.04); border:1px solid rgba(0,74,153,0.1); border-radius:10px; padding:12px; }
  @media print {
    body { background:#fff; }
    .rp-card { box-shadow:none; border:none; padding:0 0 18px; }
    .no-print { display:none !important; }
  }
`;

export default function SharedReport() {
  const router = useRouter();
  const { token } = router.query;

  const [state, setState] = useState("loading"); // loading|code|ready|denied
  const [report, setReport] = useState(null);
  const [recipientName, setRecipientName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (accessCode) => {
    setErr("");
    const res = await fetch(`/api/report/${token}`, {
      method: accessCode ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: accessCode ? JSON.stringify({ accessCode }) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setState("denied"); setErr(json.error || "This link is not valid."); return; }
    if (json.needsCode) { setRecipientName(json.recipientName || ""); setState("code"); return; }
    setReport(json.report); setState("ready");
  }, [token]);

  useEffect(() => { if (token) load(); }, [token, load]);

  if (state === "loading") {
    return <><style>{BASE_CSS + CSS}</style><div className="rp-gate">Loading…</div></>;
  }

  if (state === "denied") {
    return (
      <>
        <Head><title>Link not available</title><meta name="robots" content="noindex,nofollow" /></Head>
        <style>{BASE_CSS + CSS}</style>
        <div className="rp-gate">
          <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>This link is not available</div>
          <div style={{ fontSize: 13, color: "#5A7080", lineHeight: 1.7 }}>{err}</div>
        </div>
      </>
    );
  }

  if (state === "code") {
    return (
      <>
        <Head><title>Access code required</title><meta name="robots" content="noindex,nofollow" /></Head>
        <style>{BASE_CSS + CSS}</style>
        <div className="rp-gate">
          <div style={{ fontSize: 40, marginBottom: 14 }}>🔑</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Enter your access code</div>
          <div style={{ fontSize: 13, color: "#5A7080", marginBottom: 20, lineHeight: 1.7 }}>
            {recipientName ? `${recipientName}, the` : "The"} person who shared this will have given you a short code separately.
          </div>
          <input
            className="rp-input" value={code} maxLength={8} autoFocus
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && code.length >= 4 && (setSubmitting(true), load(code).finally(() => setSubmitting(false)))}
          />
          {err && <div style={{ color: "#c0392b", fontSize: 12, marginTop: 10 }}>{err}</div>}
          <button
            className="btn-p" style={{ marginTop: 18, width: "100%" }}
            disabled={code.length < 4 || submitting}
            onClick={() => { setSubmitting(true); load(code).finally(() => setSubmitting(false)); }}
          >{submitting ? "Checking…" : "View Report →"}</button>
        </div>
      </>
    );
  }

  const r = report;
  const fmtD = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <>
      <Head><title>Care Summary</title><meta name="robots" content="noindex,nofollow" /></Head>
      <style>{BASE_CSS + CSS}</style>
      <div className="rp-wrap">
        <div className="rp-card">
          <div className="rp-head">
            <div className="rp-title">Care Summary — {r.patientName}</div>
            <div className="rp-meta">
              Period: {fmtD(r.rangeStart)} → {fmtD(r.rangeEnd)}<br />
              Includes: {r.dataTypes.join(", ")}<br />
              Shared by {r.sharedBy} with {r.sharedWith}<br />
              Generated {new Date(r.generatedAt).toLocaleString("en-GB")} · access expires {new Date(r.expiresAt).toLocaleDateString("en-GB")}
            </div>
          </div>
          <div className="rp-note">⚕️ {r.standingNote}</div>
          <div className="no-print" style={{ marginTop: 16 }}>
            <button className="btn-o" onClick={() => window.print()}>🖨 Print / Save as PDF</button>
          </div>
        </div>

        {r.summary && r.summary.vitals.length > 0 && (
          <div className="rp-card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Vital signs over this period</div>
            <div className="rp-stat">
              {r.summary.vitals.map(v => {
                const meta = NUMERIC_VITALS.find(n => n.key === v.key) || {};
                return (
                  <div className="rp-stat-box" key={v.key}>
                    <div style={{ fontSize: 10, fontFamily: "var(--mono)", color: "#5A7080" }}>{meta.label || v.key}</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{fmtValue(v.latest, meta.dp ?? 1)} <span style={{ fontSize: 10, fontWeight: 400, color: "#5A7080" }}>{meta.unit}</span></div>
                    <div style={{ fontSize: 10, color: "#5A7080", fontFamily: "var(--mono)", marginTop: 3 }}>
                      avg {fmtValue(v.mean, meta.dp ?? 1)} · {v.count} reading{v.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rp-card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            Shift records ({r.entries.length})
          </div>
          {r.entries.length === 0 ? (
            <div style={{ fontSize: 13, color: "#5A7080" }}>No records in this period.</div>
          ) : r.entries.map(e => (
            <div className="rp-entry" key={e.id}>
              <div className="rp-entry-h">
                {e.submittedAt ? new Date(e.submittedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—"}
              </div>
              <CardexView entry={e} audience="shared" compact />
            </div>
          ))}
        </div>

        <div className="rp-foot">
          This report was shared by <strong>{r.sharedBy}</strong> with <strong>{r.sharedWith}</strong> via E-Vive HomeCare.<br />
          {r.standingNote}
        </div>
      </div>
    </>
  );
}
