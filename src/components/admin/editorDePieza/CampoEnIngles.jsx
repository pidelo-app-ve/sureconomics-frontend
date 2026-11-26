import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";
import { EditorConImagenes } from "../cuerpo/EditorConImagenes";
import { RichTextEditor } from "../../editor/RichTextEditor";
import { subirFotoDePieza } from "./subirFotoDePieza";
import { FORMATOS_CON_FOTOS_EN_EL_CUERPO } from "./formulario";

/**
 * La pieza en inglés, para /en. Sale en inglés con título y cuerpo en inglés; el
 * resumen es opcional. Sin ellos, /en la enseña en español con un aviso. El botón de
 * Claude solo aparece si el servidor tiene la clave (ver `traduccion_service.py`).
 */
export const CampoEnIngles = ({
    esMovil,
    form,
    setForm,
    handleChange,
    estadoIngles,
    traductorDisponible,
    traducir,
    traduciendo,
    versionEn,
    revisadaAhora,
    setRevisadaAhora,
}) => (
    <CampoMovil
        movil={esMovil}
        plegable
        titulo="En inglés"
        resumen={estadoIngles.resumen}
        estado={estadoIngles.estado}
    >
    <p className="se-admin-meta-hint" style={{ marginTop: 0 }}>
        Para que la pieza salga en inglés en la versión /en del sitio hacen
        falta el título y el cuerpo en inglés; el resumen es opcional. Si se
        dejan vacíos, en /en la pieza se muestra en español con un aviso.
    </p>
    {traductorDisponible ? (
        <div className="se-form-field">
            <div className="se-admin-filters" style={{ alignItems: "center" }}>
                <button
                    type="button"
                    className="se-btn se-btn--secondary"
                    onClick={traducir}
                    disabled={traduciendo}
                >
                    {traduciendo ? "Traduciendo…" : "Traducir con Claude"}
                </button>
                {traduciendo ? null : (
                    <span className="se-admin-meta-hint">
                        Traduce el título, el resumen y el cuerpo de arriba, aunque
                        no estén guardados. Revise el resultado y guarde la pieza.
                    </span>
                )}
                {/* Puede tardar minutos (ver `useTraduccionDePieza`): mientras, se dice aquí.
                    Vacío el resto del tiempo, para que al acabar no se lea nada de más. */}
                <span className="se-admin-meta-hint" role="status">
                    {traduciendo
                        ? "Claude está traduciendo. Puede tardar un par de minutos; el inglés aparecerá abajo y, mientras tanto, esos campos no se pueden editar. Si cierra la pieza, la traducción se pierde."
                        : ""}
                </span>
            </div>
        </div>
    ) : null}
    {estadoIngles.aviso ? (
        <p className="se-admin-meta-hint" role="status" style={{ color: "var(--color-accent)" }}>
            {estadoIngles.aviso}
        </p>
    ) : null}
    {/* Mientras Claude traduce, los campos en inglés no se tocan: lo que llegue los
        reemplaza, y lo escrito entretanto se perdería sin aviso. */}
    <div aria-busy={traduciendo}>
        <label className="se-form-field" htmlFor="post-title-en">
            <span className="se-form-label">Título en inglés</span>
            <input
                id="post-title-en"
                className="se-form-control"
                value={form.title_en}
                onChange={handleChange("title_en")}
                maxLength={500}
                readOnly={traduciendo}
            />
        </label>
        <div className="se-form-field se-form-field--brief" key={`resumen-en-${versionEn}`}>
            <span className="se-form-label">
                {form.format === "editorial" ? "Entradilla en inglés" : "Resumen en inglés"} (opcional)
            </span>
            <RichTextEditor
                value={form.excerpt_en}
                onChange={(html) => setForm((prev) => ({ ...prev, excerpt_en: html }))}
                disabled={traduciendo}
            />
            <span className="se-admin-meta-hint">
                El texto corto que va debajo del título y en las tarjetas de la
                portada en inglés.
            </span>
        </div>
        <div className="se-form-field se-editor-cuerpo" key={`cuerpo-en-${versionEn}`}>
            <span className="se-form-label">Cuerpo en inglés</span>
            {FORMATOS_CON_FOTOS_EN_EL_CUERPO.has(form.format) ? (
                <EditorConImagenes
                    value={form.content_en}
                    onChange={(html) => setForm((prev) => ({ ...prev, content_en: html }))}
                    subir={subirFotoDePieza}
                    disabled={traduciendo}
                />
            ) : (
                <RichTextEditor
                    value={form.content_en}
                    onChange={(html) => setForm((prev) => ({ ...prev, content_en: html }))}
                    disabled={traduciendo}
                />
            )}
        </div>
        {/* Solo cuando la traducción vino de Claude: una escrita a mano ya
            está revisada por quien la escribió. */}
        {form.traduccion_automatica || revisadaAhora ? (
            <label className="se-form-field se-acceso" htmlFor="post-traduccion-revisada">
                <span className="se-acceso__fila">
                    <input
                        id="post-traduccion-revisada"
                        type="checkbox"
                        checked={!form.traduccion_automatica}
                        disabled={traduciendo}
                        onChange={(e) => {
                            setRevisadaAhora(true);
                            setForm((prev) => ({ ...prev, traduccion_automatica: !e.target.checked }));
                        }}
                    />
                    <span className="se-form-label se-acceso__titulo">
                        Ya revisé la traducción automática
                    </span>
                </span>
                <span className="se-admin-meta-hint">
                    Mientras no se marque, la página en inglés avisa al lector de
                    que es una traducción automática sin revisar.
                </span>
            </label>
        ) : null}
    </div>
    </CampoMovil>
);

CampoEnIngles.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    estadoIngles: PropTypes.shape({
        resumen: PropTypes.string,
        estado: PropTypes.string,
        aviso: PropTypes.string,
    }).isRequired,
    traductorDisponible: PropTypes.bool,
    traducir: PropTypes.func.isRequired,
    traduciendo: PropTypes.bool,
    versionEn: PropTypes.number.isRequired,
    revisadaAhora: PropTypes.bool,
    setRevisadaAhora: PropTypes.func.isRequired,
};
