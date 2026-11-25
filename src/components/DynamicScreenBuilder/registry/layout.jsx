/**
 * Layout registry entries. Every one of these is a container: children dropped
 * into them are real child nodes in the JSON, so nesting works to any depth.
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import ProjectHeading from "@app/components/UI/Heading";
import { DesignContext } from "@app/providers/DesignProvider";
import { CardHeadSlot, headTableOf } from "../runtime/cardHeadSlot";
import AppHeading from "./appHeading";
import {
  GROUPS,
  HEADING_FAMILY_OPTIONS,
  headingPalette,
  Icon,
  p,
  runIconAction,
  visibleIconActions,
  withAlpha,
} from "./shared";
import { crumbParts, useMenuBreadcrumb } from "../utils/breadcrumb";
import { FORM_CONTROL_TYPES } from "../schema/schema";

const JUSTIFY = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space between" },
  { value: "space-around", label: "Space around" },
];
const ALIGN = [
  { value: "stretch", label: "Stretch" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
];

const flexProps = (dirDefault) => [
  p.select(
    "direction",
    "Direction",
    [
      { value: "row", label: "Row" },
      { value: "column", label: "Column" },
    ],
    GROUPS.LAYOUT,
  ),
  // Auto-fit makes every direct child share the free space equally, so a row
  // of cards keeps a sensible width as items are dragged in or out. The class
  // targets direct children, which are the components at runtime and the
  // design-time node wrappers on the canvas — so both look identical.
  p.bool("autoFit", "Auto-fit children (equal width)", GROUPS.LAYOUT),
  p.number("minChildWidth", "Ideal child width (px)", GROUPS.LAYOUT, { when: (pr) => !!pr.autoFit }),
  // Wrapping freely is fine for cards and wrong for a filter block: six inputs
  // that reflow 7-and-1 read as a mistake. A count turns the container into the
  // same equal grid the Grid component uses, tiers and all.
  p.number("perRow", "Controls per row", GROUPS.LAYOUT, {
    hint: "Blank means 6 when the row holds controls, and free wrapping otherwise",
  }),
  p.number("gap", "Gap (px)", GROUPS.LAYOUT),
  p.number("padding", "Padding (px)", GROUPS.LAYOUT),
  p.select("justify", "Justify", JUSTIFY, GROUPS.LAYOUT),
  p.select("align", "Align", ALIGN, GROUPS.LAYOUT),
  p.bool("wrap", "Wrap", GROUPS.LAYOUT),
  p.color("background", "Background", GROUPS.APPEARANCE),
  p.number("radius", "Corner radius", GROUPS.APPEARANCE),
  p.bool("bordered", "Bordered", GROUPS.APPEARANCE),
  p.bool("shadow", "Shadow", GROUPS.APPEARANCE),
];

const flexStyle = (props, style) => ({
  display: "flex",
  // Feeds the .dsb-autofit rule: the width each child aims for before wrapping.
  ...(props.autoFit ? { "--dsb-autofit-basis": `${props.minChildWidth || 200}px` } : null),
  flexDirection: props.direction || "column",
  gap: `${4}px`,
  padding: props.padding !== undefined ? `2px` : undefined,
  justifyContent: props.justify || "flex-start",
  alignItems: props.align || "stretch",
  flexWrap: props.wrap ? "wrap" : "nowrap",
  background: props.background || undefined,
  borderRadius: props.radius !== undefined ? `${props.radius}px` : undefined,
  border: props.bordered ? "1px solid var(--dsb-border)" : undefined,
  boxShadow: props.shadow ? "var(--dsb-shadow)" : undefined,
  ...style,
});

/**
 * A container asked for a fixed number of controls per row becomes the same
 * equal grid the Grid component renders — one layout model, so a Row and a Grid
 * cannot disagree about what "six across" means.
 */
const perRowStyle = (grid, props, style) => ({
  ...formGridVars(grid),
  gap: `${props.gap ?? 12}px`,
  padding: props.padding !== undefined ? `${props.padding}px` : undefined,
  background: props.background || undefined,
  borderRadius: props.radius !== undefined ? `${props.radius}px` : undefined,
  border: props.bordered ? "1px solid var(--dsb-border)" : undefined,
  boxShadow: props.shadow ? "var(--dsb-shadow)" : undefined,
  ...style,
});

const CONTROLS = new Set(FORM_CONTROL_TYPES);

/**
 * Is this container holding a filter block?
 *
 * Flex wrapping fits as many children as the width allows and then stretches
 * whatever is left over, so eight controls come out seven-and-one, each row a
 * different width — which reads as the controls being in the wrong order rather
 * than as a row that happened to wrap. Fields want an even grid instead.
 *
 * Cards, panels and mixed content keep the flexible row they were built with:
 * three cards forced into sixths would be worse than the wrap ever was. Three
 * is the point at which a row is a block, and a clear majority keeps a panel
 * with one stray input out of it.
 */
function isControlRow(node) {
  const kids = (node?.children || []).filter((k) => k && !k.hidden);
  if (kids.length < 3) return false;
  // A screen imported from JSX keeps the page's own column wrappers — a
  // <div class="col-md-3"> around one input. It is the control that counts,
  // not the box the old page put it in.
  const kindOf = (k) =>
    k.type === "Column" && (k.children || []).length === 1 ? k.children[0]?.type : k.type;
  const controls = kids.filter((k) => CONTROLS.has(kindOf(k))).length;
  return controls >= 3 && controls >= kids.length * 0.6;
}

