import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { EmptyState, ErrorState, LoadingState, Pagination } from "../../content";
import { PaginasDeLaLista } from "../PaginasDeLaLista";
import { useListaDelServidor } from "../../../hooks/useListaDelServidor";
import { adminRequest } from "../../../lib/api";
import { recorridoResumen } from "../../../lib/guias/guiaResumen";
import { hoyEnCaracas } from "../../../lib/listasDelPanel";
import { unwrapEntity } from "../../../services/adminResponseUtils";
import { FiltrosDelHistorial } from "./FiltrosDelHistorial";
import { FILTROS_DEL_HISTORIAL, MOMENTO, canal, chipDe, consultaDelHistorial, hayFiltrosEnElHistorial } from "./datosDelResumen";

const { ancla } = recorridoResumen;

/**
 * «Ediciones anteriores» del resumen: todas, de 21 en 21 (una semana de tres), la más
 * reciente arriba, con filtros (`FiltrosDelHistorial`), pedidas al servidor
 * (`GET /admin/resumen/ediciones`). Antes eran las 90 últimas seguidas, sin filtros, y lo
 * de hace más de un mes no se veía.
 *
 * Cambiar un filtro vuelve a la página 1; cambiar de página sube al principio de la lista.
 * Tras una acción de la página (retener, retirar, rehacer…) `vueltas` cambia y la lista
 * se vuelve a pedir callada, la de los filtros y la página de ese momento.
 */
export const HistorialDeEdiciones = ({ abiertaId, ocupado, vueltas, onAbrir }) => {
  const [filtros, setFiltros] = useState(FILTROS_DEL_HISTORIAL);
  const [pagina, setPagina] = useState(1);
  const arriba = useRef(null);

  const pedir = useCallback(
    async () => unwrapEntity(await adminRequest("/admin/resumen/ediciones", { query: consultaDelHistorial(filtros, pagina) })),
    [filtros, pagina],
  );
  // El servidor da la última página si la pedida ya no existe: esa pasa a ser la pedida.
  const alLlegar = (d) => (d?.pagina && d.pagina !== pagina ? setPagina(d.pagina) : null);
  const { status, datos, error, cargar, recargar } = useListaDelServidor(pedir, alLlegar);

  useEffect(() => {
    if (vueltas) recargar();
  }, [vueltas, recargar]);

  const cambiarFiltro = (clave, valor) => {
    setPagina(1);
    setFiltros((f) => ({ ...f, [clave]: valor }));
  };
  const limpiarFiltros = () => {
    setPagina(1);
    setFiltros(FILTROS_DEL_HISTORIAL);
  };
  const irAPagina = (p) => {
    setPagina(p);
    arriba.current?.scrollIntoView?.({ block: "start" });
  };

  const filas = datos?.resumenes ?? [];
  return (
    <section ref={arriba} className="se-admin-table-wrap se-res-adm-bloque" {...ancla("historial")}>
      <h2 className="se-form-label">Ediciones anteriores</h2>
      <FiltrosDelHistorial filtros={filtros} hoy={hoyEnCaracas()} onCambio={cambiarFiltro} anclaje={ancla("historial-filtros")} />

      {status === "loading" ? <LoadingState title="Cargando las ediciones…" /> : null}
      {status === "error" ? <ErrorState title="No se pudo cargar el historial." error={error} onRetry={() => cargar()} /> : null}

      {status === "success" && !filas.length ? (
        hayFiltrosEnElHistorial(filtros) ? (
          <EmptyState
            title="Ninguna edición con estos filtros"
            description="No hay ediciones que cumplan todo lo elegido. Pruebe con menos filtros o con otras fechas."
            action={
              <button type="button" className="se-btn se-btn--secondary" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <p className="se-admin-meta-hint">Todavía no hay ninguna.</p>
        )
      ) : null}

      {status === "success" && filas.length ? (
        <>
          <PaginasDeLaLista pagina={datos.pagina} paginas={datos.paginas} total={datos.total} onPagina={irAPagina} />
          <div className="se-tit-fuentes__tabla">
            <table className="se-admin-table">
              <thead>
                <tr>
                  <th scope="col">Día</th>
                  <th scope="col">Edición</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="se-tit-num">Puntos</th>
                  <th scope="col">Telegram</th>
                  <th scope="col">WhatsApp</th>
                  <th scope="col"><span className="se-sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fecha_larga}</td>
                    <td>{MOMENTO[r.edicion]}</td>
                    <td>{chipDe(r).texto}</td>
                    <td className="se-tit-num">{r.puntos}</td>
                    <td>{["publicado", "retirado"].includes(r.estado) ? canal(r, "telegram", r.telegram) : "—"}</td>
                    <td>{["publicado", "retirado"].includes(r.estado) ? canal(r, "whatsapp", r.whatsapp) : "—"}</td>
                    <td className="se-admin-table__actions">
                      <button type="button" className="se-btn se-btn--secondary" disabled={r.id === abiertaId || ocupado}
                        onClick={() => onAbrir(r.id)}>
                        {r.id === abiertaId ? "Abierto" : "Ver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={datos.pagina} totalPages={datos.paginas} onPageChange={irAPagina} />
        </>
      ) : null}
    </section>
  );
};

HistorialDeEdiciones.propTypes = {
  /** La edición abierta arriba: su fila dice «Abierto». */
  abiertaId: PropTypes.number,
  ocupado: PropTypes.bool,
  /** Cambia tras cada acción de la página: la lista se vuelve a pedir, callada. */
  vueltas: PropTypes.number,
  onAbrir: PropTypes.func.isRequired,
};
