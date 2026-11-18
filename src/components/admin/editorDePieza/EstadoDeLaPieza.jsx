import PropTypes from "prop-types";
import { rutaDePieza } from "../../../lib/pieza";
import { recorridoEditor } from "../../../lib/guias/guiaEditor";
import { horaCorta } from "./formulario";

const { ancla } = recorridoEditor;

/** «Estado», en la columna de la derecha del computador: cómo va y qué falta para publicar. */
export const EstadoDeLaPieza = ({ form, resumenDeEstado, sinGuardar, borrador, isCreate, faltas }) => (
    <section className="se-editor-estado" {...ancla("estado")}>
        <p className="se-editor-estado__rotulo">Estado</p>
        <p className="se-editor-estado__valor">{resumenDeEstado}</p>
        {form.status === "published" && form.slug ? (
            <a
                href={rutaDePieza({ formatoApi: form.format, slug: form.slug })}
                className="se-link se-editor-estado__ver"
                target="_blank"
                rel="noopener noreferrer"
            >
                Ver en el sitio
            </a>
        ) : null}
        <p
            className={`se-editor-estado__guardado${sinGuardar ? " is-pendiente" : ""}`}
            role="status"
        >
            {sinGuardar
                ? borrador.guardadoEn
                    ? `Sin guardar · copia en este equipo a las ${horaCorta(borrador.guardadoEn)}`
                    : "Hay cambios sin guardar"
                : isCreate
                  ? "Todavía no se ha creado"
                  : "Todo guardado"}
        </p>
        {faltas.length ? (
            <p className="se-editor-estado__faltas">Para publicar falta: {faltas.join(", ")}.</p>
        ) : null}
    </section>
);

EstadoDeLaPieza.propTypes = {
    form: PropTypes.object.isRequired,
    resumenDeEstado: PropTypes.string,
    sinGuardar: PropTypes.bool,
    borrador: PropTypes.object.isRequired,
    isCreate: PropTypes.bool,
    faltas: PropTypes.arrayOf(PropTypes.string).isRequired,
};
