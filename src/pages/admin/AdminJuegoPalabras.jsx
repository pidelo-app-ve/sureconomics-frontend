import { useCallback, useEffect, useMemo, useState } from "react";
import { ModalDelPanel } from "../../components/admin/ModalDelPanel";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { applyPageMeta } from "../../lib/seo";
import {
    createAdminPalabra,
    createAdminPalabrasEnLote,
    deleteAdminPalabra,
    listAdminPalabras,
    patchAdminPalabra,
} from "../../services/adminClaveService";

/**
 * El catálogo de «La Clave»: las palabras de las que sale la del día, por categoría.
 *
 * Tantas como se quiera: de una en una (el formulario de arriba) o pegando una lista
 * (una por línea, `palabra | definición | pista`). La del día la elige el servidor
 * entre las activas de cada categoría, así que desactivar una la saca del sorteo sin
 * borrarla. Las palabras pueden ser nombres propios -- equipos, películas, héroes --:
 * de 4 a 10 letras, sin espacios, y las tildes no cuentan para jugar.
 */

const NOMBRE_DE_CATEGORIA = {
    economia: "Economía",
    empresas: "Empresas",
    venezuela: "Venezuela",
    mundo: "Mundo",
    deportes: "Deportes",
    entretenimiento: "Entretenimiento",
    tecnologia: "Tecnología",
    sabor: "Sabor",
};
const nombreDe = (c) => NOMBRE_DE_CATEGORIA[c] ?? c;

const LIMITE = 50;
const NUEVA = { palabra: "", categoria: "economia", definicion: "", pista: "" };

