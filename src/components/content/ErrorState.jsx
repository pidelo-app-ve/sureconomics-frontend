import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

const getMessage = (error, t) => {
  if (!error) return t("listados.estados.errorGenerico");
  if (typeof error === "string") return error;
  if (error.status === 429) {
    return t("listados.estados.demasiadasSolicitudes");
  }
  return error.message || t("listados.estados.errorGenerico");
};

export const ErrorState = ({ title, error, onRetry }) => {
  const { t } = useIdioma();
  const message = getMessage(error, t);
  return (
    <div className="se-state se-state--error" role="alert" aria-live="polite">
      <div style={{ padding: "2rem 0" }}>
        <h2 className="se-heading-section se-heading-section--small" style={{ marginBottom: "0.75rem" }}>
          {title === undefined ? t("listados.estados.errorTitulo") : title}
        </h2>
        <p className="se-text-body" style={{ margin: 0 }}>
          {message}
        </p>
        {onRetry ? (
          <button
            type="button"
            className="se-btn"
            onClick={onRetry}
            style={{ marginTop: "1rem" }}
          >
            {t("comun.reintentar")}
          </button>
        ) : null}
      </div>
    </div>
  );
};

ErrorState.propTypes = {
  title: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onRetry: PropTypes.func,
};
