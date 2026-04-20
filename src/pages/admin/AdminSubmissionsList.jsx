import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminSubmissions } from "../../services/adminSubmissionsService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";

export const AdminSubmissionsList = () => {
  const [page, setPage] = useState(1);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminSubmissions({
        page,
        limit: 20,
        status: submissionStatus || undefined,
      });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page, submissionStatus]);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Envíos colaborativos", description: "Revisiones de propuestas.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const meta = state.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          Envíos colaborativos
        </h1>
      </header>

      <label className="se-form-field" htmlFor="sub-status" style={{ marginBottom: "1rem", maxWidth: "16rem" }}>
        <span className="se-form-label">Estado</span>
        <select
          id="sub-status"
          className="se-form-control"
          value={submissionStatus}
          onChange={(e) => {
            setSubmissionStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="under_review">En revisión</option>
          <option value="accepted">Aceptado</option>
          <option value="rejected">Rechazado</option>
        </select>
      </label>

      {state.status === "loading" ? <LoadingState title="Cargando envíos…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar los envíos" error={state.error} onRetry={load} />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState title="Sin envíos" description="No hay resultados." />
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
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((row) => {
                  const sid = adminPick(row, ["id", "_id"], "");
                  const title = adminPick(row, ["title"], "(sin título)");
                  const st = adminPick(row, ["status"], "—");
                  return (
                    <tr key={sid}>
                      <td>{sid}</td>
                      <td>{title}</td>
                      <td>{st}</td>
                      <td>
                        <Link to={`/admin/submissions/${sid}`} className="se-link">
                          Revisar
                        </Link>
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
