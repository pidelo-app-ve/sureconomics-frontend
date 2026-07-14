import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminPost, listAdminPosts, publishAdminPost } from "../../services/adminPostsService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useFlashMessage } from "../../hooks/useFlashMessage";
import { useAuth } from "../../context/AuthContext";

const pick = (row, keys, fallback = "—") => {
    if (!row || typeof row !== "object") return fallback;
    for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && String(v) !== "") return String(v);
    }
    return fallback;
};

export const AdminPostsList = () => {
    const { role } = useAuth();
    const canPublish = role === "publicador" || role === "admin";
    const [page, setPage] = useState(1);
    const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
    const [actionId, setActionId] = useState(null);
    const [actionFeedback, setActionFeedback] = useState({ status: "idle", message: "", error: null });
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const flash = useFlashMessage();

    const load = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const { items, meta } = await listAdminPosts({ page, limit: 20 });
            setState({ status: "success", items, meta, error: null });
        } catch (err) {
            setState({ status: "error", items: [], meta: null, error: err });
        }
    }, [page]);

    useEffect(() => {
        applyPageMeta({
            title: "Admin — Artículos",
            description: "Gestión de artículos (SurEconomics).",
        });
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handlePublish = async (id, title) => {
        setActionId(id);
        setActionFeedback({ status: "idle", message: "", error: null });
        try {
            await publishAdminPost(id);
            await load();
            setActionFeedback({ status: "success", message: `«${title}» se publicó correctamente.`, error: null });
        } catch (err) {
            setActionFeedback({ status: "error", message: "", error: err });
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (id, title) => {
        setActionFeedback({ status: "idle", message: "", error: null });
        await confirm({
            title: "Eliminar artículo",
            description: `¿Eliminar el artículo «${title}» (ID ${id}) de forma permanente?`,
            confirmLabel: "Eliminar artículo",
            onConfirm: async () => {
                await deleteAdminPost(id);
                await load();
                setActionFeedback({ status: "success", message: `«${title}» se eliminó correctamente.`, error: null });
            },
        });
    };

    const meta = state.meta;
    const totalPages = meta?.pages ?? 1;

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1.5rem" }}>
                <h1 className="se-heading-section" style={{ margin: 0 }}>
                    Artículos
                </h1>
                <Link to="/admin/posts/new" className="se-btn">
                    Nuevo artículo
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
            {actionFeedback.status === "error" ? (
                <p className="se-admin-login__error" role="alert">
                    {actionFeedback.error instanceof Error ? actionFeedback.error.message : "No se pudo completar la solicitud."}
                </p>
            ) : null}

            {state.status === "loading" ? <LoadingState title="Cargando artículos…" /> : null}
            {state.status === "error" ? (
                <ErrorState
                    title="No se pudieron cargar los artículos"
                    error={state.error}
                    onRetry={load}
                />
            ) : null}

            {state.status === "success" && state.items.length === 0 ? (
                <EmptyState title="Sin artículos" description="No hay filas en esta página." />
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
                                    <th scope="col">Slug</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.items.map((row) => {
                                    const id = pick(row, ["id", "_id"], "");
                                    const slug = pick(row, ["slug"], "");
                                    const title = pick(row, ["title"], "(sin título)");
                                    const status = pick(row, ["status", "publication_status", "state"], "—");
                                    const busy = actionId === id;
                                    return (
                                        <tr key={id || slug || title}>
                                            <td>{id}</td>
                                            <td>{title}</td>
                                            <td>
                                                <code style={{ fontSize: "0.85em" }}>{slug}</code>
                                            </td>
                                            <td>
                                                <span
                                                    className={`se-status-pill ${
                                                        status === "published" ? "se-status-pill--positive" : "se-status-pill--neutral"
                                                    }`}
                                                >
                                                    {status === "published" ? "Publicado" : status === "draft" ? "Borrador" : status}
                                                </span>
                                            </td>
                                            <td className="se-admin-table__actions">
                                                <Link to={`/admin/posts/${id}`} className="se-link">
                                                    Editar
                                                </Link>
                                                {status !== "published" && canPublish ? (
                                                    <>
                                                        {" · "}
                                                        <button
                                                            type="button"
                                                            className="se-link se-header__nav-link--button"
                                                            disabled={busy}
                                                            onClick={() => handlePublish(id, title)}
                                                        >
                                                            {busy ? "Publicando…" : "Publicar"}
                                                        </button>
                                                    </>
                                                ) : null}
                                                {canPublish ? (
                                                    <>
                                                        {" · "}
                                                        <button
                                                            type="button"
                                                            className="se-link se-header__nav-link--button"
                                                            disabled={busy}
                                                            onClick={() => handleDelete(id, title)}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            ) : null}

            <ConfirmDialog />
        </main>
    );
};
