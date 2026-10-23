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
 * ahí (`carril`, hoy «Lo más leído») y debajo la tarjeta nativa de publicidad, que
 * antes iba intercalada en la rejilla. Sin nada que poner, la lista ocupa todo.
 */
export const NoticiasDensas = ({ items, espacioDeAnuncio, carril = null }) => {
  const hay = useHayAnuncio(espacioDeAnuncio, "tarjeta");
  const hayCarril = Boolean(carril) || hay;

  return (
    <div className={`se-noticias${hayCarril ? " se-noticias--con-carril" : ""}`}>
      <ol className="se-noticias__lista">
        {items.map((n) => (
          <li key={n.id} className="se-noticias__nota">
            {/* El lugar primero: para este medio «dónde» es lo primero por lo que
                un lector ordena. Igual que en la columna de la apertura. */}
            <span className="se-noticias__meta">
              {geoPrincipal(n)}
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
      {hayCarril ? (
        <aside className="se-noticias__carril">
          {carril}
          {hay ? <EspacioPublicitario espacio={espacioDeAnuncio} variante="tarjeta" /> : null}
        </aside>
      ) : null}
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
