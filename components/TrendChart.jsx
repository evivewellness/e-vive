import { buildLineChart } from "../lib/cardexSummary";

/**
 * Inline SVG line chart. No charting dependency — the CSP blocks external
 * scripts, and this is small enough not to warrant one.
 *
 * Gaps render as gaps: readings more than `gapDays` apart are not joined, so
 * the chart never draws a line implying measurements that were not taken.
 * Series are distinguished by dash pattern and label as well as colour, so
 * meaning never depends on colour alone.
 */
export default function TrendChart({
  series, secondary = null, label = "", secondaryLabel = "", unit = "",
  color = "#004A99", secondaryColor = "#0ea5e9", height = 180,
}) {
  const c = buildLineChart(series, { secondary, height, label, unit, color, secondaryColor, secondaryLabel });
  if (!c) {
    return <div style={{ fontSize: 12, color: "var(--muted)", padding: "18px 0" }}>No readings recorded in this period.</div>;
  }

  const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 6, fontSize: 11, fontFamily: "var(--mono)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" /></svg>
          {label}{unit ? ` (${unit})` : ""}
        </span>
        {c.secondary && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" stroke={secondaryColor} strokeWidth="2" strokeDasharray="4 3" /></svg>
            {secondaryLabel}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${c.width} ${c.height}`}
        style={{ width: "100%", minWidth: 300, height: "auto", display: "block" }}
        role="img"
        aria-label={`${label} over time${c.secondary ? ` and ${secondaryLabel}` : ""}. ${c.primary.dots.length} readings.`}
      >
        {c.gridY.map((g, i) => (
          <g key={i}>
            <line x1="28" y1={g.y} x2={c.width - 28} y2={g.y} stroke="rgba(0,74,153,0.12)" strokeWidth="1" />
            <text x="4" y={g.y + 3} fontSize="9" fill="#5A7080" fontFamily="monospace">{g.v.toFixed(0)}</text>
          </g>
        ))}

        {c.secondary?.path && <path d={c.secondary.path} fill="none" stroke={secondaryColor} strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" />}
        {c.primary.path   && <path d={c.primary.path}   fill="none" stroke={color}          strokeWidth="2" strokeLinejoin="round" />}

        {c.secondary?.dots.map((d, i) => (
          <circle key={`s${i}`} cx={d.cx} cy={d.cy} r="2.5" fill={secondaryColor}>
            <title>{`${secondaryLabel} ${d.value} · ${fmtDay(d.day)}`}</title>
          </circle>
        ))}
        {c.primary.dots.map((d, i) => (
          <circle key={`p${i}`} cx={d.cx} cy={d.cy} r="3" fill={color}>
            <title>{`${label} ${d.value}${unit ? ` ${unit}` : ""} · ${fmtDay(d.day)}`}</title>
          </circle>
        ))}

        <text x="28" y={c.height - 6} fontSize="9" fill="#5A7080" fontFamily="monospace">{fmtDay(c.xAxis.from)}</text>
        <text x={c.width - 28} y={c.height - 6} fontSize="9" fill="#5A7080" fontFamily="monospace" textAnchor="end">{fmtDay(c.xAxis.to)}</text>
      </svg>
    </div>
  );
}
