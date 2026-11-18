import PropTypes from "prop-types";
import { tActual } from "../../../i18n/motor";
import { CODIGOS_MONEDA } from "../../../lib/monedas";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";
import { CampoMovil } from "../CampoMovil";
import { AxisPicker } from "../AxisPicker";
import { SugerenciasDeClasificacion } from "../SugerenciasDeClasificacion";
import { CampoDeLaClave } from "./CampoDeLaClave";
import { FORMATOS_CON_FOTOS_EN_EL_CUERPO, listaCorta } from "./formulario";

const { ancla } = recorridoEditor;

/** «Clasificación»: temas, lugares, el sello educativo, la publicidad, la moneda y La Clave. */
export const GrupoClasificacion = ({
    esMovil,
    form,
    setForm,
    sugerencias,
    topics,
    placeGroups,
    temasElegidos,
    lugaresElegidos,
    muestraEducativo,
}) => (
    <div className="se-editor-group" {...ancla("clasificacion")}>
        <p className="se-editor-group__title">Clasificación</p>
        <SugerenciasDeClasificacion
            sugerencias={sugerencias}
            temasPuestos={form.topic_ids ?? []}
            lugaresPuestos={form.place_ids ?? []}
            onTema={(id) => setForm((prev) => ({ ...prev, topic_ids: [...(prev.topic_ids ?? []), id] }))}
            onLugar={(id) => setForm((prev) => ({ ...prev, place_ids: [...(prev.place_ids ?? []), id] }))}
        />
        <CampoMovil
            movil={esMovil}
            plegable
            titulo="Temas"
            resumen={listaCorta(temasElegidos, "Ninguno")}
            estado={temasElegidos.length ? "ok" : undefined}
        >
        <AxisPicker
            buscar={esMovil}
            id="post-topics"
            legend="Temas"
            hint="El primero es el principal: es el único que se muestra en las tarjetas."
            options={topics}
            value={form.topic_ids}
            onChange={(next) => setForm((prev) => ({ ...prev, topic_ids: next }))}
        />
        </CampoMovil>
        <CampoMovil
            movil={esMovil}
            plegable
            titulo="Lugares"
            resumen={listaCorta(lugaresElegidos, "Ninguno")}
            estado={lugaresElegidos.length ? "ok" : undefined}
        >
        <AxisPicker
            buscar={esMovil}
            id="post-places"
            legend="Lugares"
            hint="Elija el lugar más específico que aplique. Al filtrar por una región aparecen sus países."
            groups={placeGroups}
            value={form.place_ids}
            onChange={(next) => setForm((prev) => ({ ...prev, place_ids: next }))}
        />
        </CampoMovil>

        {/* Deliberadamente un interruptor aparte y no una entrada mas en
            la lista de temas. Los temas topan en tres y el primero es el
            que imprime la tarjeta: como tema, marcar algo de educativo
            habria gastado uno de esos huecos y competido por ser el
            principal, para decir algo que no descarta ningun tema. */}
        <CampoMovil
            movil={esMovil}
            plegable
            titulo="Sello y publicidad"
            resumen={[
                form.is_educational ? "Educativo" : null,
                form.sin_publicidad ? "Sin publicidad" : "Con publicidad",
            ]
                .filter(Boolean)
                .join(" · ")}
        >
        {muestraEducativo ? (
            <label
                className="se-form-field se-acceso se-acceso--educativo"
                htmlFor="post-educational"
            >
                <span className="se-acceso__fila">
                    <input
                        id="post-educational"
                        type="checkbox"
                        checked={Boolean(form.is_educational)}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                is_educational: e.target.checked,
                            }))
                        }
                    />
                    <span className="se-form-label se-acceso__titulo">
                        Es contenido educativo
                    </span>
                </span>
                <span className="se-admin-meta-hint">
                    Marcado, la pieza lleva un sello propio en las tarjetas y
                    entra en la sección Educación, además de seguir donde ya
                    estaba. No cambia sus temas ni su formato.
                </span>
            </label>
        ) : null}

        {/* Sin publicidad. Siempre visible y no detras de una condicion
            como la de educativo: los casos que la piden -- un obituario,
            una investigacion que toca a un anunciante, la cobertura de
            una tragedia -- son pocos al ano y siempre urgentes, y en esos
            momentos nadie deberia tener que averiguar donde esta. */}
        <label
            className="se-form-field se-acceso"
            htmlFor="post-sin-publicidad"
        >
            <span className="se-acceso__fila">
                <input
                    id="post-sin-publicidad"
                    type="checkbox"
                    checked={Boolean(form.sin_publicidad)}
                    onChange={(e) =>
                        setForm((prev) => ({
                            ...prev,
                            sin_publicidad: e.target.checked,
                        }))
                    }
                />
                <span className="se-form-label se-acceso__titulo">
                    Esta pieza no lleva publicidad
                </span>
            </span>
            <span className="se-admin-meta-hint">
                Marcado, la página no pide ningún espacio publicitario: ni
                el rail, ni la tarjeta del cuerpo, ni el cintillo. No se
                ocultan después — no se piden.
            </span>
        </label>

        <label className="se-form-field" htmlFor="post-moneda">
            <span className="se-form-label">Moneda de la que habla (opcional)</span>
            <select
                id="post-moneda"
                className="se-form-control"
                value={form.moneda ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, moneda: e.target.value }))}
            >
                <option value="">Ninguna</option>
                {CODIGOS_MONEDA.map((codigo) => (
                    <option key={codigo} value={codigo}>
                        {codigo} · {tActual(`monedas.nombres.${codigo}`)}
                    </option>
                ))}
            </select>
            <span className="se-admin-meta-hint">
                Con ella, junto al titular sale la cotización del día y, si la pieza
                abre la portada, su gráfica de 30 días.
            </span>
        </label>
        {FORMATOS_CON_FOTOS_EN_EL_CUERPO.has(form.format) ? (
            <CampoDeLaClave form={form} setForm={setForm} />
        ) : null}
        </CampoMovil>
    </div>
);

GrupoClasificacion.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    sugerencias: PropTypes.object,
    topics: PropTypes.array.isRequired,
    placeGroups: PropTypes.array.isRequired,
    temasElegidos: PropTypes.arrayOf(PropTypes.string).isRequired,
    lugaresElegidos: PropTypes.arrayOf(PropTypes.string).isRequired,
    muestraEducativo: PropTypes.bool,
};
