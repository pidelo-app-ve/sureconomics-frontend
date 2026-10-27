import PropTypes from "prop-types";
import { useId, useMemo, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha, formatearNumero } from "../../i18n/motor";
import { porDolar } from "../../lib/monedas";
import { Flecha } from "./FichaDeMoneda";
import "./graficaDeMoneda.css";

/**
 * La gráfica de 30 días de una moneda: cuánto costó un dólar cada día, en una línea.
 * Dibujada en SVG propio, sin librerías, con las reglas de un gráfico de prensa:
 *
 * - una sola línea de 2 px y una sola escala, con tres guías tenues (mínimo, medio y
 *   máximo) rotuladas a la derecha, como en los diarios financieros;
 * - el último valor, rotulado al final de la línea;
 * - al pasar el ratón o el dedo, una guía vertical con la fecha y el valor de ese día;
 *   con el teclado, ← y →;
 * - la variación del periodo con flecha y signo, nunca solo con color;
 * - debajo, los datos en una tabla plegada, para quien no ve el gráfico.
 *
 * `compacta`: la versión de la apertura, más baja y sin tabla ni guías rotuladas.
 */
const ANCHO = 640;
const MARGEN = { arriba: 14, derecha: 76, abajo: 24, izquierda: 8 };

/** El rótulo del cursor se pega al borde que tenga cerca, para no salirse del dibujo. */
const anclaDe = (indice, total) => {
  if (indice === null) return "middle";
  const posicion = indice / Math.max(1, total - 1);
  if (posicion >= 0.7) return "end";
  if (posicion <= 0.3) return "start";
  return "middle";
};

const limpiar = (puntos) =>
  (puntos ?? [])
    .map((p) => ({ fecha: p.fecha, valor: Number(p.valor) }))
    .filter((p) => p.fecha && Number.isFinite(p.valor));

export const GraficaDeMoneda = ({ codigo, puntos, compacta = false }) => {
  const { t, lang } = useIdioma();
  const idTitulo = useId();
  const [activo, setActivo] = useState(null);
  const datos = useMemo(() => limpiar(puntos), [puntos]);
  const nombre = t(`monedas.nombres.${codigo}`);

  if (datos.length < 2) {
    return <p className="se-grafica__nota">{t("monedas.grafica.pocosDatos")}</p>;
  }

  const alto = compacta ? 150 : 250;
  const valores = datos.map((p) => p.valor);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const holgura = (maximo - minimo || Math.abs(maximo) * 0.01 || 1) * 0.08;
  const bajo = minimo - holgura;
  const alto2 = maximo + holgura;
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = alto - MARGEN.arriba - MARGEN.abajo;
  const x = (i) => MARGEN.izquierda + (i / (datos.length - 1)) * anchoUtil;
  const y = (v) => MARGEN.arriba + (1 - (v - bajo) / (alto2 - bajo)) * altoUtil;
  const trazo = datos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.valor).toFixed(1)}`).join(" ");
  const ultimo = datos[datos.length - 1];
  const primero = datos[0];
  const cambio = ((ultimo.valor - primero.valor) / primero.valor) * 100;
  const direccion = Math.abs(cambio) < 0.005 ? "flat" : cambio > 0 ? "up" : "down";
  const cambioTexto = `${cambio > 0 ? "+" : ""}${formatearNumero(cambio, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  const guias = compacta ? [] : [minimo, (minimo + maximo) / 2, maximo];
  const fechaCorta = (f) => formatearFecha(f, "diaMes", lang);

  const alMover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * ANCHO;
    const i = Math.round(((px - MARGEN.izquierda) / anchoUtil) * (datos.length - 1));
    setActivo(Math.max(0, Math.min(datos.length - 1, i)));
  };
  const alTeclado = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setActivo((a) => Math.max(0, Math.min(datos.length - 1, (a ?? datos.length - 1) + (e.key === "ArrowRight" ? 1 : -1))));
  };

  const p = activo === null ? null : datos[activo];
  const resumen = t("monedas.grafica.resumen", { desde: fechaCorta(primero.fecha), hasta: fechaCorta(ultimo.fecha), n: cambioTexto });
  const anclaCursor = anclaDe(activo, datos.length);

  return (
    <figure className={`se-grafica${compacta ? " se-grafica--compacta" : ""}`} aria-labelledby={idTitulo}>
      <figcaption id={idTitulo} className="se-grafica__titulo">
        <span>{t("monedas.grafica.titulo", { nombre })}</span>
        <span className={`se-grafica__var se-grafica__var--${direccion}`}>
          <Flecha direccion={direccion} />
          {t("monedas.grafica.variacion", { n: cambioTexto })}
        </span>
      </figcaption>
      <svg
        className="se-grafica__svg"
        viewBox={`0 0 ${ANCHO} ${alto}`}
        role="img"
        aria-label={resumen}
        tabIndex={0}
        onPointerMove={alMover}
        onPointerLeave={() => setActivo(null)}
        onKeyDown={alTeclado}
        onBlur={() => setActivo(null)}
      >
        {guias.map((v) => (
          <g key={v}>
            <line className="se-grafica__guia" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(v)} y2={y(v)} />
            <text className="se-grafica__rotulo" x={ANCHO - MARGEN.derecha + 8} y={y(v) + 4}>{porDolar(v, lang)}</text>
          </g>
        ))}
        <text className="se-grafica__rotulo" x={MARGEN.izquierda} y={alto - 6}>{fechaCorta(primero.fecha)}</text>
        <text className="se-grafica__rotulo" x={ANCHO - MARGEN.derecha} y={alto - 6} textAnchor="end">{fechaCorta(ultimo.fecha)}</text>
        <path className="se-grafica__linea" d={trazo} />
        <circle className="se-grafica__punto" cx={x(datos.length - 1)} cy={y(ultimo.valor)} r="3.5" />
        {compacta ? (
          <text className="se-grafica__ultimo" x={ANCHO - MARGEN.derecha + 8} y={y(ultimo.valor) + 4}>{porDolar(ultimo.valor, lang)}</text>
        ) : null}
        {p ? (
          <g className="se-grafica__cursor">
            <line x1={x(activo)} x2={x(activo)} y1={MARGEN.arriba} y2={alto - MARGEN.abajo} />
            <circle cx={x(activo)} cy={y(p.valor)} r="4" />
            <text x={x(activo)} y={MARGEN.arriba - 2} textAnchor={anclaCursor}>
              {fechaCorta(p.fecha)} · {porDolar(p.valor, lang)}
            </text>
          </g>
        ) : null}
      </svg>
      {compacta ? null : (
        <details className="se-grafica__datos">
          <summary>{t("monedas.grafica.datos")}</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">{t("monedas.grafica.colFecha")}</th>
                <th scope="col">{t("monedas.grafica.colValor")}</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d) => (
                <tr key={d.fecha}>
                  <td>{formatearFecha(d.fecha, "diaMes", lang)}</td>
                  <td>{porDolar(d.valor, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </figure>
  );
};

GraficaDeMoneda.propTypes = {
  codigo: PropTypes.string.isRequired,
  puntos: PropTypes.arrayOf(PropTypes.shape({ fecha: PropTypes.string, valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) })),
  compacta: PropTypes.bool,
};

export default GraficaDeMoneda;
