import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminSubmission, patchAdminSubmission } from "../../services/adminSubmissionsService";
import { ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";

export const AdminSubmissionDetail = () => {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [status, setStatus] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState("");
  const [saveState, setSaveState] = useState({ status: "idle", error: null });

  const numericId = useMemo(() => {
    if (!id) return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  }, [id]);

  const load = useCallback(async () => {
    if (!numericId) return;
    setLoadState({ status: "loading", error: null });
    try {
      const data = await getAdminSubmission(numericId);
      setRow(data);
      setStatus(adminPick(data, ["status"], "pending") || "pending");
      setReviewNotes(adminPick(data, ["review_notes", "reviewNotes", "notes"], ""));
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, [numericId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    applyPageMeta({ title: `Admin — Envío #${id ?? ""}`, description: "Revisión de envío.", noindex: true });
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!numericId) return;
    setSaveState({ status: "loading", error: null });
    try {
      const updated = await patchAdminSubmission(numericId, {
        status,
        review_notes: reviewNotes.trim() || undefined,
      });
      setRow(updated);
      setSaveState({ status: "success", error: null });
    } catch (err) {
      setSaveState({ status: "error", error: err });
    }
  };

  if (loadState.status === "loading") {
    return (
      <main role="main">
        <LoadingState title="Cargando envío…" />
      </main>
    );
  }

  if (loadState.status === "error" || !row) {
    return (
      <main role="main">
        <ErrorState title="No se pudo cargar el envío" error={loadState.error} onRetry={load} />
        <Link to="/admin/submissions" className="se-link">
          Volver al listado
        </Link>
      </main>
    );
  }

  const title = adminPick(row, ["title"], "");
  const excerpt = adminPick(row, ["excerpt", "summary"], "");
  const content = adminPick(row, ["content", "body"], "");
  const img = adminPick(row, ["featured_image_url", "featuredImageUrl"], "");

  return (
    <main role="main">
      <p className="se-text-body">
        <Link to="/admin/submissions" className="se-link">
          ← Envíos
        </Link>
      </p>
      <h1 className="se-heading-section">{title}</h1>
      <p className="se-meta">{adminPick(row, ["status"], "")}</p>

      {excerpt ? (
        <section style={{ marginTop: "1rem" }}>
          <h2 className="se-heading-section se-heading-section--small">Resumen</h2>
          <p className="se-text-body">{excerpt}</p>
        </section>
      ) : null}

      {content ? (
        <section style={{ marginTop: "1rem" }}>
          <h2 className="se-heading-section se-heading-section--small">Contenido</h2>
          <div className="se-text-body" style={{ whiteSpace: "pre-wrap" }}>
            {content}
          </div>
        </section>
      ) : null}

      {img ? (
        <p className="se-text-body" style={{ marginTop: "1rem" }}>
          <a href={img} className="se-link" target="_blank" rel="noopener noreferrer">
            Imagen destacada
          </a>
        </p>
      ) : null}

      <form className="se-contact-form" onSubmit={handleSave} style={{ marginTop: "2rem", maxWidth: "28rem" }}>
        <h2 className="se-heading-section se-heading-section--small">Revisión</h2>
        {saveState.status === "error" ? (
          <p className="se-admin-login__error" role="alert">
            {saveState.error instanceof Error ? saveState.error.message : "Error al guardar."}
          </p>
        ) : null}
        {saveState.status === "success" ? (
          <p className="se-text-body" role="status">
            Actualizado.
          </p>
        ) : null}

        <label className="se-form-field" htmlFor="rev-status">
          <span className="se-form-label">Estado</span>
          <select id="rev-status" className="se-form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pendiente</option>
            <option value="under_review">En revisión</option>
            <option value="accepted">Aceptado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </label>
        <label className="se-form-field" htmlFor="rev-notes">
          <span className="se-form-label">Notas internas</span>
          <textarea
            id="rev-notes"
            className="se-form-control"
            rows={4}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />
        </label>
        <button type="submit" className="se-btn" disabled={saveState.status === "loading"}>
          {saveState.status === "loading" ? "Guardando…" : "Guardar revisión"}
        </button>
      </form>
    </main>
  );
};
