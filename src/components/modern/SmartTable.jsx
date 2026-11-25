import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search as SearchIcon,
  X as XIcon,
  Table as TableIcon,
  LayoutGrid,
  Eye,
  EyeOff,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTheme } from "@app/hooks/useTheme";

const DEFAULT_CHUNK = 50;

export default function SmartTable({
  data,
  columns,
  thead,
  tbody,
  getRowKey,
  searchKeys,
  searchFn,
  selectable = false,
  selected = [],
  onSelectChange,
  enableCardView = false,
  renderCard,
  storageKey,
  topExtras,
  footerActions,
  emptyText = "No records",
  searchPlaceholder = "Search...",
  maxHeight = "55vh",
  cardMaxHeight,
  pageChunk = DEFAULT_CHUNK,
  cardMinWidth = 240,
  rowHeightHint,
  i18n = {},
  exportFileName = "table",
  enableExport = true,
  enableFullscreen = true,
  enableDensityToggle = true,
  heading,
  secondTitle,
  getRowStyle,
}) {
  const { theme } = useTheme();
  const T = theme.colors;
  const tx = {
    records: "records",
    selected: "selected",
    showing: "Showing",
    scrollMore: "scroll for more",
    table: "Table",
    card: "Card",
    ...i18n,
  };

  const resolvedData = data || tbody || [];

  const resolvedColumns = useMemo(() => {
    let base;
    if (columns && columns.length) base = columns;
    else if (thead) {
      base = thead.map((h, idx) => {
        const isObj = h && typeof h === "object";
        const name = isObj ? (h.name ?? h.label ?? "") : h;
        const rawW = isObj ? (h.width ?? h.w) : undefined;
        const widthIsPct = typeof rawW === "string" && /%$/.test(rawW);
        return {
          key: isObj && h.key ? h.key : `c${idx}`,
          label: name,
          icon: isObj ? h.icon : undefined,
          w: !widthIsPct && rawW ? rawW : undefined,
          align: isObj ? h.align : undefined,
          grow: isObj ? h.grow : undefined,
          wrap: isObj ? h.wrap : false,
          cellStyle: widthIsPct ? { width: rawW } : (isObj ? h.cellStyle : undefined),
          render: (row) => {
            const vals = row ? Object.values(row) : [];
            return vals[idx];
          },
        };
      });
    } else base = [];
    return base.map((c, i) => ({ ...c, _idx: i }));
  }, [columns, thead]);

  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(pageChunk);
  const [viewMode, setViewMode] = useState(() => {
    if (!enableCardView) return "table";
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 800;
    const fallback = isMobile ? "card" : "table";
    try {
      const stored = localStorage.getItem(storageKey || "smartTableView");
      return stored || fallback;
    } catch {
      return fallback;
    }
  });
  const setView = (m) => {
    setViewMode(m);
    if (storageKey) { try { localStorage.setItem(storageKey, m); } catch {} }
  };
  const [hiddenCols, setHiddenCols] = useState(() => {
    try {
      const raw = localStorage.getItem((storageKey || "smartTable") + ":hidden");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  const persistHidden = (s) => {
    try { localStorage.setItem((storageKey || "smartTable") + ":hidden", JSON.stringify([...s])); } catch {}
  };
  const toggleColHidden = (key) => {
    setHiddenCols((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key); else n.add(key);
      persistHidden(n);
      return n;
    });
  };
  const showAllCols = () => {
    const empty = new Set();
    setHiddenCols(empty);
    persistHidden(empty);
  };
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef(null);
  const colBtnRef = useRef(null);
  useEffect(() => {
    if (!colMenuOpen) return;
    const onDoc = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target) &&
          colBtnRef.current && !colBtnRef.current.contains(e.target)) {
        setColMenuOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === "Escape") setColMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [colMenuOpen]);

  const visibleColumns = useMemo(
    () => resolvedColumns.filter((c) => !hiddenCols.has(c.key)),
    [resolvedColumns, hiddenCols]
  );

  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef(null);

  const stringifyCell = (val) => {
    if (val == null) return "";
    if (typeof val === "object") return "";
    return String(val).replace(/\s+/g, " ").trim();
  };
  const csvEscape = (v) => {
    const s = stringifyCell(v);
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const jsxToText = (node) => {
    if (node == null || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(jsxToText).join(" ");
    if (typeof node === "object" && node.props) return jsxToText(node.props.children);
    return "";
  };
  const labelToText = (lbl) => {
    if (lbl == null) return "";
    if (typeof lbl === "string" || typeof lbl === "number") return String(lbl);
    return jsxToText(lbl);
  };
  const exportCSV = () => {
    const cols = visibleColumns.filter((c) => c.exportable !== false);
    const header = cols.map((c) => csvEscape(labelToText(c.label) || c.key)).join(",");
    const lines = filtered.map((row, i) =>
      cols.map((c) => {
        if (typeof c.exportValue === "function") {
          return csvEscape(c.exportValue(row, i));
        }
        if (typeof c.render === "function") {
          try {
            const text = jsxToText(c.render(row, i));
            if (text !== "") return csvEscape(text);
          } catch {}
        }
        if (c.key && row && row[c.key] != null && typeof row[c.key] !== "object") {
          return csvEscape(row[c.key]);
        }
        const vals = row ? Object.values(row) : [];
        const v = vals[c._idx];
        if (v != null && typeof v !== "object") return csvEscape(v);
        return "";
      }).join(",")
    );
    const csv = "﻿" + [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  };

  useEffect(() => { setVisibleCount(pageChunk); }, [resolvedData?.length, searchQuery, pageChunk]);

  const filtered = useMemo(() => {
    if (!searchQuery) return resolvedData;
    const q = searchQuery.toLowerCase();
    if (searchFn) return resolvedData.filter((r) => searchFn(r, q));
    const keys = searchKeys;
    if (Array.isArray(keys) && keys.length) {
      return resolvedData.filter((r) =>
        keys.some((k) => {
          const v = typeof k === "function" ? k(r) : r?.[k];
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    }
    return resolvedData.filter((r) =>
      Object.values(r || {}).some((v) => {
        if (v == null) return false;
        if (typeof v === "object") return false;
        return String(v).toLowerCase().includes(q);
      })
    );
  }, [resolvedData, searchQuery, searchKeys, searchFn]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      setVisibleCount((c) => (c < filtered.length ? c + pageChunk : c));
    }
  };

  const keyOf = (row, idx) => (getRowKey ? getRowKey(row, idx) : idx);

  const isSel = (row, idx) =>
    selectable && selected.some((s) => keyOf(s) === keyOf(row, idx));

  const toggleSelect = (row) => {
    if (!selectable || !onSelectChange) return;
    const k = keyOf(row);
    const exists = selected.some((s) => keyOf(s) === k);
    if (exists) onSelectChange(selected.filter((s) => keyOf(s) !== k));
    else onSelectChange([...selected, row]);
  };

  const allSelected =
    selectable && filtered.length > 0 && selected.length >= filtered.length;
  const toggleSelectAll = (e) => {
    if (!onSelectChange) return;
    onSelectChange(e.target.checked ? [...filtered] : []);
  };

  const cellBase = {
    padding: "5px 8px",
    borderBottom: `1px solid ${T.border}`,
    fontSize: 11.5,
    color: T.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.3,
  };

  const segIconBtn = (extra) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 28,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 600,
    transition: "background .15s, color .15s",
    ...extra,
  });

  const ActionBar = (
    ((enableDensityToggle || enableExport || enableFullscreen || enableCardView)) && (
      <div
        style={{
          display: "inline-flex",
          alignItems: "stretch",
          borderRadius: 999,
          overflow: "visible",
          border: `1px solid ${T.border}`,
          boxShadow: "0 3px 8px -4px rgba(20,184,166,.45)",
          background: T.panel,
          position: "relative",
        }}
      >
        {enableDensityToggle && (
          <span ref={colBtnRef} style={{ display: "inline-flex" }}>
            <button
              type="button"
              onClick={() => setColMenuOpen((o) => !o)}
              title="Columns"
              style={segIconBtn({
                width: 34,
                background: colMenuOpen ? T.headerGradient : T.accent,
                color: "#fff",
                borderRadius: "999px 0 0 999px",
              })}
            >
              <Eye size={13} />
            </button>
          </span>
        )}
        {enableExport && (
          <button
            type="button"
            onClick={exportCSV}
            title="Export CSV"
            style={segIconBtn({
              width: 34,
              background: T.accent,
              color: "#fff",
              borderLeft: "1px solid rgba(255,255,255,.22)",
              borderRadius: !enableDensityToggle ? "999px 0 0 999px" : 0,
            })}
          >
            <Download size={13} />
          </button>
        )}
        {enableFullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={segIconBtn({
              width: 34,
              background: T.accent,
              color: "#fff",
              borderLeft: "1px solid rgba(255,255,255,.22)",
              borderRadius: !enableCardView ? "0 999px 999px 0" : 0,
            })}
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
        {enableCardView && (
          [
            { key: "table", label: tx.table, Icon: TableIcon },
            { key: "card", label: tx.card, Icon: LayoutGrid },
          ].map(({ key, label, Icon }, idx, arr) => {
            const on = viewMode === key;
            const isLast = idx === arr.length - 1;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                style={segIconBtn({
                  padding: "0 12px",
                  background: on ? T.headerGradient : T.accentSoft,
                  color: on ? "#fff" : T.textMuted,
                  borderLeft: `1px solid ${T.border}`,
                  borderRadius: isLast ? "0 999px 999px 0" : 0,
                })}
              >
                <Icon size={11} />
                {label}
              </button>
            );
          })
        )}

        {colMenuOpen && (
          <div
            ref={colMenuRef}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 1100,
              minWidth: 220,
              maxHeight: 320,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              boxShadow: `0 18px 40px -16px rgba(15,23,42,.35), 0 0 0 3px ${T.accentSoft}`,
              padding: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: T.textMuted,
                textTransform: "uppercase",
              }}
            >
              <span>COLUMNS</span>
              {hiddenCols.size > 0 && (
                <button
                  type="button"
                  onClick={showAllCols}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: T.accent,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  SHOW ALL
                </button>
              )}
            </div>
            <div style={{ overflowY: "auto", maxHeight: 270 }} className="thin-scroll">
              {resolvedColumns.map((c) => {
                const hidden = hiddenCols.has(c.key);
                const Icon = c.icon;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleColHidden(c.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 7,
                      border: "none",
                      background: hidden ? "transparent" : T.accentSoft,
                      color: T.text,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      transition: "background .12s",
                      opacity: hidden ? 0.55 : 1,
                    }}
                  >
                    {hidden
                      ? <EyeOff size={13} color={T.textMuted} style={{ flexShrink: 0 }} />
                      : <Eye size={13} color={T.accent} style={{ flexShrink: 0 }} />
                    }
                    {Icon && <Icon size={13} color={T.textMuted} style={{ flexShrink: 0 }} />}
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {typeof c.label === "string" ? c.label : c.key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )
  );

  const isColVisible = (key) => !hiddenCols.has(key);
  const cardHelpers = { isSelected: (r, i) => isSel(r, i), toggleSelect, T, hiddenCols, isColVisible };

  const fsMax = fullscreen ? "calc(100vh - 120px)" : maxHeight;

  return (
    <div
      ref={wrapRef}
      style={
        fullscreen
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: T.bg || T.panel,
              padding: 12,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }
          : undefined
      }
    >
      <style>{`
        .smt tbody tr { transition: background .12s; }
        .smt tbody tr:hover { background: ${T.accentSoft}; }
        .smt tbody tr.sel { background: ${T.accentSoft}; }
        .smt th + th, .smt td + td { border-left: 1px solid ${T.border}; }
        .smt th { box-shadow: inset 0 -1px 0 ${T.border}, 0 1px 0 ${T.border}; }
        .smt input[type="checkbox"] { width: 12px; height: 12px; margin: 0; vertical-align: middle; }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 6,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
          {heading && (
            <span
              style={{
                position: "relative",
                fontSize: 12.5,
                fontWeight: 700,
                color: T.text,
                letterSpacing: 0.2,
                paddingLeft: 10,
                whiteSpace: "nowrap",
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  background: T.headerGradient || T.accent,
                }}
              />
              {heading}
            </span>
          )}
          {selectable && selected?.length > 0 && (
            <span style={{ fontSize: 11, color: T.accent, fontWeight: 600, whiteSpace: "nowrap" }}>
              {selected.length} {tx.selected}
            </span>
          )}
        </div>

        {secondTitle && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginLeft: "auto",
              justifyContent: "flex-end",
              minWidth: 0,
            }}
          >
            {secondTitle}
          </div>
        )}

        <div
          style={{
            position: "relative",
            flex: "0 1 320px",
            maxWidth: 320,
            minWidth: 160,
          }}
        >
          <SearchIcon
            size={12}
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: T.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: "100%",
              height: 26,
              paddingLeft: 26,
              paddingRight: searchQuery ? 22 : 8,
              border: `1px solid ${T.border}`,
              borderRadius: 999,
              background: T.panel,
              color: T.text,
              fontSize: 11.5,
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color .15s, box-shadow .15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.accent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentSoft}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                padding: 2,
                cursor: "pointer",
                color: T.textMuted,
                display: "grid",
                placeItems: "center",
              }}
            >
              <XIcon size={11} />
            </button>
          )}
        </div>

        {topExtras}
        {ActionBar}
      </div>

      {viewMode === "card" && enableCardView ? (
        <div
          onScroll={onScroll}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}px, 1fr))`,
            gap: 8,
            maxHeight: fullscreen ? fsMax : (cardMaxHeight || maxHeight),
            overflow: "auto",
            padding: 2,
            scrollBehavior: "smooth",
          }}
          className="thin-scroll"
        >
          {visible.length === 0 ? (
            <div style={{ gridColumn: "1/-1", padding: "24px 8px", textAlign: "center", color: T.textMuted, fontSize: 12 }}>
              {emptyText}
            </div>
          ) : (
            visible.map((row, i) => (
              <React.Fragment key={keyOf(row, i)}>
                {renderCard ? renderCard(row, i, cardHelpers) : (
                  <div
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      background: T.panel,
                      padding: "8px 10px",
                      fontSize: 12,
                      color: T.text,
                    }}
                  >
                    {visibleColumns.map((c) => (
                      <div key={c.key} style={{ display: "flex", gap: 6, padding: "2px 0" }}>
                        <span style={{ color: T.textMuted, minWidth: 70 }}>{c.label}</span>
                        <span style={{ flex: 1 }}>
                          {c.render ? c.render(row, i) : row?.[c.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            overflow: "hidden",
            background: T.panel,
            boxShadow: "0 1px 2px rgba(15,23,42,.03)",
          }}
        >
          <div
            onScroll={onScroll}
            style={{ maxHeight: fsMax, overflow: "auto", scrollBehavior: "smooth" }}
            className="thin-scroll"
          >
            <table
              className="smt"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "auto",
                fontFamily: "inherit",
              }}
            >
              <thead>
                <tr>
                  {selectable && (
                    <th
                      style={{
                        ...cellBase,
                        position: "sticky",
                        top: 0,
                        background: T.panel2 || T.panel,
                        color: T.textMuted,
                        fontWeight: 700,
                        fontSize: 10.5,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        textAlign: "center",
                        borderBottom: `1.5px solid ${T.border}`,
                        zIndex: 2,
                        width: 32,
                        minWidth: 32,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        style={{ accentColor: T.accent, cursor: "pointer", margin: 0 }}
                      />
                    </th>
                  )}
                  {visibleColumns.map((c) => (
                    <th
                      key={c.key}
                      style={{
                        ...cellBase,
                        position: "sticky",
                        top: 0,
                        background: T.panel2 || T.panel,
                        color: T.textMuted,
                        fontWeight: 700,
                        fontSize: 10.5,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        textAlign: c.align || "left",
                        borderBottom: `1.5px solid ${T.border}`,
                        zIndex: 2,
                        minWidth: c.w,
                        width: c.grow ? "auto" : c.w,
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                      style={{
                        padding: "26px 8px",
                        textAlign: "center",
                        color: T.textMuted,
                        fontSize: 12,
                      }}
                    >
                      {emptyText}
                    </td>
                  </tr>
                ) : (
                  visible.map((row, i) => {
                    const sel = isSel(row, i);
                    return (
                      <tr
                        key={keyOf(row, i)}
                        className={sel ? "sel" : ""}
                        style={{
                          ...(rowHeightHint ? { height: rowHeightHint } : null),
                          ...(getRowStyle ? getRowStyle(row, i) || null : null),
                        }}
                      >
                        {selectable && (
                          <td style={{ ...cellBase, textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => toggleSelect(row)}
                              style={{ accentColor: T.accent, cursor: "pointer", margin: 0 }}
                            />
                          </td>
                        )}
                        {visibleColumns.map((c) => (
                          <td
                            key={c.key}
                            style={{
                              ...cellBase,
                              textAlign: c.align || "left",
                              whiteSpace: c.wrap ? "normal" : "nowrap",
                              ...(c.cellStyle ? (typeof c.cellStyle === "function" ? c.cellStyle(row, i) : c.cellStyle) : null),
                            }}
                            title={c.title ? c.title(row, i) : undefined}
                          >
                            {c.render ? c.render(row, i) : row?.[c.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 6,
        }}
      >
        {visibleCount < filtered.length && (
          <span style={{ fontSize: 10.5, color: T.textMuted, marginRight: "auto" }}>
            {tx.showing} {Math.min(visibleCount, filtered.length)} / {filtered.length} · {tx.scrollMore}
          </span>
        )}
        {footerActions}
      </div>
    </div>
  );
}
