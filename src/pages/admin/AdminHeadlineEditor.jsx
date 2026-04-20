import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { createAdminHeadline, getAdminHeadline, patchAdminHeadline } from "../../services/adminHeadlinesService";
import { ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";

const emptyForm = () => ({
  title: "",
  summary: "",
  source_name: "",
  source_url: "",
  published_at: "",
  is_active: true,
});

const rowToForm = (row) => ({
  title: adminPick(row, ["title"], ""),
  summary: adminPick(row, ["summary", "excerpt"], ""),
  source_name: adminPick(row, ["source_name", "sourceName"], ""),
  source_url: adminPick(row, ["source_url", "sourceUrl"], ""),
  published_at: adminPick(row, ["published_at", "publishedAt", "publishDate"], ""),
  is_active: row?.is_active !== false && row?.isActive !== false,
});

export const AdminHeadlineEditor = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isCreate = /\/admin\/headlines\/new\/?$/.test(pathname);
  const [form, setForm] = useState(emptyForm);
  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [saveState, setSaveState] = useState({ status: "idle", error: null });

  const numericId = useMemo(() => {
    if (!id) return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : id;
  }, [id]);

  const load = useCallback(async () => {
    if (isCreate || !numericId) {
      setForm(emptyForm());
      setLoadState({ status: "success", error: null });
      return;
    }
    setLoadState({ status: "loading", error: null });
    try {
      const row = await getAdminHeadline(numericId);
      setForm(rowToForm(row));
      setLoadState({ status: "success", error: null });
    } catch (err) {
      setLoadState({ status: "error", error: err });
    }
  }, [isCreate, numericId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    applyPageMeta({
      title: isCreate ? "Admin — Nuevo titular" : `Admin — Titular #${id ?? ""}`,
      description: "Edición de titular.",
      noindex: true,
    });
  }, [isCreate, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveState({ status: "loading", error: null });
    try {
      const body = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        source_name: form.source_name.trim(),
        source_url: form.source_url.trim() || undefined,
        published_at: form.published_at.trim() || undefined,
        is_active: form.is_active,
      };
      if (isCreate) {
        const created = await createAdminHeadline(body);
        const newId = created?.id ?? created?._id;
        if (newId != null) navigate(`/admin/headlines/${newId}`, { replace: true });
        else navigate("/admin/headlines", { replace: true });
        return;
      }
      await patchAdminHeadline(numericId, body);
      setSaveState({ status: "success", error: null });
    } catch (err) {
      setSaveState({ status: "error", error: err });
    }
  };

  if (loadState.status === "loading") {
    return (
      <main role="main">
        <LoadingState title="Cargando titular…" />
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main role="main">
        <ErrorState title="No se pudo cargar el titular" error={loadState.error} onRetry={load} />
      </main>
    );
  }

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          {isCreate ? "Nuevo titular" : "Editar titular"}
        </h1>
        <Link to="/admin/headlines" className="se-link">
          ← Volver al listado
        </Link>
      </header>

      <form className="se-contact-form" onSubmit={handleSubmit} style={{ maxWidth: "40rem" }}>
        {saveState.status === "error" ? (
          <p className="se-admin-login__error" role="alert">
            {saveState.error instanceof Error ? saveState.error.message : "Error al guardar."}
          </p>
        ) : null}
        {saveState.status === "success" ? (
          <p className="se-text-body" role="status">
            Guardado.
          </p>
        ) : null}

        <label className="se-form-field" htmlFor="hl-title">
          <span className="se-form-label">Título</span>
          <input
            id="hl-title"
            className="se-form-control"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
        </label>
        <label className="se-form-field" htmlFor="hl-summary">
          <span className="se-form-label">Resumen</span>
          <textarea
            id="hl-summary"
            className="se-form-control"
            rows={4}
            value={form.summary}
            onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
          />
        </label>
        <label className="se-form-field" htmlFor="hl-src-name">
          <span className="se-form-label">Nombre de fuente</span>
          <input
            id="hl-src-name"
            className="se-form-control"
            value={form.source_name}
            onChange={(e) => setForm((p) => ({ ...p, source_name: e.target.value }))}
          />
        </label>
        <label className="se-form-field" htmlFor="hl-src-url">
          <span className="se-form-label">URL de fuente</span>
          <input
            id="hl-src-url"
            type="url"
            className="se-form-control"
            value={form.source_url}
            onChange={(e) => setForm((p) => ({ ...p, source_url: e.target.value }))}
          />
        </label>
        <label className="se-form-field" htmlFor="hl-date">
          <span className="se-form-label">Fecha de publicación (ISO8601)</span>
          <input
            id="hl-date"
            className="se-form-control"
            placeholder="2026-04-20T12:00:00"
            value={form.published_at}
            onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))}
          />
        </label>
        <label className="se-form-field" htmlFor="hl-active">
          <input
            id="hl-active"
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
          />
          <span className="se-form-label">Activo</span>
        </label>
        <div className="se-admin-form-actions">
          <button type="submit" className="se-btn" disabled={saveState.status === "loading"}>
            {saveState.status === "loading" ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </main>
  );
};
