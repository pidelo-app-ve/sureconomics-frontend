import { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRIMARY_NAV } from "../data/surEconomicsMock";
import logoImg from "../assets/img/Positivo sin tagline@300x.png";
import useI18n from "../i18n/useI18n";

const MENU_ID = "se-header-menu";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useI18n();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") closeMenu();
    },
    [closeMenu]
  );

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, handleKeyDown]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) closeMenu();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeMenu]);

  return (
    <header
      className={`se-header ${isMenuOpen ? "se-header--menu-open" : ""}`}
      role="banner"
    >
      <div className="se-container se-header__inner">
        <Link
          to="/"
          className="se-header__brand"
          aria-label="Sur Economics - Inicio"
          onClick={closeMenu}
        >
          <img src={logoImg} alt="Sur Economics" className="se-header__logo" />
        </Link>

        {/* Desktop nav — visible only from 992px up */}
        <nav
          className="se-header__nav se-header__nav--desktop"
          aria-label="Navegación principal"
        >
          <ul className="se-header__nav-list">
            {PRIMARY_NAV.filter((item) => item.id !== "suscripcion").map((item) => (
              <li key={item.id}>
                <Link
                  to={item.to}
                  className="se-header__nav-link"
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="se-header__actions se-header__actions--desktop">
          {PRIMARY_NAV.find((item) => item.id === "suscripcion")?.to && (
          <Link
            to={PRIMARY_NAV.find((item) => item.id === "suscripcion").to}
            className="se-btn se-btn--secondary se-header__cta"
            aria-label="Suscribirse al newsletter"
          >
            {t("common.suscribirse")}
          </Link>
          )}
        </div>

        <button
          type="button"
          className="se-header__burger"
          onClick={handleToggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls={MENU_ID}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <span className="se-header__burger-line" aria-hidden="true" />
          <span className="se-header__burger-line" aria-hidden="true" />
          <span className="se-header__burger-line" aria-hidden="true" />
        </button>

        <div
          id={MENU_ID}
          className="se-header__menu"
          aria-hidden={!isMenuOpen}
        >
          <div
            className="se-header__menu-backdrop"
            onClick={closeMenu}
            onKeyDown={(e) => e.key === "Enter" && closeMenu()}
            role="button"
            tabIndex={-1}
            aria-label="Cerrar menú"
          />
          <div className="se-header__menu-panel">
            <nav className="se-header__nav" aria-label="Navegación principal">
              <ul className="se-header__nav-list">
                {PRIMARY_NAV.filter((item) => item.id !== "suscripcion").map((item, index) => (
                  <li
                    key={item.id}
                    className="se-header__nav-item"
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <Link
                      to={item.to}
                      className="se-header__nav-link"
                      onClick={closeMenu}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="se-header__actions">
              <Link
                to={PRIMARY_NAV.find((item) => item.id === "suscripcion").to}
                className="se-btn se-btn--secondary se-header__cta"
                onClick={closeMenu}
                aria-label="Suscribirse al newsletter"
              >
                {t("common.suscribirse")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
