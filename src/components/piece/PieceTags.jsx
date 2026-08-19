import PropTypes from "prop-types";
import { Link } from "react-router-dom";

/**
 * The piece's own topic and place tags, as links into the explorer.
 *
 * The brief calls these the reader's side doors, and the reasoning is worth
 * keeping in view: most readers arrive from a search or a shared link onto a
 * single note, never passing through the homepage. Without these the piece is a
 * dead end.
 *
 * Every tag is shown here — a listing card only has room for the principal one.
 */
export const PieceTags = ({ temas, geos }) => (
  <div className="se-piece__tags">
    <span className="se-piece__tags-label">Seguir leyendo sobre</span>
    <div className="se-piece__tags-list">
      {temas.map((tema) => (
        <Link
          key={`t-${tema}`}
          to={`/explorar?tema=${encodeURIComponent(tema)}`}
          className="se-piece__tag"
        >
          {tema}
        </Link>
      ))}
      {geos.map((geo) => (
        <Link
          key={`g-${geo}`}
          to={`/explorar?donde=${encodeURIComponent(geo)}`}
          className="se-piece__tag se-piece__tag--geo"
        >
          {geo}
        </Link>
      ))}
    </div>
  </div>
);

PieceTags.propTypes = {
  temas: PropTypes.arrayOf(PropTypes.string).isRequired,
  geos: PropTypes.arrayOf(PropTypes.string).isRequired,
};
