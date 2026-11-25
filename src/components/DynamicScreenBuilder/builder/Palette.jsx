/**
 * Component palette. Items are draggable onto the canvas and clickable to
 * append into the current selection (or the root when nothing is selected).
 * Category colours come from the registry so the list stays visually scannable.
 */
import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../registry/icons";
import { COMMON_CATEGORY, HEALTHCARE_CATEGORY, canDrop, listByCategory } from "../registry";
import { HEALTHCARE_PRESETS } from "../registry/presets";
import { useBuilder } from "../store/builderStore";
import { useDnd } from "./DndManager";
import { cloneNode, findNode, findParent } from "../utils/tree";
import { GroupRepo } from "../utils/storage";
import { useCommon } from "./CommonLibrary";
import usePanelFold from "./usePanelFold";
import Tap from "./Tap";

/**
 * Which half of the palette is showing: "common" — the hospital's saved
 * components, already wired to their APIs — or "custom", the registry's own
 * building blocks to make something new from. Remembered per browser; storage
 * that is missing or throws just means it starts on Common.
 */
const VIEW_KEY = "dsb.palette.view";
const SUBS_KEY = "dsb.palette.openSubs";
/** Where the Healthcare presets sit among the Custom side's sections. */
const HEALTH_SLOT = { key: "__healthcare" };
/** The Custom side's section order; a category not listed follows these. */
const CUSTOM_ORDER = ["Form", "Layout", "Data", HEALTH_SLOT.key, "Overlay"];
function usePaletteView() {
  const [view, setView] = useState(() => {
    try {
      return window.localStorage.getItem(VIEW_KEY) === "custom" ? "custom" : "common";
    } catch {
      return "common";
    }
  });
  const pick = (next) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* not remembered — still switches for this session */
    }
  };
  return [view, pick];
}

