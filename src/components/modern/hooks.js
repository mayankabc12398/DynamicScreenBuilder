import { useEffect, useState } from "react";

// rem so fields track the user's app font-size setting (1rem = --app-font-size, 12px default → ~25px)
export const FIELD_H = "2.0833rem";

export function usePopupPosition(wrapRef, popRef, open, popH = 280, popW = 0) {
  // start offscreen so the popup never flashes at 0,0 before first compute
  const [pos, setPos] = useState({ top: -9999, left: -9999, width: 0, openUp: false });
  useEffect(() => {
    if (!open) return;
    const compute = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      // popH/popW are only estimates; once the popup is in the DOM use its
      // real size so a smaller menu isn't offset by an oversized guess
      const measuredH = popRef?.current?.offsetHeight || 0;
      const effectiveH = measuredH || popH;
      const spaceBelow = window.innerHeight - r.bottom;
      const openUp = spaceBelow < effectiveH + 12 && r.top > effectiveH + 12;
      const top = openUp
        ? r.top + window.scrollY - effectiveH - 6
        : r.bottom + window.scrollY + 6;

      const measuredW = popRef?.current?.offsetWidth || 0;
      const effectiveW = Math.max(measuredW || popW || 0, r.width);
      const vpRight = window.scrollX + window.innerWidth - 8;
      const vpLeft = window.scrollX + 8;
      let left = r.left + window.scrollX;
      // overflowing right: align popup's right edge with the field first,
      // only then clamp to the viewport
      if (left + effectiveW > vpRight) left = r.right + window.scrollX - effectiveW;
      if (left + effectiveW > vpRight) left = vpRight - effectiveW;
      if (left < vpLeft) left = vpLeft;

      setPos({ top, left, width: r.width, openUp });
    };
    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open, popH, popW, wrapRef]);
  return pos;
}

export function useOutside(wrapRef, popRef, open, close) {
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const inWrap = wrapRef.current && wrapRef.current.contains(e.target);
      const inPop = popRef.current && popRef.current.contains(e.target);
      if (!inWrap && !inPop) close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, wrapRef, popRef]);
}

export const fmtISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const WK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
