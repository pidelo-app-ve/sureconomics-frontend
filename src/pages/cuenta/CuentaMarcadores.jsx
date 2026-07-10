import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";
import * as userMeService from "../../services/userMeService";
import { Pagination } from "../../components/content/Pagination";
import { ErrorState, LoadingState } from "../../components/content";

export const CuentaMarcadores = () => {
  const { isEmailVerified } = useUserAuth();
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  const handleLoad = useCallback(async (page = 1) => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await userMeService.getMyBookmarks({ page, limit: 10 });
      setState({ status: "success", data, error: null });
    } catch (err) {
      setState({ status: "error", data: null, error: err });
    }
  }, []);

  useEffect(() => {
    applyPageMeta({
      title: "Marcadores — SurEconomics",
      description: "Artículos guardados.",
      noindex: true,
    });
  }, []);

  useEffect(() => {
    if (!isEmailVerified) return;
    handleLoad(1);
  }, [handleLoad, isEmailVerified]);

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">Marcadores</h1>
          <p className="se-reader-page-lead">
            Verifique su correo para ver sus marcadores.{" "}
            <Link to="/cuenta/verificar-email" className="se-link">
              Verificar
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <LoadingState title="Cargando marcadores…" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title="No pudimos cargar los marcadores" error={state.error} onRetry={() => handleLoad(1)} />
      </div>
    );
  }

  const items = state.data?.items ?? [];

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head">
        <h1 className="se-reader-page-title">Marcadores</h1>
        <p className="se-reader-page-lead">Artículos que ha guardado para volver a ellos.</p>
      </header>

      {items.length === 0 ? (
        <div className="se-reader-empty se-reader-card">
          <p className="se-reader-empty__title">Aún no hay marcadores</p>
          <p className="se-reader-empty__text">Explore artículos y pulse guardar cuando le interese uno.</p>
          <Link to="/articulos" className="se-btn se-btn--secondary">
            Ver artículos
          </Link>
        </div>
      ) : (
        <ul className="se-reader-marks">
          {items.map((post) => (
            <li key={post.id || post.slug} className="se-reader-marks__item">
              <Link to={`/articulo/${encodeURIComponent(post.slug)}`} className="se-reader-marks__link">
                <span className="se-reader-marks__accent" aria-hidden="true" />
                <span className="se-reader-marks__body">
                  <span className="se-reader-marks__title">{post.title || post.slug}</span>
                  {post.excerpt ? (
                    <span className="se-reader-marks__excerpt">{post.excerpt}</span>
                  ) : null}
                </span>
                <span className="se-reader-marks__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="se-reader-pagination-wrap">
        <Pagination
          page={state.data?.page ?? 1}
          totalPages={state.data?.totalPages ?? 1}
          onPageChange={(p) => handleLoad(p)}
        />
      </div>
    </div>
  );
};
