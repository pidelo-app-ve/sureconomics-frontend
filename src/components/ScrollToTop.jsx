import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * Al cambiar de página (de ruta, no solo de consulta), arriba del todo.
 *
 * En `useLayoutEffect` y no en `useEffect`: con `v7_startTransition` (`main.jsx`) la
 * página nueva y la dirección nueva llegan juntas en el mismo commit, y un efecto normal
 * de un commit así corre cuando el navegador ya ha podido pintar. Se veía la página nueva
 * un cuadro a la altura de la anterior y luego el salto arriba. El de diseño corre en el
 * mismo commit, antes de pintar: la página nueva sale ya arriba.
 */
const ScrollToTop = ({ children }) => {
  const location = useLocation();
  const prevLocation = useRef(location);

  useLayoutEffect(() => {
    if (location.pathname !== prevLocation.current.pathname) {
      window.scrollTo(0, 0);
    }
    prevLocation.current = location;
  }, [location]);

  return children;
};

export default ScrollToTop;

ScrollToTop.propTypes = {
  children: PropTypes.any,
};
