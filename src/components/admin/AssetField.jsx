import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  createAdminExternalMedia,
  estadoDelVideo,
  formatBytes,
  formatDuration,
  patchAdminMedia,
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
  // Nulo mientras no haya nada que informar. Un video de medio giga tarda minutos, y
  // una barra que no se mueve es indistinguible de algo colgado: la redaccion cancela
  // subidas que iban bien.
  const [progreso, setProgreso] = useState(null);
  const [aviso, setAviso] = useState("");

  // Si Cloudflare ya acabo de transcodificar el video adjunto.
  //
  // Hace falta al **volver** a abrir la pieza, no solo justo despues de subir: quien
  // sube y cierra no tiene despues ninguna forma de saber si el video ya se ve, y
  // publicaria una entrevista con el reproductor en negro. Nulo = no se ha preguntado.
  const esDeStream = asset?.storage === "stream" && Boolean(asset?.object_key);
  const [videoListo, setVideoListo] = useState(null);

  useEffect(() => {
    if (!esDeStream) {
      setVideoListo(null);
      return undefined;
    }
    let vivo = true;
    setVideoListo(null);
    estadoDelVideo(asset.object_key)
      .then((e) => { if (vivo) setVideoListo(Boolean(e?.listo)); })
      // Que la consulta falle no dice que el video este mal: se deja en nulo y no se
      // afirma nada, que es mejor que decir "no esta listo" sin saberlo.
      .catch(() => { if (vivo) setVideoListo(null); });
    return () => { vivo = false; };
  }, [esDeStream, asset?.object_key]);

  // The credit belongs to the asset, so it saves on its own rather than with the
  // piece: the same photograph in a second piece arrives already credited, and a
  // correction fixes every piece using it at once.
  const [credito, setCredito] = useState("");
  const [creditoBusy, setCreditoBusy] = useState(false);
  const [creditoListo, setCreditoListo] = useState(false);

  useEffect(() => {
    setCredito(asset?.credit ?? "");
    setCreditoListo(false);
  }, [asset?.id, asset?.credit]);

  const guardarCredito = async () => {
    setCreditoBusy(true);
    setError("");
    try {
      const actualizado = await patchAdminMedia(value, { credit: credito.trim() });
      // Reported upwards so the editor holds the fresh asset: without this the
      // field would show the saved credit and the page would not.
      onChange(value, actualizado);
      setCreditoListo(true);
    } catch (err) {
      setError(adminErrorMessage(err, "No se pudo guardar el crédito."));
    } finally {
      setCreditoBusy(false);
    }
  };

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
    setAviso("");
    setProgreso(null);
    try {
      // El segundo argumento es opcional: quien sube una imagen no lo usa y sigue
      // funcionando igual. Solo el video lo necesita.
      attach(
        await onUpload(file, {
          onProgress: setProgreso,
          onAviso: setAviso,
        })
      );
    } catch (err) {
      setError(adminErrorMessage(err, "No se pudo subir el archivo."));
    } finally {
      setBusy(false);
      setProgreso(null);
      setAviso("");
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
            {esDeStream ? (
              <div className="se-asset__video">
                {/* La caratula la saca Cloudflare del propio video: si se ve, el video
                    esta ahi de verdad. Vale mas que cualquier texto de confirmacion. */}
                {asset?.poster_url ? (
                  <img
                    className="se-asset__video-mini"
                    src={asset.poster_url}
                    alt=""
                    width="96"
                    height="54"
                  />
                ) : null}
                <span
                  className={
                    videoListo === true
                      ? "se-asset__video-estado se-asset__video-estado--listo"
                      : "se-asset__video-estado"
                  }
                >
                  {videoListo === true
                    ? "Listo para verse"
                    : videoListo === false
                      ? "Cloudflare lo esta procesando; en unos minutos se vera en la pieza."
                      : "Comprobando el estado del video…"}
                </span>
              </div>
            ) : null}

            <p className="se-asset__current-meta">
              {[
                asset?.storage === "stream"
                  ? "nuestro servicio de video"
                  : asset?.storage === "external"
                    ? "enlace externo"
                    : "almacenado",
                formatDuration(asset?.duration_seconds),
                asset?.pages ? `${asset.pages} páginas` : null,
                asset?.width && asset?.height ? `${asset.width}×${asset.height}` : null,
                formatBytes(asset?.bytes),
                asset?.is_private ? "privado" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {kind === "image" ? (
              <div className="se-asset__credit">
                <label className="se-form-label" htmlFor={`${id}-credit`}>
                  Crédito de la imagen
                </label>
                <p className="se-asset__hint">
                  Quién tiene los derechos, tal como debe salir publicado. Se guarda
                  en la imagen, así que si la reutiliza en otra pieza va sola.
                </p>
                <div className="se-asset__credit-row">
                  <input
                    id={`${id}-credit`}
                    className="se-form-control"
                    value={credito}
                    placeholder="Foto: Reuters · © BCV · Cortesía de la empresa"
                    maxLength={255}
                    onChange={(event) => {
                      setCredito(event.target.value);
                      setCreditoListo(false);
                    }}
                  />
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    disabled={creditoBusy || credito.trim() === (asset?.credit ?? "")}
                    onClick={guardarCredito}
                  >
                    {creditoBusy ? "Guardando…" : "Guardar"}
                  </button>
                </div>
                {creditoListo ? (
                  <p className="se-asset__credit-ok">Crédito guardado.</p>
                ) : null}
              </div>
            ) : null}
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
            {progreso !== null ? (
              <>
                <progress
                  className="se-asset__progreso"
                  value={progreso}
                  max="100"
                  aria-label="Progreso de la subida"
                />
                <span className="se-asset__progreso-cifra">{progreso}%</span>
              </>
            ) : null}
            {aviso ? <span className="se-asset__aviso">{aviso}</span> : null}
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
    // `id` y `credit` faltaban desde antes, y el linter llevaba tiempo avisando de las
    // cuatro lecturas. Se cierran aqui porque este bloque ya se estaba tocando.
    id: PropTypes.number,
    credit: PropTypes.string,
    url: PropTypes.string,
    storage: PropTypes.string,
    object_key: PropTypes.string,
    poster_url: PropTypes.string,
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
