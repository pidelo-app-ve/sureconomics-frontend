import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const ScrollToTop = ({ children }) => {
  const location = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
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