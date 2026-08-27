import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { fondoDeTema } from "../../lib/tarjeta";
import { listaDePiezas } from "./piezaShape";

/** Entrevistas: video thumbnails with a play affordance and a duration. */
export const InterviewGrid = ({ items }) => (
  <div className="se-vidgrid">
    {items.map((v) => (
      <article key={v.id} className="se-vidcard">
        {/* El color del tema, como las demás tarjetas. Era un gris pálido fijo, así
            que las entrevistas eran lo único del sitio sin color propio. */}
        <Link
          to={rutaDePieza(v)}
          className="se-vidcard__thumb"
          aria-label={v.titulo}
          style={{ background: fondoDeTema(temaPrincipal(v)) }}
        >
          <span className="se-vidcard__play" aria-hidden="true" />
          <span className="se-vidcard__dur">{v.duracion}</span>
        </Link>
        <div className="se-vidcard__body">
          <span className="se-meta se-meta--category">{temaPrincipal(v)}</span>
          <h3 className="se-vidcard__title">
            <Link to={rutaDePieza(v)}>{v.titulo}</Link>
          </h3>
          <div className="se-vidcard__foot">
            <span className="se-tagpill">{geoPrincipal(v)}</span>
            <span className="se-vidcard__who">{v.entrevistado}</span>
          </div>
        </div>
      </article>
    ))}
  </div>
);

InterviewGrid.propTypes = {
  items: listaDePiezas({
    duracion: PropTypes.string.isRequired,
    entrevistado: PropTypes.string,
  }),
};
