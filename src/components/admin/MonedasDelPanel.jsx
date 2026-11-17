import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ErrorState, LoadingState } from "../content";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { porDolar } from "../../lib/monedas";
import { recorridoCinta } from "../../lib/guias/guiaCinta";
import { aceptarCotizacion, getMonedasDelPanel, ocultarCotizacion } from "../../services/monedasPanelService";

const { ancla } = recorridoCinta;

const cuando = (iso) => (iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" }) : "nunca");
const delDia = (fecha) => (fecha ? new Date(`${fecha}T12:00:00`).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" }) : "—");
const cifra = (valor) => (valor == null ? "—" : porDolar(valor, "es"));

/**
 * Las monedas de la región dentro de «Cinta de mercado»: lo que se publica de cada una y,
 * sobre todo, las lecturas que no cuadraron (auditoría del 17-nov-2026, D-15).
 *
 * Una lectura fuera de su banda, o que salta más de lo normal frente al último dato bueno,
 * se guarda como «sospechosa» y no se publica: en el sitio sigue el último dato bueno con
 * su fecha, y al equipo le llega un aviso por el bot. Aquí alguien decide:
 * - «Aceptar como buena» si es de verdad (una devaluación): se publica y pasa a ser la
 *   referencia de la lectura siguiente;
 * - «Ocultar esta cotización» si es un error.
 * Una racha (varias lecturas seguidas de la misma fuente) se decide de una vez. Las dos
 * cosas quedan anotadas con quién las hizo.
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
            const r = await (accion === "aceptar" ? aceptarCotizacion(id) : ocultarCotizacion(id));
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
            description: `${cifra(s.valor)} por dólar según ${s.fuente} pasará a publicarse en el sitio, el cintillo, las piezas y el resumen.`,
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
                ? `${cifra(fila.valor)} por dólar (${fila.fuente}) dejará de publicarse y volverá a verse el dato bueno anterior, con su fecha.`
                : `${cifra(fila.valor)} por dólar (${fila.fuente}) no se publicará. En el sitio sigue el último dato bueno.`,
            warning:
                !publicada && fila.pendientes > 1
                    ? `Vale también para las ${fila.pendientes - 1} lecturas anteriores de esta racha.`
                    : undefined,
            confirmLabel: "Ocultar",
        });
        if (si) decidir(fila.id, "ocultar", `${fila.codigo}: cotización oculta.`);
    };

    if (carga.status === "loading" && !datos) return <LoadingState title="Cargando las monedas…" />;
    if (carga.status === "error" && !datos) {
        return <ErrorState title="No se pudieron cargar las monedas" error={carga.error} onRetry={cargar} />;
    }
    if (!datos) return null;

    const sospechosas = datos.sospechosas ?? [];
    const sync = datos.sync ?? {};
    const fallos = Object.keys(sync.fallos ?? {});

    return (
        <section className="se-editor-group" {...ancla("monedas")}>
            <p className="se-editor-group__title">Monedas de la región</p>
            <p className="se-admin-meta-hint">
                Se leen solas cada hora de cada banco central (o de open.er-api.com si el banco no responde).
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
                        <p className="se-admin-login__error se-admin-form-feedback" role="alert">
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
            <ConfirmDialog />
        </section>
    );
};

MonedasDelPanel.propTypes = {
    puedeEditar: PropTypes.bool.isRequired,
};
