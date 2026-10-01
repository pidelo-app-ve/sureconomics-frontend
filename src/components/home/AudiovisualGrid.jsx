import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { imagenAncho, imagenSrcSet, rutaDePieza } from "../../lib/pieza";
import { fondoDeTema } from "../../lib/tarjeta";
import { SelloEducativo } from "./SelloEducativo";
import { listaDePiezas, piezaShape } from "./piezaShape";

/**
 * Las tarjetas de «Al punto», la página que junta entrevistas y podcast.
 *
 * Una sola forma de tarjeta para los dos formatos, a propósito. En la portada cada
 * formato tiene su rejilla -- la miniatura con botón de reproducir de las entrevistas,
 * la tarjeta de artículo del podcast -- porque allí cada bloque es de un formato y la
 * forma ya dice cuál. Aquí van mezclados en orden de fecha, y dos formas distintas en
 * la misma rejilla se leen como dos rejillas que se han colado una en la otra. Lo que
 * distingue a cada pieza es un chip de texto en la esquina de la miniatura: se lee, no
 * se adivina por el color.
 */

/** Anchos que se le ofrecen al navegador, de una tarjeta a 1x al hero a 3x. */
const ANCHOS = [400, 640, 800, 1100, 1400];

/** Cuánto ocupa la caja según la variante, para que el navegador elija talla. */
const SIZES = {
  rejilla: "(max-width: 640px) 92vw, (max-width: 900px) 46vw, 33vw",
  hero: "(max-width: 900px) 92vw, 62vw",
};

/** Ancho de la derivada que se pide cuando no hay `srcset` que ofrecer. */
const ANCHO_BASE = { rejilla: 800, hero: 1400 };

/** Lo que dice el chip. La API habla en singular y en inglés; el chip, en el idioma del lector. */
const ETIQUETA = { entrevista: "Entrevista", podcast: "Podcast" };

/** Los campos que estas tarjetas leen además de los comunes a toda pieza. */
const CAMPOS = {
  formatoApi: PropTypes.string.isRequired,
  imagenUrl: PropTypes.string,
  imagenAnchoOriginal: PropTypes.number,
  duracion: PropTypes.string,
  entrevistado: PropTypes.string,
  entrevistadoCargo: PropTypes.string,
  resumen: PropTypes.string,
  educativo: PropTypes.bool,
};

/**
 * La miniatura: la caja 16/9 que es a la vez el enlace a la pieza.
 *
 * Con foto, la foto; sin ella -- o si la foto no llega -- el color del tema, igual que
 * el resto de tarjetas del sitio. Encima van el chip de formato, el sello educativo si
 * lo hay, el botón de reproducir en las entrevistas y la duración.
 *
 * El hero se carga sin `lazy`: está arriba del todo y es lo primero que el lector ve,
 * así que retrasarlo sería retrasar la página.
 */
const Miniatura = ({ pieza, variante }) => {
  const [fallo, setFallo] = useState(false);
  const conFoto = Boolean(pieza.imagenUrl) && !fallo;
  const esVideo = pieza.formatoApi === "entrevista";
  const arriba = variante !== "rejilla";

  return (
    <Link
      to={rutaDePieza(pieza)}
      className="se-alpunto__thumb"
      aria-label={pieza.titulo}
      style={conFoto ? undefined : { background: fondoDeTema(temaPrincipal(pieza)) }}
    >
      {conFoto ? (
        <img
          className="se-alpunto__img"
          src={imagenAncho(pieza.imagenUrl, ANCHO_BASE[variante])}
          srcSet={imagenSrcSet(pieza.imagenUrl, ANCHOS, pieza.imagenAnchoOriginal) ?? undefined}
          sizes={SIZES[variante]}
          alt=""
          loading={arriba ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFallo(true)}
        />
      ) : null}

      {/* Chip y sello juntos en la esquina: el sello lleva `position: absolute` para
          las demás rejillas, y aquí la fila lo vuelve estático para que no se monte
          sobre el chip. */}
      <span className="se-alpunto__chips">
        <span className="se-alpunto__chip">{ETIQUETA[pieza.formatoApi] ?? pieza.formato}</span>
        <SelloEducativo pieza={pieza} />
      </span>

      {esVideo ? <span className="se-vidcard__play se-alpunto__play" aria-hidden="true" /> : null}
      {pieza.duracion ? <span className="se-vidcard__dur">{pieza.duracion}</span> : null}
    </Link>
  );
};

Miniatura.propTypes = {
  pieza: piezaShape(CAMPOS).isRequired,
  variante: PropTypes.oneOf(["rejilla", "hero"]).isRequired,
};

/**
 * Una pieza, entrevista o podcast, en cualquiera de las tres posiciones de la página.
 *
 * El cuerpo cambia poco entre formatos: la entrevista dice a quién se entrevistó y su
 * cargo, que es lo que decide si alguien la ve; el podcast dice «Episodio», que es lo
 * que es. El resumen sólo sale en el hero, donde hay sitio para leerlo.
 */
