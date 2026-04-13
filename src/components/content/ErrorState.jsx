import PropTypes from "prop-types";

const getMessage = (error) => {
  if (!error) return "Ocurrió un error al cargar los datos.";
  if (typeof error === "string") return error;
  return error.message || "Ocurrió un error al cargar los datos.";
};

export const ErrorState = ({ title = "Error", error, onRetry }) => {
  const message = getMessage(error);
  return (
    <div className="se-container" role="alert" aria-live="polite">
      <div style={{ padding: "2rem 0" }}>
        <h2 className="se-heading-section se-heading-section--small" style={{ marginBottom: "0.75rem" }}>
          {title}
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
            Reintentar
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

