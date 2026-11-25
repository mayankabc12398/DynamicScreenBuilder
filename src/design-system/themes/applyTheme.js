import { zIndex } from "../tokens/zIndex";

export function applyThemeCSSVars(theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([k, v]) => {
    root.style.setProperty(`--ds-color-${kebab(k)}`, v);
  });
  Object.entries(zIndex).forEach(([k, v]) => {
    root.style.setProperty(`--ds-z-${kebab(k)}`, String(v));
  });
  root.dataset.theme = theme.name;
}

function kebab(s) {
  return s.replace(/([A-Z])/g, "-$1").toLowerCase();
}
