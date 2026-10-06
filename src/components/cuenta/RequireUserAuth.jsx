import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { Redirigir } from "../Enlace";
import { sinPrefijo } from "../../i18n/motor";
import { useUserAuth } from "../../context/UserAuthContext";

export const RequireUserAuth = ({ children }) => {
  const { isAuthenticated } = useUserAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // La vuelta se guarda sin el prefijo de idioma: quien la use (`useNavegar`,
    // `Redirigir`) le pone el `/en` si toca, y así sirve en los dos idiomas.
    return <Redirigir to="/cuenta/entrar" replace state={{ from: sinPrefijo(location.pathname) + location.search }} />;
  }

  return children;
};

RequireUserAuth.propTypes = {
  children: PropTypes.node.isRequired,
};
