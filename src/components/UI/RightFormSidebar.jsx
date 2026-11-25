import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import ReactDOM from "react-dom";

/**
 * Edge rail of quick-form shortcuts. Collapsed it shows 2-letter gradient chips;
 * hover the rail and it glides open to reveal full form names grouped by
 * category — so the icons are always understandable, not guesswork.
 * Docks on the side OPPOSITE the modern main sidebar (root
 * data-modern-sidebar-side). Same data/click contract as SeeMoreSlideScreen.
 */

const RAIL = 60; // collapsed width — reserved on the page; expansion overlays.

const GRADIENTS = [
  ["#3b82f6", "#2563eb"],
  ["#8b5cf6", "#6d28d9"],
  ["#ec4899", "#be185d"],
  ["#f59e0b", "#d97706"],
  ["#10b981", "#059669"],
  ["#06b6d4", "#0891b2"],
  ["#ef4444", "#dc2626"],
  ["#6366f1", "#4338ca"],
  ["#14b8a6", "#0d9488"],
  ["#f97316", "#ea580c"],
];

// 2-letter code: initials of first two words, else first two letters.
const codeOf = (label = "") => {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return label.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?";
};

// rail sits opposite the main sidebar. Read the published attribute, but fall
// back to the persisted side (ModernLayout writes localStorage "modernSidebarSide")
// so the rail docks correctly on first render — before the attribute is set —
// instead of defaulting to the wrong side and leaving a stale reservation.
const mainSidebarSide = () => {
  const attr = document.documentElement.dataset.modernSidebarSide;
  if (attr) return attr;
  try {
    return localStorage.getItem("modernSidebarSide") || "left";
  } catch {
    return "left";
  }
};
const railSideFromRoot = () => (mainSidebarSide() === "right" ? "left" : "right");

// Singleton coordinator — many Headings (main page + nested slide-screen forms)
// can each mount a rail. Only the topmost (last-mounted) one renders/reserves,
// so we never stack two rails on the same edge ("2 icons") .
let railSeq = 0;
const railStack = [];
const railSubs = new Set();
const emitRail = () => railSubs.forEach((f) => f());
const railTop = () => railStack[railStack.length - 1];

// Which rails currently WANT a layout reservation (top rail + has forms), keyed
// by id. Centralised so the DOM reservation always reflects the CURRENT top rail
// — a stale reservation can't survive navigation to a page whose rail reserves
// nothing (that was the leftover right-side gap bug).
const railDesired = new Map();
const applyRailReservation = () => {
  const root = document.documentElement;
  const el =
    document.querySelector(".modern-content") || document.getElementById("page-data");
  const topId = railTop();
  const desired = topId != null ? railDesired.get(topId) : null;

  // always reset any prior reservation first, then re-apply only what the
  // current top rail wants — so no rail == no reservation == no gap.
  root.style.removeProperty("--rfs-rail-l");
  root.style.removeProperty("--rfs-rail-r");
  document.body.classList.remove("rfs-open-right", "rfs-open-left");
  if (el) {
    el.style.paddingRight = "";
    el.style.paddingLeft = "";
  }
  if (!desired) return;

  if (el) el.style.transition = "padding .2s ease";
  if (desired.side === "right") {
    if (el) el.style.paddingRight = "70px";
    root.style.setProperty("--rfs-rail-r", `${RAIL}px`);
    document.body.classList.add("rfs-open-right");
  } else {
    if (el) el.style.paddingLeft = "70px";
    root.style.setProperty("--rfs-rail-l", `${RAIL}px`);
    document.body.classList.add("rfs-open-left");
  }
};

const OPEN_W = 250; // expanded width on hover

