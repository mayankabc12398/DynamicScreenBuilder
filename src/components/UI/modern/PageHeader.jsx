import React from "react";

/**
 * PageHeader — optional breadcrumb line, title, one-line subtitle and an actions slot
 * on the right (design system .hx-page-head). Put the ViewModeToggle, primary buttons
 * or counters in `actions`.
 *
 *   <PageHeader crumb="Clinical / Consultations" title="Patient appointments"
 *               subtitle="Search and manage consultations" actions={<ViewModeToggle/>} />
 */
const PageHeader = ({ crumb, crumbIcon, title, subtitle, actions, className = "" }) => (
  <div className={`hx-page-head ${className}`}>
    <div>
      {crumb ? (
        <div className="hx-page-head__crumb">
          {crumbIcon}
          {crumb}
        </div>
      ) : null}
      <h1 className="hx-page-head__title">{title}</h1>
      {subtitle ? <p className="hx-page-head__sub">{subtitle}</p> : null}
    </div>
    {actions ? <div className="hx-page-head__actions">{actions}</div> : null}
  </div>
);

export default PageHeader;
