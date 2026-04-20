import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";

export const RequireUserAuth = ({ children }) => {
  const { isAuthenticated } = useUserAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/cuenta/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
};

RequireUserAuth.propTypes = {
  children: PropTypes.node.isRequired,
};
