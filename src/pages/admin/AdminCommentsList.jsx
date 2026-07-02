import { useCallback, useEffect, useState } from "react";
import {
  approveAdminComment,
  deleteAdminComment,
  listAdminComments,
  rejectAdminComment,
} from "../../services/adminCommentsService";
import { getAdminPost } from "../../services/adminPostsService";
import { getAdminUser } from "../../services/adminUsersService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminPick } from "../../lib/adminPick";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "approved", label: "Aprobado" },
  { value: "rejected", label: "Rechazado" },
];

const STATUS_LABELS = { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };
const STATUS_PILL_MODIFIERS = {
  pending: "se-status-pill--warning",
  approved: "se-status-pill--positive",
  rejected: "se-status-pill--negative",
};

const pickFromObj = (obj, keys, fallback = "") => {
  if (!obj || typeof obj !== "object") return fallback;
  for (const key of keys) {
    const value = obj[key];
    if (value === undefined || value === null) continue;
    const asString = String(value).trim();
    if (asString) return asString;
  }
  return fallback;
};

const getAuthorDetails = (row) => {
  const raw = row?.author ?? row?.user ?? row?.commenter ?? null;
  if (raw && typeof raw === "object") {
    const name =
      pickFromObj(raw, ["name", "fullName", "full_name", "displayName", "display_name"]) ||
      pickFromObj(raw, ["username", "user_name"]);
    const email = pickFromObj(raw, ["email", "mail"]);
    return { name: name || "—", email: email || "" };
  }

  const name = adminPick(row, ["author_name", "user_name", "author"], "—");
  const email = adminPick(row, ["author_email", "user_email", "email"], "");
  return { name, email };
};

