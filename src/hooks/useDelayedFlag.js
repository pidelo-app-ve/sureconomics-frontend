import { useEffect, useState } from "react";

/**
 * True only once a condition has held for a while.
 *
 * Used for loading indicators. A fetch that resolves in 80ms does not need to
 * announce itself: the "Cargando…" flashes in and out, the layout jumps twice, and
 * the reader is told about plumbing instead of shown the page. But a fetch that
 * takes three seconds does need to say something, or the screen looks broken.
 *
 * So the flag is delayed rather than removed. Fast loads never show it; slow ones
 * still explain themselves.
 *
 * @param {boolean} active
 * @param {number} delay milliseconds the condition must hold
 */
export const useDelayedFlag = (active, delay = 400) => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return undefined;
    }
    const timer = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  return shown;
};
