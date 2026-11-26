/**
 * The design surface: the page at its true size in millimetres, scaled by the
 * zoom, with rulers, grid, the bands stacked in flow order, and every element
 * drawn by the print engine itself (renderElementHtml) — so what you place is
 * what prints.
 *
 * Paper: the canvas is the template's MASTER paper (page.master — A4 portrait for
 * new templates), the only place a template is edited. Every other paper is laid
 * out from it automatically (engine adaptTemplate); the designer shows that as a
 * read-only preview (PaperPreview), never as per-paper controls.
 *
 * Interaction: click / shift-click to select, drag to move (snaps to the edges
 * of neighbours, with guides), handles to resize, drag on an
 * empty band to marquee-select, drop toolbox items or data fields on a band or
 * onto an element to bind it. Moving an element below its band's edge drops it
 * into the band underneath.
 */
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { datasetRows, elementCss, evaluate, fontStack, masterPage, renderElementHtml, resolveLayout, setNameOf } from "../engine/printEngine";
import { engineSheet } from "../engine/runtime";
import { BAND_TYPES, bandMeta, bandName, makeBand, makeElement, roundMm, toolMeta } from "../model/defaults";
import { findEl, useDesigner } from "../model/useDesigner";
import { blockElements, blockSection, fitWidth } from "../model/blocks";
import { findBlock } from "./BlocksPanel";
import { APIBaseURL } from "../../../networkServices/axiosInstance";
import { pbAssetPath } from "../../../networkServices/printBuilderApi";
import Icon from "../ui/Icon";
import Tap from "../ui/Tap";
import { uiZoom, zoomOf } from "../ui/zoom";

const assetUrl = (k) => `${APIBaseURL}/${pbAssetPath(k)}`;

export const PX_PER_MM = 96 / 25.4;
const GUTTER_L = 146; // px left of the sheet: band labels + ruler
const GUTTER_T = 30; // px above the sheet: ruler
const SNAP_EDGE = 1.2; // mm — how close an edge must be to snap to a neighbour

const TOKEN = /\{\{([\s\S]+?)\}\}/g;
const lit = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

/** With "bindings" view: show the expressions instead of sample values. */
function bindingView(el) {
  const c = JSON.parse(JSON.stringify(el));
  const show = (e) => `‹${String(e).trim()}›`;
  switch (c.type) {
    case "label":
    case "heading":
      c.text = String(c.text || "").replace(TOKEN, (_, e) => show(e));
      break;
    case "field":
      return { ...c, type: "label", text: c.expr ? show(c.expr) : "‹ drop a field ›" };
    case "amountWords":
      return { ...c, type: "label", text: c.expr ? `words(${c.expr})` : "‹ amount in words ›" };
    case "signature":
      c.nameExpr = c.nameExpr ? lit(show(c.nameExpr)) : "";
      c.label = String(c.label || "").replace(TOKEN, (_, e) => show(e));
      break;
    case "barcode":
    case "qr":
      c.expr = lit(c.expr ? "123456789012" : "");
      break;
    case "richtext":
      if (c.htmlExpr) {
        c.html = `<i>${show(c.htmlExpr)}</i>`;
        delete c.htmlExpr;
      } else c.html = String(c.html || "").replace(TOKEN, (_, e) => show(e));
      break;
    case "table":
      c.dataset = "__design";
      c.filter = "";
      c.sortBy = "";
      c.columns = (c.columns || []).map((col) => ({
        ...col,
        header: String(col.header || "").replace(TOKEN, (_, e) => show(e)),
        expr: lit(col.expr ? show(col.expr) : ""),
        format: undefined,
        footerExpr: col.footerExpr ? lit(show(col.footerExpr)) : "",
        footerText: String(col.footerText || "").replace(TOKEN, (_, e) => show(e)),
      }));
      break;
    default:
      break;
  }
  return c;
}

/** Hover text: the expression, its sample value and where the field comes from (result set ← procedure). */
function hoverTip(el, ctx, sources) {
  const ex = el.expr || el.dataset || el.nameExpr || el.htmlExpr || (el.type === "label" || el.type === "heading" ? (String(el.text || "").match(/\{\{([\s\S]+?)\}\}/) || [])[1] : "");
  if (!ex) return `${el.type} · ${el.id}`;
  let v;
  try {
    v = evaluate(String(ex).trim(), ctx);
  } catch {
    v = undefined;
  }
  const shown = v == null ? "(empty)" : Array.isArray(v) ? `${v.length} rows` : typeof v === "object" ? "{…}" : String(v).slice(0, 80);
  const root = String(ex).trim().match(/^([A-Za-z_]\w*)/)?.[1];
  const set = sources && root && sources[root] ? root : ctx.row && sources ? Object.keys(sources).find((s) => Array.isArray(ctx.data?.[s]) && ctx.data[s].includes(ctx.row)) : null;
  const src = set ? `\nfrom ${set}${sources[set] ? ` ← ${sources[set]}` : ""}` : root && ["params", "user", "centre", "header", "sys"].includes(root) ? `\nfrom ${root} (added by the API)` : "";
  return `${String(ex).trim()}\n= ${shown}${src}`;
}

