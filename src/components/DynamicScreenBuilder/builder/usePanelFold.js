import { useCallback, useState } from "react";

/**
 * Whether one of the left column's sections — the component palette, the
 * layers tree — is folded down to its header.
 *
 * Remembered per browser, because a designer who folds the palette away to
 * give the layers tree the whole column wants it that way on the next screen
 * too. Storage can be missing or throw (private window, blocked site data),
 * and then the section simply starts open.
 */
export default function usePanelFold(name) {
  const key = `dsb.fold.${name}`;
  const [folded, setFolded] = useState(() => {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  const toggle = useCallback(() => {
    setFolded((f) => {
      const next = !f;
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* not remembered — still folds for this session */
      }
      return next;
    });
  }, [key]);
  return [folded, toggle];
}
