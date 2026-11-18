import { useState } from "react";
import PropTypes from "prop-types";

/**
 * El motivo de «Retirar edición», dentro del diálogo de confirmación. Lleva su propio
 * estado (el diálogo pinta lo que se le pasó al abrirlo) y avisa cada cambio hacia fuera.
 */
const MOTIVO_MAX = 300;
export const CampoMotivo = ({ onCambio }) => {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="se-form-field" style={{ marginTop: "0.75rem" }}>
      <label className="se-form-label" htmlFor="res-retirar-motivo">Motivo (opcional)</label>
      <textarea id="res-retirar-motivo" className="se-form-control" rows={2} maxLength={MOTIVO_MAX} value={motivo}
        onChange={(e) => {
          setMotivo(e.target.value);
          onCambio(e.target.value);
        }} />
      <p className="se-admin-meta-hint">
        Queda en el historial de la edición, para el equipo; en la web no se enseña. {motivo.length}/{MOTIVO_MAX}
      </p>
    </div>
  );
};

CampoMotivo.propTypes = { onCambio: PropTypes.func.isRequired };
