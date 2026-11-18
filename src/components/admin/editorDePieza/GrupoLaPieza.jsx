import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";
import { BylinePhotoField } from "../BylinePhotoField";
import { SourcesField } from "../SourcesField";
import { RichTextEditor } from "../../editor/RichTextEditor";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";
import { AvisoDelColaborador } from "./AvisoDelColaborador";
import { recortar, textoPlano } from "./formulario";

const { ancla } = recorridoEditor;

/** «La pieza»: título, resumen, firma, fuentes y los campos propios del formato. */
export const GrupoLaPieza = ({
    esMovil,
    form,
    setForm,
    handleChange,
    currentFormat,
    assets,
    setAsset,
    colaborador,
    colaboradorOcupado,
    handleUsarSuCuenta,
    handleQuitarVinculo,
    nFuentes,
    shows,
}) => (
    <div className="se-editor-group" {...ancla("pieza")}>
        <p className="se-editor-group__title">La pieza</p>
        <CampoMovil
            movil={esMovil}
            titulo="Título"
            resumen={form.title.trim() ? recortar(form.title.trim()) : "Sin escribir"}
            estado={form.title.trim() ? "ok" : "falta"}
        >
        <label className="se-form-field" htmlFor="post-title">
            <span className="se-form-label">Título</span>
            <input
                id="post-title"
                className="se-form-control"
                value={form.title}
                onChange={handleChange("title")}
                required
            />
        </label>
        </CampoMovil>
        {/* The same editor as the body: a summary is prose, and a
            writer who needs an emphasis or a link in it should not
            have to give it up because the field is smaller. */}
        <CampoMovil
            movil={esMovil}
            plegable
            titulo={form.format === "editorial" ? "Entradilla" : "Resumen"}
            resumen={recortar(textoPlano(form.excerpt)) || "Vacío"}
            estado={textoPlano(form.excerpt) ? "ok" : undefined}
        >
        <div className="se-form-field se-form-field--brief" id="post-excerpt">
            <span className="se-form-label">
                {form.format === "editorial" ? "Entradilla" : "Resumen"}
            </span>
            <RichTextEditor
                value={form.excerpt}
                onChange={(html) => setForm((prev) => ({ ...prev, excerpt: html }))}
                placeholder={
                    form.format === "editorial"
                        ? "La frase con la que abre el editorial…"
                        : "Dos o tres líneas que resuman la pieza…"
                }
            />
        </div>
        </CampoMovil>

        {/* The published byline. Not the account that uploads the
            piece -- nobody wants their personal login printed on
            the site, and an editor rarely publishes under their
            own name. */}
        {currentFormat?.shows_author !== false ? (
            <CampoMovil
                movil={esMovil}
                plegable
                titulo="Firma y foto"
                resumen={form.byline.trim() || "Sin firma"}
                miniatura={assets.bylinePhoto?.url || undefined}
            >
                {colaborador ? (
                    <AvisoDelColaborador
                        colaborador={colaborador}
                        form={form}
                        colaboradorOcupado={colaboradorOcupado}
                        handleUsarSuCuenta={handleUsarSuCuenta}
                        handleQuitarVinculo={handleQuitarVinculo}
                    />
                ) : null}
                <label className="se-form-field" htmlFor="post-byline">
                    <span className="se-form-label">
                        Firma — nombre con el que se publica
                    </span>
                    <input
                        id="post-byline"
                        className="se-form-control"
                        value={form.byline}
                        onChange={handleChange("byline")}
                        placeholder="Pablo Quintero, Redacción SurEconomics, …"
                    />
                    <span className="se-admin-meta-hint">
                        Si lo deja vacío, la pieza se publica sin firma. No se usa el
                        nombre de la cuenta.
                    </span>
                </label>

                {/* Dentro de la misma condición que la firma, y no al
                    lado de las otras tres adjunciones: un formato que no
                    muestra autor no tiene a quién retratar, y el campo
                    necesita leer el nombre de arriba para precargar la
                    búsqueda. */}
                <BylinePhotoField
                    value={form.byline_photo_asset_id}
                    asset={assets.bylinePhoto}
                    byline={form.byline}
                    onChange={setAsset("byline_photo_asset_id", "bylinePhoto")}
                />
            </CampoMovil>
        ) : null}

        <CampoMovil
            movil={esMovil}
            plegable
            titulo="Fuentes"
            resumen={nFuentes ? `${nFuentes} ${nFuentes === 1 ? "fuente" : "fuentes"}` : "Ninguna"}
        >
        <SourcesField
            value={form.sources}
            onChange={(sources) => setForm((prev) => ({ ...prev, sources }))}
        />
        </CampoMovil>

        {shows("interviewee") ? (
            <CampoMovil
                movil={esMovil}
                titulo="Entrevistado"
                resumen={
                    [form.interviewee, form.interviewee_role].filter((x) => x?.trim()).join(" · ") ||
                    "Sin escribir"
                }
            >
                <label className="se-form-field" htmlFor="post-interviewee">
                    <span className="se-form-label">Entrevistado</span>
                    <input
                        id="post-interviewee"
                        className="se-form-control"
                        value={form.interviewee}
                        onChange={handleChange("interviewee")}
                    />
                </label>
                <label className="se-form-field" htmlFor="post-interviewee-role">
                    <span className="se-form-label">Cargo</span>
                    <input
                        id="post-interviewee-role"
                        className="se-form-control"
                        value={form.interviewee_role}
                        onChange={handleChange("interviewee_role")}
                    />
                </label>
            </CampoMovil>
        ) : null}

        {shows("unit") ? (
            <CampoMovil
                movil={esMovil}
                titulo="Unidad que firma"
                resumen={form.unit.trim() || "Sin escribir"}
            >
            <label className="se-form-field" htmlFor="post-unit">
                <span className="se-form-label">Unidad que firma</span>
                <input
                    id="post-unit"
                    className="se-form-control"
                    value={form.unit}
                    onChange={handleChange("unit")}
                    placeholder="RendiGroup Advisors, …"
                />
            </label>
            </CampoMovil>
        ) : null}

        {currentFormat?.shows_author === false ? (
            <p className="se-admin-meta-hint">
                Este formato se publica sin firma personal: el sitio no muestra
                autor.
            </p>
        ) : null}
    </div>
);

GrupoLaPieza.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    currentFormat: PropTypes.object,
    assets: PropTypes.object.isRequired,
    setAsset: PropTypes.func.isRequired,
    colaborador: PropTypes.object,
    colaboradorOcupado: PropTypes.bool,
    handleUsarSuCuenta: PropTypes.func.isRequired,
    handleQuitarVinculo: PropTypes.func.isRequired,
    nFuentes: PropTypes.number.isRequired,
    shows: PropTypes.func.isRequired,
};
