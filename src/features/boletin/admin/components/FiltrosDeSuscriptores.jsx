import PropTypes from "prop-types";

/** Qué lista ver: lo que entiende el servidor (`status`, o `all`) y su nombre. */
const ESTADOS = { subscribed: "Suscritos", unsubscribed: "Dados de baja", all: "Todos" };

/**
 * Los filtros de la lista del boletín (`AdminNewsletterList`): el estado (empieza en
 * «Suscritos»: lo que casi siempre hace falta es a quién se le puede escribir), de dónde
 * se apuntó y el buscador por correo. Pocos y cortos: van en fila también en el teléfono.
 * El buscador va aparte (`texto`): la página espera a que se deje de escribir.
 */
export const FiltrosDeSuscriptores = ({ filtros, texto, onTexto, onCambio, origenes, anclaje }) => (
  <div className="se-admin-filters" {...anclaje}>
    <label className="se-admin-filters__field">
      <span className="se-form-label">Estado</span>
      <select className="se-form-control" value={filtros.estado} onChange={(e) => onCambio("estado", e.target.value)}>
        {Object.entries(ESTADOS).map(([clave, nombre]) => (
          <option key={clave} value={clave}>
            {nombre}
          </option>
        ))}
      </select>
    </label>
    <label className="se-admin-filters__field">
      <span className="se-form-label">Origen</span>
      <select className="se-form-control" value={filtros.origen} onChange={(e) => onCambio("origen", e.target.value)}>
        <option value="">Cualquiera</option>
        {Object.entries(origenes).map(([clave, nombre]) => (
          <option key={clave} value={clave}>
            {clave === "otro" ? "Otro" : nombre}
          </option>
        ))}
      </select>
    </label>
    <label className="se-admin-filters__field se-admin-filters__field--grow">
      <span className="se-form-label">Buscar</span>
      <input className="se-form-control" type="search" value={texto} onChange={(e) => onTexto(e.target.value)}
        placeholder="Un trozo del correo" maxLength={100} />
    </label>
  </div>
);

FiltrosDeSuscriptores.propTypes = {
  filtros: PropTypes.shape({ estado: PropTypes.string, origen: PropTypes.string }).isRequired,
  /** Lo escrito en el buscador, antes de la espera. */
  texto: PropTypes.string.isRequired,
  onTexto: PropTypes.func.isRequired,
  /** `(clave, valor)`: cambia un filtro y vuelve a la página 1. */
  onCambio: PropTypes.func.isRequired,
  /** Los orígenes que se pueden elegir: clave → nombre. */
  origenes: PropTypes.objectOf(PropTypes.string).isRequired,
  anclaje: PropTypes.object,
};
