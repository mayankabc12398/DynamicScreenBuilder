/**
 * Field box styles — one string used on screen (injected once by useFieldCss)
 * and inside the print iframe, so a print matches the screen exactly.
 */
import { useEffect } from "react";

export const FIELD_CSS = `
.nfb-fv{position:absolute;display:flex;box-sizing:border-box;padding:0 .6mm;line-height:1.15;overflow:hidden;white-space:pre-wrap;word-break:break-word}
.nfb-fv .nfb-fv-text{display:block;max-width:100%;max-height:100%;overflow:hidden}
.nfb-fv-code{width:100%;height:100%;display:block}
.nfb-fv-img{width:100%;height:100%;display:block;object-fit:contain;object-position:inherit}
.nfb-fv-bar{display:flex;flex-direction:column;width:100%;height:100%}
.nfb-fv-bar svg{flex:1 1 auto;width:100%;min-height:0;display:block}
.nfb-fv-bar-text{font-size:.75em;text-align:center;letter-spacing:.06em;line-height:1.1}
.nfb-fv-check{display:inline-flex;align-items:center;gap:1.2mm}
.nfb-fv-box{display:inline-flex;align-items:center;justify-content:center;width:3.6mm;height:3.6mm;border:.25mm solid currentColor;border-radius:.6mm;font-weight:700;line-height:1;flex:none}
.nfb-fv-radio{display:inline-flex;flex-wrap:wrap;gap:1mm 3mm;align-items:center}
.nfb-fv-opt{display:inline-flex;align-items:center;gap:1mm}
.nfb-fv-dot{width:3.2mm;height:3.2mm;border:.25mm solid currentColor;border-radius:50%;box-sizing:border-box;flex:none}
.nfb-fv-opt.is-on .nfb-fv-dot{background:radial-gradient(currentColor 0 40%,transparent 45%)}
.nfb-fv-sig{display:flex;flex-direction:column;width:100%;height:100%;align-items:inherit}
.nfb-fv-sig img{flex:1 1 auto;min-height:0;max-width:100%;object-fit:contain;object-position:left center}
.nfb-fv-sig-stamp{font-size:6.5pt;opacity:.75;white-space:nowrap}
@media print{.nfb-fv-placeholder,.nfb-fv-sign-cta{display:none}}
`;

let injected = false;
export function useFieldCss() {
  useEffect(() => {
    if (injected || typeof document === "undefined") return;
    const el = document.createElement("style");
    el.setAttribute("data-nfb", "fields");
    el.textContent = FIELD_CSS;
    document.head.appendChild(el);
    injected = true;
  }, []);
}
