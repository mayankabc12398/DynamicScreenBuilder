/**
 * Copying text, in the two ways a browser allows.
 *
 * `navigator.clipboard` only exists in a *secure context* — https, or localhost. A
 * production build served over plain http therefore has no clipboard object at all, and
 * the check that guarded it went straight to "could not reach the clipboard". That is
 * exactly why copying a route worked on a developer machine and failed on the server: it
 * was never a permission problem, it was the origin.
 *
 * So the secure path is tried when it is actually available, and everything else falls
 * back to the old execCommand("copy") on an off-screen textarea, which has no such
 * requirement. The choice is made synchronously: execCommand only works inside the task
 * started by the click, and awaiting anything first can lose that gesture.
 */

const legacyCopy = (value) => {
  const ta = document.createElement("textarea");
  ta.value = value;

  // readonly stops the mobile keyboard opening; fixed + transparent keeps the page from
  // scrolling to it. It has to be in the document and selectable to be copyable.
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  document.body.appendChild(ta);

  let ok = false;
  try {
    ta.select();
    // iOS ignores select() on its own and needs the range spelled out.
    ta.setSelectionRange(0, value.length);
    ok = document.execCommand("copy");
  } catch (e) {
    ok = false;
  }

  document.body.removeChild(ta);
  return ok;
};

/** Resolves true when the text is on the clipboard, false when it could not be put there. */
const copyText = async (text) => {
  const value = text == null ? "" : String(text);

  if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (e) {
      // Denied by permissions policy, or the document was not focused. The old API is
      // often still allowed, so it is worth one more try before giving up.
      return legacyCopy(value);
    }
  }

  return legacyCopy(value);
};

export default copyText;
