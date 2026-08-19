import { Link } from "react-router-dom";
import { geoPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "../home/piezaShape";

/**
 * "También te puede interesar": pieces sharing a topic or a place.
 *
 * Rendered as headline rows whatever the format of each item — the module is a
 * list of places to go next, not a showcase, so five different card shapes here
 * would fight the piece the reader is already in.
 */
export const RelatedPieces = ({ items }) => {
  if (!items.length) return null;

  return (
    <section className="se-piece__related" aria-labelledby="related-title">
      <h2 id="related-title" className="se-piece__related-title">
        También te puede interesar
      </h2>
      <ul className="se-newslist">
        {items.map((p) => (
          <li key={p.slug} className="se-newslist__row">
            <span className="se-newslist__geo">{geoPrincipal(p)}</span>
            <Link to={rutaDePieza(p)} className="se-newslist__title">
              {p.titulo}
            </Link>
            <time className="se-newslist__date">{p.fecha}</time>
          </li>
        ))}
      </ul>
    </section>
  );
};

RelatedPieces.propTypes = { items: listaDePiezas() };
