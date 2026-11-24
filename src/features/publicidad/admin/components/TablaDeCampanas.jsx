import { useState } from "react";
import PropTypes from "prop-types";
import { ESTADOS_DE_CAMPANA, estadoDeCampana } from "./MuralDeAnunciantes";
import { recorridoPublicidad } from "../../../../lib/guias/guiaPublicidad";
import { hoyEnCaracas } from "../../../../lib/listasDelPanel";
import { VISTAS_DE_CAMPANAS, campanaEnLaVista } from "../utils";
import { InterruptorAlAire } from "./InterruptorAlAire";

const { ancla } = recorridoPublicidad;

const ORDEN_EN_LA_TABLA = ["activa", "tope", "fecha", "sin_pieza", "anunciante", "pausada", "borrador", "terminada"];

/**
 * Todas las campañas en una tabla: qué se vende, de quién, si sale y hasta cuándo.
 * Antes había que abrir cada anunciante (acordeón) y cada campaña (modal) para saberlo.
 * Las fichas siguen abajo para el detalle: piezas, artes, segmentos.
 *
 * «Ver» filtra en el navegador: al aire, programadas, terminadas o todas. Se entra sin las
 * terminadas, que con los meses serían la mayor parte de la tabla.
 */
export const TablaDeCampanas = ({ anunciantes, cifras, ocupado, correr, onCambio, onAbrir }) => {
  const [vista, setVista] = useState("sin_terminadas");
  const hoy = hoyEnCaracas();
  const todas = anunciantes
    .flatMap((a) => (a.campanas ?? []).map((c) => ({ a, c, estado: estadoDeCampana(c) })))
    .sort(
      (x, y) =>
        ORDEN_EN_LA_TABLA.indexOf(x.estado) - ORDEN_EN_LA_TABLA.indexOf(y.estado) ||
        x.a.nombre.localeCompare(y.a.nombre, "es"),
    );
  if (!todas.length) return null;
  const cuantas = (v) => todas.filter(({ c }) => campanaEnLaVista(c, v, hoy)).length;
  const filas = todas.filter(({ c }) => campanaEnLaVista(c, vista, hoy));
  return (
    <section className="se-admin-pub__tabla" {...ancla("campanas")}>
      <h2 className="se-admin-pub__sub">Campañas</h2>
      <div className="se-admin-filters">
        <label className="se-admin-filters__field">
          <span className="se-form-label">Ver</span>
          <select className="se-form-control" value={vista} onChange={(e) => setVista(e.target.value)}>
            {Object.entries(VISTAS_DE_CAMPANAS).map(([clave, nombre]) => (
              <option key={clave} value={clave}>
                {nombre} ({cuantas(clave)})
              </option>
            ))}
          </select>
        </label>
      </div>
      {!filas.length ? (
        <p className="se-admin-meta-hint">
          Ninguna campaña en «{VISTAS_DE_CAMPANAS[vista].toLowerCase()}».{" "}
          <button type="button" className="se-link se-header__nav-link--button" onClick={() => setVista("todas")}>
            Ver todas
          </button>
        </p>
      ) : (
        <div className="se-admin-table-wrap">
          <table className="se-admin-table">
            <thead>
              <tr>
                <th scope="col">Campaña</th>
                <th scope="col">Cómo va</th>
                <th scope="col">Al aire</th>
                <th scope="col">Fechas</th>
                <th scope="col">Piezas</th>
                <th scope="col">Impresiones · clics</th>
                <th scope="col"><span className="se-sr-only">Ficha</span></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ a, c, estado }) => {
                const sello = ESTADOS_DE_CAMPANA[estado] ?? { texto: estado, clase: "" };
                const tot = (c.creatividades ?? []).reduce(
                  (acc, cr) => ({
                    impresiones: acc.impresiones + (cifras?.[cr.id]?.impresiones ?? 0),
                    clics: acc.clics + (cifras?.[cr.id]?.clics ?? 0),
                  }),
                  { impresiones: 0, clics: 0 },
                );
                return (
                  <tr key={c.id}>
                    <td>
                      <span className="se-admin-pub__tabla-campana">{c.nombre}</span>
                      <span className="se-admin-pub__tabla-marca">{a.nombre}</span>
                    </td>
                    <td>
                      <span className={`se-mural__sello ${sello.clase}`}>{sello.texto}</span>
                    </td>
                    <td>
                      <InterruptorAlAire campana={c} ocupado={ocupado} correr={correr} onCambio={onCambio} />
                    </td>
                    <td className="se-admin-pub__tabla-fechas">
                      {c.desde || c.hasta ? `${c.desde ?? "…"} → ${c.hasta ?? "sin fin"}` : "Sin fechas"}
                    </td>
                    <td>{c.creatividades?.length ?? 0}</td>
                    <td>
                      {tot.impresiones.toLocaleString("es")} · {tot.clics.toLocaleString("es")}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="se-link se-header__nav-link--button"
                        onClick={() => onAbrir(a.id)}
                        aria-label={`Abrir la ficha de ${a.nombre}`}
                      >
                        Ficha
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

TablaDeCampanas.propTypes = {
  anunciantes: PropTypes.array.isRequired,
  cifras: PropTypes.object,
  ocupado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
  onAbrir: PropTypes.func.isRequired,
};
