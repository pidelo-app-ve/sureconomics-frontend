import PropTypes from "prop-types";
import { Pagination } from "../content";
import { lineaDePaginas } from "../../lib/listasDelPanel";

/**
 * Lo de encima de una lista del panel: «Página X de Y — N en total» y la paginación
 * compacta («Anterior» y «Siguiente»). La completa va debajo de la lista, con
 * `<Pagination>`: con veinte filas largas, la de abajo no se ve sin bajar hasta el final.
 */
export const PaginasDeLaLista = ({ pagina, paginas, total, onPagina, anclaje }) => (
  <div className="se-admin-paginas" {...anclaje}>
    <p className="se-text-body" style={{ margin: 0 }}>
      {lineaDePaginas({ pagina, paginas, total })}
    </p>
    <Pagination page={pagina} totalPages={paginas} onPageChange={onPagina} compacta etiqueta="Paginación (arriba)" />
  </div>
);

PaginasDeLaLista.propTypes = {
  pagina: PropTypes.number.isRequired,
  paginas: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPagina: PropTypes.func.isRequired,
  /** El anclaje de la guía (`ancla("paginas")`), si la página lo señala. */
  anclaje: PropTypes.object,
};
