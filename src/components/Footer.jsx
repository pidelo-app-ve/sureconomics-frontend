import { Link } from "react-router-dom";
import { BRAND, PRIMARY_NAV, CONTACT } from "../data/surEconomicsMock";
import useI18n from "../i18n/useI18n";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="se-footer" role="contentinfo">
      <div className="se-container">
        <div className="se-footer__grid">
          <div className="se-footer__about">
            <h2 className="se-footer__brand">{BRAND.name}</h2>
            <p className="se-footer__tagline">{BRAND.tagline}</p>
            <p className="se-footer__description">{BRAND.description}</p>
          </div>

          <nav className="se-footer__nav" aria-label="Enlaces del sitio">
            <ul className="se-footer__nav-list">
              {PRIMARY_NAV.map((item) => (
                <li key={item.id}>
                  <Link to={item.to} className="se-footer__link">
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="se-footer__contact" aria-label="Contacto">
            <div className="se-footer__contact-title">{t("nav.contacto")}</div>
            <a className="se-footer__link" href={`mailto:${CONTACT.primaryEmail}`}>
              {CONTACT.primaryEmail}
            </a>
            <div className="se-footer__offices">
              {CONTACT.offices.map((office) => (
                <div key={office.city} className="se-footer__office">
                  <span className="se-footer__office-city">{office.city}:</span>{" "}
                  <span className="se-footer__office-address">
                    {office.address}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="se-divider se-footer__divider" />
        <p className="se-footer__copy">
          © {new Date().getFullYear()} {BRAND.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};
