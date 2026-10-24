import PropTypes from "prop-types";
import { Enlace } from "../Enlace";

/**
 * Shared chrome for the five format blocks on the homepage.
 *
 * The document is explicit that no format outranks the others, so every block
 * gets the same heading treatment and the same weight; only the body layout
 * changes between them.
 *
 * `tono="oscuro"`: la banda de tinta de «Al punto», que es lo que se ve y se escucha
 * (vídeo y pódcast), con el mismo punto rojo de grabar que lleva en el menú.
 */
export const FormatSection = ({ title, to, linkLabel, tono, children }) => (
  <section className={`se-section se-format${tono === "oscuro" ? " se-format--oscuro" : ""}`} aria-label={title}>
    <div className="se-container">
      <div className="se-format__head">
        <h2 className="se-heading-section se-format__title">
          {tono === "oscuro" ? <span className="se-header__alpunto-punto" aria-hidden="true" /> : null}
          {title}
        </h2>
        <Enlace to={to} className="se-format__more">
          {linkLabel}
        </Enlace>
      </div>
      {children}
    </div>
  </section>
);

FormatSection.propTypes = {
  title: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  linkLabel: PropTypes.string.isRequired,
  tono: PropTypes.oneOf(["oscuro"]),
  children: PropTypes.node.isRequired,
};
