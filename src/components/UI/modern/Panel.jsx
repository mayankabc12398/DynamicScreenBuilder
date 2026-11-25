import React from "react";

/**
 * Panel — the standard titled container for modern screens.
 *
 * Reuses the app's `card card_background` / `card-header` classes so the active
 * theme (purple_theme, sky_blue_theme, …) styles the header automatically,
 * and layers the hx-* design-system classes on top for structure.
 *
 * <Panel title="PACS Image Viewer" icon={<FaImage />} actions={<button/>} flush>
 *   …body…
 * </Panel>
 */
const Panel = ({
  title,
  icon,
  actions,
  children,
  footer,
  flush = false,
  stage = false,
  className = "",
  bodyClassName = "",
  style,
  bodyStyle,
}) => (
  <div className={`hx-panel card card_background ${className}`} style={style}>
    <div className="hx-panel__head card-header">
      <span className="hx-panel__title">
        {icon}
        {title}
      </span>
      {actions ? <span className="hx-panel__actions">{actions}</span> : null}
    </div>

    <div
      className={[
        "hx-panel__body",
        stage ? "hx-panel__body--stage" : "hx-scroll",
        flush ? "hx-panel__body--flush" : "",
        bodyClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      style={bodyStyle}
    >
      {children}
    </div>

    {footer ? <div className="hx-panel__foot">{footer}</div> : null}
  </div>
);

export default Panel;
