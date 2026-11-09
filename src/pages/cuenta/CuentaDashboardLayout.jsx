import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Enlace, EnlaceNav } from "../../components/Enlace";
import { RequireUserAuth } from "../../components/cuenta/RequireUserAuth";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { BRAND_PUBLIC_LOGO } from "../../brand/publicBrandLogos";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoCuenta } from "../../lib/guias/guiaCuenta";
import { marcarRecorridoVisto } from "../../services/userAuthService";
import "../../styles/cuenta.css";

const IconGrid = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
      fill="currentColor"
      opacity="0.9"
    />
  </svg>
);

const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z"
      fill="currentColor"
      opacity="0.92"
    />
  </svg>
);

const IconBookmark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"
      fill="currentColor"
      opacity="0.9"
    />
  </svg>
);

const IconSend = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m4 12 16-8-4 16-3-7-5-1Z"
      fill="currentColor"
      opacity="0.92"
    />
  </svg>
);

/** Lo comprado. Una bolsa, que es lo que se reconoce sin leer la etiqueta. */
const IconCompras = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 8h14l-1.1 11.2a1.6 1.6 0 0 1-1.6 1.4H7.7a1.6 1.6 0 0 1-1.6-1.4Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M9 8V6.2a3 3 0 0 1 6 0V8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const IconTemas = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" focusable="false">
    <path d="M9 4L7 20M17 4l-2 16M4 9h17M3 15h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/** `guia`: el anclaje de la bienvenida (`lib/guias/guiaCuenta.js`). */
const RAIL_NAV = [
  { to: "/cuenta", end: true, labelKey: "nav.inicio", icon: IconGrid, guia: "inicio" },
  { to: "/cuenta/perfil", labelKey: "cuenta.panel.miPerfil", icon: IconUser, guia: "perfil" },
  { to: "/cuenta/lo-mio", labelKey: "cuenta.panel.loMio", icon: IconCompras, guia: "lo-mio" },
  { to: "/cuenta/marcadores", labelKey: "nav.marcadores", icon: IconBookmark, guia: "marcadores" },
  { to: "/cuenta/temas", labelKey: "cuenta.panel.misTemas", icon: IconTemas, guia: "temas" },
  { to: "/cuenta/envios", labelKey: "cuenta.panel.misPropuestas", icon: IconSend, guia: "propuestas" },
];

/** Por debajo de esto el menú lateral va plegado (cajón). Igual que `cuenta.css`. */
const MENU_PLEGADO = "(max-width: 959px)";

const IconAyuda = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16.9" r="1.05" fill="currentColor" />
  </svg>
);

