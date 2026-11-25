import React from "react";

/** Small inline SVG charts for the AI Assistance tabs - no library, colours from the .ccp tokens. */

export const Sparkline = ({ values = [], width = 130, height = 36 }) => {
  const v = values.filter((x) => Number.isFinite(x));
  if (v.length < 2) return null;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const span = max - min || 1;
  const x = (i) => 6 + (i * (width - 12)) / (v.length - 1);
  const y = (a) => height - 6 - ((a - min) * (height - 12)) / span;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke="var(--ccp-ai)" strokeWidth="2" points={v.map((a, i) => `${x(i)},${y(a)}`).join(" ")} />
      {v.map((a, i) => (
        <circle key={i} cx={x(i)} cy={y(a)} r="3" fill={i === v.length - 1 ? "var(--ccp-danger)" : "var(--ccp-ai)"} />
      ))}
    </svg>
  );
};

export const Gauge = ({ value = 0, color = "ai" }) => {
  const c = 138.2;
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <svg width="54" height="54" viewBox="0 0 56 56" aria-hidden="true" style={{ flex: "none" }}>
      <circle className="ccp-gauge-bg" cx="28" cy="28" r="22" />
      <circle
        className="ccp-gauge"
        cx="28"
        cy="28"
        r="22"
        stroke={`var(--ccp-${color})`}
        strokeDasharray={c}
        style={{ strokeDashoffset: (c * (1 - v / 100)).toFixed(1) }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ccp-ink)">
        {v}%
      </text>
    </svg>
  );
};

/** Expected course: a falling "problem" curve from day 0 to the expected day, with checkpoints. */
export const CourseChart = ({ expectedDays, checkpoints = [], todayLabel = "Today", dayLabel = "D" }) => {
  const W = 460;
  const H = 170;
  const L = 18;
  const R = 14;
  const B = 26;
  const T = 14;
  const span = Math.max(expectedDays || 0, ...checkpoints.map((c) => c.day), 3);
  const x = (d) => L + (d * (W - L - R)) / span;
  const y = (v) => T + (1 - v) * (H - T - B);
  const curve = Array.from({ length: 25 }, (_, i) => {
    const d = (i / 24) * span;
    const k = expectedDays ? Math.min(1, d / expectedDays) : d / span;
    const v = 0.9 * Math.exp(-3 * k) + 0.06;
    return [x(d), y(v)];
  });
  const up = curve.map(([cx, cy], i) => `${cx},${cy - 6 - i * 0.6}`);
  const lo = curve.map(([cx, cy], i) => `${cx},${Math.min(H - B, cy + 6 + i * 0.5)}`).reverse();
  const ticks = Array.from(new Set([0, ...checkpoints.map((c) => c.day), expectedDays || span])).sort((a, b) => a - b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Expected course">
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ccp-line)" />
      <polygon points={[...up, ...lo].join(" ")} fill="var(--ccp-ai)" opacity=".14" />
      <polyline points={curve.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--ccp-ai)" strokeWidth="2.5" />
      {checkpoints.map((c, i) => (
        <g key={i}>
          <line x1={x(c.day)} x2={x(c.day)} y1={T} y2={H - B} stroke="var(--ccp-muted)" strokeDasharray="2 3" />
          <text x={Math.min(x(c.day) + 4, W - 120)} y={T + 10 + (i % 3) * 13} fontSize="10.5" fill="var(--ccp-ink)">
            {c.label.length > 26 ? `${c.label.slice(0, 25)}…` : c.label}
          </text>
        </g>
      ))}
      <circle cx={x(0)} cy={curve[0][1]} r="5" fill="var(--ccp-danger)" />
      <text x={x(0) + 8} y={curve[0][1] - 6} fontSize="11" fill="var(--ccp-ink)">
        {todayLabel}
      </text>
      {ticks.map((d) => (
        <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--ccp-muted)">
          {dayLabel}
          {d}
        </text>
      ))}
    </svg>
  );
};
