import PropTypes from "prop-types";
import { BotonGuia } from "../recorrido/RecorridoVista";

/**
 * La cabecera de una página del panel, igual en todas.
 *
 * Cada página traía la suya, con sus márgenes escritos a mano: había tres estilos de
 * título, la explicación con cuatro clases distintas y el botón principal arriba,
 * debajo o al fondo según la página. Aquí hay un solo sitio para cada cosa: el título y
 * su explicación a la izquierda; a la derecha lo que se hace en la página, con «Guía»
 * siempre el último.
 *
 * - `explica`: una o dos frases de para qué sirve la página. El detalle va en la guía.
 * - `dato`: una línea corta de estado («Rol: Admin», «4 en la lista»).
 * - `acciones`: los botones de la página; el principal, el primero.
 * - `guia`: el recorrido de la página (`crearRecorrido`). La superposición
 *   (`RecorridoVista`) la sigue pintando la página.
 */
export const CabeceraDePagina = ({ titulo, explica, dato, acciones, guia, className }) => (
  <header className={`se-admin-shell__header se-cabecera${className ? ` ${className}` : ""}`}>
    <div className="se-cabecera__texto">
      <h1 className="se-heading-section">{titulo}</h1>
      {explica ? <p className="se-admin-meta-hint se-cabecera__explica">{explica}</p> : null}
      {dato ? <p className="se-meta se-meta--category se-cabecera__dato">{dato}</p> : null}
    </div>
    {acciones || guia ? (
      <div className="se-editor-cabecera__acciones">
        {acciones}
        {guia ? <BotonGuia recorrido={guia} className="se-btn se-btn--secondary se-boton-guia" /> : null}
      </div>
    ) : null}
  </header>
);

CabeceraDePagina.propTypes = {
  titulo: PropTypes.node.isRequired,
  explica: PropTypes.node,
  dato: PropTypes.node,
  acciones: PropTypes.node,
  guia: PropTypes.object,
  className: PropTypes.string,
};

CabeceraDePagina.defaultProps = {
  explica: null,
  dato: null,
  acciones: null,
  guia: null,
  className: "",
};
