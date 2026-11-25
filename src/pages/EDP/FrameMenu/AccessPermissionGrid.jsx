import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 20;


export default function AccessPermissionGrid({
  data = [],
  name = "Item",
  handleClick,
}) {
  const [t] = useTranslation();
  // ── checked state keyed by ValueField ──────────────────────────────────
  const [checkedMap, setCheckedMap] = useState(() =>
    Object.fromEntries(data.map((item) => [item.ValueField, !!item.isChecked]))
  );

  // Re-sync when data prop changes (async fetch / tab switch)
  useEffect(() => {
    setCheckedMap(
      Object.fromEntries(data.map((item) => [item.ValueField, !!item.isChecked]))
    );
  }, [data]);

  const [saved, setSaved] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const listRef = useRef(null);
  const sentinelRef = useRef(null);

  // ── filtering & pagination ──────────────────────────────────────────────
  const filteredData = data.filter((item) =>
    item?.TextField?.toLowerCase()?.includes(search?.toLowerCase())
  );
  const visibleData = filteredData.slice(0, page * PAGE_SIZE);
  const hasMore = visibleData.length < filteredData.length;

  useEffect(() => {
    setPage(1);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [search]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          setLoading(true);
          setTimeout(() => { setPage((p) => p + 1); setLoading(false); }, 400);
        }
      },
      { root: list, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, visibleData.length]);

  // ── select-all (scoped to filtered list) ───────────────────────────────
  const allFilteredChecked =
    filteredData.length > 0 &&
    filteredData.every((item) => checkedMap[item.ValueField]);
  const someFilteredChecked = filteredData.some((item) => checkedMap[item.ValueField]);

  const toggleAll = () => {
    const next = !allFilteredChecked;
    setCheckedMap((prev) => ({
      ...prev,
      ...Object.fromEntries(filteredData.map((item) => [item.ValueField, next])),
    }));
    setSaved(false);
  };

  const toggleItem = (valueField) => {
    setCheckedMap((prev) => ({ ...prev, [valueField]: !prev[valueField] }));
    setSaved(false);
  };

  // ── save: return full array with updated isChecked (1 / 0) ─────────────
  const onSaveClick = () => {
    const updatedData = data.map((item) => ({
      ...item,
      isChecked: checkedMap[item.ValueField] ? 1 : 0,
    }));
    if (handleClick) handleClick(updatedData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedCount = data.filter((item) => checkedMap[item.ValueField]).length;

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header Row */}
        <div style={styles.selectAllRow}>
          <div
            style={styles.customCheckbox(
              allFilteredChecked,
              someFilteredChecked && !allFilteredChecked
            )}
            onClick={toggleAll}
          >
            {allFilteredChecked && <CheckIcon />}
            {someFilteredChecked && !allFilteredChecked && <MinusIcon />}
          </div>

          <span style={styles.selectAllLabel}>{name.toUpperCase()}</span>

          {/* <span style={styles.badge} className="background-theme-color">
            {selectedCount}
          </span> */}
        </div>

        {/* Search Bar */}
        <div style={styles.searchWrapper}>
          <svg
            style={styles.searchIcon}
            width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="#94a3b8" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            style={styles.searchInput}
            type="text"
            placeholder={`Search ${name.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            tabIndex={-1}
            onFocus={(e) => { e.currentTarget.style.outline = "none"; }}
          />
          {search && (
            <button
              style={styles.clearBtn}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSearch("")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <line x1="2" y1="2" x2="10" y2="10" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="10" y1="2" x2="2" y2="10" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div style={styles.divider} />

        {/* Scrollable List */}
        <div style={styles.listWrapper} ref={listRef}>

          {filteredData.length === 0 && (
            <div style={styles.emptyState}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{t("No")} {name.toLowerCase()} {t("match \"")}<strong>{search}</strong>"</span>
            </div>
          )}

          {visibleData.map((item, idx) => {
            const isChecked = !!checkedMap[item.ValueField];
            const isHovered = hoveredId === item.ValueField;
            return (
              <div
                key={item.ValueField}
                style={{
                  ...styles.roleRow,
                  backgroundColor:
                    isHovered
                      ? "#f0f9ff"
                      : isChecked && idx % 2 === 0
                        ? "#f8fbff"
                        : "transparent",
                }}
                onClick={() => toggleItem(item.ValueField)}
                onMouseEnter={() => setHoveredId(item.ValueField)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={styles.customCheckbox(isChecked, false)}>
                  {isChecked && <CheckIcon />}
                </div>
                <span style={{
                  ...styles.roleLabel,
                  color: isChecked ? "#0f172a" : "#94a3b8",
                  //   fontWeight: isChecked ? "600"     : "500",
                }}>
                  {highlightMatch(item.TextField, search)}
                </span>
              </div>
            );
          })}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} style={styles.sentinel}>
              {loading && (
                <div style={styles.loaderRow}>
                  <span style={styles.dot} />
                  <span style={{ ...styles.dot, animationDelay: "0.15s" }} />
                  <span style={{ ...styles.dot, animationDelay: "0.3s" }} />
                </div>
              )}
            </div>
          )}

          {!hasMore && filteredData.length > PAGE_SIZE && (
            <div style={styles.endHint}>
              {t("— All")} {filteredData.length} {name.toLowerCase()} {t("loaded —")}
            </div>
          )}
        </div>

        <div style={styles.divider} />

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerNote}>
            {selectedCount === 0
              ? `No ${name.toLowerCase()} selected`
              : `${selectedCount}/${filteredData.length} ${name.toLowerCase()} will be assigned`}
          </span>
          <button className="btn btn-success" onClick={onSaveClick}>
            {/* {saved ? "✓ Saved!" : `Save ${name}`} */}
            {t("Save")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
          40%            { transform: scale(1);    opacity: 1;    }
        }
      `}</style>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#bae6fd", color: "#0369a1", borderRadius: "2px", padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function CheckIcon({ color = "#fff", size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <polyline points="2,6 5,9 10,3" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <line x1="2" y1="6" x2="10" y2="6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    display: "flex",
    background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e8f4fd 100%)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    // padding: "4px",
    // width: "270px"
  },
  card: {
    width: "100%",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 4px 6px -1px rgba(14,165,233,0.08), 0 20px 60px -10px rgba(14,165,233,0.15)",
    overflow: "hidden",
    border: "1px solid #e0f2fe",
  },
  selectAllRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "3px 8px 2px 7px",
    userSelect: "none",
  },
  selectAllLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    // color: "#0ea5e9",
    letterSpacing: "0.08em",
    whiteSpace: "wrap",
    flex: 1,
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "0 10px",
    gap: "6px",
    width: "95%",
    marginLeft: "3px",
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: "1rem",
    color: "#0f172a",
    outline: "none",
    fontFamily: "inherit",
    minWidth: 0,
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    alignItems: "center",
    borderRadius: "4px",
    flexShrink: 0,
  },
  badge: {
    background: "#0ea5e9",
    color: "#fff",
    borderRadius: "10px",
    padding: "2px 9px",
    fontSize: "1rem",
    // fontWeight: "600",
    flexShrink: 0,
  },
  divider: {
    height: "1px",
    background: "#f1f5f9",
    margin: "0 20px",
  },
  listWrapper: {
    maxHeight: "40vh",
    overflowY: "auto",
    padding: "4px 0",
    scrollbarWidth: "thin",
    scrollbarColor: "#bae6fd transparent",
  },
  roleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "1px 6px",
    cursor: "pointer",
    userSelect: "none",
    transition: "background 0.15s ease",
    border: "1px solid rgb(222, 222, 222)",
    borderRadius: "5px",
  },
  customCheckbox: (isChecked, isIndeterminate) => ({
    width: "1.3rem",
    height: "1.3rem",
    borderRadius: "5px",
    border: isChecked || isIndeterminate ? "none" : "1.8px solid #cbd5e1",
    background:
      isChecked || isIndeterminate
        ? "linear-gradient(135deg, #0ea5e9, #38bdf8)"
        : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.15s ease",
    boxShadow:
      isChecked || isIndeterminate ? "0 2px 6px rgba(14,165,233,0.35)" : "none",
    cursor: "pointer",
  }),
  roleLabel: {
    fontSize: "0.9rem",
    letterSpacing: "0.03em",
    transition: "color 0.15s ease",
  },
  sentinel: {
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderRow: {
    display: "flex",
    gap: "5px",
    alignItems: "center",
  },
  dot: {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#0ea5e9",
    animation: "dotBounce 1s infinite ease-in-out",
  },
  endHint: {
    textAlign: "center",
    fontSize: "1rem",
    color: "#cbd5e1",
    padding: "8px 0 4px",
    letterSpacing: "0.04em",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "32px 20px",
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "center",
  },
  footer: {
    padding: "4px 11px 4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  footerNote: {
    fontSize: "1rem",
    whiteSpace: "wrap",
    color: "#94a3b8",
    flex: 1,
  },
};