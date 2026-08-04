import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { createAdminTag, deleteAdminTag, getAdminTag, patchAdminTag } from "../../services/adminTaxonomyService";
import { ErrorState, LoadingState } from "../../components/content";
import { AdminFormFeedback } from "../../components/admin/AdminFormFeedback";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useFlashMessage } from "../../hooks/useFlashMessage";
import { useAdminToast } from "../../context/AdminToastContext";

const emptyForm = () => ({ name: "", slug: "" });

const rowToForm = (row) => ({
  name: adminPick(row, ["name", "title"], ""),
  slug: adminPick(row, ["slug"], ""),
});

export const AdminTagEditor = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isCreate = /\/admin\/tags\/new\/?$/.test(pathname);
  const [form, setForm] = useState(emptyForm);
  const [loadState, setLoadState] = useState({ status: "idle", error: null });
  const [saveState, setSaveState] = useState({ status: "idle", message: "" });
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const flash = useFlashMessage();
  const { toastSuccess, toastError } = useAdminToast();

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
      const row = await getAdminTag(numericId);
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
      title: isCreate ? "Admin — Nueva etiqueta" : `Admin — Etiqueta #${id ?? ""}`,
      description: "Edición de etiqueta.",
      noindex: true,
    });
  }, [isCreate, id]);

  useEffect(() => {
    if (flash) toastSuccess(flash);
  }, [flash, toastSuccess]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveState({ status: "loading", message: "" });
    try {
      const body = { name: form.name.trim(), slug: form.slug.trim() };
      if (isCreate) {
        const created = await createAdminTag(body);
        const newId = created?.id ?? created?._id;
        const flashMessage = `La etiqueta «${body.name}» se creó correctamente.`;
        if (newId != null) {
          navigate(`/admin/tags/${newId}`, { replace: true, state: { flash: flashMessage } });
        } else {
          navigate("/admin/tags", { replace: true, state: { flash: flashMessage } });
        }
        return;
      }
      await patchAdminTag(numericId, body);
      setSaveState({ status: "success", message: "Cambios guardados correctamente." });
      toastSuccess("Cambios guardados correctamente.", "Etiqueta guardada");
    } catch (err) {
      const message = adminErrorMessage(
        err,
        isCreate ? "No se pudo crear la etiqueta." : "No se pudieron guardar los cambios."
      );
      setSaveState({ status: "error", message });
      toastError(message, isCreate ? "No se pudo crear la etiqueta" : "No se pudo guardar");
    }
  };

  const handleDelete = async () => {
    if (isCreate || !numericId) return;
    await confirm({
      title: "Eliminar etiqueta",
      description: `¿Eliminar la etiqueta «${form.name || numericId}» de forma permanente?`,
      confirmLabel: "Eliminar etiqueta",
      onConfirm: async () => {
        await deleteAdminTag(numericId);
        navigate("/admin/tags", {
          replace: true,
          state: { flash: `«${form.name || numericId}» se eliminó correctamente.` },
        });
      },
    });
  };

  if (loadState.status === "loading") {
    return (
      <main role="main">
        <LoadingState title="Cargando etiqueta…" />
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main role="main">
        <ErrorState title="No se pudo cargar la etiqueta" error={loadState.error} onRetry={load} />
      </main>
    );
  }

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          {isCreate ? "Nueva etiqueta" : "Editar etiqueta"}
        </h1>
        <Link to="/admin/tags" className="se-link">
          ← Volver al listado
        </Link>
      </header>

      <form className="se-contact-form" onSubmit={handleSubmit} style={{ maxWidth: "32rem" }}>
        <label className="se-form-field" htmlFor="tag-name">
          <span className="se-form-label">Nombre</span>
          <input
            id="tag-name"
            className="se-form-control"
            value={form.name}
            onChange={handleChange("name")}
            required
          />
        </label>
        <label className="se-form-field" htmlFor="tag-slug">
          <span className="se-form-label">Slug</span>
          <input id="tag-slug" className="se-form-control" value={form.slug} onChange={handleChange("slug")} required />
        </label>
        <AdminFormFeedback
          tone={saveState.status === "error" ? "error" : "success"}
          message={saveState.status === "loading" ? "" : saveState.message}
        />

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
