import PropTypes from "prop-types";
import { useId, useMemo, useState } from "react";
import { useIdioma } from "../../i18n/ProveedorIdioma";
import { formatearFecha, formatearNumero } from "../../i18n/motor";
import { porDolar } from "../../lib/monedas";
import { Flecha } from "./FichaDeMoneda";
import "./graficaDeMoneda.css";

/**
 * La gráfica de una moneda: cuánto costó un dólar cada día. Con `comparar`, dos monedas
 * a la vez, y entonces no en su valor sino en **variación % frente al dólar desde el
 * primer día que tienen las dos**: el bolívar va por cientos y el peso por decenas, y en
 * una misma escala una de las dos sería una raya plana.
 *
 * Dibujada en SVG propio, sin librerías, con las reglas de un gráfico de prensa:
 *
 * - líneas de 2 px y una sola escala, con tres guías tenues (mínimo, medio y máximo)
 *   rotuladas a la derecha;
 * - el eje horizontal es el calendario: cada banco publica en sus días hábiles, y dos
 *   monedas no tienen los mismos días;
 * - cada línea con su color y su nombre al final (azul petróleo la que se abrió, rojo de
 *   la marca la comparada: se distinguen también con daltonismo, ΔE ≥ 14 en OKLab);
 * - al pasar el ratón o el dedo, una guía vertical con la fecha y los valores; con el
 *   teclado, ← y →;
 * - la variación del periodo con flecha y signo, nunca solo con color;
 * - debajo, los datos en una tabla plegada, para quien no ve el gráfico.
 *
 * `compacta`: la versión de la apertura, más baja y sin tabla ni guías rotuladas.
 */
const ANCHO = 640;
const MARGEN = { arriba: 16, derecha: 88, abajo: 24, izquierda: 8 };
const SEPARACION_ROTULOS = 13;

/** El rótulo del cursor se pega al borde que tenga cerca, para no salirse del dibujo. */
const anclaDe = (posicion) => {
  if (posicion === null) return "middle";
  if (posicion >= 0.7) return "end";
  if (posicion <= 0.3) return "start";
  return "middle";
};

const limpiar = (puntos) =>
  (puntos ?? [])
    .map((p) => ({ fecha: p.fecha, valor: Number(p.valor), t: Date.parse(p.fecha) }))
    .filter((p) => p.fecha && Number.isFinite(p.valor) && Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);

/** El último punto de la serie en esa fecha o antes (el banco no publicó ese día). */
const valorEn = (serie, t) => {
  let hallado = null;
  for (const p of serie) {
    if (p.t > t) break;
    hallado = p;
  }
  return hallado;
};

