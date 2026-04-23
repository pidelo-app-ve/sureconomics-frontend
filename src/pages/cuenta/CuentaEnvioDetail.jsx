import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { applyPageMeta } from "../../lib/seo";
import { formatSubmissionDate, submissionStatusLabel } from "../../lib/submissionDisplay";
import * as userMeService from "../../services/userMeService";
import { ErrorState, LoadingState, Pagination } from "../../components/content";

const PencilIcon = () => (
  <svg className="se-submission-detail__edit-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 20h9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7 21H3v-4l11.732-11.732z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CuentaEnvioDetail = () => {
  const { id } = useParams();
  const { isEmailVerified } = useUserAuth();
  const [state, setState] = useState({ status: "idle", submission: null, error: null });
  const [notesPage, setNotesPage] = useState(1);
  const [notesState, setNotesState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false);

  useEffect(() => {
    applyPageMeta({
      title: "Detalle de envío — Sur Economics",
      description: "Estado de su propuesta.",
      noindex: true,
    });
  }, []);

  const loadSubmission = useCallback(async () => {
    if (!id || !isEmailVerified) return;
    setState({ status: "loading", submission: null, error: null });
    try {
      const submission = await userMeService.getSubmissionById(id);
      setState({ status: "success", submission, error: null });
    } catch (err) {
      setState({ status: "error", submission: null, error: err });
    }
  }, [id, isEmailVerified]);

  const loadNotes = useCallback(async () => {
    if (!id || !isEmailVerified) return;
    setNotesState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const raw = await userMeService.listMySubmissionNotes(id, { page: notesPage, limit: 20 });
      const items =
        raw && typeof raw === "object" && Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? raw : [];
      const meta =
        raw && typeof raw === "object" && raw.meta && typeof raw.meta === "object"
          ? raw.meta
          : { page: notesPage, limit: 20, total: items.length, pages: 1 };
      setNotesState({ status: "success", items, meta, error: null });
    } catch (err) {
      setNotesState({ status: "error", items: [], meta: null, error: err });
    }
  }, [id, isEmailVerified, notesPage]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await loadSubmission();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [loadSubmission]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await loadNotes();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [loadNotes]);

  useEffect(() => {
    setFeaturedImageFailed(false);
  }, [id, state.submission?.featuredImageUrl]);

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
  const canEdit = String(s.status || "").toLowerCase() === "submitted";
  const statusLabel = submissionStatusLabel(s.status);
  const dateLabel = formatSubmissionDate(s.createdAt);
  const hasImageUrl = Boolean(s.featuredImageUrl && String(s.featuredImageUrl).trim());

  return (
    <div className="se-reader-dash__page">
      <p className="se-reader-page-lead" style={{ marginTop: 0 }}>
        <Link to="/cuenta/envios" className="se-link se-reader-backlink">
          ← Mis envíos
        </Link>
      </p>
      <article className="se-reader-article se-reader-card">
        <header className="se-submission-detail__head">
          <div className="se-submission-detail__title-row">
            <h1 className="se-reader-article__title">{s.title}</h1>
            {canEdit && id ? (
              <Link
                to={`/cuenta/envios/${encodeURIComponent(id)}/editar`}
                className="se-btn se-btn--secondary se-submission-detail__edit"
                aria-label="Editar envío"
              >
                <PencilIcon />
                <span>Editar</span>
              </Link>
            ) : null}
          </div>
          <p className="se-reader-article__meta">
            <span className="se-reader-subs__pill se-submission-detail__meta-pill">{statusLabel}</span>
            {dateLabel ? <span>{dateLabel}</span> : null}
          </p>
        </header>

        {hasImageUrl && !featuredImageFailed ? (
          <div className="se-submission-detail__media">
            <div className="se-submission-detail__media-thumb">
              <img
                src={s.featuredImageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setFeaturedImageFailed(true)}
              />
            </div>
            <div className="se-submission-detail__media-caption">
              <span>Imagen destacada</span>
              <a href={s.featuredImageUrl} className="se-link" rel="noopener noreferrer" target="_blank">
                Abrir original
              </a>
            </div>
          </div>
        ) : null}

        {hasImageUrl && featuredImageFailed ? (
          <p className="se-submission-detail__media-fallback" role="alert">
            No se pudo cargar la vista previa.{" "}
            <a href={s.featuredImageUrl} className="se-link" rel="noopener noreferrer" target="_blank">
              Abrir URL
            </a>
          </p>
        ) : null}

        {!hasImageUrl ? (
          <div className="se-submission-detail__media-placeholder">
            {canEdit ? (
              <>
                Sin imagen destacada.{" "}
                <Link to={id ? `/cuenta/envios/${encodeURIComponent(id)}/editar` : "#"} className="se-link">
                  Añadir en editar
                </Link>
              </>
            ) : (
              "Sin imagen destacada."
            )}
          </div>
        ) : null}

        <section className="se-submission-detail__section" aria-labelledby="submission-excerpt-label">
          <span id="submission-excerpt-label" className="se-submission-detail__section-label">
            Resumen
          </span>
          {s.excerpt && String(s.excerpt).trim() ? (
            <p className="se-reader-article__excerpt" style={{ marginTop: 0 }}>
              {s.excerpt}
            </p>
          ) : (
            <p className="se-submission-detail__empty">No añadió resumen.</p>
          )}
        </section>

        <section className="se-submission-detail__section" aria-labelledby="submission-content-label">
          <span id="submission-content-label" className="se-submission-detail__section-label">
            Contenido
          </span>
          {s.content && String(s.content).trim() ? (
            <div className="se-reader-article__body se-text-body">{s.content}</div>
          ) : (
            <p className="se-submission-detail__empty">No hay contenido en el cuerpo del envío.</p>
          )}
        </section>
      </article>

      <section
        className="se-reader-card se-submission-detail__notes"
        aria-label="Notas del equipo editorial"
      >
        <h2 className="se-submission-detail__notes-title">Notas del equipo editorial</h2>
        {!(notesState.status === "success" && notesState.items.length > 0) ? (
          <p className="se-submission-detail__notes-lead">
            Cuando el equipo deje comentarios sobre su propuesta, aparecerán aquí.
          </p>
        ) : null}

        {notesState.status === "loading" || notesState.status === "idle" ? (
          <LoadingState title="Cargando notas…" />
        ) : null}

        {notesState.status === "error" ? (
          <ErrorState title="No pudimos cargar las notas" error={notesState.error} onRetry={loadNotes} />
        ) : null}

        {notesState.status === "success" ? (
          notesState.items.length ? (
            <div className="se-submission-detail__note-list se-text-body">
              {notesState.items.map((n) => (
                <div key={n.id ?? `${n.created_at ?? ""}-${n.note ?? ""}`} className="se-submission-detail__note-item">
                  <p className="se-meta" style={{ marginTop: 0 }}>
                    {n.admin_user_name ? String(n.admin_user_name) : "Equipo editorial"}
                    {n.updated_at || n.created_at ? (
                      <span> · {formatSubmissionDate(String(n.updated_at ?? n.created_at))}</span>
                    ) : null}
                  </p>
                  <div className="se-text-body" style={{ whiteSpace: "pre-wrap" }}>
                    {String(n.note ?? "")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="se-text-body" style={{ margin: 0, color: "#64748b" }}>
              Todavía no hay notas.
            </p>
          )
        ) : null}

        {notesState.status === "success" && notesState.meta ? (
          <Pagination
            page={Number(notesState.meta.page ?? notesPage) || notesPage}
            totalPages={Number(notesState.meta.pages ?? 1) || 1}
            onPageChange={setNotesPage}
          />
        ) : null}
      </section>
    </div>
  );
};
