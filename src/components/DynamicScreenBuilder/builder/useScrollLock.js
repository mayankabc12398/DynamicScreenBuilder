import { useEffect } from "react";

/**
 * Stops the page behind a modal from scrolling while the modal is open.
 *
 * Locks <html> and <body>, and every ancestor of `ref`'s element that scrolls
 * (the Modern layout scrolls .ml-content, not the document). Nested modals share
 * one lock: only the last one to close puts the old overflow values back.
 */
let holders = 0;
let saved = [];

export default function useScrollLock(ref) {
  useEffect(() => {
    holders += 1;
    if (holders === 1) {
      const targets = new Set([document.documentElement, document.body]);
      for (let p = ref?.current?.parentElement; p && p !== document.body; p = p.parentElement) {
        const oy = getComputedStyle(p).overflowY;
        if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight + 1) targets.add(p);
      }
      saved = [...targets].map((el) => [el, el.style.overflow, el.style.paddingRight]);
      // Keep the width the scrollbar took, so the page does not jump sideways.
      const gap = window.innerWidth - document.documentElement.clientWidth;
      saved.forEach(([el]) => {
        el.style.overflow = "hidden";
      });
      if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    }
    return () => {
      holders -= 1;
      if (holders === 0) {
        saved.forEach(([el, overflow, pad]) => {
          el.style.overflow = overflow;
          el.style.paddingRight = pad;
        });
        saved = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
