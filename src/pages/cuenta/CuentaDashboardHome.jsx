import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";
import * as userMeService from "../../services/userMeService";

export const CuentaDashboardHome = () => {
  const { profile, isEmailVerified, loadProfile } = useUserAuth();
  const [stats, setStats] = useState({
    status: "idle",
    bookmarks: null,
    submissions: null,
  });

  useEffect(() => {
    applyPageMeta({
      title: "Mi espacio — Sur Economics",
      description: "Panel de lector: perfil, marcadores y envíos.",
      noindex: true,
    });
  }, []);

  useEffect(() => {
    loadProfile().catch(() => {});
  }, [loadProfile]);

  useEffect(() => {
    if (!isEmailVerified) return;
    let cancelled = false;
    const run = async () => {
      setStats((s) => ({ ...s, status: "loading" }));
      try {
        const [bm, subs] = await Promise.all([
          userMeService.getMyBookmarks({ page: 1, limit: 1 }),
          userMeService.listMySubmissions({ page: 1, limit: 1 }),
        ]);
        if (!cancelled) {
          setStats({
            status: "success",
            bookmarks: typeof bm.total === "number" ? bm.total : bm.items?.length ?? 0,
            submissions:
              typeof subs.total === "number" ? subs.total : subs.items?.length ?? 0,
          });
        }
      } catch {
        if (!cancelled) {
          setStats({ status: "error", bookmarks: null, submissions: null });
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isEmailVerified]);

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-home__verify se-reader-card">
          <h1 className="se-reader-home__verify-title">Verifique su correo</h1>
          <p className="se-reader-home__verify-text">
            Active su cuenta para usar marcadores, envíos y el perfil completo.
          </p>
          <Link
            to="/cuenta/verificar-email"
            className="se-btn"
            state={{ email: profile?.email }}
          >
            Verificar correo
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.email?.split("@")[0]?.replace(/\./g, " ")?.trim() ||
    "Lector";

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-home__hero">
        <div className="se-reader-home__hero-copy">
          <p className="se-reader-home__kicker">Bienvenido</p>
          <h1 className="se-reader-home__title">
            Hola, <span className="se-reader-home__accent">{displayName}</span>
          </h1>
          <p className="se-reader-home__lead">
            Un solo lugar para su perfil, artículos guardados y propuestas editoriales.
          </p>
        </div>
        <div className="se-reader-home__hero-art" aria-hidden="true">
          <div className="se-reader-home__orb se-reader-home__orb--a" />
          <div className="se-reader-home__orb se-reader-home__orb--b" />
          <div className="se-reader-home__orb se-reader-home__orb--c" />
        </div>
      </header>

      <section className="se-reader-home__cards" aria-label="Accesos rápidos">
        <Link to="/cuenta/perfil" className="se-reader-home__card se-reader-home__card--profile">
          <span className="se-reader-home__card-icon" aria-hidden="true">
            ◎
          </span>
          <h2 className="se-reader-home__card-title">Mi perfil</h2>
          <p className="se-reader-home__card-desc">Datos de contacto y preferencias.</p>
          <span className="se-reader-home__card-cta">Abrir →</span>
        </Link>

        <Link to="/cuenta/marcadores" className="se-reader-home__card se-reader-home__card--marks">
          <span className="se-reader-home__card-icon" aria-hidden="true">
            ★
          </span>
          <h2 className="se-reader-home__card-title">Marcadores</h2>
          <p className="se-reader-home__card-desc">
            {stats.status === "loading"
              ? "Cargando…"
              : stats.bookmarks != null
                ? `${stats.bookmarks} artículo${stats.bookmarks === 1 ? "" : "s"} guardado${stats.bookmarks === 1 ? "" : "s"}.`
                : "Artículos que ha guardado para leer después."}
          </p>
          <span className="se-reader-home__card-cta">Ver lista →</span>
        </Link>

        <Link to="/cuenta/envios" className="se-reader-home__card se-reader-home__card--subs">
          <span className="se-reader-home__card-icon" aria-hidden="true">
            ✦
          </span>
          <h2 className="se-reader-home__card-title">Envíos</h2>
          <p className="se-reader-home__card-desc">
            {stats.status === "loading"
              ? "Cargando…"
              : stats.submissions != null
                ? `${stats.submissions} propuesta${stats.submissions === 1 ? "" : "s"} registrada${stats.submissions === 1 ? "" : "s"}.`
                : "Propuestas enviadas al equipo editorial."}
          </p>
          <span className="se-reader-home__card-cta">Gestionar →</span>
        </Link>
      </section>
    </div>
  );
};
