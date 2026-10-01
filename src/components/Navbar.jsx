import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { PRIMARY_NAV } from "../data/surEconomicsMock";
import { BRAND_PUBLIC_LOGO } from "../brand/publicBrandLogos";
import { HoraCaracas } from "./HoraCaracas";
import useI18n from "../i18n/useI18n";
import { useUserAuth } from "../context/UserAuthContext";

const MENU_ID = "se-header-menu";

/** Lo que se puede tabular dentro del cajón: el mismo criterio que el cuadro de TikTok. */
const FOCALES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Several format entries share the `/articulos` path and differ only by the
 * `formato` query param, so matching on pathname alone would light up
 * "Artículos" while the reader is on Noticias. Compare the param too, and treat
 * a param-less entry as "no format selected".
 */
const isNavItemActive = (pathname, search, to) => {
  if (to === "/") return pathname === "/";

  const [toPath, toQuery = ""] = to.split("?");
  const itemFormat = new URLSearchParams(toQuery).get("formato");

  if (toPath === "/articulos") {
    const onArticles =
      pathname.startsWith("/articulos") || pathname.startsWith("/articulo/");
    if (!onArticles) return false;
    const currentFormat = new URLSearchParams(search).get("formato");
    return itemFormat ? currentFormat === itemFormat : !currentFormat;
  }

  return pathname === toPath || pathname.startsWith(`${toPath}/`);
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

const isAlPuntoActive = (pathname) => pathname.startsWith("/audiovisual");

/**
 * El botón «Al punto»: la puerta al espacio audiovisual (entrevistas y podcast),
 * que salió de la fila de enlaces para ir con los botones de cuenta. Va como botón
 * y no como enlace porque es otra cosa que una sección de lectura, y lleva delante
 * la luz de grabar -- el punto rojo que late -- que es lo que lo cuenta de un
 * vistazo. Se pinta dos veces, en la barra y en el cajón, así que vive aquí.
 *
 * El `aria-label` sustituye al texto visible para el lector de pantalla: «Al punto»
 * solo, sin la luz, no dice a dónde lleva.
 */
const AlPuntoLink = ({ active, label, hint, onClick, className = "" }) => (
  <Link
    to="/audiovisual"
    className={`se-btn se-btn--secondary se-header__alpunto${
      active ? " se-header__alpunto--active" : ""
    }${className ? ` ${className}` : ""}`}
    aria-current={active ? "page" : undefined}
    aria-label={hint}
    onClick={onClick}
  >
    <span className="se-header__alpunto-punto" aria-hidden="true" />
    {label}
  </Link>
);

AlPuntoLink.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { t } = useI18n();
  const { isAuthenticated, logout } = useUserAuth();
  const botonRef = useRef(null);
  const panelRef = useRef(null);

  const mainNavItems = useMemo(
    () => PRIMARY_NAV.filter((item) => item.id !== "suscripcion" && !item.hidden),
    []
  );

  const navLinkClass = useCallback(
    (to) =>
      `se-header__nav-link${
        isNavItemActive(location.pathname, location.search, to)
          ? " se-header__nav-link--active"
          : ""
      }`,
    [location.pathname, location.search]
  );

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Escape cierra (y el efecto de abajo devuelve el foco al botón); Tab no sale del
  // cajón mientras está abierto. Es un `aria-modal`: lo de detrás está tapado por la
  // capa oscura, y tabular hasta un enlace que no se ve es perderse.
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focales = Array.from(panel.querySelectorAll(FOCALES)).filter(
        (el) => el.getClientRects().length > 0
      );
      if (!focales.length) return;
      const primero = focales[0];
      const ultimo = focales[focales.length - 1];
      const activo = document.activeElement;
      if (!panel.contains(activo)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
        return;
      }
      if (e.shiftKey && activo === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
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

  // Al abrir, el foco entra en el cajón -- en el primer enlace, que es a lo que se
  // viene --; al cerrar por la vía que sea, vuelve al botón que lo abrió. Sin esto el
  // foco se quedaba en la hamburguesa con el cajón tapándola, o caía al `body` al
  // ocultarse el enlace que lo tenía.
  //
  // Solo se devuelve si el foco seguía dentro del cajón o se había perdido: si quien
  // cierra es un cambio de ruta, el `Layout` lleva el foco al contenido justo después,
  // y esa es la decisión buena.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const panel = panelRef.current;
    const boton = botonRef.current;
    // Se reintenta unos cuadros: el cajón pasa de `visibility: hidden` a visible con
    // una transición, y en su primer cuadro todavía cuenta como oculto -- medido, el
    // `focus()` de ese cuadro no hacía nada y el foco seguía en la hamburguesa.
    let cuadro = 0;
    let intentos = 0;
    const entrar = () => {
      const primero =
        panel?.querySelector(".se-header__nav-link") || panel?.querySelector(FOCALES);
      primero?.focus();
      if (primero && document.activeElement !== primero && intentos++ < 20) {
        cuadro = window.requestAnimationFrame(entrar);
      }
    };
    cuadro = window.requestAnimationFrame(entrar);
    return () => {
      window.cancelAnimationFrame(cuadro);
      const activo = document.activeElement;
      if (!activo || activo === document.body || panel?.contains(activo)) {
        boton?.focus();
      }
    };
  }, [isMenuOpen]);

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
                    isNavItemActive(location.pathname, location.search, item.to)
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
          {/* Antes de los botones de cuenta y con o sin sesión: es contenido, no
              cuenta, y quien entra a ver una entrevista no tiene por qué haber
              entrado a su cuenta primero. */}
          <AlPuntoLink
            active={isAlPuntoActive(location.pathname)}
            label={t("nav.alPunto")}
            hint={t("nav.alPuntoHint")}
          />
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
              {/* «Salir» y no «Cerrar sesión» en escritorio: medido, los dos botones
                  largos dejaban el nav 36 px corto incluso a 1920 px, y «Anúnciate»
                  salía partido siempre que había sesión. El menú móvil sí usa la
                  etiqueta larga, que es donde hay sitio y donde conviene ser explícito. */}
              <button
                type="button"
                className="se-btn se-btn--secondary se-header__dash-btn"
                onClick={handleLogout}
              >
                {t("nav.salir")}
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

        <HoraCaracas className="se-hora--header" />

        <button
          ref={botonRef}
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
          <div
            ref={panelRef}
            className="se-header__menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
          >
            <div className="se-header__menu-header">
              {/* La marca arriba, como en el carril del panel de administración:
                  es lo que hace que ese se lea bien y el cajón no. Antes decía
                  "Menú", una etiqueta que no dice nada que el cajón abierto no
                  diga ya, y que además chocaba con el logo de la barra. */}
              <img
                className="se-header__menu-brand"
                src={BRAND_PUBLIC_LOGO.dark.wordmarkNoTagline}
                alt="SurEconomics"
                width="150"
                height="20"
              />
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
                        isNavItemActive(location.pathname, location.search, item.to)
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
            <HoraCaracas className="se-hora--cajon" />

            <div className="se-header__actions se-header__actions--mobile">
              <AlPuntoLink
                active={isAlPuntoActive(location.pathname)}
                label={t("nav.alPunto")}
                hint={t("nav.alPuntoHint")}
                onClick={closeMenu}
                className="se-header__cta"
              />
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
