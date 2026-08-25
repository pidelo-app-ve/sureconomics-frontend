import { Link } from "react-router-dom";
import { temaPrincipal } from "../../lib/contentFilter";
import { imagenAncho, rutaDePieza } from "../../lib/pieza";
import { fondoDeTema } from "../../lib/tarjeta";
import { piezaShape } from "./piezaShape";

/**
 * The most recent editorial, given its own block high on the landing page.
 *
 * It is the one piece on the page that speaks *for* the outlet instead of
 * reporting, and nothing on a listing said so -- an editorial sat in a section
 * below the fold, in a card the same size as a note about somebody else's news.
 * The accent rule and the scale are what say it before a word is read.
 *
 * Renders nothing when there is no editorial. A block announcing the house's
 * position with an empty frame in it is worse than no block: it advertises that
 * the outlet has nothing to say.
 */
export const EditorialDelDia = ({ pieza }) => {
  if (!pieza) return null;

  const entradilla = pieza.entrada || pieza.resumen || "";
  // The photograph when there is one; otherwise the topic's colour, the same
  // treatment the cards use, so the page holds together either way.
  const fondo = pieza.imagenUrl ? null : fondoDeTema(temaPrincipal(pieza));

  return (
    <section className="se-section se-eddia" aria-label="Editorial del día">
      <div className="se-container">
        <Link
          to={rutaDePieza(pieza)}
          className="se-eddia__card"
          style={fondo ? { background: fondo } : undefined}
        >
          {pieza.imagenUrl ? (
            <img
              className="se-eddia__img"
              src={imagenAncho(pieza.imagenUrl, 1600)}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div className="se-eddia__body">
            <span className="se-eddia__kicker">Editorial del día</span>
            <h2 className="se-eddia__title">{pieza.titulo}</h2>
            {entradilla ? <p className="se-eddia__lead">{entradilla}</p> : null}
            <span className="se-eddia__cta">Leer la posición del medio →</span>
          </div>
        </Link>
      </div>
    </section>
  );
};

EditorialDelDia.propTypes = { pieza: piezaShape() };

EditorialDelDia.defaultProps = { pieza: null };