export const AdminCommentsList = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [postId, setPostId] = useState("");
  const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
  const [actionId, setActionId] = useState(null);
  const [lookups, setLookups] = useState({ posts: {}, users: {} });
  const [actionFeedback, setActionFeedback] = useState({ status: "idle", message: "", error: null });
  const { confirm, ConfirmDialog } = useAdminConfirm();

  const load = useCallback(
    async (pageOverride) => {
      const p = pageOverride ?? page;
      setState((s) => ({ ...s, status: "loading", error: null }));
      try {
        const postIdTrim = postId.trim();
        const { items, meta } = await listAdminComments({
          page: p,
          limit: 20,
          status: status || undefined,
          post_id: postIdTrim ? (/^\d+$/.test(postIdTrim) ? Number(postIdTrim) : postIdTrim) : undefined,
        });
        setState({ status: "success", items, meta, error: null });

        // Resolve related entities (author + post) because /admin/comments only returns ids.
        const postIds = Array.from(
          new Set((items ?? []).map((r) => adminPick(r, ["post_id", "postId"], "")).filter(Boolean))
        );
        const userIds = Array.from(
          new Set((items ?? []).map((r) => adminPick(r, ["user_id", "userId"], "")).filter(Boolean))
        );

        const [postsPairs, usersPairs] = await Promise.all([
          Promise.all(
            postIds.map(async (id) => {
              try {
                const post = await getAdminPost(id);
                return [String(id), post];
              } catch {
                return [String(id), null];
              }
            })
          ),
          Promise.all(
            userIds.map(async (id) => {
              try {
                const user = await getAdminUser(id);
                return [String(id), user];
              } catch {
                return [String(id), null];
              }
            })
          ),
        ]);

        setLookups({
          posts: Object.fromEntries(postsPairs),
          users: Object.fromEntries(usersPairs),
        });
      } catch (err) {
        setState({ status: "error", items: [], meta: null, error: err });
        setLookups({ posts: {}, users: {} });
      }
    },
    [page, status, postId]
  );

  useEffect(() => {
    applyPageMeta({ title: "Admin — Comentarios", description: "Moderación de comentarios.", noindex: true });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (commentId) => {
    setActionId(commentId);
    setActionFeedback({ status: "idle", message: "", error: null });
    try {
      await approveAdminComment(commentId);
      await load();
      setActionFeedback({ status: "success", message: `Comentario #${commentId} aprobado correctamente.`, error: null });
    } catch (err) {
      setActionFeedback({ status: "error", message: "", error: err });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (commentId) => {
    setActionId(commentId);
    setActionFeedback({ status: "idle", message: "", error: null });
    try {
      await rejectAdminComment(commentId);
      await load();
      setActionFeedback({ status: "success", message: `Comentario #${commentId} rechazado correctamente.`, error: null });
    } catch (err) {
      setActionFeedback({ status: "error", message: "", error: err });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionId(id);
    setActionFeedback({ status: "idle", message: "", error: null });
    const ok = await confirm({
      title: "Eliminar comentario",
      description: `¿Eliminar este comentario (ID ${id}) de forma permanente?`,
      confirmLabel: "Eliminar comentario",
      onConfirm: async () => {
        await deleteAdminComment(id);
        await load();
        setActionFeedback({ status: "success", message: `Comentario #${id} eliminado correctamente.`, error: null });
      },
    });
    if (!ok) {
      setActionId(null);
      return;
    }
    setActionId(null);
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
        <label className="se-form-field" htmlFor="mod-post-id">
          <span className="se-form-label">ID del artículo</span>
          <input
            id="mod-post-id"
            className="se-form-control"
            inputMode="numeric"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            placeholder="opcional"
          />
        </label>
        <button type="submit" className="se-btn se-btn--secondary">
          Filtrar
        </button>
      </form>

      {actionFeedback.status === "success" ? (
        <p className="se-text-body se-admin-submission-detail__status-banner" role="status">
          {actionFeedback.message}
        </p>
      ) : null}
      {actionFeedback.status === "error" ? (
        <p className="se-admin-login__error" role="alert">
          {actionFeedback.error instanceof Error ? actionFeedback.error.message : "No se pudo completar la acción."}
        </p>
      ) : null}

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
                  const userId = adminPick(row, ["user_id", "userId"], "");
                  const postId = adminPick(row, ["post_id", "postId"], "");
                  const user = userId ? lookups.users[String(userId)] : null;
                  const postEntity = postId ? lookups.posts[String(postId)] : null;

                  const author = user
                    ? {
                        name: (() => {
                          const fromParts = [
                            pickFromObj(user, ["first_name", "firstName"]),
                            pickFromObj(user, ["last_name", "lastName"]),
                          ]
                            .filter(Boolean)
                            .join(" ")
                            .trim();
                          if (fromParts) return fromParts;
                          return (
                            pickFromObj(user, ["name", "fullName", "full_name", "displayName", "display_name"]) ||
                            pickFromObj(user, ["username", "user_name"]) ||
                            adminPick(user, ["email"], "—")
                          );
                        })(),
                        email: pickFromObj(user, ["email", "mail"]),
                      }
                    : getAuthorDetails(row);
                  const st = adminPick(row, ["status", "state"], "—");
                  const postSlug =
                    pickFromObj(postEntity, ["slug"]) || adminPick(row, ["post_slug", "slug", "article_slug"], "");
                  const postTitle =
                    pickFromObj(postEntity, ["title", "metaTitle", "name"]) ||
                    adminPick(row, ["post_title", "article_title", "title"], "");
                  const body = adminPick(row, ["content", "body", "text"], "");
                  const excerpt = body.length > 120 ? `${body.slice(0, 120)}…` : body;
                  const busy = actionId === cid;
                  return (
                    <tr key={cid}>
                      <td>{cid}</td>
                      <td>
                        {postTitle ? (
                          <div style={{ display: "grid", gap: "0.25rem" }}>
                            <span style={{ fontWeight: 600 }}>{postTitle}</span>
                            {postSlug ? (
                              <a
                                className="se-link"
                                href={`/articulo/${postSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: "0.8em" }}
                              >
                                {postSlug}
                              </a>
                            ) : null}
                          </div>
                        ) : postSlug ? (
                          <a
                            className="se-link"
                            href={`/articulo/${postSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.8em" }}
                          >
                            {postSlug}
                          </a>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "grid", gap: "0.15rem" }}>
                          <span style={{ fontWeight: 600 }}>{author.name}</span>
                          {author.email ? (
                            <span className="se-text-body" style={{ fontSize: "0.8em", opacity: 0.8 }}>
                              {author.email}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={`se-status-pill ${STATUS_PILL_MODIFIERS[st] || "se-status-pill--neutral"}`}>
                          {STATUS_LABELS[st] || st}
                        </span>
                      </td>
                      <td>
                        <span className="se-text-body" style={{ whiteSpace: "pre-wrap", fontSize: "0.9em" }}>
                          {excerpt}
                        </span>
                      </td>
                      <td className="se-admin-table__actions">
                        <button
                          type="button"
                          className="se-link se-header__nav-link--button"
                          disabled={busy}
                          onClick={() => handleApprove(cid)}
                        >
                          Aprobar
                        </button>
                        {" · "}
                        <button
                          type="button"
                          className="se-link se-header__nav-link--button"
                          disabled={busy}
                          onClick={() => handleReject(cid)}
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

      <ConfirmDialog />
    </main>
  );
};
