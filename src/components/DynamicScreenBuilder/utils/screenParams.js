/**
 * Screen parameters — what a screen is opened WITH.
 *
 * A hand-coded page is often a component first: OPD Panel Allocation takes
 * `embeddedUHID` when it is shown inside a patient's frame, and then fills and
 * locks its UHID box, starts a year back and searches at once. A built screen
 * reads the same thing as {{params.embeddedUHID}}, from:
 *
 *   - the URL:       /screen/scr_x?embeddedUHID=123
 *   - a navigate():  navigate("/screen/scr_x", { state: { params: { … } } })
 *   - its props:     <ScreenRoute screenId="scr_x" embeddedUHID={uhid} />
 *
 * later ones winning. `screen.params` declares the names — { name: preview } —
 * so every declared one exists (as "") even when nothing was passed, a rule
 * like "params.embeddedUHID is not empty" reads cleanly, and the builder can
 * offer them under Map…. The preview value is what the canvas and Preview use;
 * it never reaches the live page.
 */

/** The declared parameters, { name: previewValue }. */
export function declaredParams(screen) {
  const raw = screen?.params;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  Object.entries(raw).forEach(([k, v]) => {
    const name = String(k || "").trim();
    if (name) out[name] = v === undefined || v === null ? "" : v;
  });
  return out;
}

/** What the builder's canvas and Preview open the screen with. */
export function previewParams(screen) {
  return declaredParams(screen);
}

/**
 * The parameters of a live screen.
 *
 * A name is matched to its declaration without regard to case — the URL says
 * `?uhid=` where the screen declared `UHID` — so a link typed by hand still
 * lands. Anything undeclared is passed through under its own name.
 */
export function resolveScreenParams(screen, { query, state, props } = {}) {
  const declared = Object.keys(declaredParams(screen));
  const byLower = new Map(declared.map((n) => [n.toLowerCase(), n]));
  const out = {};
  declared.forEach((n) => {
    out[n] = "";
  });
  const put = (k, v) => {
    if (!k || typeof v === "function") return;
    out[byLower.get(String(k).toLowerCase()) || k] = v;
  };
  if (query && typeof query.forEach === "function") query.forEach((v, k) => put(k, v));
  if (state && typeof state === "object") Object.entries(state).forEach(([k, v]) => put(k, v));
  if (props && typeof props === "object") Object.entries(props).forEach(([k, v]) => v !== undefined && put(k, v));
  return out;
}
