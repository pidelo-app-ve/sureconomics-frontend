import PropTypes from "prop-types";
import { Enlace } from "../Enlace";

/**
 * Shared chrome for the five format blocks on the homepage.
 *
 * The document is explicit that no format outranks the others, so every block
 * gets the same heading treatment and the same weight; only the body layout
 * changes between them.
 */
export const FormatSection = ({ title, to, linkLabel, children, pie = null, expandido = false }) => (
  <section className={`se-section se-format${expandido ? " se-format--expandido" : ""}`} aria-label={title}>
    <div className="se-container">
      <div className="se-format__head">
        <h2 className="se-heading-section se-format__title">{title}</h2>
        <Enlace to={to} className="se-format__more">
          {linkLabel}
        </Enlace>
      </div>
      {children}
      {pie}
    </div>
  </section>
);

FormatSection.propTypes = {
  title: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  linkLabel: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  /** Debajo del bloque: el «Cargar más» de la portada. */
  pie: PropTypes.node,
  /**
   * Ya se cargó más de lo de entrada. En el teléfono la portada recorta algunas
   * secciones (ver `blog.css`); expandida, enseña todo lo cargado.
   */
  expandido: PropTypes.bool,
};
