/**
 * Guided tour: "how to build a print", step by step. It opens with a picture of
 * how a print is made of sections (bands), then walks the real screen: data →
 * fields → table → sections → insert / blocks → properties → papers → preview
 * → publish. Each step switches the left panel to the tab it talks about and
 * spotlights the exact control. ← / → / Enter / Esc drive it.
 *
 * Shown once per browser; the Guide button (and the Build guide checklist)
 * replays it, optionally from a given step (`start` = step id).
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";

const KEY = "pbx.tourDone";
export const tourSeen = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked */
  }
};

/** The sections of a print, top to bottom, as the welcome step draws them. */
export const SECTION_GUIDE = [
  { type: "pageHeader", name: "Page Header", when: "every page, at the top", put: "Logo, hospital name, address", tone: "sky" },
  { type: "reportHeader", name: "Report Header", when: "once, first page", put: "Title, patient / bill details", tone: "mint" },
  { type: "detail", name: "Content Rows", when: "repeats for each data row", put: "The items table: tests, medicines, charges", tone: "peach", repeat: true },
  { type: "reportFooter", name: "Report Footer", when: "once, after the last row", put: "Totals, amount in words, signatures", tone: "mint" },
  { type: "pageFooter", name: "Page Footer", when: "every page, at the bottom", put: "Page X of Y, printed by / on", tone: "sky" },
];

/**
 * Steps. `sel` is one selector or a list tried in order (the first visible one
 * wins); `all` spotlights the union of every match; `tab` opens that left tab
 * first. A step without `sel` is a centred card.
 */
export const TOUR_STEPS = [
  { id: "welcome", title: "How a print is built", tone: "sky", icon: "sparkle", welcome: true },
  {
    id: "datasource",
    tab: "data",
    sel: ["[data-tour=ds-card]", ".pbx-left"],
    title: "Connect the data",
    tone: "mint",
    icon: "database",
    text: "A datasource is the procedure / API that returns the bill, patient and rows. Pick one, or Create it — the print never touches the database itself.",
    tip: "One datasource can feed many templates.",
  },
  {
    id: "sample",
    tab: "data",
    sel: ["[data-tour=ds-sample]", "[data-tour=ds-card]"],
    title: "Load a real record",
    tone: "mint",
    icon: "refresh",
    text: "Type a bill no / UHID (or search with Find a record) and press Fetch sample. The page then shows real values while you design.",
    tip: "Recent records are remembered for one-click reuse.",
  },
  {
    id: "fields",
    tab: "data",
    sel: ["[data-tour=ds-tree]", ".pbx-left"],
    title: "Drag fields onto the page",
    tone: "teal",
    icon: "field",
    text: "Drag a field onto a section: caption + value appear. Drag a result-set heading (the ▦ row) to get a whole table. Double-click a field to bind the selected element.",
    tip: "Toggle Data / { } Bindings in the top bar to see values or field names.",
  },
  {
    id: "sections",
    all: true,
    sel: [".pbx-bandtag", ".pbx-canvas"],
    title: "Sections decide where things print",
    tone: "peach",
    icon: "layers",
    text: "The coloured labels on the left are the sections. Click one for its settings (height, repeat on each page, group by). Drag its bottom edge to resize.",
    sections: true,
  },
  {
    id: "insert",
    tab: "insert",
    sel: [".pbx-toolbox", ".pbx-left"],
    title: "Insert anything else",
    tone: "sky",
    icon: "plus",
    text: "Labels, headings, tables, amount in words, charts, barcodes, QR, page numbers… Drag a tile onto a section, or click it to add to the selected section.",
  },
  {
    id: "blocks",
    tab: "blocks",
    sel: [".pbx-left-body", ".pbx-left"],
    title: "Start faster with blocks",
    tone: "violet",
    icon: "puzzle",
    text: "Ready-made pieces — letterhead, patient header, Rx, GST summary, signatures. Drop one in and adjust. Save your own sections as blocks to reuse them.",
  },
  {
    id: "properties",
    sel: [".pbx-right"],
    title: "Fine-tune in Properties",
    tone: "lavender",
    icon: "brush",
    text: "Select anything to edit text, binding, format (date, ₹ amount), font, borders, colour rules and visibility. With nothing selected it shows the template: datasource, letterhead, page, font.",
    tip: "Ctrl+Alt+C / Ctrl+Alt+V copies a style between elements.",
  },
  {
    id: "papers",
    sel: [".pbx-viewsel", "[aria-label=Paper]"],
    title: "Design once, print on any paper",
    tone: "amber",
    icon: "page",
    text: "You design one A4 master. Pick “View on …” to see the automatic layout on A5, thermal roll or labels — edits always go on the master.",
  },
  {
    id: "problems",
    sel: [".pbx-problems"],
    title: "Watch the problem counter",
    tone: "rose",
    icon: "alert",
    text: "Live checks catch wrong bindings, overlaps and text that will not fit. Click the counter to jump to the first problem.",
  },
  {
    id: "preview",
    sel: ["[data-tour=preview]"],
    title: "Preview with real pages",
    tone: "amber",
    icon: "eye",
    text: "Preview paginates exactly as the server PDF will — same engine. Export to PDF, Excel, image or Word from there.",
  },
  {
    id: "publish",
    sel: ["[data-tour=publish]"],
    title: "Publish to go live",
    tone: "rose",
    icon: "rocket",
    text: "Publish validates every binding (with one-click fixes) and freezes a version. Drafts save themselves every 30 s; older versions can be restored any time.",
    tip: "The </> button shows the API call screens use to print this template.",
  },
];

