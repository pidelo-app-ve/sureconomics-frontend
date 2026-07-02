import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategory,
  patchAdminCategory,
} from "../../services/adminTaxonomyService";
import { ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";

const emptyForm = () => ({ name: "", slug: "" });

const rowToForm = (row) => ({
  name: adminPick(row, ["name", "title"], ""),
  slug: adminPick(row, ["slug"], ""),
});

export const AdminCategoryEditor = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isCreate = /\/admin\/categories\/new\/?$/.test(pathname);
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
      const row = await getAdminCategory(numericId);
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
      title: isCreate ? "Admin — Nueva categoría" : `Admin — Categoría #${id ?? ""}`,
      description: "Edición de categoría.",
      noindex: true,
    });
  }, [isCreate, id]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveState({ status: "loading", error: null });
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim() };
      if (isCreate) {
        const created = await createAdminCategory(body);
        const newId = created?.id ?? created?._id;
        if (newId != null) navigate(`/admin/categories/${newId}`, { replace: true });
        else navigate("/admin/categories", { replace: true });
        return;
      }
      await patchAdminCategory(numericId, body);
      setSaveState({ status: "success", error: null });
    } catch (err) {
      setSaveState({ status: "error", error: err });
    }
  };

  const handleDelete = async () => {
    if (isCreate || !numericId) return;
    await confirm({
      title: "Eliminar categoría",
      description: `¿Eliminar la categoría «${form.name || numericId}» de forma permanente?`,
      confirmLabel: "Eliminar categoría",
      onConfirm: async () => {
        await deleteAdminCategory(numericId);
        navigate("/admin/categories", {
          replace: true,
          state: { flash: `«${form.name || numericId}» se eliminó correctamente.` },
        });
      },
    });
  };

  if (loadState.status === "loading") {
    return (
      <main role="main">
        <LoadingState title="Cargando categoría…" />
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main role="main">
        <ErrorState title="No se pudo cargar la categoría" error={loadState.error} onRetry={load} />
      </main>
    );
  }

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          {isCreate ? "Nueva categoría" : "Editar categoría"}
        </h1>
        <Link to="/admin/categories" className="se-link">
          ← Volver al listado
        </Link>
      </header>

      <form className="se-contact-form" onSubmit={handleSubmit} style={{ maxWidth: "32rem" }}>
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

        <label className="se-form-field" htmlFor="cat-name">
          <span className="se-form-label">Nombre</span>
          <input
            id="cat-name"
            className="se-form-control"
            value={form.name}
            onChange={handleChange("name")}
            required
          />
        </label>
        <label className="se-form-field" htmlFor="cat-slug">
          <span className="se-form-label">Slug</span>
          <input id="cat-slug" className="se-form-control" value={form.slug} onChange={handleChange("slug")} required />
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
