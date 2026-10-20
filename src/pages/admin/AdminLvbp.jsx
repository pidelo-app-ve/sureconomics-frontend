import { useCallback, useEffect, useState } from "react";
import { ModalDelPanel } from "../../components/admin/ModalDelPanel";
import { EmptyState, ErrorState, LoadingState } from "../../components/content";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { applyPageMeta } from "../../lib/seo";
import { adminRequest } from "../../lib/api";
import { unwrapEntity } from "../../services/adminResponseUtils";

/**
 * Los juegos de la LVBP en el panel.
 *
 * Casi todo lo trae solo la API (`lvbp_service.py`): esta pantalla sirve para lo que
 * la API no da -- un juego de hace más de un día, como el inaugural -- y para corregir
 * un marcador o una suspensión que llegó mal. Un juego tocado a mano queda bloqueado:
 * la API no lo pisa hasta que se suelta.
 */

const SIGLAS = ["CAR", "MAG", "LAG", "ARA", "LAR", "ZUL", "ANZ", "MAR"];
const ESTADOS = {
  programado: "Por jugar",
  en_vivo: "En vivo",
  final: "Final",
  suspendido: "Suspendido",
  pospuesto: "Pospuesto",
  cancelado: "Cancelado",
};
const NUEVO = { fecha: "", hora: "19:00", local: "MAG", visitante: "LAG", carreras_local: "", carreras_visitante: "", estado: "final", estadio: "" };

