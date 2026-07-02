import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  buildSubmissionAuthorBoard,
  resolveSubmissionAuthorUserIdFromNormalized,
  unwrapEnvelope,
} from "../../lib/adminSubmissionAuthor";
import { applyAdminSubmissionWorkflow, getAdminSubmission } from "../../services/adminSubmissionsService";
import { getAdminUser } from "../../services/adminUsersService";
import { ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import {
  formatSubmissionDate,
  submissionStatusCssModifier,
  submissionStatusLabel,
} from "../../lib/submissionDisplay";
import {
  createAdminSubmissionNote,
  deleteAdminSubmissionNote,
  listAdminSubmissionNotes,
  patchAdminSubmissionNote,
} from "../../services/adminSubmissionNotesService";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";

const normalizeStatusForSelect = (value) => {
  const s = String(value || "").toLowerCase();
  if (s === "approved") return "accepted";
  return s;
};

export const AdminSubmissionDetail = () => {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [status, setStatus] = useState("pending");
  const [saveState, setSaveState] = useState({ status: "idle", error: null, message: "", publishedSlug: null });
  const [notesPage, setNotesPage] = useState(1);
  const [notesState, setNotesState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [newNote, setNewNote] = useState("");
  const [createState, setCreateState] = useState({ status: "idle", error: null });
  const [editing, setEditing] = useState({ noteId: null, value: "" });
  const [updateState, setUpdateState] = useState({ status: "idle", error: null });
  const [deleteState, setDeleteState] = useState({ status: "idle", error: null, noteId: null });
  const [notesFeedback, setNotesFeedback] = useState({ status: "idle", message: "" });
  const [featuredImageFailed, setFeaturedImageFailed] = useState(false);
  const [authorUser, setAuthorUser] = useState(null);
  const [authorUserLoad, setAuthorUserLoad] = useState({ status: "idle", error: null });
  const { confirm, ConfirmDialog } = useAdminConfirm();

  const numericId = useMemo(() => {
    if (!id) return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  }, [id]);

  const load = useCallback(async () => {
    if (!numericId) return;
    setLoadState({ status: "loading", error: null });
    setRow(null);
    try {
      const data = await getAdminSubmission(numericId);
      setRow(data);
      setStatus(normalizeStatusForSelect(adminPick(data, ["status"], "pending") || "pending"));
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, [numericId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadNotes = useCallback(async () => {
    if (!numericId) return;
    setNotesState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminSubmissionNotes(numericId, { page: notesPage, limit: 20 });
      setNotesState({ status: "success", items, meta, error: null });
    } catch (err) {
      setNotesState({ status: "error", items: [], meta: null, error: err });
    }
  }, [notesPage, numericId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    applyPageMeta({ title: `Admin — Envío #${id ?? ""}`, description: "Revisión de envío.", noindex: true });
  }, [id]);

  useEffect(() => {
    if (!row || typeof row !== "object") {
      setAuthorUser(null);
      setAuthorUserLoad({ status: "idle", error: null });
      return;
    }
    const submissionNorm = unwrapEnvelope(row) ?? row;
    const uid = resolveSubmissionAuthorUserIdFromNormalized(
      submissionNorm && typeof submissionNorm === "object" ? submissionNorm : null,
      null
    );
    if (!uid) {
      setAuthorUser(null);
      setAuthorUserLoad({ status: "success", error: null });
      return;
    }
    let cancelled = false;
    setAuthorUser(null);
    setAuthorUserLoad({ status: "loading", error: null });
    getAdminUser(uid)
      .then((data) => {
        if (!cancelled) {
          const normalized = unwrapEnvelope(data) ?? data;
          setAuthorUser(normalized && typeof normalized === "object" ? normalized : null);
          setAuthorUserLoad({ status: "success", error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAuthorUser(null);
          setAuthorUserLoad({ status: "error", error: err });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [row]);

  const imgFromRow = row ? adminPick(row, ["featured_image_url", "featuredImageUrl"], "") : "";
  useEffect(() => {
    setFeaturedImageFailed(false);
  }, [numericId, imgFromRow]);

  const authorBoard = useMemo(() => {
    const b = buildSubmissionAuthorBoard(row, authorUser);
    return {
      ...b,
      rows: b.rows.filter((r) => !(r.label === "Nombre" && r.value === b.displayName)),
    };
  }, [row, authorUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!numericId) return;
    const normalized = String(status || "").toLowerCase();
    if (!["under_review", "accepted", "rejected"].includes(normalized)) {
      setSaveState({
        status: "error",
        error: new Error(
          "Solo se puede guardar como En revisión, Aceptado o Rechazado. Elija uno de esos estados para aplicar la transición en el servidor."
        ),
        message: "",
        publishedSlug: null,
      });
      return;
    }
    setSaveState({ status: "loading", error: null, message: "", publishedSlug: null });
    try {
      const updated = await applyAdminSubmissionWorkflow(numericId, normalized);
      setRow(updated);
      const newStatus = adminPick(updated, ["status"], normalized) || normalized;
      setStatus(normalizeStatusForSelect(newStatus));
      const message =
        normalized === "accepted"
          ? "Estado cambiado a Aprobado. El artículo se publicó correctamente."
          : `Estado cambiado a ${submissionStatusLabel(normalized === "under_review" ? "under_review" : "rejected")}.`;
      const publishedSlug =
        normalized === "accepted" ? adminPick(updated, ["published_post_slug"], null) : null;
      setSaveState({ status: "success", error: null, message, publishedSlug: publishedSlug || null });
    } catch (err) {
      setSaveState({ status: "error", error: err, message: "", publishedSlug: null });
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!numericId) return;
    const trimmed = newNote.trim();
    if (!trimmed) return;

    setCreateState({ status: "loading", error: null });
    setNotesFeedback({ status: "idle", message: "" });
    try {
      await createAdminSubmissionNote(numericId, { note: trimmed });
      setNewNote("");
      setCreateState({ status: "success", error: null });
      await loadNotes();
      setNotesFeedback({ status: "success", message: "Nota agregada correctamente." });
    } catch (err) {
      setCreateState({ status: "error", error: err });
    }
  };

  const handleStartEdit = (note) => {
    setUpdateState({ status: "idle", error: null });
    setEditing({ noteId: note?.id ?? null, value: String(note?.note ?? "") });
  };

  const handleCancelEdit = () => {
    setUpdateState({ status: "idle", error: null });
    setEditing({ noteId: null, value: "" });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!numericId || !editing.noteId) return;
    const trimmed = editing.value.trim();
    if (!trimmed) return;

    setUpdateState({ status: "loading", error: null });
    setNotesFeedback({ status: "idle", message: "" });
    try {
      await patchAdminSubmissionNote(numericId, editing.noteId, { note: trimmed });
      setUpdateState({ status: "success", error: null });
      setEditing({ noteId: null, value: "" });
      await loadNotes();
      setNotesFeedback({ status: "success", message: "Nota actualizada correctamente." });
    } catch (err) {
      setUpdateState({ status: "error", error: err });
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!numericId || !noteId) return;
    setNotesFeedback({ status: "idle", message: "" });
    const ok = await confirm({
      title: "Eliminar nota",
      description: `¿Eliminar esta nota (ID ${noteId})?`,
      confirmLabel: "Eliminar nota",
      onConfirm: async () => {
        setDeleteState({ status: "loading", error: null, noteId });
        await deleteAdminSubmissionNote(numericId, noteId);
        setDeleteState({ status: "success", error: null, noteId: null });
        setNotesFeedback({ status: "success", message: "Nota eliminada correctamente." });
        if (editing.noteId === noteId) {
          setEditing({ noteId: null, value: "" });
        }
        await loadNotes();
      },
    });
    if (!ok) return;
  };

  if (loadState.status === "loading") {
    return (
      <main role="main" className="se-admin-submission-detail">
        <LoadingState title="Cargando envío…" />
      </main>
    );
  }

  if (loadState.status === "error" || !row) {
    return (
      <main role="main" className="se-admin-submission-detail">
        <ErrorState title="No se pudo cargar el envío" error={loadState.error} onRetry={load} />
        <p className="se-admin-submission-detail__stack">
          <Link to="/admin/submissions" className="se-link">
            Volver al listado
          </Link>
        </p>
      </main>
    );
  }

  const title = adminPick(row, ["title"], "(sin título)");
  const excerpt = adminPick(row, ["excerpt", "summary"], "");
  const content = adminPick(row, ["content", "body"], "");
  const img = adminPick(row, ["featured_image_url", "featuredImageUrl"], "");
  const rowStatus = adminPick(row, ["status"], "");
  const statusLabel = submissionStatusLabel(rowStatus);
  const statusMod = submissionStatusCssModifier(rowStatus);
  const createdRaw = adminPick(row, ["created_at", "createdAt"], "");
  const dateLabel =
    createdRaw && createdRaw !== "—" ? formatSubmissionDate(createdRaw) : "";
  const hasImageUrl = Boolean(img && img !== "—" && String(img).trim());
  const excerptTrim = excerpt && excerpt !== "—" ? String(excerpt).trim() : "";
  const contentTrim = content && content !== "—" ? String(content).trim() : "";

  return (
    <main role="main" className="se-admin-submission-detail">
      <Link to="/admin/submissions" className="se-link se-admin-submission-detail__back">
        ← Envíos colaborativos
      </Link>

      <section className="se-admin-submission-detail__author-board" aria-labelledby="submission-author-heading">
        <div className="se-admin-submission-detail__author-board-head">
          <div className="se-admin-submission-detail__author-avatar" aria-hidden="true">
            {authorBoard.initials}
          </div>
          <div className="se-admin-submission-detail__author-board-intro">
            <p id="submission-author-heading" className="se-admin-submission-detail__author-board-kicker">
              Autor del envío
            </p>
            <p className="se-admin-submission-detail__author-board-name">
              {authorBoard.displayName || "Sin nombre en el perfil"}
            </p>
            <div className="se-admin-submission-detail__author-board-actions">
              {authorBoard.adminUserHref ? (
                <Link to={authorBoard.adminUserHref} className="se-btn se-btn--secondary">
                  Ver ficha de usuario
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {authorUserLoad.status === "loading" && authorBoard.userId ? (
          <p className="se-admin-submission-detail__author-board-foot" role="status">
            Cargando perfil completo…
          </p>
        ) : null}
        {authorUserLoad.status === "error" ? (
          <p className="se-admin-login__error se-admin-submission-detail__inline-alert" role="alert">
            {authorUserLoad.error instanceof Error
              ? authorUserLoad.error.message
              : "No se pudo cargar el usuario en administración."}
          </p>
        ) : null}

        {authorBoard.rows.length > 0 ? (
          <dl className="se-admin-submission-detail__author-grid">
            {authorBoard.rows.map((r) => (
              <div key={r.label} className="se-admin-submission-detail__author-cell">
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : authorUserLoad.status !== "loading" ? (
          <p className="se-admin-submission-detail__author-board-foot">
            No hay información de contacto del autor en la respuesta del servidor para este envío.
          </p>
        ) : null}
      </section>

      <div className="se-admin-submission-detail__grid">
        <article className="se-admin-submission-detail__surface">
          <header className="se-admin-submission-detail__head">
            <div className="se-admin-submission-detail__title-row">
              <h1 className="se-heading-section">{title}</h1>
              {id ? <span className="se-admin-submission-detail__id-chip">#{id}</span> : null}
            </div>
            <div className="se-admin-submission-detail__meta-row">
              <span className={`se-admin-submissions__status se-admin-submissions__status--${statusMod}`}>
                {statusLabel}
              </span>
              {dateLabel ? <span className="se-admin-submission-detail__date">{dateLabel}</span> : null}
            </div>
          </header>

          {hasImageUrl && !featuredImageFailed ? (
            <div className="se-admin-submission-detail__media">
              <div className="se-admin-submission-detail__media-thumb">
                <img src={img} alt="" loading="lazy" decoding="async" onError={() => setFeaturedImageFailed(true)} />
              </div>
              <div className="se-admin-submission-detail__media-caption">
                <span>Imagen destacada</span>
                <a href={img} className="se-link" target="_blank" rel="noopener noreferrer">
                  Abrir original
                </a>
              </div>
            </div>
          ) : null}

          {hasImageUrl && featuredImageFailed ? (
            <p className="se-admin-submission-detail__media-fallback" role="alert">
              No se pudo cargar la vista previa.{" "}
              <a href={img} className="se-link" target="_blank" rel="noopener noreferrer">
                Abrir URL
              </a>
            </p>
          ) : null}

          {!hasImageUrl ? (
            <p className="se-admin-submission-detail__media-placeholder">Sin imagen destacada.</p>
          ) : null}

          <section className="se-admin-submission-detail__section" aria-labelledby="adm-sub-excerpt">
            <span id="adm-sub-excerpt" className="se-admin-submission-detail__section-label">
              Resumen
            </span>
            {excerptTrim ? (
              <p className="se-text-body se-admin-submission-detail__excerpt">
                {excerptTrim}
              </p>
            ) : (
              <p className="se-admin-submission-detail__empty">Sin resumen.</p>
            )}
          </section>

          <section className="se-admin-submission-detail__section" aria-labelledby="adm-sub-content">
            <span id="adm-sub-content" className="se-admin-submission-detail__section-label">
              Contenido
            </span>
            {contentTrim ? (
              <div className="se-admin-submission-detail__body">{contentTrim}</div>
            ) : (
              <p className="se-admin-submission-detail__empty">Sin contenido en el cuerpo.</p>
            )}
          </section>
        </article>

        <aside className="se-admin-submission-detail__panel se-admin-submission-detail__panel--sticky">
          <h2 className="se-admin-submission-detail__panel-title">Revisión</h2>
          <form className="se-contact-form" onSubmit={handleSave}>
            {saveState.status === "error" ? (
              <p className="se-admin-login__error" role="alert">
                {saveState.error instanceof Error ? saveState.error.message : "Error al guardar."}
              </p>
            ) : null}
            {saveState.status === "success" ? (
              <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
                {saveState.message || "Estado actualizado."}
                {saveState.publishedSlug ? (
                  <>
                    {" "}
                    <Link to={`/articulo/${encodeURIComponent(saveState.publishedSlug)}`} className="se-link">
                      Ver artículo publicado
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}

            <label className="se-form-field" htmlFor="rev-status">
              <span className="se-form-label">Estado del flujo</span>
              <select id="rev-status" className="se-form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="submitted">Enviado</option>
                <option value="pending">Pendiente</option>
                <option value="under_review">En revisión</option>
                <option value="accepted">Aceptado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </label>
            <button type="submit" className="se-btn" disabled={saveState.status === "loading"}>
              {saveState.status === "loading" ? "Aplicando…" : "Aplicar estado"}
            </button>
          </form>
        </aside>
      </div>

      <section className="se-admin-submission-detail__notes-panel" aria-label="Notas del envío">
        <h2 className="se-admin-submission-detail__notes-title">Notas del envío</h2>
        {notesFeedback.status === "success" ? (
          <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
            {notesFeedback.message}
          </p>
        ) : null}
        {!(notesState.status === "success" && notesState.items.length > 0) ? (
          <p className="se-admin-submission-detail__notes-lead">
            Añada o edite notas asociadas a este envío; el autor las consulta desde su cuenta. Use la paginación si la
            lista es larga.
          </p>
        ) : null}

        <form className="se-contact-form se-admin-submission-detail__notes-form" onSubmit={handleCreateNote}>
          {createState.status === "error" ? (
            <p className="se-admin-login__error" role="alert">
              {createState.error instanceof Error ? createState.error.message : "Error al crear la nota."}
            </p>
          ) : null}
          <label className="se-form-field" htmlFor="admin-new-note">
            <span className="se-form-label">Nueva nota</span>
            <textarea
              id="admin-new-note"
              className="se-form-control"
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={createState.status === "loading"}
              placeholder="Escriba la nota para este envío…"
            />
          </label>
          <button type="submit" className="se-btn" disabled={createState.status === "loading" || !newNote.trim()}>
            {createState.status === "loading" ? "Guardando…" : "Publicar nota"}
          </button>
        </form>

        {notesState.status === "loading" || notesState.status === "idle" ? (
          <div className="se-admin-submission-detail__stack">
            <LoadingState title="Cargando notas…" />
          </div>
        ) : null}

        {notesState.status === "error" ? (
          <div className="se-admin-submission-detail__stack">
            <ErrorState title="No se pudieron cargar las notas" error={notesState.error} onRetry={loadNotes} />
          </div>
        ) : null}

        {notesState.status === "success" ? (
          notesState.items.length ? (
            <div className="se-admin-submission-detail__note-list">
              {notesState.items.map((n) => {
                const isEditing = editing.noteId != null && String(editing.noteId) === String(n.id);
                const isDeleting = deleteState.status === "loading" && String(deleteState.noteId) === String(n.id);
                const noteDate = n.updated_at ?? n.created_at;

                return (
                  <div key={n.id ?? `${n.created_at ?? ""}-${n.note ?? ""}`} className="se-admin-submission-detail__note-card">
                    <p className="se-admin-submission-detail__note-meta">
                      {n.admin_user_name ? String(n.admin_user_name) : "Administrador"}
                      {noteDate ? <span> · {formatSubmissionDate(String(noteDate))}</span> : null}
                    </p>

                    {isEditing ? (
                      <form onSubmit={handleSaveEdit}>
                        {updateState.status === "error" ? (
                          <p className="se-admin-login__error" role="alert">
                            {updateState.error instanceof Error ? updateState.error.message : "Error al actualizar."}
                          </p>
                        ) : null}
                        <textarea
                          className="se-form-control"
                          rows={4}
                          value={editing.value}
                          onChange={(e) => setEditing((s) => ({ ...s, value: e.target.value }))}
                          disabled={updateState.status === "loading"}
                        />
                        <div className="se-admin-submission-detail__note-actions">
                          <button type="submit" className="se-btn" disabled={updateState.status === "loading" || !editing.value.trim()}>
                            {updateState.status === "loading" ? "Guardando…" : "Guardar"}
                          </button>
                          <button
                            type="button"
                            className="se-btn se-btn--secondary"
                            onClick={handleCancelEdit}
                            disabled={updateState.status === "loading"}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="se-admin-submission-detail__note-body">{String(n.note ?? "")}</p>
                    )}

                    {!isEditing ? (
                      <div className="se-admin-submission-detail__note-actions">
                        <button type="button" className="se-btn se-btn--secondary" onClick={() => handleStartEdit(n)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="se-btn se-btn--secondary"
                          onClick={() => handleDeleteNote(n.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Eliminando…" : "Eliminar"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="se-admin-submission-detail__muted">Todavía no hay notas en este envío.</p>
          )
        ) : null}

        {deleteState.status === "error" ? (
          <p className="se-admin-login__error se-admin-submission-detail__retry" role="alert">
            {deleteState.error instanceof Error ? deleteState.error.message : "Error al eliminar la nota."}
          </p>
        ) : null}

        {notesState.status === "success" && notesState.meta ? (
          <Pagination
            page={Number(notesState.meta.page ?? notesPage) || notesPage}
            totalPages={Number(notesState.meta.pages ?? 1) || 1}
            onPageChange={setNotesPage}
          />
        ) : null}
      </section>

      <ConfirmDialog />
    </main>
  );
};
