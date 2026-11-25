import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * ModernQuickActions — Quick Actions popover for the modern sidebar.
 *
 * Its popover hosts #modern-action-slot, the portal target into which the
 * classic <Header/> renders its action icons (theme, notifications, fullscreen,
 * language, Google, email, home, set-default, layout switch, …). The slot is
 * always in the DOM (so the portal target is stable); the popover is shown/
 * hidden via the `open` class.
 *
 * `trigger` is a render-prop: ({ open, toggle }) => ReactNode.
 */
const ModernQuickActions = ({ trigger, align = "side" }) => {
  const [t] = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="ml-qa" ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      <div className={`ml-qa-pop ml-qa-${align} ${open ? "open" : ""}`}>
        <div className="ml-qa-head">{t("Quick Actions")}</div>
        {/* portal target — Header renders its action icons here in Modern mode */}
        <ul id="modern-action-slot" className="ml-qa-actions" />
      </div>
    </div>
  );
};

export default ModernQuickActions;
