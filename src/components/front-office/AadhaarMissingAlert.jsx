import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiUrls } from "../../networkServices/apiEndpoints";
import makeApiRequest from "../../networkServices/axiosInstance";

const POLL_MS = 5 * 60 * 1000; // refresh every 5 minutes

async function fetchMissing() {
  try {
    const res = await makeApiRequest(apiUrls.GetAadhaarMissingPatients, { method: "GET" });
    console.log("[AadhaarAlert] api response:", res);
    if (res?.success && Array.isArray(res?.data)) return res.data;
    // Backend may return data array even when success is falsy
    if (Array.isArray(res?.data)) return res.data;
  } catch (err) {
    console.error("[AadhaarAlert] fetch error:", err);
  }
  return [];
}

// Draggable floating alert — same pattern as Emergency Critical Vitals Alert
export default function AadhaarMissingAlert() {
  const [patients, setPatients] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [pos, setPos] = useState({ right: 16, bottom: 70 });
  const dragging = useRef(false);
  const dragStart = useRef({});
  const cardRef = useRef(null);

  const load = useCallback(async () => {
    const list = await fetchMissing();
    setPatients(list);
    if (list.length > 0) setDismissed(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Drag logic
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
      const newRight = Math.max(0, Math.min(window.innerWidth - dragStart.current.width, dragStart.current.right - dx));
      const newBottom = Math.max(0, Math.min(window.innerHeight - dragStart.current.height, dragStart.current.bottom - dy));
      setPos({ right: newRight, bottom: newBottom });
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [pos]);

  if (dismissed || patients.length === 0) return null;

  const count = patients.length;

  return (
    <>
      <style>{`
        @keyframes aadhaarAlertGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(234,88,12,.18); }
          50%      { box-shadow: 0 0 0 6px rgba(234,88,12,.06); }
        }
        @keyframes aadhaarBell {
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
          zIndex: 1090,
          width: 300,
          maxWidth: "calc(100vw - 24px)",
          background: "#fff",
          border: "1px solid #fed7aa",
          borderRadius: 14,
          overflow: "hidden",
          animation: "aadhaarAlertGlow 1.6s ease-in-out infinite",
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
            background: "linear-gradient(135deg,#ea580c,#c2410c)",
            color: "#fff",
            cursor: "grab",
          }}
        >
          <i
            className="fas fa-id-card"
            style={{ fontSize: 14, animation: "aadhaarBell 2s ease-in-out infinite" }}
            aria-hidden="true"
          />
          <span style={{ fontSize: "12.5px", fontWeight: 700, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Aadhaar Not Uploaded
          </span>
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#c2410c", background: "#fff",
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
              <i className="fas fa-triangle-exclamation" style={{ color: "#ea580c", marginRight: 5 }} aria-hidden="true" />
              {count === 1
                ? "1 patient registered today has not uploaded Aadhaar card."
                : `${count} patients registered today have not uploaded Aadhaar card.`}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 200, overflowY: "auto" }}>
              {patients.map((p, i) => (
                <div
                  key={p?.uhid || i}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    border: "1px solid #fed7aa", background: "#fff7ed",
                    borderRadius: 9, padding: "6px 9px",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ea580c", flexShrink: 0 }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#1f2a37", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p?.patientName || "-"}
                    </span>
                    <span style={{ display: "block", fontSize: "10.5px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p?.uhid || ""}{p?.mobile ? ` · ${p.mobile}` : ""}
                    </span>
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#fff", background: "#ea580c", borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap" }}>
                    NO AADHAAR
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
