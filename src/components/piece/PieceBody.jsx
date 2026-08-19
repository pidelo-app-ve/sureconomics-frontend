import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { PlaceholderImage } from "../blog";
import { useUserAuth } from "../../context/UserAuthContext";
import { fetchPieceDocument } from "../../services/documentService";
import { piezaShape } from "../home/piezaShape";

/**
 * Body copy, as the writer formatted it.
 *
 * Rendered as markup because that is what the rich editor produces, and the same
 * trust model has applied to `content` since that editor existed: the only way in
 * is an authenticated newsroom account.
 */
const Cuerpo = ({ html }) => {
  if (!html) return null;
  return <div className="se-piece__body" dangerouslySetInnerHTML={{ __html: html }} />;
};

Cuerpo.propTypes = { html: PropTypes.string };

/**
 * A bordered block that carries the outlet's own voice.
 *
 * Used twice with different titles: closing a noticia, where the reader must see
 * where the reported fact ends and the position begins; and opening an editorial,
 * where the whole piece is that voice.
 */
const OpinionBlock = ({ titulo, html }) => (
  <aside className="se-opinion">
    <p className="se-opinion__k">{titulo}</p>
    {html ? (
      <div className="se-opinion__body" dangerouslySetInnerHTML={{ __html: html }} />
    ) : null}
  </aside>
);

OpinionBlock.propTypes = {
  titulo: PropTypes.string.isRequired,
  html: PropTypes.string,
};

/**
 * Where the noticia came from.
 *
 * Singular, because the model stores one source per piece. It used to render a
 * list from sample data, which quietly promised a shape the database does not have.
 */
const Fuente = ({ fuente }) => {
  if (!fuente?.nombre) return null;
  return (
    <div className="se-sources">
      <p className="se-sources__k">Fuente</p>
      <ul className="se-sources__list">
        <li>
          {fuente.url ? (
            <a href={fuente.url} target="_blank" rel="noreferrer noopener">
              {fuente.nombre}
              <span aria-hidden="true"> ↗</span>
            </a>
          ) : (
            fuente.nombre
          )}
        </li>
      </ul>
    </div>
  );
};

Fuente.propTypes = {
  fuente: PropTypes.shape({ nombre: PropTypes.string, url: PropTypes.string }),
};

/**
 * Turn a pasted address into something embeddable.
 *
 * Interviews are registered by pasting a link, so the three shapes that actually
 * arrive are a YouTube watch URL, a Vimeo one, and a direct file. Anything else
 * becomes a plain link rather than a broken frame.
 */
