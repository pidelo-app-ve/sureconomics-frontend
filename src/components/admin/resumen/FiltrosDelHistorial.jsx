import PropTypes from "prop-types";
import { CampoMovil } from "../CampoMovil";
import { useEsMovil } from "../../../hooks/useEsMovil";
import { ESTADOS_DEL_HISTORIAL, FALLOS_DE_ENVIO, MOMENTO } from "./datosDelResumen";

/** «20-nov»: una fecha AAAA-MM-DD, corta, para el resumen de los filtros en el teléfono. */
const corta = (iso) => {
  const [, mes, dia] = String(iso).split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${Number(dia)}-${meses[Number(mes) - 1] ?? mes}`;
};

/**
 * Los filtros del historial del resumen, con la forma de los de Titulares: en el
 * computador, en fila; en el teléfono, en una hoja (`CampoMovil`) que dice en su fila qué
 * hay puesto. Quien cambia algo vuelve a la página 1 (lo hace el historial, en `onCambio`).
 * Las fechas no pasan de hoy (`hoy`, en Caracas); puestas al revés, se buscan igual.
 */
export const FiltrosDelHistorial = ({ filtros, hoy, onCambio, anclaje }) => {
  const esMovil = useEsMovil();
  const cambiar = (clave) => (e) => onCambio(clave, e.target.value);

  const campos = (
    <>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Estado</span>
        <select className="se-form-control" value={filtros.estado} onChange={cambiar("estado")}>
          <option value="">Todos</option>
          {Object.entries(ESTADOS_DEL_HISTORIAL).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Edición</span>
        <select className="se-form-control" value={filtros.edicion} onChange={cambiar("edicion")}>
          <option value="">Las tres</option>
          {Object.entries(MOMENTO).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Desde</span>
        <input className="se-form-control" type="date" value={filtros.desde} max={hoy} onChange={cambiar("desde")} />
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Hasta</span>
        <input className="se-form-control" type="date" value={filtros.hasta} max={hoy} onChange={cambiar("hasta")} />
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Solo con fallos de envío</span>
        <select className="se-form-control" value={filtros.fallo} onChange={cambiar("fallo")}>
          <option value="">No</option>
          {Object.entries(FALLOS_DE_ENVIO).map(([clave, texto]) => (
            <option key={clave} value={clave}>
              {texto}
            </option>
          ))}
        </select>
      </label>
    </>
  );

  const resumen =
    [
      filtros.estado ? ESTADOS_DEL_HISTORIAL[filtros.estado] : null,
      filtros.edicion ? MOMENTO[filtros.edicion] : null,
      filtros.desde ? `desde el ${corta(filtros.desde)}` : null,
      filtros.hasta ? `hasta el ${corta(filtros.hasta)}` : null,
      filtros.fallo ? `fallos ${FALLOS_DE_ENVIO[filtros.fallo].toLowerCase()}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Todas";

  return (
    <div className="se-admin-filters" {...anclaje}>
      {esMovil ? (
        <CampoMovil movil titulo="Filtros" resumen={resumen}>
          {campos}
        </CampoMovil>
      ) : (
        campos
      )}
    </div>
  );
};

FiltrosDelHistorial.propTypes = {
  filtros: PropTypes.shape({
    estado: PropTypes.string,
    edicion: PropTypes.string,
    desde: PropTypes.string,
    hasta: PropTypes.string,
    fallo: PropTypes.string,
  }).isRequired,
  /** Hoy en Caracas (AAAA-MM-DD): el tope de las fechas. */
  hoy: PropTypes.string,
  /** `(clave, valor)`: cambia un filtro y vuelve a la página 1. */
  onCambio: PropTypes.func.isRequired,
  anclaje: PropTypes.object,
};
