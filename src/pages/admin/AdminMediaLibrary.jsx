import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import {
    ACCEPTED_DOCUMENT_MIME,
    ACCEPTED_IMAGE_MIME,
    deleteAdminMedia,
    formatBytes,
    formatDuration,
    listAdminMedia,
    patchAdminMedia,
    uploadAdminMediaDocument,
    uploadAdminMediaImage,
} from "../../services/adminMediaService";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../components/content";
import { applyPageMeta } from "../../lib/seo";
import { adminErrorMessage } from "../../lib/adminErrorMessage";
import { useAdminConfirm } from "../../hooks/useAdminConfirm";
import { useAdminToast } from "../../context/AdminToastContext";
import { useAuth } from "../../context/AuthContext";

const KINDS = [
    { value: "", label: "Todos" },
    { value: "image", label: "Imágenes" },
    { value: "video", label: "Videos" },
    { value: "document", label: "Documentos" },
];

const WHERE = {
    r2: "R2",
    cloudinary: "Cloudinary",
    external: "enlace externo",
};

/**
 * La etiqueta de un archivo, editable en su propia fila.
 *
 * Sostiene su estado y se guarda sola, sin recargar la tabla. Quien está etiquetando
 * veinte retratos seguidos no debería perder el sitio en la lista a cada palabra.
 *
 * La etiqueta **no es el crédito**: el crédito dice de quién son los derechos, la
 * etiqueta qué se ve en la foto. Con un solo campo habría que elegir entre acreditar
 * bien y poder encontrarla.
 */
