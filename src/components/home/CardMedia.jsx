import PropTypes from "prop-types";
import { useState } from "react";
import { temaPrincipal } from "../../lib/contentFilter";
import { estiloDeFoto, imagenAncho, imagenSrcSet } from "../../lib/pieza";
import { fondoDeTema } from "../../lib/tarjeta";
import { SelloEducativo } from "./SelloEducativo";
import { IconoPlay } from "../canal/VistaPrevia";
import { duracionReloj } from "../../lib/youtube";
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
 *
 * *La foto llena siempre la caja.* La caja de todas las rejillas es 16:9 y recorta con
 * `cover`. Hubo un tiempo en que la foto que no era 16:9 se mostraba entera sobre ella
 * misma desenfocada, para no cortar cabezas; dejaba dos bandas borrosas a los lados y
 * Ramón no las quiere (10-nov-2026). Para eso está el encuadre: el editor elige qué
 * parte de la foto se ve (`EncuadreDeFoto`, `estiloDeFoto`) y la tarjeta recorta por
 * ahí. Sin encuadre, por el centro.
 */
/** Anchos que se le ofrecen al navegador. Cubren la caja de una tarjeta de 1x a 3x. */
export const ANCHOS = [400, 640, 800, 1100, 1400];
/** Una columna en telefono, dos en tablet, tres en escritorio. */
const SIZES = "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 33vw";

/**
 * Que la pieza tiene video: ▶ y su duración («3:08») en la esquina de abajo a la derecha,
 * como un reproductor. Arriba a la izquierda va el sello educativo y abajo a la izquierda
 * el tema del relleno: las tres esquinas no se pisan. Solo se ve; quien lee con lector de
 * pantalla ya oye el formato en la tarjeta.
 */
const MarcaDeVideo = ({ pieza }) =>
  pieza.videoUrl ? (
    <span className="se-marca-video" aria-hidden="true">
      <IconoPlay tamano={20} />
      {duracionReloj(pieza.duracionSegundos)}
    </span>
  ) : null;

MarcaDeVideo.propTypes = { pieza: PropTypes.object.isRequired };

export const CardMedia = ({ pieza, ancho, etiqueta, sizes }) => {
  const [fallo, setFallo] = useState(false);

  // El sello va aquí y no en cada rejilla porque cinco de las seis pintan su imagen
  // a través de este componente. La que falta es la de entrevistas, que tiene su
  // propia miniatura con el botón de reproducir, y lo pinta por su cuenta.
  //
  // Sale como hermano de la imagen, no envuelto con ella: el contenedor de la
  // tarjeta ya es la caja 16/9 que recorta, y meter un envoltorio de por medio
  // habría movido la maqueta de las cinco rejillas.
  if (pieza.imagenUrl && !fallo) {
    return (
      <>
        <img
          className="se-artcard__img"
          src={imagenAncho(pieza.imagenUrl, ancho)}
          style={estiloDeFoto(pieza)}
          // El ancho original decide qué tallas existen en nuestro bucket. Para
          // Cloudinary se ignora: allí los anchos los calcula el servidor.
          srcSet={imagenSrcSet(pieza.imagenUrl, ANCHOS, pieza.imagenAnchoOriginal) ?? undefined}
          sizes={sizes}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFallo(true)}
        />
        <SelloEducativo pieza={pieza} />
        <MarcaDeVideo pieza={pieza} />
      </>
    );
  }

  return (
    <>
      <div
        className="se-cardfill"
        style={{ background: fondoDeTema(temaPrincipal(pieza)) }}
        aria-hidden={etiqueta ? undefined : "true"}
      >
        {etiqueta ? <span className="se-cardfill__tema">{etiqueta}</span> : null}
      </div>
      {/* Fuera del relleno, que puede llevar `aria-hidden`: el sello sí se anuncia. */}
      <SelloEducativo pieza={pieza} />
      <MarcaDeVideo pieza={pieza} />
    </>
  );
};

CardMedia.propTypes = {
  pieza: piezaShape({ imagenUrl: PropTypes.string, educativo: PropTypes.bool }).isRequired,
  ancho: PropTypes.number,
  etiqueta: PropTypes.string,
  /** El `sizes` de la imagen: el de una tarjeta de rejilla salvo que quien llama ocupe otra cosa. */
  sizes: PropTypes.string,
};

CardMedia.defaultProps = { ancho: 800, etiqueta: null, sizes: SIZES };
