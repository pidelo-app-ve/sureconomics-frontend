import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { AdminToastProvider } from "../../context/AdminToastContext";
import { AdminToastViewport } from "../../components/admin/AdminToastViewport";
import { BRAND_PUBLIC_LOGO } from "../../brand/publicBrandLogos";

const RAIL_MENU_ID = "se-admin-rail-menu";

const linkClass = ({ isActive }) =>
  `se-admin-nav-link${isActive ? " se-admin-nav-link--active" : ""}`;

const NavGroup = ({ label, children }) => (
  <div className="se-admin-nav-group">
    <p className="se-admin-nav-group__label">{label}</p>
    <div className="se-admin-nav-group__links">{children}</div>
  </div>
);

NavGroup.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const AdminShell = () => {
  const { logout, role } = useAuth();
  const canCreateArticle = role === "escritor" || role === "admin";
  const canSeeEditorial = role === "publicador" || role === "admin";
  const canManageUsers = role === "admin";
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const handleToggleMenu = useCallback(() => setMenuOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

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

          <nav className="se-admin-rail__nav">
            <NavGroup label="Contenido">
              <NavLink to="/admin/posts" className={linkClass} end onClick={closeMenu}>
                Artículos
              </NavLink>
              {canCreateArticle ? (
                <NavLink to="/admin/posts/new" className={linkClass} onClick={closeMenu}>
                  Nuevo artículo
                </NavLink>
              ) : null}
            </NavGroup>

            <NavGroup label="Taxonomía">
              <NavLink to="/admin/categories" className={linkClass} end onClick={closeMenu}>
                Categorías
              </NavLink>
              <NavLink to="/admin/tags" className={linkClass} end onClick={closeMenu}>
                Etiquetas
              </NavLink>
            </NavGroup>

            {canSeeEditorial ? (
              <NavGroup label="Editorial">
                <NavLink to="/admin/headlines" className={linkClass} end onClick={closeMenu}>
                  Titulares
                </NavLink>
                <NavLink to="/admin/comments" className={linkClass} end onClick={closeMenu}>
                  Comentarios
                </NavLink>
                <NavLink to="/admin/submissions" className={linkClass} end onClick={closeMenu}>
                  Envíos
                </NavLink>
              </NavGroup>
            ) : null}

            <NavGroup label="Sistema">
              {canManageUsers ? (
                <NavLink to="/admin/users" className={linkClass} end onClick={closeMenu}>
                  Usuarios
                </NavLink>
              ) : null}
              <NavLink to="/admin/settings/collaboration" className={linkClass} end onClick={closeMenu}>
                Colaboración
              </NavLink>
              {canManageUsers ? (
                <NavLink to="/admin/staff" className={linkClass} end onClick={closeMenu}>
                  Personal
                </NavLink>
              ) : null}
              <NavLink to="/admin/perfil" className={linkClass} end onClick={closeMenu}>
                Mi perfil
              </NavLink>
            </NavGroup>
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
