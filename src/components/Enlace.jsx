import PropTypes from "prop-types";
import { forwardRef, useCallback } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useIdioma } from "../i18n/ProveedorIdioma";

/**
 * Los enlaces del sitio, que saben en qué idioma están.
 *
 * Son el `Link`, el `NavLink` y el `Navigate` de React Router con una sola diferencia:
 * el destino pasa por `ruta()`, que le pone `/en` delante cuando la página está en
 * inglés. Así `to="/noticias"` sigue escribiéndose igual en todo el código y lleva al
 * idioma correcto. Los destinos que no son del sitio (http…, mailto:, #ancla) salen
 * tal cual.
 *
 * `useNavegar()` es lo mismo para `navigate(...)`.
 */

const traducirDestino = (to, ruta) => {
  if (typeof to === "string") return ruta(to);
  if (to && typeof to === "object" && typeof to.pathname === "string") {
    return { ...to, pathname: ruta(to.pathname) };
  }
  return to;
};

export const Enlace = forwardRef(function Enlace({ to, ...resto }, ref) {
  const { ruta } = useIdioma();
  return <Link ref={ref} to={traducirDestino(to, ruta)} {...resto} />;
});
Enlace.propTypes = { to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired };

export const EnlaceNav = forwardRef(function EnlaceNav({ to, ...resto }, ref) {
  const { ruta } = useIdioma();
  return <NavLink ref={ref} to={traducirDestino(to, ruta)} {...resto} />;
});
EnlaceNav.propTypes = { to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired };

export const Redirigir = ({ to, ...resto }) => {
  const { ruta } = useIdioma();
  return <Navigate to={traducirDestino(to, ruta)} {...resto} />;
};
Redirigir.propTypes = { to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired };

export const useNavegar = () => {
  const navigate = useNavigate();
  const { ruta } = useIdioma();
  return useCallback(
    (to, opciones) => (typeof to === "number" ? navigate(to) : navigate(traducirDestino(to, ruta), opciones)),
    [navigate, ruta]
  );
};
