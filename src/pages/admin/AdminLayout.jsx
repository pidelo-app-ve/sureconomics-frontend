import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";

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

export const AdminLayout = () => {
  const { logout } = useAuth();
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
        <span className="se-admin-mobile-bar__title">Sur Economics · Admin</span>
        <Link to="/" className="se-admin-mobile-bar__site" onClick={closeMenu}>
          Sitio
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
            <span className="se-admin-rail__logo">Sur Economics</span>
            <span className="se-admin-rail__badge">Admin</span>
          </div>

          <nav className="se-admin-rail__nav">
            <NavGroup label="Contenido">
              <NavLink to="/admin/posts" className={linkClass} end onClick={closeMenu}>
                Artículos
              </NavLink>
              <NavLink to="/admin/posts/new" className={linkClass} onClick={closeMenu}>
                Nuevo artículo
              </NavLink>
            </NavGroup>

            <NavGroup label="Taxonomía">
              <NavLink to="/admin/categories" className={linkClass} end onClick={closeMenu}>
                Categorías
              </NavLink>
              <NavLink to="/admin/tags" className={linkClass} end onClick={closeMenu}>
                Etiquetas
              </NavLink>
            </NavGroup>

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

            <NavGroup label="Sistema">
              <NavLink to="/admin/users" className={linkClass} end onClick={closeMenu}>
                Usuarios
              </NavLink>
              <NavLink to="/admin/settings/collaboration" className={linkClass} end onClick={closeMenu}>
                Colaboración
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
    </div>
  );
};
