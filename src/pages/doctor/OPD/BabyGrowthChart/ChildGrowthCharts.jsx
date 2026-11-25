import React, { useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import { ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ---------------- MAIN COMPONENT ---------------- */
export default function ChildGrowthCharts({ apiResponse = [], onEdit }) {
  /* ---------------- FORMAT API DATA ---------------- */
  const measurements = useMemo(() => {
    if (!Array.isArray(apiResponse)) return [];

    return apiResponse
      .map((item) => {
        const ageInYears = item?.AgeMonth
          ? Number(item.AgeMonth) / 12
          : 0;

        const bmi =
          item?.Height && item?.Weight
            ? (
                item.Weight /
                ((item.Height / 100) * (item.Height / 100))
              ).toFixed(2)
            : 0;

        return {
          age: ageInYears,                       // X-axis
          ageLabel: `${item.AgeMonth} Months`,
          height: Number(item.Height) || 0,
          weight: Number(item.Weight) || 0,
          bmi: Number(bmi),
          ofc: 0,
          Id: item.Id,
          updatedAt: item.VisitDate,
          GrowthStatus: item.GrowthStatus || "N/A",
        };
      })
      .sort((a, b) => a.age - b.age);
  }, [apiResponse]);

  /* ---------------- DUMMY PERCENTILE CURVES ---------------- */
  const backgroundData = useMemo(() => {
    const maxAge =
      measurements.length > 0
        ? Math.max(...measurements.map((m) => m.age))
        : 5;

    const points = [];
    for (let i = 0; i <= 10; i++) {
      const age = (maxAge / 10) * i;
      points.push({
        age,
        p97: 10 + age * 12,
        p90: 9 + age * 11,
        p50: 8 + age * 10,
        p10: 7 + age * 9,
        p03: 6 + age * 8,
      });
    }
    return points;
  }, [measurements]);

  return (
    <div style={{ background: "#f8f9fa", padding: 20 }}>
      <div className="row g-4">
        {[
          { key: "height", label: "Height", unit: "cm" },
          { key: "weight", label: "Weight", unit: "kg" },
          { key: "bmi", label: "BMI", unit: "" },
          { key: "ofc", label: "OFC", unit: "cm" },
        ].map((config) => (
          <div className="col-md-6" key={config.key}>
            <ChartCard
              title={config.label}
              yLabel={`${config.label}${config.unit ? ` (${config.unit})` : ""}`}
              percentileData={backgroundData}
              userPoints={measurements}
              dataKey={config.key}
              onPointClick={onEdit}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- CHART CARD ---------------- */
function ChartCard({
  title,
  yLabel,
  percentileData,
  userPoints,
  dataKey,
  onPointClick,
}) {
  const [t] = useTranslation();
  const cardRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const latestAge =
    userPoints.length > 0 ? userPoints[userPoints.length - 1].age : 0;
  const latestLabel =
    userPoints.length > 0 ? userPoints[userPoints.length - 1].ageLabel : "";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="card border-0 shadow-sm p-3"
      style={{ background: "white", borderRadius: "12px" }}
    >
      <div
        className="d-flex justify-content-between align-items-center mb-2"
        style={{ cursor: "pointer" }}
        onClick={toggleFullscreen}
      >
        <small className="text-muted">
          {title} {t("Percentile")} <ChevronDown size={12} />
        </small>
        {isFullscreen ? (
          <Minimize2 size={16} className="text-muted" />
        ) : (
          <Maximize2 size={16} className="text-muted" />
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
          <CartesianGrid stroke="#f0f0f0" />

          <XAxis
            dataKey="age"
            type="number"
            domain={["dataMin", "dataMax + 0.5"]}
            tick={{ fontSize: 10 }}
            label={{
              value: "Age (Years)",
              position: "bottom",
              fontSize: 12,
            }}
          />

          <YAxis
            tick={{ fontSize: 10 }}
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              fontSize: 12,
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {["p97", "p90", "p50", "p10", "p03"].map((p, idx) => {
            const colors = [
              "#fcd34d",
              "#d8b4fe",
              "#4ade80",
              "#93c5fd",
              "#fca5a5",
            ];
            return (
              <Line
                key={p}
                data={percentileData}
                dataKey={p}
                stroke={colors[idx]}
                dot={false}
                strokeWidth={1}
                label={
                  <PercentileLabel
                    text={p.toUpperCase().replace("P", "P ")}
                    color={colors[idx]}
                  />
                }
              />
            );
          })}

          <ReferenceLine x={latestAge} stroke="#10b981">
            <Label
              value={`${latestLabel} (Latest)`}
              position="top"
              fill="#10b981"
              fontSize={10}
            />
          </ReferenceLine>

          <Line
            data={userPoints}
            type="monotone"
            dataKey={dataKey}
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{
              r: 5,
              fill: "#10b981",
              cursor: "pointer",
              onClick: (e) => onPointClick(e.payload),
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- CUSTOM LABEL ---------------- */
const PercentileLabel = ({ x, y, index, text, color }) => {
  if (index === 10) {
    return (
      <text x={x + 5} y={y} fill={color} fontSize={9} fontWeight="bold">
        {text}
      </text>
    );
  }
  return null;
};

/* ---------------- TOOLTIP ---------------- */
const CustomTooltip = ({ active, payload }) => {
  const [t] = useTranslation();
  if (!active || !payload?.length) return null;

  const userData = payload.find((p) => p.payload.updatedAt)?.payload;
  if (!userData) return null;

  return (
    <div
      style={{
        background: "#e0f7fa",
        borderRadius: 10,
        padding: 12,
        width: 220,
        fontSize: 12,
      }}
    >
      <strong>{t("Measurements")}</strong>
      <hr />
      <div>{t("Age:")} {userData.ageLabel}</div>
      <div>{t("Height:")} {userData.height} {t("cm")}</div>
      <div>{t("Weight:")} {userData.weight} {t("kg")}</div>
      <div>{t("BMI:")} {userData.bmi}</div>
      <div>{t("Date:")} {userData.updatedAt}</div>
      <div>{t("Grouth-Status:")} {userData.GrowthStatus}</div>
    </div>
  );
};