const BUILD_STEPS = TOUR_STEPS;
const CARD_W = 360;
const GAP = 14;
const visible = (el) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
};

/** The spotlight rectangle for a step (null → centred card). */
function targetBox(step) {
  if (!step.sel) return null;
  const list = Array.isArray(step.sel) ? step.sel : [step.sel];
  for (const s of list) {
    const els = step.all ? [...document.querySelectorAll(s)] : [document.querySelector(s)].filter(Boolean);
    const rects = els.map(visible).filter(Boolean);
    if (!rects.length) continue;
    const left = Math.max(0, Math.min(...rects.map((r) => r.left)));
    const top = Math.max(0, Math.min(...rects.map((r) => r.top)));
    const right = Math.min(window.innerWidth, Math.max(...rects.map((r) => r.right)));
    const bottom = Math.min(window.innerHeight, Math.max(...rects.map((r) => r.bottom)));
    return { left, top, width: right - left, height: bottom - top, right, bottom };
  }
  return null;
}

/** Card position: beside the spotlight where it fits (right, left, below, above), else inside it. */
function place(box, h) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampTop = (t) => Math.max(12, Math.min(vh - h - 12, t));
  const clampLeft = (l) => Math.max(12, Math.min(vw - CARD_W - 12, l));
  if (!box) return { top: Math.max(12, (vh - h) / 2), left: Math.max(12, (vw - CARD_W) / 2) };
  if (box.right + GAP + CARD_W <= vw - 8) return { top: clampTop(box.top), left: box.right + GAP, arrow: "left" };
  if (box.left - GAP - CARD_W >= 8) return { top: clampTop(box.top), left: box.left - GAP - CARD_W, arrow: "right" };
  if (box.bottom + GAP + h <= vh - 8) return { top: box.bottom + GAP, left: clampLeft(box.right - CARD_W), arrow: "up" };
  if (box.top - GAP - h >= 8) return { top: box.top - GAP - h, left: clampLeft(box.right - CARD_W), arrow: "down" };
  return { top: clampTop(box.bottom - h - 16), left: clampLeft(box.right - CARD_W - 16) };
}

/**
 * `steps` replaces the build tour (the panel guide passes its own); a step's `reveal`
 * selector is scrolled into view (and expanded when it is a closed section) before it
 * is spotlit; `items` = [name, meaning, icon?] rows. `remember` = mark the build tour seen.
 */
