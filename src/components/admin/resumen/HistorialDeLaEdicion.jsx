import PropTypes from "prop-types";
import { cuando, queHizo } from "./datosDelResumen";

/** Quién hizo qué con la edición, lo último primero: «Ramón retiró la edición · 17-nov 02:03 p. m.». */
export const HistorialDeLaEdicion = ({ historial }) => (
  <>
    <h2 className="se-form-label">Lo que se hizo con esta edición</h2>
    {historial.length ? (
      <ul className="se-tit-historial__lista">
        {historial.map((a, k) => (
          <li key={`${a.cuando}-${k}`}>
            <span>
              {a.quien || "Alguien del equipo"} {queHizo(a)}
            </span>
            <span className="se-admin-meta-hint">{cuando(a.cuando)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="se-admin-meta-hint">Nadie la ha tocado desde el panel.</p>
    )}
  </>
);

HistorialDeLaEdicion.propTypes = {
  historial: PropTypes.arrayOf(
    PropTypes.shape({ accion: PropTypes.string, cuando: PropTypes.string, quien: PropTypes.string, datos: PropTypes.object }),
  ).isRequired,
};