const CeldaEtiqueta = ({ fila, onGuardada }) => {
    const [texto, setTexto] = useState(fila.label ?? "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const sucio = texto.trim() !== (fila.label ?? "");

    const guardar = async () => {
        setBusy(true);
        setError("");
        try {
            onGuardada(await patchAdminMedia(fila.id, { label: texto.trim() }));
        } catch (err) {
            setError(adminErrorMessage(err, "No se pudo guardar."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="se-media-etiqueta">
            <input
                className="se-form-control"
                value={texto}
                maxLength={160}
                placeholder="Sin etiqueta"
                aria-label={`Etiqueta del archivo ${fila.id}`}
                onChange={(e) => setTexto(e.target.value)}
            />
            {sucio ? (
                <button
                    type="button"
                    className="se-btn se-btn--secondary se-btn--small"
                    disabled={busy}
                    onClick={guardar}
                >
                    {busy ? "…" : "Guardar"}
                </button>
            ) : null}
            {error ? <span className="se-media-etiqueta__error">{error}</span> : null}
        </div>
    );
};

CeldaEtiqueta.propTypes = {
    fila: PropTypes.shape({ id: PropTypes.number, label: PropTypes.string }).isRequired,
    onGuardada: PropTypes.func.isRequired,
};

/**
 * Every file the site has, wherever it lives.
 *
 * One list across all three storages on purpose: the move to R2 should change the
 * `storage` column and nothing an editor sees. A file attached to a piece cannot be
 * deleted from here — the foreign keys are `SET NULL`, so allowing it would quietly
 * strip the image off a live article.
 */
export const AdminMediaLibrary = () => {
    const { role } = useAuth();
    const canUpload = role === "escritor" || role === "publicador" || role === "admin";
    const canDelete = role === "publicador" || role === "admin";
    const [page, setPage] = useState(1);
    const [kind, setKind] = useState("");
    // Dos estados y no uno: `q` es lo que se está escribiendo, `aguja` lo que de
    // verdad se consulta. Sin esa separación cada tecla sería una petición.
    const [q, setQ] = useState("");
    const [aguja, setAguja] = useState("");
    const [state, setState] = useState({ status: "idle", items: [], meta: null, error: null });
    const [busy, setBusy] = useState(false);
    const { confirm, ConfirmDialog } = useAdminConfirm();
    const { toastSuccess, toastError } = useAdminToast();

    const load = useCallback(async () => {
        setState((s) => ({ ...s, status: "loading", error: null }));
        try {
            const { items, meta } = await listAdminMedia({ page, limit: 24, kind, q: aguja });
            setState({ status: "success", items, meta, error: null });
        } catch (err) {
            setState({ status: "error", items: [], meta: null, error: err });
        }
    }, [page, kind, aguja]);

    useEffect(() => {
        applyPageMeta({ title: "Admin — Archivos", description: "Biblioteca de medios." });
    }, []);

    useEffect(() => {
        const reloj = setTimeout(() => {
            // La página vuelve a la primera: el resultado de otra búsqueda no tiene
            // por qué tener una página siete.
            setPage(1);
            setAguja(q);
        }, 250);
        return () => clearTimeout(reloj);
    }, [q]);

    useEffect(() => {
        load();
    }, [load]);

    const handleUpload = (uploader, label) => async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setBusy(true);
        try {
            await uploader(file);
            await load();
            toastSuccess(`${label} subido.`, "Archivos");
        } catch (err) {
            toastError(adminErrorMessage(err, `No se pudo subir el ${label.toLowerCase()}.`), "Archivos");
        } finally {
            setBusy(false);
        }
    };

    // Sustituye una fila con la versión que devolvió el PATCH. Recargar la tabla
    // entera devolvería a quien etiqueta al principio de la lista.
    const reemplazarFila = (actualizada) =>
        setState((s) => ({
            ...s,
            items: s.items.map((r) => (r.id === actualizada.id ? actualizada : r)),
        }));

    const handleDelete = async (row) => {
        await confirm({
            title: "Eliminar archivo",
            description: `¿Eliminar «${row.original_filename || row.url || row.id}»? Solo se puede si ninguna pieza lo usa.`,
            confirmLabel: "Eliminar",
            onConfirm: async () => {
                await deleteAdminMedia(row.id);
                await load();
                toastSuccess("Archivo eliminado.", "Archivos");
            },
        });
    };

    const meta = state.meta;
    const totalPages = meta?.pages ?? 1;

    return (
        <main role="main">
            <header className="se-admin-shell__header" style={{ marginBottom: "1rem" }}>
                <div>
                    <h1 className="se-heading-section" style={{ margin: 0 }}>
                        Archivos
                    </h1>
                    <p className="se-admin-meta-hint" style={{ marginTop: "0.5rem" }}>
                        Imágenes, videos y documentos. Un archivo adjunto a una pieza no se puede eliminar:
                        habría que quitarlo de la pieza primero.
                    </p>
                </div>
                {canUpload ? (
                    <div className="se-admin-create">
                        <label className="se-btn se-btn--small">
                            Subir imagen
                            <input
                                type="file"
                                accept={ACCEPTED_IMAGE_MIME}
                                onChange={handleUpload(uploadAdminMediaImage, "Imagen")}
                                disabled={busy}
                                style={{ display: "none" }}
                            />
                        </label>
                        <label className="se-btn se-btn--small">
                            Subir PDF
                            <input
                                type="file"
                                accept={ACCEPTED_DOCUMENT_MIME}
                                onChange={handleUpload(uploadAdminMediaDocument, "Documento")}
                                disabled={busy}
                                style={{ display: "none" }}
                            />
                        </label>
                    </div>
                ) : null}
            </header>

            <div className="se-admin-filters">
                <label className="se-admin-filters__field">
                    <span className="se-form-label">Tipo</span>
                    <select
                        className="se-form-control"
                        value={kind}
                        onChange={(e) => {
                            setPage(1);
                            setKind(e.target.value);
                        }}
                    >
                        {KINDS.map((k) => (
                            <option key={k.value} value={k.value}>
                                {k.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="se-admin-filters__field">
                    <span className="se-form-label">Buscar</span>
                    <input
                        className="se-form-control"
                        value={q}
                        placeholder="Nombre, archivo o crédito"
                        onChange={(e) => setQ(e.target.value)}
                    />
                </label>
            </div>

            {state.status === "loading" ? <LoadingState title="Cargando archivos…" /> : null}
            {state.status === "error" ? (
                <ErrorState title="No se pudieron cargar los archivos" error={state.error} onRetry={load} />
            ) : null}
            {state.status === "success" && state.items.length === 0 ? (
                <EmptyState
                    title={aguja ? "Nada responde a esa búsqueda" : "Sin archivos"}
                    description={
                        aguja
                            ? "Se busca en la etiqueta, el nombre del archivo y el crédito."
                            : "Los videos de entrevistas se registran pegando su enlace desde el editor."
                    }
                />
            ) : null}

            {state.status === "success" && state.items.length > 0 ? (
                <>
                    <div className="se-admin-table-wrap">
                        <table className="se-admin-table">
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Tipo</th>
                                    <th scope="col">Archivo</th>
                                    <th scope="col">Etiqueta</th>
                                    <th scope="col">Dónde vive</th>
                                    <th scope="col">Detalles</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.items.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.id}</td>
                                        <td>{row.kind}</td>
                                        <td>
                                            {/* La miniatura, porque una foto sin etiqueta
                                                no se puede etiquetar si no se ve quién
                                                sale en ella. */}
                                            {row.kind === "image" && row.url ? (
                                                <img
                                                    className="se-media-mini"
                                                    src={row.url}
                                                    alt=""
                                                    width="40"
                                                    height="40"
                                                    loading="lazy"
                                                />
                                            ) : null}
                                            {row.original_filename || "—"}
                                            {row.url ? (
                                                <>
                                                    <br />
                                                    <a
                                                        className="se-link"
                                                        href={row.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ fontSize: "0.85em" }}
                                                    >
                                                        abrir
                                                    </a>
                                                </>
                                            ) : null}
                                        </td>
                                        <td>
                                            <CeldaEtiqueta fila={row} onGuardada={reemplazarFila} />
                                        </td>
                                        <td>
                                            {WHERE[row.storage] ?? row.storage}
                                            {row.is_private ? (
                                                <>
                                                    <br />
                                                    <span className="se-status-pill se-status-pill--neutral">
                                                        privado
                                                    </span>
                                                </>
                                            ) : null}
                                        </td>
                                        <td>
                                            {[
                                                formatDuration(row.duration_seconds),
                                                row.pages ? `${row.pages} páginas` : null,
                                                row.width && row.height ? `${row.width}×${row.height}` : null,
                                                formatBytes(row.bytes),
                                            ]
                                                .filter(Boolean)
                                                .join(" · ") || "—"}
                                        </td>
                                        <td className="se-admin-table__actions">
                                            {canDelete ? (
                                                <button
                                                    type="button"
                                                    className="se-link se-header__nav-link--button"
                                                    onClick={() => handleDelete(row)}
                                                >
                                                    Eliminar
                                                </button>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    </tr>
                                ))}
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
