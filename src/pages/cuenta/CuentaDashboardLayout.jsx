import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { RequireUserAuth } from "../../components/cuenta/RequireUserAuth";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND_PUBLIC_LOGO } from "../../brand/publicBrandLogos";

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

const RAIL_NAV = [
  { to: "/cuenta", end: true, label: "Inicio", icon: IconGrid },
  { to: "/cuenta/perfil", label: "Mi perfil", icon: IconUser },
  { to: "/cuenta/marcadores", label: "Marcadores", icon: IconBookmark },
  { to: "/cuenta/envios", label: "Envíos", icon: IconSend },
];

const DashboardShell = () => {
  const { profile, logout } = useUserAuth();
  const location = useLocation();
  const [railOpen, setRailOpen] = useState(false);

  const handleCloseRail = useCallback(() => setRailOpen(false), []);

  useEffect(() => {
    handleCloseRail();
  }, [location.pathname, handleCloseRail]);

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
      <div className="se-reader-dash__aurora" aria-hidden="true" />
      {railOpen ? (
        <button
          type="button"
          className="se-reader-dash__scrim"
          aria-label="Cerrar menú"
          onClick={handleCloseRail}
        />
      ) : null}

      <aside
        id="reader-dash-rail"
        className={`se-reader-dash__rail${railOpen ? " se-reader-dash__rail--open" : ""}`}
      >
        <div className="se-reader-dash__rail-brand">
          <Link to="/" className="se-reader-dash__rail-logo" onClick={handleCloseRail}>
            <span className="se-reader-dash__rail-logo-stack" aria-hidden="true">
              <img
                className="se-reader-dash__rail-logo-iso"
                src={BRAND_PUBLIC_LOGO.dark.isotypeWithBox}
                alt=""
                width={40}
                height={40}
                decoding="async"
              />
              <img
                className="se-reader-dash__rail-logo-word"
                src={BRAND_PUBLIC_LOGO.dark.wordmarkNoTagline}
                alt=""
                width={200}
                height={48}
                decoding="async"
              />
            </span>
            <span className="se-sr-only">SurEconomics — inicio</span>
          </Link>
          <span className="se-reader-dash__rail-tag">Lector</span>
        </div>

        <nav className="se-reader-dash__nav" aria-label="Área de lector">
          {RAIL_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              className={navClass}
              onClick={handleCloseRail}
            >
              <span className="se-reader-dash__nav-ico" aria-hidden="true">
                <Icon />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="se-reader-dash__rail-footer">
          <p className="se-reader-dash__rail-email" title={profile?.email ?? ""}>
            {profile?.email || "Sesión activa"}
          </p>
          <button type="button" className="se-reader-dash__logout" onClick={handleLogout}>
            Cerrar sesión
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
            aria-label={railOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
          >
            <span />
            <span />
            <span />
          </button>
          <Link
            to="/"
            className="se-reader-dash__topbar-home"
            onClick={handleCloseRail}
            aria-label="SurEconomics — inicio"
          >
            <img
              className="se-reader-dash__topbar-home-img"
              src={BRAND_PUBLIC_LOGO.light.isotypeWithBox}
              alt=""
              width={28}
              height={28}
              decoding="async"
            />
          </Link>
          <div className="se-reader-dash__topbar-meta">
            <span className="se-reader-dash__topbar-title">Su espacio</span>
            {profile?.email ? (
              <span className="se-reader-dash__topbar-sub">{profile.email}</span>
            ) : null}
          </div>
          <Link to="/" className="se-reader-dash__topbar-site" onClick={handleCloseRail}>
            Volver al sitio
          </Link>
        </header>

        <main className="se-reader-dash__main" id="reader-dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const CuentaDashboardLayout = () => (
  <RequireUserAuth>
    <DashboardShell />
  </RequireUserAuth>
);
