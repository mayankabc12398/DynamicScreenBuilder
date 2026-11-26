/**
 * Build guide: a live checklist of what a print still needs, worked out from
 * the template itself (datasource, sample, header, rows table, totals, page
 * footer, problems, preview, publish). Lives in the status bar as a progress
 * chip; the panel opens above it. Every item has a "Do it" action and a
 * "Show me" that replays the tour from the matching step.
 */
import React, { useEffect, useMemo, useRef } from "react";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";

const OPEN_KEY = "pbx.guideOpen";
export const guideWasOpen = () => {
  try {
    const v = localStorage.getItem(OPEN_KEY);
    return v == null ? null : v === "1";
  } catch {
    return null;
  }
};
export const rememberGuide = (open) => {
  try {
    localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    /* storage blocked */
  }
};

const flat = (els = []) => els.flatMap((e) => (e.type === "section" ? [e, ...flat(e.children)] : [e]));
const bandEls = (tpl, types) => (tpl.bands || []).filter((b) => types.includes(b.type)).flatMap((b) => flat(b.elements));

/** The checklist for a template. `optional` items do not count towards "ready". */
export function guideItems({ tpl, meta, sample, problems, previewed }) {
  const all = bandEls(tpl, ["pageHeader", "reportHeader", "groupHeader", "detail", "groupFooter", "reportFooter", "pageFooter"]);
  const hasRows = all.some((e) => ["table", "crosstab", "subreport"].includes(e.type)) || bandEls(tpl, ["detail"]).length > 0;
  const placed = all.length > 0;
  return [
    {
      id: "datasource",
      title: "Connect a datasource",
      help: "The procedure / API that returns this print's data.",
      done: !!meta?.datasourceCode,
      action: meta?.datasourceCode ? "data" : "createDs",
      actionLabel: meta?.datasourceCode ? "Open" : "Create",
      tour: "datasource",
    },
    {
      id: "sample",
      title: "Load a real record",
      help: "Enter a bill no / UHID and Fetch sample to design with real values.",
      done: !!sample && Object.keys(sample).length > 0,
      action: "data",
      actionLabel: "Fetch",
      tour: "sample",
    },
    {
      id: "header",
      title: "Design the header",
      help: "Logo, hospital name, title and patient / bill details. Tip: Blocks → Letterhead.",
      done: bandEls(tpl, ["pageHeader", "reportHeader"]).length > 0,
      action: "band:reportHeader",
      actionLabel: "Go",
      tour: "blocks",
    },
    {
      id: "rows",
      title: "Add the items table",
      help: "Drag a result set (▦) from the Data tab onto Content Rows or the Report Header.",
      done: hasRows,
      action: "data",
      actionLabel: "Go",
      tour: "fields",
    },
    {
      id: "footer",
      title: "Totals & signatures",
      help: "Report Footer prints once after the last row: totals, amount in words, signature.",
      done: bandEls(tpl, ["reportFooter"]).length > 0,
      action: "band:reportFooter",
      actionLabel: "Go",
      tour: "sections",
    },
    {
      id: "pageFooter",
      title: "Page footer",
      help: "Page X of Y, printed by / on — repeats on every page.",
      done: bandEls(tpl, ["pageFooter"]).length > 0,
      optional: true,
      action: "band:pageFooter",
      actionLabel: "Go",
      tour: "insert",
    },
    {
      id: "problems",
      title: problems.errors.length ? `Fix ${problems.errors.length} error${problems.errors.length === 1 ? "" : "s"}` : "No errors",
      help: problems.errors[0]?.message || (problems.warnings.length ? `${problems.warnings.length} warning(s) — worth a look, not blocking.` : "Every binding and layout check passes."),
      done: placed && problems.errors.length === 0,
      action: "problems",
      actionLabel: "Show",
      tour: "problems",
    },
    {
      id: "preview",
      title: "Preview the pages",
      help: "Check page breaks, totals and the last page before publishing.",
      done: !!previewed,
      action: "preview",
      actionLabel: "Preview",
      tour: "preview",
    },
    {
      id: "publish",
      title: meta?.status === "modified" ? "Publish your changes" : "Publish",
      help: meta?.status === "modified" ? `v${meta.publishedVersionNo} is live; your draft has changes.` : "Freezes a version; screens print it from then on.",
      done: meta?.status === "published",
      action: "publish",
      actionLabel: "Publish",
      tour: "publish",
    },
  ];
}

