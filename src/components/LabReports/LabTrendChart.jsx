import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";
import { chartPoints, referenceBand, showDate } from "../../utils/labTrendLogic";

/**
 * One parameter over time. The shaded band is the reference range of the latest reading; each
 * reading is a dot coloured by its flag (red high, blue low, green normal), so an out-of-range
 * reading is visible at a glance and a line that is walking back into the band is obvious.
 *
 * Readings are placed on a real time axis, so a six-month gap looks like six months.
 */
const FLAG_COLOUR = { H: "#dc2626", L: "#2563eb", N: "#16a34a" };
const LINE_COLOUR = "#64748b";

const Dot = ({ cx, cy, payload }) => {
  if (cx == null || cy == null) return null;
  const colour = FLAG_COLOUR[payload?.flag] || LINE_COLOUR;
  return <circle cx={cx} cy={cy} r={5} fill={colour} stroke="#fff" strokeWidth={1.5} />;
};

export default function LabTrendChart({ points, unit, height = 300 }) {
  const [t] = useTranslation();
  const data = useMemo(() => chartPoints(points), [points]);
  const band = useMemo(() => referenceBand(points), [points]);

  if (data.length < 2) return null;

  // Same-day readings would give a zero-width axis; give it a day either side.
  const first = data[0].t;
  const last = data[data.length - 1].t;
  const day = 86400000;
  const domain = first === last ? [first - day, last + day] : [first, last];

  const values = data.map((d) => d.num);
  if (band?.low != null) values.push(band.low);
  if (band?.high != null) values.push(band.high);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min || Math.abs(max) || 1) * 0.15;

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="lrt-tip">
        <div className="lrt-tip__date">{showDate(p.date)}</div>
        <div className="lrt-tip__value">
          <b>{p.comparator ? `${p.comparator} ` : ""}{p.num}</b> {p.unit || unit || ""}
        </div>
        {(p.refLow != null || p.refHigh != null) && (
          <div className="lrt-tip__sub">
            {t("Reference")}: {p.refLow ?? ""}{p.refLow != null && p.refHigh != null ? " - " : p.refHigh != null ? "< " : "> "}{p.refHigh ?? ""}
          </div>
        )}
        {p.lab ? <div className="lrt-tip__sub">{p.lab}</div> : null}
      </div>
    );
  };

  return (
    <div className="lrt-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={domain}
            tickFormatter={(v) => moment(v).format("DD MMM YY")}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tickFormatter={(v) => Number(v.toFixed(2))}
            tick={{ fontSize: 11 }}
            width={48}
          />
          {band && (
            <ReferenceArea
              y1={band.low ?? min - pad}
              y2={band.high ?? max + pad}
              fill="#16a34a"
              fillOpacity={0.1}
              stroke="#16a34a"
              strokeOpacity={0.35}
              strokeDasharray="4 3"
              ifOverflow="extendDomain"
            />
          )}
          <Tooltip content={<Tip />} />
          <Line type="monotone" dataKey="num" stroke={LINE_COLOUR} strokeWidth={2} dot={<Dot />} activeDot={{ r: 7 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
