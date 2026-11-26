/**
 * Styled hover tooltips for the whole builder. Every control already carries a
 * plain `title`; while the pointer is on one inside .pbx, its title is parked in
 * data-pbx-title (so the browser's own yellow box never shows) and this card is
 * drawn instead, portalled to <body> above everything. The title is put back on
 * leave, so React's view of the attribute stays true.
 *
 * A trailing shortcut — "Save draft (Ctrl+S)" — is shown as key caps.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { uiZoom } from "./zoom";

const DELAY = 380; // first tip
const WARM = 90; // moving from one tip to the next
const KEYS = /\s*\(((?:Ctrl|Alt|Shift|Esc|Del|Enter|Tab|F\d+|\?|←|→|↑|↓)[^()]*)\)\s*$/i;

function split(text) {
  const m = text.match(KEYS);
  if (!m) return { body: text, keys: null };
  const keys = m[1].split(/\s*\/\s*/).map((combo) => combo.split("+").map((k) => k.trim()).filter(Boolean));
  return { body: text.slice(0, m.index).trim(), keys };
}

export default function TipLayer() {
  const [tip, setTip] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    let cur = null; // element whose title is parked
    let timer = 0;
    let warmUntil = 0;
    let shown = false;
    const restore = () => {
      if (cur && cur.hasAttribute("data-pbx-title")) {
        if (!cur.hasAttribute("title")) cur.setAttribute("title", cur.getAttribute("data-pbx-title"));
        cur.removeAttribute("data-pbx-title");
      }
      cur = null;
    };
    const hide = (warm = false) => {
      clearTimeout(timer);
      restore();
      if (shown && warm) warmUntil = Date.now() + 400;
      shown = false;
      setTip(null);
    };
    const over = (e) => {
      const el = e.target instanceof Element ? e.target.closest("[title], [data-pbx-title]") : null;
      if (el === cur) return;
      if (cur) hide(true);
      if (!el || !el.closest(".pbx") || el.closest(".pbx-tour-card")) return;
      const text = (el.getAttribute("title") || "").trim();
      if (!text) return;
      cur = el;
      el.setAttribute("data-pbx-title", text);
      el.removeAttribute("title");
      timer = setTimeout(
        () => {
          if (cur !== el || !el.isConnected) return;
          const r = el.getBoundingClientRect();
          shown = true;
          setTip({ text, r });
        },
        Date.now() < warmUntil ? WARM : DELAY,
      );
    };
    const out = (e) => {
      if (cur && !(e.relatedTarget instanceof Node && cur.contains(e.relatedTarget))) hide(true);
    };
    const quit = () => hide(false);
    document.addEventListener("mouseover", over, true);
    document.addEventListener("mouseout", out, true);
    document.addEventListener("mousedown", quit, true);
    document.addEventListener("keydown", quit, true);
    window.addEventListener("scroll", quit, true);
    window.addEventListener("blur", quit);
    return () => {
      hide(false);
      document.removeEventListener("mouseover", over, true);
      document.removeEventListener("mouseout", out, true);
      document.removeEventListener("mousedown", quit, true);
      document.removeEventListener("keydown", quit, true);
      window.removeEventListener("scroll", quit, true);
      window.removeEventListener("blur", quit);
    };
  }, []);

  // above the control when it fits (below for the top toolbar); kept inside the window; arrow on the control
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !tip) return;
    const { r } = tip;
    const z = uiZoom(); // the layer is zoomed like the builder: screen px = CSS px × z
    const w = card.offsetWidth * z;
    const h = card.offsetHeight * z;
    // toolbar controls near the top open downward, onto the canvas, not over the app header
    const below = r.top < window.innerHeight * 0.22 ? r.bottom + h + 10 < window.innerHeight - 6 : r.top - h - 10 < 6;
    const top = below ? r.bottom + 10 : r.top - h - 10;
    const left = Math.max(6, Math.min(window.innerWidth - w - 6, r.left + r.width / 2 - w / 2));
    card.style.top = `${top / z}px`;
    card.style.left = `${left / z}px`;
    card.style.setProperty("--ax", `${Math.max(10, Math.min(w - 10, r.left + r.width / 2 - left)) / z}px`);
    card.classList.toggle("is-below", below);
    card.classList.add("is-on");
  }, [tip]);

  if (!tip) return null;
  const { body, keys } = split(tip.text);
  return createPortal(
    <div className="pbx pbx-tipl-layer">
      <div ref={cardRef} className="pbx-tipl" role="tooltip">
        {body && <span className="pbx-tipl-text">{body}</span>}
        {keys && (
          <span className="pbx-tipl-keys">
            {keys.map((combo, i) => (
              <span key={i} className="pbx-tipl-combo">
                {i > 0 && <span className="pbx-tipl-or">/</span>}
                {combo.map((k, j) => (
                  <kbd key={j}>{k}</kbd>
                ))}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}
