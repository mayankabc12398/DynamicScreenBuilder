import { useEffect, useState } from "react";

/**
 * True only in MODERN design + DARK theme (the combo dark.css targets:
 * :root[data-design="modern"][data-theme="dark"]). Both flags live on
 * <html> (documentElement). Updates live when the user toggles the theme.
 *
 * Use this in inline-styled screens where dark.css can't reach the styles
 * (CSS can't override element inline styles cleanly) — swap the JS colors.
 */
const read = () => {
  const el = document.documentElement;
  return (
    (el.dataset.design || "") === "modern" && (el.dataset.theme || "") === "dark"
  );
};

export default function useIsModernDark() {
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(read());
    update();
    const mo = new MutationObserver(update);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme", "data-design"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}
