import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { ACCEPTED_IMAGE_MIME, MAX_IMAGE_BYTES } from "../../services/adminUploadsService";

const ACCEPTED_MIME_SET = new Set(ACCEPTED_IMAGE_MIME.split(","));

const formatMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Reject the obvious cases here so a 12 MB photo doesn't travel to the server
 * only to bounce. The backend still re-checks — it sniffs magic bytes, which the
 * browser's `File.type` (taken from the OS) can't be trusted for.
 *
 * @param {File} file
 * @param {(clave: string, vars?: object) => string} t
 * @returns {string} error message, or "" when the file looks acceptable
 */
const localFileProblem = (file, t) => {
  if (!file) return t("cuenta.imagen.sinArchivo");
  if (file.size === 0) return t("cuenta.imagen.vacio");
  if (file.size > MAX_IMAGE_BYTES) {
    return t("cuenta.imagen.pesaDemasiado", { tamano: formatMb(file.size), maximo: formatMb(MAX_IMAGE_BYTES) });
  }
  if (file.type && !ACCEPTED_MIME_SET.has(file.type)) {
    return t("cuenta.imagen.formatoNoAdmitido");
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
 *   onUpload?: (file: File) =>
 *     Promise<{ url: string, bytes?: number, width?: number, height?: number }>,
 *   required?: boolean,
 *   disabled?: boolean,
 * }} props
 */
export const ImageField = ({ id, label, value, onChange, onUpload, required, disabled }) => {
  const { t } = useIdioma();
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
    const problem = localFileProblem(file, t);
    if (problem) {
      setUploadState({ status: "error", error: problem, info: "" });
      return;
    }

    setUploadState({ status: "loading", error: "", info: "" });
    try {
      const result = await onUpload(file);
      const url = typeof result === "string" ? result : result?.url;
      if (!url) throw new Error(t("cuenta.imagen.sinUrl"));
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
        info: t("cuenta.imagen.subidaOk", { nombre: file.name, tamano: size }),
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      setUploadState({
        status: "error",
        error: adminErrorMessage(err, t("cuenta.imagen.fallo")),
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
        <div className="se-image-field__modes" role="group" aria-label={t("cuenta.imagen.origen", { etiqueta: label })}>
          <button
            type="button"
            className={`se-image-field__mode${mode === "url" ? " se-image-field__mode--active" : ""}`}
            aria-pressed={mode === "url"}
            onClick={() => switchMode("url")}
            disabled={isUploading}
          >
            {t("cuenta.imagen.pegarUrl")}
          </button>
          <button
            type="button"
            className={`se-image-field__mode${mode === "upload" ? " se-image-field__mode--active" : ""}`}
            aria-pressed={mode === "upload"}
            onClick={() => switchMode("upload")}
            disabled={isUploading}
          >
            {t("cuenta.imagen.subir")}
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
            aria-label={t("cuenta.imagen.elegirArchivoPara", { etiqueta: label })}
            onChange={handleFileInputChange}
            disabled={busy}
          />
          <p className="se-image-field__drop-text">
            {isUploading ? t("cuenta.imagen.subiendo") : t("cuenta.imagen.arrastre")}
          </p>
          {!isUploading ? (
            <button
              type="button"
              className="se-btn se-btn--secondary se-image-field__pick"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {t("cuenta.imagen.elegirArchivo")}
            </button>
          ) : (
            <span className="se-image-field__spinner" aria-hidden="true" />
          )}
          <p className="se-image-field__drop-hint">
            {t("cuenta.imagen.pista", { maximo: formatMb(MAX_IMAGE_BYTES) })}
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
              {t("cuenta.imagen.vistaPreviaFallo")}
            </p>
          ) : null}
          {previewStatus === "ok" ? (
            <p className="se-image-preview__hint">{t("cuenta.imagen.vistaPreviaOk")}</p>
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
                {t("cuenta.imagen.quitar")}
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
