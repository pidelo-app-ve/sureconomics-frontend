import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { CardMedia } from "./CardMedia";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Noticias: image cards, like every other format now.
 *
 * This was a dense text list -- place, headline, date -- and that was deliberate:
 * at the stated volume of some 350 notes a month a photograph per note is real
 * work, and a wire list scans faster than a grid. Asking for cards everywhere is
 * an editorial call and it was made.
 *
 * What survives from the old reasoning is the part that still bites: most notes
 * will arrive without a picture for a while, so the card has to look finished
 * without one. That is what `CardMedia` is for.
 *
 * The grid and card classes are the ones the artículo grid already uses. Sharing
 * them rather than cloning the rules is the point; the name reads as
 * article-specific and no longer is.
 */
export const NewsList = ({ items }) => (
  <div className="se-artgrid">
    {items.map((n) => (
      <article key={n.id} className="se-artcard">
        <Link to={rutaDePieza(n)} className="se-artcard__media" aria-label={n.titulo}>
          {/* The body leads with the place, so the field carries the topic --
              the one card whose copy is sparse enough to want it. */}
          <CardMedia pieza={n} etiqueta={temaPrincipal(n)} />
        </Link>
        <div className="se-artcard__body">
          {/* The place leads a note, the way the old list had it in the left
              column: for this outlet "where" is the first thing a reader sorts by. */}
          <span className="se-meta se-meta--category">{geoPrincipal(n)}</span>
          <h3 className="se-artcard__title">
            <Link to={rutaDePieza(n)}>{n.titulo}</Link>
          </h3>
          {n.resumen ? <p className="se-artcard__summary">{n.resumen}</p> : null}
          <div className="se-artcard__foot">
            <span className="se-artcard__by">{n.fecha}</span>
          </div>
        </div>
      </article>
    ))}
  </div>
);

NewsList.propTypes = {
  items: listaDePiezas({
    resumen: PropTypes.string,
    imagenUrl: PropTypes.string,
  }),
};
