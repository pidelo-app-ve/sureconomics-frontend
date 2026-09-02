import PropTypes from "prop-types";
import { useState } from "react";
import { temaPrincipal } from "../../lib/contentFilter";
import { imagenAncho, imagenSrcSet } from "../../lib/pieza";
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
 *
 * *El mismo relleno cubre la imagen que se cae.* Auditando produccion salio que dos
 * piezas apuntan a imagenes alojadas en Wikimedia y Wikimedia nos contesto 429: esas
 * fotos van a fallar de vez en cuando para el lector, y sin esto la tarjeta se queda
 * con el recuadro roto del navegador. El color del tema ya existia para las piezas
 * sin foto; sirve igual para la foto que no llega, y la maqueta no se mueve.
 */
/** Anchos que se le ofrecen al navegador. Cubren la caja de una tarjeta de 1x a 3x. */
const ANCHOS = [400, 640, 800, 1100, 1400];
/** Una columna en telefono, dos en tablet, tres en escritorio. */
const SIZES = "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 33vw";

export const CardMedia = ({ pieza, ancho, etiqueta }) => {
  const [fallo, setFallo] = useState(false);

  if (pieza.imagenUrl && !fallo) {
    return (
      <img
        className="se-artcard__img"
        src={imagenAncho(pieza.imagenUrl, ancho)}
        // El ancho original decide qué tallas existen en nuestro bucket. Para
        // Cloudinary se ignora: allí los anchos los calcula el servidor.
        srcSet={imagenSrcSet(pieza.imagenUrl, ANCHOS, pieza.imagenAnchoOriginal) ?? undefined}
        sizes={SIZES}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFallo(true)}
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
