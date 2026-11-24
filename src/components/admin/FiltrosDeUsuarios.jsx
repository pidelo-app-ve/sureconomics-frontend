import PropTypes from "prop-types";
import { CampoMovil } from "./CampoMovil";
import { useEsMovil } from "../../hooks/useEsMovil";

/** Las opciones de cada filtro de «sí/no»: el valor que entiende el servidor y su nombre. */
const OPCIONES_DE_USUARIOS = {
  activo: { titulo: "Cuenta", si: "Activas", no: "Desactivadas" },
  verificado: { titulo: "Correo", si: "Verificado", no: "Sin verificar" },
  colaborador: { titulo: "Propuestas", si: "Puede mandar", no: "No puede", sin_cambiar: "Sin cambiar (lo de todos)" },
};

/**
 * Los filtros de la lista de lectores (`AdminUsersList`), con la forma de los de
 * Titulares: el buscador a la vista y, en el teléfono, el resto en una hoja que dice en
 * su fila qué hay puesto. El buscador va aparte (`texto`): la página espera a que se deje
 * de escribir antes de pedir. Quien cambia algo vuelve a la página 1 (lo hace la página).
 */
export const FiltrosDeUsuarios = ({ filtros, texto, onTexto, onCambio, anclaje }) => {
  const esMovil = useEsMovil();

  const selectores = Object.entries(OPCIONES_DE_USUARIOS).map(([clave, { titulo, ...opciones }]) => (
    <label key={clave} className="se-admin-filters__field">
      <span className="se-form-label">{titulo}</span>
      <select className="se-form-control" value={filtros[clave]} onChange={(e) => onCambio(clave, e.target.value)}>
        <option value="">Cualquiera</option>
        {Object.entries(opciones).map(([valor, nombre]) => (
          <option key={valor} value={valor}>
            {nombre}
          </option>
        ))}
      </select>
    </label>
  ));

  const resumen =
    Object.entries(OPCIONES_DE_USUARIOS)
      .map(([clave, opciones]) => (filtros[clave] ? opciones[filtros[clave]] : null))
      .filter(Boolean)
      .join(" · ") || "Sin filtros";

  return (
    <div className="se-admin-filters" {...anclaje}>
      <label className="se-admin-filters__field se-admin-filters__field--grow">
        <span className="se-form-label">Buscar</span>
        <input className="se-form-control" type="search" value={texto} onChange={(e) => onTexto(e.target.value)}
          placeholder="Nombre, apellido o correo" maxLength={100} />
      </label>
      {esMovil ? (
        <CampoMovil movil titulo="Filtros" resumen={resumen}>
          {selectores}
        </CampoMovil>
      ) : (
        selectores
      )}
    </div>
  );
};

FiltrosDeUsuarios.propTypes = {
  filtros: PropTypes.shape({
    activo: PropTypes.string,
    verificado: PropTypes.string,
    colaborador: PropTypes.string,
  }).isRequired,
  /** Lo escrito en el buscador, antes de la espera. */
  texto: PropTypes.string.isRequired,
  onTexto: PropTypes.func.isRequired,
  /** `(clave, valor)`: cambia un filtro y vuelve a la página 1. */
  onCambio: PropTypes.func.isRequired,
  anclaje: PropTypes.object,
};
