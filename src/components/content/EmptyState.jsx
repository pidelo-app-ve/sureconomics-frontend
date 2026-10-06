import PropTypes from "prop-types";
import { useIdioma } from "../../i18n/ProveedorIdioma";

export const EmptyState = ({ title, description, action }) => {
  const { t } = useIdioma();
  return (
    <div className="se-container" role="status" aria-live="polite">
      <div style={{ padding: "2rem 0" }}>
        <h2 className="se-heading-section se-heading-section--small" style={{ marginBottom: "0.75rem" }}>
          {title === undefined ? t("listados.estados.vacioTitulo") : title}
        </h2>
        <p className="se-text-body" style={{ margin: 0 }}>
          {description === undefined ? t("listados.estados.vacioTexto") : description}
        </p>
        {action ? <div style={{ marginTop: "1rem" }}>{action}</div> : null}
      </div>
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
};