export default function Palette({ groups, onReloadGroups }) {
  const b = useBuilder();
  const { state } = b;
  const dnd = useDnd();
  const common = useCommon();
  const [q, setQ] = useState("");
  const [folded, toggleFold] = usePanelFold("palette");
  const [view, pickView] = usePaletteView();
  // Common-component categories (IPD, OPD…) the designer has opened. Every
  // category starts closed, so Common Components opens on a short list of
  // headings rather than forty rows. Remembered per browser.
  const [openSubs, setOpenSubs] = useState(() => {
    try {
      const v = JSON.parse(window.localStorage.getItem(SUBS_KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });
  const toggleSub = (cat) =>
    setOpenSubs((s) => {
      const next = s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat];
      try {
        window.localStorage.setItem(SUBS_KEY, JSON.stringify(next));
      } catch {
        /* not remembered — still folds for this session */
      }
      return next;
    });
  /**
   * The switch's tooltip, shown ABOVE its icon. The dock clips its contents
   * (overflow: hidden, for the slide) and there are ~38px above the search
   * row, so the tooltip is drawn on document.body at the icon's position.
   */
  const [tip, setTip] = useState(null);
  const showTip = (o, el) => {
    const r = el.getBoundingClientRect();
    setTip({ ...o, x: r.left + r.width / 2, y: r.top });
  };
  const hideTip = () => setTip(null);
  // Every category starts closed: the list is a set of headings to open, not
  // a wall of icons to scroll past. A search still opens whatever matches.
  // Open by default: Common Components (its categories start closed, above)
  // and Form Controls, the first section on the Custom side. The rest start
  // closed.
  const [openCats, setOpenCats] = useState(() => [COMMON_CATEGORY.key, "Form"]);

  const cats = useMemo(() => {
    const all = listByCategory();
    if (!q.trim()) return all;
    const needle = q.toLowerCase();
    return all
      .map((c) => ({ ...c, items: c.items.filter((i) => i.label.toLowerCase().includes(needle) || i.type.toLowerCase().includes(needle)) }))
      .filter((c) => c.items.length);
  }, [q]);

  /**
   * The saved common components (utils/commonComponents), filtered by the same
   * search box and grouped by the category they were saved under — a flat list
   * of forty panels is not a palette either.
   */
  const commonItems = useMemo(() => {
    const list = common?.items || [];
    const needle = q.trim().toLowerCase();
    const hits = !needle
      ? list
      : list.filter((c) =>
          [c.name, c.category, c.description, c.rootType].some((v) => String(v || "").toLowerCase().includes(needle)),
        );
    const byCat = {};
    hits.forEach((c) => {
      const key = c.category || "General";
      (byCat[key] = byCat[key] || []).push(c);
    });
    return { hits, byCat };
  }, [common?.items, q]);

  /** Where a click-to-add should land: the selected container, else its parent. */
  const resolveParent = (type) => {
    const sel = state.selectedIds[0];
    const root = state.screen.root;
    if (!sel) return root.id;
    const node = findNode(root, sel);
    if (!node) return root.id;
    if (canDrop(node.type, type)) return node.id;
    const parent = findParent(root, sel);
    if (parent && canDrop(parent.type, type)) return parent.id;
    return root.id;
  };

  const commonOpen = openCats.includes(COMMON_CATEGORY.key) || !!q;
  const healthOpen = openCats.includes(HEALTHCARE_CATEGORY.key) || !!q;
  const toggleCat = (key) => setOpenCats((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));

  const presets = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return HEALTHCARE_PRESETS;
    return HEALTHCARE_PRESETS.filter((p) => [p.label, p.hint, p.id].some((v) => String(v || "").toLowerCase().includes(needle)));
  }, [q]);

  // What each side of the switch holds right now — the badge on each half, and
  // the "found on the other side" hint when a search comes up empty here.
  const commonCount = commonItems.hits.length;
  const customCount =
    presets.length + cats.reduce((n, c) => n + c.items.length, 0) + (q.trim() ? 0 : groups?.length || 0);
  const isCommon = view === "common";
  const hereCount = isCommon ? commonCount : customCount;
  const thereCount = isCommon ? customCount : commonCount;

  /** A preset is a ready-made subtree: fresh ids every time it is placed. */
  const addPreset = (preset) => b.addSubtree(preset.build(), resolveParent(preset.rootType), -1);

  const add = (def) => {
    const parentId = resolveParent(def.type);
    b.addComponent(def.type, parentId, -1);
  };

  return (
    <aside className={`dsb-panel-left ${folded ? "is-folded" : ""}`}>
      {tip && !folded
        ? createPortal(
            <div
              id="dsb-pal-tip"
              role="tooltip"
              className={`dsb-pal-tip is-${tip.id}`}
              style={{ left: tip.x, top: tip.y }}
            >
              <b>{tip.label} components</b>
              <small>{tip.tip}</small>
            </div>,
            document.body,
          )
        : null}
      <Tap
        className="dsb-fold-head"
        aria-expanded={!folded}
        title={folded ? "Show the components" : "Fold the components away"}
        onClick={toggleFold}
      >
        <Icon name={folded ? "ChevronRight" : "ChevronDown"} size={13} className="dsb-fold-chev" />
        <Icon name="Boxes" size={13} />
        <span>Components</span>
      </Tap>
      {folded ? null : (
      <>
      <div className="dsb-pal-search">
        <Icon name="Search" size={13} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isCommon ? "Search common…" : "Search components…"} />
        {q ? (
          <button type="button" onClick={() => setQ("")}>
            <Icon name="X" size={12} />
          </button>
        ) : null}
        <div className={`dsb-pal-switch is-${view}`} role="tablist" aria-label="Which components to show">
          <span className="dsb-pal-switch-thumb" aria-hidden="true" />
          {[
            { id: "common", icon: "SquareStack", label: "Common", tip: "This hospital's saved components — wired to their APIs" },
            { id: "custom", icon: "LayoutGrid", label: "Custom", tip: "Build your own — layout, form controls, tables, overlays" },
          ].map((o) => (
            <Tap
              key={o.id}
              role="tab"
              aria-selected={view === o.id}
              className={`dsb-pal-switch-opt ${view === o.id ? "is-on" : ""}`}
              aria-label={`${o.label} components`}
              aria-describedby={tip?.id === o.id ? "dsb-pal-tip" : undefined}
              onClick={() => pickView(o.id)}
              onMouseEnter={(e) => showTip(o, e.currentTarget)}
              onMouseLeave={hideTip}
              onFocus={(e) => showTip(o, e.currentTarget)}
              onBlur={hideTip}
            >
              <Icon name={o.icon} size={13} />
            </Tap>
          ))}
        </div>
      </div>

      <div className="dsb-pal-body" key={view}>
        {q.trim() && !hereCount && thereCount ? (
          <Tap className="dsb-pal-elsewhere" onClick={() => pickView(isCommon ? "custom" : "common")}>
            <Icon name="ArrowRightLeft" size={12} />
            <span>
              No {isCommon ? "common" : "custom"} match for “{q}” — {thereCount} in {isCommon ? "Custom" : "Common"}. Switch
            </span>
          </Tap>
        ) : null}
        {/* Common: this hospital's own building blocks, already wired to their
            APIs. Custom: the registry's parts to build something new from. */}
        {isCommon ? (
        <section className="dsb-pal-cat">
          <button
            type="button"
            className="dsb-pal-cat-head"
            style={{ "--dsb-cat": COMMON_CATEGORY.color }}
            onClick={() =>
              setOpenCats((o) =>
                o.includes(COMMON_CATEGORY.key) ? o.filter((k) => k !== COMMON_CATEGORY.key) : [...o, COMMON_CATEGORY.key],
              )
            }
          >
            <Icon name={COMMON_CATEGORY.icon} size={13} />
            <span>{COMMON_CATEGORY.label}</span>
            <span className="dsb-pal-n">{common?.loading ? "…" : commonItems.hits.length}</span>
            <Icon name={commonOpen ? "ChevronDown" : "ChevronRight"} size={12} />
          </button>

          {commonOpen ? (
            <div className="dsb-pal-common">
              {Object.entries(commonItems.byCat).map(([cat, list]) => {
                // A search opens every category: a hit hidden in a folded one
                // would read as "no match".
                const shut = !q.trim() && !openSubs.includes(cat);
                return (
                <div key={cat} className={`dsb-pal-sub ${shut ? "is-shut" : ""}`} style={{ "--dsb-cat": COMMON_CATEGORY.color }}>
                  <Tap
                    className="dsb-pal-sub-head"
                    aria-expanded={!shut}
                    title={shut ? `Show ${cat}` : `Fold ${cat} away`}
                    onClick={() => toggleSub(cat)}
                  >
                    <Icon name="ChevronDown" size={11} className="dsb-pal-sub-chev" />
                    <span className="dsb-pal-sub-name">{cat}</span>
                    <span className="dsb-pal-sub-n">{list.length}</span>
                  </Tap>
                  {/* Always rendered, so folding can animate its height; inert
                      while shut so Tab does not walk into hidden rows. */}
                  <div className="dsb-pal-sub-body" {...(shut ? { inert: "" } : {})}>
                  {/* A list, not the two-column grid the registry sections use:
                      these carry names people wrote ("Patient search panel"),
                      which need the width more than they need a big tile. */}
                  <div className="dsb-pal-rows">
                    {list.map((c) => (
                      <div key={c.id} className="dsb-pal-item is-common" style={{ "--dsb-cat": COMMON_CATEGORY.color }}>
                        <button
                          type="button"
                          className="dsb-pal-item-main"
                          title={`${c.name}${c.description ? ` — ${c.description}` : ""}
Drag onto the canvas. Comes with its API, rules and validation.`}
                          onPointerDown={(e) =>
                            dnd?.startDrag(
                              { kind: "common", type: c.rootType || c.node?.type, packId: c.id, label: c.name, icon: c.icon },
                              e,
                            )
                          }
                          onClick={() => common?.place(c, resolveParent(c.rootType || c.node?.type), -1)}
                        >
                          <span className="dsb-pal-ic">
                            <Icon name={c.icon || "SquareStack"} size={13} />
                          </span>
                          <span className="dsb-pal-label">{c.name}</span>
                          {c.apis?.length ? <span className="dsb-pal-flag is-api">api</span> : null}
                        </button>
                        <button
                          type="button"
                          className="dsb-pal-item-del"
                          title={`Delete “${c.name}” for everyone`}
                          onClick={() => common?.requestRemove(c)}
                        >
                          <Icon name="Trash2" size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
                );
              })}

              {!commonItems.hits.length ? (
                <p className="dsb-pal-hint">
                  <Icon name="MousePointerClick" size={12} />
                  <span>
                    {q
                      ? `No common component matches “${q}”.`
                      : "Right-click any component on the canvas → Save as common component. It is saved with its API, label, rules and validation, and everyone gets it here."}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
        ) : (
        <>
        {/* Form Controls, Layout, Data Display — the parts a screen is mostly
            made of — then Healthcare, then anything else in registry order. */}
        {[
          ...CUSTOM_ORDER.map((k) => (k === HEALTH_SLOT.key ? HEALTH_SLOT : cats.find((c) => c.key === k))).filter(Boolean),
          ...cats.filter((c) => !CUSTOM_ORDER.includes(c.key)),
        ].map((cat) => {
          if (cat === HEALTH_SLOT)
            // Clinical building blocks: ready-made subtrees of ordinary
            // components, already labelled and iconned the way a ward screen is.
            return presets.length ? (
          <section key={HEALTHCARE_CATEGORY.key} className="dsb-pal-cat">
            <button
              type="button"
              className="dsb-pal-cat-head"
              style={{ "--dsb-cat": HEALTHCARE_CATEGORY.color }}
              aria-expanded={healthOpen}
              onClick={() => toggleCat(HEALTHCARE_CATEGORY.key)}
            >
              <Icon name={HEALTHCARE_CATEGORY.icon} size={13} />
              <span>{HEALTHCARE_CATEGORY.label}</span>
              <span className="dsb-pal-n">{presets.length}</span>
              <Icon name={healthOpen ? "ChevronDown" : "ChevronRight"} size={12} />
            </button>
            {healthOpen ? (
              <div className="dsb-pal-grid">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="dsb-pal-item is-preset"
                    style={{ "--dsb-cat": HEALTHCARE_CATEGORY.color }}
                    title={`${preset.label}${preset.hint ? ` — ${preset.hint}` : ""}
Drag onto the canvas, or click to add.`}
                    aria-label={`Add ${preset.label}`}
                    onPointerDown={(e) =>
                      dnd?.startDrag({ kind: "preset", presetId: preset.id, type: preset.rootType, label: preset.label, icon: preset.icon }, e)
                    }
                    onClick={() => addPreset(preset)}
                  >
                    <span className="dsb-pal-ic">
                      <Icon name={preset.icon} size={15} />
                    </span>
                    <span className="dsb-pal-label">{preset.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
            ) : null;
          const open = openCats.includes(cat.key) || !!q;
          return (
            <section key={cat.key} className="dsb-pal-cat">
              <button
                type="button"
                className="dsb-pal-cat-head"
                style={{ "--dsb-cat": cat.color }}
                onClick={() => setOpenCats((o) => (o.includes(cat.key) ? o.filter((k) => k !== cat.key) : [...o, cat.key]))}
              >
                <Icon name={cat.icon} size={13} />
                <span>{cat.label}</span>
                <span className="dsb-pal-n">{cat.items.length}</span>
                <Icon name={open ? "ChevronDown" : "ChevronRight"} size={12} />
              </button>
              {open ? (
                <div className="dsb-pal-grid">
                  {cat.items.map((def) => (
                    <button
                      key={def.type}
                      type="button"
                      className="dsb-pal-item"
                      style={{ "--dsb-cat": cat.color }}
                      title={`${def.label} — drag onto the canvas`}
                      aria-label={`Add ${def.label}`}
                      onPointerDown={(e) => dnd?.startDrag({ kind: "create", type: def.type, label: def.label, icon: def.icon }, e)}
                      onClick={() => add(def)}
                    >
                      <span className="dsb-pal-ic">
                        <Icon name={def.icon} size={15} />
                      </span>
                      <span className="dsb-pal-label">{def.label}</span>
                      {def.isContainer ? <span className="dsb-pal-flag">box</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}

        {groups && groups.length ? (
          <section className="dsb-pal-cat">
            <div className="dsb-pal-cat-head is-static" style={{ "--dsb-cat": "#16a34a" }}>
              <Icon name="SquareStack" size={13} />
              <span>Saved blocks</span>
              <span className="dsb-pal-n">{groups.length}</span>
            </div>
            <div className="dsb-pal-list">
              {groups.map((g) => (
                <div key={g.id} className="dsb-pal-group">
                  <button
                    type="button"
                    className="dsb-pal-group-main"
                    onClick={() => {
                      const parentId = resolveParent(g.node.type);
                      b.addSubtree(cloneNode(g.node), parentId, -1);
                    }}
                  >
                    <Icon name="SquareStack" size={14} />
                    <span>{g.name}</span>
                  </button>
                  <button
                    type="button"
                    className="dsb-icon-btn"
                    title="Delete block"
                    onClick={async () => {
                      await GroupRepo.remove(g.id);
                      onReloadGroups?.();
                    }}
                  >
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!cats.length && !presets.length ? (
          <div className="dsb-pal-empty">
            <Icon name="SearchX" size={16} />
            <span>No components match “{q}”.</span>
          </div>
        ) : null}
        </>
        )}
      </div>

      <footer className="dsb-pal-foot">
        <Icon name="Info" size={12} />
        <span>Drag onto the canvas, or click to drop into the selection.</span>
      </footer>
      </>
      )}
    </aside>
  );
}
