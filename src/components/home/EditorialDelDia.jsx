import { Link } from "react-router-dom";
import { temaPrincipal } from "../../lib/contentFilter";
import { formatDateEs } from "../../lib/date";
import { imagenAncho, rutaDePieza } from "../../lib/pieza";
import { fondoDeTema } from "../../lib/tarjeta";
import { piezaShape } from "./piezaShape";

/**
 * La editorial más reciente, en su propio bloque alto en la portada.
 *
 * Es la única pieza de la página que habla *por* el medio en vez de informar, y
 * ninguna lista lo decía: una editorial quedaba en una sección más abajo, en una
 * tarjeta del mismo tamaño que una nota sobre las noticias de otro. El filo verde
 * y la escala son lo que lo dicen antes de leer una palabra.
 *
 * Con imagen visible, que es lo que se pidió. Antes la fotografía estaba ahí y no
 * se veía nunca: iba en `position: absolute; inset: 0` y el cuerpo le pintaba
 * encima un blanco opaco. Ahora la imagen tiene su propia columna -- al lado del
 * texto en pantalla ancha, encima en el teléfono -- y el papel blanco con el filo
 * verde se queda tal cual, que así se pidió en su momento.
 *
 * No pinta nada cuando no hay editorial. Un bloque que anuncia la posición de la
 * casa con un marco vacío dentro es peor que no tener bloque: anuncia que el medio
 * no tiene nada que decir.
 */
export const EditorialDelDia = ({ pieza }) => {
  if (!pieza) return null;

  const entradilla = pieza.entrada || pieza.resumen || "";
  // La fotografía cuando la hay; si no, el color del tema, el mismo tratamiento
  // que usan las tarjetas, para que la página se sostenga en los dos casos.
  const fondo = pieza.imagenUrl ? null : fondoDeTema(temaPrincipal(pieza));

  return (
    <section className="se-section se-eddia" aria-label="Editorial del día">
      <div className="se-container">
        <Link to={rutaDePieza(pieza)} className="se-eddia__card">
          <div className="se-eddia__media">
            {pieza.imagenUrl ? (
              <img
                className="se-eddia__img"
                src={imagenAncho(pieza.imagenUrl, 1200)}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="se-eddia__fill"
                style={{ background: fondo }}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="se-eddia__body">
            <span className="se-eddia__kicker">Editorial del día</span>
            <h2 className="se-eddia__title">{pieza.titulo}</h2>
            {entradilla ? <p className="se-eddia__lead">{entradilla}</p> : null}
            {pieza.fecha ? (
              <time className="se-eddia__fecha" dateTime={pieza.fecha}>
                {formatDateEs(pieza.fecha)}
              </time>
            ) : null}
            <span className="se-eddia__cta">Leer la posición del medio →</span>
          </div>
        </Link>
      </div>
    </section>
  );
};

EditorialDelDia.propTypes = { pieza: piezaShape() };

EditorialDelDia.defaultProps = { pieza: null };
