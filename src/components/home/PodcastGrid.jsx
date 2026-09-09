import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { CardMedia } from "./CardMedia";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Podcast: charlas cortas para escuchar. La misma forma de tarjeta que Editorial --
 * imagen, título, resumen, pie con tema y fecha -- porque no hay un fotograma que
 * mostrar (no es vídeo) ni un dato propio como el de Informe (la unidad) o Entrevista
 * (a quién se entrevistó). Lo único distinto de una tarjeta cualquiera es la
 * duración, y por eso va en el cintillo: es lo que decide si alguien la escucha
 * ahora o la deja para después.
 */
export const PodcastGrid = ({ items }) => (
  <div className="se-artgrid">
    {items.map((p) => (
      <article key={p.id} className="se-artcard">
        <Link to={rutaDePieza(p)} className="se-artcard__media" aria-label={p.titulo}>
          <CardMedia pieza={p} />
        </Link>
        <div className="se-artcard__body">
          <span className="se-meta se-meta--category">
            Podcast{p.duracion ? ` · ${p.duracion}` : ""}
          </span>
          <h3 className="se-artcard__title">
            <Link to={rutaDePieza(p)}>{p.titulo}</Link>
          </h3>
          {p.resumen ? <p className="se-artcard__summary">{p.resumen}</p> : null}
          <div className="se-artcard__foot">
            <span className="se-tagpill">{temaPrincipal(p) ?? geoPrincipal(p)}</span>
            <span className="se-artcard__by">{p.fecha}</span>
          </div>
        </div>
      </article>
    ))}
  </div>
);

PodcastGrid.propTypes = {
  items: listaDePiezas({
    resumen: PropTypes.string,
    duracion: PropTypes.string,
  }),
};
