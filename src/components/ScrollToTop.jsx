import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import PropTypes from "prop-types";
import {
  apuntar,
  bloqueoEnHtml,
  cargaQueRestaura,
  claveDe,
  guardarPosiciones,
  leerPosiciones,
  restaurar,
} from "../lib/desplazamiento";

/**
 * El desplazamiento al cambiar de página:
 *
 * - **A una página nueva** (de ruta, no solo de consulta), arriba del todo.
 * - **Con «atrás» o «adelante»**, donde estaba el lector en esa página: la portada vuelve
 *   a la noticia de la que se salió, no al principio (ver `lib/desplazamiento.js`, que
 *   también explica por qué no se usa el `ScrollRestoration` de React Router).
 * - **Si solo cambia la consulta** (un filtro, «Cargar más»), quieto.
 *
 * El navegador no lo hace por su cuenta en un sitio que cambia de página sin recargar (y
 * si lo intenta, lo hace antes de que esté pintada la página a la que se vuelve): por eso
 * `history.scrollRestoration = "manual"` mientras esto está montado.
 *
 * En `useLayoutEffect` y no en `useEffect`: con `v7_startTransition` (`main.jsx`) la
 * página nueva y la dirección nueva llegan juntas en el mismo commit, y un efecto normal
 * de un commit así corre cuando el navegador ya ha podido pintar. Se veía la página nueva
 * un cuadro a la altura de la anterior y luego el salto. El de diseño corre en el mismo
 * commit, antes de pintar.
 */

/**
 * Lo apuntado de cada entrada del historial (de la pestaña, no de este montaje: el marco
 * se desmonta al pasar por `/entorno` o por el panel, y al volver sigue valiendo), y si
 * ya se pintó alguna página desde que se cargó el sitio.
 */
let posiciones = null;
let yaHuboUnaPagina = false;

const ScrollToTop = ({ children }) => {
  const location = useLocation();
  const tipo = useNavigationType();
  const prevLocation = useRef(null);
  // La entrada del historial que se está viendo, y si se está sosteniendo su altura
  // (`restaurar`): mientras tanto no se apunta, porque con la página aún corta lo que se
  // leería es la altura recortada y no la buena.
  const clave = useRef(claveDe(location));
  const sosteniendo = useRef(false);
  if (!posiciones) posiciones = leerPosiciones();

  // Apuntar dónde está el lector: al tocar o teclear (antes de que un enlace cambie de
  // página), al ir hacia atrás (antes de que el router pinte la otra) y, al desplazarse,
  // un momento después de parar. Cada apunte va a la entrada en la que se hizo.
  useEffect(() => {
    const historial = window.history;
    const antes = historial.scrollRestoration;
    historial.scrollRestoration = "manual";
    // Ni mientras se sostiene una altura ni con la invitación al boletín abierta (bloquea
    // `<html>`, y entonces `scrollY` no es la altura del lector): ver `bloqueoEnHtml`.
    const ahora = () => {
      if (!sosteniendo.current && !bloqueoEnHtml()) apuntar(posiciones, clave.current, window.scrollY);
    };
    let espera = null;
    const alDesplazar = () => {
      const deEsta = clave.current;
      clearTimeout(espera);
      espera = setTimeout(() => {
        if (clave.current === deEsta) ahora();
      }, 100);
    };
    const alSalir = () => {
      ahora();
      guardarPosiciones(posiciones);
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    window.addEventListener("pointerdown", ahora, true);
    window.addEventListener("keydown", ahora, true);
    window.addEventListener("popstate", ahora, true);
    window.addEventListener("pagehide", alSalir);
    return () => {
      clearTimeout(espera);
      window.removeEventListener("scroll", alDesplazar);
      window.removeEventListener("pointerdown", ahora, true);
      window.removeEventListener("keydown", ahora, true);
      window.removeEventListener("popstate", ahora, true);
      window.removeEventListener("pagehide", alSalir);
      historial.scrollRestoration = antes;
    };
  }, []);

  useLayoutEffect(() => {
    const previa = prevLocation.current;
    prevLocation.current = location;
    clave.current = claveDe(location);
    const guardada = posiciones.get(clave.current);
    const volver = () => {
      sosteniendo.current = true;
      return restaurar(guardada, { alSoltar: () => (sosteniendo.current = false) });
    };
    // La primera página desde que se cargó el sitio: solo si se recargó o se volvió a ella
    // desde otro sitio (un enlace abierto de nuevo llega arriba). `previa === location`:
    // el segundo pase del modo estricto, que es la misma.
    if (!yaHuboUnaPagina || previa === location) {
      yaHuboUnaPagina = true;
      return tipo === "POP" && guardada !== undefined && cargaQueRestaura() ? volver() : undefined;
    }
    guardarPosiciones(posiciones);
    if (tipo === "POP" && guardada !== undefined) return volver();
    // Sin la de antes (el marco se acaba de volver a montar), es otra página.
    if (location.pathname !== previa?.pathname) window.scrollTo(0, 0);
    return undefined;
  }, [location, tipo]);

  return children;
};

export default ScrollToTop;

ScrollToTop.propTypes = {
  children: PropTypes.any,
};
