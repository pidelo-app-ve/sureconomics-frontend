import PropTypes from "prop-types";
import { actualizarCampana, listar } from "../api";

/**
 * «Al aire»: encender o pausar una campaña con un clic, sin abrir su ficha. Antes el
 * estado solo se cambiaba dentro del modal de la campaña, en un desplegable al pie.
 * Activar una campaña sin pieza lo rechaza el servidor, y se dice.
 */
export const InterruptorAlAire = ({ campana, ocupado, correr, onCambio }) => {
  const encendida = campana.estado === "activa";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendida}
      aria-label={`Al aire: ${campana.nombre}`}
      className={`se-alaire${encendida ? " is-on" : ""}`}
      disabled={ocupado || campana.estado === "terminada"}
      title={campana.estado === "terminada" ? "Terminada: se reabre desde su ficha" : undefined}
      onClick={() =>
        correr(
          async () => {
            await actualizarCampana(campana.id, { estado: encendida ? "pausada" : "activa" });
            return listar();
          },
          encendida ? `«${campana.nombre}» en pausa: deja de salir` : `«${campana.nombre}» al aire`,
        ).then(onCambio)
      }
    >
      <span className="se-alaire__pista" aria-hidden="true" />
      <span className="se-alaire__texto">{encendida ? "Al aire" : "Apagada"}</span>
    </button>
  );
};

InterruptorAlAire.propTypes = {
  campana: PropTypes.object.isRequired,
  ocupado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
};
