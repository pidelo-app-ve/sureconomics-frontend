import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { CardMedia } from "./CardMedia";
import { geoPrincipal } from "../../lib/contentFilter";
import { FORMATO_META, rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Todo el contenido educativo en una sola rejilla, sin separar por formato.
 *
 * Existe porque la primera versión de la sección agrupaba por formato con los mismos
 * bloques que la portada, y el resultado era la portada otra vez: seis encabezados con
 * una o dos piezas debajo cada uno. Eso enterraba el punto de la página -- aquí lo que
 * reúne a las piezas es ser educativas, y el formato es un dato de cada una, no el
 * criterio de la sección.
 *
 * De ahí que el gorro de la tarjeta diga el formato y no el tema, que es lo único que
 * cambia respecto de las demás rejillas. Sin eso, un lector no sabría que la tercera
 * tarjeta es una entrevista y la cuarta un informe: sería una lista plana de títulos.
 *
 * Reutiliza las clases de `.se-artcard`, que ya sirven para cualquier pieza con
 * imagen; no hay CSS propio que mantener.
 */
export const EducativoGrid = ({ items }) => (
  <div className="se-artgrid">
    {items.map((p) => (
      <article key={p.id} className="se-artcard">
        <Link to={rutaDePieza(p)} className="se-artcard__media" aria-label={p.titulo}>
          <CardMedia pieza={p} />
        </Link>
        <div className="se-artcard__body">
          <span className="se-meta se-meta--category">
            {FORMATO_META[p.formatoApi]?.plural ?? p.formato}
          </span>
          <h3 className="se-artcard__title">
            <Link to={rutaDePieza(p)}>{p.titulo}</Link>
          </h3>
          {p.resumen ? <p className="se-artcard__summary">{p.resumen}</p> : null}
          <div className="se-artcard__foot">
            <span className="se-tagpill">{geoPrincipal(p)}</span>
            <span className="se-artcard__by">
              {p.fecha}
              {/* La duración de un video o un audio, cuando la pieza la tiene: en una
                  lista mezclada es lo que dice de entrada si esto se lee o se ve. */}
              {p.duracion ? ` · ${p.duracion}` : ""}
            </span>
          </div>
        </div>
      </article>
    ))}
  </div>
);

EducativoGrid.propTypes = {
  items: listaDePiezas({
    resumen: PropTypes.string,
    imagenUrl: PropTypes.string,
    duracion: PropTypes.string,
    educativo: PropTypes.bool,
  }),
};
