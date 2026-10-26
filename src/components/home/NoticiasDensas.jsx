import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { geoPrincipal, temaPrincipal } from "../../lib/contentFilter";
import { CardMedia } from "./CardMedia";
import { rutaDePieza } from "../../lib/pieza";
import { EspacioPublicitario, useHayAnuncio } from "../publicidad";
import { listaDePiezas } from "./piezaShape";
import { TituloDePieza } from "../content/TituloDePieza";

/**
 * Noticias en la portada: una lista densa a dos columnas con un carril al lado.
 *
 * La portada pintaba antes las noticias con la misma tarjeta con foto
 * que los artículos (`NewsList`), y la redacción lo señaló como lo más «de plantilla»
 * de la página: seis tarjetas iguales justo debajo de la apertura, que existe para
 * que una noticia mande. Aquí vuelve la lista de cable -- lugar, fecha, titular, una
 * línea de entradilla -- que es como un diario enseña la nota breve y lo que la
 * segunda maqueta pedía. `NewsList` sigue en los listados, donde una rejilla con
 * paginación sí tiene sentido.
 *
 * El carril de la derecha es el blanco que sobraba: lo que la portada quiera poner
 * ahí (`carril`, hoy «Lo más leído»). Sin nada que poner, la lista ocupa todo.
 *
 * La primera nota manda: con su foto grande, el titular y la entradilla. Las demás
 * llevan miniatura: solo texto se leía como un índice y la redacción pidió imagen.
 *
 * La publicidad va al final de la columna de noticias, a su ancho, como franja
 * (`lista`) y no como ficha: la ficha pintaba un logotipo pequeño sobre un recuadro
 * vacío y se veía como algo que no cargó.
 */
/** La línea «Lugar · fecha» de una nota. */
const Meta = ({ pieza }) => (
  <span className="se-noticias__meta">
    <span className="se-meta__lugar">{geoPrincipal(pieza)}</span>
    {pieza.fecha ? <span aria-hidden="true"> · </span> : null}
    {pieza.fecha}
  </span>
);
Meta.propTypes = { pieza: PropTypes.object.isRequired };

export const NoticiasDensas = ({ items, espacioDeAnuncio, carril = null, sinApertura = false }) => {
  const hay = useHayAnuncio(espacioDeAnuncio, "lista");
  const hayCarril = Boolean(carril);
  // `sinApertura`: las tandas de «Cargar más», que siguen la lista sin otra principal.
  const [lead, ...resto] = sinApertura ? [null, ...items] : items;
  if (!lead && !resto.length) return null;

  return (
    <div className={`se-noticias${hayCarril ? " se-noticias--con-carril" : ""}`}>
      <div className="se-noticias__principal">
        {/* La que manda: foto grande al lado del titular y la entradilla. */}
        {lead ? (
        <article className="se-noticias__lead">
          <Enlace to={rutaDePieza(lead)} className="se-noticias__foto" aria-hidden="true" tabIndex={-1}>
            <CardMedia pieza={lead} ancho={1100} etiqueta={temaPrincipal(lead)} sizes="(max-width: 899px) 92vw, 34vw" />
          </Enlace>
          <div className="se-noticias__lead-texto">
            <Meta pieza={lead} />
            <h3 className="se-noticias__titulo se-noticias__titulo--lead">
              <Enlace to={rutaDePieza(lead)}>
                <TituloDePieza pieza={lead} />
              </Enlace>
            </h3>
            {lead.resumen ? <p className="se-noticias__resumen">{lead.resumen}</p> : null}
          </div>
        </article>
        ) : null}

        {/* Las demás, a dos columnas, cada una con su miniatura: el lugar primero,
            que para este medio es lo primero por lo que un lector ordena. */}
        {resto.length ? (
          <ol className="se-noticias__lista">
            {resto.map((n) => (
              <li key={n.id} className="se-noticias__nota">
                <Enlace to={rutaDePieza(n)} className="se-noticias__mini" aria-hidden="true" tabIndex={-1}>
                  <CardMedia pieza={n} ancho={400} etiqueta={null} sizes="128px" />
                </Enlace>
                <div className="se-noticias__texto">
                  <Meta pieza={n} />
                  <h3 className="se-noticias__titulo">
                    <Enlace to={rutaDePieza(n)}>
                      <TituloDePieza pieza={n} />
                    </Enlace>
                  </h3>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {/* En la columna de noticias, a su ancho: el carril de al lado acompaña al bajar
            dentro del mismo bloque y ya no se mete debajo del anuncio. */}
        {hay ? (
          <div className="se-noticias__anuncio">
            <EspacioPublicitario espacio={espacioDeAnuncio} variante="lista" />
          </div>
        ) : null}
      </div>
      {hayCarril ? <aside className="se-noticias__carril">{carril}</aside> : null}
    </div>
  );
};

NoticiasDensas.propTypes = {
  /** Sin la principal: las tandas de «Cargar más» siguen la lista. */
  sinApertura: PropTypes.bool,
  items: listaDePiezas({ resumen: PropTypes.string, imagenUrl: PropTypes.string }),
  /** La clave del hueco de publicidad del final de la columna. */
  espacioDeAnuncio: PropTypes.string,
  /** Lo que va en el carril de la derecha («Lo más leído»); sin él, la lista ocupa todo. */
  carril: PropTypes.node,
};

export default NoticiasDensas;
