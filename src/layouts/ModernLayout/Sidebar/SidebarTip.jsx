import { createPortal } from "react-dom";

// Dark floating tooltip used across the sidebar (nav items, role switch).
// placement "above": centered over the anchor (drops below when no room).
// placement "side": next to the anchor, flips left when pinned right.
// tip = { top, left, below, flip, side, text }; text may be JSX.
export default function SidebarTip({ tip }) {
  if (!tip) return null;
  const slideFrom = tip.side
    ? `margin-left: ${tip.flip ? "4px" : "-4px"}`
    : `margin-top: ${tip.below ? "-4px" : "4px"}`;
  const slideTo = tip.side ? "margin-left: 0" : "margin-top: 0";
  return createPortal(
    <>
      <style>{`@keyframes sbNavTipIn { from { opacity: 0; ${slideFrom}; } to { opacity: 1; ${slideTo}; } }`}</style>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: tip.top,
          left: tip.left,
          transform: tip.side
            ? `translate(${tip.flip ? "-100%" : "0"}, -50%)`
            : `translate(-50%, ${tip.below ? "0" : "-100%"})`,
          pointerEvents: "none",
          zIndex: 2147483641,
          background:
            "linear-gradient(180deg, rgba(15,23,42,.97), rgba(30,41,59,.94))",
          color: "#fff",
          padding: "7px 11px",
          borderRadius: 9,
          boxShadow:
            "0 10px 28px -10px rgba(15,23,42,.55), 0 0 0 1px rgba(255,255,255,.06) inset",
          whiteSpace: "nowrap",
          maxWidth: 340,
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: 0.2,
          animation: "sbNavTipIn .18s ease-out",
        }}
      >
        {tip.text}
        {tip.side ? (
          <span
            style={{
              position: "absolute",
              top: "50%",
              [tip.flip ? "right" : "left"]: -4,
              transform: "translateY(-50%) rotate(45deg)",
              width: 8,
              height: 8,
              background: "rgba(30,41,59,.95)",
              borderRadius: 2,
            }}
          />
        ) : (
          <span
            style={{
              position: "absolute",
              left: "50%",
              [tip.below ? "top" : "bottom"]: -4,
              transform: "translateX(-50%) rotate(45deg)",
              width: 8,
              height: 8,
              background: tip.below
                ? "rgba(15,23,42,.97)"
                : "rgba(30,41,59,.95)",
              borderRadius: 2,
            }}
          />
        )}
      </div>
    </>,
    document.body
  );
}

// Builds tip state for an anchor element; pass onlyIfTruncated to limit to
// labels that are actually cut off with ellipsis.
export function makeTip(
  anchorEl,
  text,
  { onlyIfTruncated = false, placement = "above" } = {}
) {
  if (!anchorEl) return null;
  if (onlyIfTruncated) {
    const span = anchorEl.querySelector("[data-label]");
    if (!span || span.scrollWidth <= span.clientWidth + 1) return null;
  }
  const r = anchorEl.getBoundingClientRect();
  if (placement === "side") {
    const flip = r.right + 250 > window.innerWidth;
    return {
      top: r.top + r.height / 2,
      left: flip ? r.left - 10 : r.right + 10,
      flip,
      side: true,
      text,
    };
  }
  const below = r.top < 56; // no headroom — drop under the anchor instead
  return {
    top: below ? r.bottom + 8 : r.top - 8,
    left: r.left + r.width / 2,
    below,
    text,
  };
}
