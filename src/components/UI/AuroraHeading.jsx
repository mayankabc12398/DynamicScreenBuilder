import { useState, useEffect } from "react";
import { getThemeClassColor } from "../../utils/ustil2";

/* ============================================================
   AuroraHeading.jsx — slim page header for Hospedia (Aurora)
   ------------------------------------------------------------
   Design "B": 3px dark accent on the LEFT edge + thin 1px
   pastel border around the rest. Single row, ~40px tall.
   Layout: [icon tile] [title] [count chip] ...... [search] [filter] [action?]

   Self-contained: styles are injected once at runtime,
   no external CSS import, no icon library dependency.

   USAGE
   ------------------------------------------------------------
   import AuroraHeading from "./AuroraHeading";

   // Basic (search + filter appear automatically when handlers are passed)
   <AuroraHeading
     title="Patient Registration"
     count="128 today"
     color="green"
     searchPlaceholder="Search patients"
     onSearch={(value) => setQuery(value)}
     onFilter={() => setShowFilterPanel(true)}
   />

   // With the optional action button (renders ONLY when actionLabel is passed)
   <AuroraHeading
     title="Lab Reports"
     count="12 pending"
     color="blue"
     actionLabel="New Order"
     onAction={openNewOrderModal}
   />

   // Custom icon + custom palette object
   <AuroraHeading
     title="Blood Bank"
     icon={<MyBloodIcon />}
     color={{ accent: "#cf4545", soft: "#fcebeb", line: "#f1c4c4", ink: "#a32d2d" }}
   />

   // Controlled search input
   <AuroraHeading title="Billing" color="amber" searchValue={query} onSearch={setQuery} />

   COLOR CODING (module families)
   ------------------------------------------------------------
   green  — clinical (OPD, IPD, nursing, OT)        [default]
   teal   — alternate clinical / wellness
   blue   — diagnostics (lab, radiology)
   purple — pharmacy / stores
   amber  — billing & finance
   red    — emergency / blood bank

   LEGACY / AURORA TOGGLE
   ------------------------------------------------------------
   All colors flow through CSS variables set on the root element,
   so the legacy theme can re-skin it without touching markup:
     .legacy .ah-head { --ah-accent:#0d6efd; border-radius:4px; }
   Or render the old <Heading/> vs <AuroraHeading/> behind your
   Redux viewMode flag — both can share the same call-site props.
   ============================================================ */

export const AURORA_HEADING_COLORS = {
  green:  { accent: "#16876a", soft: "#d8efe6", line: "#b7dfcf", ink: "#0f6e56" },
  teal:   { accent: "#0f8a7a", soft: "#e0f4f1", line: "#b9e2db", ink: "#0b6557" },
  blue:   { accent: "#1d6fd8", soft: "#e3effc", line: "#bcd8f4", ink: "#1a5da8" },
  purple: { accent: "#6a5cd0", soft: "#eeebfd", line: "#d2ccf4", ink: "#5347b8" },
  amber:  { accent: "#b97a17", soft: "#faeeda", line: "#ecd6a9", ink: "#8a5310" },
  red:    { accent: "#cf4545", soft: "#fcebeb", line: "#f1c4c4", ink: "#a32d2d" },
};

const STYLE_ID = "aurora-heading-styles";

