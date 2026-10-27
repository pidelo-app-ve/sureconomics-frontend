import { useEffect, useState } from "react";
import { getHistoriaMoneda, getMonedas } from "../services/monedasService";

/**
 * Las cotizaciones, pedidas una vez por visita y compartidas: la primera plana, el
 * lateral de la pieza, la ficha junto al titular y la gráfica de la apertura leen lo
 * mismo. El servidor cambia una vez por hora, así que lo de esta visita vale.
 */
let cotizaciones = null;
const historias = new Map();

const pedirCotizaciones = () => {
  cotizaciones = cotizaciones ?? getMonedas().catch(() => ({ monedas: [] }));
  return cotizaciones;
};

const pedirHistoria = (codigo) => {
  if (!historias.has(codigo)) historias.set(codigo, getHistoriaMoneda(codigo, 30).catch(() => ({ puntos: [] })));
  return historias.get(codigo);
};

/** `{ VES: {...}, MXN: {...} }` con el dato vigente de cada una; `null` mientras llega. */
export const useCotizaciones = () => {
  const [mapa, setMapa] = useState(null);
  useEffect(() => {
    let vivo = true;
    pedirCotizaciones().then((d) => {
      if (vivo) setMapa(Object.fromEntries((d?.monedas ?? []).map((m) => [m.codigo, m])));
    });
    return () => {
      vivo = false;
    };
  }, []);
  return mapa;
};

/**
 * Las `cuantas` con dato vigente que más se movieron hoy: las de mayor variación
 * primero; las fijas, al final. Es lo que enseñan la primera plana y el lateral.
 */
export const useMonedas = (cuantas = 6) => {
  const todas = useCotizaciones();
  if (!todas) return [];
  const peso = (m) => (m.fija || typeof m.variacion !== "number" ? -1 : Math.abs(m.variacion));
  return Object.values(todas)
    .filter((m) => m.valor !== null && !m.vieja)
    .sort((a, b) => peso(b) - peso(a))
    .slice(0, cuantas);
};

/** Los puntos de los últimos 30 días de una moneda; `null` mientras llegan. */
export const useHistoriaMoneda = (codigo) => {
  const [puntos, setPuntos] = useState(null);
  useEffect(() => {
    if (!codigo) return undefined;
    let vivo = true;
    setPuntos(null);
    pedirHistoria(codigo).then((d) => {
      if (vivo) setPuntos(d?.puntos ?? []);
    });
    return () => {
      vivo = false;
    };
  }, [codigo]);
  return codigo ? puntos : null;
};
