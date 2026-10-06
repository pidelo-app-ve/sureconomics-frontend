import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

export const LoadingState = ({ title, description }) => {
  const { t } = useIdioma();
  return (
    <div className="se-state se-state--loading" role="status" aria-live="polite">
      <div style={{ padding: "2rem 0" }}>
        <div className="se-meta se-meta--category">{title === undefined ? t("comun.cargando") : title}</div>
        {description ? <p className="se-text-body" style={{ marginTop: "0.5rem" }}>{description}</p> : null}
      </div>
    </div>
  );
};

LoadingState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};