/**
 * The grid a container lays its children out on, or null for the flexible row.
 *
 * An explicit "Controls per row" always wins. Failing that, a row of controls
 * that was told to share the space equally gets the house layout — six across a
 * desktop — because "equal" is what it asked for and equal is what a fixed grid
 * actually delivers.
 */
function gridProps(node, props) {
  if (Number(props.perRow) > 0) {
    return { columns: props.perRow, colsLg: props.colsLg, colsMd: props.colsMd, colsSm: props.colsSm };
  }
  if (props.autoFit && props.perRow !== 0 && isControlRow(node)) {
    return { columns: COLS_DEFAULT.desktop, colsLg: props.colsLg, colsMd: props.colsMd, colsSm: props.colsSm };
  }
  return null;
}

const ContainerDef = {
  type: "Container",
  label: "Container",
  icon: "Box",
  category: "Layout",
  isContainer: true,
  dropHint: "Drop components here",
  defaultProps: { direction: "column", gap: 12, padding: 12, justify: "flex-start", align: "stretch", wrap: false },
  defaultStyle: {},
  events: ["onLoad"],
  propSchema: flexProps("column"),
  render: ({ node, props, style, children }) => {
    const grid = gridProps(node, props);
    return grid ? (
      <div className="dsb-container dsb-formgrid" style={perRowStyle(grid, props, style)}>
        {children}
      </div>
    ) : (
      <div className={`dsb-container ${props.autoFit ? "dsb-autofit" : ""}`} style={flexStyle(props, style)}>
        {children}
      </div>
    );
  },
};

const RowDef = {
  ...ContainerDef,
  type: "Row",
  label: "Row",
  icon: "Columns3",
  dropHint: "Drop components in this row",
  defaultProps: {
    direction: "row",
    gap: 12,
    padding: 0,
    justify: "flex-start",
    align: "stretch",
    wrap: true,
    autoFit: true,
    minChildWidth: 200,
  },
  render: ({ node, props, style, children }) => {
    const grid = gridProps(node, props);
    return grid ? (
      <div className="dsb-row dsb-formgrid" style={perRowStyle(grid, props, style)}>
        {children}
      </div>
    ) : (
      <div
        className={`dsb-row ${props.autoFit ? "dsb-autofit" : ""}`}
        style={flexStyle({ ...props, direction: props.direction || "row" }, style)}
      >
        {children}
      </div>
    );
  },
};

const ColumnDef = {
  ...ContainerDef,
  type: "Column",
  label: "Column",
  icon: "Rows3",
  dropHint: "Drop components in this column",
  defaultProps: { direction: "column", gap: 12, padding: 0, justify: "flex-start", align: "stretch", wrap: false, grow: 1 },
  propSchema: [...flexProps("column"), p.number("grow", "Flex grow", GROUPS.LAYOUT)],
  render: ({ props, style, children }) => (
    <div
      className={`dsb-col ${props.autoFit ? "dsb-autofit" : ""}`}
      style={{ ...flexStyle({ ...props, direction: "column" }, style), flex: props.grow ? `${props.grow} 1 0%` : undefined }}
    >
      {children}
    </div>
  ),
};

const FlexBoxDef = {
  ...ContainerDef,
  type: "FlexBox",
  label: "Flex Box",
  icon: "LayoutGrid",
  defaultProps: { direction: "row", gap: 8, padding: 0, justify: "space-between", align: "center", wrap: false },
  render: ({ props, style, children }) => (
    <div className={`dsb-flex ${props.autoFit ? "dsb-autofit" : ""}`} style={flexStyle(props, style)}>
      {children}
    </div>
  ),
};

/**
 * How many controls stand in a row, per screen size.
 *
 * Six across a desktop is the house layout — a filter block reads as one block
 * rather than a ragged wrap — and the smaller tiers are what keeps it usable on
 * the way down. They are written as CSS variables so one stylesheet rule serves
 * every grid on the screen (see `.dsb-formgrid` in runtime.css); the count is
 * clamped because a grid of 0 columns renders nothing and a grid of 40 renders
 * slivers.
 */
const COLS_DEFAULT = { desktop: 6, lg: 4, md: 2, sm: 1 };

const colCount = (v, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(12, n) : fallback;
};

export function formGridVars(props) {
  const desktop = colCount(props.columns, COLS_DEFAULT.desktop);
  return {
    "--dsb-fg": desktop,
    // Each tier falls back to the one above it rather than to a constant, so
    // setting only "Columns" still narrows sensibly.
    "--dsb-fg-lg": colCount(props.colsLg, Math.min(desktop, COLS_DEFAULT.lg)),
    "--dsb-fg-md": colCount(props.colsMd, Math.min(desktop, COLS_DEFAULT.md)),
    "--dsb-fg-sm": colCount(props.colsSm, Math.min(desktop, COLS_DEFAULT.sm)),
  };
}