const DashboardShell = () => {
  const { t } = useIdioma();
  const { profile, logout } = useUserAuth();
  const location = useLocation();
  const [railOpen, setRailOpen] = useState(false);

  const handleCloseRail = useCallback(() => setRailOpen(false), []);

  useEffect(() => {
    handleCloseRail();
  }, [location.pathname, handleCloseRail]);

  // Escape cierra el cajón, como cualquier otro panel que se abre encima.
  useEffect(() => {
    if (!railOpen) return undefined;
    const alPulsar = (e) => {
      if (e.key === "Escape") handleCloseRail();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [railOpen, handleCloseRail]);

  // La bienvenida: salta sola la primera vez que se entra con el correo confirmado, y
  // se apunta en el servidor al empezar (aunque se omita, no vuelve a saltar sola).
  const bienvenidaLanzada = useRef(false);
  useEffect(() => {
    if (!profile || bienvenidaLanzada.current) return;
    if (profile.recorridosVistos?.includes("cuenta")) return;
    bienvenidaLanzada.current = true;
    recorridoCuenta.iniciar();
    marcarRecorridoVisto("cuenta").catch(() => {});
  }, [profile]);

  // En el teléfono el menú va plegado: los pasos que lo enseñan lo abren, y al
  // terminar la guía se vuelve a plegar.
  const [pasoGuia, setPasoGuia] = useState(() => recorridoCuenta.pasoActivo());
  useEffect(() => recorridoCuenta.suscribir(() => setPasoGuia(recorridoCuenta.pasoActivo())), []);
  const guiaPideMenu = pasoGuia !== null && Boolean(recorridoCuenta.pasos[pasoGuia]?.abrirMenu);
  useEffect(() => {
    if (!window.matchMedia?.(MENU_PLEGADO).matches) return;
    setRailOpen(guiaPideMenu);
  }, [guiaPideMenu]);

  useEffect(() => {
    if (!railOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [railOpen]);

  const handleLogout = async () => {
    await logout();
    handleCloseRail();
  };

  const navClass = ({ isActive }) =>
    `se-reader-dash__nav-link${isActive ? " se-reader-dash__nav-link--active" : ""}`;

  return (
    <div className="se-reader-dash">
      {railOpen ? (
        <button
          type="button"
          className="se-reader-dash__scrim"
          aria-label={t("nav.cerrarMenu")}
          onClick={handleCloseRail}
        />
      ) : null}

      <aside
        id="reader-dash-rail"
        className={`se-reader-dash__rail${railOpen ? " se-reader-dash__rail--open" : ""}`}
      >
        <div className="se-reader-dash__rail-brand">
          <Enlace to="/" className="se-reader-dash__rail-logo" onClick={handleCloseRail}>
            {/* Solo el wordmark: ya lleva el isotipo dentro. Se pintaban los dos, uno
                encima del otro, y el nombre de la marca quedaba ilegible. */}
            <img
              className="se-reader-dash__rail-logo-word"
              src={BRAND_PUBLIC_LOGO.dark.wordmarkNoTagline}
              alt=""
              width={200}
              height={48}
              decoding="async"
            />
            <span className="se-sr-only">{t("cuenta.panel.inicio", { marca: BRAND.name })}</span>
          </Enlace>
          <span className="se-reader-dash__rail-tag">{t("cuenta.panel.lector")}</span>
        </div>

        <nav className="se-reader-dash__nav" aria-label={t("cuenta.panel.areaDeLector")}>
          {RAIL_NAV.map(({ to, labelKey, icon: Icon, end, guia }) => (
            <EnlaceNav
              key={to}
              to={to}
              end={Boolean(end)}
              className={navClass}
              onClick={handleCloseRail}
              {...{ [recorridoCuenta.atributo]: guia }}
            >
              <span className="se-reader-dash__nav-ico" aria-hidden="true">
                <Icon />
              </span>
              <span>{t(labelKey)}</span>
            </EnlaceNav>
          ))}
        </nav>

        <div className="se-reader-dash__rail-footer">
          <p className="se-reader-dash__rail-email" title={profile?.email ?? ""}>
            {profile?.email || t("cuenta.panel.sesionActiva")}
          </p>
          <button type="button" className="se-reader-dash__logout" onClick={handleLogout}>
            {t("nav.cerrarSesion")}
          </button>
        </div>
      </aside>

      <div className="se-reader-dash__stage">
        <header className="se-reader-dash__topbar">
          <button
            type="button"
            className="se-reader-dash__burger"
            onClick={() => setRailOpen((o) => !o)}
            aria-expanded={railOpen}
            aria-controls="reader-dash-rail"
            aria-label={railOpen ? t("cuenta.panel.cerrarMenuLateral") : t("cuenta.panel.abrirMenuLateral")}
          >
            <span />
            <span />
            <span />
          </button>
          <Enlace
            to="/"
            className="se-reader-dash__topbar-home"
            onClick={handleCloseRail}
            aria-label={t("cuenta.panel.inicio", { marca: BRAND.name })}
          >
            <img
              className="se-reader-dash__topbar-home-img"
              src={BRAND_PUBLIC_LOGO.light.isotypeWithBox}
              alt=""
              width={28}
              height={28}
              decoding="async"
            />
          </Enlace>
          <div className="se-reader-dash__topbar-meta">
            <span className="se-reader-dash__topbar-title">{t("cuenta.panel.suEspacio")}</span>
            {profile?.email ? (
              <span className="se-reader-dash__topbar-sub">{profile.email}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="se-reader-dash__ayuda"
            onClick={recorridoCuenta.iniciar}
            aria-label={t("cuenta.guias.cuenta.boton")}
            title={t("cuenta.guias.cuenta.boton")}
            {...{ [recorridoCuenta.atributo]: "ayuda" }}
          >
            <IconAyuda />
          </button>
          <Enlace to="/" className="se-reader-dash__topbar-site" onClick={handleCloseRail}>
            {t("cuenta.panel.volverAlSitio")}
          </Enlace>
        </header>

        <main className="se-reader-dash__main" id="reader-dashboard-main">
          <Outlet />
        </main>
        <RecorridoVista recorrido={recorridoCuenta} />
      </div>
    </div>
  );
};

export const CuentaDashboardLayout = () => (
  <RequireUserAuth>
    <DashboardShell />
  </RequireUserAuth>
);
