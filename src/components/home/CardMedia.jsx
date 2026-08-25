import PropTypes from "prop-types";
import { temaPrincipal } from "../../lib/contentFilter";
import { imagenAncho } from "../../lib/pieza";
import { fondoDeTema } from "../../lib/tarjeta";
import { piezaShape } from "./piezaShape";

/**
 * The image area of a card, for every format.
 *
 * The one thing the four listing layouts genuinely share. Their bodies do not —
 * a noticia leads with its country, an informe says the download needs an
 * account, an editorial carries a lead paragraph — so only this is extracted, and
 * each grid keeps the copy that belongs to it.
 *
 * When the piece has no photograph the area is filled with a colour derived from
 * the topic. That matters more than it sounds: the newsroom is being asked for a
 * picture per note at a volume of roughly 350 a month, so pieces without one are
 * not an edge case -- the fallback is what most of the grid will look like on any
 * given week.
 *
 * The fill carries no text unless a caller asks for it, because only the caller
 * knows what its own card body already prints. Earlier versions wrote the place
 * and the topic here regardless, and the cards ended up saying the same thing
 * twice -- "PARAGUAY" over the colour and again under it, "Empresas y Negocios"
 * on the field and again as a pill in the footer.
 *
 * In practice only the news card asks: its body carries the place, so the topic on
 * the field adds something. Every other card already says both.
 */
export const CardMedia = ({ pieza, ancho, etiqueta }) => {
  if (pieza.imagenUrl) {
    return (
      <img
        className="se-artcard__img"
        src={imagenAncho(pieza.imagenUrl, ancho)}
        alt=""
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className="se-cardfill"
      style={{ background: fondoDeTema(temaPrincipal(pieza)) }}
      aria-hidden={etiqueta ? undefined : "true"}
    >
      {etiqueta ? <span className="se-cardfill__tema">{etiqueta}</span> : null}
    </div>
  );
};

CardMedia.propTypes = {
  pieza: piezaShape({ imagenUrl: PropTypes.string }).isRequired,
  ancho: PropTypes.number,
  etiqueta: PropTypes.string,
};

CardMedia.defaultProps = { ancho: 800, etiqueta: null };