const CSS = `
.ah-head{--ah-accent:#8aa9d6;--ah-soft:#eaf1fb;--ah-line:#d6e3f5;--ah-ink:#5b6f97;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#eef4fc 0%,#e9ecfb 50%,#f3ecfb 100%);border:1px solid var(--ah-line);border-left:3px solid var(--ah-accent);border-radius:8px;padding:1px 10px;min-height:28px;box-sizing:border-box;transition:box-shadow .25s ease}
.ah-head *{box-sizing:border-box}
.ah-head:hover{box-shadow:0 4px 14px -8px rgba(15,23,42,.22)}
.ah-tile{width:26px;height:26px;border-radius:6px;background:var(--ah-soft);color:var(--ah-accent);display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}
.ah-tile svg{width:15px;height:15px;display:block}
.ah-title{font-size:14.5px;font-weight:600;color:#1f2937;margin:0;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.ah-chip{font-size:11px;font-weight:600;background:var(--ah-soft);color:var(--ah-ink);padding:2px 9px;border-radius:999px;white-space:nowrap;line-height:1.5;flex:0 0 auto}
.ah-right{margin-left:auto;display:flex;align-items:center;gap:6px;flex:0 0 auto}
.ah-search{height:27px;width:180px;font-size:12.5px;padding:0 9px;border:1px solid #e2e8f0;border-radius:6px;outline:none;background:#fff;color:#1f2937;transition:border-color .2s ease,box-shadow .2s ease}
.ah-search::placeholder{color:#94a3b8}
.ah-search:focus{border-color:var(--ah-accent);box-shadow:0 0 0 3px var(--ah-soft)}
.ah-iconbtn{width:27px;height:27px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:6px;background:#fff;color:#64748b;cursor:pointer;padding:0;transition:background .2s ease,color .2s ease,border-color .2s ease}
.ah-iconbtn:hover{background:var(--ah-soft);color:var(--ah-accent);border-color:var(--ah-line)}
.ah-iconbtn svg{width:14px;height:14px;display:block}
.ah-action{display:inline-flex;align-items:center;gap:5px;height:27px;padding:0 11px;font-size:12px;font-weight:600;color:var(--ah-ink);background:var(--ah-soft);border:1px solid var(--ah-line);border-radius:6px;cursor:pointer;white-space:nowrap;transition:filter .15s ease,transform .1s ease}
.ah-action:hover{filter:brightness(.96)}
.ah-action:active{transform:scale(.98)}
.ah-action svg{width:13px;height:13px;display:block}
.ah-iconbtn:focus-visible,.ah-action:focus-visible{outline:2px solid var(--ah-accent);outline-offset:1px}
/* ---- New View only: 25/75 split title vs secondTitle ---- */
.ah-head.ah-split{flex-wrap:nowrap}
.ah-head.ah-split .ah-title{flex:1 1 25%;max-width:25%;min-width:0}
.ah-head.ah-split .ah-right{flex:1 1 75%;min-width:0}
.ah-rightwrap{display:flex;align-items:center;gap:6px;min-width:0;flex:1 1 auto}
.ah-scrollx{min-width:0;flex:0 1 auto;display:flex;align-items:center;gap:6px;flex-wrap:nowrap;white-space:nowrap;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#dbeafe transparent}
.ah-scrollx>*,.ah-scrollx>*>*{flex:0 0 auto;white-space:nowrap}
.ah-scrollx::-webkit-scrollbar{height:4px}
.ah-scrollx::-webkit-scrollbar-track{background:transparent}
.ah-scrollx::-webkit-scrollbar-thumb{background:#dbeafe;border-radius:999px}
.ah-scrollx::-webkit-scrollbar-thumb:hover{background:#bfdbfe}
@media (max-width:640px){.ah-search{width:120px}.ah-title{font-size:13.5px}.ah-head.ah-split .ah-title{flex:0 0 50%;max-width:50%;min-width:0}.ah-head.ah-split .ah-right{flex:0 0 50%;max-width:50%;min-width:0}}
@media (prefers-reduced-motion:reduce){.ah-head,.ah-search,.ah-iconbtn,.ah-action{transition:none}}
`;

function ensureStyles() {
  if (typeof document === "undefined") return;
  let tag = document.getElementById(STYLE_ID);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_ID;
    document.head.appendChild(tag);
  }
  // Refresh when CSS const changed (HMR / SPA nav reusing an old tag)
  if (tag.textContent !== CSS) tag.textContent = CSS;
}

/* ---------- Built-in inline SVG icons (no dependency) ---------- */

const ActivityIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const FilterIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/* ---------------------------- Component ---------------------------- */

