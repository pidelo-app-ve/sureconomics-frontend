import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ErrorState, LoadingState } from "../../../../components/content";
import { useAdminToast } from "../../../../context/AdminToastContext";
import { useAdminConfirm } from "../../../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../../../lib/adminErrorMessage";
import { porDolar } from "../../logica/formato";
import { recorridoCinta } from "../../../../lib/guias/guiaCinta";
import {
    aceptarCotizacion,
    deshacerOcultar,
    getMonedasDelPanel,
    ocultarCotizacion,
} from "../servicios/api";

const { ancla } = recorridoCinta;

const cuando = (iso) => (iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" }) : "nunca");
const delDia = (fecha) => (fecha ? new Date(`${fecha}T12:00:00`).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" }) : "—");
const cifra = (valor) => (valor == null ? "—" : porDolar(valor, "es"));
const EN_MINUTOS = "Se verá en todas partes en unos minutos.";
const ACCIONES = { aceptar: aceptarCotizacion, ocultar: ocultarCotizacion, deshacer: deshacerOcultar };

/**
 * Las monedas de la región dentro de «Cinta de mercado»: lo que se publica de cada una y,
 * sobre todo, las lecturas que no cuadraron (auditoría del 17-nov-2026, D-15).
 *
 * Una lectura fuera de su banda, o que salta más de lo normal frente al último dato bueno,
 * se guarda como «sospechosa» y no se publica: en el sitio sigue el último dato bueno con
 * su fecha, y al equipo le llega un aviso por el bot. Aquí alguien decide:
 * - «Aceptar como buena» si es de verdad (una devaluación): se publica y pasa a ser la
 *   referencia de la lectura siguiente;
 * - «Ocultar esta cotización» si es un error. Si la fuente vuelve a dar la misma cifra
 *   estos días, tampoco se publica: se guarda oculta con las demás, sin volver a preguntar.
 * Una racha (lecturas malas seguidas de la misma fuente, desde la última buena) se decide
 * de una vez. Lo oculto se lista abajo con quién y cuándo, y se puede deshacer.
 *
 * Tras decidir, /monedas cambia al momento; el cintillo y el resto del servidor, en unos
 * minutos.
 */
export const MonedasDelPanel = ({ puedeEditar }) => {
    const [datos, setDatos] = useState(null);
    const [carga, setCarga] = useState({ status: "idle", error: null });
    const [ocupado, setOcupado] = useState(null);
    const { toastSuccess, toastError } = useAdminToast();
    const { confirm, ConfirmDialog } = useAdminConfirm();

    const cargar = useCallback(async () => {
        setCarga({ status: "loading", error: null });
        try {
            setDatos(await getMonedasDelPanel());
            setCarga({ status: "success", error: null });
        } catch (err) {
            setCarga({ status: "error", error: err });
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const decidir = async (id, accion, hecho) => {
        setOcupado(id);
        try {
            const r = await ACCIONES[accion](id);
            setDatos(r);
            toastSuccess(hecho, "Monedas de la región");
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo guardar la decisión."), "Monedas de la región");
        } finally {
            setOcupado(null);
        }
    };

    const aceptar = async (s) => {
        const si = await confirm({
            title: `Aceptar ${s.codigo} como buena`,
            description: `${cifra(s.valor)} por dólar según ${s.fuente} pasará a publicarse en el sitio, el cintillo, las piezas y el resumen. ${EN_MINUTOS}`,
            warning:
                s.pendientes > 1
                    ? `Vale también para las ${s.pendientes - 1} lecturas anteriores de esta racha. Úselo solo si la cifra es real, por ejemplo con una devaluación.`
                    : "Úselo solo si la cifra es real, por ejemplo con una devaluación.",
            confirmLabel: "Aceptar como buena",
        });
        if (si) decidir(s.id, "aceptar", `${s.codigo}: aceptada; ya se publica.`);
    };

    const ocultar = async (fila, { publicada }) => {
        const si = await confirm({
            title: `Ocultar la cotización de ${fila.codigo}`,
            description: publicada
                ? `${cifra(fila.valor)} por dólar (${fila.fuente}) dejará de publicarse y volverá a verse el dato bueno anterior, con su fecha. ${EN_MINUTOS}`
                : `${cifra(fila.valor)} por dólar (${fila.fuente}) no se publicará. En el sitio sigue el último dato bueno. ${EN_MINUTOS}`,
            warning: [
                !publicada && fila.pendientes > 1 ? `Vale también para las ${fila.pendientes - 1} lecturas anteriores de esta racha.` : "",
                "Si la fuente vuelve a dar esta misma cifra en los próximos días, tampoco se publicará: se guardará oculta con esta, sin volver a preguntar.",
            ]
                .filter(Boolean)
                .join(" "),
            confirmLabel: "Ocultar",
        });
        if (si) decidir(fila.id, "ocultar", `${fila.codigo}: cotización oculta.`);
    };

    const deshacer = async (o) => {
        const si = await confirm({
            title: `Deshacer el ocultar de ${o.codigo}`,
            description:
                o.antes === "sospechosa"
                    ? `${o.cuantas === 1 ? "La lectura vuelve" : `Las ${o.cuantas} lecturas vuelven`} a «Cotizaciones que no cuadran», para decidir otra vez. No se publica nada todavía.`
                    : `${cifra(o.valor)} por dólar (${o.fuente}) vuelve a publicarse. ${EN_MINUTOS}`,
            confirmLabel: "Deshacer",
        });
        if (si) decidir(o.id, "deshacer", `${o.codigo}: ocultar deshecho.`);
    };

    if (carga.status === "loading" && !datos) return <LoadingState title="Cargando las monedas…" />;
    if (carga.status === "error" && !datos) {
        return <ErrorState title="No se pudieron cargar las monedas" error={carga.error} onRetry={cargar} />;
    }
    if (!datos) return null;

    const sospechosas = datos.sospechosas ?? [];
    const ocultas = datos.ocultas ?? [];
    const sync = datos.sync ?? {};
    const fallos = Object.keys(sync.fallos ?? {});

    return (
        <section className="se-editor-group" {...ancla("monedas")}>
            <p className="se-editor-group__title">Monedas de la región</p>
            <p className="se-admin-meta-hint">
                Se leen solas cada hora de cada banco central (o de open.er-api.com si el banco no responde o su
                dato no cuadra).
                Última lectura: {cuando(sync.sincronizado_en)}
                {fallos.length ? ` · sin respuesta de su fuente: ${fallos.join(", ")}` : ""}.
            </p>

            <div {...ancla("sospechosas")}>
                <p className="se-form-label" style={{ marginTop: "1rem" }}>
                    Cotizaciones que no cuadran
                </p>
                {sospechosas.length === 0 ? (
                    <p className="se-admin-meta-hint">Ninguna pendiente: todo lo que se leyó cuadra con lo anterior.</p>
                ) : (
                    <>
                        <p className="se-admin-login__error se-admin-form-feedback" role="status">
                            {sospechosas.length === 1
                                ? "Hay una cotización que no se publicó porque no cuadra. Mírela y decida."
                                : `Hay ${sospechosas.length} cotizaciones que no se publicaron porque no cuadran. Mírelas y decida.`}
                        </p>
                        <div className="se-admin-table-wrap">
                            <table className="se-admin-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Moneda</th>
                                        <th scope="col">Lo que se leyó</th>
                                        <th scope="col">Por qué no cuadra</th>
                                        <th scope="col">En el sitio mientras tanto</th>
                                        <th scope="col" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sospechosas.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <strong>{s.codigo}</strong> {s.nombre}
                                            </td>
                                            <td>
                                                {cifra(s.valor)} por dólar
                                                <br />
                                                <span className="se-admin-meta-hint">
                                                    {s.fuente} · {cuando(s.capturado_en)}
                                                    {s.pendientes > 1 ? ` · ${s.pendientes} lecturas seguidas` : ""}
                                                </span>
                                            </td>
                                            <td>{s.motivo ?? "—"}</td>
                                            <td>
                                                {s.publicada_valor == null ? (
                                                    "Nada (no hay un dato bueno anterior)"
                                                ) : (
                                                    <>
                                                        {cifra(s.publicada_valor)}
                                                        <br />
                                                        <span className="se-admin-meta-hint">
                                                            {s.publicada_fuente} · dato del {delDia(s.publicada_fecha)}
                                                        </span>
                                                    </>
                                                )}
                                            </td>
                                            <td className="se-admin-table__actions">
                                                {puedeEditar ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="se-link se-header__nav-link--button"
                                                            onClick={() => aceptar(s)}
                                                            disabled={ocupado === s.id}
                                                        >
                                                            Aceptar como buena
                                                        </button>{" "}
                                                        <button
                                                            type="button"
                                                            className="se-link se-header__nav-link--button"
                                                            onClick={() => ocultar(s, { publicada: false })}
                                                            disabled={ocupado === s.id}
                                                        >
                                                            Ocultar esta cotización
                                                        </button>
                                                    </>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <div {...ancla("publicadas")}>
                <p className="se-form-label" style={{ marginTop: "1rem" }}>
                    Lo que se publica ahora
                </p>
                <div className="se-admin-table-wrap">
                    <table className="se-admin-table">
                        <thead>
                            <tr>
                                <th scope="col">Moneda</th>
                                <th scope="col">Por 1 USD</th>
                                <th scope="col">Fuente</th>
                                <th scope="col">Dato del</th>
                                <th scope="col" />
                            </tr>
                        </thead>
                        <tbody>
                            {(datos.monedas ?? []).map((m) => (
                                <tr key={m.codigo}>
                                    <td>
                                        <strong>{m.codigo}</strong> {m.nombre}
                                    </td>
                                    <td>{cifra(m.valor)}</td>
                                    <td>{m.fuente ?? "—"}</td>
                                    <td>
                                        {delDia(m.fecha_valor)}
                                        {m.valor != null && m.vieja ? " · viejo, no sale" : ""}
                                    </td>
                                    <td className="se-admin-table__actions">
                                        {puedeEditar && m.id != null && !m.fija ? (
                                            <button
                                                type="button"
                                                className="se-link se-header__nav-link--button"
                                                onClick={() => ocultar({ ...m, pendientes: 1 }, { publicada: true })}
                                                disabled={ocupado === m.id}
                                            >
                                                Ocultar esta cotización
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div {...ancla("ocultas")}>
                <p className="se-form-label" style={{ marginTop: "1rem" }}>
                    Cotizaciones ocultas
                </p>
                {ocultas.length === 0 ? (
                    <p className="se-admin-meta-hint">Nada oculto en los últimos 30 días.</p>
                ) : (
                    <div className="se-admin-table-wrap">
                        <table className="se-admin-table">
                            <thead>
                                <tr>
                                    <th scope="col">Moneda</th>
                                    <th scope="col">La cifra</th>
                                    <th scope="col">Quién y cuándo</th>
                                    <th scope="col" />
                                </tr>
                            </thead>
                            <tbody>
                                {ocultas.map((o) => (
                                    <tr key={o.id}>
                                        <td>
                                            <strong>{o.codigo}</strong> {o.nombre}
                                        </td>
                                        <td>
                                            {cifra(o.valor)} por dólar
                                            <br />
                                            <span className="se-admin-meta-hint">
                                                {o.fuente} · dato del {delDia(o.fecha_valor)}
                                                {o.cuantas > 1 ? ` · ${o.cuantas} lecturas` : ""}
                                            </span>
                                        </td>
                                        <td>
                                            {o.por ?? "Alguien del equipo"}
                                            <br />
                                            <span className="se-admin-meta-hint">{cuando(o.cuando)}</span>
                                        </td>
                                        <td className="se-admin-table__actions">
                                            {puedeEditar ? (
                                                <button
                                                    type="button"
                                                    className="se-link se-header__nav-link--button"
                                                    onClick={() => deshacer(o)}
                                                    disabled={ocupado === o.id}
                                                >
                                                    Deshacer
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <ConfirmDialog />
        </section>
    );
};

MonedasDelPanel.propTypes = {
    puedeEditar: PropTypes.bool.isRequired,
};
