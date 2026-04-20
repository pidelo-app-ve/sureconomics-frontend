import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminPosts } from "../../services/adminPostsService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";

const pick = (row, keys, fallback = "—") => {
    if (!row || typeof row !== "object") return fallback;
    for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && String(v) !== "") return String(v);
    }
    return fallback;
};

export const AdminPostsList = () => {
    const [page, setPage] = useState(1);
    const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });

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
            description: "Gestión de artículos (Sur Economics).",
        });
    }, []);

    useEffect(() => {
        load();
    }, [load]);

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
                                    return (
                                        <tr key={id || slug || title}>
                                            <td>{id}</td>
                                            <td>{title}</td>
                                            <td>
                                                <code style={{ fontSize: "0.85em" }}>{slug}</code>
                                            </td>
                                            <td>{status}</td>
                                            <td>
                                                <Link to={`/admin/posts/${id}`} className="se-link">
                                                    Editar
                                                </Link>
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
        </main>
    );
};
