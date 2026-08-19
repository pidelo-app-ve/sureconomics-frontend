import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { PlaceholderImage } from "../blog";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { listaDePiezas } from "./piezaShape";

/** Artículos: image cards with a byline. Unlike Editorial, these are signed. */
export const ArticleCardGrid = ({ items }) => (
  <div className="se-artgrid">
    {items.map((a) => (
      <article key={a.id} className="se-artcard">
        <Link to={rutaDePieza(a)} className="se-artcard__media" aria-label={a.titulo}>
          {/* The real image when the piece has one. The gradient is a treatment for
              a piece without a photograph, not the default for every piece: this
              card showed the placeholder unconditionally, so every article in
              production came up as a grey box with a word in it. */}
          {a.imagenUrl ? (
            <img
              className="se-artcard__img"
              src={a.imagenUrl}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <PlaceholderImage variant={a.imagen} />
          )}
        </Link>
        <div className="se-artcard__body">
          <span className="se-meta se-meta--category">{temaPrincipal(a)}</span>
          <h3 className="se-artcard__title">
            <Link to={rutaDePieza(a)}>{a.titulo}</Link>
          </h3>
          {a.resumen ? <p className="se-artcard__summary">{a.resumen}</p> : null}
          <div className="se-artcard__foot">
            <span className="se-tagpill">{geoPrincipal(a)}</span>
            <span className="se-artcard__by">
              {a.fecha} · Por {a.autor}
            </span>
          </div>
        </div>
      </article>
    ))}
  </div>
);

ArticleCardGrid.propTypes = {
  items: listaDePiezas({
    autor: PropTypes.string.isRequired,
    resumen: PropTypes.string,
    imagen: PropTypes.oneOf(["chart", "building", "growth"]),
    imagenUrl: PropTypes.string,
  }),
};
