import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha } from "../../i18n/motor";
import { duracionReloj, vistasCortas } from "../../lib/youtube";
import { Reproductor } from "./NuestroCanal";
import { IconoPlay } from "./VistaPrevia";
import "./nuestroCanal.css";
import "./videosDelCanal.css";

/**
 * «Al punto» con los videos del canal de YouTube (nov-2026): lo que se sube al canal es
 * lo que sale aquí, igual que en la portada.
 *
 * Arriba, el video elegido en grande (al principio, el último), con el mismo reproductor
 * que «Nuestro canal»: se pulsa y suena, y si se baja mientras suena se queda en una
 * esquina. Debajo, todos los videos; al pulsar uno, pasa arriba y arranca.
 */

const Meta = ({ v }) => {
  const { t, lang } = useIdioma();
  const partes = [
    v.publicado ? formatearFecha(v.publicado, "diaMes", lang) : null,
    v.vistas != null ? t("portada.calle.vistas", { n: vistasCortas(v.vistas, lang) }) : null,
  ].filter(Boolean);
  return partes.length ? <p className="se-alvideo__meta">{partes.join(" · ")}</p> : null;
};

Meta.propTypes = { v: PropTypes.object.isRequired };

const Portada = ({ v, onClick, className = "", tabIndex }) => {
  const { t } = useIdioma();
  const dura = duracionReloj(v.duracion);
  const vertical = v.tipo === "short";
  return (
    <button
      type="button"
      className={`se-canal__portada ${className}`}
      onClick={onClick}
      tabIndex={tabIndex}
      aria-label={
        dura
          ? t("portada.canal.reproducirConDuracion", { titulo: v.titulo, duracion: dura })
          : t("portada.canal.reproducir", { titulo: v.titulo })
      }
    >
      <img
        src={v.portada}
        alt=""
        width={vertical ? 360 : 640}
        height={vertical ? 640 : 360}
        loading="lazy"
        decoding="async"
      />
      <span className="se-canal__play">
        <IconoPlay tamano={22} />
        {dura}
      </span>
    </button>
  );
};

Portada.propTypes = {
  v: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  tabIndex: PropTypes.number,
};

export const VideosDelCanal = ({ canal, videos }) => {
  const { t } = useIdioma();
  const [actual, setActual] = useState(0);
  const [sonando, setSonando] = useState(false);
  const arriba = useRef(null);
  const v = videos[actual] ?? videos[0];

  const elegir = (i) => {
    setActual(i);
    setSonando(true);
    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    arriba.current?.scrollIntoView({ block: "start", behavior: quieto ? "auto" : "smooth" });
  };

  return (
    <>
      <section className="se-alpunto__ultimo se-alvideo" aria-labelledby="alpunto-ultimo" ref={arriba}>
        <h2 id="alpunto-ultimo" className="se-alpunto__h2">
          {t("listados.alPunto.loUltimo")}
        </h2>
        <div className={`se-alvideo__principal${v.tipo === "short" ? " se-alvideo__principal--vertical" : ""}`}>
          <div className="se-alvideo__marco">
            {sonando ? (
              <Reproductor key={v.id} v={v} onCerrar={() => setSonando(false)} />
            ) : (
              <Portada v={v} onClick={() => setSonando(true)} className="se-alvideo__portada" />
            )}
          </div>
          <div className="se-alvideo__texto">
            <h3 className="se-alvideo__titulo">{v.titulo}</h3>
            <Meta v={v} />
            <div className="se-alvideo__acciones">
              {canal.suscribirse ? (
                <a className="se-btn se-btn--primary" href={canal.suscribirse} target="_blank" rel="noopener noreferrer">
                  {t("listados.alPunto.suscribirse")}
                  <span className="se-sr-only"> {t("comun.nuevaPestana")}</span>
                </a>
              ) : null}
              <a className="se-alvideo__enlace" href={v.enlace || canal.url} target="_blank" rel="noopener noreferrer">
                {t("listados.alPunto.verEnYoutube")}
                <span className="se-sr-only"> {t("comun.nuevaPestana")}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {videos.length > 1 ? (
        <section className="se-alvideo__lista" aria-labelledby="alpunto-videos">
          <h2 id="alpunto-videos" className="se-alpunto__h2">
            {t("listados.alPunto.todosLosVideos")}
          </h2>
          <ul className="se-alvideo__rejilla">
            {videos.map((x, i) => (
              <li key={x.id} className={`se-alvideo__item${i === actual ? " is-actual" : ""}`}>
                <Portada v={x} onClick={() => elegir(i)} className="se-alvideo__mini" />
                <p className="se-alvideo__item-titulo">{x.titulo}</p>
                <Meta v={x} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
};

VideosDelCanal.propTypes = {
  canal: PropTypes.shape({ url: PropTypes.string, suscribirse: PropTypes.string }).isRequired,
  videos: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, titulo: PropTypes.string, tipo: PropTypes.string })
  ).isRequired,
};

export default VideosDelCanal;
