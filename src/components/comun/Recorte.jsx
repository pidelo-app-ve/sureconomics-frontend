import { useRef } from "react";
import PropTypes from "prop-types";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll";
import "../../styles/recortes.css";

/**
 * Recortes de periódico (ver `styles/recortes.css`).
 *
 * `Recortes` agrupa y dispara el asiento al asomarse; `Recorte` es cada pedazo. El giro
 * de cada uno sale de su posición, siempre el mismo para la misma posición: el azar
 * en cada visita haría que la página cambiara al recargar.
 */

const GIROS = [-0.7, 0.5, -0.35, 0.8, -0.55, 0.3];

export const Recortes = ({ as: Etiqueta = "div", className = "", children, ...resto }) => {
  const ref = useRef(null);
  useRevealOnScroll(ref);
  return (
    <Etiqueta ref={ref} className={`se-recortes${className ? ` ${className}` : ""}`} {...resto}>
      {children}
    </Etiqueta>
  );
};

Recortes.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
};

export const Recorte = ({ indice = 0, as: Etiqueta = "div", className = "", children, ...resto }) => (
  <Etiqueta
    className={`se-recorte${className ? ` ${className}` : ""}`}
    style={{ "--i": indice, "--giro": `${GIROS[indice % GIROS.length]}deg` }}
    {...resto}
  >
    <div className="se-recorte__papel">{children}</div>
  </Etiqueta>
);

Recorte.propTypes = {
  indice: PropTypes.number,
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Recorte;
