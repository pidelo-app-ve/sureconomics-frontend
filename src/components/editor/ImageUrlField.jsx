import { useState } from "react";
import PropTypes from "prop-types";

/**
 * A URL input for a featured image with a live preview underneath, so the
 * editor can confirm the link actually resolves to an image before saving
 * instead of finding out on the public page.
 */
export const ImageUrlField = ({ id, label, value, onChange, required, disabled }) => {
  const [status, setStatus] = useState("idle");

  const trimmed = (value || "").trim();

  return (
    <label className="se-form-field" htmlFor={id}>
      <span className="se-form-label">{label}</span>
      <input
        id={id}
        type="url"
        className="se-form-control"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setStatus("idle");
        }}
        placeholder="https://…"
        required={required}
        disabled={disabled}
      />
      {trimmed ? (
        <div className="se-image-preview">
          <img
            src={trimmed}
            alt=""
            className="se-image-preview__img"
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("error")}
          />
          {status === "error" ? (
            <p className="se-image-preview__hint se-image-preview__hint--error">
              No se pudo cargar esta imagen. Verifique que el enlace sea público y apunte directo a un
              archivo de imagen (termina en .jpg, .png, .webp, etc.), no a una página web.
            </p>
          ) : null}
          {status === "ok" ? <p className="se-image-preview__hint">Vista previa cargada correctamente.</p> : null}
        </div>
      ) : null}
    </label>
  );
};

ImageUrlField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
};
