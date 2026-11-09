import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { AdminToastProvider } from "../../context/AdminToastContext";
import { AdminToastViewport } from "../../components/admin/AdminToastViewport";
import { BuscadorDelPanel } from "../../components/admin/BuscadorDelPanel";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { BRAND_PUBLIC_LOGO } from "../../brand/publicBrandLogos";
import { menuPara, nombreDeRuta } from "../../lib/menuDelPanel";
import { recorridoPanelPara } from "../../lib/guias/guiaPanel";
import { getAdminMe, marcarRecorridoVisto } from "../../services/adminMeService";
import "../../styles/admin.css";

const RAIL_MENU_ID = "se-admin-rail-menu";

const linkClass = ({ isActive }) =>
  `se-admin-nav-link${isActive ? " se-admin-nav-link--active" : ""}`;

const NavGroup = ({ label, children, ...resto }) => (
  <div className="se-admin-nav-group" {...resto}>
    <p className="se-admin-nav-group__label">{label}</p>
    <div className="se-admin-nav-group__links">{children}</div>
  </div>
);

NavGroup.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/** El menú del panel se pliega por debajo de este ancho (igual que `admin.css`). */
const MENU_PLEGADO = "(max-width: 959.98px)";

const IconoAyuda = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16.9" r="1.05" fill="currentColor" />
  </svg>
);

const IconoBuscar = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const AdminShell = () => {
  const { logout, role } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const menu = useMemo(() => menuPara(role), [role]);
  const recorrido = useMemo(() => recorridoPanelPara(role), [role]);
  const ancla = (clave) => ({ [recorrido.atributo]: clave });

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const handleToggleMenu = useCallback(() => setMenuOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  // El título de la pestaña: el de la página, si la página no puso el suyo. Ocho
  // pantallas dejaban el del sitio público («Sur Economics — Economía, mercados…»), y
  // con varias pestañas abiertas no se sabía cuál era cuál. Los efectos de las páginas
  // corren antes que este: si ya pusieron «Admin — …», se respeta.
  useEffect(() => {
    const nombre = nombreDeRuta(location.pathname);
    if (nombre && !document.title.startsWith("Admin —")) document.title = `Admin — ${nombre}`;
  }, [location.pathname]);

  // Ctrl+K (⌘K en Mac): el buscador, desde cualquier pantalla del panel.
  useEffect(() => {
    const alPulsar = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setBuscando((b) => !b);
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, []);

  // La bienvenida: salta sola la primera vez y se apunta en el servidor al empezar
  // (aunque se omita, no vuelve a saltar sola). Se repite desde el botón «?».
  const bienvenidaLanzada = useRef(false);
  useEffect(() => {
    if (bienvenidaLanzada.current) return undefined;
    let vivo = true;
    getAdminMe()
      .then((yo) => {
        if (!vivo || bienvenidaLanzada.current) return;
        if ((yo?.recorridos_vistos ?? []).includes("panel")) return;
        bienvenidaLanzada.current = true;
        recorrido.iniciar();
        marcarRecorridoVisto("panel").catch(() => {});
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [recorrido]);

  // En el teléfono el menú va plegado: los pasos que lo enseñan lo abren.
  const [pasoGuia, setPasoGuia] = useState(() => recorrido.pasoActivo());
  useEffect(() => recorrido.suscribir(() => setPasoGuia(recorrido.pasoActivo())), [recorrido]);
  const guiaPideMenu = pasoGuia !== null && Boolean(recorrido.pasos[pasoGuia]?.abrirMenu);
  useEffect(() => {
    if (!window.matchMedia?.(MENU_PLEGADO).matches) return;
    setMenuOpen(guiaPideMenu);
  }, [guiaPideMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className="se-blog se-admin-app">
      <header className="se-admin-mobile-bar" aria-label="Barra de administración móvil">
        <button
          type="button"
          className="se-admin-mobile-bar__menu"
          onClick={handleToggleMenu}
          aria-expanded={menuOpen}
          aria-controls={RAIL_MENU_ID}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
        >
          <span className="se-admin-mobile-bar__burger" aria-hidden="true" />
        </button>
        <div className="se-admin-mobile-bar__brand" aria-label="SurEconomics Admin">
          <img
            className="se-admin-mobile-bar__logo"
            src={BRAND_PUBLIC_LOGO.dark.isotypeWithBox}
            alt=""
            width={32}
            height={32}
            decoding="async"
          />
          <span className="se-admin-mobile-bar__title">Admin</span>
        </div>
        <Link to="/" className="se-admin-mobile-bar__site" onClick={closeMenu}>
          Volver al sitio
        </Link>
      </header>

      <div
        className={`se-admin-backdrop${menuOpen ? " se-admin-backdrop--visible" : ""}`}
        onClick={closeMenu}
        onKeyDown={(e) => e.key === "Enter" && closeMenu()}
        role="button"
        tabIndex={menuOpen ? 0 : -1}
        aria-label="Cerrar menú"
        aria-hidden={!menuOpen}
      />

      <div className="se-admin-app__body">
        <aside
          id={RAIL_MENU_ID}
          className={`se-admin-rail${menuOpen ? " se-admin-rail--open" : ""}`}
          aria-label="Navegación de administración"
        >
          <div className="se-admin-rail__brand">
            <img
              className="se-admin-rail__logo-img"
              src={BRAND_PUBLIC_LOGO.dark.wordmarkNoTagline}
              alt=""
              width={200}
              height={44}
              decoding="async"
            />
            <span className="se-sr-only">SurEconomics</span>
            <span className="se-admin-rail__badge">Admin</span>
          </div>

          <div className="se-admin-rail__herramientas">
            <button
              type="button"
              className="se-admin-rail__buscar"
              onClick={() => {
                closeMenu();
                setBuscando(true);
              }}
              {...ancla("buscar")}
            >
              <IconoBuscar />
              <span>Buscar</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              type="button"
              className="se-admin-rail__ayuda"
              onClick={recorrido.iniciar}
              aria-label="Repetir la visita guiada del panel"
              title="Repetir la visita guiada del panel"
              {...ancla("ayuda")}
            >
              <IconoAyuda />
            </button>
          </div>

          {/* Agrupado por tarea, desde `lib/menuDelPanel.js`: el mismo nombre aquí, en el
              título de cada página, en el buscador y en la bienvenida. */}
          <nav className="se-admin-rail__nav">
            {menu.map((grupo) => (
              <NavGroup key={grupo.clave} label={grupo.nombre} {...ancla(`grupo-${grupo.clave}`)}>
                {grupo.items.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClass} end={item.fin !== false} onClick={closeMenu}>
                    {item.nombre}
                  </NavLink>
                ))}
              </NavGroup>
            ))}
          </nav>

          <div className="se-admin-rail__footer">
            <Link to="/" className="se-admin-rail__ghost" onClick={closeMenu}>
              Volver al sitio
            </Link>
            <button type="button" className="se-admin-rail__logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="se-admin-main" role="main">
          <div className="se-admin-main__surface">
            <div key={location.pathname} className="se-admin-main__outlet">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <AdminToastViewport />
      <BuscadorDelPanel abierto={buscando} onCerrar={() => setBuscando(false)} menu={menu} />
      <RecorridoVista recorrido={recorrido} />
    </div>
  );
};

/**
 * Toasts are provided at the shell level so every admin page can report the
 * outcome of an action without each one wiring up its own notification UI.
 */
export const AdminLayout = () => (
  <AdminToastProvider>
    <AdminShell />
  </AdminToastProvider>
);
