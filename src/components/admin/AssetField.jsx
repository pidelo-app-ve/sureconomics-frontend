import PropTypes from "prop-types";
import { useState } from "react";
import {
  createAdminExternalMedia,
  formatBytes,
  formatDuration,
} from "../../services/adminMediaService";
import { adminErrorMessage } from "../../lib/adminErrorMessage";

/**
 * Attach one file to a piece: upload it, or point at one that lives elsewhere.
 *
 * Both paths end in the same asset id, which is what the post stores. The paste-a-URL
 * path is not a fallback — it is how an entrevista gets published today, because the
 * backend asks for a video asset and a YouTube link satisfies that while the R2
 * migration is still ahead of us.
 *
 * The component reports what is attached rather than just that something is: the
 * duration for a video and the page count for a report are what the public cards
 * print, so an editor needs to see them here.
 */
export const AssetField = ({
  id,
  label,
  hint,
  kind,
  value,
  asset,
  onChange,
  onUpload,
  accept,
  required,
}) => {
  const [url, setUrl] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /**
   * What each kind of file is called, and what else is worth knowing about it.
   *
   * This used to be a single `isVideo` flag, which meant an image field asked for
   * "la dirección del documento" and a page count — copy for a file it was not.
   */
  const COPY = {
    image: {
      solo: "Dirección de la imagen",
      alterna: "O pegar la dirección de la imagen",
      ejemplo: "https://…/foto.jpg",
      extra: null,
    },
    video: {
      solo: "Enlace del video",
      alterna: "O pegar el enlace del video",
      ejemplo: "https://youtube.com/watch?v=…",
      extra: { label: "Duración en minutos", campo: "duration_seconds" },
    },
    document: {
      solo: "Dirección del documento",
      alterna: "O pegar la dirección del documento",
      ejemplo: "https://…/informe.pdf",
      extra: { label: "Número de páginas", campo: "pages" },
    },
  };
  const copy = COPY[kind] ?? COPY.image;
  // "O pegar…" only makes sense when there is something to pegar it instead of.
  const pegarLabel = onUpload ? copy.alterna : copy.solo;

  const attach = (row) => {
    setError("");
    setUrl("");
    setExtra("");
    onChange(row?.id ?? null, row ?? null);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUpload) return;
    setBusy(true);
    setError("");
    try {
      attach(await onUpload(file));
    } catch (err) {
      setError(adminErrorMessage(err, "No se pudo subir el archivo."));
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Pegue una dirección.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = { kind, url: trimmed };
      const numeric = Number(extra);
      if (copy.extra && Number.isFinite(numeric) && numeric > 0) {
        body[copy.extra.campo] =
          copy.extra.campo === "duration_seconds"
            ? Math.round(numeric * 60)
            : Math.round(numeric);
      }
      // A report is registered private: the article payload withholds its address
      // and only a signed-in reader can ask for it.
      if (kind === "document") body.is_private = true;
      attach(await createAdminExternalMedia(body));
    } catch (err) {
      setError(adminErrorMessage(err, "No se pudo registrar la dirección."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <fieldset className="se-form-field se-asset" id={id}>
      <legend className="se-form-label">
        {label}
        {required ? <span className="se-asset__required">obligatorio al publicar</span> : null}
      </legend>
      {hint ? <p className="se-asset__hint">{hint}</p> : null}

      {value ? (
        <div className="se-asset__current">
          <div className="se-asset__current-body">
            <p className="se-asset__current-name">
              {asset?.original_filename || asset?.url || `Archivo #${value}`}
            </p>
            <p className="se-asset__current-meta">
              {[
                asset?.storage === "external" ? "enlace externo" : "almacenado",
                formatDuration(asset?.duration_seconds),
                asset?.pages ? `${asset.pages} páginas` : null,
                asset?.width && asset?.height ? `${asset.width}×${asset.height}` : null,
                formatBytes(asset?.bytes),
                asset?.is_private ? "privado" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            className="se-btn se-btn--secondary se-btn--small"
            onClick={() => onChange(null, null)}
          >
            Quitar
          </button>
        </div>
      ) : (
        <p className="se-asset__empty">Nada adjunto todavía.</p>
      )}

      <div className="se-asset__ways">
        {onUpload ? (
          <label className="se-asset__way">
            <span className="se-asset__way-title">Subir un archivo</span>
            <input type="file" accept={accept} onChange={handleUpload} disabled={busy} />
          </label>
        ) : null}

        <div className="se-asset__way">
          <span className="se-asset__way-title">{pegarLabel}</span>
          <input
            className="se-form-control"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={copy.ejemplo}
            disabled={busy}
          />
          <div className="se-asset__way-row">
            {copy.extra ? (
              <input
                className="se-form-control"
                type="number"
                min="1"
                value={extra}
                onChange={(event) => setExtra(event.target.value)}
                placeholder={copy.extra.label}
                aria-label={copy.extra.label}
                disabled={busy}
              />
            ) : null}
            <button
              type="button"
              className="se-btn se-btn--secondary se-btn--small"
              onClick={handleRegisterUrl}
              disabled={busy}
            >
              {busy ? "…" : "Adjuntar"}
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="se-asset__error">{error}</p> : null}
    </fieldset>
  );
};

AssetField.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  kind: PropTypes.oneOf(["image", "video", "document"]).isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  asset: PropTypes.shape({
    url: PropTypes.string,
    storage: PropTypes.string,
    original_filename: PropTypes.string,
    duration_seconds: PropTypes.number,
    pages: PropTypes.number,
    bytes: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number,
    is_private: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
  onUpload: PropTypes.func,
  accept: PropTypes.string,
  required: PropTypes.bool,
};
