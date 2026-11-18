import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";
import {
    DURACIONES_DE_PORTADA,
    FORMATOS_SIN_PROGRAMAR,
    fechaDeCaracas,
    hastaDeCaracas,
    isoToDateTimeLocal,
} from "./formulario";

const { ancla } = recorridoEditor;

// «Publicación» (estado, fecha, portada): en el teléfono, entre las demás filas; en el
// computador, en la columna de la derecha con el estado y los botones, abierta, que es
// donde se mira al publicar (lo pidió Ramón el 9-nov-2026).
export const GrupoPublicacion = ({
    esMovil,
    form,
    setForm,
    handleChange,
    canPublish,
    sePuedeProgramar,
    programada,
    resumenDeEstado,
    faltaFechaDePortada,
    muestraPortada,
    portadaHastaIso,
    missingMedia,
    requiredMedia,
}) => (
    <div className="se-editor-group" {...ancla("publicacion")}>
        <p className="se-editor-group__title">Publicación</p>
        <CampoMovil
            movil={esMovil}
            plegable
            abierto
            titulo="Estado y fecha"
            resumen={resumenDeEstado}
            estado={(programada && !form.published_at) || faltaFechaDePortada ? "falta" : undefined}
        >
        <label className="se-form-field" htmlFor="post-status">
            <span className="se-form-label">Estado</span>
            <select
                id="post-status"
                className="se-form-control"
                value={form.status}
                onChange={handleChange("status")}
            >
                <option value="draft">Borrador</option>
                {sePuedeProgramar || programada ? (
                    <option value="scheduled">Programado</option>
                ) : null}
                {canPublish || form.status === "published" ? (
                    <option value="published">Publicado</option>
                ) : null}
            </select>
        </label>
        <label className="se-form-field" htmlFor="post-published-at">
            <span className="se-form-label">
                {programada
                    ? "Se publica el (hora de Caracas)"
                    : "Fecha de publicación (opcional, hora de Caracas)"}
            </span>
            <input
                id="post-published-at"
                type="datetime-local"
                className="se-form-control"
                value={form.published_at}
                required={programada}
                min={programada ? isoToDateTimeLocal(new Date().toISOString()) : undefined}
                onChange={handleChange("published_at")}
            />
        </label>
        {programada ? (
            <p className="se-admin-meta-hint">
                {form.published_at
                    ? `Sale sola el ${fechaDeCaracas(form.published_at)}. Hasta entonces no se ve en el sitio. Pulse «Programar» para dejarla en cola.`
                    : "Elija el día y la hora en que sale: tiene que ser en el futuro."}
            </p>
        ) : null}
        {canPublish && FORMATOS_SIN_PROGRAMAR.has(form.format) ? (
            <p className="se-admin-meta-hint">
                Las noticias no se programan: se publican cuando pasan.
            </p>
        ) : null}

        {/* Abrir la portada con esta pieza. Un solo campo en la API
            (`destacada_hasta`), tres controles aquí: la casilla, cuánto
            dura y, si hace falta, hasta cuándo. Va en esta misma hoja
            porque es una decisión de publicación -- qué abre el sitio y
            hasta cuándo -- y no un atributo de la pieza. La casilla y el
            selector son hermanos, no anidados: un `<select>` dentro de
            la etiqueta de la casilla la marcaría al tocar la lista. */}
        {muestraPortada ? (
            <div className="se-form-field se-acceso se-acceso--portada">
                <label className="se-acceso__fila" htmlFor="post-portada">
                    <input
                        id="post-portada"
                        type="checkbox"
                        checked={Boolean(form.portada)}
                        disabled={!canPublish}
                        onChange={(e) =>
                            setForm((prev) => ({ ...prev, portada: e.target.checked }))
                        }
                    />
                    <span className="se-form-label se-acceso__titulo">
                        Abrir la portada con esta pieza
                    </span>
                </label>
                {form.portada ? (
                    <>
                        <div className="se-portada-pin__durante">
                            <label className="se-form-field" htmlFor="post-portada-durante">
                                <span className="se-form-label">Durante</span>
                                <select
                                    id="post-portada-durante"
                                    className="se-form-control"
                                    value={form.portada_durante}
                                    disabled={!canPublish}
                                    onChange={handleChange("portada_durante")}
                                >
                                    {DURACIONES_DE_PORTADA.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {form.portada_durante === "fecha" ? (
                                <label className="se-form-field" htmlFor="post-portada-hasta">
                                    <span className="se-form-label">Hasta (hora de Caracas)</span>
                                    <input
                                        id="post-portada-hasta"
                                        type="datetime-local"
                                        className="se-form-control"
                                        value={form.portada_hasta}
                                        required
                                        disabled={!canPublish}
                                        min={isoToDateTimeLocal(new Date().toISOString())}
                                        onChange={handleChange("portada_hasta")}
                                    />
                                </label>
                            ) : null}
                        </div>
                        <p className="se-admin-meta-hint se-portada-pin__hasta">
                            {portadaHastaIso
                                ? `Hasta el ${hastaDeCaracas(portadaHastaIso)}${
                                      form.portada_durante === "fecha" ? "" : ", contando desde que guarde"
                                  }.`
                                : "Elija hasta cuándo: tiene que ser en el futuro."}
                        </p>
                    </>
                ) : null}
                <p className="se-admin-meta-hint">
                    Mientras dure, esta pieza abre la portada en grande. Cuando
                    venza, la portada vuelve sola a la noticia más reciente.
                </p>
                {form.portada && form.status !== "published" ? (
                    <p className="se-admin-meta-hint">
                        Sólo cuenta mientras la pieza esté publicada: un borrador
                        o una programada no abren nada hasta que salgan.
                    </p>
                ) : null}
            </div>
        ) : null}

        {missingMedia ? (
            <p className="se-admin-warning">
                Falta {requiredMedia === "video" ? "el video" : requiredMedia === "audio" ? "el audio" : "el documento"}.
                Puede guardar como borrador, pero publicar será rechazado hasta
                que lo adjunte.
            </p>
        ) : null}
        </CampoMovil>
    </div>
);

GrupoPublicacion.propTypes = {
    esMovil: PropTypes.bool,
    form: PropTypes.object.isRequired,
    setForm: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    canPublish: PropTypes.bool,
    sePuedeProgramar: PropTypes.bool,
    programada: PropTypes.bool,
    resumenDeEstado: PropTypes.string,
    faltaFechaDePortada: PropTypes.bool,
    muestraPortada: PropTypes.bool,
    portadaHastaIso: PropTypes.string,
    missingMedia: PropTypes.bool,
    requiredMedia: PropTypes.string,
};
