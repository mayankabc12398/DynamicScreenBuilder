/**
 * What a form field is CALLED on screen.
 *
 * A field is stored under its key (`referDoctorID`) because that is what the
 * API wants, but a user reading "Select referDoctorID first" is being shown
 * plumbing. The control that writes the field knows the words the screen
 * uses for it — its label, or its placeholder when the label is floated
 * inside the box — so that is what gets said instead.
 */
import { flatten } from "./tree";

/** Props that hold a control's visible caption, best first. */
const CAPTION_PROPS = ["label", "placeholder", "title", "text", "caption"];

/**
 * The caption on one control, or "" when it has none worth showing. A bound
 * caption (`{{row.x}}`) is a value at runtime, not a name, so it is skipped;
 * the required star and a trailing colon are decoration, not the name.
 */
export function controlCaption(node) {
  for (let i = 0; i < CAPTION_PROPS.length; i += 1) {
    const v = node?.props?.[CAPTION_PROPS[i]];
    if (typeof v !== "string" || v.includes("{{")) continue;
    const text = v.trim().replace(/\s*[*:]+\s*$/, "").trim();
    if (text) return text;
  }
  return "";
}

/**
 * A key made readable, for a field no control on the screen owns (a value a
 * chain sets, a hidden variable): `referDoctorID` → "Refer Doctor",
 * `patient_type` → "Patient Type". The trailing Id goes — "Select Refer
 * Doctor first" is the sentence, not "Select Refer Doctor ID first".
 */
export function humaniseKey(key) {
  const raw = String(key || "").trim();
  if (!raw) return "";
  // A separate or camel-cased Id only: "Paid" and "UHID" are words, not keys.
  const bare = raw.replace(/[_\s-]+(?:ID|Id|id)$/, "").replace(/([a-z0-9])(?:ID|Id)$/, "$1") || raw;
  return bare
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Every field on the screen mapped to its caption, for pickers that list many. */
export function fieldCaptions(root) {
  const out = {};
  flatten(root).forEach((n) => {
    const f = n.props?.field;
    if (!f || out[f]) return;
    const cap = controlCaption(n);
    if (cap) out[f] = cap;
  });
  return out;
}

/** The caption of the control that writes `field`, else the key made readable. */
export function fieldCaption(root, field) {
  if (!field) return "";
  return fieldCaptions(root)[field] || humaniseKey(field);
}
