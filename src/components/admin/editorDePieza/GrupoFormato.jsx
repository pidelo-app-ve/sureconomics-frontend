import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";

const { ancla } = recorridoEditor;

/** «Formato»: qué es la pieza. Al crear sin formato, los formatos a la vista. */
export const GrupoFormato = ({ esMovil, isCreate, form, setForm, setBase, formats, currentFormat, handleChange }) => (
    <div className="se-editor-group" {...ancla("formato")}>
        <p className="se-editor-group__title">Formato</p>
        <CampoMovil
            movil={esMovil}
            titulo="Qué es esta pieza"
            resumen={currentFormat?.name || "Elija un formato"}
            estado={form.format ? "ok" : "falta"}
        >
        {/* Al crear sin formato, los formatos a la vista con lo que es cada uno: un
            desplegable solo, en una página vacía, no decía qué elegir ni por qué. */}
        {isCreate && !form.format ? (
            <div className="se-formatos" role="group" aria-label="Qué es esta pieza">
                {formats.map((f) => (
                    <button
                        key={f.slug}
                        type="button"
                        className="se-formatos__opcion"
                        onClick={() => {
                            // Elegir el formato es el punto de partida, no un cambio:
                            // sin esto, salir justo después ya preguntaba «¿salir sin
                            // guardar?». La copia local pasa a ser la de ese formato.
                            setForm((prev) => ({ ...prev, format: f.slug }));
                            setBase((prev) => (prev ? { ...prev, format: f.slug } : prev));
                        }}
                    >
                        <strong className="se-formatos__nombre">{f.name}</strong>
                        {f.lede ? <span className="se-formatos__lede">{f.lede}</span> : null}
                    </button>
                ))}
            </div>
        ) : (
        <label className="se-form-field" htmlFor="post-format">
            <span className="se-form-label">Qué es esta pieza</span>
            <select
                id="post-format"
                className="se-form-control"
                value={form.format}
                onChange={handleChange("format")}
            >
                <option value="">Elija un formato…</option>
                {formats.map((f) => (
                    <option key={f.slug} value={f.slug}>
                        {f.name}
                    </option>
                ))}
            </select>
        </label>
        )}
        {form.format && currentFormat?.lede ? (
            <p className="se-admin-meta-hint">{currentFormat.lede}</p>
        ) : null}
        {!form.format ? (
            <p className="se-admin-meta-hint">
                El formato decide qué pide el formulario y cómo se ve la pieza en el
                sitio. Elija uno para continuar; se puede cambiar después.
            </p>
        ) : null}
        </CampoMovil>
    </div>
);

GrupoFormato.propTypes = {
    esMovil: PropTypes.bool,
    isCreate: PropTypes.bool,
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    setBase: PropTypes.func.isRequired,
    formats: PropTypes.array.isRequired,
    currentFormat: PropTypes.object,
    handleChange: PropTypes.func.isRequired,
};
