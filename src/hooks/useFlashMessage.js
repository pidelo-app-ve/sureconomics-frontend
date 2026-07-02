import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Reads a one-time `location.state.flash` message (set via `navigate(path, { state: { flash } })`)
 * and clears it from history state so it doesn't reappear on refresh or back navigation.
 * @returns {string | null}
 */
export const useFlashMessage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash] = useState(() => location.state?.flash ?? null);
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current || !location.state?.flash) return;
    cleared.current = true;
    const rest = { ...location.state };
    delete rest.flash;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: rest });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return flash;
};
