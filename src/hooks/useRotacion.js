import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ROTACION_MS, prefiereQuieto } from "../lib/movimiento";

/**
 * Una lista que se muestra de a una y cambia sola: la apertura de la portada y la
 * tarjeta de Última hora.
 *
 * Se para con el ratón encima, con el foco dentro, con el botón de pausa y siempre si
 * el lector pidió menos movimiento. Ratón y foco van por separado: si compartieran un
 * estado, sacar el ratón reanudaría la rotación con el foco todavía dentro, y el
 * elemento enfocado desaparecería en el siguiente cambio.
 *
 * `saliente` es la pieza que se está yendo durante `salidaMs`, para pintar el cruce.
 * La lista se lee por referencia: cambia en cada render y, como dependencia,
 * reiniciaría el intervalo a mitad de camino.
 */
export const useRotacion = (lista, { activa = true, cadaMs = ROTACION_MS, salidaMs = 300 } = {}) => {
  const [quieto] = useState(prefiereQuieto);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [raton, setRaton] = useState(false);
  const [foco, setFoco] = useState(false);
  const [saliente, setSaliente] = useState(null);

  const rota = activa && !quieto && lista.length > 1;
  const parado = !rota || pausado || raton || foco;

  const listaRef = useRef(lista);
  listaRef.current = lista;
  const indiceRef = useRef(indice);
  indiceRef.current = indice;

  useEffect(() => {
    if (indice >= lista.length) setIndice(0);
  }, [indice, lista.length]);

  useEffect(() => {
    if (parado) return undefined;
    const id = setInterval(() => {
      const actual = listaRef.current;
      const i = Math.min(indiceRef.current, actual.length - 1);
      setSaliente(actual[i] ?? null);
      setIndice((i + 1) % actual.length);
    }, cadaMs);
    return () => clearInterval(id);
  }, [parado, lista.length, cadaMs]);

  useEffect(() => {
    if (!saliente) return undefined;
    const id = setTimeout(() => setSaliente(null), salidaMs);
    return () => clearTimeout(id);
  }, [saliente, salidaMs]);

  const alternarPausa = useCallback(() => setPausado((p) => !p), []);

  const eventos = useMemo(
    () => ({
      onMouseEnter: () => setRaton(true),
      onMouseLeave: () => setRaton(false),
      onFocus: () => setFoco(true),
      onBlur: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false);
      },
    }),
    []
  );

  return {
    indice: Math.min(indice, Math.max(0, lista.length - 1)),
    saliente,
    rota,
    parado,
    quieto,
    pausado,
    alternarPausa,
    eventos,
  };
};
