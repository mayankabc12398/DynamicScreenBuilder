/**
 * pbConfirm — the print builder's own confirmation dialog, in place of
 * window.confirm. Promise-based so a call site reads the same:
 *
 *   if (!(await pbConfirm({ title: "Delete block?", message: "…", confirmLabel: "Delete" }))) return;
 *
 * Built straight on the DOM (like askReprintReason) so it works from any
 * handler without a provider. Buttons are spans with role=button: the app's
 * theme.css paints every bare <button> solid (see ui/Tap.jsx).
 * Enter presses the focused button (Cancel first for a delete), Esc / backdrop
 * cancel; focus returns afterwards.
 */

const STYLE_ID = "pbx-confirm-style";
const CSS = `
.pbxc-back{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:16px;background:rgba(15,23,42,.42);backdrop-filter:blur(3px);animation:pbxcFade .16s ease-out}
.pbxc-card{width:min(420px,100%);background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(15,23,42,.28),0 2px 6px rgba(15,23,42,.08);overflow:hidden;font-family:Inter,"Segoe UI",system-ui,Arial,sans-serif;color:#0f172a;animation:pbxcPop .18s cubic-bezier(.2,.9,.3,1.2)}
.pbxc-band{height:4px;background:var(--pbxc-band)}
.pbxc-body{display:flex;gap:14px;padding:20px 22px 8px}
.pbxc-ic{flex:none;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--pbxc-soft);color:var(--pbxc-ink);box-shadow:inset 0 0 0 1px var(--pbxc-line)}
.pbxc-ic svg{width:21px;height:21px}
.pbxc-txt{min-width:0;display:flex;flex-direction:column;gap:6px;padding-top:2px}
.pbxc-title{margin:0;font-size:16px;font-weight:700;line-height:1.3}
.pbxc-msg{margin:0;font-size:13px;line-height:1.55;color:#475569;white-space:pre-line;overflow-wrap:anywhere}
.pbxc-chip{align-self:flex-start;margin-top:2px;font:600 12px/1 "Roboto Mono",Consolas,monospace;padding:5px 8px;border-radius:7px;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pbxc-foot{display:flex;justify-content:flex-end;gap:8px;padding:16px 22px 18px}
.pbxc-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:88px;height:36px;padding:0 16px;border-radius:10px;font-size:13px;font-weight:650;cursor:pointer;user-select:none;outline:none;transition:background .12s,box-shadow .12s,transform .08s}
.pbxc-btn:active{transform:scale(.97)}
.pbxc-cancel{background:#fff;color:#334155;box-shadow:inset 0 0 0 1px #d6dde6}
.pbxc-cancel:hover{background:#f8fafc}
.pbxc-ok{color:#fff;background:var(--pbxc-btn);box-shadow:0 4px 12px var(--pbxc-shadow)}
.pbxc-ok:hover{filter:brightness(1.06)}
.pbxc-btn:focus-visible{box-shadow:0 0 0 3px var(--pbxc-ring)}
.pbxc-ok:focus-visible{box-shadow:0 0 0 3px var(--pbxc-ring),0 4px 12px var(--pbxc-shadow)}
.pbxc-out{animation:pbxcFade .12s ease-in reverse forwards}
@keyframes pbxcFade{from{opacity:0}to{opacity:1}}
@keyframes pbxcPop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pbxc-back,.pbxc-card,.pbxc-out{animation:none}}
`;

