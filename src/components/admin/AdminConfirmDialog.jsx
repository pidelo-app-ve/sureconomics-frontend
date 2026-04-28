import { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const AdminConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant,
  isBusy,
  errorMessage,
  onConfirm,
  onClose,
}) => {
  const surfaceRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const prevActiveRef = useRef(null);

  const titleId = useMemo(() => `se-adm-dialog-title-${Math.random().toString(16).slice(2)}`, []);
  const descId = useMemo(() => `se-adm-dialog-desc-${Math.random().toString(16).slice(2)}`, []);

  useEffect(() => {
    if (!open) return;
    prevActiveRef.current = document.activeElement;
    const t = window.setTimeout(() => {
      (cancelButtonRef.current ?? surfaceRef.current)?.focus?.();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const el = prevActiveRef.current;
    if (el && typeof el.focus === "function") {
      el.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (!isBusy) onClose();
        return;
      }

      if (e.key !== "Tab") return;
      const root = surfaceRef.current;
      if (!root) return;

      const focusables = Array.from(root.querySelectorAll(focusableSelector)).filter(
        (node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true"
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === root) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isBusy, onClose]);

  if (!open) return null;

  const handleBackdropClick = () => {
    if (isBusy) return;
    onClose();
  };

  return (
    <div className="se-adm-dialog" role="presentation">
      <div
        className="se-adm-dialog__backdrop"
        role="button"
        tabIndex={0}
        aria-label="Cerrar"
        onClick={handleBackdropClick}
        onKeyDown={(e) => e.key === "Enter" && handleBackdropClick()}
      />
      <div
        className={`se-adm-dialog__surface${variant === "danger" ? " se-adm-dialog__surface--danger" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        ref={surfaceRef}
        tabIndex={-1}
      >
        <header className="se-adm-dialog__header">
          <h2 id={titleId} className="se-adm-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="se-adm-dialog__x"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div id={descId} className="se-adm-dialog__body">
          {typeof description === "string" ? <p className="se-adm-dialog__text">{description}</p> : description}
          <p className="se-adm-dialog__warn">
            Esta acción es irreversible. Si continúa, el contenido se eliminará de forma permanente.
          </p>
          {errorMessage ? (
            <p className="se-adm-dialog__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <footer className="se-adm-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="se-btn se-btn--secondary"
            onClick={onClose}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button type="button" className="se-btn se-adm-dialog__danger" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? "Eliminando…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
};

AdminConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(["danger"]),
  isBusy: PropTypes.bool,
  errorMessage: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

AdminConfirmDialog.defaultProps = {
  confirmLabel: "Eliminar",
  cancelLabel: "Cancelar",
  variant: "danger",
  isBusy: false,
  errorMessage: "",
};

