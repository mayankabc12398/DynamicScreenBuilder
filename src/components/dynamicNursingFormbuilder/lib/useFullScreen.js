/**
 * Full screen for one panel (the patient form): the browser goes full screen on
 * the whole page — so toasts, the signature pad and the toolbar pop-ups, all
 * portalled to <body>, still show — and the panel is pinned over everything
 * (.is-full: position fixed, inset 0).
 *
 * A transformed / filtered ancestor (a modal or drawer the frame menu opens in)
 * would turn that fixed box into one relative to itself, so those ancestors have
 * transform / filter / contain lifted while full and put back after.
 *
 * Esc leaves (the browser's own Esc, or ours when the browser refused full
 * screen), unless a dialog is open — then Esc is the dialog's.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const LIFT = ["transform", "filter", "perspective", "contain", "will-change", "backdrop-filter"];

function liftAncestors(el) {
  const undo = [];
  for (let p = el?.parentElement; p && p !== document.body; p = p.parentElement) {
    const cs = getComputedStyle(p);
    const traps =
      cs.transform !== "none" || cs.filter !== "none" || cs.perspective !== "none" || /paint|layout|strict|content/.test(cs.contain) || /transform|filter/.test(cs.willChange) || (cs.backdropFilter && cs.backdropFilter !== "none");
    if (!traps) continue;
    const before = LIFT.map((k) => [k, p.style.getPropertyValue(k), p.style.getPropertyPriority(k)]);
    LIFT.forEach((k) => p.style.setProperty(k, "none", "important"));
    p.style.setProperty("animation", "none", "important");
    undo.push(() => {
      before.forEach(([k, v, pr]) => (v ? p.style.setProperty(k, v, pr) : p.style.removeProperty(k)));
      p.style.removeProperty("animation");
    });
  }
  return () => undo.forEach((u) => u());
}

export default function useFullScreen(ref) {
  const [full, setFull] = useState(false);
  const mine = useRef(false); // the browser full screen is ours to leave
  const restore = useRef(null);

  const leave = useCallback(() => {
    setFull(false);
    restore.current?.();
    restore.current = null;
    if (mine.current && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    mine.current = false;
  }, []);

  const enter = useCallback(async () => {
    restore.current = liftAncestors(ref.current);
    setFull(true);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        mine.current = true;
      } catch {
        /* refused (iframe, policy): the panel still fills the window */
      }
    }
  }, [ref]);

  const toggle = useCallback(() => (full ? leave() : enter()), [full, enter, leave]);

  useEffect(() => {
    if (!full) return undefined;
    const onChange = () => {
      if (mine.current && !document.fullscreenElement) {
        mine.current = false;
        leave();
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector(".nfb-modal")) leave();
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, [full, leave]);

  // switching forms / closing the screen while full: leave cleanly
  useEffect(() => () => leave(), [leave]);

  return { full, toggle };
}
