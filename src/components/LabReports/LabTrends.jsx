import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Heading from "../UI/Heading";
import Tables from "../UI/customTable";
import Input from "../formComponent/Input";
import LabFlagChip from "./LabFlagChip";
import LabTrendChart from "./LabTrendChart";
import {
  hasTrend,
  numericPoints,
  outOfRangeNow,
  showDate,
  trendOf,
  withinMonths,
} from "../../utils/labTrendLogic";

/**
 * Trends across ALL of a patient's reports.
 *
 * The list on the left is every parameter the patient has ever had measured, from any laboratory:
 * the API groups them under a shared key, so "Hb", "HGB" and "Haemoglobin (Hb)" are one entry. The
 * detail on the right shows the chosen parameter over time - a chart with the reference range
 * shaded when there are two or more numeric readings, a plain timeline when there are not (a
 * single reading, or results like "Positive") - plus every reading with its flag, laboratory and
 * a way back to the report it came from.
 */
const RANGES = [
  { value: 0, label: "All" },
  { value: 6, label: "6 months" },
  { value: 12, label: "1 year" },
  { value: 24, label: "2 years" },
];

const ARROW = { up: "fa-arrow-up", down: "fa-arrow-down", flat: "fa-arrows-alt-h" };

export default function LabTrends({ data, loading, onOpenReport, onAddReport }) {
  const [t] = useTranslation();
  const [search, setSearch] = useState("");
  const [onlyTrend, setOnlyTrend] = useState(false);
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [months, setMonths] = useState(0);

  const params = data?.parameters || [];

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return params.filter((p) => {
      if (onlyTrend && !hasTrend(p)) return false;
      if (onlyAbnormal) {
        const last = p.points[p.points.length - 1];
        if (last?.flag !== "L" && last?.flag !== "H") return false;
      }
      if (!q) return true;
      return `${p.name} ${p.section || ""}`.toLowerCase().includes(q);
    });
  }, [params, search, onlyTrend, onlyAbnormal]);

  // Keep a valid selection: the first trendable parameter on load, and again if filters hide the chosen one.
  useEffect(() => {
    if (visible.length === 0) return;
    if (!visible.some((p) => p.key === selectedKey)) setSelectedKey(visible[0].key);
  }, [visible, selectedKey]);

  const selected = params.find((p) => p.key === selectedKey) || null;
  const points = useMemo(() => withinMonths(selected?.points, months || null), [selected, months]);
  const view = useMemo(() => (selected ? { ...selected, points } : null), [selected, points]);
  const trend = useMemo(() => (view ? trendOf(view) : null), [view]);

  if (loading && !data) return <div className="lrt-empty lrt-empty--tall">{t("Loading...")}</div>;

  if (params.length === 0) {
    return (
      <div className="lrt-empty lrt-empty--tall">
        <i className="fas fa-chart-line" aria-hidden="true" />
        <div>{t("No lab reports saved for this patient yet.")}</div>
        <button type="button" className="btn btn-sm text-white mt-2" onClick={onAddReport}>
          <i className="fas fa-plus mr-1" aria-hidden="true" />
          {t("Add Report")}
        </button>
      </div>
    );
  }

  const outNow = outOfRangeNow(params).length;
  const withTrend = params.filter(hasTrend).length;

  const movementText = {
    back_in_range: t("Back within the reference range"),
    toward_range: t("Moving toward the reference range"),
    away_from_range: t("Moving away from the reference range"),
  };

  const readings = [...(view?.points || [])].reverse().map((p) => ({
    date: showDate(p.date),
    value: (
      <b>
        {p.comparator ? `${p.comparator} ` : ""}
        {p.value}
      </b>
    ),
    unit: p.unit || "-",
    range: p.refLow != null || p.refHigh != null ? `${p.refLow ?? ""}${p.refLow != null && p.refHigh != null ? " - " : p.refHigh != null ? "< " : "> "}${p.refHigh ?? ""}` : "-",
    flag: <LabFlagChip flag={p.flag} />,
    lab: p.lab || "-",
    report: (
      <span
        role="button"
        tabIndex={0}
        className="lrt-link"
        onClick={() => onOpenReport?.(p.reportId)}
        onKeyDown={(e) => e.key === "Enter" && onOpenReport?.(p.reportId)}
      >
        {t("View report")}
      </span>
    ),
  }));

  return (
    <div className="lrt-trends">
      <div className="lrt-summary">
        <span><b>{data.reports}</b> {t("reports")}</span>
        <span><b>{params.length}</b> {t("parameters")}</span>
        <span><b>{withTrend}</b> {t("with a trend")}</span>
        <span className={outNow ? "lrt-summary__bad" : ""}><b>{outNow}</b> {t("out of range in the latest reports")}</span>
      </div>

      <div className="row mx-0">
        <div className="col-xl-4 col-12 px-0 pr-xl-1 mb-2">
          <Heading title={t("Parameters")} isBreadcrumb={false} />
          <div className="lrt-filters">
            <Input
              id="lab-trend-search"
              lable={t("Search parameter")}
              name="search"
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=" "
              respclass="col-12"
            />
            <label className="lrt-check">
              <input type="checkbox" className="table-checkbox" checked={onlyTrend} onChange={(e) => setOnlyTrend(e.target.checked)} />
              {t("With a trend")}
            </label>
            <label className="lrt-check">
              <input type="checkbox" className="table-checkbox" checked={onlyAbnormal} onChange={(e) => setOnlyAbnormal(e.target.checked)} />
              {t("Out of range")}
            </label>
          </div>

          <ul className="lrt-list" role="listbox" aria-label={t("Parameters")}>
            {visible.length === 0 && <li className="lrt-list__none">{t("No parameter matches")}</li>}
            {visible.map((p) => {
              const last = p.points[p.points.length - 1];
              const tr = trendOf(p);
              return (
                <li key={p.key}>
                  <div
                    role="option"
                    tabIndex={0}
                    aria-selected={p.key === selectedKey}
                    className={`lrt-item${p.key === selectedKey ? " lrt-item--on" : ""}`}
                    onClick={() => setSelectedKey(p.key)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelectedKey(p.key))}
                  >
                    <span className="lrt-item__main">
                      <span className="lrt-item__name">{p.name}</span>
                      {p.section ? <span className="lrt-item__sub">{p.section}</span> : null}
                    </span>
                    <span className="lrt-item__latest">
                      <b>{last?.comparator ? `${last.comparator} ` : ""}{last?.value}</b> <small>{p.unit || last?.unit || ""}</small>
                    </span>
                    <span className="lrt-item__meta">
                      <LabFlagChip flag={last?.flag} compact />
                      {tr.direction !== "none" && (
                        <i className={`fas ${ARROW[tr.direction]} lrt-arrow lrt-arrow--${tr.direction}`} title={t("Change since the previous reading")} aria-hidden="true" />
                      )}
                      <span className="lrt-count" title={t("Readings")}>{p.count}</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="col-xl-8 col-12 px-0 pl-xl-1 mb-2">
          <Heading
            title={selected ? selected.name : t("Trend")}
            isBreadcrumb={false}
            secondTitle={
              selected ? (
                <select
                  className="lrt-range"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  aria-label={t("Period")}
                >
                  {RANGES.map((r) => (
                    <option key={r.value} value={r.value}>{t(r.label)}</option>
                  ))}
                </select>
              ) : null
            }
          />
          {view && (
            <>
              <div className="lrt-facts">
                <div className="lrt-fact">
                  <span>{t("Latest")}</span>
                  <b>{trend.latest ? `${trend.latest.comparator ? `${trend.latest.comparator} ` : ""}${trend.latest.value} ${trend.latest.unit || selected.unit || ""}` : view.points.length ? view.points[view.points.length - 1].value : "-"}</b>
                  <small>{showDate(view.points[view.points.length - 1]?.date)}</small>
                </div>
                {trend.previous && (
                  <div className="lrt-fact">
                    <span>{t("Previous")}</span>
                    <b>{trend.previous.value} {trend.previous.unit || selected.unit || ""}</b>
                    <small>{showDate(trend.previous.date)}</small>
                  </div>
                )}
                {trend.direction !== "none" && (
                  <div className="lrt-fact">
                    <span>{t("Change")}</span>
                    <b className={`lrt-arrow--${trend.direction}`}>
                      <i className={`fas ${ARROW[trend.direction]} mr-1`} aria-hidden="true" />
                      {trend.pct != null ? `${trend.pct > 0 ? "+" : ""}${trend.pct.toFixed(1)}%` : `${trend.delta > 0 ? "+" : ""}${trend.delta}`}
                    </b>
                    {trend.movement && <small>{movementText[trend.movement]}</small>}
                  </div>
                )}
              </div>

              {selected.unitMixed && (
                <div className="lrt-warn">
                  <i className="fas fa-exclamation-triangle mr-1" aria-hidden="true" />
                  {t("These readings were printed in different units, so the line may not be strictly comparable.")}
                </div>
              )}

              {numericPoints(view.points).length >= 2 ? (
                <LabTrendChart points={view.points} unit={selected.unit} />
              ) : (
                <div className="lrt-empty">
                  {numericPoints(view.points).length === 1
                    ? t("Only one reading so far. Add more reports to see the trend.")
                    : t("These results are not numbers, so they are shown as a timeline below.")}
                </div>
              )}

              {view.points.length === 0 && <div className="lrt-empty">{t("No readings in this period.")}</div>}

              {readings.length > 0 && (
                <Tables
                  thead={[
                    { name: t("Date"), width: "13%" },
                    { name: t("Value"), width: "13%" },
                    { name: t("Unit"), width: "10%" },
                    { name: t("Reference Range"), width: "16%" },
                    { name: t("Flag"), width: "10%" },
                    { name: t("Laboratory"), width: "23%" },
                    { name: "", width: "15%" },
                  ]}
                  tbody={readings}
                  style={{ maxHeight: "26vh" }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