const CSS = `
.rfs-wrap{position:fixed;top:0;bottom:0;z-index:9998;width:${RAIL}px;overflow:hidden;
  background:linear-gradient(180deg,#ffffff 0%,#f7f9fc 100%);
  display:flex;flex-direction:column;
  /* animate width only; isolate layout+paint so expand stays smooth. box-shadow
     is static (never transitioned) — animating a full-height blur = jank. */
  transition:width .36s cubic-bezier(.22,1,.36,1);
  will-change:width;contain:layout paint;}
.rfs-wrap[data-side="right"]{right:0;left:auto;border-left:1px solid #e8edf3;
  box-shadow:-14px 0 40px rgba(15,23,42,.12);animation:rfsSlideR .3s cubic-bezier(.16,1,.3,1) both;}
.rfs-wrap[data-side="left"]{left:0;right:auto;border-right:1px solid #e8edf3;
  box-shadow:14px 0 40px rgba(15,23,42,.12);animation:rfsSlideL .3s cubic-bezier(.16,1,.3,1) both;}
/* expand on hover (pointer) OR when pinned open via tap (touch).
   min(...,84vw) so it never swallows a small phone screen. */
.rfs-wrap:hover,.rfs-wrap.is-open{width:min(${OPEN_W}px,84vw);}

/* header */
.rfs-head{display:flex;align-items:center;gap:11px;padding:13px 9px;min-height:58px;
  border-bottom:1px solid #eef2f7;}
.rfs-head-ic{width:40px;height:40px;flex:0 0 40px;border-radius:12px;display:flex;align-items:center;
  justify-content:center;color:#fff;background:linear-gradient(135deg,#6366f1,#4338ca);
  box-shadow:0 5px 14px rgba(67,56,202,.35);}
.rfs-head-tx{white-space:nowrap;opacity:0;transform:translateX(-6px);
  transition:opacity .22s ease .04s,transform .22s ease .04s;min-width:0;}
.rfs-wrap:hover .rfs-head-tx,.rfs-wrap.is-open .rfs-head-tx{opacity:1;transform:none;}
.rfs-head-tx b{display:block;font-size:13px;font-weight:800;color:#0f172a;letter-spacing:.2px;}
.rfs-head-tx span{display:block;font-size:10.5px;color:#94a3b8;font-weight:600;}
/* caret toggles the rail open on touch; hidden until expanded, rotates when pinned */
.rfs-head-caret{margin-left:auto;flex:0 0 auto;color:#c3cad6;opacity:0;transition:opacity .2s ease,transform .25s ease;}
.rfs-wrap:hover .rfs-head-caret,.rfs-wrap.is-open .rfs-head-caret{opacity:1;}
.rfs-wrap.is-open .rfs-head-caret{transform:rotate(180deg);color:#6366f1;}

/* scroll body */
.rfs-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:6px 0 16px;}
.rfs-scroll::-webkit-scrollbar{width:5px;}
.rfs-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px;}
.rfs-scroll::-webkit-scrollbar-track{background:transparent;}

/* category label (expanded) + divider (collapsed) */
.rfs-cat{height:0;opacity:0;overflow:hidden;padding:0 16px;white-space:nowrap;
  font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#a2acbd;
  transition:opacity .2s ease,height .2s ease,margin .2s ease;}
.rfs-wrap:hover .rfs-cat,.rfs-wrap.is-open .rfs-cat{height:14px;opacity:1;margin:12px 0 3px;}
.rfs-divider{height:1px;margin:9px 12px;background:#eef2f7;transition:opacity .2s ease,margin .2s ease;}
.rfs-wrap:hover .rfs-divider,.rfs-wrap.is-open .rfs-divider{opacity:0;margin:0 12px;}

/* item row */
.rfs-item{display:flex;align-items:center;gap:13px;padding:5px 9px;cursor:pointer;position:relative;
  border-radius:0;}
.rfs-item::before{content:"";position:absolute;top:8px;bottom:8px;width:3px;border-radius:0 4px 4px 0;
  background:transparent;transition:background .2s ease;}
.rfs-wrap[data-side="right"] .rfs-item::before{right:0;left:auto;border-radius:4px 0 0 4px;}
.rfs-wrap[data-side="left"] .rfs-item::before{left:0;}
.rfs-item:hover{background:linear-gradient(90deg,rgba(99,102,241,.09),rgba(99,102,241,0));}
.rfs-wrap[data-side="right"] .rfs-item:hover{background:linear-gradient(270deg,rgba(99,102,241,.09),rgba(99,102,241,0));}
.rfs-item:hover::before{background:linear-gradient(180deg,#6366f1,#8b5cf6);}

.rfs-chip{width:42px;height:42px;flex:0 0 42px;border-radius:13px;display:flex;align-items:center;
  justify-content:center;font-size:13px;font-weight:800;color:#fff;letter-spacing:.5px;position:relative;
  box-shadow:0 3px 9px rgba(15,23,42,.18);
  transition:transform .22s cubic-bezier(.34,1.56,.64,1),border-radius .2s,box-shadow .2s;
  animation:rfsPop .34s cubic-bezier(.34,1.56,.64,1) both;}
.rfs-item:hover .rfs-chip{transform:scale(1.09);border-radius:16px;box-shadow:0 8px 20px rgba(15,23,42,.3);}
.rfs-item:active .rfs-chip{transform:scale(.95);}

.rfs-label{flex:1;min-width:0;white-space:nowrap;opacity:0;transform:translateX(-8px);
  transition:opacity .22s ease,transform .22s ease;}
.rfs-wrap:hover .rfs-label,.rfs-wrap.is-open .rfs-label{opacity:1;transform:none;}
.rfs-label b{display:block;font-size:12.5px;font-weight:600;color:#1e293b;overflow:hidden;
  text-overflow:ellipsis;max-width:150px;}
.rfs-label small{display:block;font-size:10px;color:#b4bccb;font-weight:600;}
.rfs-go{margin-left:6px;flex:0 0 auto;color:#c3cad6;font-size:17px;line-height:1;font-weight:700;
  opacity:0;transform:translateX(-4px);transition:opacity .2s ease,transform .2s ease;}
.rfs-wrap:hover .rfs-item:hover .rfs-go{opacity:1;transform:none;color:#6366f1;}
/* touch has no per-row hover — show the arrow on all rows once pinned open */
.rfs-wrap.is-open .rfs-go{opacity:1;transform:none;}

@keyframes rfsSlideR{from{transform:translateX(${RAIL}px);opacity:0;}to{transform:none;opacity:1;}}
@keyframes rfsSlideL{from{transform:translateX(-${RAIL}px);opacity:0;}to{transform:none;opacity:1;}}
@keyframes rfsPop{from{opacity:0;transform:scale(.4) translateY(6px);}to{opacity:1;transform:none;}}
`;

