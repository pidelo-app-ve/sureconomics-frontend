import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { CardMedia } from "./CardMedia";
import { listaDePiezas, piezaShape } from "./piezaShape";

/**
 * La apertura de la portada: la noticia principal en grande y, a su lado, las
 * siguientes en una columna de titulares.
 *
 * Sin esto la portada no tenía jerarquía: debajo del filtro venía una rejilla de seis
 * tarjetas iguales, y en el teléfono no había un solo titular en la primera pantalla.
 * Un diario se reconoce por eso, porque una noticia manda.
 *
 * **Cuál manda.** El modelo no tiene una marca de «destacada», así que se elige sola:
 * la más reciente, salvo que entre las tres últimas haya una con fotografía y ella no
 * la tenga -- una apertura con imagen se lee como apertura; un relleno de color, no.
 * El día que la redacción quiera elegirla a mano, esto es lo que cambia.
 *
 * La columna es sólo texto a propósito: al lado de una imagen grande, tres miniaturas
 * compiten con ella y no se lee ninguna. Lo que se compara ahí son titulares.
 */

/** Cuántas noticias acompañan a la principal en la columna. */
export const EN_LA_COLUMNA = 3;

/** La principal y las de la columna, de una lista de noticias ya ordenada por fecha. */
export const elegirApertura = (noticias) => {
  if (!noticias.length) return { principal: null, secundarias: [] };
  const conFoto = noticias.slice(0, 3).find((n) => n.imagenUrl);
  const principal = noticias[0].imagenUrl ? noticias[0] : conFoto ?? noticias[0];
  const secundarias = noticias.filter((n) => n.id !== principal.id).slice(0, EN_LA_COLUMNA);
  return { principal, secundarias };
};

const CAMPOS = {
  imagenUrl: PropTypes.string,
  resumen: PropTypes.string,
  educativo: PropTypes.bool,
};

export const AperturaPortada = ({ principal, secundarias }) => {
  if (!principal) return null;
  const lugar = geoPrincipal(principal);
  return (
    <section className="se-section se-apertura" aria-labelledby="apertura-titulo">
      <div className="se-container">
        <h2 id="apertura-titulo" className="se-sr-only">
          Lo más reciente
        </h2>
        <div className={`se-apertura__rejilla${secundarias.length ? "" : " se-apertura__rejilla--sola"}`}>
          <article className="se-apertura__principal">
            <Link
              to={rutaDePieza(principal)}
              className="se-apertura__media"
              aria-hidden="true"
              tabIndex={-1}
            >
              <CardMedia pieza={principal} ancho={1400} etiqueta={temaPrincipal(principal)} />
            </Link>
            <div className="se-apertura__cuerpo">
              <span className="se-apertura__meta">
                {lugar}
                {principal.fecha ? <span aria-hidden="true"> · </span> : null}
                {principal.fecha}
              </span>
              <h3 className="se-apertura__titulo">
                <Link to={rutaDePieza(principal)}>{principal.titulo}</Link>
              </h3>
              {principal.resumen ? (
                <p className="se-apertura__resumen">{principal.resumen}</p>
              ) : null}
            </div>
          </article>

          {secundarias.length ? (
            <ol className="se-apertura__columna" aria-label="Otras noticias recientes">
              {secundarias.map((n) => (
                <li key={n.id} className="se-apertura__item">
                  <span className="se-apertura__meta">
                    {geoPrincipal(n)}
                    {n.fecha ? <span aria-hidden="true"> · </span> : null}
                    {n.fecha}
                  </span>
                  <Link className="se-apertura__enlace" to={rutaDePieza(n)}>
                    {n.titulo}
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </section>
  );
};

AperturaPortada.propTypes = {
  principal: piezaShape(CAMPOS),
  secundarias: listaDePiezas(CAMPOS),
};

export default AperturaPortada;
