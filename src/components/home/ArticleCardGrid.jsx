import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { CardMedia } from "./CardMedia";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { conAnuncio } from "./conAnuncio";
import {
  EspacioPublicitario,
  useHayAnuncio,
} from "../publicidad";
import { listaDePiezas } from "./piezaShape";

/** Artículos: image cards with a byline. Unlike Editorial, these are signed. */
export const ArticleCardGrid = ({ items, espacioDeAnuncio }) => {
  // Se pregunta **antes** de montar la rejilla: el anuncio le quita el sitio a
  // una pieza, así que si no hay campaña que encaje la rejilla tiene que saberlo
  // para no descontarla igual y quedarse corta.
  const hay = useHayAnuncio(espacioDeAnuncio, "tarjeta");
  const anuncio = hay ? (
    <EspacioPublicitario espacio={espacioDeAnuncio} variante="tarjeta" />
  ) : null;

  return (
  <div className="se-artgrid">
    {/* Intercalado en el centro de la rejilla, no al final. Ver `conAnuncio`. */}
    {conAnuncio(
      items.map((a) => (
        <article key={a.id} className="se-artcard">
          <Link to={rutaDePieza(a)} className="se-artcard__media" aria-label={a.titulo}>
            <CardMedia pieza={a} />
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
                {a.fecha}
                {a.autor ? ` · Por ${a.autor}` : ""}
              </span>
            </div>
          </div>
        </article>
      )),
      anuncio,
    )}
    </div>
  );
};

ArticleCardGrid.propTypes = {
  /** La clave del hueco. La rejilla monta el anuncio ella misma: necesita saber si
      lo habra antes de decidir cuantas piezas caben. */
  espacioDeAnuncio: PropTypes.string,
  items: listaDePiezas({
    // Optional: a piece with no byline set shows none rather than the name of
            // whoever's account uploaded it.
    autor: PropTypes.string,
    resumen: PropTypes.string,
    imagenUrl: PropTypes.string,
  }),
};
