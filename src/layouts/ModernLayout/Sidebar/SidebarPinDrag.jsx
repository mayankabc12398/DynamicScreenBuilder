import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@app/hooks/useTheme";
import { zIndex } from "@app/design-system/tokens/zIndex";

const DRAG_THRESHOLD = 5;

// Wrapper that makes its children a pin/collapse handle:
// click (no move) toggles collapse, drag pins the sidebar left/right.
export default function SidebarPinDrag({
  side,
  setSide,
  collapsed,
  onToggleCollapse,
  width,
  className,
  style,
  children,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startRef = useRef({ x: 0, moved: false });

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      setDragX(e.clientX);
      if (Math.abs(e.clientX - startRef.current.x) > DRAG_THRESHOLD) {
        startRef.current.moved = true;
      }
    };
    const onUp = (e) => {
      if (startRef.current.moved) {
        const mid = window.innerWidth / 2;
        setSide(e.clientX > mid ? "right" : "left");
      } else if (onToggleCollapse) {
        onToggleCollapse();
      }
      setDragging(false);
      startRef.current.moved = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, setSide, onToggleCollapse]);

  return (
    <>
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          startRef.current = { x: e.clientX, moved: false };
          setDragX(e.clientX);
          setDragging(true);
        }}
        className={className}
        title={
          (collapsed
            ? "Click to expand · Drag to pin sidebar "
            : "Click to collapse · Drag to pin sidebar ") +
          (side === "left" ? "(pinned left)" : "(pinned right)")
        }
        style={{ cursor: "grab", userSelect: "none", ...style }}
      >
        {children}
      </div>

      {dragging && startRef.current.moved &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: Math.max(0, dragX - width / 2),
              width,
              height: "100vh",
              zIndex: zIndex.notification,
              background: c.accent + "22",
              border: `2px dashed ${c.accent}`,
              borderRadius: 12,
              pointerEvents: "none",
              display: "grid",
              placeItems: "center",
              color: c.accent,
              fontWeight: 700,
              fontSize: 13,
              backdropFilter: "blur(2px)",
              fontFamily: "'Plus Jakarta Sans','Outfit',system-ui,sans-serif",
            }}
          >
            {dragX > window.innerWidth / 2 ? "Pin to Right →" : "← Pin to Left"}
          </div>,
          document.body
        )}
    </>
  );
}
