import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAdminPost, listAdminPosts, publishAdminPost } from "../../services/adminPostsService";
import { listAdminFormats } from "../../services/adminTaxonomyService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useBuscadorConEspera } from "../../hooks/useBuscadorConEspera";
import { useFlashMessage } from "../../hooks/useFlashMessage";
import { useAuth } from "../../context/AuthContext";
import { CampoMovil } from "../../components/admin/CampoMovil";
import { useEsMovil } from "../../hooks/useEsMovil";
import { rutaDePieza } from "../../lib/pieza";
import { RecorridoVista } from "../../components/recorrido/RecorridoVista";
import { recorridoContenido } from "../../lib/guias/guiaContenido";
import { CabeceraDePagina } from "../../components/admin/CabeceraDePagina";

const { ancla } = recorridoContenido;

/** La pieza en el sitio, para abrirla desde la lista. */
const enElSitio = (row) => rutaDePieza({ formatoApi: row?.format, slug: row?.slug });

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
    const canCreate = Boolean(role);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        format: "",
        status: "",
        q: "",
        unclassified: false,
        // Piezas de lectores cuya cuenta cambió de nombre o foto (ver el contador).
        firmaDesactualizada: false,
    });
    // Cuántas piezas de colaboradores tienen la cuenta cambiada: el contador de arriba.
    // No caduca: sale mientras quede alguna, hasta que la redacción decide en el editor.
    const [cambiosDeColaboradores, setCambiosDeColaboradores] = useState(0);
    const [formats, setFormats] = useState([]);
    const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
    const [actionId, setActionId] = useState(null);
    const [actionFeedback, setActionFeedback] = useState({ status: "idle", message: "", error: null });
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const flash = useFlashMessage();
    // Lo escrito (`texto`) y lo pedido (`filters.q`), aparte: una petición cuando se deja de escribir.
    const [texto, setTexto] = useBuscadorConEspera(filters.q, (q) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, q }));
    });

    const load = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const { items, meta } = await listAdminPosts({ page, limit: 20, ...filters });
            setState({ status: "success", items, meta, error: null });
            listAdminPosts({ firmaDesactualizada: true, limit: 1 })
                .then(({ meta: m }) => setCambiosDeColaboradores(Number(m?.total) || 0))
                .catch(() => setCambiosDeColaboradores(0));
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

    const verCambiosDeColaboradores = (activo) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, firmaDesactualizada: activo }));
    };

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

    const handleDelete = async (id, title, status) => {
        setActionFeedback({ status: "idle", message: "", error: null });
        await confirm({
            title: "Eliminar pieza",
            description: `¿Eliminar «${title}» (ID ${id}) de forma permanente?`,
            confirmLabel: "Eliminar",
            // Los comentarios caen con la pieza (CASCADE); despublicar está en el editor.
            warning:
                status === "published" &&
                "Con ella se borran sus comentarios. Si solo quiere quitarla de la web, despublíquela.",
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
            ingles: Boolean(row.en_ingles),
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
            // De un lector cuya cuenta ya no dice lo mismo que su firma congelada.
            firmaCambiada: Boolean(row.firma_desactualizada),
        };
    };

    const resumenDeFiltros =
        [
            filters.format ? formatName(filters.format) : null,
            filters.status ? NOMBRE_DE_ESTADO[filters.status] : null,
            filters.unclassified ? "sin clasificar" : null,
            filters.firmaDesactualizada ? "colaboradores con cambios" : null,
        ]
            .filter(Boolean)
            .join(" · ") || "Todas las piezas";

    const meta = state.meta;
    const totalPages = meta?.pages ?? 1;

    const buscador = (
        <label className="se-admin-filters__field se-admin-filters__field--grow">
            <span className="se-form-label">Buscar</span>
            <input className="se-form-control" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Título o resumen" />
        </label>
    );

    return (
        <main role="main">
            <CabeceraDePagina
              titulo="Contenido"
              acciones={
                <>
                  {canCreate ? (
                      <Link to="/admin/posts/new" className="se-btn" {...ancla("crear")}>
                          Crear pieza
                      </Link>
                  ) : null}
                </>
              }
              guia={recorridoContenido}
            />

            <div className="se-admin-filters" {...ancla("filtros")}>
                {esMovil ? (
                    <>
                        {buscador}
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
                        {buscador}
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

            {filters.firmaDesactualizada || cambiosDeColaboradores > 0 ? (
                <p className="se-text-body" {...ancla("colaboradores")}>
                    {filters.firmaDesactualizada ? (
                        <>
                            Viendo solo las piezas de lectores cuya cuenta cambió de nombre o foto: su firma
                            no cambia sola. Ábralas y decida en «Firma y foto».{" "}
                            <button
                                type="button"
                                className="se-btn se-btn--secondary"
                                onClick={() => verCambiosDeColaboradores(false)}
                            >
                                Ver todas las piezas
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="se-btn se-btn--secondary"
                            onClick={() => verCambiosDeColaboradores(true)}
                        >
                            {cambiosDeColaboradores === 1
                                ? "1 pieza de un colaborador con cambios en su cuenta"
                                : `${cambiosDeColaboradores} piezas de colaboradores con cambios en su cuenta`}
                        </button>
                    )}
                </p>
            ) : null}

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
                    title={
                        filters.firmaDesactualizada
                            ? "Ningún cambio pendiente"
                            : filters.unclassified
                              ? "Nada sin clasificar"
                              : "Sin resultados"
                    }
                    description={
                        filters.firmaDesactualizada
                            ? "La firma de todas las piezas de colaboradores coincide con su cuenta."
                            : filters.unclassified
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
                        <ul className="se-admin-tarjetas" {...ancla("lista")}>
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
                                            {d.ingles ? (
                                                <span className="se-status-pill se-status-pill--neutral" title="Tiene versión en inglés">
                                                    EN
                                                </span>
                                            ) : null}
                                            {d.portadaHasta ? (
                                                <span className="se-status-pill se-status-pill--portada">
                                                    En portada hasta {d.portadaHasta}
                                                </span>
                                            ) : null}
                                            {d.firmaCambiada ? (
                                                <span className="se-status-pill se-status-pill--neutral">
                                                    Su cuenta cambió
                                                </span>
                                            ) : null}
                                            {d.missing ? (
                                                <em className="se-admin-table__note">{d.missing}</em>
                                            ) : null}
                                            <Link
                                                to={`/admin/posts/${d.id}`}
                                                className="se-link se-admin-tarjeta__ver"
                                                aria-label={`Editar «${d.title}»`}
                                            >
                                                Editar
                                            </Link>
                                            {d.status === "published" && d.slug ? (
                                                <a
                                                    href={enElSitio(row)}
                                                    className="se-link se-admin-tarjeta__ver"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`Ver «${d.title}» en el sitio (se abre en otra pestaña)`}
                                                >
                                                    Ver
                                                </a>
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
                                                        onClick={() => handleDelete(d.id, d.title, d.status)}
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
                    <div className="se-admin-table-wrap" {...ancla("lista")}>
                        <table className="se-admin-table">
                            <thead>
                                <tr>
                                    <th scope="col">Formato</th>
                                    <th scope="col">Título</th>
                                    <th scope="col">Tema · Lugar</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.items.map((row) => {
                                    const { id, slug, title, status, busy, tema, lugar, missing, portadaHasta, firmaCambiada } =
                                        describir(row);
                                    return (
                                        <tr key={id || slug || title}>
                                            <td>{formatName(row.format)}</td>
                                            <td>
                                                <Link to={`/admin/posts/${id}`} className="se-admin-table__titulo">
                                                    {title}
                                                </Link>
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
                                                {row.en_ingles ? (
                                                    <>
                                                        {" "}
                                                        <span className="se-status-pill se-status-pill--neutral" title="Tiene versión en inglés">
                                                            EN
                                                        </span>
                                                    </>
                                                ) : null}
                                                {portadaHasta ? (
                                                    <>
                                                        <br />
                                                        <span className="se-status-pill se-status-pill--portada">
                                                            En portada hasta {portadaHasta}
                                                        </span>
                                                    </>
                                                ) : null}
                                                {firmaCambiada ? (
                                                    <>
                                                        <br />
                                                        <span
                                                            className="se-status-pill se-status-pill--neutral"
                                                            title="Pieza de un lector: su cuenta ya no dice lo mismo que la firma"
                                                        >
                                                            Su cuenta cambió
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
                                                <Link to={`/admin/posts/${id}`} className="se-link" aria-label={`Editar «${title}»`}>
                                                    Editar
                                                </Link>
                                                {status === "published" && slug ? (
                                                    <>
                                                        {" · "}
                                                        <a
                                                            href={enElSitio(row)}
                                                            className="se-link"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={`Ver «${title}» en el sitio (se abre en otra pestaña)`}
                                                        >
                                                            Ver
                                                        </a>
                                                    </>
                                                ) : null}
                                                {status !== "published" && canPublish ? (
                                                    <>
                                                        {" · "}
                                                        <button
                                                            type="button"
                                                            className="se-link se-header__nav-link--button"
                                                            disabled={busy}
                                                            onClick={() => handlePublish(id, title)}
                                                            aria-label={`Publicar «${title}»`}
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
                                                        <button
                                                            type="button"
                                                            className="se-admin-table__eliminar"
                                                            disabled={busy}
                                                            onClick={() => handleDelete(id, title, status)}
                                                            aria-label={`Eliminar «${title}»`}
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
            <RecorridoVista recorrido={recorridoContenido} />
        </main>
    );
};
