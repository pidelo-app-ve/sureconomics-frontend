import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";
import { EditorConImagenes } from "../cuerpo/EditorConImagenes";
import { RichTextEditor } from "../../editor/RichTextEditor";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";
import { CampoEnIngles } from "./CampoEnIngles";
import { FORMATOS_CON_FOTOS_EN_EL_CUERPO } from "./formulario";
import { subirFotoDePieza } from "./subirFotoDePieza";

const { ancla } = recorridoEditor;

/** «Cuerpo»: el texto de la pieza y, plegada debajo, su versión en inglés. */
export const GrupoCuerpo = ({ esMovil, form, setForm, nPalabras, ...ingles }) => (
    <div className="se-editor-group" {...ancla("cuerpo")}>
        <p className="se-editor-group__title">Cuerpo</p>
        <CampoMovil
            movil={esMovil}
            titulo={form.format === "entrevista" ? "Resumen de la conversación" : "Contenido"}
            resumen={nPalabras ? `${nPalabras} ${nPalabras === 1 ? "palabra" : "palabras"}` : "Sin escribir"}
            estado={nPalabras ? "ok" : undefined}
        >
        <div className="se-form-field se-editor-cuerpo">
            <span className="se-form-label">
                {form.format === "entrevista"
                    ? "Resumen escrito de la conversación"
                    : "Contenido"}
            </span>
            {/* Fotos entre párrafos: solo donde el cuerpo es texto que se
                lee de corrido. La entrevista lleva aquí el resumen de la
                conversación, y su imagen es el video. */}
            {FORMATOS_CON_FOTOS_EN_EL_CUERPO.has(form.format) ? (
                <EditorConImagenes
                    value={form.content}
                    onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                    subir={subirFotoDePieza}
                />
            ) : (
                <RichTextEditor
                    value={form.content}
                    onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                />
            )}
        </div>
        </CampoMovil>

        <CampoEnIngles esMovil={esMovil} form={form} setForm={setForm} {...ingles} />

    </div>
);

GrupoCuerpo.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    nPalabras: PropTypes.number.isRequired,
};
