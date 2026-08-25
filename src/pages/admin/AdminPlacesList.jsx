import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createAdminPlace,
    deleteAdminPlace,
    groupPlaces,
    listAdminPlaces,
    patchAdminPlace,
} from "../../services/adminTaxonomyService";
import { ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";

/**
 * The geography tree: Mundo, its continents, their regions, and the countries.
 *
 * Countries can be added — a country the region did not have is a real gap — but
 * nothing can be moved between levels, because filtering by a region returns
 * everything beneath it and re-parenting a node silently changes what every one of
 * those filters answers. A place attached to a piece is retired, not deleted:
 * deleting would take the tagging of every piece under it along with it.
 */
/** Four levels now, printed in Spanish. Unknown levels fall through to the raw
    value rather than to an empty cell, so a level added in the API is visible. */
const NIVEL = {
    global: "raíz",
    continent: "continente",
    region: "región",
    country: "país",
};

export const AdminPlacesList = () => {
    const { role } = useAuth();
    const canCurate = role === "publicador" || role === "admin";
    const isAdmin = role === "admin";
    const [state, setState] = useState({ status: "idle", rows: [], error: null });
    const [busyId, setBusyId] = useState(null);
    const [newCountry, setNewCountry] = useState({ name: "", iso2: "", parent_id: "" });
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const { toastSuccess, toastError } = useAdminToast();

    const load = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const rows = await listAdminPlaces();
            setState({ status: "success", rows, error: null });
        } catch (err) {
            setState({ status: "error", rows: [], error: err });
        }
    }, []);

    useEffect(() => {
        applyPageMeta({ title: "Admin — Lugares", description: "El árbol geográfico." });
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const { filas } = useMemo(() => groupPlaces(state.rows), [state.rows]);

    // Where a new country may hang: a region, or a continent directly -- China sits
    // under Asia with no region in between, and the form has to allow the same.
    const padres = useMemo(
        () => filas.filter((f) => f.level === "region" || f.level === "continent"),
        [filas]
    );

    const toggleActive = async (row) => {
        setBusyId(row.id);
        try {
            await patchAdminPlace(row.id, { is_active: !row.is_active });
            await load();
            toastSuccess(
                row.is_active
                    ? `«${row.name}» ya no aparece en los filtros.`
                    : `«${row.name}» vuelve a los filtros.`,
                "Lugares"
            );
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo guardar el cambio."), "Lugares");
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (row) => {
        await confirm({
            title: "Eliminar lugar",
            description: `¿Eliminar «${row.name}»? Solo se puede si no tiene países debajo ni piezas asociadas.`,
            confirmLabel: "Eliminar",
            onConfirm: async () => {
                await deleteAdminPlace(row.id);
                await load();
                toastSuccess(`«${row.name}» se eliminó.`, "Lugares");
            },
        });
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        const name = newCountry.name.trim();
        if (!name || !newCountry.parent_id) {
            toastError("Indique el nombre y la región.", "Lugares");
            return;
        }
        setBusyId("new");
        try {
            await createAdminPlace({
                name,
                iso2: newCountry.iso2.trim() || undefined,
                parent_id: Number(newCountry.parent_id),
            });
            setNewCountry({ name: "", iso2: "", parent_id: "" });
            await load();
            toastSuccess(`«${name}» añadido.`, "Lugares");
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo añadir el país."), "Lugares");
        } finally {
            setBusyId(null);
        }
    };

    if (state.status === "loading") return <LoadingState title="Cargando lugares…" />;
    if (state.status === "error") {
        return <ErrorState title="No se pudieron cargar los lugares" error={state.error} onRetry={load} />;
    }

    const renderRow = (row, depth) => {
        const busy = busyId === row.id;
        return (
            <tr key={row.id} style={row.is_active ? undefined : { opacity: 0.55 }}>
                <td style={{ paddingLeft: `${depth * 1.5}rem` }}>
                    {row.name}
                    {row.iso2 ? <span style={{ opacity: 0.6 }}> · {row.iso2}</span> : null}
                </td>
                <td>{NIVEL[row.level] ?? row.level}</td>
                <td>
                    <code style={{ fontSize: "0.85em" }}>{row.slug}</code>
                </td>
                <td>{row.post_count ?? 0}</td>
                <td className="se-admin-table__actions">
                    {canCurate && row.level !== "global" ? (
                        <button
                            type="button"
                            className="se-link se-header__nav-link--button"
                            disabled={busy}
                            onClick={() => toggleActive(row)}
                        >
                            {row.is_active ? "Retirar" : "Restituir"}
                        </button>
                    ) : null}
                    {isAdmin && row.level === "country" ? (
                        <>
                            {" · "}
                            <button
                                type="button"
                                className="se-link se-header__nav-link--button"
                                disabled={busy}
                                onClick={() => handleDelete(row)}
                            >
                                Eliminar
                            </button>
                        </>
                    ) : null}
                </td>
            </tr>
        );
    };

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        Lugares
                    </h1>
                    <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
                        El árbol es Mundo → continentes → regiones → países. Una pieza se etiqueta con
                        el lugar más específico que aplique, normalmente un país.
                        Al filtrar por una región aparecen sus países, así que el conteo de una región es
                        solo el de las piezas etiquetadas con la región misma.
                    </p>
                </div>
            </header>

            <div className="se-admin-table-wrap">
                <table className="se-admin-table">
                    <thead>
                        <tr>
                            <th scope="col">Lugar</th>
                            <th scope="col">Nivel</th>
                            <th scope="col">Slug</th>
                            <th scope="col">Piezas publicadas</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((row) => renderRow(row, row.nivel))}
                    </tbody>
                </table>
            </div>

            {canCurate ? (
                <form className="se-admin-inline-form" onSubmit={handleCreate}>
                    <h2 className="se-heading-sub" style={{ margin: "2rem 0 0.75rem" }}>
                        Añadir un país
                    </h2>
                    <p className="se-admin-meta-hint">
                        Solo países, bajo una región o directamente bajo un continente. La raíz,
                        los continentes y las regiones son fijos.
                    </p>
                    <div className="se-admin-filters">
                        <label className="se-admin-filters__field se-admin-filters__field--grow">
                            <span className="se-form-label">Nombre</span>
                            <input
                                className="se-form-control"
                                value={newCountry.name}
                                onChange={(e) => setNewCountry((p) => ({ ...p, name: e.target.value }))}
                            />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">ISO (2 letras)</span>
                            <input
                                className="se-form-control"
                                maxLength={2}
                                value={newCountry.iso2}
                                onChange={(e) => setNewCountry((p) => ({ ...p, iso2: e.target.value }))}
                            />
                        </label>
                        <label className="se-admin-filters__field">
                            <span className="se-form-label">Región o continente</span>
                            <select
                                className="se-form-control"
                                value={newCountry.parent_id}
                                onChange={(e) => setNewCountry((p) => ({ ...p, parent_id: e.target.value }))}
                            >
                                <option value="">Elija…</option>
                                {padres.map((padre) => (
                                    <option key={padre.id} value={padre.id}>
                                        {padre.level === "continent"
                                            ? padre.name
                                            : `  ${padre.name}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button type="submit" className="se-btn" disabled={busyId === "new"}>
                            {busyId === "new" ? "Añadiendo…" : "Añadir"}
                        </button>
                    </div>
                </form>
            ) : null}

            <ConfirmDialog />
        </main>
    );
};
