import { Link } from "react-router-dom";
import { ABOUT_TEXT, NAV_CATEGORIES } from "../data/blogMock";

export const Footer = () => {
  return (
    <footer className="se-footer" role="contentinfo">
      <div className="se-container">
        <div className="se-footer__about">
          <h2 className="se-footer__brand">{ABOUT_TEXT.name}</h2>
          <p className="se-footer__tagline">{ABOUT_TEXT.tagline}</p>
          <p className="se-footer__description">{ABOUT_TEXT.description}</p>
        </div>
        <nav className="se-footer__nav" aria-label="Enlaces del sitio">
          <ul className="se-footer__nav-list">
            {NAV_CATEGORIES.map((item) => (
              <li key={item.slug}>
                <Link to={`/categoria/${item.slug}`} className="se-footer__link">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/suscribirse" className="se-footer__link">
                Suscribirse
              </Link>
            </li>
          </ul>
        </nav>
        <hr className="se-divider se-footer__divider" />
        <p className="se-footer__copy">
          © {new Date().getFullYear()} {ABOUT_TEXT.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};
