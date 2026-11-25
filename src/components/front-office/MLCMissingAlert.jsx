import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiUrls } from "../../networkServices/apiEndpoints";
import makeApiRequest from "../../networkServices/axiosInstance";

const POLL_MS = 5 * 60 * 1000;

async function fetchMLCMissing() {
  try {
    const res = await makeApiRequest(apiUrls.GetMLCMissingDocPatients, { method: "GET" });
    console.log("[MLCAlert] api response:", res);
    if (res?.success && Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data)) return res.data;
  } catch (err) {
    console.error("[MLCAlert] fetch error:", err);
  }
  return [];
}

export default function MLCMissingAlert() {
  const [patients, setPatients] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [pos, setPos] = useState({ right: 332, bottom: 70 }); // offset from AadhaarAlert
  const dragging = useRef(false);
  const dragStart = useRef({});
  const cardRef = useRef(null);

  const load = useCallback(async () => {
    const list = await fetchMLCMissing();
    setPatients(list);
    if (list.length > 0) setDismissed(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const startDrag = useCallback((e) => {
    dragging.current = true;
    const src = e.touches ? e.touches[0] : e;
    const rect = cardRef.current?.getBoundingClientRect();
    dragStart.current = {
      clientX: src.clientX,
      clientY: src.clientY,
      right: pos.right,
      bottom: pos.bottom,
      width: rect?.width ?? 300,
      height: rect?.height ?? 200,
    };

    const onMove = (ev) => {
      if (!dragging.current) return;
      const mv = ev.touches ? ev.touches[0] : ev;
      const dx = mv.clientX - dragStart.current.clientX;
      const dy = mv.clientY - dragStart.current.clientY;
      setPos({
        right:  Math.max(0, Math.min(window.innerWidth  - dragStart.current.width,  dragStart.current.right  - dx)),
        bottom: Math.max(0, Math.min(window.innerHeight - dragStart.current.height, dragStart.current.bottom - dy)),
      });
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener("mousemove",  onMove);
    window.addEventListener("mouseup",    onUp);
    window.addEventListener("touchmove",  onMove, { passive: true });
    window.addEventListener("touchend",   onUp);
    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseup",    onUp);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("touchend",   onUp);
    };
  }, [pos]);

  if (dismissed || patients.length === 0) return null;

  const count = patients.length;

  return (
    <>
      <style>{`
        @keyframes mlcAlertGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,.18); }
          50%      { box-shadow: 0 0 0 6px rgba(124,58,237,.06); }
        }
        @keyframes mlcBell {
          0%,100% { transform: rotate(0deg); }
          10%      { transform: rotate(-14deg); }
          20%      { transform: rotate(14deg); }
          30%      { transform: rotate(-10deg); }
          40%      { transform: rotate(10deg); }
          50%      { transform: rotate(0deg); }
        }
      `}</style>
      <div
        ref={cardRef}
        role="alert"
        style={{
          position: "fixed",
          right: pos.right,
          bottom: pos.bottom,
          zIndex: 1091,
          width: 300,
          maxWidth: "calc(100vw - 24px)",
          background: "#fff",
          border: "1px solid #ddd6fe",
          borderRadius: 14,
          overflow: "hidden",
          animation: "mlcAlertGlow 1.6s ease-in-out infinite",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          userSelect: dragging.current ? "none" : "auto",
        }}
      >
        {/* Header / drag handle */}
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 11px",
            background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
            color: "#fff",
            cursor: "grab",
          }}
        >
          <i
            className="fas fa-gavel"
            style={{ fontSize: 14, animation: "mlcBell 2s ease-in-out infinite" }}
            aria-hidden="true"
          />
          <span style={{ fontSize: "12.5px", fontWeight: 700, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            MLC Document Missing
          </span>
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#5b21b6", background: "#fff",
            borderRadius: 999, padding: "1px 8px", minWidth: 22, textAlign: "center",
          }}>{count}</span>
          <i
            className="fas fa-chevron-down"
            style={{ fontSize: 11, cursor: "pointer", transition: "transform .2s", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-hidden="true"
            title="Collapse"
          />
          <i
            className="fas fa-times"
            style={{ fontSize: 13, cursor: "pointer", opacity: 0.9, marginLeft: 2 }}
            onClick={() => setDismissed(true)}
            onMouseDown={(e) => e.stopPropagation()}
            aria-hidden="true"
            title="Dismiss"
          />
        </div>

        {/* Body */}
        {expanded && (
          <div style={{ padding: "8px 10px 10px" }}>
            <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: 7, lineHeight: 1.35 }}>
              <i className="fas fa-triangle-exclamation" style={{ color: "#7c3aed", marginRight: 5 }} aria-hidden="true" />
              {count === 1
                ? "1 MLC patient registered today — document not uploaded."
                : `${count} MLC patients registered today — documents not uploaded.`}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
              {patients.map((p, i) => (
                <div
                  key={p?.uhid || i}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    border: "1px solid #ddd6fe", background: "#f5f3ff",
                    borderRadius: 9, padding: "6px 9px",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#1f2a37", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p?.patientName || "-"}
                    </span>
                    <span style={{ display: "block", fontSize: "10.5px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p?.uhid || ""}
                      {p?.mobile ? ` · ${p.mobile}` : ""}
                      {p?.mlcType ? ` · ${p.mlcType}` : ""}
                    </span>
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#fff", background: "#7c3aed", borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap" }}>
                    MLC
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