function AuroraHeading({
  title,
  icon,                       // optional ReactNode shown in the tile
  count,                      // optional string/number for the chip
  color = "green",            // family key OR {accent, soft, line, ink}
  titleTag = "h2",            // semantic heading level per page
  searchPlaceholder = "Search...",
  searchValue,                // pass to make the input controlled
  onSearch,                   // (value) => void — fires on every change
  showSearch,                 // override; defaults to Boolean(onSearch)
  onFilter,                   // () => void
  showFilter,                 // override; defaults to Boolean(onFilter)
  actionLabel,                // button renders only when this is passed
  onAction,                   // () => void
  actionIcon,                 // optional ReactNode; defaults to a plus
  rightContent = null,        // extra custom node before the search box
  split = false,              // New View: title 25% / right 75% split
  className = "",
  style = {},
  ...rest                     // onClick etc. forwarded to the root element
}) {
  ensureStyles();

  const getThemeColor = getThemeClassColor("text-theme-colornew")
  console.log("getThemeColorgetThemeColor",getThemeColor)
  const family =
    typeof color === "object" && color !== null
      ? color
      : AURORA_HEADING_COLORS[color] || AURORA_HEADING_COLORS.green;

  // Mobile breakpoint — split layout becomes 50/50 instead of 25/75 (inline
  // styles override CSS media queries, so this has to be driven from JS).
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width:640px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width:640px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [internalValue, setInternalValue] = useState("");
  const isControlled = searchValue !== undefined;
  const value = isControlled ? searchValue : internalValue;

  const handleSearchChange = (e) => {
    const v = e.target.value;
    if (!isControlled) setInternalValue(v);
    if (onSearch) onSearch(v);
  };

  const renderSearch = showSearch !== undefined ? showSearch : Boolean(onSearch);
  const renderFilter = showFilter !== undefined ? showFilter : Boolean(onFilter);

  const TitleTag = titleTag;

  
  const rootStyle = {
    "--ah-accent": getThemeColor,
    // "--ah-soft": family.soft,
    // "--ah-line": family.line,
    // "--ah-ink": family.ink,
    ...(split ? { flexWrap: "nowrap" } : {}),
    ...style,
  };

  // Load-bearing split layout kept inline so it never depends on injected CSS.
  // Mobile: 50/50 (title vs second title). Desktop: 25/75.
  const titleSplitStyle = split
    ? isMobile
      ? { flex: "0 0 50%", maxWidth: "50%", minWidth: 0 }
      : { flex: "1 1 25%", maxWidth: "25%", minWidth: 0 }
    : undefined;
  const rightSplitStyle = split
    ? isMobile
      ? { flex: "0 0 50%", maxWidth: "50%", minWidth: 0 }
      : { flex: "1 1 75%", minWidth: 0 }
    : undefined;

  return (
    <div className={`ah-head ${className}`} style={rootStyle} {...rest}>
      <span className="ah-tile background-theme-colornew text-theme-colornew" aria-hidden="true">
        {icon || <ActivityIcon />}
      </span>

      <TitleTag
        className="ah-title"
        style={titleSplitStyle}
        title={typeof title === "string" ? title : undefined}
      >
        {title}
      </TitleTag>

      {count !== undefined && count !== null && count !== "" && (
        <span className="ah-chip">{count}</span>
      )}

      <div className="ah-right" style={rightSplitStyle}>
        {rightContent}

        {renderSearch && (
          <input
            type="text"
            className="ah-search"
            value={value}
            placeholder={searchPlaceholder}
            onChange={handleSearchChange}
            aria-label={searchPlaceholder}
          />
        )}

        {renderFilter && (
          <button
            type="button"
            className="ah-iconbtn"
            onClick={onFilter}
            title="Filter"
            aria-label="Filter"
          >
            <FilterIcon />
          </button>
        )}

        {actionLabel && (
          <button type="button" className="ah-action" onClick={onAction}>
            {actionIcon !== undefined ? actionIcon : <PlusIcon />}
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default AuroraHeading;
