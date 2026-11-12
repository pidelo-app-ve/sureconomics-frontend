import PropTypes from "prop-types";
import { nombreDelMes, numero, rango } from "../../../lib/audiencia";
import { Bloque, Ficha, Tabla } from "./Piezas";

/**
 * Lo que lleva el mes en curso y en cuánto cerraría a este ritmo.
 *
 * La proyección la hace el servidor (`analitica_calculos.proyeccion`): tiene en
 * cuenta que no entra lo mismo un lunes que un domingo, y da un mínimo y un máximo
 * además de lo más probable. Aquí solo se dibuja.
 *
 * El dibujo es una sola pista con tres cosas sobre la misma escala -- lo hecho, el
 * tramo donde puede cerrar y lo más probable --, porque la pregunta es una: «¿a cuánto
 * llegamos?». Tres barras separadas obligarían a compararlas de cabeza.
 *
 * Es del **mes en curso**, no del periodo elegido arriba, y lo dice. Y no aparece hasta
 * que hay dos semanas medidas: proyectar un mes con cuatro días es adivinar.
 */
export const ComoVaElMes = ({ datos }) => {
  const p = datos;
  const mes = p ? nombreDelMes(p.mes) : "";
  const techo = p ? Math.max(1, p.maximo, p.estimado, p.llevamos) : 1;
  const parte = (n) => `${Math.min(100, Math.max(0, (n / techo) * 100))}%`;
  // Sin una sola visita en las semanas de base no hay ritmo que proyectar: un «≈ 0» con
  // su barra vacía se leería como un dato.
  const sinRitmo = Boolean(p) && !p.estimado && !p.llevamos;

  return (
    <Bloque
      titulo="Cómo va el mes"
      apunte="Las visitas del mes en curso y en cuánto cerraría si sigue a este ritmo. No cambia con el periodo elegido arriba."
      parada="mes"
      vacio={!p || sinRitmo}
      sinDatos={
        sinRitmo
          ? "No hubo visitas medidas en las últimas semanas: no hay ritmo con que proyectar el mes."
          : "Hacen falta al menos dos semanas de medición para proyectar el mes."
      }
      tabla={
        p ? (
          <Tabla
            columnas={["Dato", "Valor"]}
            filas={[
              [`Visitas en ${mes}, hasta hoy`, numero(p.llevamos)],
              ["Día del mes", `${p.dia} de ${p.dias_del_mes}`],
              ["Cierre más probable", numero(p.estimado)],
              ["Cierre, mínimo", numero(p.minimo)],
              ["Cierre, máximo", numero(p.maximo)],
              ["Visitas al día", numero(p.media_diaria)],
              ["Días usados para calcularlo", numero(p.dias_de_base)],
            ]}
          />
        ) : null
      }
    >
      {p ? (
        <>
          <div className="se-aud__fichas">
            <Ficha
              valor={numero(p.llevamos)}
              etiqueta={`visitas en ${mes}`}
              nota={`día ${p.dia} de ${p.dias_del_mes}`}
            />
            <Ficha
              valor={`≈ ${numero(p.estimado)}`}
              etiqueta="al cierre, a este ritmo"
              nota={rango(p.minimo, p.maximo)}
            />
            <Ficha
              valor={numero(p.media_diaria)}
              etiqueta="visitas al día"
              nota={`sobre los últimos ${p.dias_de_base} días`}
            />
          </div>

          <div
            className="se-aud__meta"
            role="img"
            aria-label={`${mes}: lleva ${numero(p.llevamos)} visitas. A este ritmo cerraría en unas ${numero(
              p.estimado,
            )}, ${rango(p.minimo, p.maximo)}.`}
          >
            <span
              className="se-aud__meta-rango"
              style={{ left: parte(p.minimo), width: parte(p.maximo - p.minimo) }}
            />
            <span className="se-aud__meta-hecho" style={{ width: parte(p.llevamos) }} />
            <span className="se-aud__meta-punto" style={{ left: parte(p.estimado) }} />
          </div>
          {/* La leyenda repite con palabras lo que el `aria-label` de la pista ya dice. */}
          <ul className="se-aud__leyenda" aria-hidden="true">
            <li>
              <i /> lo que lleva
            </li>
            <li>
              <i data-de="rango" /> dónde puede cerrar
            </li>
            <li>
              <i data-de="punto" /> lo más probable
            </li>
          </ul>
        </>
      ) : null}
    </Bloque>
  );
};

ComoVaElMes.propTypes = {
  // `null` hasta que hay dos semanas medidas.
  datos: PropTypes.object,
};
