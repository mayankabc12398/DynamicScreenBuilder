/**
 * Painting a dropdown's choices in the colours their own data carries.
 *
 * A select whose options are coloured — a triage code drawn in the colour the
 * server ships with it, a status list where Urgent is red — needs the colour to
 * travel WITH the option rather than through a prop the caller has to keep in
 * step with the list. So an option may carry `bg` / `fg` / `border` and a
 * `paint` mode, and every select that knows about this file draws it the same
 * way. An option without `paint` is left exactly as it was, which is why
 * dropping this into the shared selects changes nothing for the screens that
 * do not ask for it.
 *
 * Modes:
 *   fill  the whole menu row takes the colour
 *   chip  the label sits in a rounded badge
 *   dot   a small circle in front of the label
 */

/** The paint an option asks for, or null when it asks for none. */
function optionPaint(option) {
  if (!option || !option.paint) return null;
  const { bg = "", fg = "", border = "", paint } = option;
  if (!bg && !fg && !border) return null;
  return { mode: paint, bg, fg, border };
}

/**
 * Row styles for a menu item, merged over whatever the select already sets.
 *
 * Selected and hovered rows keep their own emphasis by darkening the row's own
 * colour: the usual highlight is a background, and a background cannot show
 * through one the rule just painted.
 */
export function optionFillStyle(option, { selected = false, focused = false } = {}) {
  const p = optionPaint(option);
  if (!p || p.mode !== "fill") return null;
  const style = {};
  if (p.bg) style.backgroundColor = p.bg;
  if (p.fg) style.color = p.fg;
  if (p.border) style.boxShadow = `inset 3px 0 0 ${p.border}`;
  if (selected || focused) style.filter = "brightness(0.92)";
  return style;
}

/** The colours the closed box takes from its selection, or null. */
export function selectedFillStyle(option) {
  const p = optionPaint(option);
  if (!p || p.mode !== "fill") return null;
  const style = {};
  if (p.bg) style.backgroundColor = p.bg;
  if (p.fg) style.color = p.fg;
  return style;
}

/**
 * The label as the paint mode draws it. `fill` returns the text untouched —
 * the row carries the colour there, not the label.
 */
export function OptionLabel({ option, children }) {
  const p = optionPaint(option);
  const text = children ?? option?.label ?? option?.name ?? "";
  if (!p || p.mode === "fill") return <>{text}</>;
  if (p.mode === "dot") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 9,
            height: 9,
            flex: "0 0 auto",
            borderRadius: "50%",
            background: p.bg || p.fg || "transparent",
            border: p.border ? `1px solid ${p.border}` : "none",
          }}
        />
        {text}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 999,
        lineHeight: 1.6,
        fontWeight: 600,
        background: p.bg || "transparent",
        color: p.fg || "inherit",
        border: p.border ? `1px solid ${p.border}` : "none",
      }}
    >
      {text}
    </span>
  );
}

/**
 * A whole menu item, for selects that cannot style the row themselves and only
 * hand the caller a template — PrimeReact's MultiSelect. `fill` is drawn as a
 * block that fills the item rather than as a style on it.
 */
export function OptionItem({ option, children }) {
  const p = optionPaint(option);
  const text = children ?? option?.label ?? option?.name ?? "";
  if (p?.mode === "fill") {
    return (
      <div
        style={{
          display: "block",
          width: "100%",
          padding: "2px 6px",
          borderRadius: 4,
          background: p.bg || "transparent",
          color: p.fg || "inherit",
          border: p.border ? `1px solid ${p.border}` : "none",
        }}
      >
        {text}
      </div>
    );
  }
  return <OptionLabel option={option}>{text}</OptionLabel>;
}
