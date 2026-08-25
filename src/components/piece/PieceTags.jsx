import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { conAncestros } from "../../lib/contentFilter";
import { useTaxonomy } from "../../hooks/useTaxonomy";

/**
 * The piece's own topic and place tags, as links into the explorer.
 *
 * The brief calls these the reader's side doors, and the reasoning is worth
 * keeping in view: most readers arrive from a search or a shared link onto a
 * single note, never passing through the homepage. Without these the piece is a
 * dead end.
 *
 * Every tag is shown here — a listing card only has room for the principal one.
 *
 * Places are shown with their ancestors: a piece tagged Venezuela reads
 * "Venezuela · Andina · Las Américas". Those are derived from the tree, not stored
 * on the piece — the filter already treats them as included, so writing them in
 * would be the same fact twice and would spend the piece's limited tag slots.
 */
export const PieceTags = ({ temas, geos }) => {
  const { geoTop, ancestros } = useTaxonomy();
  const lugares = conAncestros(geos, { geoTop, ancestros });

  return (
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
        {lugares.map(({ nombre, propio }) => (
          <Link
            key={`g-${nombre}`}
            to={`/explorar?donde=${encodeURIComponent(nombre)}`}
            className={`se-piece__tag se-piece__tag--geo${
              propio ? "" : " se-piece__tag--heredado"
            }`}
            title={propio ? undefined : `Incluye todo ${nombre}`}
          >
            {nombre}
          </Link>
        ))}
      </div>
    </div>
  );
};

PieceTags.propTypes = {
  temas: PropTypes.arrayOf(PropTypes.string).isRequired,
  geos: PropTypes.arrayOf(PropTypes.string).isRequired,
};
