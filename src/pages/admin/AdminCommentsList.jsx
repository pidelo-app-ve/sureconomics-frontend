import { useCallback, useEffect, useState } from "react";
import { deleteAdminComment, listAdminComments, patchAdminComment } from "../../services/adminCommentsService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
];

export const AdminCommentsList = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [slug, setSlug] = useState("");
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [actionId, setActionId] = useState(null);

  const load = useCallback(
    async (pageOverride) => {
      const p = pageOverride ?? page;
      setState((s) => ({ ...s, status: "loading", error: null }));
      try {
        const { items, meta } = await listAdminComments({
          page: p,
          limit: 20,
          status: status || undefined,
          slug: slug.trim() || undefined,
        });
        setState({ status: "success", items, meta, error: null });
      } catch (err) {
        setState({ status: "error", items: [], meta: null, error: err });
      }
    },
    [page, status, slug]
  );

  useEffect(() => {
    applyPageMeta({ title: "Admin — Comentarios", description: "Moderación de comentarios.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id, nextStatus) => {
    setActionId(id);
    try {
      await patchAdminComment(id, { status: nextStatus });
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este comentario de forma permanente?")) return;
    setActionId(id);
    try {
      await deleteAdminComment(id);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setActionId(null);
    }
  };

  const meta = state.meta;
  const totalPages = meta?.pages ?? 1;

  return (
    <main role="main">
      <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
        <h1 className="se-heading-section" style={{ margin: 0 }}>
          Comentarios
        </h1>
      </header>

      <form
        className="se-contact-form se-contact-form--toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load(1);
        }}
      >
        <label className="se-form-field" htmlFor="mod-status">
          <span className="se-form-label">Estado</span>
          <select
            id="mod-status"
            className="se-form-control"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="se-form-field" htmlFor="mod-slug">
          <span className="se-form-label">Slug del artículo</span>
          <input
            id="mod-slug"
            className="se-form-control"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="opcional"
          />
        </label>
        <button type="submit" className="se-btn se-btn--secondary">
          Filtrar
        </button>
      </form>

      {state.status === "loading" ? <LoadingState title="Cargando comentarios…" /> : null}
      {state.status === "error" ? (
        <ErrorState title="No se pudieron cargar los comentarios" error={state.error} onRetry={load} />
      ) : null}

      {state.status === "success" && state.items.length === 0 ? (
        <EmptyState title="Sin comentarios" description="No hay resultados para estos filtros." />
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
                  <th scope="col">Artículo</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Texto</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((row) => {
                  const cid = adminPick(row, ["id", "_id"], "");
                  const author = adminPick(row, ["author", "author_name", "user_name"], "—");
                  const st = adminPick(row, ["status", "state"], "—");
                  const postSlug = adminPick(row, ["post_slug", "slug", "article_slug"], "");
                  const body = adminPick(row, ["content", "body", "text"], "");
                  const excerpt = body.length > 120 ? `${body.slice(0, 120)}…` : body;
                  const busy = actionId === cid;
                  return (
                    <tr key={cid}>
                      <td>{cid}</td>
                      <td>
                        <code style={{ fontSize: "0.8em" }}>{postSlug || "—"}</code>
                      </td>
                      <td>{author}</td>
                      <td>{st}</td>
                      <td>
                        <span className="se-text-body" style={{ whiteSpace: "pre-wrap", fontSize: "0.9em" }}>
                          {excerpt}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="se-link se-header__nav-link--button"
                          disabled={busy}
                          onClick={() => handleStatusChange(cid, "approved")}
                        >
                          Aprobar
                        </button>
                        {" · "}
                        <button
                          type="button"
                          className="se-link se-header__nav-link--button"
                          disabled={busy}
                          onClick={() => handleStatusChange(cid, "rejected")}
                        >
                          Rechazar
                        </button>
                        {" · "}
                        <button
                          type="button"
                          className="se-link se-header__nav-link--button"
                          disabled={busy}
                          onClick={() => handleDelete(cid)}
                        >
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
