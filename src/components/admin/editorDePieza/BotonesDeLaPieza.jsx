import PropTypes from "prop-types";
import { IconoOjo } from "../cuerpo/iconos";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";

const { ancla } = recorridoEditor;

/** Vista previa, guardar, publicar, despublicar y eliminar: la barra de acciones. */
export const BotonesDeLaPieza = ({
    esMovil,
    form,
    faltas,
    setVistaPrevia,
    publicarEsPrincipal,
    handleSave,
    saveState,
    programada,
    isCreate,
    canPublish,
    guardar,
    handlePublish,
    actionState,
    sinGuardar,
    handleUnpublish,
    handleDelete,
}) => (
    <div
        className={`se-admin-form-actions${esMovil ? " se-admin-form-actions--movil" : ""}`}
        {...ancla("acciones")}
    >
        {esMovil && faltas.length ? (
            <p className="se-admin-form-actions__faltas">Falta: {faltas.join(", ")}</p>
        ) : null}
        <button
            type="button"
            className="se-btn se-btn--secondary se-btn--previa"
            onClick={() => setVistaPrevia(true)}
            disabled={!form.format}
            title={form.format ? undefined : "Elija primero el formato"}
        >
            <IconoOjo />
            Vista previa
        </button>
        <button
            type="button"
            className={publicarEsPrincipal ? "se-btn se-btn--secondary" : "se-btn"}
            onClick={handleSave}
            disabled={saveState.status === "loading"}
        >
            {saveState.status === "loading"
                ? "Guardando…"
                : programada
                  ? isCreate
                      ? "Crear y programar"
                      : "Programar"
                  : isCreate
                    ? form.status === "draft"
                        ? "Guardar borrador"
                        : "Crear"
                    : "Guardar cambios"}
        </button>
        {isCreate && canPublish && form.status === "draft" ? (
            <button
                type="button"
                className={publicarEsPrincipal ? "se-btn" : "se-btn se-btn--secondary"}
                onClick={() => guardar({ publicar: true })}
                disabled={saveState.status === "loading" || Boolean(faltas.length)}
                title={faltas.length ? `Falta: ${faltas.join(", ")}` : "Ctrl + Enter"}
            >
                Publicar
            </button>
        ) : null}
        {!isCreate && canPublish ? (
            <>
                {form.status !== "published" ? (
                <button
                    type="button"
                    className={publicarEsPrincipal ? "se-btn" : "se-btn se-btn--secondary"}
                    onClick={handlePublish}
                    disabled={actionState.status === "loading"}
                >
                    {actionState.status === "loading" &&
                    actionState.kind === "publish"
                        ? "Publicando…"
                        : programada
                          ? "Publicar ya"
                          : sinGuardar
                            ? "Guardar y publicar"
                            : "Publicar"}
                </button>
                ) : null}
                {form.status !== "draft" ? (
                <button
                    type="button"
                    className="se-btn se-btn--secondary"
                    onClick={handleUnpublish}
                    disabled={actionState.status === "loading"}
                >
                    {actionState.status === "loading" &&
                    actionState.kind === "unpublish"
                        ? "Despublicando…"
                        : programada
                          ? "Volver a borrador"
                          : "Despublicar"}
                </button>
                ) : null}
                <button
                    type="button"
                    className="se-editor-eliminar"
                    onClick={handleDelete}
                >
                    Eliminar la pieza
                </button>
            </>
        ) : null}
    </div>
);

BotonesDeLaPieza.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    faltas: PropTypes.arrayOf(PropTypes.string).isRequired,
    setVistaPrevia: PropTypes.func.isRequired,
    publicarEsPrincipal: PropTypes.bool,
    handleSave: PropTypes.func.isRequired,
    saveState: PropTypes.shape({ status: PropTypes.string }).isRequired,
    programada: PropTypes.bool,
    isCreate: PropTypes.bool,
    canPublish: PropTypes.bool,
    guardar: PropTypes.func.isRequired,
    handlePublish: PropTypes.func.isRequired,
    actionState: PropTypes.shape({ status: PropTypes.string, kind: PropTypes.string }).isRequired,
    sinGuardar: PropTypes.bool,
    handleUnpublish: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
};
