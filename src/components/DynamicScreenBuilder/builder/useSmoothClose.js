import { useCallback, useEffect, useRef, useState } from "react";

/** How long the exit animation runs — keep in step with `dsbx-out` in the CSS. */
export const EXIT_MS = 200;

/**
 * Lets a modal play its exit animation before it unmounts.
 *
 * Returns `[closing, close]`: put `is-closing` on the modal while `closing` is
 * true, and call `close()` wherever `onClose` was called. A second call while
 * closing is ignored. Reduced motion still waits: the CSS swaps the movement for
 * a plain fade, which is what that setting asks for.
 */
export default function useSmoothClose(onClose, ms = EXIT_MS) {
  const [closing, setClosing] = useState(false);
  const timer = useRef(0);
  const latest = useRef(onClose);
  latest.current = onClose;
  useEffect(() => () => clearTimeout(timer.current), []);
  const close = useCallback(
    (...args) => {
      if (timer.current) return;
      setClosing(true);
      timer.current = setTimeout(() => latest.current?.(...args), ms);
    },
    [ms],
  );
  return [closing, close];
}