const fechaIso = (d) => d.toISOString().slice(0, 10);
const cuandoFue = (iso) => (iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" }) : "nunca");
const numeroONulo = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export const AdminLvbp = () => {
    const { role } = useAuth();
    const puedeEditar = role === "publicador" || role === "admin";
    const { toastSuccess, toastError } = useAdminToast();
    const [rango, setRango] = useState(() => {
        const hoy = new Date();
        return { desde: fechaIso(new Date(hoy.getTime() - 14 * 86400000)), hasta: fechaIso(new Date(hoy.getTime() + 7 * 86400000)) };
    });
    const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
    const [ocupado, setOcupado] = useState(null);
    const [nuevo, setNuevo] = useState(NUEVO);
    const [edicion, setEdicion] = useState(null);

    useEffect(() => {
        applyPageMeta({ title: "Admin — LVBP", description: "Los juegos del béisbol venezolano." });
    }, []);

    const cargar = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const raw = await adminRequest("/admin/lvbp/juegos", { query: rango });
            setState({ status: "success", items: Array.isArray(raw?.data) ? raw.data : [], meta: raw?.meta ?? null, error: null });
        } catch (err) {
            setState({ status: "error", items: [], meta: null, error: err });
        }
    }, [rango]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const correr = async (clave, accion, mensaje) => {
        setOcupado(clave);
        try {
            const r = await accion();
            await cargar();
            if (mensaje) toastSuccess(mensaje, "LVBP");
            return r;
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo guardar el cambio."), "LVBP");
            return null;
        } finally {
            setOcupado(null);
        }
    };

    const crear = async (e) => {
        e.preventDefault();
        const body = {
            fecha: nuevo.fecha,
            hora: nuevo.hora || null,
            local: nuevo.local,
            visitante: nuevo.visitante,
            carreras_local: numeroONulo(nuevo.carreras_local),
            carreras_visitante: numeroONulo(nuevo.carreras_visitante),
            estado: nuevo.estado,
            estadio: nuevo.estadio.trim() || null,
        };
        const r = await correr("nuevo", () => unwrapEntity(adminRequest("/admin/lvbp/juegos", { method: "POST", json: body })), "Juego cargado.");
        if (r) setNuevo((n) => ({ ...NUEVO, fecha: n.fecha }));
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        const { id, ...resto } = edicion;
        const body = {
            fecha: resto.fecha,
            hora: resto.hora || null,
            local: resto.local,
            visitante: resto.visitante,
            carreras_local: numeroONulo(resto.carreras_local),
            carreras_visitante: numeroONulo(resto.carreras_visitante),
            estado: resto.estado,
            estadio: resto.estadio.trim() || null,
            bloqueado: Boolean(resto.bloqueado),
        };
        const r = await correr(id, () => unwrapEntity(adminRequest(`/admin/lvbp/juegos/${id}`, { method: "PATCH", json: body })), "Juego guardado.");
        if (r) setEdicion(null);
    };

    const sincronizar = () =>
        correr("sync", async () => {
            const r = unwrapEntity(await adminRequest("/admin/lvbp/sincronizar", { method: "POST", json: {} }));
            if (r?.agotado) throw new Error("Se agotaron las consultas de hoy.");
            // La API tardó más de unos segundos: el servidor sigue por detrás y no
            // deja este botón colgado. Se vuelve a mirar en un rato.
            if (r?.en_marcha) {
                toastSuccess("Se está actualizando por detrás. Los cambios aparecen en un momento.", "LVBP");
                window.setTimeout(() => cargar(), 15000);
                return r;
            }
            toastSuccess(`Sincronizado: ${r.creados} nuevos, ${r.actualizados} actualizados.`, "LVBP");
            return r;
        });

    const sync = state.meta?.sync ?? {};
    const equipos = state.meta?.equipos ?? SIGLAS.map((s) => ({ sigla: s, nombre: s }));
    const nombre = (sigla) => equipos.find((e) => e.sigla === sigla)?.nombre ?? sigla;

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        LVBP: los juegos
                    </h1>
                    <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
                        Los marcadores llegan solos de API-Sports mientras hay juego, y la tabla de
                        posiciones se calcula con los juegos terminados que hay aquí. Esta pantalla es
                        para lo que la API no trae (un juego de hace más de un día) y para corregir un
                        marcador. Un juego tocado a mano queda bloqueado: la API ya no lo pisa.
                    </p>
                </div>
            </header>

            <section className="se-admin-table-wrap" style={{ marginBottom: "1rem", padding: "1rem" }}>
                <div className="se-admin-filters" style={{ alignItems: "center" }}>
                    <div className="se-admin-filters__field se-admin-filters__field--grow">
                        <span className="se-form-label">Sincronización con API-Sports</span>
                        <span className="se-admin-meta-hint">
                            {sync.disponible ? "Clave configurada" : "Sin clave (API_SPORTS_KEY): solo carga manual"}
                            {" · "}consultas hoy: {sync.consultas_hoy ?? 0} de {sync.tope ?? 92}
                            {" · "}última vez: {cuandoFue(sync.sincronizado_en)}
                            {sync.ultimo_error ? ` · último error: ${sync.ultimo_error}` : ""}
                        </span>
                    </div>
                    {puedeEditar && sync.disponible ? (
                        <button type="button" className="se-btn se-btn--secondary" onClick={sincronizar} disabled={ocupado === "sync"}>
                            {ocupado === "sync" ? "Sincronizando…" : "Sincronizar ahora"}
                        </button>
                    ) : null}
                </div>
            </section>

            {puedeEditar ? (
                <form className="se-admin-table-wrap" style={{ marginBottom: "1rem", padding: "1rem" }} onSubmit={crear}>
                    <h2 className="se-heading-card" style={{ margin: "0 0 0.5rem" }}>
                        Cargar un juego a mano
                    </h2>
                    <div className="se-admin-filters">
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Fecha</span>
                            <input className="se-form-control" type="date" required value={nuevo.fecha} onChange={(e) => setNuevo((n) => ({ ...n, fecha: e.target.value }))} />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Hora</span>
                            <input className="se-form-control" type="time" value={nuevo.hora} onChange={(e) => setNuevo((n) => ({ ...n, hora: e.target.value }))} />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Visitante</span>
                            <select className="se-form-control" value={nuevo.visitante} onChange={(e) => setNuevo((n) => ({ ...n, visitante: e.target.value }))}>
                                {equipos.map((q) => <option key={q.sigla} value={q.sigla}>{q.nombre}</option>)}
                            </select>
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Carreras</span>
                            <input className="se-form-control" type="number" min="0" max="99" value={nuevo.carreras_visitante} onChange={(e) => setNuevo((n) => ({ ...n, carreras_visitante: e.target.value }))} />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Local</span>
                            <select className="se-form-control" value={nuevo.local} onChange={(e) => setNuevo((n) => ({ ...n, local: e.target.value }))}>
                                {equipos.map((q) => <option key={q.sigla} value={q.sigla}>{q.nombre}</option>)}
                            </select>
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Carreras</span>
                            <input className="se-form-control" type="number" min="0" max="99" value={nuevo.carreras_local} onChange={(e) => setNuevo((n) => ({ ...n, carreras_local: e.target.value }))} />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Estado</span>
                            <select className="se-form-control" value={nuevo.estado} onChange={(e) => setNuevo((n) => ({ ...n, estado: e.target.value }))}>
                                {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </label>
                        <label className="se-admin-filters__field se-admin-filters__field--grow">
                            <span className="se-form-label">Estadio (opcional; si no, el del local)</span>
                            <input className="se-form-control" value={nuevo.estadio} onChange={(e) => setNuevo((n) => ({ ...n, estadio: e.target.value }))} />
                        </label>
                        <div className="se-admin-filters__field" style={{ alignSelf: "end" }}>
                            <button type="submit" className="se-btn" disabled={ocupado === "nuevo"}>Cargar</button>
                        </div>
                    </div>
                </form>
            ) : null}

            <div className="se-admin-filters" style={{ marginBottom: "1rem" }}>
                <label className="se-admin-filters__field">
                    <span className="se-form-label">Desde</span>
                    <input className="se-form-control" type="date" value={rango.desde} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} />
                </label>
                <label className="se-admin-filters__field">
                    <span className="se-form-label">Hasta</span>
                    <input className="se-form-control" type="date" value={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} />
                </label>
            </div>

            {state.status === "loading" && !state.items.length ? <LoadingState title="Cargando juegos…" /> : null}
            {state.status === "error" ? <ErrorState title="No se pudieron cargar los juegos" error={state.error} onRetry={cargar} /> : null}
            {state.status === "success" && !state.items.length ? <EmptyState title="No hay juegos en esas fechas" /> : null}

            {state.items.length ? (
                <div className="se-admin-table-wrap">
                    <table className="se-admin-table">
                        <thead>
                            <tr>
                                <th scope="col">Fecha</th>
                                <th scope="col">Hora</th>
                                <th scope="col">Visitante</th>
                                <th scope="col">Local</th>
                                <th scope="col">Marcador</th>
                                <th scope="col">Estado</th>
                                <th scope="col">Origen</th>
                                {puedeEditar ? <th scope="col">Acciones</th> : null}
                            </tr>
                        </thead>
                        <tbody>
                            {state.items.map((j) => (
                                <tr key={j.id}>
                                    <td>{j.fecha}</td>
                                    <td>{j.hora || "—"}</td>
                                    <td>{nombre(j.visitante)}</td>
                                    <td>{nombre(j.local)}</td>
                                    <td>
                                        {j.carreras_visitante ?? "—"} – {j.carreras_local ?? "—"}
                                        {j.estado === "en_vivo" && j.inning ? ` (${j.inning}.º)` : ""}
                                    </td>
                                    <td>{ESTADOS[j.estado] ?? j.estado}</td>
                                    <td>{j.fuente === "manual" ? "Manual" : "API"}{j.bloqueado ? " · bloqueado" : ""}</td>
                                    {puedeEditar ? (
                                        <td className="se-admin-table__actions">
                                            <button
                                                type="button"
                                                className="se-link se-header__nav-link--button"
                                                disabled={ocupado === j.id}
                                                onClick={() => setEdicion({
                                                    id: j.id, fecha: j.fecha, hora: j.hora || "", local: j.local, visitante: j.visitante,
                                                    carreras_local: j.carreras_local ?? "", carreras_visitante: j.carreras_visitante ?? "",
                                                    estado: j.estado, estadio: j.estadio || "", bloqueado: true,
                                                })}
                                            >
                                                Corregir
                                            </button>
                                            {" · "}
                                            <button
                                                type="button"
                                                className="se-link se-header__nav-link--button"
                                                disabled={ocupado === j.id}
                                                onClick={() => {
                                                    if (window.confirm("¿Borrar este juego? Si la API lo trae, volverá a aparecer en la próxima sincronización.")) {
                                                        correr(j.id, () => adminRequest(`/admin/lvbp/juegos/${j.id}`, { method: "DELETE" }), "Juego borrado.");
                                                    }
                                                }}
                                            >
                                                Borrar
                                            </button>
                                        </td>
                                    ) : null}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            <ModalDelPanel
                abierto={Boolean(edicion)}
                onCerrar={() => setEdicion(null)}
                titulo="Corregir el juego"
                subtitulo="Al guardar, el juego queda bloqueado: la API no lo vuelve a tocar. Desmarque «bloqueado» para que la API vuelva a mandar."
                ocupado={edicion ? ocupado === edicion.id : false}
            >
                {edicion ? (
                    <form onSubmit={guardarEdicion} className="se-admin-filters" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <div className="se-admin-filters">
                            <label className="se-admin-filters__field">
                                <span className="se-form-label">Fecha</span>
                                <input className="se-form-control" type="date" required value={edicion.fecha} onChange={(e) => setEdicion((d) => ({ ...d, fecha: e.target.value }))} />
                            </label>
                            <label className="se-admin-filters__field">
                                <span className="se-form-label">Hora</span>
                                <input className="se-form-control" type="time" value={edicion.hora} onChange={(e) => setEdicion((d) => ({ ...d, hora: e.target.value }))} />
                            </label>
                            <label className="se-admin-filters__field">
                                <span className="se-form-label">Estado</span>
                                <select className="se-form-control" value={edicion.estado} onChange={(e) => setEdicion((d) => ({ ...d, estado: e.target.value }))}>
                                    {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </label>
                        </div>
                        <div className="se-admin-filters">
                            <label className="se-admin-filters__field se-admin-filters__field--grow">
                                <span className="se-form-label">Visitante</span>
                                <select className="se-form-control" value={edicion.visitante} onChange={(e) => setEdicion((d) => ({ ...d, visitante: e.target.value }))}>
                                    {equipos.map((q) => <option key={q.sigla} value={q.sigla}>{q.nombre}</option>)}
                                </select>
                            </label>
                            <label className="se-admin-filters__field">
                                <span className="se-form-label">Carreras</span>
                                <input className="se-form-control" type="number" min="0" max="99" value={edicion.carreras_visitante} onChange={(e) => setEdicion((d) => ({ ...d, carreras_visitante: e.target.value }))} />
                            </label>
                        </div>
                        <div className="se-admin-filters">
                            <label className="se-admin-filters__field se-admin-filters__field--grow">
                                <span className="se-form-label">Local</span>
                                <select className="se-form-control" value={edicion.local} onChange={(e) => setEdicion((d) => ({ ...d, local: e.target.value }))}>
                                    {equipos.map((q) => <option key={q.sigla} value={q.sigla}>{q.nombre}</option>)}
                                </select>
                            </label>
                            <label className="se-admin-filters__field">
                                <span className="se-form-label">Carreras</span>
                                <input className="se-form-control" type="number" min="0" max="99" value={edicion.carreras_local} onChange={(e) => setEdicion((d) => ({ ...d, carreras_local: e.target.value }))} />
                            </label>
                        </div>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Estadio</span>
                            <input className="se-form-control" value={edicion.estadio} onChange={(e) => setEdicion((d) => ({ ...d, estadio: e.target.value }))} />
                        </label>
                        <label className="se-form-field se-acceso" htmlFor="lvbp-bloqueado">
                            <span className="se-acceso__fila">
                                <input id="lvbp-bloqueado" type="checkbox" checked={Boolean(edicion.bloqueado)} onChange={(e) => setEdicion((d) => ({ ...d, bloqueado: e.target.checked }))} />
                                <span className="se-form-label se-acceso__titulo">Bloqueado: la API no lo toca</span>
                            </span>
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button type="button" className="se-btn se-btn--secondary" onClick={() => setEdicion(null)}>Cancelar</button>
                            <button type="submit" className="se-btn" disabled={ocupado === edicion.id}>Guardar</button>
                        </div>
                    </form>
                ) : null}
            </ModalDelPanel>
        </main>
    );
};

export default AdminLvbp;
