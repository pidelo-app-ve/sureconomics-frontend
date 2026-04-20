import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminHeadline, listAdminHeadlines } from "../../services/adminHeadlinesService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";

export const AdminHeadlinesList = () => {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminHeadlines({ page, limit: 20 });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page]);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Titulares", description: "Titulares del home.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (hid, title) => {
    if (!window.confirm(`¿Eliminar el titular «${title}»?`)) return;
    try {
      await deleteAdminHeadline(hid);
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
          Titulares
        </h1>
        <Link to="/admin/headlines/new" className="se-btn">
          Nuevo titular
        </Link>
      </header>

      {state.status === "loading" ? <LoadingState title="Cargando titulares…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar los titulares" error={state.error} onRetry={load} />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState title="Sin titulares" description="No hay filas en esta página." />
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
                  <th scope="col">Título</th>
                  <th scope="col">Fuente</th>
                  <th scope="col">Activo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((row) => {
                  const hid = adminPick(row, ["id", "_id"], "");
                  const title = adminPick(row, ["title"], "(sin título)");
                  const src = adminPick(row, ["source_name", "sourceName"], "—");
                  const active = row?.is_active !== false && row?.isActive !== false;
                  return (
                    <tr key={hid || title}>
                      <td>{hid}</td>
                      <td>{title}</td>
                      <td>{src}</td>
                      <td>{active ? "Sí" : "No"}</td>
                      <td>
                        <Link to={`/admin/headlines/${hid}`} className="se-link">
                          Editar
                        </Link>
                        {" · "}
                        <button type="button" className="se-link se-header__nav-link--button" onClick={() => handleDelete(hid, title)}>
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