const GridDef = {
  type: "GridLayout",
  label: "Grid",
  icon: "LayoutGrid",
  category: "Layout",
  isContainer: true,
  dropHint: "Drop components into the grid",
  defaultProps: {
    columns: 6,
    colsLg: 4,
    colsMd: 2,
    colsSm: 1,
    gap: 12,
    padding: 0,
    minColWidth: 200,
    autoFit: false,
    background: "",
    radius: 0,
  },
  defaultStyle: {},
  // Same as every other container: a grid is often what a screen fills on open.
  events: ["onLoad"],
  propSchema: [
    p.number("columns", "Controls per row", GROUPS.LAYOUT, {
      hint: "From 1200px up — the same width a hand-coded col-xl-2 row goes six across. Every cell is the same width, whatever the control is.",
    }),
    p.number("colsLg", "…on a laptop (992–1199px)", GROUPS.LAYOUT),
    p.number("colsMd", "…on a tablet (576–991px)", GROUPS.LAYOUT),
    p.number("colsSm", "…on a phone (under 576px)", GROUPS.LAYOUT),
    p.bool("autoFit", "Fit as many as fit instead", GROUPS.LAYOUT, {
      hint: "Ignores the counts above and packs by width",
    }),
    p.number("minColWidth", "Min column width", GROUPS.LAYOUT, { when: (pr) => !!pr.autoFit }),
    p.number("gap", "Gap (px)", GROUPS.LAYOUT),
    p.number("padding", "Padding (px)", GROUPS.LAYOUT),
    p.color("background", "Background", GROUPS.APPEARANCE),
    p.number("radius", "Corner radius", GROUPS.APPEARANCE),
    p.bool("bordered", "Bordered", GROUPS.APPEARANCE),
  ],
  render: ({ props, style, children }) => {
    const box = {
      gap: `${props.gap ?? 12}px`,
      padding: props.padding ? `${props.padding}px` : undefined,
      background: props.background || undefined,
      borderRadius: props.radius ? `${props.radius}px` : undefined,
      border: props.bordered ? "1px solid var(--dsb-border)" : undefined,
    };
    // Auto-fit packs by width and needs no tiers; the counted grid is the
    // stylesheet's, so the same rule can restate it per screen size.
    if (props.autoFit) {
      return (
        <div
          className="dsb-gridbox"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${props.minColWidth || 200}px, 1fr))`,
            ...box,
            ...style,
          }}
        >
          {children}
        </div>
      );
    }
    return (
      <div className="dsb-gridbox dsb-formgrid" style={{ ...formGridVars(props), ...box, ...style }}>
        {children}
      </div>
    );
  },
};

const CardPanelDef = {
  type: "CardPanel",
  label: "Card / Panel",
  icon: "LayoutPanelTop",
  category: "Layout",
  isContainer: true,
  dropHint: "Panel body",
  defaultProps: {
    title: "Panel",
    icon: "",
    iconColor: "",
    iconStyle: "badge",
    subtitle: "",
    collapsible: false,
    collapsed: false,
    closable: false,
    padding: 14,
    headerBg: "",
    headerColor: "",
    accent: "",
    shadow: true,
    bordered: true,
    radius: 12,
    actions: [],
    /**
     * "app" draws the header with the app's own <Heading /> — the card-header
     * strip of the classic skin, the Aurora bar of the modern one — so a built
     * card reads like every hand-coded page. "builder" is the older tinted bar.
     * Read as `props.headerStyle || "app"`: screens saved before this switch
     * existed get the app heading without being opened again.
     */
    headerStyle: "app",
    headingCount: "",
    headingSearch: false,
    headingSearchField: "",
    headingSearchPlaceholder: "Search…",
    headingFilter: false,
    headingActionLabel: "",
    headingActionIcon: "",
  },
  defaultStyle: {},
  events: ["onClick", "onOpen", "onClose", "onSearch", "onHeadingAction"],
  propSchema: [
    p.select(
      "headerStyle",
      "Header look",
      [
        { value: "app", label: "App heading (same as the hand-coded pages)" },
        { value: "builder", label: "Builder bar (tinted, icon badge)" },
        { value: "none", label: "No heading" },
      ],
      GROUPS.APPEARANCE,
      {
        allowEmpty: false,
        hint: "The app heading follows the skin that is switched on — the classic card header or the modern Aurora bar. No heading draws the card without a title strip; a table inside it then shows its count and view switch itself.",
      },
    ),
    p.template("title", "Title", GROUPS.CONTENT, { placeholder: "{{row.PatientName}}" }),
    p.template("subtitle", "Subtitle", GROUPS.CONTENT),
    p.template("headingCount", "Count badge", GROUPS.CONTENT, {
      when: (pr) => (pr.headerStyle || "app") === "app",
      placeholder: "{{rows.n_bills.length}}",
      hint: "A number or a binding, shown beside the title. Empty shows none.",
    }),
    p.bool("headingSearch", "Search box in the heading", GROUPS.BEHAVIOUR, {
      when: (pr) => (pr.headerStyle || "app") === "app",
      hint: "What is typed is stored under the field below and runs the card's onSearch event.",
    }),
    p.text("headingSearchField", "Search field name", GROUPS.DATA, {
      when: (pr) => (pr.headerStyle || "app") === "app" && !!pr.headingSearch,
      placeholder: "cardSearch",
    }),
    p.text("headingSearchPlaceholder", "Search placeholder", GROUPS.CONTENT, {
      when: (pr) => (pr.headerStyle || "app") === "app" && !!pr.headingSearch,
    }),
    p.bool("headingFilter", "Filter button in the heading", GROUPS.BEHAVIOUR, {
      when: (pr) => (pr.headerStyle || "app") === "app",
      hint: "Runs the card's onHeadingAction event with {{action}} = filter.",
    }),
    p.text("headingActionLabel", "Heading button label", GROUPS.CONTENT, {
      when: (pr) => (pr.headerStyle || "app") === "app",
      hint: "Its click runs the card's onHeadingAction event (Events tab).",
    }),
    p.text("headingActionIcon", "Heading button icon", GROUPS.CONTENT, {
      when: (pr) => (pr.headerStyle || "app") === "app" && !!pr.headingActionLabel,
    }),
    p.icon("icon", "Header icon"),
    p.select(
      "iconStyle",
      "Header icon style",
      [
        { value: "badge", label: "Badge (tinted square)" },
        { value: "plain", label: "Plain icon" },
      ],
      GROUPS.APPEARANCE,
      { when: (pr) => !!pr.icon && pr.headerStyle === "builder" },
    ),
    p.color("iconColor", "Header icon colour", GROUPS.APPEARANCE, {
      when: (pr) => !!pr.icon,
      hint: "The badge is tinted from it. Empty uses the theme's primary colour.",
    }),
    p.bool("collapsible", "Collapsible"),
    p.bool("collapsed", "Start collapsed"),
    p.bool("closable", "Closable"),
    p.actions("actions", "Header actions"),
    p.number("padding", "Body padding", GROUPS.LAYOUT),
    p.color("headerBg", "Header background", GROUPS.APPEARANCE),
    p.color("headerColor", "Header text", GROUPS.APPEARANCE),
    p.color("accent", "Left accent bar", GROUPS.APPEARANCE),
    p.bool("bordered", "Bordered", GROUPS.APPEARANCE),
    p.bool("shadow", "Shadow", GROUPS.APPEARANCE),
    p.number("radius", "Corner radius", GROUPS.APPEARANCE),
  ],
  render: ({ node, props, style, rt, scope, children }) => {
    const [collapsed, setCollapsed] = useState(!!props.collapsed);
    const [closed, setClosed] = useState(false);
    // The classic <Heading /> draws a title and a right-hand side only; the
    // count, search, filter and button are Aurora's. Under the classic skin the
    // card draws those itself, on the right, so a setting never just vanishes.
    const isModern = !!useContext(DesignContext)?.isModern;
    // The spot on the right of the heading a table inside may put its toolbar
    // in (runtime/cardHeadSlot). A state ref, so the table re-renders into it
    // once the heading has mounted.
    const [slotEl, setSlotEl] = useState(null);
    const headTable = useMemo(() => ((props.headerStyle || "app") === "app" ? headTableOf(node) : ""), [node, props.headerStyle]);
    // `labelled`: the card's subtitle already names the count ("Total
    // Bills/Receipts :"), so the table adds no words of its own before it.
    const slot = useMemo(
      () => (headTable ? { el: slotEl, tableId: headTable, labelled: !!String(props.subtitle || "").trim() } : null),
      [headTable, slotEl, props.subtitle],
    );
    // Collapsing is the panel closing and opening as far as a chain is
    // concerned — "load the timeline when this section is opened" has nowhere
    // else to hang. Dismissing it is a close too, and the last one.
    const toggle = () => {
      const next = !collapsed;
      setCollapsed(next);
      rt?.runEvent(node, next ? "onClose" : "onOpen", {});
    };
    const dismiss = () => {
      setClosed(true);
      rt?.runEvent(node, "onClose", {});
    };
    if (closed && !rt?.design) return null;
    // The canvas shows every icon so a hidden one can still be selected and edited.
    const actions = rt?.design ? props.actions || [] : visibleIconActions(props.actions, scope);
    const appLook = (props.headerStyle || "app") === "app";
    // "No heading": the card is just its frame and body, whatever else is set.
    const hasHeader =
      props.headerStyle !== "none" &&
      (!!headTable ||
      props.title ||
      props.icon ||
      props.collapsible ||
      props.closable ||
      actions.length ||
      (appLook && (props.headingSearch || props.headingFilter || props.headingActionLabel)));
    const searchField = props.headingSearchField || `${node?.id || "card"}Search`;

    // The header icons, collapse and close — the same buttons in either look.
    const headButtons =
      actions.length || props.collapsible || props.closable ? (
        <div className="dsb-panel-actions" data-dsb-interactive>
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              className={`dsb-icon-btn${a.bgColor ? " has-bg" : ""}`}
              title={a.tooltip || a.label}
              disabled={!!props.disabled}
              style={a.bgColor ? { background: a.bgColor } : undefined}
              onClick={(e) => {
                e.stopPropagation();
                runIconAction(a, { rt, node });
              }}
            >
              <Icon name={a.icon || "Settings"} size={14} color={a.color || undefined} />
            </button>
          ))}
          {props.collapsible ? (
            <button
              type="button"
              className="dsb-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
            >
              <Icon name={collapsed ? "ChevronDown" : "ChevronUp"} size={14} />
            </button>
          ) : null}
          {props.closable ? (
            <button
              type="button"
              className="dsb-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
            >
              <Icon name="X" size={14} />
            </button>
          ) : null}
        </div>
      ) : null;

    /**
     * The app's own <Heading />, flush with the top of the card.
     *
     * Everything the builder bar carried still has a place: the subtitle and
     * the header buttons go to its right-hand side (`secondTitle`), the icon
     * into its tile, the accent colour into its palette. Count, search, filter
     * and a primary button are the Heading's own features, wired to the card's
     * onSearch / onHeadingAction events.
     */
    const accent = props.accent || props.iconColor;
    const countShown =
      props.headingCount === "" || props.headingCount === undefined || props.headingCount === null ? undefined : props.headingCount;
    const runSearch = (e) => {
      if (!rt || rt.design) return;
      const v = e?.target?.value !== undefined ? e.target.value : e;
      rt.setValue(searchField, v);
      rt.runEvent(node, "onSearch", { value: v, field: searchField });
    };
    const classicExtras = isModern ? null : (
      <>
        {countShown !== undefined ? <span className="dsb-count-pill">{countShown}</span> : null}
        {props.headingSearch ? (
          <input
            className="form-control form-control-sm dsb-panel-apphead-search"
            data-dsb-interactive
            placeholder={props.headingSearchPlaceholder || "Search…"}
            value={rt?.values?.[searchField] ?? ""}
            onClick={(e) => e.stopPropagation()}
            onChange={runSearch}
          />
        ) : null}
        {props.headingFilter ? (
          <button
            type="button"
            className="dsb-icon-btn"
            title="Filter"
            onClick={(e) => {
              e.stopPropagation();
              if (!rt?.design) rt?.runEvent(node, "onHeadingAction", { action: "filter" });
            }}
          >
            <Icon name="Filter" size={14} />
          </button>
        ) : null}
        {props.headingActionLabel ? (
          <button
            type="button"
            className="btn btn-sm btn-primary px-2 py-0"
            onClick={(e) => {
              e.stopPropagation();
              if (!rt?.design) rt?.runEvent(node, "onHeadingAction", { action: "primary" });
            }}
          >
            {props.headingActionIcon ? <Icon name={props.headingActionIcon} size={13} /> : null} {props.headingActionLabel}
          </button>
        ) : null}
      </>
    );
    const hasClassicExtras =
      !isModern && (countShown !== undefined || props.headingSearch || props.headingFilter || props.headingActionLabel);
    const appHead = appLook && hasHeader ? (
      <header
        className={`dsb-panel-apphead${props.headerBg ? " has-bg" : ""}${props.accent ? " has-accent" : ""}`}
        style={props.headerBg ? { "--dsb-apphead-bg": props.headerBg } : undefined}
      >
        <ProjectHeading
          title={
            props.headerColor ? <span style={{ color: props.headerColor }}>{props.title}</span> : props.title
          }
          icon={props.icon ? <Icon name={props.icon} size={15} /> : undefined}
          color={accent ? headingPalette("custom", accent) : undefined}
          count={countShown}
          secondTitle={
            props.subtitle || headButtons || hasClassicExtras || headTable ? (
              <span className="dsb-panel-apphead-right">
                {props.subtitle ? <span className="dsb-panel-sub">{props.subtitle}</span> : null}
                {headTable ? <span ref={setSlotEl} className="dsb-panel-slot" data-dsb-interactive /> : null}
                {classicExtras}
                {headButtons}
              </span>
            ) : undefined
          }
          showSearch={!!props.headingSearch}
          searchPlaceholder={props.headingSearchPlaceholder || "Search…"}
          searchValue={rt?.values?.[searchField] ?? ""}
          onSearch={props.headingSearch ? runSearch : undefined}
          showFilter={!!props.headingFilter}
          onFilter={props.headingFilter ? () => !rt?.design && rt?.runEvent(node, "onHeadingAction", { action: "filter" }) : undefined}
          actionLabel={props.headingActionLabel || undefined}
          // Aurora draws what it is given, so a name would show as the word.
          actionIcon={props.headingActionIcon ? <Icon name={props.headingActionIcon} size={13} /> : undefined}
          onAction={() => !rt?.design && rt?.runEvent(node, "onHeadingAction", { action: "primary" })}
        />
      </header>
    ) : null;

    return (
      <section
        className={`dsb-panel${appHead ? " has-apphead" : ""}`}
        // The panel's own chain, which until now only its header icons could
        // reach. A click inside it — on a button, a row, a control — is that
        // component's business, so it is not also the panel's.
        onClick={(e) => {
          if (props.disabled || e.target !== e.currentTarget) return;
          rt?.runEvent(node, "onClick", {});
        }}
        style={{
          border: props.bordered ? "1px solid var(--dsb-border)" : "none",
          boxShadow: props.shadow ? "var(--dsb-shadow)" : "none",
          borderRadius: props.radius ?? 12,
          borderInlineStart: props.accent ? `3px solid ${props.accent}` : undefined,
          ...style,
        }}
      >
        {appHead}
        {hasHeader && !appLook ? (
          <header className="dsb-panel-head" style={{ background: props.headerBg || undefined, color: props.headerColor || undefined }}>
            <div className="dsb-panel-title">
              {props.icon ? (
                // A section is found by its badge before its words are read.
                <span
                  className={`dsb-ic-badge${props.iconStyle === "plain" ? " is-plain" : ""}`}
                  style={props.iconColor ? { "--dsb-badge": props.iconColor } : undefined}
                  aria-hidden="true"
                >
                  <Icon name={props.icon} size={props.iconStyle === "plain" ? 15 : 16} />
                </span>
              ) : null}
              <div>
                <strong>{props.title}</strong>
                {props.subtitle ? <span className="dsb-panel-sub">{props.subtitle}</span> : null}
              </div>
            </div>
            {headButtons}
          </header>
        ) : null}
        <div
          className={`dsb-panel-body ${collapsed ? "is-collapsed" : ""}`}
          // Under the app heading the body starts close to it: the heading is
          // the card's top edge, not a block sitting inside it.
          style={
            appHead
              ? { padding: props.padding ?? 12, paddingTop: Math.min(Number(props.padding ?? 12), 6) }
              : { padding: props.padding ?? 12 }
          }
        >
          {slot ? <CardHeadSlot.Provider value={slot}>{children}</CardHeadSlot.Provider> : children}
        </div>
      </section>
    );
  },
};

/** Where the crumbs come from. */
const CRUMB_SOURCE = [
  { value: "menu", label: "The app's menu (automatic)" },
  { value: "manual", label: "The list I type below" },
];

/** How the bar is painted. "heading" mirrors the app's page header. */
const CRUMB_APPEARANCE = [
  { value: "heading", label: "Heading bar (app style)" },
  { value: "solid", label: "Solid accent" },
  { value: "gradient", label: "Gradient" },
  { value: "plain", label: "Plain text" },
];

/**
 * Breadcrumb bar.
 *
 * It defaults to the app's page-header look — soft tinted fill, hairline
 * border, 3px accent on the left edge, ink text — coloured from the same
 * module families the app codes its headings with (see `headingPalette`), and
 * following the active skin out of the box. Everything is still a prop, so a
 * solid or gradient bar in any colour is one inspector change away.
 */
const BreadcrumbDef = {
  type: "Breadcrumb",
  label: "Breadcrumb Bar",
  icon: "Navigation",
  category: "Layout",
  defaultProps: {
    source: "menu",
    items: [{ label: "Home", icon: "Home" }, { label: "Emergency" }, { label: "Patient Search" }],
    appearance: "heading",
    family: "theme",
    from: "",
    to: "",
    color: "",
    radius: 8,
    separator: "/",
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.select("source", "Crumbs from", CRUMB_SOURCE, GROUPS.DATA, {
      hint: "The menu the API returned already knows this screen's trail — the same one every hand-coded page shows",
    }),
    p.options("items", "Items", GROUPS.CONTENT, {
      hint: "Shown when the menu has no entry for this screen — on the canvas, and on a screen opened straight from its URL",
    }),
    p.select("appearance", "Style", CRUMB_APPEARANCE),
    p.select("family", "Colour coding", HEADING_FAMILY_OPTIONS),
    p.color("from", "Accent colour", GROUPS.APPEARANCE, {
      when: (pr) => pr.family === "custom" || (pr.appearance || "gradient") === "gradient",
    }),
    p.color("to", "Gradient to", GROUPS.APPEARANCE, { when: (pr) => (pr.appearance || "gradient") === "gradient" }),
    p.color("color", "Text colour override"),
    p.text("separator", "Separator"),
    p.number("radius", "Corner radius"),
  ],
  render: ({ node, props, style, rt }) => {
    // The menu answers by default, including for bars saved before this prop
    // existed: a screen that was already carrying a hand-typed trail is exactly
    // the one that should now follow the menu, and the typed list stays as the
    // fallback for whenever the menu has nothing to say.
    const source = props.source || "menu";
    // The screen's own name stands in wherever the menu cannot answer — on the
    // canvas (the route is the builder) and on a screen opened by URL.
    // In the builder the trail is looked up by the screen's own route, not
    // the builder's (see useMenuBreadcrumb).
    const crumb = useMenuBreadcrumb(rt?.screen?.name || "", { screenId: rt?.screen?.id, inBuilder: !!rt && rt.mode !== "runtime" });
    const typed = Array.isArray(props.items) ? props.items : [];
    const fromMenu = crumbParts(crumb).map((label, i) => (i === 0 ? { label, icon: "Home" } : { label }));
    const menuAnswered = source === "menu" && fromMenu.length > 0;
    const items = source === "menu" ? (fromMenu.length ? fromMenu : typed) : typed;
    // The builder's own route is not a menu entry, so the canvas can never
    // resolve the trail. Saying so beats letting the typed list read as proof
    // that the menu setting did nothing.
    const showsFallback = rt?.design && source === "menu" && !menuAnswered;
    // Screens saved before `appearance` existed keep the gradient they had.
    const mode = props.appearance || (props.gradient === false ? "solid" : "gradient");
    const family = props.family || (props.from ? "custom" : "theme");
    const pal = headingPalette(family, props.from);
    const radius = props.radius ?? 8;

    let skin;
    if (mode === "heading") {
      skin = {
        background: `linear-gradient(135deg, ${pal.soft} 0%, var(--dsb-surface, #fff) 100%)`,
        border: `1px solid ${pal.line}`,
        borderInlineStart: `3px solid ${pal.accent}`,
        color: props.color || pal.ink,
        boxShadow: "none",
      };
    } else if (mode === "solid") {
      skin = { background: pal.accent, color: props.color || "#fff" };
    } else if (mode === "plain") {
      skin = { background: "transparent", color: props.color || pal.ink, boxShadow: "none" };
    } else {
      skin = {
        background: `linear-gradient(90deg, ${props.from || pal.accent}, ${props.to || withAlpha(pal.accent, 0.72)})`,
        color: props.color || "#fff",
      };
    }

    return (
      <nav className={`dsb-crumbs is-${mode}`} style={{ ...skin, borderRadius: radius, ...style }}>
        {items.map((it, i) => {
          const icon = it.icon || (i === 0 ? "Home" : "");
          return (
            // Which crumb was clicked is the whole question a breadcrumb's chain
            // asks — "go back to the list" is a different route per level.
            <span
              key={i}
              className="dsb-crumb"
              onClick={() => !props.disabled && rt?.runEvent(node, "onClick", { crumb: it, index: i, value: it.label || it.value })}
            >
              {icon ? (
                mode === "heading" ? (
                  <span className="dsb-crumb-tile" style={{ background: pal.soft, color: pal.accent }}>
                    <Icon name={icon} size={13} />
                  </span>
                ) : (
                  <Icon name={icon} size={13} />
                )
              ) : null}
              <span>{it.label || it.value}</span>
              {i < items.length - 1 ? <em>{props.separator || "/"}</em> : null}
            </span>
          );
        })}
        {showsFallback ? <em className="dsb-crumb-note">from the menu at runtime</em> : null}
      </nav>
    );
  },
};

