import { useAdminToast } from "../../context/AdminToastContext";

const TONE_ICON = {
  success: "✓",
  error: "!",
  info: "i",
};

const DEFAULT_TITLE = {
  success: "Listo",
  error: "No se pudo completar",
  info: "Aviso",
};

/**
 * Renders whatever `AdminToastProvider` is holding. Mounted once in AdminLayout.
 *
 * Successes use `role="status"` (polite) and errors `role="alert"` (assertive),
 * so a screen reader interrupts for failures but not for routine saves.
 */
export const AdminToastViewport = () => {
  const { toasts, dismissToast } = useAdminToast();

  if (!toasts.length) return null;

  return (
    <div className="se-adm-toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`se-adm-toast se-adm-toast--${toast.tone}`}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <span className="se-adm-toast__icon" aria-hidden="true">
            {TONE_ICON[toast.tone] ?? TONE_ICON.info}
          </span>
          <div className="se-adm-toast__body">
            <p className="se-adm-toast__title">{toast.title || DEFAULT_TITLE[toast.tone] || DEFAULT_TITLE.info}</p>
            <p className="se-adm-toast__text">{toast.message}</p>
          </div>
          <button
            type="button"
            className="se-adm-toast__close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
