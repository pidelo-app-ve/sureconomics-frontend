import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Pagination } from "../../../ui";
import { PaginasDeLaLista } from "../../../ui/admin/PaginasDeLaLista";
import { ESTADOS_DE_AVISO, avisosALaVista } from "../../../lib/avisos";
import { recorridoAvisos } from "../../../lib/guias/guiaAvisos";
import { Aviso } from "./TarjetasDeAvisos";

const { ancla } = recorridoAvisos;

/**
 * «De hoy» en «Avisos de noticias»: los avisos de un día con su filtro por estado, en el
 * navegador (el servidor los manda todos: un día rara vez pasa de unas decenas). Hasta 30
 * se ven todos; con más, de 20 en 20.
 *
 * El día se elige aquí (`fecha`; `null` es hoy, lo decide el servidor) y lo pide la
 * página. Quien la monta le pone `key={fecha}`: al cambiar de día, el estado y la página
 * vuelven a empezar. La recarga de cada minuto no los toca.
 */
export const AvisosDelDia = ({ dia, fecha, hoy, cargando, fallo, onFecha, miId, ocupado, redactandoId, acciones }) => {
  const [estado, setEstado] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const arriba = useRef(null);
  const vista = avisosALaVista(dia.avisos, { estado, miId, pagina });
  const esHoy = !fecha;

  const irAPagina = (p) => {
    setPagina(p);
    arriba.current?.scrollIntoView?.({ block: "start" });
  };

  return (
    <>
      <div ref={arriba} className="se-admin-filters" {...ancla("filtros")}>
        <label className="se-admin-filters__field">
          <span className="se-form-label">Día</span>
          <input className="se-form-control" type="date" value={fecha ?? hoy} max={hoy} required
            onChange={(e) => e.target.value && onFecha(e.target.value >= hoy ? null : e.target.value)} />
        </label>
        <label className="se-admin-filters__field">
          <span className="se-form-label">Estado</span>
          <select className="se-form-control" value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }}>
            {Object.entries(ESTADOS_DE_AVISO).map(([clave, { texto }]) => (
              <option key={clave} value={clave}>
                {texto}
              </option>
            ))}
          </select>
        </label>
        {esHoy ? null : (
          <button type="button" className="se-btn se-btn--secondary" onClick={() => onFecha(null)}>
            Volver a hoy
          </button>
        )}
      </div>

      {cargando ? (
        <p className="se-admin-meta-hint" role="status">
          {fallo ? "No se pudieron traer los avisos de ese día. Se intenta de nuevo en un minuto." : "Cargando los avisos de ese día…"}
        </p>
      ) : null}

      {!cargando && !dia.avisos.length ? (
        <p className="se-admin-meta-hint se-avisos__vacio">
          {!esHoy
            ? "Ese día no salió ningún aviso."
            : dia.activos
              ? "Hoy todavía no salió ningún aviso. Cuando el sistema encuentre una noticia que lo merezca, aparece aquí."
              : "Hoy no salió ningún aviso: están apagados. Mire en «Lo que se avisaría ahora» qué saldría."}
        </p>
      ) : null}

      {!cargando && dia.avisos.length && !vista.total ? (
        <div className="se-avisos__vacio">
          <p className="se-admin-meta-hint">
            Ningún aviso «{ESTADOS_DE_AVISO[estado]?.texto.toLowerCase()}» {esHoy ? "hoy" : "ese día"}.
          </p>
          <button type="button" className="se-btn se-btn--secondary" onClick={() => { setEstado("todos"); setPagina(1); }}>
            Ver todos
          </button>
        </div>
      ) : null}

      {!cargando && vista.total ? (
        <>
          {vista.paginas > 1 ? <PaginasDeLaLista pagina={vista.pagina} paginas={vista.paginas} total={vista.total} onPagina={irAPagina} /> : null}
          <ul className="se-avisos__lista">
            {vista.filas.map((a, k) => (
              <Aviso key={a.id} aviso={a} miId={miId} motivos={dia.motivos} ocupado={ocupado}
                redactando={redactandoId === a.id || a.redactando} anclaje={k === 0 ? ancla("lista") : undefined} {...acciones} />
            ))}
          </ul>
          <Pagination page={vista.pagina} totalPages={vista.paginas} onPageChange={irAPagina} />
        </>
      ) : null}
    </>
  );
};

AvisosDelDia.propTypes = {
  /** Lo que mandó el servidor, ya leído (`leerAvisos`). */
  dia: PropTypes.shape({ avisos: PropTypes.array.isRequired, motivos: PropTypes.array, activos: PropTypes.bool }).isRequired,
  /** El día elegido (AAAA-MM-DD), o `null` para hoy. */
  fecha: PropTypes.string,
  /** Hoy en Caracas (AAAA-MM-DD): el tope del selector. */
  hoy: PropTypes.string.isRequired,
  /** Se está pidiendo otro día: lo de antes no se enseña. */
  cargando: PropTypes.bool,
  /** Y la petición de ese día falló (la recarga de cada minuto lo vuelve a intentar). */
  fallo: PropTypes.bool,
  onFecha: PropTypes.func.isRequired,
  miId: PropTypes.number,
  ocupado: PropTypes.bool,
  redactandoId: PropTypes.number,
  /** `onTomar`, `onSoltar`, `onDescartar` y `onRedactar`, para cada tarjeta. */
  acciones: PropTypes.objectOf(PropTypes.func).isRequired,
};
