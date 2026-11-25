/**
 * The page header a generated screen wears.
 *
 * Hand-coded pages all start with <Heading isBreadcrumb /> — the card (or
 * Aurora) bar carrying the trail the menu API returned. A screen built here is
 * a menu entry like any other, so it gets the same bar from the same component:
 * identical markup, identical skin, and it follows the active design mode for
 * free.
 *
 * `mode` decides when it shows:
 *   auto  the default — shown unless the screen already carries its own
 *         Breadcrumb bar or Page Heading node, so no screen ends up with two
 *   on    always, even next to a header node
 *   off   never; the screen draws its own
 *
 * The trail is resolved by {@link useMenuBreadcrumb} rather than left to the
 * Heading's own lookup, so a screen opened straight from its URL — or sitting on
 * the builder's canvas, where the route is the builder — still reads as its own
 * name instead of an empty bar.
 *
 * What a hand-coded page passes the Heading besides its title is configured
 * here too: a title icon, a count, a line of text and buttons on the right (each
 * running its own action chain, app modal or route), and a search box. The
 * right-hand side goes in through `secondTitle`, the one slot both skins draw.
 *
 * On the canvas the builder passes `onSelect`: the whole bar becomes one click
 * target that opens its settings in the inspector, and nothing inside it (the
 * buttons, the frame-menu list, the trail) reacts while the screen is being
 * designed.
 */
import React, { useContext, useEffect, useRef } from "react";
import ProjectHeading from "@app/components/UI/Heading";
import { DesignContext } from "@app/providers/DesignProvider";
import Icon from "../registry/icons";
import { btnClass, runIconAction, visibleIconActions } from "../registry/shared";
import { useRuntime } from "../runtime/RuntimeContext";
import { screenHasHeaderNode, useMenuBreadcrumb } from "../utils/breadcrumb";
import { interpolate } from "../utils/expressions";

/** How long the search box waits after the last keystroke before its chain runs. */
const SEARCH_DEBOUNCE_MS = 350;

const text = (v, scope) => (v === undefined || v === null || v === "" ? "" : String(interpolate(String(v), scope) ?? ""));

/**
 * One header button, in the app's own button markup.
 *
 * `display` picks what it shows — icon and text, the icon alone (the text then
 * becomes its tooltip and accessible name), or the text alone.
 */
function HeaderButton({ a, rt, scope }) {
  const label = text(a.label, scope);
  const display = a.display || "both";
  const showIcon = display !== "text" && !!a.icon;
  const showText = display !== "icon" && !!label;
  const tip = text(a.tooltip, scope) || label;
  return (
    <button
      type="button"
      className={`${btnClass({ variant: a.variant || "success", size: a.size || "sm" })} dsb-head-btn${showText ? "" : " is-icon"}`}
      title={tip || undefined}
      aria-label={showText ? undefined : tip || a.icon}
      style={{ background: a.bgColor || undefined, borderColor: a.bgColor || undefined, color: a.color || undefined }}
      onClick={() => runIconAction(a, { rt })}
    >
      {showIcon ? <Icon name={a.icon} size={14} /> : null}
      {showText ? <span>{label}</span> : null}
      {!showIcon && !showText ? <span>{a.icon || "Button"}</span> : null}
    </button>
  );
}

