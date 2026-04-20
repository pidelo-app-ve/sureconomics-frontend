import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAdminCategory,
  listAdminCategoriesPaginated,
} from "../../services/adminTaxonomyService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";

export const AdminCategoriesList = () => {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminCategoriesPaginated({ page, limit: 20 });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page]);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Categorías", description: "Categorías editoriales.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar la categoría «${name}»?`)) return;
    try {
      await deleteAdminCategory(id);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const meta = state.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          Categorías
        </h1>
        <Link to="/admin/categories/new" className="se-btn">
          Nueva categoría
        </Link>
      </header>

      {state.status === "loading" ? <LoadingState title="Cargando categorías…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar las categorías" error={state.error} onRetry={load} />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState title="Sin categorías" description="No hay filas en esta página." />
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
                  const id = adminPick(row, ["id", "_id"], "");
                  const name = adminPick(row, ["name", "title"], "(sin nombre)");
                  const slug = adminPick(row, ["slug"], "");
                  return (
                    <tr key={id || slug}>
                      <td>{id}</td>
                      <td>{name}</td>
                      <td>
                        <code style={{ fontSize: "0.85em" }}>{slug}</code>
                      </td>
                      <td>
                        <Link to={`/admin/categories/${id}`} className="se-link">
                          Editar
                        </Link>
                        {" · "}
                        <button type="button" className="se-link se-header__nav-link--button" onClick={() => handleDelete(id, name)}>
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
    </main>
  );
};
