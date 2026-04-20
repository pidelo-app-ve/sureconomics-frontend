import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";
import * as userMeService from "../../services/userMeService";
import { ErrorState, LoadingState } from "../../components/content";

export const CuentaEnvioDetail = () => {
  const { id } = useParams();
  const { isEmailVerified } = useUserAuth();
  const [state, setState] = useState({ status: "idle", submission: null, error: null });

  useEffect(() => {
    applyPageMeta({
      title: "Detalle de envío — Sur Economics",
      description: "Estado de su propuesta.",
      noindex: true,
    });
  }, []);

  useEffect(() => {
    if (!id || !isEmailVerified) return;
    let cancelled = false;
    const run = async () => {
      setState({ status: "loading", submission: null, error: null });
      try {
        const submission = await userMeService.getSubmissionById(id);
        if (!cancelled) {
          setState({ status: "success", submission, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ status: "error", submission: null, error: err });
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id, isEmailVerified]);

  if (!isEmailVerified) {
    return (
      <div className="se-reader-dash__page">
        <div className="se-reader-card se-reader-card--narrow">
          <h1 className="se-reader-page-title">Envío</h1>
          <p className="se-reader-page-lead">
            Verifique su correo.{" "}
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
        <LoadingState title="Cargando envío…" />
      </div>
    );
  }

  if (state.status === "error" || !state.submission) {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title="No pudimos cargar el envío" error={state.error} />
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          <Link to="/cuenta/envios" className="se-link">
            Volver a envíos
          </Link>
        </p>
      </div>
    );
  }

  const s = state.submission;

  return (
    <div className="se-reader-dash__page">
      <p className="se-reader-page-lead" style={{ marginTop: 0 }}>
        <Link to="/cuenta/envios" className="se-link se-reader-backlink">
          ← Mis envíos
        </Link>
      </p>
      <article className="se-reader-article se-reader-card">
        <header className="se-reader-article__head">
          <h1 className="se-reader-article__title">{s.title}</h1>
          <p className="se-reader-article__meta">
            <span className="se-reader-subs__pill">{s.status}</span>
            {s.createdAt ? <span>{s.createdAt}</span> : null}
          </p>
        </header>
        {s.excerpt ? <p className="se-reader-article__excerpt">{s.excerpt}</p> : null}
        <div className="se-reader-article__body se-text-body">{s.content}</div>
        {s.featuredImageUrl ? (
          <p className="se-reader-article__foot">
            <a href={s.featuredImageUrl} className="se-link" rel="noopener noreferrer" target="_blank">
              Imagen destacada
            </a>
          </p>
        ) : null}
      </article>
    </div>
  );
};