/** The classic skin has no search box of its own, so the header brings one. */
function HeaderSearch({ value, placeholder, onChange }) {
  return (
    <span className="dsb-head-search">
      <Icon name="Search" size={13} />
      <input
        type="search"
        className="form-control"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder || "Search"}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

export default function ScreenHeader({ screen, design = false, onSelect, selected = false }) {
  const cfg = screen?.header || {};
  const mode = cfg.mode || "auto";
  const fallback = cfg.title || screen?.name || "";
  const rt = useRuntime();
  // In the builder the route is the builder's; the screen's own is looked up.
  const crumb = useMenuBreadcrumb(fallback, { screenId: screen?.id, inBuilder: design || (!!rt && rt.mode !== "runtime") });
  const { isModern } = useContext(DesignContext) || {};
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (mode === "off") return null;
  if (mode === "auto" && screenHasHeaderNode(screen?.root)) return null;

  const showBreadcrumb = cfg.showBreadcrumb !== false;
  const titleText = showBreadcrumb ? crumb : cfg.title || screen?.name || "";
  if (!titleText) return null;

  // What a header template can read: the screen's form values by bare name
  // ({{Status}}), and everything a chain can ({{values.x}}, {{vars.x}}, {{user.x}}).
  const scope = rt?.buildScope ? { ...rt.buildScope(), ...(rt.values || {}) } : {};

  // The canvas shows every button so a hidden one can still be seen and edited.
  const buttons = design ? (Array.isArray(cfg.buttons) ? cfg.buttons : []) : visibleIconActions(cfg.buttons, scope);
  const rightText = text(cfg.rightText, scope);
  const count = text(cfg.count, scope);

  const searchField = cfg.searchField || "headerSearch";
  const searchValue = rt?.values?.[searchField] ?? "";
  const onSearch = (e) => {
    if (!rt || rt.design) return;
    const v = e?.target?.value !== undefined ? e.target.value : e;
    rt.setValue(searchField, v);
    clearTimeout(timer.current);
    if (!Array.isArray(cfg.onSearch) || !cfg.onSearch.length) return;
    timer.current = setTimeout(() => rt.runActions(cfg.onSearch, { value: v, field: searchField }), SEARCH_DEBOUNCE_MS);
  };

  // The modern skin draws its own count chip and search box; the classic one
  // has neither, so they join the right-hand side instead.
  const ownCount = !isModern && count !== "";
  const ownSearch = !isModern && !!cfg.showSearch;
  const hasRight = rightText || ownCount || ownSearch || buttons.length;
  const right = hasRight ? (
    <div className="dsb-head-extras" data-dsb-interactive>
      {ownCount ? <span className="dsb-head-count">{count}</span> : null}
      {rightText ? (
        <span className="dsb-head-text">
          {cfg.rightIcon ? <Icon name={cfg.rightIcon} size={14} /> : null}
          <span>{rightText}</span>
        </span>
      ) : null}
      {ownSearch ? (
        <HeaderSearch value={searchValue} placeholder={cfg.searchPlaceholder || "Search…"} onChange={onSearch} />
      ) : null}
      {buttons.map((a, i) => (
        <HeaderButton key={i} a={a} rt={rt} scope={scope} />
      ))}
    </div>
  ) : undefined;

  // A typed title can carry its icon in both skins; the breadcrumb is the
  // Heading's own markup, so there the icon shows in the modern skin's tile.
  const titleIcon = cfg.icon ? <Icon name={cfg.icon} size={15} /> : undefined;
  const title =
    !showBreadcrumb && titleIcon && !isModern ? (
      <span className="dsb-head-title">
        {titleIcon}
        {titleText}
      </span>
    ) : (
      titleText
    );

  const pickable = design && typeof onSelect === "function";
  const pick = pickable
    ? {
        role: "button",
        tabIndex: 0,
        title: "Page header — click to edit",
        "aria-label": "Page header — click to edit its settings",
        "aria-pressed": selected,
        onPointerDown: () => onSelect(),
        // Capture, so a click meant to select the bar never reaches the
        // Heading's own handlers underneath.
        onClickCapture: (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onKeyDown: (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onSelect();
        },
      }
    : {};

  return (
    <div
      className={`mt-2 dsb-screen-head${pickable ? " is-pickable" : ""}${pickable && selected ? " is-sel" : ""}`}
      data-design={design ? "1" : undefined}
      {...pick}
    >
      {pickable ? (
        <span className="dsb-screen-head-tag" aria-hidden="true">
          <Icon name="PanelTop" size={10} /> Page header
        </span>
      ) : null}
      <ProjectHeading
        title={title}
        // `isSlideScreen` is what makes the Heading render the text we resolved
        // instead of running its own menu lookup a second time.
        isBreadcrumb={showBreadcrumb}
        isSlideScreen={showBreadcrumb}
        icon={titleIcon}
        color={cfg.color || undefined}
        count={isModern && count !== "" ? count : undefined}
        showSearch={isModern && !!cfg.showSearch}
        searchPlaceholder={cfg.searchPlaceholder || "Search…"}
        searchValue={searchValue}
        onSearch={onSearch}
        secondTitle={right}
      />
    </div>
  );
}
