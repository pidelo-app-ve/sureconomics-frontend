import { Link } from "react-router-dom";
import { geoPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/**
 * Noticias: a list of headlines with their place and date, no image.
 *
 * Deliberately image-free. At the volume the brief states (350 a month),
 * requiring a picture per note isn't viable, and headline + country + date reads
 * perfectly well on its own.
 */
export const NewsList = ({ items }) => (
  <ul className="se-newslist">
    {items.map((n) => (
      <li key={n.id} className="se-newslist__row">
        <span className="se-newslist__geo">{geoPrincipal(n)}</span>
        <Link to={rutaDePieza(n)} className="se-newslist__title">
          {n.titulo}
        </Link>
        <time className="se-newslist__date">{n.fecha}</time>
      </li>
    ))}
  </ul>
);

NewsList.propTypes = { items: listaDePiezas() };