const signo = (n, lang) =>
  `${n > 0 ? "+" : ""}${formatearNumero(n, lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

const direccionDe = (n) => (Math.abs(n) < 0.005 ? "flat" : n > 0 ? "up" : "down");

/** Separa los rótulos finales que caerían uno encima de otro. */
const sinChoques = (ys) => {
  if (ys.length < 2 || Math.abs(ys[0] - ys[1]) >= SEPARACION_ROTULOS) return ys;
  const medio = (ys[0] + ys[1]) / 2;
  const arriba = ys[0] <= ys[1] ? 0 : 1;
  const salida = [...ys];
  salida[arriba] = medio - SEPARACION_ROTULOS / 2;
  salida[1 - arriba] = medio + SEPARACION_ROTULOS / 2;
  return salida;
};

export const GraficaDeMoneda = ({ codigo, puntos, compacta = false, comparar = null, puntosComparar = null }) => {
  const { t, lang } = useIdioma();
  const idTitulo = useId();
  const [activo, setActivo] = useState(null);
  const principal = useMemo(() => limpiar(puntos), [puntos]);
  const otra = useMemo(() => limpiar(puntosComparar), [puntosComparar]);
  const comparando = Boolean(comparar) && otra.length >= 2 && principal.length >= 2;

  // Las series que se dibujan. Comparando, cada una desde el primer día que tienen las
  // dos y en % sobre su valor de ese día.
  const series = useMemo(() => {
    const base = [{ codigo, puntos: principal, clase: "a" }];
    if (!comparando) return base.map((s) => ({ ...s, y: s.puntos.map((p) => p.valor) }));
    const desde = Math.max(principal[0].t, otra[0].t);
    return [...base, { codigo: comparar, puntos: otra, clase: "b" }].map((s) => {
      const tramo = s.puntos.filter((p) => p.t >= desde);
      const inicial = tramo[0]?.valor;
      return { ...s, puntos: tramo, y: tramo.map((p) => (p.valor / inicial - 1) * 100) };
    });
  }, [codigo, comparar, comparando, principal, otra]);

  const corta = (s) => 2 > s.puntos.length;
  const faltanDatos = 2 > principal.length || series.some(corta);
  if (faltanDatos) {
    return <p className="se-grafica__nota">{t("monedas.grafica.pocosDatos")}</p>;
  }

  const nombreDe = (c) => t(`monedas.nombres.${c}`);
  const formato = (v) => (comparando ? signo(v, lang) : porDolar(v, lang));
  const fechaCorta = (f) => formatearFecha(f, "diaMes", lang);

  const alto = compacta ? 150 : 250;
  const todos = series.flatMap((s) => s.y);
  const minimo = Math.min(...todos);
  const maximo = Math.max(...todos);
  const holgura = (maximo - minimo || Math.abs(maximo) * 0.01 || 1) * 0.08;
  const bajo = minimo - holgura;
  const techo = maximo + holgura;
  const tInicio = Math.min(...series.map((s) => s.puntos[0].t));
  const tFin = Math.max(...series.map((s) => s.puntos[s.puntos.length - 1].t));
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
  const altoUtil = alto - MARGEN.arriba - MARGEN.abajo;
  const x = (tt) => MARGEN.izquierda + ((tt - tInicio) / Math.max(1, tFin - tInicio)) * anchoUtil;
  const y = (v) => MARGEN.arriba + (1 - (v - bajo) / (techo - bajo)) * altoUtil;
  const trazo = (s) => s.puntos.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(s.y[i]).toFixed(1)}`).join(" ");

  // La variación del periodo de cada serie, para la cabecera.
  const variaciones = series.map((s) => {
    const n = s.puntos.length - 1;
    const cambio = comparando ? s.y[n] : ((s.puntos[n].valor - s.puntos[0].valor) / s.puntos[0].valor) * 100;
    return { ...s, cambio, direccion: direccionDe(cambio) };
  });

  // Los días que se pueden señalar: todos los de cualquiera de las series.
  const dias = [...new Set(series.flatMap((s) => s.puntos.map((p) => p.t)))].sort((a, b) => a - b);
  const alMover = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * ANCHO;
    const tt = tInicio + ((px - MARGEN.izquierda) / anchoUtil) * (tFin - tInicio);
    let cerca = 0;
    dias.forEach((d, i) => {
      if (Math.abs(d - tt) < Math.abs(dias[cerca] - tt)) cerca = i;
    });
    setActivo(cerca);
  };
  const alTeclado = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setActivo((a) => Math.max(0, Math.min(dias.length - 1, (a ?? dias.length - 1) + (e.key === "ArrowRight" ? 1 : -1))));
  };

  const tActivo = activo === null ? null : dias[activo];
  const enCursor = tActivo === null ? [] : series.map((s) => {
    const p = valorEn(s.puntos, tActivo);
    return p ? { ...s, p, v: s.y[s.puntos.indexOf(p)] } : null;
  }).filter(Boolean);
  const fechaCursor = tActivo === null ? null : new Date(tActivo).toISOString().slice(0, 10);
  const anclaCursor = anclaDe(tActivo === null ? null : (tActivo - tInicio) / Math.max(1, tFin - tInicio));

  const guias = compacta ? [] : [minimo, (minimo + maximo) / 2, maximo];
  const primeraFecha = new Date(tInicio).toISOString().slice(0, 10);
  const ultimaFecha = new Date(tFin).toISOString().slice(0, 10);
  const finales = sinChoques(series.map((s) => y(s.y[s.y.length - 1])));
  const resumen = comparando
    ? t("monedas.grafica.resumenComparar", {
      desde: fechaCorta(primeraFecha), hasta: fechaCorta(ultimaFecha),
      a: nombreDe(codigo), na: signo(variaciones[0].cambio, lang),
      b: nombreDe(comparar), nb: signo(variaciones[1].cambio, lang),
    })
    : t("monedas.grafica.resumen", { desde: fechaCorta(primeraFecha), hasta: fechaCorta(ultimaFecha), n: signo(variaciones[0].cambio, lang) });

  return (
    <figure className={`se-grafica${compacta ? " se-grafica--compacta" : ""}`} aria-labelledby={idTitulo}>
      <figcaption id={idTitulo} className="se-grafica__titulo">
        {comparando ? (
          <span>{t("monedas.grafica.tituloComparar", { desde: fechaCorta(primeraFecha) })}</span>
        ) : (
          <span>{t("monedas.grafica.titulo", { nombre: nombreDe(codigo) })}</span>
        )}
        <span className="se-grafica__leyenda">
          {variaciones.map((v) => (
            <span key={v.codigo} className={`se-grafica__serie se-grafica__serie--${v.clase}`}>
              {comparando ? <span className="se-grafica__muestra" aria-hidden="true" /> : null}
              {comparando ? <span className="se-grafica__nombre">{nombreDe(v.codigo)}</span> : null}
              <span className={`se-grafica__var se-grafica__var--${v.direccion}`}>
                <Flecha direccion={v.direccion} />
                {comparando ? signo(v.cambio, lang) : t("monedas.grafica.variacion", { n: signo(v.cambio, lang) })}
              </span>
            </span>
          ))}
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
            {comparando ? null : (
              <text className="se-grafica__rotulo" x={ANCHO - MARGEN.derecha + 8} y={y(v) + 4}>{formato(v)}</text>
            )}
          </g>
        ))}
        {comparando && bajo < 0 && techo > 0 ? (
          <line className="se-grafica__cero" x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(0)} y2={y(0)} />
        ) : null}
        <text className="se-grafica__rotulo" x={MARGEN.izquierda} y={alto - 6}>{fechaCorta(primeraFecha)}</text>
        <text className="se-grafica__rotulo" x={ANCHO - MARGEN.derecha} y={alto - 6} textAnchor="end">{fechaCorta(ultimaFecha)}</text>
        {series.map((s, k) => {
          const ultimo = s.puntos[s.puntos.length - 1];
          return (
            <g key={s.codigo} className={`se-grafica__serie--${s.clase}`}>
              <path className="se-grafica__linea" d={trazo(s)} />
              <circle className="se-grafica__punto" cx={x(ultimo.t)} cy={y(s.y[s.y.length - 1])} r="3.5" />
              {comparando ? (
                <text className="se-grafica__final" x={ANCHO - MARGEN.derecha + 8} y={finales[k] + 4}>
                  {s.codigo} {formato(s.y[s.y.length - 1])}
                </text>
              ) : null}
              {!comparando && compacta ? (
                <text className="se-grafica__ultimo" x={ANCHO - MARGEN.derecha + 8} y={finales[k] + 4}>{formato(ultimo.valor)}</text>
              ) : null}
            </g>
          );
        })}
        {enCursor.length ? (
          <g className="se-grafica__cursor">
            <line x1={x(tActivo)} x2={x(tActivo)} y1={MARGEN.arriba} y2={alto - MARGEN.abajo} />
            {enCursor.map((c) => (
              <circle key={c.codigo} className={`se-grafica__serie--${c.clase}`} cx={x(c.p.t)} cy={y(c.v)} r="4" />
            ))}
            <text x={x(tActivo)} y={MARGEN.arriba - 4} textAnchor={anclaCursor}>
              {fechaCorta(fechaCursor)}
              {enCursor.map((c) => ` · ${comparando ? `${c.codigo} ` : ""}${formato(c.v)}`).join("")}
            </text>
          </g>
        ) : null}
      </svg>
      {comparando && !compacta ? <p className="se-grafica__nota">{t("monedas.grafica.lectura")}</p> : null}
      {compacta ? null : (
        <details className="se-grafica__datos">
          <summary>{t("monedas.grafica.datos")}</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">{t("monedas.grafica.colFecha")}</th>
                {series.map((s) => (
                  <th key={s.codigo} scope="col">
                    {comparando ? t("monedas.grafica.colMoneda", { codigo: s.codigo }) : t("monedas.grafica.colValor")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => {
                const fecha = new Date(d).toISOString().slice(0, 10);
                return (
                  <tr key={d}>
                    <td>{formatearFecha(fecha, "diaMes", lang)}</td>
                    {series.map((s) => {
                      const p = s.puntos.find((q) => q.t === d);
                      return <td key={s.codigo}>{p ? porDolar(p.valor, lang) : "—"}</td>;
                    })}
                  </tr>
                );
              })}
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
  /** El código de la moneda con la que se compara; las dos van en % desde el mismo día. */
  comparar: PropTypes.string,
  puntosComparar: PropTypes.arrayOf(PropTypes.shape({ fecha: PropTypes.string, valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) })),
};

export default GraficaDeMoneda;
