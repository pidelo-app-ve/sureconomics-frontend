import PropTypes from "prop-types";
import { CampoMovil } from "../../../../components/admin/CampoMovil";
import { useEsMovil } from "../../../../hooks/useEsMovil";
import { nombreDePais } from "../../../../lib/avisos";
import { CATEGORIAS, NOMBRE_DE_NIVEL, SOLO, VENTANAS, nombreDeCategoria } from "../utils";

/**
 * Los filtros de la lista de titulares, con la forma de los de Contenido: en el
 * computador, en fila; en el teléfono, el buscador a la vista y el resto en una hoja
 * (`CampoMovil`) que dice en su fila qué hay puesto.
 *
 * Los países salen de lo que hay en esa vista y esas horas (`opciones.paises` del
 * servidor); el que está elegido se queda en la lista aunque ya no haya ninguno. Quien
 * cambia algo vuelve a la página 1 (lo hace la página, en `onCambio`). El buscador va
 * aparte (`texto`): la página espera a que se deje de escribir antes de pedir.
 */
export const FiltrosDeTitulares = ({ filtros, texto, onTexto, onCambio, opciones, anclaje }) => {
  const esMovil = useEsMovil();
  const paises = [...new Set([...(opciones?.paises ?? []), ...(filtros.pais ? [filtros.pais] : [])])]
    .sort((a, b) => nombreDePais(a).localeCompare(nombreDePais(b), "es"));
  const categorias = opciones?.categorias?.length ? opciones.categorias : Object.keys(CATEGORIAS);
  const cambiar = (clave) => (e) => onCambio(clave, e.target.value);

  const buscador = (
    <label className="se-admin-filters__field se-admin-filters__field--grow">
      <span className="se-form-label">Buscar</span>
      <input className="se-form-control" type="search" value={texto} onChange={(e) => onTexto(e.target.value)}
        placeholder="Título o resumen, en español o inglés" maxLength={100} />
    </label>
  );

  const resto = (
    <>
      <label className="se-admin-filters__field">
        <span className="se-form-label">País</span>
        <select className="se-form-control" value={filtros.pais} onChange={cambiar("pais")}>
          <option value="">Todos</option>
          {paises.map((p) => (
            <option key={p} value={p}>
              {nombreDePais(p)}
            </option>
          ))}
        </select>
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Tema</span>
        <select className="se-form-control" value={filtros.categoria} onChange={cambiar("categoria")}>
          <option value="">Todos</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {nombreDeCategoria(c)}
            </option>
          ))}
        </select>
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">De las últimas</span>
        <select className="se-form-control" value={filtros.horas} onChange={(e) => onCambio("horas", Number(e.target.value))}>
          {VENTANAS.map((h) => (
            <option key={h} value={h}>
              {h} horas
            </option>
          ))}
        </select>
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Solo</span>
        <select className="se-form-control" value={filtros.solo} onChange={cambiar("solo")}>
          <option value="">Todos</option>
          {Object.entries(SOLO).map(([clave, nombre]) => (
            <option key={clave} value={clave}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="se-admin-filters__field">
        <span className="se-form-label">Mejor fuente</span>
        <select className="se-form-control" value={filtros.nivel} onChange={cambiar("nivel")}>
          <option value="">Cualquiera</option>
          {Object.entries(NOMBRE_DE_NIVEL).map(([nivel, nombre]) => (
            <option key={nivel} value={nivel}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
    </>
  );

  const resumen =
    [
      filtros.pais ? nombreDePais(filtros.pais) : null,
      filtros.categoria ? nombreDeCategoria(filtros.categoria) : null,
      `${filtros.horas} h`,
      filtros.solo ? SOLO[filtros.solo] : null,
      filtros.nivel ? `nivel ${filtros.nivel}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="se-admin-filters" {...anclaje}>
      {buscador}
      {esMovil ? (
        <CampoMovil movil titulo="Filtros" resumen={resumen}>
          {resto}
        </CampoMovil>
      ) : (
        resto
      )}
    </div>
  );
};

FiltrosDeTitulares.propTypes = {
  filtros: PropTypes.shape({
    pais: PropTypes.string,
    categoria: PropTypes.string,
    horas: PropTypes.number,
    solo: PropTypes.string,
    nivel: PropTypes.string,
  }).isRequired,
  /** Lo escrito en el buscador, antes de la espera. */
  texto: PropTypes.string.isRequired,
  onTexto: PropTypes.func.isRequired,
  /** `(clave, valor)`: cambia un filtro y vuelve a la página 1. */
  onCambio: PropTypes.func.isRequired,
  opciones: PropTypes.shape({
    paises: PropTypes.arrayOf(PropTypes.string),
    categorias: PropTypes.arrayOf(PropTypes.string),
  }),
  anclaje: PropTypes.object,
};
