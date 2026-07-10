import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRIMARY_NAV } from "../data/surEconomicsMock";
import { BRAND_PUBLIC_LOGO } from "../brand/publicBrandLogos";
import useI18n from "../i18n/useI18n";
import { useUserAuth } from "../context/UserAuthContext";

const MENU_ID = "se-header-menu";

const isNavItemActive = (pathname, to) => {
  if (to === "/") return pathname === "/";
  if (to === "/articulos") {
    return (
      pathname.startsWith("/articulos") || pathname.startsWith("/articulo/")
    );
  }
  return pathname === to || pathname.startsWith(`${to}/`);
};

const READER_DASHBOARD_EXCLUDED = [
  "/cuenta/entrar",
  "/cuenta/registro",
  "/cuenta/verificar-email",
  "/cuenta/solicitar-codigo",
];

const isReaderDashboardActive = (pathname) => {
  if (!pathname.startsWith("/cuenta")) return false;
  return !READER_DASHBOARD_EXCLUDED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
};

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { t } = useI18n();
  const { isAuthenticated, logout } = useUserAuth();

  const mainNavItems = useMemo(
    () => PRIMARY_NAV.filter((item) => item.id !== "suscripcion"),
    []
  );

  const navLinkClass = useCallback(
    (to) =>
      `se-header__nav-link${
        isNavItemActive(location.pathname, to)
          ? " se-header__nav-link--active"
          : ""
      }`,
    [location.pathname]
  );

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      className={`se-header ${isMenuOpen ? "se-header--menu-open" : ""} ${
        isScrolled ? "se-header--scrolled" : ""
      }`}
      role="banner"
    >
      <div className="se-container se-header__inner">
        <Link
          to="/"
          className="se-header__brand"
          aria-label="SurEconomics - Inicio"
          onClick={closeMenu}
        >
          <picture>
            <source
              media="(max-width: 520px)"
              srcSet={BRAND_PUBLIC_LOGO.dark.wordmarkCompressed}
            />
            <img
              src={BRAND_PUBLIC_LOGO.dark.wordmarkNoTagline}
              alt=""
              className="se-header__logo"
              decoding="async"
            />
          </picture>
        </Link>

        {/* Desktop nav — visible only from 992px up */}
        <nav
          className="se-header__nav se-header__nav--desktop"
          aria-label="Navegación principal"
        >
          <ul className="se-header__nav-list">
            {mainNavItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.to}
                  className={navLinkClass(item.to)}
                  aria-current={
                    isNavItemActive(location.pathname, item.to)
                      ? "page"
                      : undefined
                  }
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="se-header__actions se-header__actions--desktop">
          {isAuthenticated ? (
            <nav className="se-header__user-nav" aria-label="Cuenta de lector">
              <Link
                to="/cuenta"
                className={`se-btn se-btn--secondary se-header__dash-btn${
                  isReaderDashboardActive(location.pathname)
                    ? " se-header__dash-btn--active"
                    : ""
                }`}
                aria-current={
                  isReaderDashboardActive(location.pathname) ? "page" : undefined
                }
              >
                {t("nav.dashboard")}
              </Link>
              <button
                type="button"
                className="se-btn se-btn--secondary se-header__dash-btn"
                onClick={handleLogout}
              >
                {t("nav.cerrarSesion")}
              </button>
            </nav>
          ) : (
            <div
              className="se-header__guest-actions"
              role="group"
              aria-label={t("nav.readerAuth")}
            >
              <Link
                to="/cuenta/entrar"
                className="se-btn se-btn--secondary"
              >
                {t("nav.entrar")}
              </Link>
              <Link to="/cuenta/registro" className="se-btn">
                {t("nav.registrar")}
              </Link>
            </div>
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
            tabIndex={0}
            aria-label="Cerrar menú"
          />
          <div className="se-header__menu-panel">
            <div className="se-header__menu-header">
              <span className="se-header__menu-title">{t("nav.menu")}</span>
              <button
                type="button"
                className="se-header__menu-close"
                onClick={closeMenu}
                aria-label="Cerrar menú"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <nav className="se-header__nav" aria-label="Navegación principal">
              <ul className="se-header__nav-list">
                {mainNavItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="se-header__nav-item"
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <Link
                      to={item.to}
                      className={navLinkClass(item.to)}
                      onClick={closeMenu}
                      aria-current={
                        isNavItemActive(location.pathname, item.to)
                          ? "page"
                          : undefined
                      }
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="se-header__actions se-header__actions--mobile">
              {isAuthenticated ? (
                <nav
                  className="se-header__user-nav se-header__user-nav--stack"
                  aria-label="Cuenta de lector"
                >
                  <Link
                    to="/cuenta"
                    className="se-btn se-btn--secondary se-header__dash-btn"
                    onClick={closeMenu}
                    aria-current={
                      isReaderDashboardActive(location.pathname) ? "page" : undefined
                    }
                  >
                    {t("nav.dashboard")}
                  </Link>
                  <button
                    type="button"
                    className="se-btn se-btn--secondary se-header__dash-btn"
                    onClick={handleLogout}
                  >
                    {t("nav.cerrarSesion")}
                  </button>
                </nav>
              ) : (
                <div
                  className="se-header__guest-actions se-header__guest-actions--stack"
                  role="group"
                  aria-label={t("nav.readerAuth")}
                >
                  <Link
                    to="/cuenta/registro"
                    className="se-btn se-header__cta"
                    onClick={closeMenu}
                  >
                    {t("nav.registrar")}
                  </Link>
                  <Link
                    to="/cuenta/entrar"
                    className="se-btn se-btn--secondary se-header__cta"
                    onClick={closeMenu}
                  >
                    {t("nav.entrar")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
