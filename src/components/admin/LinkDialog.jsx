import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

/** Small modal to set/remove a link, styled like the rest of the admin panel instead of a native browser prompt. */
export const LinkDialog = ({ open, initialUrl, onSave, onRemove, onClose }) => {
  const [url, setUrl] = useState(initialUrl || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setUrl(initialUrl || "");
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, initialUrl]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onRemove();
    }
  };

  return (
    <div className="se-adm-dialog" role="presentation">
      <div
        className="se-adm-dialog__backdrop"
        role="button"
        tabIndex={0}
        aria-label="Cerrar"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
      />
      <div className="se-adm-dialog__surface" role="dialog" aria-modal="true" aria-label="Insertar enlace">
        <header className="se-adm-dialog__header">
          <h2 className="se-adm-dialog__title">Enlace</h2>
          <button type="button" className="se-adm-dialog__x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="se-adm-dialog__body">
            <label className="se-form-field" htmlFor="richtext-link-url">
              <span className="se-form-label">URL</span>
              <input
                ref={inputRef}
                id="richtext-link-url"
                type="url"
                className="se-form-control"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
          </div>
          <footer className="se-adm-dialog__actions">
            <button type="button" className="se-btn se-btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            {initialUrl ? (
              <button type="button" className="se-btn se-btn--secondary" onClick={onRemove}>
                Quitar enlace
              </button>
            ) : null}
            <button type="submit" className="se-btn">
              Guardar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

LinkDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  initialUrl: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
