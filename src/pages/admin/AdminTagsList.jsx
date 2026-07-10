import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminTag, listAdminTagsPaginated } from "../../services/adminTaxonomyService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useFlashMessage } from "../../hooks/useFlashMessage";

export const AdminTagsList = () => {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [actionFeedback, setActionFeedback] = useState({ status: "idle", message: "", error: null });
  const { confirm, ConfirmDialog } = useAdminConfirm();
  const flash = useFlashMessage();

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminTagsPaginated({ page, limit: 20 });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page]);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Etiquetas", description: "Tags editoriales.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id, name) => {
    setActionFeedback({ status: "idle", message: "", error: null });
    await confirm({
      title: "Eliminar etiqueta",
      description: `¿Eliminar la etiqueta «${name}» (ID ${id}) de forma permanente?`,
      confirmLabel: "Eliminar etiqueta",
      onConfirm: async () => {
        await deleteAdminTag(id);
        await load();
        setActionFeedback({ status: "success", message: `«${name}» se eliminó correctamente.`, error: null });
      },
    });
  };

  const meta = state.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          Etiquetas
        </h1>
        <Link to="/admin/tags/new" className="se-btn">
          Nueva etiqueta
        </Link>
      </header>

      {flash ? (
        <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
          {flash}
        </p>
      ) : null}
      {actionFeedback.status === "success" ? (
        <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
          {actionFeedback.message}
        </p>
      ) : null}

      {state.status === "loading" ? <LoadingState title="Cargando etiquetas…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar las etiquetas" error={state.error} onRetry={load} />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState title="Sin etiquetas" description="No hay filas en esta página." />
      ) : null}

      {state.status === "success" && state.items.length > 0 ? (
        <>
          <p className="se-text-body" style={{ marginBottom: "1rem" }}>
            Página {meta?.page ?? page} de {totalPages} — {meta?.total ?? state.items.length} en total
          </p>
          <div className="se-admin-table-wrap">
            <table className="se-admin-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((row) => {
                  const tid = adminPick(row, ["id", "_id"], "");
                  const name = adminPick(row, ["name", "title"], "(sin nombre)");
                  const slug = adminPick(row, ["slug"], "");
                  return (
                    <tr key={tid || slug}>
                      <td>{tid}</td>
                      <td>{name}</td>
                      <td>
                        <code style={{ fontSize: "0.85em" }}>{slug}</code>
                      </td>
                      <td className="se-admin-table__actions">
                        <Link to={`/admin/tags/${tid}`} className="se-link">
                          Editar
                        </Link>
                        {" · "}
                        <button type="button" className="se-link se-header__nav-link--button" onClick={() => handleDelete(tid, name)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={meta?.page ?? page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : null}

      <ConfirmDialog />
    </main>
  );
};
