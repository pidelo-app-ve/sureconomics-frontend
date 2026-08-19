import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Editorial: the outlet's own position, with no personal byline.
 *
 * The rule on the left is what separates it at a glance from a signed article —
 * the brief asks for a treatment that makes the difference obvious without the
 * reader having to look for an author line that isn't there.
 */
export const EditorialList = ({ items }) => (
  <div className="se-edlist">
    {items.map((e) => (
      <article key={e.id} className="se-edrow">
        <span className="se-edrow__kicker">
          Editorial · {temaPrincipal(e)} · {geoPrincipal(e)}
        </span>
        <h3 className="se-edrow__title">
          <Link to={rutaDePieza(e)}>{e.titulo}</Link>
        </h3>
        <p className="se-edrow__lead">{e.entrada}</p>
        <time className="se-edrow__date">{e.fecha}</time>
      </article>
    ))}
  </div>
);

EditorialList.propTypes = { items: listaDePiezas({ entrada: PropTypes.string }) };
