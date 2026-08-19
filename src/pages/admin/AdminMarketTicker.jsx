import { useCallback, useEffect, useState } from "react";
import {
    getAdminMarketTicker,
    putAdminMarketTicker,
} from "../../services/marketTickerService";
import { ErrorState, LoadingState } from "../../components/content";
import { AdminFormFeedback } from "../../components/admin/AdminFormFeedback";
import { applyPageMeta } from "../../lib/seo";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";

const DIRECCIONES = [
    { value: "up", label: "Subió" },
    { value: "down", label: "Bajó" },
    { value: "flat", label: "Sin cambio" },
];

const filaVacia = () => ({ label: "", value: "", direction: "flat" });

/**
 * The market strip that runs across the top of the site.
 *
 * There is no market feed, so every figure here is typed by hand and the caption is
 * the part that keeps it honest — it says which close the numbers belong to. Saving
 * replaces the whole strip: what is not in the form is gone, because half of
 * yesterday's close sitting next to half of today's would be a claim nobody made.
 */
export const AdminMarketTicker = () => {
    const { role } = useAuth();
    const canEdit = role === "publicador" || role === "admin";
    const [caption, setCaption] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [rows, setRows] = useState([]);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [loadState, setLoadState] = useState({ status: "idle", error: null });
    const [saveState, setSaveState] = useState({ status: "idle", message: "" });
    const { toastSuccess, toastError } = useAdminToast();

    const load = useCallback(async () => {
        setLoadState({ status: "loading", error: null });
        try {
            const data = await getAdminMarketTicker();
            setCaption(data.caption ?? "");
            setSourceUrl(data.sourceUrl ?? "");
            // One blank row on an empty strip, so the form is usable on first open
            // instead of showing a table with nothing to type into.
            setRows(data.indicators.length ? data.indicators : [filaVacia()]);
            setUpdatedAt(data.updatedAt);
            setLoadState({ status: "success", error: null });
        } catch (err) {
            setLoadState({ status: "error", error: err });
        }
    }, []);

    useEffect(() => {
        applyPageMeta({
            title: "Admin — Cinta de mercado",
            description: "Cifras de cierre que se muestran en la cabecera del sitio.",
        });
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const setRow = (index, field) => (event) => {
        const v = event.target.value;
        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: v } : row)));
    };

    const addRow = () => setRows((prev) => [...prev, filaVacia()]);

    const removeRow = (index) =>
        setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [filaVacia()]));

    const move = (index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= rows.length) return;
        setRows((prev) => {
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const handleSave = async () => {
        setSaveState({ status: "loading", message: "" });
        try {
            const data = await putAdminMarketTicker({ caption, sourceUrl, indicators: rows });
            setCaption(data.caption ?? "");
            setSourceUrl(data.sourceUrl ?? "");
            setRows(data.indicators.length ? data.indicators : [filaVacia()]);
            setUpdatedAt(data.updatedAt);
            const message = data.indicators.length
                ? `La cinta quedó con ${data.indicators.length} cifras y ya se ve en el sitio.`
                : "La cinta quedó vacía, así que no se muestra en el sitio.";
            setSaveState({ status: "success", message });
            toastSuccess(message, "Cinta de mercado");
        } catch (err) {
            const message = adminErrorMessage(err, "No se pudo guardar la cinta.");
            setSaveState({ status: "error", message });
            toastError(message, "Cinta de mercado");
        }
    };

    if (loadState.status === "loading") return <LoadingState title="Cargando la cinta…" />;
    if (loadState.status === "error") {
        return <ErrorState title="No se pudo cargar la cinta" error={loadState.error} onRetry={load} />;
    }

    const completas = rows.filter((r) => r.label.trim() && r.value.trim()).length;

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        Cinta de mercado
                    </h1>
                    <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
                        Las cifras que corren en la cabecera del sitio. No hay conexión con ningún
                        mercado: esto es lo que ustedes escriban. Por eso el sello importa — es lo
                        que le dice al lector a qué cierre corresponden los números.
                        {updatedAt ? (
                            <>
                                {" "}
                                Última actualización:{" "}
                                <strong>{new Date(updatedAt).toLocaleString("es")}</strong>.
                            </>
                        ) : null}
                    </p>
                </div>
            </header>

            <div className="se-editor-group">
                <p className="se-editor-group__title">El sello</p>
                <label className="se-form-field" htmlFor="ticker-caption">
                    <span className="se-form-label">Texto del sello</span>
                    <input
                        id="ticker-caption"
                        className="se-form-control"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Al cierre · 19 ago · Rendivalores"
                        disabled={!canEdit}
                    />
                </label>
                <label className="se-form-field" htmlFor="ticker-source">
                    <span className="se-form-label">
                        Enlace de la fuente (opcional; hace del sello un enlace)
                    </span>
                    <input
                        id="ticker-source"
                        className="se-form-control"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder="https://rendivalores.com"
                        disabled={!canEdit}
                    />
                </label>
            </div>

            <div className="se-editor-group">
                <p className="se-editor-group__title">Las cifras</p>
                <div className="se-admin-table-wrap">
                    <table className="se-admin-table">
                        <thead>
                            <tr>
                                <th scope="col">Orden</th>
                                <th scope="col">Qué es</th>
                                <th scope="col">Cuánto marca</th>
                                <th scope="col">Cómo se movió</th>
                                <th scope="col" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={index}>
                                    <td className="se-admin-table__actions">
                                        <button
                                            type="button"
                                            className="se-link se-header__nav-link--button"
                                            onClick={() => move(index, -1)}
                                            disabled={!canEdit || index === 0}
                                            aria-label={`Subir ${row.label || "fila"}`}
                                        >
                                            ↑
                                        </button>{" "}
                                        <button
                                            type="button"
                                            className="se-link se-header__nav-link--button"
                                            onClick={() => move(index, 1)}
                                            disabled={!canEdit || index === rows.length - 1}
                                            aria-label={`Bajar ${row.label || "fila"}`}
                                        >
                                            ↓
                                        </button>
                                    </td>
                                    <td>
                                        <input
                                            className="se-form-control"
                                            value={row.label}
                                            onChange={setRow(index, "label")}
                                            placeholder="USD/VES"
                                            aria-label="Nombre del indicador"
                                            disabled={!canEdit}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="se-form-control"
                                            value={row.value}
                                            onChange={setRow(index, "value")}
                                            placeholder="36,84"
                                            aria-label="Valor"
                                            disabled={!canEdit}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="se-form-control"
                                            value={row.direction}
                                            onChange={setRow(index, "direction")}
                                            aria-label="Dirección"
                                            disabled={!canEdit}
                                        >
                                            {DIRECCIONES.map((d) => (
                                                <option key={d.value} value={d.value}>
                                                    {d.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="se-admin-table__actions">
                                        <button
                                            type="button"
                                            className="se-link se-header__nav-link--button"
                                            onClick={() => removeRow(index)}
                                            disabled={!canEdit}
                                        >
                                            Quitar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {canEdit ? (
                    <div className="se-admin-form-actions" style={{ marginTop: "1rem" }}>
                        <button type="button" className="se-btn se-btn--secondary" onClick={addRow}>
                            Añadir una cifra
                        </button>
                    </div>
                ) : null}

                <p className="se-admin-meta-hint">
                    {completas === 0
                        ? "Sin cifras completas, la cinta no se muestra en el sitio."
                        : `${completas} ${completas === 1 ? "cifra" : "cifras"} completas. Las filas a medias no se guardan.`}
                </p>
            </div>

            <AdminFormFeedback
                tone={saveState.status === "error" ? "error" : saveState.status === "success" ? "success" : undefined}
                message={saveState.message}
            />

            {canEdit ? (
                <div className="se-admin-form-actions">
                    <button
                        type="button"
                        className="se-btn"
                        onClick={handleSave}
                        disabled={saveState.status === "loading"}
                    >
                        {saveState.status === "loading" ? "Guardando…" : "Guardar la cinta"}
                    </button>
                </div>
            ) : (
                <p className="se-admin-meta-hint">
                    Solo publicador y admin pueden cambiar las cifras de mercado.
                </p>
            )}
        </main>
    );
};
