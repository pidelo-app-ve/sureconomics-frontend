import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminPost, listAdminPosts, publishAdminPost } from "../../services/adminPostsService";
import { listAdminFormats } from "../../services/adminTaxonomyService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useFlashMessage } from "../../hooks/useFlashMessage";
import { useAuth } from "../../context/AuthContext";
import { CampoMovil } from "../../components/admin/CampoMovil";
import { useEsMovil } from "../../hooks/useEsMovil";

const NOMBRE_DE_ESTADO = { draft: "Borrador", scheduled: "Programado", published: "Publicado" };

const pick = (row, keys, fallback = "—") => {
    if (!row || typeof row !== "object") return fallback;
    for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null && String(v) !== "") return String(v);
    }
    return fallback;
};

/** «28 sep, 9:00» en hora de Caracas: cuándo sale una programada. */
const cuandoSale = (iso) => {
    const d = iso ? new Date(iso) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("es", {
        timeZone: "America/Caracas",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
    });
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

    // En el teléfono la tabla son seis columnas de tres palabras cada una: se vuelve
    // tarjetas, y los filtros y el menú de crear se recogen en hojas (`CampoMovil`).
    const esMovil = useEsMovil();

    /** Lo que muestra cada pieza, igual en la tabla y en las tarjetas. */
    const describir = (row) => {
        const id = pick(row, ["id"], "");
        const status = pick(row, ["status"], "—");
        return {
            id,
            slug: pick(row, ["slug"], ""),
            title: pick(row, ["title"], "(sin título)"),
            status,
            busy: actionId === id,
            tema: principalTopic(row),
            lugar: principalPlace(row),
            // Says why publishing would be refused before anyone tries.
            missing:
                (row.format === "entrevista" && !row.video_asset_id && "sin video") ||
                (row.format === "informe" && !row.document_asset_id && "sin documento") ||
                (row.format === "podcast" && !row.audio_asset_id && "sin audio"),
            estadoClase:
                status === "published"
                    ? "se-status-pill--positive"
                    : status === "scheduled"
                      ? "se-status-pill--programado"
                      : "se-status-pill--neutral",
            estadoTexto:
                status === "scheduled"
                    ? `Programado · ${cuandoSale(row.published_at)}`
                    : NOMBRE_DE_ESTADO[status] ?? status,
            // Fijada como apertura de la portada: `en_portada` lo decide el servidor
            // (publicada y con fecha en el futuro), aquí sólo se dice hasta cuándo.
            portadaHasta: row.en_portada ? cuandoSale(row.destacada_hasta) : null,
        };
    };

    const resumenDeFiltros =
        [
            filters.format ? formatName(filters.format) : null,
            filters.status ? NOMBRE_DE_ESTADO[filters.status] : null,
            filters.unclassified ? "sin clasificar" : null,
        ]
            .filter(Boolean)
            .join(" · ") || "Todas las piezas";

    const meta = state.meta;
    const totalPages = meta?.pages ?? 1;

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1.5rem" }}>
                <h1 className="se-heading-section" style={{ margin: 0 }}>
                    Contenido
                </h1>
                {canCreate ? (
                    <CampoMovil movil={esMovil} titulo="Crear contenido" resumen="Elija el formato">
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
                    </CampoMovil>
                ) : null}
            </header>

            <div className="se-admin-filters">
                {esMovil ? (
                    <>
                        <label className="se-admin-filters__field se-admin-filters__field--grow">
                            <span className="se-form-label">Buscar</span>
                            <input
                                className="se-form-control"
                                value={filters.q}
                                onChange={setFilter("q")}
                                placeholder="Título o resumen"
                            />
                        </label>
                        <CampoMovil movil titulo="Filtros" resumen={resumenDeFiltros}>
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
                                    <option value="scheduled">Programado</option>
                                    <option value="published">Publicado</option>
                                </select>
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
                        </CampoMovil>
                    </>
                ) : (
                    <>
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
                                <option value="scheduled">Programado</option>
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
                    </>
                )}
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
                    <div className="se-admin-paginas">
                        <p className="se-text-body" style={{ margin: 0 }}>
                            Página {meta?.page ?? page} de {totalPages} — {meta?.total ?? state.items.length} en total
                        </p>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            compacta
                            etiqueta="Paginación (arriba)"
                        />
                    </div>
                    {esMovil ? (
                        <ul className="se-admin-tarjetas">
                            {state.items.map((row) => {
                                const d = describir(row);
                                return (
                                    <li key={d.id || d.slug || d.title} className="se-admin-tarjeta">
                                        <Link to={`/admin/posts/${d.id}`} className="se-admin-tarjeta__enlace">
                                            <span className="se-admin-tarjeta__meta">
                                                {formatName(row.format)} · #{d.id}
                                            </span>
                                            <span className="se-admin-tarjeta__titulo">{d.title}</span>
                                            <span className="se-admin-tarjeta__clasif">
                                                {d.tema ? (
                                                    `${d.tema}${d.lugar ? ` · ${d.lugar}` : ""}`
                                                ) : (
                                                    <span className="se-status-pill se-status-pill--neutral">
                                                        sin clasificar
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                        <div className="se-admin-tarjeta__pie">
                                            <span className={`se-status-pill ${d.estadoClase}`}>{d.estadoTexto}</span>
                                            {d.portadaHasta ? (
                                                <span className="se-status-pill se-status-pill--portada">
                                                    En portada hasta {d.portadaHasta}
                                                </span>
                                            ) : null}
                                            {d.missing ? (
                                                <em className="se-admin-table__note">{d.missing}</em>
                                            ) : null}
                                            {canPublish ? (
                                                <span className="se-admin-tarjeta__acciones">
                                                    {d.status !== "published" ? (
                                                        <button
                                                            type="button"
                                                            className="se-btn se-btn--small"
                                                            disabled={d.busy}
                                                            onClick={() => handlePublish(d.id, d.title)}
                                                        >
                                                            {d.busy
                                                                ? "Publicando…"
                                                                : d.status === "scheduled"
                                                                  ? "Publicar ya"
                                                                  : "Publicar"}
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        className="se-admin-tarjeta__eliminar"
                                                        disabled={d.busy}
                                                        onClick={() => handleDelete(d.id, d.title)}
                                                        aria-label={`Eliminar «${d.title}»`}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </span>
                                            ) : null}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
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
                                    const { id, slug, title, status, busy, tema, lugar, missing, portadaHasta } =
                                        describir(row);
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
                                                            : status === "scheduled"
                                                              ? "se-status-pill--programado"
                                                              : "se-status-pill--neutral"
                                                    }`}
                                                >
                                                    {status === "published"
                                                        ? "Publicado"
                                                        : status === "scheduled"
                                                          ? `Programado · ${cuandoSale(row.published_at)}`
                                                          : status === "draft"
                                                            ? "Borrador"
                                                            : status}
                                                </span>
                                                {portadaHasta ? (
                                                    <>
                                                        <br />
                                                        <span className="se-status-pill se-status-pill--portada">
                                                            En portada hasta {portadaHasta}
                                                        </span>
                                                    </>
                                                ) : null}
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
                                                            {busy
                                                                ? "Publicando…"
                                                                : status === "scheduled"
                                                                  ? "Publicar ya"
                                                                  : "Publicar"}
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
                    )}
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={(n) => {
                            setPage(n);
                            // Desde la de abajo, volver arriba: la página nueva empieza ahí.
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    />
                </>
            ) : null}

            <ConfirmDialog />
        </main>
    );
};