const DividerDef = {
  type: "Divider",
  label: "Divider",
  icon: "SeparatorHorizontal",
  category: "Layout",
  defaultProps: { label: "", thickness: 1, color: "", margin: 8, dashed: false },
  defaultStyle: {},
  events: [],
  propSchema: [
    p.text("label", "Label"),
    p.number("thickness", "Thickness"),
    p.color("color", "Colour"),
    p.number("margin", "Vertical margin"),
    p.bool("dashed", "Dashed"),
  ],
  render: ({ props, style }) => (
    <div className="dsb-divider" style={{ margin: `${props.margin ?? 8}px 0`, ...style }}>
      <span
        style={{
          borderTopWidth: props.thickness || 1,
          borderTopStyle: props.dashed ? "dashed" : "solid",
          borderTopColor: props.color || "var(--dsb-border)",
        }}
      />
      {props.label ? <em>{props.label}</em> : null}
    </div>
  ),
};

const SpacerDef = {
  type: "Spacer",
  label: "Spacer",
  icon: "MoveVertical",
  category: "Layout",
  defaultProps: { height: 16, grow: false },
  defaultStyle: {},
  events: [],
  propSchema: [p.number("height", "Height (px)"), p.bool("grow", "Grow to fill")],
  render: ({ props, style }) => <div style={{ height: props.height ?? 16, flex: props.grow ? 1 : undefined, ...style }} />,
};