const RightFormSidebar = ({ seeMore = [], handleChangeComponent, onPrefetch }) => {
  const [side, setSide] = useState(railSideFromRoot); // "left" | "right"
  const [pinned, setPinned] = useState(false); // tap-to-expand (touch has no hover)
  const wrapRef = useRef(null);
  const prefetched = useRef(new Set()); // warm each chunk once on hover
  const idRef = useRef(0);
  if (!idRef.current) idRef.current = ++railSeq;

  // close the tap-expanded rail when tapping/clicking outside it
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPinned(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [pinned]);

  // register in the singleton stack; only the top instance is "active".
  useEffect(() => {
    const id = idRef.current;
    railStack.push(id);
    emitRail();
    return () => {
      const i = railStack.indexOf(id);
      if (i >= 0) railStack.splice(i, 1);
      emitRail();
    };
  }, []);
  const isTop = useSyncExternalStore(
    (cb) => {
      railSubs.add(cb);
      return () => railSubs.delete(cb);
    },
    () => railTop() === idRef.current,
    () => false,
  );

  // react to main-sidebar side changes (drag left<->right)
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setSide(railSideFromRoot());
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["data-modern-sidebar-side"] });
    return () => obs.disconnect();
  }, []);

  // group by category (OTHERS last), keeping a running index for chip colors
  const { groups, total } = useMemo(() => {
    if (!Array.isArray(seeMore)) return { groups: [], total: 0 };
    const map = seeMore.reduce((acc, item) => {
      const label =
        item?.FileName || item?.FormName || item?.Text || item?.MenuName ||
        item?.menuName || item?.name || item?.label || item?.Name || "Untitled Form";
      const category =
        item?.MenuHeaderName || item?.menuHeaderName || item?.Category ||
        item?.Header || item?.GroupName || "OTHERS";
      (acc[category] = acc[category] || []).push({ ...item, safeLabel: label, safeCategory: category });
      return acc;
    }, {});
    let n = 0;
    const grouped = Object.entries(map)
      .sort((a, b) => (a[0] === "OTHERS" ? 1 : b[0] === "OTHERS" ? -1 : a[0].localeCompare(b[0])))
      .map(([category, arr]) => ({
        category,
        items: arr.map((it) => ({ ...it, _gi: n++ })),
      }));
    return { groups: grouped, total: n };
  }, [seeMore]);

  // Publish this rail's desired reservation (only the top rail with forms wants
  // one), then recompute the DOM reservation from the CURRENT top rail.
  // --rfs-rail-l/-r offset body-portaled overlays via ModernShell.css.
  // On unmount / becoming non-top / side change → republish + recompute, so a
  // page with no reserving rail always ends up with NO reservation (no gap).
  useEffect(() => {
    const id = idRef.current;
    if (total && isTop) railDesired.set(id, { side });
    else railDesired.delete(id);
    applyRailReservation();
    return () => {
      railDesired.delete(id);
      applyRailReservation();
    };
  }, [total, side, isTop]);

  if (!total || !isTop) return null;

  const prefetch = (it) => {
    const key = it.URL || it.safeLabel;
    if (onPrefetch && !prefetched.current.has(key)) {
      prefetched.current.add(key);
      onPrefetch(it);
    }
  };

  return ReactDOM.createPortal(
    <>
      <style>{CSS}</style>
      <div
        ref={wrapRef}
        className={`rfs-wrap${pinned ? " is-open" : ""}`}
        data-side={side}
      >
        <div
          className="rfs-head"
          role="button"
          tabIndex={0}
          onClick={() => setPinned((v) => !v)}
        >
          <div className="rfs-head-ic" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity=".7" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity=".7" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" opacity=".45" />
            </svg>
          </div>
          <div className="rfs-head-tx">
            <b>Quick Forms</b>
            <span>{total} shortcut{total > 1 ? "s" : ""}</span>
          </div>
          <svg className="rfs-head-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="rfs-scroll">
          {groups.map((g, gi) => (
            <div key={g.category}>
              {gi > 0 && <div className="rfs-divider" />}
              {groups.length > 1 && <div className="rfs-cat">{g.category}</div>}
              {g.items.map((it) => {
                const [c1, c2] = GRADIENTS[it._gi % GRADIENTS.length];
                return (
                  <div
                    key={it._gi}
                    className="rfs-item"
                    title={it.safeLabel}
                    onMouseEnter={() => prefetch(it)}
                    onClick={() => {
                      setPinned(false);
                      handleChangeComponent(it);
                    }}
                  >
                    <div
                      className="rfs-chip"
                      style={{
                        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                        animationDelay: `${Math.min(it._gi * 40, 400)}ms`,
                      }}
                    >
                      {codeOf(it.safeLabel)}
                    </div>
                    <div className="rfs-label">
                      <b>{it.safeLabel}</b>
                      <small>Open form</small>
                    </div>
                    <span className="rfs-go" aria-hidden="true">›</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default RightFormSidebar;
