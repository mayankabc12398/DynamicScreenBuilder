/**
 * The marks of one page as an SVG in mm (viewBox = page size). Static, so the
 * same markup draws on screen, under the designer and in the print iframe.
 */
import React, { memo } from "react";
import { itemD } from "./shapes";
import { nfFileUrl } from "../../../networkServices/nursingFormBuilderApi";

/** One mark. Memoised: an unchanged mark (same object) is not redrawn when another one changes. */
export const DrawItem = memo(function DrawItem({ it, ghost = false }) {
  const w = Number(it.width) || 0.5;
  const hl = it.brush === "highlighter";
  const dash = it.dash === "dash" ? `${w * 3} ${w * 2}` : it.dash === "dot" ? `0.01 ${w * 2}` : undefined;
  if (it.kind === "image") {
    // an <img> (not SVG <image>) so the print iframe waits for it like the page backgrounds
    return (
      <foreignObject data-mark={it.id} x={Math.min(it.x, it.x + it.w)} y={Math.min(it.y, it.y + it.h)} width={Math.abs(it.w)} height={Math.abs(it.h)} opacity={ghost ? 0.5 : it.opacity ?? 1}>
        <img src={it.src || nfFileUrl(it.fileKey)} alt="" draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
      </foreignObject>
    );
  }
  if (it.kind === "text") {
    return (
      <foreignObject data-mark={it.id} x={Math.min(it.x, it.x + it.w)} y={Math.min(it.y, it.y + it.h)} width={Math.abs(it.w)} height={Math.abs(it.h)} opacity={ghost ? 0.5 : it.opacity ?? 1}>
        <div
          style={{
            width: "100%",
            height: "100%",
            fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
            // inside the mm viewBox one CSS px is one mm, so sizes are given in mm
            fontSize: `${(it.fontSize || 12) * 0.3528}px`,
            lineHeight: 1.2,
            color: it.stroke || "#111827",
            background: it.fill || "transparent",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "hidden",
            padding: "0.4px 0.8px",
            boxSizing: "border-box",
          }}
        >
          {it.text}
        </div>
      </foreignObject>
    );
  }
  const closed = !["stroke", "line", "curve"].includes(it.kind) && it.closed !== false;
  return (
    <path
      data-mark={it.id}
      d={itemD(it)}
      fill={closed && it.fill ? it.fill : "none"}
      fillOpacity={it.fillOpacity ?? 1}
      stroke={it.stroke && it.stroke !== "none" ? it.stroke : "none"}
      strokeWidth={w}
      strokeDasharray={dash}
      strokeLinecap={it.brush === "marker" ? "square" : "round"}
      strokeLinejoin="round"
      opacity={ghost ? 0.45 : hl ? 0.38 : it.opacity ?? 1}
      style={hl ? { mixBlendMode: "multiply" } : undefined}
    />
  );
});

/** The marks of one page. Memoised on the items array, page and size. */
function DrawLayer({ items, page, size, className = "", style }) {
  const list = (items || []).filter((it) => it.page === page);
  if (!list.length) return null;
  return (
    <svg className={`nfb-draw ${className}`} viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible", ...style }}>
      {list.map((it) => (
        <DrawItem key={it.id} it={it} />
      ))}
    </svg>
  );
}

export default memo(DrawLayer);