/** Status-bar chip with a progress ring. */
export function GuideChip({ items, open, onToggle }) {
  const req = items.filter((x) => !x.optional);
  const done = req.filter((x) => x.done).length;
  const pct = req.length ? done / req.length : 0;
  const R = 7;
  const C = 2 * Math.PI * R;
  return (
    <Tap className={`pbx-bguide-chip${open ? " is-open" : ""}${done === req.length ? " is-ready" : ""}`} onClick={onToggle} title="Build guide: what this print still needs" data-tour="guide">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <circle cx="9" cy="9" r={R} className="pbx-bguide-ring-bg" />
        <circle cx="9" cy="9" r={R} className="pbx-bguide-ring" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 9 9)" />
      </svg>
      <span>
        {done === req.length ? "Ready" : "Build guide"} <b>{done}/{req.length}</b>
      </span>
    </Tap>
  );
}

export default function BuildGuide({ items, onAction, onShowMe, onTour, onClose }) {
  const ref = useRef(null);
  const nextId = useMemo(() => items.find((x) => !x.done && !x.optional)?.id, [items]);
  const req = items.filter((x) => !x.optional);
  const done = req.filter((x) => x.done).length;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="pbx-bguide" ref={ref} role="dialog" aria-label="Build guide">
      <div className="pbx-bguide-head">
        <span className="pbx-bguide-badge">
          <Icon name="flag" size={15} />
        </span>
        <div>
          <b>Build guide</b>
          <small>{done === req.length ? "Everything is in place — this print is ready." : `${req.length - done} step${req.length - done === 1 ? "" : "s"} left to a finished print`}</small>
        </div>
        <span className="pbx-top-fill" />
        <Tap className="is-icon" tone="list" onClick={onClose} title="Close (Esc)">
          <Icon name="close" size={13} />
        </Tap>
      </div>
      <div className="pbx-bguide-bar">
        <i style={{ width: `${(done / req.length) * 100}%` }} />
      </div>
      <ol className="pbx-bguide-list">
        {items.map((x, k) => (
          <li key={x.id} className={`pbx-bguide-item${x.done ? " is-done" : ""}${x.id === nextId ? " is-next" : ""}`}>
            <span className="pbx-bguide-tick">{x.done ? <Icon name="check" size={12} /> : k + 1}</span>
            <div className="pbx-bguide-text">
              <b>
                {x.title}
                {x.optional && <small className="pbx-bguide-opt">optional</small>}
                {x.id === nextId && <small className="pbx-bguide-nextchip">next</small>}
              </b>
              <small>{x.help}</small>
            </div>
            <div className="pbx-bguide-acts">
              {!x.done && (
                <Tap tone={x.id === nextId ? "primary" : "list"} className="is-small" onClick={() => onAction(x.action)}>
                  {x.actionLabel}
                </Tap>
              )}
              <Tap className="is-icon is-small" tone="list" onClick={() => onShowMe(x.tour)} title="Show me how">
                <Icon name="eye" size={12} />
              </Tap>
            </div>
          </li>
        ))}
      </ol>
      <div className="pbx-bguide-foot">
        <Tap tone="list" className="is-small" onClick={onTour}>
          <Icon name="sparkle" size={12} /> Replay the tour
        </Tap>
        <span className="pbx-top-fill" />
        <small className="pbx-muted">Ticks update as you build</small>
      </div>
    </div>
  );
}