const EMPTY_HINT = {
  pageHeader: "Page header — logo, hospital name, address. Drop from Insert, Data or Blocks.",
  reportHeader: "Report header — prints once: title, patient details, bill info.",
  groupHeader: "Group header — a heading each time the group changes (e.g. new department).",
  detail: "Content rows — one copy per data row. Drop row fields here.",
  groupFooter: "Group footer — sub-totals: sum(Amount) adds up the group.",
  reportFooter: "Report footer — totals, amount in words, signatures.",
  pageFooter: "Page footer — page numbers, carried forward, print date.",
};

const ElementView = memo(function ElementView({ el, ctx, showData, selected, primary, sources, onPointerDown, onHandleDown, children }) {
  const html = useMemo(() => {
    if (el.type === "section") return "";
    const shown = showData ? el : bindingView(el);
    const c = showData ? ctx : { ...ctx, data: { ...ctx.data, __design: [{}, {}] } };
    const inner = renderElementHtml(shown, c, { design: true, maxRows: 40, assetUrl });
    return `<div class="pb-el pb-el-${shown.type}" style="position:absolute;left:0;top:0;width:100%;height:100%;${elementCss(shown, ctx.theme)}">${inner}</div>`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(el), ctx, showData]);
  const sectionCss = el.type === "section" ? cssObject(elementCss(el, ctx.theme)) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tip = useMemo(() => (el.type === "section" ? undefined : hoverTip(el, ctx, sources)), [JSON.stringify(el), ctx, sources]);
  // The engine's HTML goes into a shadow root with the engine's stylesheet, so
  // the app's own CSS cannot restyle it (it does: global table/td rules).
  const host = useRef(null);
  useLayoutEffect(() => {
    const h = host.current;
    if (!h) return;
    const root = h.shadowRoot || h.attachShadow({ mode: "open" });
    if (!root.adoptedStyleSheets.length) root.adoptedStyleSheets = [engineSheet()];
    root.innerHTML = html;
  }, [html]);
  return (
    <div
      className={`pbx-el type-${el.type}${selected ? " is-selected" : ""}${primary ? " is-primary" : ""}${el.locked ? " is-locked" : ""}${el._off ? " is-off" : ""}`}
      data-el-id={el.id}
      data-type={el.type}
      title={tip}
      style={{ left: `${el.x}mm`, top: `${el.y}mm`, width: `${el.w}mm`, height: `${el.h}mm`, ...(sectionCss || {}) }}
      onPointerDown={(e) => onPointerDown(e, el)}
    >
      {el.type === "section" ? children : <div className="pbx-el-render" ref={host} />}
      {el.visibleIf ? <span className="pbx-el-flag" title={`Shown only if ${el.visibleIf}`}>if</span> : null}
      {Array.isArray(el.showOn) ? <span className="pbx-el-flag is-off" title={`Old per-paper flag (shown on ${el.showOn.join(", ") || "—"}) — Page setup › Convert to single master removes it`}>flag</span> : null}
      {primary && !el.locked && (
        <>
          {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((h) => (
            <span key={h} className={`pbx-handle h-${h}`} onPointerDown={(e) => onHandleDown(e, el, h)} />
          ))}
        </>
      )}
    </div>
  );
});

/** "a:b;c:d" → { a: "b", c: "d" } (camelCased) for React style. */
function cssObject(css) {
  const o = {};
  String(css || "")
    .split(";")
    .forEach((d) => {
      const i = d.indexOf(":");
      if (i < 0) return;
      const k = d.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (k && !["display", "flexDirection", "justifyContent"].includes(k)) o[k] = d.slice(i + 1).trim();
    });
  return o;
}

