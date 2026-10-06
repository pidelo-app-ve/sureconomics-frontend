import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Enlace } from "../../components/Enlace";
import { useUserAuth } from "../../context/UserAuthContext";
import { BRAND } from "../../data/surEconomicsMock";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { useMetaPagina } from "../../i18n/useMetaPagina";
import { formatSubmissionDate, submissionStatusLabel } from "../../lib/submissionDisplay";
import * as userMeService from "../../services/userMeService";
import { ErrorState, LoadingState, Pagination } from "../../components/content";
import { useFlashMessage } from "../../hooks/useFlashMessage";

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
  const { t } = useIdioma();
  const { id } = useParams();
  const { isEmailVerified } = useUserAuth();
  const flash = useFlashMessage();
  const [state, setState] = useState({ status: "idle", submission: null, error: null });
  const [notesPage, setNotesPage] = useState(1);
  const [notesState, setNotesState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false);

  useMetaPagina({
    title: t("cuenta.envio.meta.titulo", { marca: BRAND.name }),
    description: t("cuenta.envio.meta.descripcion"),
    noindex: true,
  });

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
          <h1 className="se-reader-page-title">{t("cuenta.envio.titulo")}</h1>
          <p className="se-reader-page-lead">
            {t("cuenta.comun.verifiqueSuCorreo")}{" "}
            <Enlace to="/cuenta/verificar-email" className="se-link">
              {t("cuenta.comun.verificar")}
            </Enlace>
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <LoadingState title={t("cuenta.comun.cargandoEnvio")} />
      </div>
    );
  }

  if (state.status === "error" || !state.submission) {
    return (
      <div className="se-reader-dash__page se-reader-dash__page--center">
        <ErrorState title={t("cuenta.comun.noPudimosCargarEnvio")} error={state.error} />
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          <Enlace to="/cuenta/envios" className="se-link">
            {t("cuenta.envio.volverAEnvios")}
          </Enlace>
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
        <Enlace to="/cuenta/envios" className="se-link se-reader-backlink">
          ← {t("cuenta.envio.misEnvios")}
        </Enlace>
      </p>
      {flash ? (
        <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
          {flash}
        </p>
      ) : null}
      <article className="se-reader-article se-reader-card">
        <header className="se-submission-detail__head">
          <div className="se-submission-detail__title-row">
            <h1 className="se-reader-article__title">{s.title}</h1>
            {canEdit && id ? (
              <Enlace
                to={`/cuenta/envios/${encodeURIComponent(id)}/editar`}
                className="se-btn se-btn--secondary se-submission-detail__edit"
                aria-label={t("cuenta.envio.editarEnvio")}
              >
                <PencilIcon />
                <span>{t("cuenta.envio.editar")}</span>
              </Enlace>
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
              <span>{t("cuenta.envio.imagenDestacada")}</span>
              <a href={s.featuredImageUrl} className="se-link" rel="noopener noreferrer" target="_blank">
                {t("cuenta.envio.abrirOriginal")}
              </a>
            </div>
          </div>
        ) : null}

        {hasImageUrl && featuredImageFailed ? (
          <p className="se-submission-detail__media-fallback" role="alert">
            {t("cuenta.envio.sinVistaPrevia")}{" "}
            <a href={s.featuredImageUrl} className="se-link" rel="noopener noreferrer" target="_blank">
              {t("cuenta.envio.abrirUrl")}
            </a>
          </p>
        ) : null}

        {!hasImageUrl ? (
          <div className="se-submission-detail__media-placeholder">
            {canEdit ? (
              <>
                {t("cuenta.envio.sinImagen")}{" "}
                <Enlace to={id ? `/cuenta/envios/${encodeURIComponent(id)}/editar` : "#"} className="se-link">
                  {t("cuenta.envio.anadirEnEditar")}
                </Enlace>
              </>
            ) : (
              t("cuenta.envio.sinImagen")
            )}
          </div>
        ) : null}

        <section className="se-submission-detail__section" aria-labelledby="submission-excerpt-label">
          <span id="submission-excerpt-label" className="se-submission-detail__section-label">
            {t("cuenta.envio.resumen")}
          </span>
          {s.excerpt && String(s.excerpt).trim() ? (
            <p className="se-reader-article__excerpt" style={{ marginTop: 0 }}>
              {s.excerpt}
            </p>
          ) : (
            <p className="se-submission-detail__empty">{t("cuenta.envio.sinResumen")}</p>
          )}
        </section>

        <section className="se-submission-detail__section" aria-labelledby="submission-content-label">
          <span id="submission-content-label" className="se-submission-detail__section-label">
            {t("cuenta.envio.contenido")}
          </span>
          {s.content && String(s.content).trim() ? (
            <div className="se-reader-article__body se-text-body">{s.content}</div>
          ) : (
            <p className="se-submission-detail__empty">{t("cuenta.envio.sinContenido")}</p>
          )}
        </section>
      </article>

      <section
        className="se-reader-card se-submission-detail__notes"
        aria-label={t("cuenta.envio.notasTitulo")}
      >
        <h2 className="se-submission-detail__notes-title">{t("cuenta.envio.notasTitulo")}</h2>
        {!(notesState.status === "success" && notesState.items.length > 0) ? (
          <p className="se-submission-detail__notes-lead">
            {t("cuenta.envio.notasLead")}
          </p>
        ) : null}

        {notesState.status === "loading" || notesState.status === "idle" ? (
          <LoadingState title={t("cuenta.envio.cargandoNotas")} />
        ) : null}

        {notesState.status === "error" ? (
          <ErrorState title={t("cuenta.envio.noPudimosCargarNotas")} error={notesState.error} onRetry={loadNotes} />
        ) : null}

        {notesState.status === "success" ? (
          notesState.items.length ? (
            <div className="se-submission-detail__note-list se-text-body">
              {notesState.items.map((n) => (
                <div key={n.id ?? `${n.created_at ?? ""}-${n.note ?? ""}`} className="se-submission-detail__note-item">
                  <p className="se-meta" style={{ marginTop: 0 }}>
                    {n.admin_user_name ? String(n.admin_user_name) : t("cuenta.envio.equipoEditorial")}
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
            <p className="se-text-body se-submission-detail__notes-empty">{t("cuenta.envio.sinNotas")}</p>
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
