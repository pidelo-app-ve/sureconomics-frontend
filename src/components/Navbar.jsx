import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Enlace } from "./Enlace";
import { sinPrefijo } from "../i18n/motor";
import PropTypes from "prop-types";
import { PRIMARY_NAV } from "../data/surEconomicsMock";
import { BRAND_PUBLIC_LOGO } from "../brand/publicBrandLogos";
import { Relojes, RelojesEnLista } from "./Relojes";
import { useIdioma } from "../i18n/ProveedorIdioma";
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
  <Enlace
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
  </Enlace>
);

AlPuntoLink.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

const isJuegosActive = (pathname) => pathname === "/juegos" || pathname.startsWith("/juegos/");

/** La misma lupa que lleva el campo del explorador (`ContentExplorer`). */
const IconoLupa = () => (
  <svg viewBox="0 0 16 16" className="se-header__buscar-icono" aria-hidden="true" focusable="false">
    <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10.8 10.8 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * La lupa de la cabecera. Desde el 23-oct-2026 el buscador no es una barra verde bajo
 * el mástil sino este botón (la redacción pidió «solo el icono»): abre el explorador
 * de la portada con `?buscar=1` y, si ya está abierto, lo cierra volviendo a `/`.
 * Es un enlace y no un botón porque el estado vive en la URL: se puede compartir,
 * el botón «atrás» lo cierra y desde cualquier otra página lleva a la portada con
 * el buscador abierto. En el cajón del teléfono va a lo ancho y con la palabra.
 */
const BuscarLink = ({ abierto, enPortada, onClick, className = "" }) => {
  const { t } = useIdioma();
  const cierra = enPortada && abierto;
  return (
    <Enlace
      to={cierra ? "/" : "/?buscar=1"}
      className={`se-header__buscar${abierto ? " se-header__buscar--on" : ""}${
        className ? ` ${className}` : ""
      }`}
      aria-label={cierra ? t("nav.cerrarBuscador") : t("nav.buscar")}
      aria-expanded={enPortada ? abierto : undefined}
      onClick={onClick}
    >
      <IconoLupa />
      <span className="se-header__buscar-texto">{t("nav.buscar")}</span>
    </Enlace>
  );
};

BuscarLink.propTypes = {
  abierto: PropTypes.bool.isRequired,
  enPortada: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

/** Un mando de consola: dos asas, la cruz a la izquierda y dos botones que se pulsan solos. */
const IconoJuegos = () => (
  <svg viewBox="0 0 24 24" className="se-header__juegos-icono" aria-hidden="true" focusable="false">
    <path
      className="se-header__juegos-mando"
      d="M7 7h10a5 5 0 0 1 4.9 6l-.8 3.6a2.6 2.6 0 0 1-4.5 1.1L14.8 16H9.2l-1.8 1.7a2.6 2.6 0 0 1-4.5-1.1L2.1 13A5 5 0 0 1 7 7z"
    />
    <path className="se-header__juegos-cruz" d="M7.5 10v4M5.5 12h4" />
    <circle className="se-header__juegos-boton" cx="16" cy="11" r="1.3" />
    <circle className="se-header__juegos-boton se-header__juegos-boton--b" cx="18.4" cy="13.6" r="1.3" />
  </svg>
);

/**
 * El botón de Juegos, junto a «Al punto» y con su misma forma: el indicador animado a la
 * izquierda -- aquí un mando, en vez del punto rojo -- y una palabra. Lleva a `/juegos`,
 * la página con todos los juegos del sitio. Antes este hueco era el botón de El Analista,
 * que está en pausa (ver `routes.jsx`). En el cajón del teléfono va a lo ancho.
 */
const JuegosLink = ({ active, onClick, className = "" }) => {
  const { t } = useIdioma();
  return (
    <Enlace
      to="/juegos"
      className={`se-btn se-btn--secondary se-header__juegos${
        active ? " se-header__juegos--active" : ""
      }${className ? ` ${className}` : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <IconoJuegos />
      <span className="se-header__juegos-texto">{t("nav.juegos")}</span>
      {/* Solo se ve donde la palabra no cabe y el botón se queda en el mando. */}
      <span className="se-header__juegos-globo" aria-hidden="true">
        {t("nav.juegos")}
      </span>
    </Enlace>
  );
};

JuegosLink.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

/**
 * El conmutador de idioma: un enlace a la misma página en el otro idioma. Es un `Link`
 * de React Router a secas y no un `Enlace`, porque el destino ya viene con su prefijo.
 * En la barra se lee la abreviatura («EN» / «ES»); en el cajón, el nombre entero del
 * idioma de destino en ese idioma, que es lo que entiende quien no lee el actual.
 */
const CambioDeIdioma = ({ className = "", onClick }) => {
  const { otroIdioma, nombreDelOtroIdioma, rutaEnOtroIdioma, t } = useIdioma();
  return (
    <Link
      to={rutaEnOtroIdioma}
      className={`se-header__idioma${className ? ` ${className}` : ""}`}
      hrefLang={otroIdioma}
      lang={otroIdioma}
      aria-label={t("idioma.cambiarA", { idioma: nombreDelOtroIdioma })}
      onClick={onClick}
    >
      <span className="se-header__idioma-corto" aria-hidden="true">{t("idioma.otraAbreviatura")}</span>
      <span className="se-header__idioma-largo">{nombreDelOtroIdioma}</span>
    </Link>
  );
};

CambioDeIdioma.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  // Las comprobaciones de «página activa» comparan con rutas sin idioma.
  const pathname = sinPrefijo(location.pathname);
  const { t } = useIdioma();
  const enPortada = pathname === "/";
  const buscadorAbierto =
    enPortada && new URLSearchParams(location.search).get("buscar") === "1";
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
        isNavItemActive(pathname, location.search, to)
          ? " se-header__nav-link--active"
          : ""
      }`,
    [pathname, location.search]
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
        <Enlace
          to="/"
          className="se-header__brand"
          aria-label={t("nav.marcaInicio")}
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
        </Enlace>

        {/* Desktop nav — visible only from 992px up */}
        <nav
          className="se-header__nav se-header__nav--desktop"
          aria-label={t("nav.navegacionPrincipal")}
        >
          <ul className="se-header__nav-list">
            {mainNavItems.map((item) => (
              <li key={item.id} className={`se-header__enlace-${item.id}`}>
                <Enlace
                  to={item.to}
                  className={navLinkClass(item.to)}
                  aria-current={
                    isNavItemActive(pathname, location.search, item.to)
                      ? "page"
                      : undefined
                  }
                >
                  {t(item.labelKey)}
                </Enlace>
              </li>
            ))}
          </ul>
        </nav>
        <div className="se-header__actions se-header__actions--desktop">
          {/* Antes de los botones de cuenta y con o sin sesión: es contenido, no
              cuenta, y quien entra a ver una entrevista no tiene por qué haber
              entrado a su cuenta primero. Los juegos van al lado: también son
              contenido. La lupa va primero: es la puerta a todo lo publicado. */}
          <BuscarLink abierto={buscadorAbierto} enPortada={enPortada} />
          <JuegosLink active={isJuegosActive(pathname)} />
          <AlPuntoLink
            active={isAlPuntoActive(pathname)}
            label={t("nav.alPunto")}
            hint={t("nav.alPuntoHint")}
          />
          {isAuthenticated ? (
            <nav className="se-header__user-nav" aria-label={t("nav.cuentaLector")}>
              <Enlace
                to="/cuenta"
                className={`se-btn se-btn--secondary se-header__dash-btn${
                  isReaderDashboardActive(pathname)
                    ? " se-header__dash-btn--active"
                    : ""
                }`}
                aria-current={
                  isReaderDashboardActive(pathname) ? "page" : undefined
                }
              >
                {t("nav.dashboard")}
              </Enlace>
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
              <Enlace
                to="/cuenta/entrar"
                className="se-btn se-btn--secondary"
              >
                {t("nav.entrar")}
              </Enlace>
              <Enlace to="/cuenta/registro" className="se-btn">
                {t("nav.registrar")}
              </Enlace>
            </div>
          )}
          {/* Dentro del grupo de botones y no suelto en la fila: así comparte su hueco
              pequeño (0,375 rem) y no el de 24 px entre bloques, que a 1440 empujaba el
              reloj a una segunda línea. */}
          <CambioDeIdioma className="se-header__idioma--barra" />
        </div>

        <Relojes className="se-hora--header" />

        <button
          ref={botonRef}
          type="button"
          className="se-header__burger"
          onClick={handleToggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls={MENU_ID}
          aria-label={isMenuOpen ? t("nav.cerrarMenu") : t("nav.abrirMenu")}
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
            aria-label={t("nav.cerrarMenu")}
          />
          <div
            ref={panelRef}
            className="se-header__menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
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
                aria-label={t("nav.cerrarMenu")}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <nav className="se-header__nav" aria-label={t("nav.navegacionPrincipal")}>
              <ul className="se-header__nav-list">
                {mainNavItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="se-header__nav-item"
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <Enlace
                      to={item.to}
                      className={navLinkClass(item.to)}
                      onClick={closeMenu}
                      aria-current={
                        isNavItemActive(pathname, location.search, item.to)
                          ? "page"
                          : undefined
                      }
                    >
                      {t(item.labelKey)}
                    </Enlace>
                  </li>
                ))}
              </ul>
            </nav>
            <RelojesEnLista className="se-hora--cajon" />
            <CambioDeIdioma className="se-header__idioma--cajon" onClick={closeMenu} />

            <div className="se-header__actions se-header__actions--mobile">
              <BuscarLink
                abierto={buscadorAbierto}
                enPortada={enPortada}
                onClick={closeMenu}
                className="se-header__cta"
              />
              <AlPuntoLink
                active={isAlPuntoActive(pathname)}
                label={t("nav.alPunto")}
                hint={t("nav.alPuntoHint")}
                onClick={closeMenu}
                className="se-header__cta"
              />
              <JuegosLink
                active={isJuegosActive(pathname)}
                onClick={closeMenu}
                className="se-header__cta"
              />
              {isAuthenticated ? (
                <nav
                  className="se-header__user-nav se-header__user-nav--stack"
                  aria-label={t("nav.cuentaLector")}
                >
                  <Enlace
                    to="/cuenta"
                    className="se-btn se-btn--secondary se-header__dash-btn"
                    onClick={closeMenu}
                    aria-current={
                      isReaderDashboardActive(pathname) ? "page" : undefined
                    }
                  >
                    {t("nav.dashboard")}
                  </Enlace>
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
                  <Enlace
                    to="/cuenta/registro"
                    className="se-btn se-header__cta"
                    onClick={closeMenu}
                  >
                    {t("nav.registrar")}
                  </Enlace>
                  <Enlace
                    to="/cuenta/entrar"
                    className="se-btn se-btn--secondary se-header__cta"
                    onClick={closeMenu}
                  >
                    {t("nav.entrar")}
                  </Enlace>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
