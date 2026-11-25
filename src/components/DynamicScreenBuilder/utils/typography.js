/**
 * Node typography, pushed past a component's own CSS.
 *
 * Style → Typography writes plain CSS onto the node's root element, and for a
 * bare <div> of text that is the whole story. It is not, for every component
 * that styles its own insides: `.dsb-tb-value { font-size: 12.5px }` beats an
 * inherited size every time, so setting 16px on a Label + Value did nothing —
 * the wrapper grew and the text it wraps did not.
 *
 * So the same three settings also travel as custom properties, and the
 * component stylesheets read them with their own value as the fallback:
 *
 *     .dsb-tb-value { font-size: var(--dsb-node-fs, 12.5px); }
 *
 * Nothing changes until a node asks for something — and then everything that
 * node draws follows, insides included.
 *
 * The reset matters as much as the value. Custom properties inherit, so a font
 * size set on a Row would otherwise reach every component inside it and
 * flatten each one's own label/value scale. A node that sets nothing therefore
 * sets the property to `initial` — the guaranteed-invalid value, which makes
 * every `var()` below it fall back to the component's own default. Typography
 * lands on the node it was set on, and stops there.
 */

/** Style key -> the custom property the stylesheets read. */
export const TYPO_VARS = {
  fontSize: "--dsb-node-fs",
  fontWeight: "--dsb-node-fw",
  color: "--dsb-node-fg",
};

/**
 * Style key -> the marker class a native wrapper carries when it is set.
 *
 * Text align is here and not above because our own components need nothing for
 * it: none of them sets `text-align`, so it simply inherits. An app <Input> is
 * aligned by the skin, so it does need saying.
 */
const TYPO_CLASSES = {
  fontSize: "has-fs",
  fontWeight: "has-fw",
  color: "has-fg",
  textAlign: "has-ta",
};

const isSet = (v) => v !== undefined && v !== null && v !== "";

/**
 * Marker classes for a wrapper around a component the builder does not own —
 * the app's own <Input>, react-select, PrimeReact's calendar.
 *
 * Their text is sized by the app's skin, which changes with the skin, so there
 * is no honest fallback to write into a `var()` here: the rule has to be
 * absent until the node asks for something. One class per setting rather than
 * one for all three, so asking for a size does not also drag the input's
 * colour or weight off the skin's own.
 */
export function typographyClass(style) {
  return Object.entries(TYPO_CLASSES)
    .filter(([key]) => isSet(style?.[key]))
    .map(([, cls]) => cls)
    .join(" ");
}

/**
 * `style` plus the custom properties that carry it inwards.
 *
 * Returns the original object when there is nothing to add and nothing to
 * reset — props are rebuilt on every render, and a new style object on each
 * one would invalidate the memos underneath.
 */
export function withTypographyVars(style) {
  const out = { ...(style || {}) };
  Object.entries(TYPO_VARS).forEach(([key, cssVar]) => {
    out[cssVar] = isSet(out[key]) ? out[key] : "initial";
  });
  return out;
}
