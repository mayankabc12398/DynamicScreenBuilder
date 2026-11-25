import { useEffect } from "react";

const STYLE_ID = "modern-pop-anim";
const CSS = `
@keyframes mdPopIn { from { opacity: 0; transform: translateY(-4px) scale(.97); } to { opacity: 1; transform: none; } }
.md-pop { animation: mdPopIn .15s cubic-bezier(.4,0,.2,1) both; }
.md-pop button:hover { filter: brightness(1.02); }
@keyframes modernTipIn { from { opacity: 0; transform: translate(-50%, calc(-100% + 4px)); } to { opacity: 1; transform: translate(-50%, -100%); } }
`;

export function useModernPopAnim() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);
}
