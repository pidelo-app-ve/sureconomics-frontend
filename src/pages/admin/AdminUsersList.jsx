import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminUsers } from "../../services/adminUsersService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { useAuth } from "../../context/AuthContext";

const flagLabel = (row) => {
  const v =
    row?.can_submit_collaborations ??
    row?.collaborative_submissions_enabled ??
    row?.collaborative ??
    row?.is_collaborator;
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (v === 1 || v === "1" || v === "true") return "Sí";
  if (v === 0 || v === "0" || v === "false") return "No";
  return "—";
};

export const AdminUsersList = () => {
  const { role } = useAuth();
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { items, meta } = await listAdminUsers({ page, limit: 20 });
      setState({ status: "success", items, meta, error: null });
    } catch (err) {
      setState({ status: "error", items: [], meta: null, error: err });
    }
  }, [page]);

  useEffect(() => {
    applyPageMeta({ title: "Admin — Usuarios", description: "Usuarios públicos registrados.", noindex: true });
  }, []);

  useEffect(() => {
    if (role === "admin") load();
  }, [role, load]);

  if (role !== "admin") {
    return <EmptyState title="Sin acceso" description="Solo una cuenta con rol admin puede ver a los usuarios y colaboradores." />;
  }

  const meta = state.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          Usuarios
        </h1>
      </header>

      {state.status === "loading" ? <LoadingState title="Cargando usuarios…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar los usuarios" error={state.error} onRetry={load} />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState title="Sin usuarios" description="No hay filas en esta página." />
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
                  <th scope="col">Correo electrónico</th>
                  <th scope="col">Colaborador</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((row) => {
                  const uid = adminPick(row, ["id", "_id"], "");
                  const firstName = adminPick(row, ["first_name", "firstName"], "");
                  const lastName = adminPick(row, ["last_name", "lastName"], "");
                  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "—";
                  const email = adminPick(row, ["email"], "—");
                  return (
                    <tr key={uid || email}>
                      <td>{uid}</td>
                      <td>{name}</td>
                      <td>{email}</td>
                      <td>{flagLabel(row)}</td>
                      <td>
                        <Link to={`/admin/users/${uid}`} className="se-link">
                          Editar
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
