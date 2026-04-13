import PropTypes from "prop-types";

export const LoadingState = ({ title = "Cargando…", description }) => {
  return (
    <div className="se-container" role="status" aria-live="polite">
      <div style={{ padding: "2rem 0" }}>
        <div className="se-meta se-meta--category">{title}</div>
        {description ? <p className="se-text-body" style={{ marginTop: "0.5rem" }}>{description}</p> : null}
      </div>
    </div>
  );
};

LoadingState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
};

