import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { CardMedia } from "./CardMedia";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Informes: presented as documents, with the producing unit credited.
 *
 * The card says the download asks for registration, but the report's own page is
 * public and complete -- what's gated is the file, not the page.
 *
 * The image area was added when the site moved to cards everywhere. It keeps this
 * card's own footer, which carries the unit: a report is credited to a desk of the
 * group rather than to a person, and that is the one thing its card must say.
 */
export const ReportGrid = ({ items }) => (
  <div className="se-docgrid">
    {items.map((r) => (
      <article key={r.id} className="se-doccard">
        <Link to={rutaDePieza(r)} className="se-doccard__media" aria-label={r.titulo}>
          <CardMedia pieza={r} />
        </Link>
        <div className="se-doccard__body">
          <span className="se-doccard__kicker">Informe · requiere registro</span>
          <h3 className="se-doccard__title">
            <Link to={rutaDePieza(r)}>{r.titulo}</Link>
          </h3>
          <p className="se-doccard__summary">{r.resumen}</p>
          <div className="se-doccard__foot">
            <span className="se-tagpill">{temaPrincipal(r)}</span>
            <span className="se-tagpill">{geoPrincipal(r)}</span>
            <span className="se-doccard__unit">Investigación de {r.unidad}</span>
          </div>
        </div>
      </article>
    ))}
  </div>
);

ReportGrid.propTypes = {
  items: listaDePiezas({
    unidad: PropTypes.string.isRequired,
    resumen: PropTypes.string,
    imagenUrl: PropTypes.string,
  }),
};
