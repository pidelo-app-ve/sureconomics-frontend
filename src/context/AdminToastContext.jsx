import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

/**
 * Floating feedback for admin actions.
 *
 * The editors have long forms with their action buttons at the bottom, so a
 * banner rendered at the top of the page lands outside the viewport and the
 * editor never learns whether the save worked. These toasts are position-fixed,
 * so they show up wherever the button was clicked.
 */
const AdminToastContext = createContext(null);

/** Successes fade on their own; errors stay until dismissed so they can be read. */
const AUTO_DISMISS_MS = { success: 4500, info: 4500, error: 0 };

let nextToastId = 0;

export const AdminToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * @param {{ tone?: "success" | "error" | "info", message: string, title?: string }} toast
   * @returns {number} id, for dismissing it early
   */
  const pushToast = useCallback(
    ({ tone = "info", message, title }) => {
      const id = ++nextToastId;
      setToasts((prev) => [...prev, { id, tone, message, title }]);

      const ttl = AUTO_DISMISS_MS[tone] ?? AUTO_DISMISS_MS.info;
      if (ttl > 0) {
        const timer = window.setTimeout(() => {
          timersRef.current.delete(id);
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, ttl);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    []
  );

  const toastSuccess = useCallback(
    (message, title) => pushToast({ tone: "success", message, title }),
    [pushToast]
  );

  const toastError = useCallback(
    (message, title) => pushToast({ tone: "error", message, title }),
    [pushToast]
  );

  const value = useMemo(
    () => ({ toasts, pushToast, toastSuccess, toastError, dismissToast }),
    [toasts, pushToast, toastSuccess, toastError, dismissToast]
  );

  return <AdminToastContext.Provider value={value}>{children}</AdminToastContext.Provider>;
};

AdminToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * @returns {{
 *   toasts: Array<{ id: number, tone: string, message: string, title?: string }>,
 *   pushToast: (toast: { tone?: string, message: string, title?: string }) => number,
 *   toastSuccess: (message: string, title?: string) => number,
 *   toastError: (message: string, title?: string) => number,
 *   dismissToast: (id: number) => void,
 * }}
 */
export const useAdminToast = () => {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
};
