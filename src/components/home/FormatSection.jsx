import PropTypes from "prop-types";
import { Link } from "react-router-dom";

/**
 * Shared chrome for the five format blocks on the homepage.
 *
 * The document is explicit that no format outranks the others, so every block
 * gets the same heading treatment and the same weight; only the body layout
 * changes between them.
 */
export const FormatSection = ({ title, to, linkLabel, children }) => (
  <section className="se-section se-format" aria-label={title}>
    <div className="se-container">
      <div className="se-format__head">
        <h2 className="se-heading-section se-format__title">{title}</h2>
        <Link to={to} className="se-format__more">
          {linkLabel}
        </Link>
      </div>
      {children}
    </div>
  </section>
);

FormatSection.propTypes = {
  title: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  linkLabel: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
