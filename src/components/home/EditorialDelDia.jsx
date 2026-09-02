import { useState } from "react";
import { Link } from "react-router-dom";
import { temaPrincipal } from "../../lib/contentFilter";
import { formatDateEs } from "../../lib/date";
import { imagenAncho, imagenSrcSet, rutaDePieza } from "../../lib/pieza";
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
/** La columna de la imagen: todo el ancho en telefono, el 44% al lado del texto. */
const ANCHOS = [600, 900, 1200, 1600];
const SIZES = "(max-width: 859px) 100vw, 44vw";

export const EditorialDelDia = ({ pieza }) => {
  const [fallo, setFallo] = useState(false);
  if (!pieza) return null;

  const entradilla = pieza.entrada || pieza.resumen || "";
  // La fotografía cuando la hay; si no, el color del tema, el mismo tratamiento
  // que usan las tarjetas, para que la página se sostenga en los dos casos.
  // El color del tema cubre las dos cosas: la pieza sin foto y la foto que no llega.
  // Auditando produccion salio que hay imagenes alojadas fuera que contestan 429, y
  // el recuadro roto del navegador en el bloque de la editorial es lo peor que puede
  // salir en esa posicion.
  const hayFoto = Boolean(pieza.imagenUrl) && !fallo;
  const fondo = hayFoto ? null : fondoDeTema(temaPrincipal(pieza));

  return (
    <section className="se-section se-eddia" aria-label="Editorial del día">
      <div className="se-container">
        <Link to={rutaDePieza(pieza)} className="se-eddia__card">
          <div className="se-eddia__media">
            {hayFoto ? (
              <img
                className="se-eddia__img"
                src={imagenAncho(pieza.imagenUrl, 1200)}
                srcSet={imagenSrcSet(pieza.imagenUrl, ANCHOS, pieza.imagenAnchoOriginal) ?? undefined}
                sizes={SIZES}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setFallo(true)}
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
