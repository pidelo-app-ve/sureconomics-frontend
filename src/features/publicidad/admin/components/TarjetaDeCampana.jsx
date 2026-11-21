import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { DondeSale } from "./DondeSale";
import { ModalDelPanel } from "../../../../components/admin/ModalDelPanel";
import { nombreDeFormato } from "../utils/formatosDePublicidad";
import {
  actualizarCampana,
  actualizarPieza,
  borrarCampana,
  borrarPieza,
  crearPieza,
} from "../services/api";
import { FilaDePieza } from "./FilaDePieza";
import { InterruptorAlAire } from "./InterruptorAlAire";

export const TarjetaDeCampana = ({
  campana,
  anunciante,
  ajustes,
  cifras,
  ocupado,
  correr,
  preguntar,
  onCambio,
}) => {
  const [abierta, setAbierta] = useState(false);
  const [borrador, setBorrador] = useState(campana);
  const [formatoNuevo, setFormatoNuevo] = useState("A");

  useEffect(() => setBorrador(campana), [campana]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setBorrador((antes) => ({ ...antes, [campo]: valor }));
  };

  const guardar = (extra = {}) =>
    correr(
      () =>
        actualizarCampana(campana.id, {
          nombre: borrador.nombre,
          desde: borrador.desde || null,
          hasta: borrador.hasta || null,
          peso: Number(borrador.peso) || 1,
          tope_impresiones:
            borrador.tope_impresiones === "" ? null : borrador.tope_impresiones,
          exclusiva: !!borrador.exclusiva,
          segmentos: borrador.segmentos ?? [],
          ...extra,
        }),
      // Cambiar el estado es lo único de esta pantalla que altera si la campaña sale
      // publicada o no, así que se dice en vez de un «guardada» que suena a nada.
      extra.estado
        ? `Campaña «${campana.nombre}» ahora está ${extra.estado}`
        : `Campaña «${campana.nombre}» guardada`,
    ).then(onCambio);

  const totales = (campana.creatividades ?? []).reduce(
    (acc, cr) => {
      const c = cifras?.[cr.id];
      return {
        impresiones: acc.impresiones + (c?.impresiones ?? 0),
        clics: acc.clics + (c?.clics ?? 0),
      };
    },
    { impresiones: 0, clics: 0 },
  );

  return (
    <li className="se-admin-pub__campana">
      <div className="se-admin-pub__campana-cabeza">
        <button
          type="button"
          className="se-admin-pub__campana-titulo"
          onClick={() => setAbierta(true)}
        >
          <span>{campana.nombre}</span>
          <span className="se-admin-pub__meta">
            {campana.creatividades?.length ?? 0} piezas
            {campana.desde || campana.hasta
              ? ` · ${campana.desde ?? "…"} → ${campana.hasta ?? "…"}`
              : " · sin fechas"}
            {totales.impresiones
              ? ` · ${totales.impresiones.toLocaleString("es")} impresiones, ${totales.clics} clics`
              : ""}
          </span>
        </button>
        <span
          className={`se-admin-pub__estado se-admin-pub__estado--${campana.estado}`}
        >
          {campana.estado}
        </span>
        <InterruptorAlAire campana={campana} ocupado={ocupado} correr={correr} onCambio={onCambio} />
      </div>

      {/* Los ajustes de la campana, en modal. La lista de piezas se queda fuera --
          debajo de esta fila-- porque es navegacion y no formulario: hay que verla para
          saber que falta, y meterla dentro obligaria a abrir el modal para mirarla. */}
      <ModalDelPanel
        abierto={abierta}
        ocupado={ocupado}
        onCerrar={() => setAbierta(false)}
        ancho="ancho"
        titulo={campana.nombre}
        subtitulo={anunciante?.nombre}
        pie={
          <>
            <select
              className="se-form-control"
              value={campana.estado}
              disabled={ocupado}
              onChange={(e) => guardar({ estado: e.target.value })}
              aria-label="Estado de la campana"
            >
              {(ajustes?.estados ?? []).map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() => setAbierta(false)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="se-btn se-btn--primary"
              disabled={ocupado}
              onClick={() => guardar()}
            >
              {ocupado ? "Guardando…" : "Guardar la campana"}
            </button>
          </>
        }
      >
        <div className="se-asis__cuerpo">
          <label className="se-form-label" htmlFor={`c-${campana.id}-nombre`}>
            Nombre
          </label>
          <input
            id={`c-${campana.id}-nombre`}
            className="se-form-control"
            value={borrador.nombre ?? ""}
            onChange={cambiar("nombre")}
          />

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-desde`}>
                Desde
              </label>
              <input
                id={`c-${campana.id}-desde`}
                type="date"
                className="se-form-control"
                value={borrador.desde ?? ""}
                onChange={cambiar("desde")}
              />
            </div>
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-hasta`}>
                Hasta
              </label>
              <input
                id={`c-${campana.id}-hasta`}
                type="date"
                className="se-form-control"
                value={borrador.hasta ?? ""}
                onChange={cambiar("hasta")}
              />
            </div>
          </div>

          <div className="se-admin-pub__doble">
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-peso`}>
                Peso (1–10)
              </label>
              <input
                id={`c-${campana.id}-peso`}
                type="number"
                min="1"
                max="10"
                className="se-form-control"
                value={borrador.peso ?? 5}
                onChange={cambiar("peso")}
              />
            </div>
            <div>
              <label className="se-form-label" htmlFor={`c-${campana.id}-tope`}>
                Tope de impresiones
              </label>
              <input
                id={`c-${campana.id}-tope`}
                inputMode="numeric"
                className="se-form-control"
                value={borrador.tope_impresiones ?? ""}
                onChange={cambiar("tope_impresiones")}
                placeholder="Sin tope"
              />
            </div>
          </div>
          <p className="se-admin-meta-hint">
            Con tope y fechas, el reparto se hace a lo largo del periodo: una campaña que
            va adelantada pesa la mitad, para que no se gaste el mes en tres días.
          </p>

          <label className="se-admin-pub__casilla">
            <input
              type="checkbox"
              checked={!!borrador.exclusiva}
              onChange={cambiar("exclusiva")}
            />
            Exclusiva — mientras encaje, nadie más entra en ese espacio
          </label>

          <h4 className="se-admin-pub__sub">Dónde sale</h4>
          <DondeSale
            valor={borrador.segmentos ?? []}
            onChange={(segmentos) => setBorrador((a) => ({ ...a, segmentos }))}
          />

          <div className="se-admin-pub__acciones">
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={async () => {
                const n = campana.creatividades?.length ?? 0;
                const vale = await preguntar({
                  title: `¿Borrar la campaña «${campana.nombre}»?`,
                  description:
                    n > 0
                      ? `Se van con ella sus ${n} ${n === 1 ? "pieza" : "piezas"}.`
                      : "No tiene piezas, así que no se pierde ningún arte.",
                  confirmLabel: "Borrar la campaña",
                  busyLabel: "Borrando…",
                  warning: "No se puede deshacer.",
                });
                if (!vale) return;
                correr(
                  () => borrarCampana(campana.id),
                  `Campaña «${campana.nombre}» borrada`,
                ).then(() => onCambio(null));
              }}
            >
              Borrar la campaña
            </button>
          </div>
        </div>
      </ModalDelPanel>

      <div className="se-admin-pub__campana-cuerpo">
          <h4 className="se-admin-pub__sub">Piezas</h4>
          {campana.creatividades?.length ? (
            <ul className="se-admin-pub__piezas">
              {campana.creatividades.map((pieza) => (
                <FilaDePieza
                  key={pieza.id}
                  pieza={pieza}
                  formatos={ajustes?.formatos}
                  anunciante={anunciante}
                  campana={campana}
                  ocupado={ocupado}
                  onGuardar={(datos) =>
                    correr(
                      async () => {
                        await actualizarPieza(pieza.id, datos);
                        return actualizarCampana(campana.id, {});
                      },
                      `${nombreDeFormato(datos.formato, ajustes?.formatos)} guardado`,
                    ).then(onCambio)
                  }
                  onBorrar={async () => {
                    const vale = await preguntar({
                      title: `¿Quitar ${nombreDeFormato(pieza.formato, ajustes?.formatos).toLowerCase()}?`,
                      description:
                        "Se borra la pieza. El arte se queda en Archivos, así que se puede volver a usar.",
                      confirmLabel: "Quitar la pieza",
                      busyLabel: "Quitando…",
                    });
                    if (!vale) return;
                    correr(
                      async () => {
                        await borrarPieza(pieza.id);
                        return actualizarCampana(campana.id, {});
                      },
                      `${nombreDeFormato(pieza.formato, ajustes?.formatos)} quitado`,
                    ).then(onCambio);
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="se-admin-meta-hint">
              Sin piezas. Una campaña sin ninguna pieza activa no se puede activar: no
              fallaría en ningún sitio, simplemente no saldría nunca.
            </p>
          )}

          <div className="se-admin-pub__nueva">
            <select
              className="se-form-control"
              value={formatoNuevo}
              onChange={(e) => setFormatoNuevo(e.target.value)}
              aria-label="Formato de la nueva pieza"
            >
              {Object.keys(ajustes?.formatos ?? {}).map((letra) => (
                <option key={letra} value={letra}>
                  {nombreDeFormato(letra, ajustes?.formatos)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="se-btn se-btn--secondary"
              disabled={ocupado}
              onClick={() =>
                correr(
                  async () => {
                    await crearPieza(campana.id, { formato: formatoNuevo });
                    return actualizarCampana(campana.id, {});
                  },
                  `${nombreDeFormato(formatoNuevo, ajustes?.formatos)} añadido, apagado — ábralo para ponerle el arte y encenderlo`,
                ).then(onCambio)
              }
            >
              Añadir pieza
            </button>
          </div>
      </div>
    </li>
  );
};

TarjetaDeCampana.propTypes = {
  campana: PropTypes.object.isRequired,
  /** Se pasa a cada pieza para la vista previa: la etiqueta lleva su marca. */
  anunciante: PropTypes.object,
  ajustes: PropTypes.object,
  cifras: PropTypes.object,
  ocupado: PropTypes.bool,
  correr: PropTypes.func.isRequired,
  /** Abre el diálogo del panel y resuelve a `true` si se confirmó. */
  preguntar: PropTypes.func.isRequired,
  onCambio: PropTypes.func.isRequired,
};