export default function Canvas({ zoom, showData, sample, onStatus, sources, overlay, overlayUrl }) {
  const d = useDesigner();
  const { tpl, sel } = d.state;
  const sheetRef = useRef(null);
  const [drag, setDrag] = useState(null); // live drag info for guides / marquee
  const [addOpen, setAddOpen] = useState(false);
  const S = PX_PER_MM * zoom;
  // the master paper, as designed (k = 1): what is edited here is what every other paper is laid out from
  const geo = useMemo(() => {
    const mp = masterPage(tpl.page || {});
    const l = resolveLayout(tpl, { size: mp.size || "A4", orientation: mp.orientation, width: mp.width, height: mp.height });
    return { w: l.width, h: l.height, roll: l.roll, m: l.margins, cw: l.contentWidth, k: 1, dw: l.designWidth, profile: l.profile, lay: l };
  }, [tpl]);
  // elements are drawn as stored (the master); kept as a map so section children resolve the same way
  const view = useMemo(() => {
    const v = tpl;
    const byId = new Map();
    const walk = (el) => {
      byId.set(el.id, el);
      (el.children || []).forEach(walk);
    };
    (v.bands || []).forEach((b) => (b.elements || []).forEach(walk));
    return { byId, theme: v.theme || {} };
  }, [tpl, geo]);

  const bands = tpl.bands || [];
  const tops = useMemo(() => {
    const t = {};
    let y = 0;
    for (const b of bands) {
      t[b.id] = y;
      y += Number(b.height) || 0;
    }
    t.__total = y;
    return t;
  }, [bands]);
  const contentH = tops.__total;
  const sheetH = Math.max(geo.roll ? 0 : geo.h, geo.m.top + contentH + geo.m.bottom + 6);

  // Contexts depend only on the data, the theme and the bands' bindings — not on
  // element edits — so moving one element does not re-render every other one.
  const themeKey = JSON.stringify(tpl.theme || {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const theme = useMemo(() => view.theme || tpl.theme || {}, [themeKey, geo.profile]);
  // the canvas shows the designed text: label translations (data.i18n) are for previews and prints only
  const data = useMemo(() => {
    if (!sample?.i18n) return sample || {};
    const { i18n, ...rest } = sample; // eslint-disable-line no-unused-vars
    return rest;
  }, [sample]);
  const bandKey = JSON.stringify(bands.map((b) => [b.id, b.type, b.groupBy, b.dataset, b.sortBy, b.sortDesc, b.filter]));
  const detail = bands.find((b) => b.type === "detail");
  const baseCtx = useMemo(() => ({ data, row: null, rows: [], vars: { page: 1, pages: 1 }, theme }), [data, theme]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const detailRows = useMemo(() => (detail && sample ? datasetRows(detail.dataset, baseCtx, detail) : []), [bandKey, sample, baseCtx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ctxByBand = useMemo(() => {
    const out = {};
    for (const b of bands) {
      if (["detail", "groupHeader", "groupFooter"].includes(b.type)) {
        const row = detailRows[0] || null;
        const c = { ...baseCtx, row, rows: detailRows, vars: { page: 1, pages: 1, rowNumber: 1, rowIndex: 0, groupCount: detailRows.length } };
        if (b.groupBy && row) {
          const g = evaluate(b.groupBy, c);
          c.vars.group = typeof g === "object" ? "" : g;
          c.rows = detailRows.filter((r) => String(evaluate(b.groupBy, { ...c, row: r }) ?? "") === String(c.vars.group ?? ""));
          c.vars.groupCount = c.rows.length;
        } else if (b.groupBy) c.vars.group = "Group";
        out[b.id] = c;
      } else out[b.id] = { ...baseCtx, rows: detailRows };
    }
    return out;
  }, [bandKey, baseCtx, detailRows]);

  /* --------------------------------------------------------- geometry */
  const toMm = useCallback(
    (clientX, clientY) => {
      const r = sheetRef.current.getBoundingClientRect();
      const z = zoomOf(sheetRef.current); // the builder UI is CSS-zoomed (ui/zoom.js)
      return { x: ((clientX - r.left) / z / S - geo.m.left) / geo.k, y: (clientY - r.top) / z / S - geo.m.top };
    },
    [S, geo],
  );
  const bandAt = (yMm) => {
    for (const b of bands) if (yMm >= tops[b.id] && yMm < tops[b.id] + b.height) return b;
    return yMm < 0 ? bands[0] : bands[bands.length - 1];
  };
  const snapV = roundMm;

  /* ---------------------------------------------------- element drags */
  const onElementDown = useCallback(
    (e, el) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const f = findEl(tpl, el.id);
      if (!f) return;
      let ids = sel;
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        ids = sel.includes(el.id) ? sel.filter((i) => i !== el.id) : [...sel, el.id];
        d.select(ids, f.band.id);
        return;
      }
      if (!sel.includes(el.id)) {
        ids = [el.id];
        d.select(ids, f.band.id);
      }
      if (el.locked) return;
      const start = toMm(e.clientX, e.clientY);
      const items = ids.map((id) => findEl(tpl, id)).filter((x) => x && !x.el.locked).map((x) => ({ id: x.el.id, x: x.el.x, y: x.el.y, w: x.el.w, h: x.el.h, band: x.band.id, inSection: !!x.parent }));
      const primary = items.find((i) => i.id === el.id) || items[0];
      if (!primary) return;
      const others = (f.parent ? f.parent.children : f.band.elements).filter((x) => !ids.includes(x.id));
      const xs = [0, geo.dw, geo.dw / 2, ...others.flatMap((o) => [o.x, o.x + o.w, o.x + o.w / 2])];
      const ys = [0, f.band.height, ...others.flatMap((o) => [o.y, o.y + o.h, o.y + o.h / 2])];
      const key = `move:${Date.now()}`;
      let moved = false;
      const target = e.currentTarget;
      target.setPointerCapture?.(e.pointerId);
      const move = (ev) => {
        const p = toMm(ev.clientX, ev.clientY);
        let dx = p.x - start.x;
        let dy = p.y - start.y;
        if (!moved && Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) return;
        moved = true;
        let nx = snapV(primary.x + dx);
        let ny = snapV(primary.y + dy);
        const guides = [];
        const near = (val, cands) => cands.find((c) => Math.abs(c - val) <= SNAP_EDGE / Math.max(zoom, 0.5));
        for (const [edge, off] of [["l", 0], ["c", primary.w / 2], ["r", primary.w]]) {
          const c = near(primary.x + dx + off, xs);
          if (c != null) {
            nx = roundMm(c - off);
            guides.push({ v: true, at: c });
            break;
          }
          void edge;
        }
        for (const off of [0, primary.h / 2, primary.h]) {
          const c = near(primary.y + dy + off, ys);
          if (c != null) {
            ny = roundMm(c - off);
            guides.push({ v: false, at: c, band: primary.band });
            break;
          }
        }
        dx = nx - primary.x;
        dy = ny - primary.y;
        setDrag({ kind: "move", guides, band: primary.band });
        d.updateEls(items.map((i) => i.id), (x) => {
          const s = items.find((i) => i.id === x.id);
          x.x = Math.max(0, roundMm(s.x + dx));
          x.y = roundMm(s.y + dy);
        }, key);
      };
      const up = (ev) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDrag(null);
        if (!moved) return;
        // dropped below/above its band → move into the band under the pointer
        const p = toMm(ev.clientX, ev.clientY);
        const over = bandAt(p.y);
        const allSame = items.every((i) => i.band === primary.band && !i.inSection);
        if (over && over.id !== primary.band && allSame) {
          const shift = tops[primary.band] - tops[over.id];
          d.update((t) => {
            const from = t.bands.find((b) => b.id === primary.band);
            const to = t.bands.find((b) => b.id === over.id);
            for (const it of items) {
              const idx = from.elements.findIndex((x) => x.id === it.id);
              if (idx < 0) continue;
              const [elx] = from.elements.splice(idx, 1);
              elx.y = Math.max(0, roundMm(elx.y + shift));
              to.elements.push(elx);
              if (elx.y + elx.h > to.height) to.height = roundMm(elx.y + elx.h + 1);
            }
          }, key, { band: over.id });
          onStatus?.(`Moved to ${bandMeta(over.type).label}`);
        } else {
          // clamp inside the band; grow the band when something hangs below it
          d.update((t) => {
            for (const it of items) {
              const f2 = findEl(t, it.id);
              if (!f2) continue;
              if (f2.el.y < 0) f2.el.y = 0;
              if (!f2.parent && f2.el.y + f2.el.h > f2.band.height) f2.band.height = roundMm(f2.el.y + f2.el.h);
            }
          }, key);
        }
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tpl, sel, toMm, zoom, geo, tops],
  );

  const onHandleDown = useCallback(
    (e, el, h) => {
      e.stopPropagation();
      e.preventDefault();
      const start = toMm(e.clientX, e.clientY);
      el = findEl(tpl, el.id)?.el || el; // the drawn copy is reflowed; edit the stored one
      const s = { x: el.x, y: el.y, w: el.w, h: el.h };
      const key = `resize:${el.id}:${Date.now()}`;
      const move = (ev) => {
        const p = toMm(ev.clientX, ev.clientY);
        const dx = p.x - start.x;
        const dy = p.y - start.y;
        let { x, y, w, h: hh } = s;
        if (h.includes("e")) w = snapV(s.x + s.w + dx) - s.x;
        if (h.includes("s")) hh = snapV(s.y + s.h + dy) - s.y;
        if (h.includes("w")) {
          x = snapV(s.x + dx);
          w = s.x + s.w - x;
        }
        if (h.includes("n")) {
          y = snapV(s.y + dy);
          hh = s.y + s.h - y;
        }
        if (ev.shiftKey && (el.type === "qr" || el.type === "image")) hh = w;
        d.updateEls([el.id], (x2) => {
          x2.x = Math.max(0, roundMm(x));
          x2.y = Math.max(0, roundMm(y));
          x2.w = Math.max(1, roundMm(w));
          x2.h = Math.max(0.5, roundMm(hh));
        }, key);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        d.update((t) => {
          const f = findEl(t, el.id);
          if (f && !f.parent && f.el.y + f.el.h > f.band.height) f.band.height = roundMm(f.el.y + f.el.h);
        }, key);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toMm, tpl],
  );

  /* -------------------------------------------------- band interactions */
  const onBandDown = (e, band) => {
    if (e.button !== 0 || e.target.closest(".pbx-el")) return;
    e.stopPropagation();
    const start = toMm(e.clientX, e.clientY);
    const y0 = tops[band.id];
    d.select([], band.id);
    const move = (ev) => {
      const p = toMm(ev.clientX, ev.clientY);
      const r = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y) - y0, w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) };
      setDrag({ kind: "marquee", band: band.id, r });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const p = toMm(ev.clientX, ev.clientY);
      const r = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y) - y0, w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) };
      setDrag(null);
      if (r.w < 0.8 && r.h < 0.8) return;
      const hit = band.elements.filter((el) => el.x < r.x + r.w && el.x + el.w > r.x && el.y < r.y + r.h && el.y + el.h > r.y).map((el) => el.id);
      d.select(hit, band.id);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onBandResize = (e, band) => {
    e.stopPropagation();
    e.preventDefault();
    const start = toMm(e.clientX, e.clientY);
    const h0 = band.height;
    const key = `bandh:${band.id}:${Date.now()}`;
    const move = (ev) => {
      const p = toMm(ev.clientX, ev.clientY);
      const nh = Math.max(2, snapV(h0 + p.y - start.y));
      d.updateBand(band.id, (b) => {
        b.height = nh;
      }, key);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* ----------------------------------------------------------- drops */
  const onDrop = (e, band) => {
    e.preventDefault();
    const tool = e.dataTransfer.getData("application/x-pb-tool");
    const fieldRaw = e.dataTransfer.getData("application/x-pb-field");
    const p = toMm(e.clientX, e.clientY);
    const x = Math.max(0, snapV(p.x));
    const y = Math.max(0, snapV(p.y - tops[band.id]));
    const targetEl = e.target.closest?.(".pbx-el");
    const target = targetEl ? findEl(tpl, targetEl.getAttribute("data-el-id")) : null;
    const blockRaw = e.dataTransfer.getData("application/x-pb-block");
    if (blockRaw) {
      let info;
      try {
        info = JSON.parse(blockRaw);
      } catch {
        return;
      }
      findBlock(info.code).then((blk) => {
        if (!blk) return;
        const bx = fitWidth(blk, geo.dw) ? 0 : Math.min(x, Math.max(0, roundMm(geo.dw - blk.width)));
        if (info.linked) d.addElement(band.id, blockSection(blk, bx, y, geo.dw));
        else {
          const els = blockElements(blk, bx, y, geo.dw);
          d.update((t) => {
            const b = t.bands.find((bb) => bb.id === band.id);
            b.elements.push(...els);
            const bottom = Math.max(...els.map((el) => el.y + el.h));
            if (bottom > b.height) b.height = roundMm(bottom + 1);
          }, null, { sel: els.map((el) => el.id), band: band.id });
        }
        onStatus?.(`${blk.name} added to ${bandMeta(band.type).label}`);
      });
      return;
    }

    if (tool) {
      if (target && target.el.type === "section") {
        const el = makeElement(tool, Math.max(0, roundMm(x - target.el.x)), Math.max(0, roundMm(y - target.el.y)));
        d.update((t) => {
          const f = findEl(t, target.el.id);
          f.el.children = [...(f.el.children || []), el];
        }, null, { sel: [el.id], band: band.id });
        return;
      }
      const el = makeElement(tool, x, y, tool === "table" ? { w: Math.min(geo.dw, 186) } : {});
      if (el.x + el.w > geo.dw) el.x = Math.max(0, roundMm(geo.dw - el.w));
      d.addElement(band.id, el);
      onStatus?.(`${toolMeta(tool)?.label || tool} added to ${bandMeta(band.type).label}`);
      return;
    }
    if (!fieldRaw) return;
    let f;
    try {
      f = JSON.parse(fieldRaw);
    } catch {
      return;
    }
    // a result set dropped on a band → a table with its first columns
    if (f.kind === "set") {
      const cols = (f.fields || []).slice(0, 6).map((name, i) => ({ id: `c${i}${Date.now().toString(36)}`, header: name.replace(/([a-z])([A-Z])/g, "$1 $2"), expr: name, width: 20 }));
      const el = makeElement("table", 0, y, { dataset: f.path, columns: cols, w: geo.dw });
      d.addElement(band.id, el);
      onStatus?.(`Table bound to ${f.path}`);
      return;
    }
    const rowScoped = ["detail", "groupHeader", "groupFooter"].includes(band.type);
    const detailSet = detail ? setNameOf(detail.dataset) : null;
    const exprFor = (scopeSet) => (f.set && f.set === scopeSet && f.field ? f.field : f.path);
    if (target) {
      const t = target.el;
      if (t.type === "table") {
        const set = setNameOf(t.dataset);
        if (!f.set || (set && f.set !== set)) {
          onStatus?.(`Drop a field of ${set || "the table's row set"} on this table`);
          return;
        }
        d.updateEls([t.id], (x2) => {
          if (!x2.dataset) x2.dataset = f.set;
          x2.columns = [...(x2.columns || []), { id: `c${Date.now().toString(36)}`, header: f.field.replace(/([a-z])([A-Z])/g, "$1 $2"), expr: f.field, width: 20 }];
        });
        onStatus?.(`Column ${f.field} added`);
        return;
      }
      const scopeSet = rowScoped ? detailSet : null;
      const ex = exprFor(scopeSet);
      d.updateEls([t.id], (x2) => {
        if (["field", "amountWords", "barcode", "qr"].includes(x2.type)) x2.expr = ex;
        else if (x2.type === "label" || x2.type === "heading") x2.text = `${x2.text && x2.text !== "Label" ? `${x2.text} ` : ""}{{${ex}}}`;
        else if (x2.type === "image") {
          x2.source = "expr";
          x2.expr = ex;
        } else if (x2.type === "signature") x2.nameExpr = ex;
      });
      d.select([t.id], band.id);
      onStatus?.(`Bound to ${ex}`);
      return;
    }
    // empty space → caption + value pair (Alt: value only)
    const ex = exprFor(rowScoped ? detailSet : null);
    const value = makeElement("field", e.altKey ? x : x + 28, y, { expr: ex, w: 45 });
    if (e.altKey) d.addElement(band.id, value);
    else {
      const caption = makeElement("label", x, y, { text: `${(f.field || f.path.split(".").pop()).replace(/([a-z])([A-Z])/g, "$1 $2")}`, w: 27, style: { color: "#6b7280" } });
      d.update((t) => {
        const b = t.bands.find((bb) => bb.id === band.id);
        b.elements.push(caption, value);
        if (y + 5 > b.height) b.height = roundMm(y + 6);
      }, null, { sel: [caption.id, value.id], band: band.id });
    }
    onStatus?.(`${ex} placed`);
  };

  /* ---------------------------------------------------------- render */
  const sheetStyle = {
    width: `${geo.w}mm`,
    height: `${sheetH}mm`,
    transform: `scale(${zoom})`,
    fontFamily: fontStack(theme.fontFamily),
    fontSize: `${theme.fontSize || 9}pt`,
    lineHeight: theme.lineHeight || 1.35,
    color: theme.color || "#1f2937",
    "--pb-accent": theme.accent || "#0f766e",
    "--pb-accent-soft": hexA(theme.accent || "#0f766e", 0.1),
  };
  const scaledW = geo.w * S;
  const scaledH = sheetH * S;
  const selSet = new Set(sel);
  const primaryId = sel.length === 1 ? sel[0] : null;

  const renderEls = (list, band) =>
    list.map((el) => (
      <ElementView
        key={el.id}
        el={view.byId.get(el.id) || el}
        sources={sources}
        ctx={ctxByBand[band.id]}
        showData={showData && !!sample}
        selected={selSet.has(el.id)}
        primary={primaryId === el.id}
        onPointerDown={onElementDown}
        onHandleDown={onHandleDown}
      >
        {el.type === "section" ? renderEls(el.children || [], band) : null}
      </ElementView>
    ));

  return (
    <div className="pbx-stage" style={{ width: scaledW + GUTTER_L + 60, height: scaledH + GUTTER_T + 80 }}>
      <Ruler horizontal lengthMm={geo.w} S={S} offset={GUTTER_L} margin={[geo.m.left, geo.m.right]} />
      <Ruler lengthMm={sheetH} S={S} offset={GUTTER_T} margin={[geo.m.top, geo.roll ? 0 : geo.m.bottom]} left={GUTTER_L - 22} />
      {/* band labels, unscaled */}
      {bands.map((b) => {
        const meta = bandMeta(b.type);
        const nm = bandName(b, bands);
        const top = GUTTER_T + (geo.m.top + tops[b.id]) * S;
        const px = b.height * S;
        const active = d.state.band === b.id && !sel.length;
        const where = b.type === "detail" && b.dataset ? `↻ each row of ${b.dataset}` : b.groupBy ? `grouped by ${b.groupBy}` : null;
        return (
          <Tap
            key={b.id}
            className={`pbx-bandtag tone-${meta.tone}${active ? " is-active" : ""}${px < 30 ? " is-compact" : ""}${px < 46 ? " is-short" : ""}`}
            style={{ top, height: Math.max(18, px), width: GUTTER_L - 30 }}
            onClick={() => d.select([], b.id)}
            aria-label={`${nm.title}: ${nm.sub}. ${meta.hint}`}
          >
            <span className="pbx-bandtag-zone">{nm.zone}</span>
            <span className="pbx-bandtag-name">
              <Icon name={meta.icon} size={11} />
              <span>{nm.title}</span>
            </span>
            <span className="pbx-bandtag-sub">{where ? `${meta.label} · ${where}` : nm.sub}</span>
            <span className="pbx-bandtag-mm">{+Number(b.height).toFixed(1)} mm</span>
            <BandTip meta={meta} type={b.type} />
          </Tap>
        );
      })}
      <div className="pbx-sheet-box" style={{ left: GUTTER_L, top: GUTTER_T, width: scaledW, height: scaledH }}>
        <div ref={sheetRef} className="pbx-sheet" style={sheetStyle}>
          {overlay?.visible !== false && overlayUrl && (
            // the old print, faded under the layout while it is matched (design only, never printed)
            <img
              className="pbx-overlay"
              src={overlayUrl}
              alt=""
              draggable={false}
              style={{ left: `${Number(overlay.dx) || 0}mm`, top: `${Number(overlay.dy) || 0}mm`, width: `${geo.w * (Number(overlay.scale) || 1)}mm`, opacity: Number(overlay.opacity ?? 0.35), mixBlendMode: overlay.blend || "multiply" }}
            />
          )}
          <div className="pbx-margins" style={{ left: `${geo.m.left}mm`, top: `${geo.m.top}mm`, width: `${geo.cw}mm`, height: `${geo.roll ? contentH : geo.h - geo.m.top - geo.m.bottom}mm` }} />
          {!geo.roll && sheetH > geo.h + 0.5 && <div className="pbx-pageend" style={{ top: `${geo.h}mm` }}><span>page 1 ends — design view, the print paginates</span></div>}
          <div className="pbx-content" style={{ left: `${geo.m.left}mm`, top: `${geo.m.top}mm`, width: `${geo.cw}mm` }}>
            {bands.map((b) => {
              const active = d.state.band === b.id;
              return (
                <div
                  key={b.id}
                  className={`pbx-band band-${b.type}${active ? " is-active" : ""}`}
                  data-band-id={b.id}
                  style={{ height: `${b.height}mm`, background: b.background || undefined }}
                  onPointerDown={(e) => onBandDown(e, b)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => onDrop(e, b)}
                >
                  {renderEls(b.elements || [], b)}
                  {!(b.elements || []).length && b.height * S >= 16 && <div className={`pbx-band-empty band-${b.type}`}>{EMPTY_HINT[b.type]}</div>}
                  {tpl.labels?.enabled && b.type === "detail" && (
                    // label sheets: the detail band is one label; show its edge so content stays inside it
                    <div className="pbx-labelguide" style={{ width: `${(Number(tpl.labels.width) || 50) * geo.k}mm`, height: `${Number(tpl.labels.height) || 25}mm` }}>
                      <span>
                        label {+Number(tpl.labels.width || 50).toFixed(1)} × {+Number(tpl.labels.height || 25).toFixed(1)} mm
                      </span>
                    </div>
                  )}
                  {drag?.kind === "marquee" && drag.band === b.id && (
                    <div className="pbx-marquee" style={{ left: `${drag.r.x * geo.k}mm`, top: `${drag.r.y}mm`, width: `${drag.r.w * geo.k}mm`, height: `${drag.r.h}mm` }} />
                  )}
                  {drag?.kind === "move" &&
                    drag.band === b.id &&
                    drag.guides.map((g, i) =>
                      g.v ? (
                        <div key={i} className="pbx-guide is-v" style={{ left: `${g.at * geo.k}mm` }} />
                      ) : (
                        <div key={i} className="pbx-guide is-h" style={{ top: `${g.at}mm` }} />
                      ),
                    )}
                  <span className="pbx-band-resize" onPointerDown={(e) => onBandResize(e, b)} title="Drag to change the band height" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="pbx-addband" style={{ left: GUTTER_L, top: GUTTER_T + scaledH + 14 }}>
        <Tap tone="add" onClick={() => setAddOpen((o) => !o)}>
          ＋ Add section
        </Tap>
        {addOpen && (
          <div className="pbx-menu" onMouseLeave={() => setAddOpen(false)}>
            {BAND_TYPES.map((bt) => (
              <Tap
                key={bt.type}
                className={`pbx-menu-item pbx-bandpick tone-${bt.tone}`}
                onClick={() => {
                  const nb = makeBand(bt.type);
                  d.update((t) => {
                    t.bands.push(nb);
                  }, null, { sel: [], band: nb.id });
                  setAddOpen(false);
                }}
              >
                <span className="pbx-bandpick-ic">
                  <Icon name={bt.icon} size={13} />
                </span>
                <span className="pbx-bandpick-txt">
                  <b>{bt.label}</b>
                  <small>
                    {bt.hint} · {bt.use}
                  </small>
                </span>
              </Tap>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * Where each kind of section lands, drawn on two small pages: [page, y, h] in a
 * 34 x 46 page; the band being explained is coloured, the rest stays grey.
 */
const SKETCH = {
  pageHeader: [[0, 3, 5], [1, 3, 5]],
  reportHeader: [[0, 9, 7]],
  groupHeader: [[0, 17, 2], [1, 21, 2]],
  detail: [[0, 20, 2], [0, 23, 2], [0, 26, 2], [0, 29, 2], [1, 9, 2], [1, 12, 2], [1, 15, 2], [1, 18, 2], [1, 24, 2]],
  groupFooter: [[0, 32, 2], [1, 27, 2]],
  reportFooter: [[1, 30, 7]],
  pageFooter: [[0, 39, 4], [1, 39, 4]],
};

/**
 * Hover card for a section tag. Portalled to <body> in its own .pbx layer and placed
 * beside the tag with fixed coordinates, so the page sheet and the scrolling canvas
 * never cover or clip it. Listens on its tag (the parent element) itself, so hovering
 * re-renders only the card, not the canvas.
 */
function BandTip({ meta, type }) {
  const anchorRef = useRef(null);
  const cardRef = useRef(null);
  const [at, setAt] = useState(null);
  useEffect(() => {
    const tag = anchorRef.current?.parentElement;
    if (!tag) return undefined;
    let timer = 0;
    const show = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const r = tag.getBoundingClientRect();
        setAt({ x: r.right + 12, y: r.top, mid: r.top + Math.min(r.height, 60) / 2 });
      }, 280);
    };
    const hide = () => {
      clearTimeout(timer);
      setAt(null);
    };
    const events = [["mouseenter", show], ["mouseleave", hide], ["focus", show], ["blur", hide], ["pointerdown", hide]];
    events.forEach(([n, f]) => tag.addEventListener(n, f));
    window.addEventListener("scroll", hide, true);
    return () => {
      clearTimeout(timer);
      events.forEach(([n, f]) => tag.removeEventListener(n, f));
      window.removeEventListener("scroll", hide, true);
    };
  }, []);
  // keep the card on screen: clamp it to the viewport, the arrow still points at the tag
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el || !at) return;
    // screen pixels → the layer's zoomed CSS pixels
    const z = uiZoom();
    const h = el.offsetHeight * z;
    const top = Math.max(8, Math.min(at.y - 6, window.innerHeight - h - 8));
    el.style.left = `${at.x / z}px`;
    el.style.top = `${top / z}px`;
    el.style.setProperty("--arrow", `${Math.max(14, Math.min(h - 14, at.mid - top)) / z}px`);
  }, [at]);
  return (
    <span ref={anchorRef} className="pbx-bandtip-anchor" aria-hidden="true">
      {at &&
        createPortal(
          <div className="pbx pbx-tip-layer">
            <div ref={cardRef} className={`pbx-bandtip tone-${meta.tone}`} role="tooltip">
              <div className="pbx-bandtip-head">
                <span className="pbx-bandtip-ic">
                  <Icon name={meta.icon} size={15} />
                </span>
                <span className="pbx-bandtip-title">
                  <b>{meta.label}</b>
                  <small>{meta.tech}</small>
                </span>
                <span className="pbx-bandtip-zone">{meta.zone}</span>
              </div>
              <div className="pbx-bandtip-body">
                <svg viewBox="0 0 80 56" width="112" height="78" aria-hidden="true">
                  {[0, 1].map((p) => (
                    <g key={p} transform={`translate(${2 + p * 42} 2)`}>
                      <rect x="0" y="0" width="34" height="46" rx="2.5" fill="#fff" stroke="#d6dbe4" />
                      {Object.entries(SKETCH).flatMap(([t, rs]) =>
                        rs.filter((r) => r[0] === p).map((r, i) => (
                          <rect key={t + i} x="3" y={r[1]} width="28" height={r[2]} rx="0.8" fill={t === type ? "var(--t, #2563eb)" : "#e8ecf2"} opacity={t === type ? 0.92 : 1} />
                        )),
                      )}
                      <text x="17" y="52" textAnchor="middle" fontSize="4" fill="#94a3b8">
                        page {p + 1}
                      </text>
                    </g>
                  ))}
                </svg>
                <div className="pbx-bandtip-text">
                  <p>{meta.hint}.</p>
                  <span className="pbx-bandtip-use">
                    <em>Best for</em>
                    {meta.use}
                  </span>
                </div>
              </div>
              <div className="pbx-bandtip-foot">
                <Icon name="brush" size={11} /> Click the tag to edit this section's settings
              </div>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}

function hexA(hex, a) {
  const m = String(hex).match(/^#?([0-9a-f]{6})$/i);
  if (!m) return `rgba(15,118,110,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** mm ruler; labels every 10 mm, ticks every 1 mm (5 mm when zoomed out). */
function Ruler({ horizontal = false, lengthMm, S, offset, margin, left = 0 }) {
  const step = S < 2.5 ? 5 : 1;
  const ticks = [];
  for (let mm = 0; mm <= lengthMm + 0.001; mm += step) {
    const major = mm % 10 === 0;
    const mid = mm % 5 === 0;
    ticks.push(
      <span
        key={mm}
        className={`pbx-tick${major ? " is-major" : mid ? " is-mid" : ""}`}
        style={horizontal ? { left: mm * S } : { top: mm * S }}
      >
        {major && mm > 0 ? <em>{mm / 10}</em> : null}
      </span>,
    );
  }
  const style = horizontal
    ? { left: offset, top: 6, width: lengthMm * S, height: 20 }
    : { top: offset, left, height: lengthMm * S, width: 20 };
  return (
    <div className={`pbx-ruler ${horizontal ? "is-h" : "is-v"}`} style={style}>
      <span className="pbx-ruler-margin" style={horizontal ? { left: 0, width: margin[0] * S } : { top: 0, height: margin[0] * S }} />
      <span className="pbx-ruler-margin" style={horizontal ? { right: 0, width: margin[1] * S } : { bottom: 0, height: margin[1] * S }} />
      {ticks}
    </div>
  );
}
