import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  createAdminHeadline,
  deleteAdminHeadline,
  getAdminHeadline,
  patchAdminHeadline,
} from "../../services/adminHeadlinesService";
import { EmptyState, ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useAuth } from "../../context/AuthContext";

const emptyForm = () => ({
  title: "",
  summary: "",
  source_name: "",
  source_url: "",
  published_at: "",
  is_active: true,
});

/** `datetime-local` value in local time (API returns ISO8601). */
const isoToDateTimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const rowToForm = (row) => ({
  title: adminPick(row, ["title"], ""),
  summary: adminPick(row, ["summary", "excerpt"], ""),
  source_name: adminPick(row, ["source_name", "sourceName"], ""),
  source_url: adminPick(row, ["source_url", "sourceUrl"], ""),
  published_at: isoToDateTimeLocal(adminPick(row, ["published_at", "publishedAt", "publishDate"], "")),
  is_active: row?.is_active !== false && row?.isActive !== false,
});

export const AdminHeadlineEditor = () => {
  const { role } = useAuth();
  const canAccess = role === "publicador" || role === "admin";
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isCreate = /\/admin\/headlines\/new\/?$/.test(pathname);
  const [form, setForm] = useState(emptyForm);
  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [saveState, setSaveState] = useState({ status: "idle", error: null });
  const { confirm, ConfirmDialog } = useAdminConfirm();

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
    if (canAccess) load();
  }, [canAccess, load]);

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
      let publishedAtIso;
      if (form.published_at.trim()) {
        const d = new Date(form.published_at);
        publishedAtIso = Number.isNaN(d.getTime()) ? undefined : d.toISOString();
      }
      const body = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        source_name: form.source_name.trim(),
        source_url: form.source_url.trim() || undefined,
        published_at: publishedAtIso,
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

  const handleDelete = async () => {
    if (isCreate || !numericId) return;
    await confirm({
      title: "Eliminar titular",
      description: `¿Eliminar el titular «${form.title || numericId}» de forma permanente?`,
      confirmLabel: "Eliminar titular",
      onConfirm: async () => {
        await deleteAdminHeadline(numericId);
        navigate("/admin/headlines", {
          replace: true,
          state: { flash: `«${form.title || numericId}» se eliminó correctamente.` },
        });
      },
    });
  };

  if (!canAccess) {
    return <EmptyState title="Sin acceso" description="Solo publicador y admin pueden gestionar titulares." />;
  }

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
            Guardado correctamente.
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
          <span className="se-form-label">Fecha de publicación</span>
          <input
            id="hl-date"
            type="datetime-local"
            className="se-form-control"
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
          {!isCreate ? (
            <button type="button" className="se-btn se-btn--secondary" onClick={handleDelete}>
              Eliminar
            </button>
          ) : null}
        </div>
      </form>

      <ConfirmDialog />
    </main>
  );
};
