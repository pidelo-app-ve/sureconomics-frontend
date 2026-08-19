import { useCallback, useEffect, useState } from "react";
import { listAdminTopics, patchAdminTopic } from "../../services/adminTaxonomyService";
import { ErrorState, LoadingState } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";

/**
 * The fourteen topics: rename, reorder, retire.
 *
 * No "new topic" button and no delete, and that absence is the point. A closed
 * list is the whole difference from the open-ended tags this replaced — where
 * every writer invented their own and the filter panel became unusable. Retiring
 * a topic hides it from the reader's filters and leaves every piece that carries
 * it tagged, which is why deleting is not offered at all.
 */
export const AdminTopicsList = () => {
    const { role } = useAuth();
    const canCurate = role === "publicador" || role === "admin";
    const [state, setState] = useState({ status: "idle", items: [], error: null });
    const [busyId, setBusyId] = useState(null);
    const [draft, setDraft] = useState({});
    const { toastSuccess, toastError } = useAdminToast();

    const load = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const items = await listAdminTopics();
            setState({ status: "success", items, error: null });
            setDraft({});
        } catch (err) {
            setState({ status: "error", items: [], error: err });
        }
    }, []);

    useEffect(() => {
        applyPageMeta({ title: "Admin — Temas", description: "Los catorce temas editoriales." });
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const apply = async (id, body, message) => {
        setBusyId(id);
        try {
            await patchAdminTopic(id, body);
            await load();
            toastSuccess(message, "Temas");
        } catch (err) {
            toastError(adminErrorMessage(err, "No se pudo guardar el cambio."), "Temas");
        } finally {
            setBusyId(null);
        }
    };

    const move = (index, delta) => {
        const items = state.items;
        const target = index + delta;
        if (target < 0 || target >= items.length) return;
        // Swap the two sort_order values: one PATCH each, and the list reloads.
        const a = items[index];
        const b = items[target];
        setBusyId(a.id);
        Promise.all([
            patchAdminTopic(a.id, { sort_order: b.sort_order }),
            patchAdminTopic(b.id, { sort_order: a.sort_order }),
        ])
            .then(load)
            .catch((err) => toastError(adminErrorMessage(err, "No se pudo reordenar."), "Temas"))
            .finally(() => setBusyId(null));
    };

    if (state.status === "loading") return <LoadingState title="Cargando temas…" />;
    if (state.status === "error") {
        return <ErrorState title="No se pudieron cargar los temas" error={state.error} onRetry={load} />;
    }

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        Temas
                    </h1>
                    <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
                        Lista cerrada de {state.items.length}. Los redactores eligen de aquí y no añaden:
                        eso es lo que mantiene el panel de filtros legible. Retirar un tema lo esconde de
                        los filtros del lector sin desclasificar las piezas que ya lo llevan, y por eso no
                        hay opción de borrar.
                    </p>
                </div>
            </header>

            <div className="se-admin-table-wrap">
                <table className="se-admin-table">
                    <thead>
                        <tr>
                            <th scope="col">Orden</th>
                            <th scope="col">Nombre</th>
                            <th scope="col">Slug</th>
                            <th scope="col">Piezas publicadas</th>
                            <th scope="col">En los filtros</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.items.map((row, index) => {
                            const busy = busyId === row.id;
                            const value = draft[row.id] ?? row.name;
                            return (
                                <tr key={row.id} style={row.is_active ? undefined : { opacity: 0.55 }}>
                                    <td className="se-admin-table__actions">
                                        {canCurate ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="se-link se-header__nav-link--button"
                                                    onClick={() => move(index, -1)}
                                                    disabled={busy || index === 0}
                                                    aria-label={`Subir ${row.name}`}
                                                >
                                                    ↑
                                                </button>
                                                {" "}
                                                <button
                                                    type="button"
                                                    className="se-link se-header__nav-link--button"
                                                    onClick={() => move(index, 1)}
                                                    disabled={busy || index === state.items.length - 1}
                                                    aria-label={`Bajar ${row.name}`}
                                                >
                                                    ↓
                                                </button>
                                            </>
                                        ) : (
                                            row.sort_order
                                        )}
                                    </td>
                                    <td>
                                        {canCurate ? (
                                            <input
                                                className="se-form-control"
                                                value={value}
                                                onChange={(e) =>
                                                    setDraft((prev) => ({ ...prev, [row.id]: e.target.value }))
                                                }
                                                onBlur={() => {
                                                    const next = (draft[row.id] ?? "").trim();
                                                    if (!next || next === row.name) return;
                                                    apply(row.id, { name: next }, `«${next}» guardado.`);
                                                }}
                                                aria-label={`Nombre de ${row.name}`}
                                            />
                                        ) : (
                                            row.name
                                        )}
                                    </td>
                                    <td>
                                        <code style={{ fontSize: "0.85em" }}>{row.slug}</code>
                                    </td>
                                    <td>{row.post_count ?? 0}</td>
                                    <td>
                                        {canCurate ? (
                                            <button
                                                type="button"
                                                className="se-link se-header__nav-link--button"
                                                disabled={busy}
                                                onClick={() =>
                                                    apply(
                                                        row.id,
                                                        { is_active: !row.is_active },
                                                        row.is_active
                                                            ? `«${row.name}» ya no aparece en los filtros.`
                                                            : `«${row.name}» vuelve a los filtros.`
                                                    )
                                                }
                                            >
                                                {row.is_active ? "Retirar" : "Restituir"}
                                            </button>
                                        ) : (
                                            <span
                                                className={`se-status-pill ${
                                                    row.is_active
                                                        ? "se-status-pill--positive"
                                                        : "se-status-pill--neutral"
                                                }`}
                                            >
                                                {row.is_active ? "Visible" : "Retirado"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </main>
    );
};
