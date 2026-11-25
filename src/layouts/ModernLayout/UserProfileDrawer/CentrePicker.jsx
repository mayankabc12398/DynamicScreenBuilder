import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@app/hooks/useTheme";
import { zIndex } from "@app/design-system/tokens/zIndex";

export default function CentrePicker({ centres = [], value, onChange }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const current = centres.find((x) => Number(x.CentreID) === Number(value));
  const filtered = q
    ? centres.filter((x) =>
        (x.CentreName || "").toLowerCase().includes(q.toLowerCase())
      )
    : centres;

  const computePos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const popH = Math.min(280, Math.max(120, filtered.length * 36 + 56));
    const popW = Math.max(r.width, 220);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < popH + 12 && r.top > popH + 12;
    const top = openUp
      ? r.top + window.scrollY - popH - 6
      : r.bottom + window.scrollY + 6;
    let left = r.left + window.scrollX;
    if (left + popW > window.scrollX + window.innerWidth - 8) {
      left = window.scrollX + window.innerWidth - popW - 8;
    }
    if (left < 8) left = 8;
    setPos({ top, left, width: popW });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    const onDoc = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
      setQ("");
    };
    const onKey = (e) => e.key === "Escape" && (setOpen(false), setQ(""));
    const onScroll = () => computePos();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, filtered.length]);

  const pick = (centre) => {
    onChange({ value: centre.CentreID, label: centre.CentreName });
    setOpen(false);
    setQ("");
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Change centre"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${open ? c.accent : c.border}`,
          background: open ? c.accentSoft : c.panel,
          color: c.text,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: 600,
          width: "100%",
          transition: ".15s",
        }}
      >
        <i className="fa fa-hospital-o" style={{ fontSize: 13, opacity: 0.8 }} />
        <span
          style={{
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {current?.CentreName || "Select Centre"}
        </span>
        <i
          className="fas fa-chevron-down"
          style={{
            fontSize: 10,
            opacity: 0.7,
            transform: open ? "rotate(180deg)" : "none",
            transition: ".2s",
          }}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              zIndex: zIndex.notification + 50,
              width: pos.width,
              maxHeight: 320,
              background: c.panel,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              boxShadow:
                "0 20px 48px -18px rgba(15,23,42,.4), 0 0 0 4px " + c.accentSoft,
              padding: 4,
              display: "flex",
              flexDirection: "column",
              fontFamily: "'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
            }}
          >
            <div
              style={{
                position: "relative",
                padding: 6,
                borderBottom: `1px solid ${c.border}`,
              }}
            >
              <i
                className="fas fa-search"
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: c.textMuted,
                  fontSize: 11,
                }}
              />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search centre…"
                style={{
                  width: "100%",
                  height: 30,
                  paddingLeft: 30,
                  paddingRight: 8,
                  borderRadius: 8,
                  border: `1px solid ${c.border}`,
                  background: c.panel2,
                  color: c.text,
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ overflowY: "auto", padding: 3 }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "14px 10px",
                    textAlign: "center",
                    color: c.textMuted,
                    fontSize: 12,
                  }}
                >
                  No centres
                </div>
              ) : (
                filtered.map((x) => {
                  const active = Number(x.CentreID) === Number(value);
                  return (
                    <button
                      key={x.CentreID}
                      type="button"
                      onClick={() => pick(x)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 7,
                        border: "none",
                        background: active ? c.accentSoft : "transparent",
                        color: active ? c.accent : c.text,
                        fontWeight: active ? 700 : 500,
                        fontSize: 12.5,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = c.accentSoft;
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <i className="fa fa-hospital-o" style={{ fontSize: 12, opacity: 0.7 }} />
                      <span style={{ flex: 1 }}>{x.CentreName}</span>
                      {active && <i className="fas fa-check" style={{ fontSize: 10 }} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