const SplitViewDef = {
  type: "SplitView",
  label: "Split View",
  icon: "Columns2",
  category: "Layout",
  isContainer: true,
  dropHint: "Split panes",
  defaultProps: {
    leftWidth: 62,
    gap: 14,
    detailClosable: true,
    detailOpenByDefault: true,
    stackOn: "mobile",
    detailTitle: "Details",
  },
  defaultStyle: {},
  // The detail pane is an overlay in everything but position: it is opened on a
  // row and closed again, and both are worth a chain.
  events: ["onOpen", "onClose", "onLoad"],
  propSchema: [
    p.slider("leftWidth", "Left width (%)", 20, 85, 1, GROUPS.LAYOUT),
    p.number("gap", "Gap (px)", GROUPS.LAYOUT),
    p.bool("detailClosable", "Detail panel closable"),
    p.bool("detailOpenByDefault", "Detail open by default"),
    p.select(
      "stackOn",
      "Stack panes on",
      [
        { value: "mobile", label: "Mobile" },
        { value: "tablet", label: "Tablet & below" },
        { value: "never", label: "Never" },
      ],
      GROUPS.LAYOUT,
    ),
    p.text("detailTitle", "Detail header"),
  ],
  /** Two fixed panes so drops land in a real container, never "between" panes. */
  createChildren: () => [
    {
      id: `n_left_${Math.random().toString(36).slice(2, 7)}`,
      type: "Container",
      name: "List Pane",
      props: { direction: "column", gap: 12, padding: 0 },
      style: {},
      responsive: { tablet: {}, mobile: {} },
      binding: { sourceId: "", path: "", fieldMap: {} },
      events: {},
      rules: { visibility: [], color: [] },
      validation: {},
      roles: { visibleTo: [], editableBy: [] },
      locked: false,
      hidden: false,
      children: [],
    },
    {
      id: `n_right_${Math.random().toString(36).slice(2, 7)}`,
      type: "Container",
      name: "Detail Pane",
      props: { direction: "column", gap: 12, padding: 0 },
      style: {},
      responsive: { tablet: {}, mobile: {} },
      binding: { sourceId: "", path: "", fieldMap: {} },
      events: {},
      rules: { visibility: [], color: [] },
      validation: {},
      roles: { visibleTo: [], editableBy: [] },
      locked: false,
      hidden: false,
      children: [],
    },
  ],
  render: ({ node, props, style, rt, children }) => {
    const bp = rt?.breakpoint || "desktop";
    const stack =
      props.stackOn === "tablet" ? bp === "tablet" || bp === "mobile" : props.stackOn === "never" ? false : bp === "mobile";
    const openState = rt?.ui?.panels?.[node.id];
    const open = openState === undefined ? props.detailOpenByDefault !== false : !!openState;
    const showDetail = rt?.design ? true : open;
    // On the transition only: the pane stands open for as long as a record is
    // being looked at, and the chain belongs to arriving there, not to every
    // render in between.
    const wasOpen = useRef(open);
    useEffect(() => {
      if (rt?.design || open === wasOpen.current) return;
      wasOpen.current = open;
      rt?.runEvent(node, open ? "onOpen" : "onClose", {});
    }, [open, rt, node]);
    return (
      <div className={`dsb-split ${stack ? "is-stacked" : ""}`} style={{ gap: `${props.gap ?? 14}px`, ...style }}>
        <div className="dsb-split-main" style={{ flexBasis: stack ? "auto" : `${showDetail ? props.leftWidth || 62 : 100}%` }}>
          {children ? children[0] : null}
        </div>
        {showDetail ? (
          <div className="dsb-split-side" style={{ flexBasis: stack ? "auto" : `${100 - (props.leftWidth || 62)}%` }}>
            {props.detailClosable || props.detailTitle ? (
              <AppHeading
                title={props.detailTitle || ""}
                className="is-split-head"
                right={
                  props.detailClosable ? (
                    <button
                      type="button"
                      className="dsb-icon-btn"
                      data-dsb-interactive
                      onClick={() => rt?.closePanel(node.id)}
                      title="Close panel"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  ) : null
                }
              />
            ) : null}
            <div className="dsb-split-body">{children ? children[1] : null}</div>
          </div>
        ) : null}
      </div>
    );
  },
};