export default function Tour({ onClose, onTab, start, steps: stepsIn, remember = true, finishLabel = "Start designing", label = "Quick tour · 2 minutes" }) {
  const TOUR_STEPS = stepsIn && stepsIn.length ? stepsIn : BUILD_STEPS;
  const hasWelcome = !!TOUR_STEPS[0]?.welcome;
  const [i, setI] = useState(() => Math.max(0, TOUR_STEPS.findIndex((s) => s.id === start)));
  const [box, setBox] = useState(null);
  const [cardH, setCardH] = useState(220);
  const cardRef = useRef(null);
  const step = TOUR_STEPS[i];
  const last = i === TOUR_STEPS.length - 1;

  const measure = useCallback(() => setBox(targetBox(step)), [step]);

  // open the tab the step needs, then measure once the panel has rendered
  useLayoutEffect(() => {
    if (step.tab) onTab?.(step.tab);
    if (step.reveal) {
      const el = document.querySelector(step.reveal);
      if (el && el.classList.contains("pbx-sec") && !el.classList.contains("is-open")) el.querySelector(".pbx-sec-toggle")?.click();
      // after the section has opened: bring its top just under the panel's sticky head,
      // scrolling only the panel (scrollIntoView would also scroll the app page)
      requestAnimationFrame(() => {
        const sec = document.querySelector(step.reveal);
        const box = sec?.parentElement?.closest(".pbx-right, .pbx-left-body");
        if (!sec || !box) return;
        const head = box.querySelector(".pbx-panel-head")?.offsetHeight || 0;
        box.scrollTop += sec.getBoundingClientRect().top - box.getBoundingClientRect().top - head - 6;
      });
    }
    setBox(targetBox(step));
    const t1 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const t2 = setTimeout(measure, 260); // panel expand transition
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [i, box]);

  useEffect(() => {
    const onScroll = (e) => !cardRef.current?.contains(e.target) && measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [measure]);

  const close = useCallback(
    (finished) => {
      if (remember) markSeen();
      onClose(finished === true);
    },
    [onClose, remember],
  );
  const next = useCallback(() => (last ? close(true) : setI((n) => n + 1)), [last, close]);
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close, next, back]);

  const pos = step.welcome ? null : place(box, cardH);
  const pad = 5;

  // portalled out of the CSS-zoomed builder: its spotlight and card use screen pixels
  return createPortal(
    <div className="pbx pbx-tour-layer">
    <div className={`pbx-tour${step.welcome || !box ? " is-centred" : ""}`}>
      {box && !step.welcome ? (
        <div className={`pbx-tour-hole tone-${step.tone}`} style={{ left: box.left - pad, top: box.top - pad, width: box.width + pad * 2, height: box.height + pad * 2 }} />
      ) : (
        <div className="pbx-tour-dim" />
      )}
      <div
        ref={cardRef}
        className={`pbx-tour-card tone-${step.tone}${step.welcome ? " is-welcome" : ""}${pos?.arrow ? ` arrow-${pos.arrow}` : ""}`}
        style={pos ? { top: pos.top, left: pos.left } : undefined}
        role="dialog"
        aria-modal="false"
        aria-label={step.title}
      >
        <div className="pbx-tour-progress">
          <i style={{ width: `${((i + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>
        <div className="pbx-tour-headrow">
          <span className="pbx-tour-icon">
            <Icon name={step.icon} size={18} />
          </span>
          <span className="pbx-tour-count">
            {step.welcome ? label : hasWelcome ? `Step ${i} of ${TOUR_STEPS.length - 1}` : `Step ${i + 1} of ${TOUR_STEPS.length}`}
          </span>
          <Tap className="is-icon pbx-tour-x" tone="list" onClick={() => close(false)} title="Close (Esc)">
            <Icon name="close" size={13} />
          </Tap>
        </div>
        <b className="pbx-tour-title">{step.title}</b>
        {step.welcome ? <Welcome /> : <p>{step.text}</p>}
        {step.sections && <SectionLegend compact />}
        {step.items && (
          <ul className="pbx-tour-items">
            {step.items.map(([name, meaning, icon]) => (
              <li key={name}>
                {icon && (
                  <span className="pbx-tour-items-ic">
                    <Icon name={icon} size={12} />
                  </span>
                )}
                <span className="pbx-tour-items-txt">
                  <b>{name}</b>
                  <span>{meaning}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {step.tip && (
          <div className="pbx-tour-tip">
            <Icon name="bolt" size={12} /> {step.tip}
          </div>
        )}
        {!step.welcome && step.sel && !box && <div className="pbx-tour-tip is-warn">This part is not on screen right now — open it from the left panel or the top bar.</div>}
        <div className="pbx-tour-foot">
          <div className="pbx-tour-dots" aria-hidden>
            {TOUR_STEPS.map((s, k) => (
              <i key={s.id} className={k === i ? "is-on" : k < i ? "is-done" : ""} onClick={() => setI(k)} title={s.title} />
            ))}
          </div>
          <span className="pbx-top-fill" />
          {i > 0 ? (
            <Tap tone="list" className="is-small" onClick={back}>
              Back
            </Tap>
          ) : (
            <Tap tone="list" className="is-small" onClick={() => close(false)}>
              Skip
            </Tap>
          )}
          <Tap tone="primary" className="is-small" onClick={next}>
            {step.welcome ? "Show me" : last ? finishLabel : "Next"}
          </Tap>
        </div>
        <div className="pbx-tour-keys">← → to move · Esc to close</div>
      </div>
    </div>
    </div>,
    document.body,
  );
}

/** Welcome step: the five-step recipe and a picture of the sections on a page. */
function Welcome() {
  const recipe = [
    ["database", "Connect data", "pick the datasource, load a real bill"],
    ["field", "Place fields", "drag fields and tables onto sections"],
    ["brush", "Style it", "fonts, formats, borders in Properties"],
    ["eye", "Preview", "real pages, same engine as the PDF"],
    ["rocket", "Publish", "a frozen version goes live"],
  ];
  return (
    <div className="pbx-tour-welcome">
      <ol className="pbx-tour-recipe">
        {recipe.map(([icon, t, s], k) => (
          <li key={t}>
            <span className="pbx-tour-recipe-n">{k + 1}</span>
            <Icon name={icon} size={14} />
            <span>
              <b>{t}</b> <small>{s}</small>
            </span>
          </li>
        ))}
      </ol>
      <div className="pbx-tour-sheetwrap">
        <SectionLegend />
        <small className="pbx-muted">A long bill flows onto more pages by itself: headers and footers repeat, rows continue.</small>
      </div>
    </div>
  );
}

/** A mini page showing each section, when it prints and what goes in it. */
export function SectionLegend({ compact = false }) {
  return (
    <div className={`pbx-sections-mini${compact ? " is-compact" : ""}`}>
      {SECTION_GUIDE.map((s) => (
        <div key={s.type} className={`pbx-sections-row tone-${s.tone}${s.repeat ? " is-repeat" : ""}`}>
          <span className="pbx-sections-name">
            {s.repeat && <Icon name="refresh" size={10} />} {s.name}
          </span>
          <span className="pbx-sections-when">{s.when}</span>
          {!compact && <span className="pbx-sections-put">{s.put}</span>}
        </div>
      ))}
    </div>
  );
}
