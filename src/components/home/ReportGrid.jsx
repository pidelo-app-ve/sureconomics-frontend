import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Informes: presented as documents, with the producing unit credited.
 *
 * The card says the download asks for registration, but the report's own page is
 * public and complete — what's gated is the file, not the page.
 */
export const ReportGrid = ({ items }) => (
  <div className="se-docgrid">
    {items.map((r) => (
      <article key={r.id} className="se-doccard">
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
      </article>
    ))}
  </div>
);

ReportGrid.propTypes = {
  items: listaDePiezas({
    unidad: PropTypes.string.isRequired,
    resumen: PropTypes.string,
  }),
};