const embedDe = (url) => {
  if (!url) return null;
  const youtube = /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/.exec(url);
  if (youtube) return { tipo: "iframe", src: `https://www.youtube.com/embed/${youtube[1]}` };
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return { tipo: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { tipo: "video", src: url };
  return { tipo: "enlace", src: url };
};

/**
 * The interview video.
 *
 * The written summary still comes after it in the markup, which matters twice: a
 * reader on a slow connection gets the text, and the text is the only part a search
 * engine can read.
 */
const VideoStage = ({ url, duracion, titulo }) => {
  const embed = embedDe(url);

  if (!embed) {
    return (
      <div className="se-videostage">
        <span className="se-videostage__play" aria-hidden="true" />
        <p className="se-videostage__note">
          El video de esta entrevista todavía no está cargado.
        </p>
      </div>
    );
  }

  if (embed.tipo === "iframe") {
    return (
      <div className="se-videostage se-videostage--live">
        <iframe
          className="se-videostage__frame"
          src={embed.src}
          title={titulo ? `Video: ${titulo}` : "Video de la entrevista"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
        {duracion ? <p className="se-videostage__note">{duracion}</p> : null}
      </div>
    );
  }

  if (embed.tipo === "video") {
    return (
      <div className="se-videostage se-videostage--live">
        <video className="se-videostage__frame" src={embed.src} controls preload="metadata" />
        {duracion ? <p className="se-videostage__note">{duracion}</p> : null}
      </div>
    );
  }

  return (
    <div className="se-videostage">
      <span className="se-videostage__play" aria-hidden="true" />
      <p className="se-videostage__note">
        <a href={embed.src} target="_blank" rel="noreferrer noopener">
          Ver el video
          <span aria-hidden="true"> ↗</span>
        </a>
        {duracion ? ` · ${duracion}` : ""}
      </p>
    </div>
  );
};

VideoStage.propTypes = {
  url: PropTypes.string,
  duracion: PropTypes.string,
  titulo: PropTypes.string,
};

/**
 * The wall in front of a report.
 *
 * Not a lead-capture form. Registering and signing in is what earns the file, so
 * the page asks for an account rather than for a name and an e-mail it would take
 * and then let anyone through anyway. Three states, because a reader can be signed
 * out, signed in but unconfirmed, or entitled — and each needs a different sentence.
 */
const DownloadGate = ({ pieza }) => {
  const { isAuthenticated, isEmailVerified } = useUserAuth();
  const [state, setState] = useState({ status: "idle", error: "" });

  const handleDownload = async () => {
    setState({ status: "loading", error: "" });
    try {
      const doc = await fetchPieceDocument(pieza.slug);
      if (!doc?.url) {
        setState({ status: "error", error: "Este informe todavía no tiene archivo cargado." });
        return;
      }
      window.open(doc.url, "_blank", "noopener,noreferrer");
      setState({ status: "idle", error: "" });
    } catch (err) {
      setState({
        status: "error",
        error:
          err?.status === 404
            ? "Este informe todavía no tiene archivo cargado."
            : "No se pudo obtener el documento. Inténtelo de nuevo.",
      });
    }
  };

  return (
    <section className="se-gate" aria-labelledby="gate-title">
      <h2 id="gate-title" className="se-gate__title">
        Descargue el informe completo
      </h2>

      {!isAuthenticated ? (
        <>
          <p className="se-gate__lead">
            Los informes son para lectores registrados. Cree una cuenta o inicie sesión
            y podrá descargar este y los demás.
          </p>
          <div className="se-gate__actions">
            <Link to="/cuenta/entrar" className="se-gate__submit">
              Iniciar sesión
            </Link>
            <Link to="/cuenta/registro" className="se-link">
              Crear una cuenta
            </Link>
          </div>
        </>
      ) : !isEmailVerified ? (
        <>
          <p className="se-gate__lead">
            Falta confirmar su correo. Es el último paso para poder descargar.
          </p>
          <div className="se-gate__actions">
            <Link to="/cuenta/verificar-email" className="se-gate__submit">
              Verificar mi correo
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="se-gate__lead">
            {pieza.paginas ? `${pieza.paginas} páginas. ` : ""}Descarga gratuita para lectores
            registrados.
          </p>
          <div className="se-gate__actions">
            <button
              type="button"
              className="se-gate__submit"
              onClick={handleDownload}
              disabled={state.status === "loading"}
            >
              {state.status === "loading" ? "Preparando…" : "Descargar el informe"}
            </button>
          </div>
        </>
      )}

      {state.error ? (
        <p className="se-gate__error" role="alert">
          {state.error}
        </p>
      ) : null}
    </section>
  );
};

DownloadGate.propTypes = { pieza: piezaShape().isRequired };

/** The image a piece carries, real when there is one and a treatment when not. */
const Media = ({ pieza }) =>
  pieza.imagenUrl ? (
    <div className="se-piece__media">
      <img className="se-piece__img" src={pieza.imagenUrl} alt={pieza.titulo} loading="lazy" />
    </div>
  ) : (
    <div className="se-piece__media">
      <PlaceholderImage variant={pieza.imagen} hero />
    </div>
  );

Media.propTypes = { pieza: piezaShape().isRequired };

/**
 * The part of a piece that differs by format.
 *
 * Everything around it — breadcrumb, kicker, headline, byline, tags, related — is
 * shared, because those are the same job in all five cases.
 *
 * What used to be here and is gone: a fabricated table of contents for reports.
 * There is no field for a section list, so it was sample text dressed as editorial
 * structure. The page count it carried now sits on the download block, which is
 * where it was doing real work.
 */
export const PieceBody = ({ pieza }) => {
  if (pieza.formato === "Noticias") {
    return (
      <>
        <Cuerpo html={pieza.cuerpo} />
        {pieza.opinionCasaHtml ? (
          <OpinionBlock titulo="¿Qué piensa SurEconomics?" html={pieza.opinionCasaHtml} />
        ) : null}
        <Fuente fuente={pieza.fuente} />
      </>
    );
  }

  if (pieza.formato === "Entrevistas") {
    return (
      <>
        <VideoStage url={pieza.videoUrl} duracion={pieza.duracion} titulo={pieza.titulo} />
        {pieza.entrevistado ? (
          <p className="se-piece__lead">
            Conversación con {pieza.entrevistado}
            {pieza.entrevistadoCargo ? `, ${pieza.entrevistadoCargo}` : ""}.
          </p>
        ) : null}
        <Cuerpo html={pieza.cuerpo} />
      </>
    );
  }

  if (pieza.formato === "Informes") {
    return (
      <>
        {pieza.resumenHtml ? (
          <div className="se-piece__lead" dangerouslySetInnerHTML={{ __html: pieza.resumenHtml }} />
        ) : null}
        <Cuerpo html={pieza.cuerpo} />
        {pieza.tieneDocumento ? <DownloadGate pieza={pieza} /> : null}
      </>
    );
  }

  if (pieza.formato === "Editorial") {
    return (
      <>
        <OpinionBlock titulo="Editorial de SurEconomics" />
        {pieza.entradaHtml ? (
          <div className="se-piece__lead" dangerouslySetInnerHTML={{ __html: pieza.entradaHtml }} />
        ) : null}
        <Cuerpo html={pieza.cuerpo} />
      </>
    );
  }

  // Artículos: signed analysis, and the only format whose layout prints an image.
  return (
    <>
      <Media pieza={pieza} />
      {pieza.resumenHtml ? (
        <div className="se-piece__lead" dangerouslySetInnerHTML={{ __html: pieza.resumenHtml }} />
      ) : null}
      <Cuerpo html={pieza.cuerpo} />
    </>
  );
};

PieceBody.propTypes = { pieza: piezaShape().isRequired };