export const TarjetaAlPunto = ({ pieza, variante }) => {
  const esEntrevista = pieza.formatoApi === "entrevista";
  const enHero = variante !== "rejilla";

  let kicker;
  if (esEntrevista) kicker = temaPrincipal(pieza) ?? "Entrevista";
  else if (enHero) kicker = `Podcast${pieza.duracion ? ` · ${pieza.duracion}` : ""}`;
  else kicker = "Episodio";

  return (
    <article className={`se-alpunto__card se-alpunto__card--${variante}`}>
      <Miniatura pieza={pieza} variante={variante} />
      <div className="se-alpunto__body">
        <span className="se-meta se-meta--category">{kicker}</span>
        <h3 className="se-alpunto__title">
          <Link to={rutaDePieza(pieza)}>{pieza.titulo}</Link>
        </h3>
        {esEntrevista && pieza.entrevistado ? (
          <p className="se-alpunto__who">
            <strong>{pieza.entrevistado}</strong>
            {pieza.entrevistadoCargo ? (
              <span className="se-alpunto__cargo">{pieza.entrevistadoCargo}</span>
            ) : null}
          </p>
        ) : null}
        {enHero && pieza.resumen ? <p className="se-alpunto__summary">{pieza.resumen}</p> : null}
        <div className="se-alpunto__foot">
          <span className="se-tagpill">
            {esEntrevista ? geoPrincipal(pieza) : (temaPrincipal(pieza) ?? geoPrincipal(pieza))}
          </span>
          <span className="se-alpunto__date">{pieza.fecha}</span>
        </div>
      </div>
    </article>
  );
};

TarjetaAlPunto.propTypes = {
  pieza: piezaShape(CAMPOS).isRequired,
  variante: PropTypes.oneOf(["rejilla", "hero"]).isRequired,
};

/**
 * La columna de «Lo último»: los episodios recientes en una lista con hilo, como la
 * columna de últimas noticias de un diario. Cada entrada es fecha y duración en una
 * línea pequeña y el título debajo; el punto sobre el hilo marca cada una.
 *
 * Sin miniaturas a propósito: al lado de un video grande, cinco fotos pequeñas compiten
 * con él y no se lee ninguna. Aquí lo que se compara son títulos.
 */
const ColumnaLateral = ({ piezas, titulo, enlace }) => (
  <aside className="se-alpunto__lateral" aria-labelledby="alpunto-lateral">
    <h3 id="alpunto-lateral" className="se-alpunto__lateral-titulo">
      {titulo}
    </h3>
    <ol className="se-alpunto__lateral-lista">
      {piezas.map((p) => (
        <li key={p.id} className="se-alpunto__lateral-item">
          <span className="se-alpunto__lateral-meta">
            {ETIQUETA[p.formatoApi] ?? p.formato}
            {p.fecha ? ` · ${p.fecha}` : ""}
            {p.duracion ? ` · ${p.duracion}` : ""}
          </span>
          <Link className="se-alpunto__lateral-enlace" to={rutaDePieza(p)}>
            {p.titulo}
          </Link>
        </li>
      ))}
    </ol>
    {/* Al pie y empujado abajo: con pocos episodios la caja iguala la altura del
        video, y el hueco lo ocupa la salida natural de esta lista. */}
    {enlace ? (
      <Link className="se-alpunto__lateral-todos" to={enlace.to}>
        {enlace.texto}
        <span aria-hidden="true"> →</span>
      </Link>
    ) : null}
  </aside>
);

ColumnaLateral.propTypes = {
  // `listaDePiezas` ya viene con `isRequired`.
  piezas: listaDePiezas(CAMPOS),
  titulo: PropTypes.string.isRequired,
  enlace: PropTypes.shape({ to: PropTypes.string.isRequired, texto: PropTypes.string.isRequired }),
};

/**
 * «Lo último»: la pieza principal en grande y, a su lado, la columna con lo reciente.
 *
 * Sin columna -- un día en que sólo hay una pieza -- la principal va sola y no ocupa
 * la página entera: una miniatura de 1200px es un cartel, no una tarjeta. En teléfono
 * se apilan, la columna debajo.
 */
export const AudiovisualHero = ({ principal, laterales, tituloLateral, enlaceLateral }) => (
  <div className={`se-alpunto__hero${laterales.length ? "" : " se-alpunto__hero--sola"}`}>
    <TarjetaAlPunto pieza={principal} variante="hero" />
    {laterales.length ? (
      <ColumnaLateral piezas={laterales} titulo={tituloLateral} enlace={enlaceLateral} />
    ) : null}
  </div>
);

AudiovisualHero.propTypes = {
  principal: piezaShape(CAMPOS).isRequired,
  laterales: listaDePiezas(CAMPOS),
  tituloLateral: PropTypes.string.isRequired,
  enlaceLateral: PropTypes.shape({ to: PropTypes.string.isRequired, texto: PropTypes.string.isRequired }),
};

/** La rejilla mixta: tres columnas, dos en tablet, una en teléfono. */
export const AudiovisualGrid = ({ items }) => (
  <div className="se-alpunto__grid">
    {items.map((p) => (
      <TarjetaAlPunto key={p.id} pieza={p} variante="rejilla" />
    ))}
  </div>
);

AudiovisualGrid.propTypes = {
  items: listaDePiezas(CAMPOS),
};
