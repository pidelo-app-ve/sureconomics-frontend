import PropTypes from "prop-types";
import { firmadaPorColaborador } from "../../../lib/firmaDeColaborador";

// El lector que la propuso, si la pieza salió de una propuesta aceptada. La firma
// pública es la de los campos de aquí (se copió de su cuenta al aceptarla); esto
// solo dice de quién es el crédito y si su cuenta cambió desde entonces.
export const AvisoDelColaborador = ({
    colaborador,
    form,
    colaboradorOcupado,
    handleUsarSuCuenta,
    handleQuitarVinculo,
}) => (
    <div className="se-admin-meta-hint" role="note">
        <p>
            <strong>Pieza de un lector.</strong> En el panel sale como «
            {firmadaPorColaborador(form.byline.trim() || "sin firma")}»; la
            web pública solo enseña la firma y la foto de abajo, sin esa marca.
            Se copiaron de su cuenta al aceptarla y no cambian solas.
        </p>
        {!colaborador.al_dia ? (
            <p>
                En su cuenta, ahora: «{colaborador.nombre_actual || "sin nombre"}»
                {(colaborador.foto_actual_id ?? null) === (form.byline_photo_asset_id ?? null)
                    ? ", con la misma foto"
                    : colaborador.foto_actual_id
                      ? ", con otra foto"
                      : ", sin foto"}
                .
            </p>
        ) : null}
        {!colaborador.cuenta_activa ? <p>Su cuenta está desactivada.</p> : null}
        <p>
            {!colaborador.al_dia && colaborador.nombre_actual ? (
                <button
                    type="button"
                    className="se-btn se-btn--secondary"
                    onClick={handleUsarSuCuenta}
                    disabled={colaboradorOcupado}
                >
                    Usar el nombre y la foto actuales de su cuenta
                </button>
            ) : null}{" "}
            <button
                type="button"
                className="se-btn se-btn--secondary"
                onClick={handleQuitarVinculo}
                disabled={colaboradorOcupado}
            >
                Quitar el vínculo con el lector
            </button>
        </p>
    </div>
);

AvisoDelColaborador.propTypes = {
    colaborador: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
    colaboradorOcupado: PropTypes.bool,
    handleUsarSuCuenta: PropTypes.func.isRequired,
    handleQuitarVinculo: PropTypes.func.isRequired,
};
