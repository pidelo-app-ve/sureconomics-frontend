import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { ACCEPTED_IMAGE_MIME, MAX_IMAGE_BYTES } from "../../services/adminUploadsService";

const ACCEPTED_MIME_SET = new Set(ACCEPTED_IMAGE_MIME.split(","));

const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Reject the obvious cases here so a 12 MB photo doesn't travel to the server
 * only to bounce. The backend still re-checks — it sniffs magic bytes, which the
 * browser's `File.type` (taken from the OS) can't be trusted for.
 *
 * @param {File} file
 * @returns {string} error message, or "" when the file looks acceptable
 */
const localFileProblem = (file) => {
  if (!file) return "No se seleccionó ningún archivo.";
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_IMAGE_BYTES) {
    return `La imagen pesa ${formatMb(file.size)} y el máximo es ${formatMb(MAX_IMAGE_BYTES)}.`;
  }
  if (file.type && !ACCEPTED_MIME_SET.has(file.type)) {
    return "Formato no admitido. Use JPG, PNG, WebP, GIF o AVIF.";
  }
  return "";
};

/**
 * Featured-image picker: paste a URL, or upload a file that gets stored in
 * Cloudinary. Both paths end in the same place — the resulting URL is written
 * back through `onChange`, so the form only ever deals with a string.
 *
 * The upload half only appears when an `onUpload` handler is supplied, which
 * keeps this usable in public contexts (collaborator submissions) that have no
 * upload endpoint.
 *
 * @param {{
 *   id: string,
 *   label: string,
 *   value?: string,
 *   onChange: (url: string) => void,
 *   onUpload?: (file: File) => Promise<{ url: string, bytes?: number, width?: number, height?: number }>,
 *   required?: boolean,
 *   disabled?: boolean,
 * }} props
 */
export const ImageField = ({ id, label, value, onChange, onUpload, required, disabled }) => {
  const [previewStatus, setPreviewStatus] = useState("idle");
  const [mode, setMode] = useState("url");
  const [uploadState, setUploadState] = useState({ status: "idle", error: "", info: "" });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const canUpload = typeof onUpload === "function";
  const isUploading = uploadState.status === "loading";
  const trimmed = (value || "").trim();
  const fileInputId = `${id}-file`;
  const busy = disabled || isUploading;

  const runUpload = async (file) => {
    const problem = localFileProblem(file);
    if (problem) {
      setUploadState({ status: "error", error: problem, info: "" });
      return;
    }

    setUploadState({ status: "loading", error: "", info: "" });
    try {
      const result = await onUpload(file);
      const url = typeof result === "string" ? result : result?.url;
      if (!url) throw new Error("La subida no devolvió una URL.");
      // The component can unmount mid-upload (navigating away right after
      // picking a file); writing state then would warn and leak.
      if (!isMountedRef.current) return;
      onChange(url);
      setPreviewStatus("idle");
      const size = typeof result === "object" && result?.bytes ? ` · ${formatMb(result.bytes)}` : "";
      setUploadState({
        status: "success",
        error: "",
        // The image is in Cloudinary but the post still holds the old URL until
        // the form is submitted; say so, or this reads as "done".
        info: `«${file.name}» se subió correctamente${size}. Guarde el formulario para aplicarla.`,
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      setUploadState({
        status: "error",
        error: adminErrorMessage(err, "No se pudo subir la imagen."),
        info: "",
      });
    }
  };

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    // Clear the input so re-picking the same file after a failure still fires.
    e.target.value = "";
    if (file) await runUpload(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (busy) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) await runUpload(file);
  };

  const switchMode = (next) => {
    if (isUploading) return;
    setMode(next);
    setUploadState({ status: "idle", error: "", info: "" });
  };

  const handleClear = () => {
    onChange("");
    setPreviewStatus("idle");
    setUploadState({ status: "idle", error: "", info: "" });
  };

  return (
    <div className="se-form-field se-image-field">
      {mode === "url" ? (
        <label className="se-form-label" htmlFor={id}>
          {label}
        </label>
      ) : (
        <span className="se-form-label">{label}</span>
      )}

      {canUpload ? (
        <div className="se-image-field__modes" role="group" aria-label={`${label}: origen`}>
          <button
            type="button"
            className={`se-image-field__mode${mode === "url" ? " se-image-field__mode--active" : ""}`}
            aria-pressed={mode === "url"}
            onClick={() => switchMode("url")}
            disabled={isUploading}
          >
            Pegar URL
          </button>
          <button
            type="button"
            className={`se-image-field__mode${mode === "upload" ? " se-image-field__mode--active" : ""}`}
            aria-pressed={mode === "upload"}
            onClick={() => switchMode("upload")}
            disabled={isUploading}
          >
            Subir imagen
          </button>
        </div>
      ) : null}

      {mode === "url" ? (
        <input
          id={id}
          type="url"
          className="se-form-control"
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            setPreviewStatus("idle");
            setUploadState({ status: "idle", error: "", info: "" });
          }}
          placeholder="https://…"
          required={required}
          disabled={disabled}
        />
      ) : (
        <div
          className={`se-image-field__drop${isDragging ? " se-image-field__drop--over" : ""}${
            isUploading ? " se-image-field__drop--busy" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            className="se-sr-only"
            accept={ACCEPTED_IMAGE_MIME}
            aria-label={`${label}: elegir archivo para subir`}
            onChange={handleFileInputChange}
            disabled={busy}
          />
          <p className="se-image-field__drop-text">
            {isUploading ? "Subiendo la imagen a Cloudinary…" : "Arrastre una imagen aquí, o"}
          </p>
          {!isUploading ? (
            <button
              type="button"
              className="se-btn se-btn--secondary se-image-field__pick"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              Elegir archivo
            </button>
          ) : (
            <span className="se-image-field__spinner" aria-hidden="true" />
          )}
          <p className="se-image-field__drop-hint">
            JPG, PNG, WebP, GIF o AVIF · hasta {formatMb(MAX_IMAGE_BYTES)}
          </p>
        </div>
      )}

      {uploadState.status === "error" ? (
        <p className="se-image-field__alert se-image-field__alert--error" role="alert">
          {uploadState.error}
        </p>
      ) : null}
      {uploadState.status === "success" ? (
        <p className="se-image-field__alert se-image-field__alert--ok" role="status">
          {uploadState.info}
        </p>
      ) : null}

      {trimmed ? (
        <div className="se-image-preview">
          <img
            src={trimmed}
            alt=""
            className="se-image-preview__img"
            onLoad={() => setPreviewStatus("ok")}
            onError={() => setPreviewStatus("error")}
          />
          {previewStatus === "error" ? (
            <p className="se-image-preview__hint se-image-preview__hint--error">
              No se pudo cargar esta imagen. Verifique que el enlace sea público y apunte directo a un
              archivo de imagen (termina en .jpg, .png, .webp, etc.), no a una página web.
            </p>
          ) : null}
          {previewStatus === "ok" ? (
            <p className="se-image-preview__hint">Vista previa cargada correctamente.</p>
          ) : null}
          <div className="se-image-field__current">
            <span className="se-image-field__url" title={trimmed}>
              {trimmed}
            </span>
            {!required ? (
              <button
                type="button"
                className="se-image-field__clear"
                onClick={handleClear}
                disabled={busy}
              >
                Quitar imagen
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

ImageField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onUpload: PropTypes.func,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
};
