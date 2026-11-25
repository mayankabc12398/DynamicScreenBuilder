/**
 * Left panel: search, pinned forms, then forms grouped by category in
 * collapsible pastel sections. Collapses to a slim rail.
 * New / pin / show-deleted appear only when their handlers are given, so the
 * patient workspace reuses the list read-only; `badge(f)` adds a per-form mark.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { allCategories, categoryTone } from "../model/form";
import Tap from "../ui/Tap";
import Icon from "../ui/Icon";
import { Skeleton } from "../ui/kit";

const STATUS = {
  draft: { tone: "amber", label: "Draft" },
  published: { tone: "mint", label: "Published" },
  modified: { tone: "sky", label: "Published · edited" },
};
export const statusInfo = (s) => STATUS[s] || STATUS.draft;

export default function FormList({ forms, loading, selectedId, onSelect, onNew, collapsed, onToggle, pins = [], onPin, showDeleted, onShowDeleted, title = "Nursing forms", badge }) {
  const [search, setSearch] = useState("");
  const [closed, setClosed] = useState({});
  const [tip, setTip] = useState(null);
  const tipTimer = useRef(0);
  useEffect(() => () => clearTimeout(tipTimer.current), []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return forms;
    return forms.filter((f) => [f.name, f.formCode, f.docNo, f.category].some((x) => String(x || "").toLowerCase().includes(s)));
  }, [forms, search]);

  const groups = useMemo(() => {
    const cats = allCategories(forms);
    const of = (f) => cats.find((c) => c.toLowerCase() === String(f.category || "").trim().toLowerCase()) || "Other";
    return cats.map((c) => ({ value: c, tone: categoryTone(c), items: filtered.filter((f) => of(f) === c) })).filter((g) => g.items.length);
  }, [filtered, forms]);
  const pinned = filtered.filter((f) => pins.includes(f.id));

  if (collapsed) {
    return (
      <aside className="nfb-list is-rail">
        <Tap variant="ghost" icon="panel" title="Show the form list" onClick={onToggle} />
        {onNew && <Tap variant="solid" tone="indigo" icon="plus" title="New nursing form" onClick={onNew} />}
        <div className="nfb-rail-items">
          {forms.map((f) => (
            <Tap key={f.id} className={`nfb-rail-item tone-${categoryTone(f.category)}${f.id === selectedId ? " is-active" : ""}`} title={f.name} onClick={() => onSelect(f.id)}>
              {initials(f.name)}
            </Tap>
          ))}
        </div>
      </aside>
    );
  }

  // full form name in a hover card — only when the row cuts it off with "…"
  const showTip = (f, el) => {
    clearTimeout(tipTimer.current);
    const name = el.querySelector(".nfb-item-name");
    if (!name || name.scrollWidth <= name.clientWidth) return;
    tipTimer.current = setTimeout(() => setTip({ f, rect: el.getBoundingClientRect() }), 300);
  };
  const hideTip = () => {
    clearTimeout(tipTimer.current);
    setTip(null);
  };

  const Item = ({ f }) => {
    const tone = categoryTone(f.category);
    return (
      <div
        className={`nfb-item${f.id === selectedId ? " is-active" : ""}${f.isDeleted ? " is-deleted" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          hideTip();
          onSelect(f.id);
        }}
        onKeyDown={(e) => e.key === "Enter" && onSelect(f.id)}
        onMouseEnter={(e) => showTip(f, e.currentTarget)}
        onMouseLeave={hideTip}
      >
        <span className={`nfb-item-ico tone-${tone}`}>
          <Icon name={f.fileType === "pdf" ? "pdf" : f.fileType === "image" ? "image" : "file"} size={14} />
        </span>
        <span className="nfb-item-main">
          <span className="nfb-item-name">{f.name}</span>
        </span>
        {badge?.(f)}
        {onPin && (
          <Tap
            variant="ghost"
            className={`nfb-item-pin${pins.includes(f.id) ? " is-on" : ""}`}
            title={pins.includes(f.id) ? "Unpin" : "Pin to top"}
            onClick={(e) => {
              e.stopPropagation();
              onPin(f.id);
            }}
          >
            <Icon name="star" size={13} fill={pins.includes(f.id)} />
          </Tap>
        )}
      </div>
    );
  };

  return (
    <aside className="nfb-list">
      <div className="nfb-list-head">
        <div className="nfb-list-title">
          {title} <span className="nfb-count">{forms.length}</span>
        </div>
        <Tap variant="ghost" icon="chevL" title="Collapse the list" onClick={onToggle} />
        {onNew && <Tap variant="solid" tone="indigo" icon="plus" title="New nursing form" onClick={onNew} />}
      </div>
      <div className="nfb-search">
        <Icon name="search" size={14} />
        <input className="nfb-search-input" placeholder="Search forms…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <Tap variant="ghost" icon="x" iconSize={12} title="Clear" onClick={() => setSearch("")} />}
      </div>
      <div className="nfb-list-scroll" onScroll={hideTip}>
        {loading &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="nfb-item is-skel">
              <Skeleton w={22} h={22} r={6} />
              <span className="nfb-item-main">
                <Skeleton w="80%" h={10} />
              </span>
            </div>
          ))}
        {!loading && !filtered.length && <div className="nfb-list-empty">{search ? "No form matches your search." : onNew ? "No forms yet — click + to add one." : "No forms yet."}</div>}
        {!loading && pinned.length > 0 && (
          <Group id="__pins" label="Pinned" tone="indigo" count={pinned.length} closed={closed} setClosed={setClosed}>
            {pinned.map((f) => (
              <Item key={`p${f.id}`} f={f} />
            ))}
          </Group>
        )}
        {!loading &&
          groups.map((g) => (
            <Group key={g.value} id={g.value} label={g.value} tone={g.tone} count={g.items.length} closed={closed} setClosed={setClosed}>
              {g.items.map((f) => (
                <Item key={f.id} f={f} />
              ))}
            </Group>
          ))}
      </div>
      {onShowDeleted && (
        <div className="nfb-list-foot">
          <Tap variant="ghost" className={showDeleted ? "is-active" : ""} icon="trash" iconSize={13} onClick={() => onShowDeleted(!showDeleted)}>
            {showDeleted ? "Hide deleted" : "Show deleted"}
          </Tap>
        </div>
      )}
      {tip && <FormTip f={tip.f} rect={tip.rect} />}
    </aside>
  );
}

/**
 * Hover card beside a form row with the full form name, shown when the row
 * truncates it. Portaled to <body> (fixed) so the list's scroll / collapse
 * containers can't clip it; wrapped in .nfb for the tokens.
 */
function FormTip({ f, rect }) {
  return createPortal(
    <div className="nfb nfb-ftip-wrap">
      <div className={`nfb-ftip tone-${categoryTone(f.category)}`} role="tooltip" style={{ top: rect.bottom + 8, left: rect.left + 4 }}>
        {f.name}
      </div>
    </div>,
    document.body,
  );
}

function Group({ id, label, tone, count, closed, setClosed, children }) {
  const isClosed = !!closed[id];
  return (
    <div className={`nfb-group tone-${tone}${isClosed ? " is-closed" : ""}`}>
      <div className="nfb-group-head" role="button" tabIndex={0} onClick={() => setClosed((c) => ({ ...c, [id]: !isClosed }))} onKeyDown={(e) => e.key === "Enter" && setClosed((c) => ({ ...c, [id]: !isClosed }))}>
        <Icon name="chevD" size={12} className="nfb-group-chev" />
        <span className={`nfb-group-tag tone-${tone}`}>{label}</span>
        <span className="nfb-count">{count}</span>
      </div>
      <div className="nfb-group-body">
        <div className="nfb-group-inner">{children}</div>
      </div>
    </div>
  );
}

const initials = (s) =>
  String(s || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
