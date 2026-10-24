import PropTypes from "prop-types";
import { geoPrincipal } from "../../lib/contentFilter";

/**
 * «Venezuela · 4 ago 2026»: el lugar en negrita y la fecha. Lo primero por lo que este
 * medio ordena una nota es dónde pasó. Lo usan la apertura y Noticias.
 */
export const LugarYFecha = ({ pieza, clase }) => (
  <span className={clase}>
    <span className="se-meta__lugar">{geoPrincipal(pieza)}</span>
    {pieza.fecha ? <span aria-hidden="true"> · </span> : null}
    {pieza.fecha}
  </span>
);

LugarYFecha.propTypes = {
  pieza: PropTypes.shape({ fecha: PropTypes.string }).isRequired,
  clase: PropTypes.string.isRequired,
};
