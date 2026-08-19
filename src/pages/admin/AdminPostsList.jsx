import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminPost, listAdminPosts, publishAdminPost } from "../../services/adminPostsService";
import { listAdminFormats } from "../../services/adminTaxonomyService";
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

/** The tag a row shows: the first topic, which is the principal one. */
const principalTopic = (row) => row?.topics?.[0]?.name ?? null;

const principalPlace = (row) => row?.places?.[0]?.name ?? null;

export const AdminPostsList = () => {
    const { role } = useAuth();
    const canPublish = role === "publicador" || role === "admin";
    const canCreate = role === "escritor" || role === "admin";
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        format: "",
        status: "",
        q: "",
        unclassified: false,
    });
    const [formats, setFormats] = useState([]);
    const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
    const [actionId, setActionId] = useState(null);
    const [actionFeedback, setActionFeedback] = useState({ status: "idle", message: "", error: null });
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const flash = useFlashMessage();

    const load = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const { items, meta } = await listAdminPosts({ page, limit: 20, ...filters });
            setState({ status: "success", items, meta, error: null });
        } catch (err) {
            setState({ status: "error", items: [], meta: null, error: err });
        }
    }, [page, filters]);

    useEffect(() => {
        applyPageMeta({
            title: "Admin — Contenido",
            description: "Gestión de contenido (SurEconomics).",
        });
        listAdminFormats()
            .then((rows) => setFormats(rows.filter((f) => f.is_active !== false)))
            .catch(() => setFormats([]));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const setFilter = (key) => (event) => {
        const value = key === "unclassified" ? event.target.checked : event.target.value;
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const formatName = useMemo(() => {
        const byslug = new Map(formats.map((f) => [f.slug, f.name]));
        return (slug) => byslug.get(slug) ?? slug ?? "—";
    }, [formats]);

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
            title: "Eliminar pieza",
            description: `¿Eliminar «${title}» (ID ${id}) de forma permanente?`,
            confirmLabel: "Eliminar",
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
                    Contenido
                </h1>
                {canCreate ? (
                    <nav className="se-admin-create" aria-label="Crear contenido">
                        {formats.map((f) => (
                            <Link
                                key={f.slug}
                                to={`/admin/posts/new?format=${encodeURIComponent(f.slug)}`}
                                className="se-btn se-btn--small"
                            >
                                {/* "Crear" avoids the gender agreement that
                                    "nueva noticia" / "nuevo informe" would need,
                                    and the format names come from the database. */}
                                Crear {f.name.toLowerCase()}
                            </Link>
                        ))}
                    </nav>
                ) : null}
            </header>

            <div className="se-admin-filters">
                <label className="se-admin-filters__field">
                    <span className="se-form-label">Formato</span>
                    <select className="se-form-control" value={filters.format} onChange={setFilter("format")}>
                        <option value="">Todos</option>
                        {formats.map((f) => (
                            <option key={f.slug} value={f.slug}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="se-admin-filters__field">
                    <span className="se-form-label">Estado</span>
                    <select className="se-form-control" value={filters.status} onChange={setFilter("status")}>
                        <option value="">Todos</option>
                        <option value="draft">Borrador</option>
                        <option value="published">Publicado</option>
                    </select>
                </label>
                <label className="se-admin-filters__field se-admin-filters__field--grow">
                    <span className="se-form-label">Buscar</span>
                    <input
                        className="se-form-control"
                        value={filters.q}
                        onChange={setFilter("q")}
                        placeholder="Título o resumen"
                    />
                </label>
                <label className="se-admin-filters__check">
                    <input
                        type="checkbox"
                        checked={filters.unclassified}
                        onChange={setFilter("unclassified")}
                    />
                    <span>
                        Sin clasificar
                        <em>
                            lo que quedó de la categorización vieja y todavía no tiene tema
                        </em>
                    </span>
                </label>
            </div>

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
                    {actionFeedback.error instanceof Error
                        ? actionFeedback.error.message
                        : "No se pudo completar la solicitud."}
                </p>
            ) : null}

            {state.status === "loading" ? <LoadingState title="Cargando contenido…" /> : null}
            {state.status === "error" ? (
                <ErrorState title="No se pudo cargar el contenido" error={state.error} onRetry={load} />
            ) : null}

            {state.status === "success" && state.items.length === 0 ? (
                <EmptyState
                    title={filters.unclassified ? "Nada sin clasificar" : "Sin resultados"}
                    description={
                        filters.unclassified
                            ? "Todas las piezas tienen al menos un tema."
                            : "Ninguna pieza coincide con estos filtros."
                    }
                />
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
                                    <th scope="col">Formato</th>
                                    <th scope="col">Título</th>
                                    <th scope="col">Tema · Lugar</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.items.map((row) => {
                                    const id = pick(row, ["id"], "");
                                    const slug = pick(row, ["slug"], "");
                                    const title = pick(row, ["title"], "(sin título)");
                                    const status = pick(row, ["status"], "—");
                                    const busy = actionId === id;
                                    const tema = principalTopic(row);
                                    const lugar = principalPlace(row);
                                    // Says why publishing would be refused before anyone tries.
                                    const missing =
                                        (row.format === "entrevista" && !row.video_asset_id && "sin video") ||
                                        (row.format === "informe" && !row.document_asset_id && "sin documento");
                                    return (
                                        <tr key={id || slug || title}>
                                            <td>{id}</td>
                                            <td>{formatName(row.format)}</td>
                                            <td>
                                                {title}
                                                <br />
                                                <code style={{ fontSize: "0.8em", opacity: 0.7 }}>{slug}</code>
                                            </td>
                                            <td>
                                                {tema ? (
                                                    <>
                                                        {tema}
                                                        {lugar ? ` · ${lugar}` : ""}
                                                    </>
                                                ) : (
                                                    <span className="se-status-pill se-status-pill--neutral">
                                                        sin clasificar
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className={`se-status-pill ${
                                                        status === "published"
                                                            ? "se-status-pill--positive"
                                                            : "se-status-pill--neutral"
                                                    }`}
                                                >
                                                    {status === "published"
                                                        ? "Publicado"
                                                        : status === "draft"
                                                          ? "Borrador"
                                                          : status}
                                                </span>
                                                {missing ? (
                                                    <>
                                                        <br />
                                                        <em className="se-admin-table__note">{missing}</em>
                                                    </>
                                                ) : null}
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
