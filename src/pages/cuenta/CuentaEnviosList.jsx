import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";
import * as userMeService from "../../services/userMeService";
import { Pagination } from "../../components/content/Pagination";
import { ErrorState, LoadingState } from "../../components/content";
import { submissionStatusLabel } from "../../lib/submissionDisplay";
import { useFlashMessage } from "../../hooks/useFlashMessage";

export const CuentaEnviosList = () => {
  const { isEmailVerified } = useUserAuth();
  const flash = useFlashMessage();
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  const handleLoad = useCallback(async (page = 1) => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await userMeService.listMySubmissions({ page, limit: 10 });
      setState({ status: "success", data, error: null });
    } catch (err) {
      setState({ status: "error", data: null, error: err });
    }
  }, []);

  useEffect(() => {
    applyPageMeta({
      title: "Mis envíos — Sur Economics",
      description: "Propuestas editoriales enviadas.",
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
          <h1 className="se-reader-page-title">Mis envíos</h1>
          <p className="se-reader-page-lead">
            Verifique su correo para enviar propuestas.{" "}
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
        <LoadingState title="Cargando envíos…" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title="No pudimos cargar los envíos" error={state.error} onRetry={() => handleLoad(1)} />
      </div>
    );
  }

  const items = state.data?.items ?? [];

  return (
    <div className="se-reader-dash__page">
      <header className="se-reader-page-head se-reader-page-head--row">
        <div>
          <h1 className="se-reader-page-title">Mis envíos</h1>
          <p className="se-reader-page-lead">Propuestas editoriales y su estado.</p>
        </div>
        <Link to="/cuenta/envios/nuevo" className="se-btn">
          Nuevo envío
        </Link>
      </header>

      {flash ? (
        <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
          {flash}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="se-reader-empty se-reader-card">
          <p className="se-reader-empty__title">Sin envíos todavía</p>
          <p className="se-reader-empty__text">Comparta una idea o borrador con el equipo editorial.</p>
          <Link to="/cuenta/envios/nuevo" className="se-btn">
            Crear primer envío
          </Link>
        </div>
      ) : (
        <ul className="se-reader-subs">
          {items.map((s) => (
            <li key={s.id} className="se-reader-subs__item">
              <Link to={`/cuenta/envios/${encodeURIComponent(s.id)}`} className="se-reader-subs__link">
                <span className="se-reader-subs__dot" aria-hidden="true" />
                <span className="se-reader-subs__main">
                  <span className="se-reader-subs__title">{s.title || `Envío ${s.id}`}</span>
                  <span className="se-reader-subs__meta">
                    <span className="se-reader-subs__pill">{s.status ? submissionStatusLabel(s.status) : "—"}</span>
                    {s.createdAt ? <span>{s.createdAt}</span> : null}
                  </span>
                </span>
                <span className="se-reader-subs__arrow" aria-hidden="true">
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
