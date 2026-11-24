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
                <span className="se-admin-meta-hint">
                    Traduce el título, el resumen y el cuerpo de arriba, aunque
                    no estén guardados. Revisa el resultado y guarda la pieza.
                </span>
            </div>
        </div>
    ) : null}
    {estadoIngles.aviso ? (
        <p className="se-admin-meta-hint" role="status" style={{ color: "var(--color-accent)" }}>
            {estadoIngles.aviso}
        </p>
    ) : null}
    <label className="se-form-field" htmlFor="post-title-en">
        <span className="se-form-label">Título en inglés</span>
        <input
            id="post-title-en"
            className="se-form-control"
            value={form.title_en}
            onChange={handleChange("title_en")}
            maxLength={500}
        />
    </label>
    <div className="se-form-field se-form-field--brief" key={`resumen-en-${versionEn}`}>
        <span className="se-form-label">
            {form.format === "editorial" ? "Entradilla en inglés" : "Resumen en inglés"} (opcional)
        </span>
        <RichTextEditor
            value={form.excerpt_en}
            onChange={(html) => setForm((prev) => ({ ...prev, excerpt_en: html }))}
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
            />
        ) : (
            <RichTextEditor
                value={form.content_en}
                onChange={(html) => setForm((prev) => ({ ...prev, content_en: html }))}
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