const TONES = {
  danger: { band: "linear-gradient(90deg,#fb7185,#e11d48)", soft: "#fff1f2", ink: "#e11d48", line: "#fecdd3", btn: "linear-gradient(180deg,#f43f5e,#e11d48)", shadow: "rgba(225,29,72,.28)", ring: "rgba(244,63,94,.3)" },
  warn: { band: "linear-gradient(90deg,#fbbf24,#f59e0b)", soft: "#fffbeb", ink: "#d97706", line: "#fde68a", btn: "linear-gradient(180deg,#f59e0b,#d97706)", shadow: "rgba(217,119,6,.28)", ring: "rgba(245,158,11,.3)" },
  info: { band: "linear-gradient(90deg,#0ea5e9,#6366f1,#a855f7)", soft: "#eef2ff", ink: "#4f46e5", line: "#c7d2fe", btn: "linear-gradient(180deg,#6366f1,#4f46e5)", shadow: "rgba(79,70,229,.28)", ring: "rgba(99,102,241,.3)" },
};

const ICONS = {
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  alert: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  leave: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  replace: '<path d="M4 4v5h5M20 20v-5h-5M5.5 15a7 7 0 0 0 12.3 1.5M18.5 9A7 7 0 0 0 6.2 7.5"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
};

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * @param {{ title: string, message?: string, detail?: string, confirmLabel?: string,
 *           cancelLabel?: string, tone?: "danger"|"warn"|"info", icon?: keyof ICONS }} o
 * @returns {Promise<boolean>}
 */
export function pbConfirm(o) {
  if (typeof document === "undefined") return Promise.resolve(false);
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const tone = TONES[o.tone] || TONES.danger;
  const icon = ICONS[o.icon] || ICONS[o.tone === "info" ? "question" : o.tone === "warn" ? "alert" : "trash"];
  const prevFocus = document.activeElement;
  const back = document.createElement("div");
  back.className = "pbxc-back";
  back.style.cssText = Object.entries({ band: tone.band, soft: tone.soft, ink: tone.ink, line: tone.line, btn: tone.btn, shadow: tone.shadow, ring: tone.ring })
    .map(([k, v]) => `--pbxc-${k}:${v}`)
    .join(";");
  back.innerHTML =
    `<div class="pbxc-card" role="alertdialog" aria-modal="true" aria-labelledby="pbxc-t" aria-describedby="pbxc-m">` +
    `<div class="pbxc-band"></div><div class="pbxc-body">` +
    `<span class="pbxc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span>` +
    `<div class="pbxc-txt"><h3 class="pbxc-title" id="pbxc-t">${esc(o.title)}</h3>` +
    (o.message ? `<p class="pbxc-msg" id="pbxc-m">${esc(o.message)}</p>` : "") +
    (o.detail ? `<span class="pbxc-chip" title="${esc(o.detail)}">${esc(o.detail)}</span>` : "") +
    `</div></div><div class="pbxc-foot">` +
    `<span class="pbxc-btn pbxc-cancel" role="button" tabindex="0" data-v="0">${esc(o.cancelLabel || "Cancel")}</span>` +
    `<span class="pbxc-btn pbxc-ok" role="button" tabindex="0" data-v="1">${esc(o.confirmLabel || "OK")}</span>` +
    `</div></div>`;
  document.body.appendChild(back);
  const ok = back.querySelector(".pbxc-ok");
  const cancel = back.querySelector(".pbxc-cancel");
  // a delete starts on Cancel, so a stray Enter never removes anything
  (TONES[o.tone] && o.tone !== "danger" ? ok : cancel).focus();

  return new Promise((resolve) => {
    let done = false;
    const close = (v) => {
      if (done) return;
      done = true;
      document.removeEventListener("keydown", onKey, true);
      back.classList.add("pbxc-out");
      setTimeout(() => {
        back.remove();
        if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
      }, 110);
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close(false);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        close(document.activeElement === cancel ? false : true);
      } else if (e.key === "Tab") {
        // keep focus on the two buttons
        e.preventDefault();
        (document.activeElement === ok ? cancel : ok).focus();
      } else {
        // the designer's own shortcuts (Delete, arrows…) must not fire behind the dialog
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", onKey, true);
    back.addEventListener("mousedown", (e) => e.target === back && close(false));
    ok.addEventListener("click", () => close(true));
    cancel.addEventListener("click", () => close(false));
  });
}