const ActionGridDef = {
  type: "ActionGrid",
  label: "Action Grid",
  icon: "LayoutGrid",
  category: "Layout",
  // Off the palette, not out of the registry: the emergency template still
  // builds one, and any screen already saved with one has to keep rendering.
  hiddenInPalette: true,
  defaultProps: {
    actions: [
      { label: "Vital Graph", icon: "LineChart" },
      { label: "Capture Vitals", icon: "HeartPulse" },
      { label: "Lab Results", icon: "FlaskConical" },
      { label: "Labs", icon: "Syringe" },
      { label: "Meds", icon: "Pill" },
      { label: "Flowsheets", icon: "ClipboardList" },
      { label: "Remarks", icon: "MessageSquare" },
    ],
    columns: 4,
    maxVisible: 7,
    moreLabel: "MORE",
    accent: "#2563eb",
    compact: false,
  },
  defaultStyle: {},
  events: ["onClick"],
  propSchema: [
    p.actions("actions", "Actions"),
    p.number("columns", "Columns", GROUPS.LAYOUT),
    p.number("maxVisible", "Max visible before MORE"),
    p.text("moreLabel", "Overflow label"),
    p.color("accent", "Accent colour"),
    p.bool("compact", "Compact"),
  ],
  render: ({ node, props, style, rt }) => {
    const [expanded, setExpanded] = useState(false);
    const all = Array.isArray(props.actions) ? props.actions : [];
    const max = Number(props.maxVisible) || all.length;
    const visible = expanded ? all : all.slice(0, max);
    const overflow = all.length - visible.length;
    return (
      <div
        className={`dsb-actiongrid ${props.compact ? "is-compact" : ""}`}
        style={{ gridTemplateColumns: `repeat(${props.columns || 4}, minmax(0,1fr))`, ...style }}
      >
        {visible.map((a, i) => (
          <button
            key={i}
            type="button"
            className="dsb-action"
            data-dsb-interactive
            disabled={!!props.disabled}
            style={{ "--dsb-action-accent": a.color || props.accent || "var(--dsb-primary)" }}
            onClick={() => runIconAction(a, { rt, node })}
          >
            <span className="dsb-action-ic" style={a.bgColor ? { background: a.bgColor } : undefined}>
              <Icon name={a.icon || "Sparkles"} size={16} />
            </span>
            <span className="dsb-action-label">{a.label}</span>
          </button>
        ))}
        {overflow > 0 || expanded ? (
          <button type="button" className="dsb-action is-more" data-dsb-interactive onClick={() => setExpanded((x) => !x)}>
            <span className="dsb-action-ic">
              <Icon name="MoreHorizontal" size={16} />
            </span>
            <span className="dsb-action-label">{expanded ? "LESS" : props.moreLabel || "MORE"}</span>
          </button>
        ) : null}
      </div>
    );
  },
};

export default [
  ContainerDef,
  RowDef,
  ColumnDef,
  GridDef,
  FlexBoxDef,
  CardPanelDef,
  BreadcrumbDef,
  DividerDef,
  SpacerDef,
  SplitViewDef,
  ActionGridDef,
];