export const AdminJuegoPalabras = () => {
    const { role } = useAuth();
    const puedeEditar = role === "publicador" || role === "admin";
    const { toastSuccess, toastError } = useAdminToast();

    const [filtros, setFiltros] = useState({ categoria: "", q: "", activa: "" });
    const [busqueda, setBusqueda] = useState("");
    const [page, setPage] = useState(1);
    const [state, setState] = useState({ status: "idle", items: [], meta: null, categorias: [], error: null });
    const [ocupado, setOcupado] = useState(null);
    const [nueva, setNueva] = useState(NUEVA);
    const [edicion, setEdicion] = useState(null);
    const [lote, setLote] = useState(null);
    const [resultadoLote, setResultadoLote] = useState(null);

    useEffect(() => {
        applyPageMeta({ title: "Admin — La Clave", description: "Las palabras del juego, por categoría." });
    }, []);

    const cargar = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const raw = await listAdminPalabras({ page, limit: LIMITE, ...filtros });
            const items = Array.isArray(raw?.data) ? raw.data : [];
            setState({ status: "success", items, meta: raw?.meta ?? null, categorias: raw?.meta?.categorias ?? [], error: null });
        } catch (err) {
            setState({ status: "error", items: [], meta: null, categorias: [], error: err });
        }
    }, [page, filtros]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const correr = async (clave, accion, mensaje) => {
        setOcupado(clave);
        try {
            const r = await accion();
            await cargar();
            if (mensaje) toastSuccess(mensaje, "La Clave");
            return r;
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo guardar el cambio."), "La Clave");
            return null;
        } finally {
            setOcupado(null);
        }
    };

    const crear = async (e) => {
        e.preventDefault();
        const r = await correr("nueva", () => createAdminPalabra(nueva), `«${nueva.palabra.trim()}» añadida.`);
        if (r) setNueva((n) => ({ ...NUEVA, categoria: n.categoria }));
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        const { id, ...body } = edicion;
        const r = await correr(id, () => patchAdminPalabra(id, body), "Palabra guardada.");
        if (r) setEdicion(null);
    };

    const enviarLote = async (e) => {
        e.preventDefault();
        setOcupado("lote");
        try {
            const r = await createAdminPalabrasEnLote(lote.categoria, lote.texto);
            setResultadoLote(r);
            await cargar();
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo cargar la lista."), "La Clave");
        } finally {
            setOcupado(null);
        }
    };

    const totalPages = Math.max(1, state.meta?.pages ?? 1);
    const totalPorCategoria = useMemo(
        () => Object.fromEntries((state.categorias ?? []).map((c) => [c.categoria, c.total])),
        [state.categorias]
    );
    const categorias = Object.keys(NOMBRE_DE_CATEGORIA);

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        La Clave: las palabras
                    </h1>
                    <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
                        De aquí sale la palabra del día de cada categoría: el servidor elige una entre
                        las activas, la misma para todos. Valen nombres propios (equipos, películas,
                        héroes): de 4 a 10 letras, una sola palabra, con tilde o sin ella. La
                        definición y la pista son opcionales; la pista se ofrece al tercer fallo y la
                        definición se enseña al terminar.
                    </p>
                    <p className="se-admin-meta-hint" style={{ marginTop: "0.4rem" }}>
                        {categorias.map((c) => `${nombreDe(c)}: ${totalPorCategoria[c] ?? 0}`).join(" · ")}
                    </p>
                </div>
                {puedeEditar ? (
                    <button
                        type="button"
                        className="se-btn se-btn--secondary"
                        onClick={() => {
                            setResultadoLote(null);
                            setLote({ categoria: nueva.categoria, texto: "" });
                        }}
                    >
                        Pegar una lista
                    </button>
                ) : null}
            </header>

            {puedeEditar ? (
                <form className="se-admin-table-wrap" style={{ marginBottom: "1rem", padding: "1rem" }} onSubmit={crear}>
                    <h2 className="se-heading-card" style={{ margin: "0 0 0.5rem" }}>
                        Añadir una palabra
                    </h2>
                    <div className="se-admin-filters">
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Palabra</span>
                            <input
                                className="se-form-control"
                                required
                                maxLength={20}
                                value={nueva.palabra}
                                onChange={(e) => setNueva((n) => ({ ...n, palabra: e.target.value }))}
                            />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Categoría</span>
                            <select
                                className="se-form-control"
                                value={nueva.categoria}
                                onChange={(e) => setNueva((n) => ({ ...n, categoria: e.target.value }))}
                            >
                                {categorias.map((c) => (
                                    <option key={c} value={c}>{nombreDe(c)}</option>
                                ))}
                            </select>
                        </label>
                        <label className="se-admin-filters__field se-admin-filters__field--grow">
                            <span className="se-form-label">Definición (opcional)</span>
                            <input
                                className="se-form-control"
                                value={nueva.definicion}
                                onChange={(e) => setNueva((n) => ({ ...n, definicion: e.target.value }))}
                            />
                        </label>
                        <label className="se-admin-filters__field se-admin-filters__field--grow">
                            <span className="se-form-label">Pista (opcional)</span>
                            <input
                                className="se-form-control"
                                maxLength={200}
                                value={nueva.pista}
                                onChange={(e) => setNueva((n) => ({ ...n, pista: e.target.value }))}
                            />
                        </label>
                        <div className="se-admin-filters__field" style={{ alignSelf: "end" }}>
                            <button type="submit" className="se-btn" disabled={ocupado === "nueva"}>
                                Añadir
                            </button>
                        </div>
                    </div>
                </form>
            ) : null}

            <div className="se-admin-filters" style={{ marginBottom: "1rem" }}>
                <label className="se-admin-filters__field">
                    <span className="se-form-label">Categoría</span>
                    <select
                        className="se-form-control"
                        value={filtros.categoria}
                        onChange={(e) => {
                            setPage(1);
                            setFiltros((f) => ({ ...f, categoria: e.target.value }));
                        }}
                    >
                        <option value="">Todas</option>
                        {categorias.map((c) => (
                            <option key={c} value={c}>{nombreDe(c)}</option>
                        ))}
                    </select>
                </label>
                <label className="se-admin-filters__field">
                    <span className="se-form-label">Estado</span>
                    <select
                        className="se-form-control"
                        value={filtros.activa}
                        onChange={(e) => {
                            setPage(1);
                            setFiltros((f) => ({ ...f, activa: e.target.value }));
                        }}
                    >
                        <option value="">Todas</option>
                        <option value="1">En juego</option>
                        <option value="0">Retiradas</option>
                    </select>
                </label>
                <form
                    className="se-admin-filters__field se-admin-filters__field--grow"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPage(1);
                        setFiltros((f) => ({ ...f, q: busqueda }));
                    }}
                >
                    <span className="se-form-label">Buscar</span>
                    <input
                        className="se-form-control"
                        type="search"
                        placeholder="Palabra, definición o pista"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </form>
            </div>

            {state.status === "loading" && state.items.length === 0 ? <LoadingState title="Cargando palabras…" /> : null}
            {state.status === "error" ? (
                <ErrorState title="No se pudieron cargar las palabras" error={state.error} onRetry={cargar} />
            ) : null}
            {state.status === "success" && state.items.length === 0 ? (
                <EmptyState title="No hay palabras con esos filtros" />
            ) : null}

            {state.items.length > 0 ? (
                <>
                    <div className="se-admin-paginas">
                        <p className="se-text-body" style={{ margin: 0 }}>
                            Página {state.meta?.page ?? page} de {totalPages} — {state.meta?.total ?? state.items.length} en total
                        </p>
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} compacta etiqueta="Paginación" />
                    </div>
                    <div className="se-admin-table-wrap">
                        <table className="se-admin-table">
                            <thead>
                                <tr>
                                    <th scope="col">Palabra</th>
                                    <th scope="col">Letras</th>
                                    <th scope="col">Categoría</th>
                                    <th scope="col">Definición</th>
                                    <th scope="col">Pista</th>
                                    <th scope="col">Estado</th>
                                    {puedeEditar ? <th scope="col">Acciones</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {state.items.map((row) => {
                                    const busy = ocupado === row.id;
                                    return (
                                        <tr key={row.id} style={row.is_active ? undefined : { opacity: 0.55 }}>
                                            <td><strong>{row.palabra}</strong></td>
                                            <td>{row.clave?.length ?? row.palabra.length}</td>
                                            <td>{nombreDe(row.categoria)}</td>
                                            <td>{row.definicion || "—"}</td>
                                            <td>{row.pista || "—"}</td>
                                            <td>{row.is_active ? "En juego" : "Retirada"}</td>
                                            {puedeEditar ? (
                                                <td className="se-admin-table__actions">
                                                    <button
                                                        type="button"
                                                        className="se-link se-header__nav-link--button"
                                                        disabled={busy}
                                                        onClick={() =>
                                                            setEdicion({
                                                                id: row.id,
                                                                palabra: row.palabra,
                                                                categoria: row.categoria,
                                                                definicion: row.definicion || "",
                                                                pista: row.pista || "",
                                                            })
                                                        }
                                                    >
                                                        Editar
                                                    </button>
                                                    {" · "}
                                                    <button
                                                        type="button"
                                                        className="se-link se-header__nav-link--button"
                                                        disabled={busy}
                                                        onClick={() =>
                                                            correr(
                                                                row.id,
                                                                () => patchAdminPalabra(row.id, { is_active: !row.is_active }),
                                                                row.is_active ? `«${row.palabra}» retirada del sorteo.` : `«${row.palabra}» vuelve al sorteo.`
                                                            )
                                                        }
                                                    >
                                                        {row.is_active ? "Retirar" : "Reactivar"}
                                                    </button>
                                                    {" · "}
                                                    <button
                                                        type="button"
                                                        className="se-link se-header__nav-link--button"
                                                        disabled={busy}
                                                        onClick={() => {
                                                            if (window.confirm(`¿Borrar «${row.palabra}»? Si solo quiere sacarla del sorteo, retírela.`)) {
                                                                correr(row.id, () => deleteAdminPalabra(row.id), `«${row.palabra}» borrada.`);
                                                            }
                                                        }}
                                                    >
                                                        Borrar
                                                    </button>
                                                </td>
                                            ) : null}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}

            <ModalDelPanel
                abierto={Boolean(edicion)}
                onCerrar={() => setEdicion(null)}
                titulo="Editar la palabra"
                subtitulo="Cambiar la palabra cambia la clave con la que se juega; las partidas de hoy no se ven afectadas."
                ocupado={edicion ? ocupado === edicion.id : false}
            >
                {edicion ? (
                    <form onSubmit={guardarEdicion} className="se-admin-filters" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Palabra</span>
                            <input
                                className="se-form-control"
                                required
                                maxLength={20}
                                value={edicion.palabra}
                                onChange={(e) => setEdicion((d) => ({ ...d, palabra: e.target.value }))}
                            />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Categoría</span>
                            <select
                                className="se-form-control"
                                value={edicion.categoria}
                                onChange={(e) => setEdicion((d) => ({ ...d, categoria: e.target.value }))}
                            >
                                {categorias.map((c) => (
                                    <option key={c} value={c}>{nombreDe(c)}</option>
                                ))}
                            </select>
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Definición</span>
                            <textarea
                                className="se-form-control"
                                rows={3}
                                value={edicion.definicion}
                                onChange={(e) => setEdicion((d) => ({ ...d, definicion: e.target.value }))}
                            />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Pista</span>
                            <input
                                className="se-form-control"
                                maxLength={200}
                                value={edicion.pista}
                                onChange={(e) => setEdicion((d) => ({ ...d, pista: e.target.value }))}
                            />
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button type="button" className="se-btn se-btn--secondary" onClick={() => setEdicion(null)}>
                                Cancelar
                            </button>
                            <button type="submit" className="se-btn" disabled={ocupado === edicion.id}>
                                Guardar
                            </button>
                        </div>
                    </form>
                ) : null}
            </ModalDelPanel>

            <ModalDelPanel
                abierto={Boolean(lote)}
                onCerrar={() => setLote(null)}
                ancho="ancho"
                titulo="Pegar una lista de palabras"
                subtitulo="Una por línea. Opcionalmente, después de una barra vertical, la definición y la pista: palabra | definición | pista."
                ocupado={ocupado === "lote"}
            >
                {lote ? (
                    <form onSubmit={enviarLote} className="se-admin-filters" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Categoría</span>
                            <select
                                className="se-form-control"
                                value={lote.categoria}
                                onChange={(e) => setLote((l) => ({ ...l, categoria: e.target.value }))}
                            >
                                {categorias.map((c) => (
                                    <option key={c} value={c}>{nombreDe(c)}</option>
                                ))}
                            </select>
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Palabras</span>
                            <textarea
                                className="se-form-control"
                                rows={12}
                                required
                                placeholder={"Magallanes | El equipo de béisbol de Valencia | Rival eterno del Caracas\nArepa\nBatman | El héroe de Gotham"}
                                value={lote.texto}
                                onChange={(e) => setLote((l) => ({ ...l, texto: e.target.value }))}
                            />
                        </label>
                        {resultadoLote ? (
                            <div className="se-admin-meta-hint" role="status">
                                <p style={{ margin: 0 }}>
                                    Añadidas: <strong>{resultadoLote.creadas}</strong> · Ya estaban:{" "}
                                    <strong>{resultadoLote.repetidas}</strong> · Con error:{" "}
                                    <strong>{resultadoLote.invalidas?.length ?? 0}</strong>
                                </p>
                                {resultadoLote.invalidas?.length ? (
                                    <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem" }}>
                                        {resultadoLote.invalidas.map((i) => (
                                            <li key={`${i.linea}-${i.motivo}`}>
                                                Línea {i.linea}: {i.motivo}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        ) : null}
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button type="button" className="se-btn se-btn--secondary" onClick={() => setLote(null)}>
                                {resultadoLote ? "Cerrar" : "Cancelar"}
                            </button>
                            <button type="submit" className="se-btn" disabled={ocupado === "lote"}>
                                Cargar la lista
                            </button>
                        </div>
                    </form>
                ) : null}
            </ModalDelPanel>
        </main>
    );
};

export default AdminJuegoPalabras;
