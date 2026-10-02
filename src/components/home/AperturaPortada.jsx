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
 * **Cuál manda.** Desde octubre de 2026 la redacción puede fijarla a mano, y de
 * cualquier formato: «Abrir la portada con esta pieza», en el editor, pone
 * `destacada_hasta` y mientras no venza esa pieza es la principal. Sin nada fijado --
 * o vencido -- se elige sola entre las noticias: la más reciente, salvo que entre las
 * tres últimas haya una con fotografía y ella no la tenga; una apertura con imagen se
 * lee como apertura, y un relleno de color, no.
 *
 * La columna es siempre de noticias, fijada o no: a la pieza que manda la acompañan
 * los titulares del día, no otras entrevistas o informes.
 *
 * La columna es sólo texto a propósito: al lado de una imagen grande, tres miniaturas
 * compiten con ella y no se lee ninguna. Lo que se compara ahí son titulares.
 */

/** Cuántas noticias acompañan a la principal en la columna. */
export const EN_LA_COLUMNA = 3;

/**
 * Si una pieza está fijada **ahora**. `enPortada` lo dice el servidor; la fecha se
 * vuelve a mirar aquí porque una lista servida desde caché puede traer un «sí» de
 * hace horas, y la portada tiene que soltar la pieza sola al vencer, sin esperar a
 * que alguien recargue con suerte.
 */
const fijadaAhora = (p, ahora) =>
  Boolean(p?.enPortada) && p.destacadaHasta instanceof Date && p.destacadaHasta.getTime() > ahora;

const msDe = (p) => Date.parse(p?.fechaIso ?? "") || 0;

/**
 * La principal y las de la columna.
 *
 * `piezas` es la lista entera, de todos los formatos y ya ordenada por fecha: ahí se
 * busca la fijada. `noticias` son las que van a la columna; si no se pasan, se sacan
 * de `piezas`. `fijada` dice si la principal la eligió la redacción o la regla.
 */
export const elegirApertura = (piezas, noticias = null, ahora = Date.now()) => {
  const todas = piezas ?? [];
  const delDia = noticias ?? todas.filter((p) => p.formatoApi === "noticia");

  // Si hay más de una fijada -- el servidor limpia las demás al fijar una, pero una
  // lista cosida de varias páginas puede traer restos -- manda la más reciente.
  const fijada = todas
    .filter((p) => fijadaAhora(p, ahora))
    .sort((a, b) => msDe(b) - msDe(a))[0];

  if (fijada) {
    const secundarias = delDia.filter((n) => n.id !== fijada.id).slice(0, EN_LA_COLUMNA);
    return { principal: fijada, secundarias, fijada: true };
  }

  if (!delDia.length) return { principal: null, secundarias: [], fijada: false };
  const conFoto = delDia.slice(0, 3).find((n) => n.imagenUrl);
  const principal = delDia[0].imagenUrl ? delDia[0] : conFoto ?? delDia[0];
  const secundarias = delDia.filter((n) => n.id !== principal.id).slice(0, EN_LA_COLUMNA);
  return { principal, secundarias, fijada: false };
};

const CAMPOS = {
  imagenUrl: PropTypes.string,
  resumen: PropTypes.string,
  educativo: PropTypes.bool,
};

export const AperturaPortada = ({ principal, secundarias, fijada = false }) => {
  if (!principal) return null;
  const lugar = geoPrincipal(principal);
  return (
    <section className="se-section se-apertura" aria-labelledby="apertura-titulo">
      <div className="se-container">
        {/* Fijada a mano no es «lo más reciente»: puede ser un informe de hace una
            semana, y el encabezado oculto tiene que decir la verdad al lector de
            pantalla. */}
        <h2 id="apertura-titulo" className="se-sr-only">
          {fijada ? "Apertura" : "Lo más reciente"}
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
  fijada: PropTypes.bool,
};

export default AperturaPortada;
