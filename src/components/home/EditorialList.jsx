import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { CardMedia } from "./CardMedia";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Editorial: the outlet's own position, with no personal byline.
 *
 * Cards now, like the rest of the site. The accent rule down the left survives the
 * change and still does the same job it did in the old list: it is what separates
 * the house's position from a signed article at a glance, without the reader
 * having to notice the absence of an author line.
 */
export const EditorialList = ({ items }) => (
  <div className="se-artgrid">
    {items.map((e) => (
      <article key={e.id} className="se-artcard se-artcard--editorial">
        <Link to={rutaDePieza(e)} className="se-artcard__media" aria-label={e.titulo}>
          <CardMedia pieza={e} />
        </Link>
        <div className="se-artcard__body">
          <span className="se-meta se-meta--category">
            Editorial · {temaPrincipal(e) ?? geoPrincipal(e)}
          </span>
          <h3 className="se-artcard__title">
            <Link to={rutaDePieza(e)}>{e.titulo}</Link>
          </h3>
          {e.entrada ? <p className="se-artcard__summary">{e.entrada}</p> : null}
          <div className="se-artcard__foot">
            <span className="se-tagpill">{geoPrincipal(e)}</span>
            <span className="se-artcard__by">{e.fecha}</span>
          </div>
        </div>
      </article>
    ))}
  </div>
);

EditorialList.propTypes = {
  items: listaDePiezas({
    entrada: PropTypes.string,
    imagenUrl: PropTypes.string,
  }),
};
