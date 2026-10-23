import PropTypes from "prop-types";
import { Enlace } from "../Enlace";
import { geoPrincipal } from "../../lib/contentFilter";
import { rutaDePieza } from "../../lib/pieza";
import { EspacioPublicitario, useHayAnuncio } from "../publicidad";
import { listaDePiezas } from "./piezaShape";
import { TituloDePieza } from "../content/TituloDePieza";

/**
 * Noticias en la portada: una lista densa a dos columnas con un carril al lado.
 *
 * Hasta el 23-oct-2026 la portada pintaba las noticias con la misma tarjeta con foto
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
 * La publicidad va DEBAJO de la lista, como franja ancha (`lista`), no como ficha en
 * el carril: la ficha pinta un logotipo pequeño sobre un recuadro vacío, y al lado de
 * una lista de titulares se veía como algo que no cargó. La franja lleva el arte
 * completo del anunciante, que es lo que mejor se ve en todo el sitio.
 */
export const NoticiasDensas = ({ items, espacioDeAnuncio, carril = null }) => {
  const hay = useHayAnuncio(espacioDeAnuncio, "lista");
  const hayCarril = Boolean(carril);

  return (
    <div className={`se-noticias${hayCarril ? " se-noticias--con-carril" : ""}`}>
      <div className="se-noticias__principal">
      <ol className="se-noticias__lista">
        {items.map((n) => (
          <li key={n.id} className="se-noticias__nota">
            {/* El lugar primero: para este medio «dónde» es lo primero por lo que
                un lector ordena. Igual que en la columna de la apertura. */}
            <span className="se-noticias__meta">
              <span className="se-meta__lugar">{geoPrincipal(n)}</span>
              {n.fecha ? <span aria-hidden="true"> · </span> : null}
              {n.fecha}
            </span>
            <h3 className="se-noticias__titulo">
              <Enlace to={rutaDePieza(n)}>
                <TituloDePieza pieza={n} />
              </Enlace>
            </h3>
            {n.resumen ? <p className="se-noticias__resumen">{n.resumen}</p> : null}
          </li>
        ))}
      </ol>
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
  items: listaDePiezas({ resumen: PropTypes.string }),
  /** La clave del hueco de publicidad del carril. */
  espacioDeAnuncio: PropTypes.string,
  /** Lo que va en el carril encima del anuncio. */
  carril: PropTypes.node,
};

export default NoticiasDensas;
