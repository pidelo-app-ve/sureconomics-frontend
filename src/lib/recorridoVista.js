/**
 * La guía paso a paso de UNA página: el botón «Guía» oscurece la pantalla, ilumina cada
 * elemento de verdad (un botón, una tabla, un interruptor) y explica en una tarjeta qué
 * es y para qué sirve. La superposición es `components/recorrido/RecorridoVista.jsx`.
 *
 * Es el mismo mecanismo que las guías de pidelo (`utils/recorridoVista.ts`): **el paso
 * vive en localStorage y no en React**, y un evento propio avisa a la superposición
 * cuando cambia. Así la guía sobrevive a una recarga a mitad de camino, y cada página
 * tiene su clave, su evento y su atributo de anclaje (`data-tour-<nombre>`): dos guías
 * no se pisan.
 *
 * Un paso es `{ clave?, titulo, texto?, puntos? }`:
 * - `clave`: el elemento a iluminar, `[data-tour-<nombre>="<clave>"]`. Sin clave (o si
 *   el elemento no está en pantalla) se oscurece todo y el texto vale por sí mismo.
 * - `puntos`: «Nombre: qué es», el nombre sale en negrita.
 *
 * Por convención el primer paso no lleva clave (qué hay en la página) y el último se
 * ancla al propio botón «Guía» («vuelve aquí cuando quieras»).
 */

const leer = (clave) => {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
};

const escribir = (clave, valor) => {
  try {
    if (valor === null) window.localStorage.removeItem(clave);
    else window.localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento (modo privado) la guía funciona igual dentro de la página:
    // solo se pierde el paso al recargar.
  }
};

export const crearRecorrido = (nombre, pasos) => {
  const CLAVE = `sureconomics_recorrido_${nombre}`;
  const EVENTO = `sureconomics:recorrido-${nombre}`;

  const pasoActivo = () => {
    const crudo = leer(CLAVE);
    if (crudo === null || crudo === "") return null;
    const n = Number(crudo);
    return Number.isInteger(n) && n >= 0 && n < pasos.length ? n : null;
  };

  const irAPaso = (n) => {
    escribir(CLAVE, n === null ? null : String(n));
    window.dispatchEvent(new Event(EVENTO));
  };

  return {
    pasos,
    atributo: `data-tour-${nombre}`,
    pasoActivo,
    definicionActual: () => {
      const n = pasoActivo();
      return n === null ? null : pasos[n] ?? null;
    },
    irAPaso,
    iniciar: () => irAPaso(0),
    suscribir: (alCambiar) => {
      window.addEventListener(EVENTO, alCambiar);
      return () => window.removeEventListener(EVENTO, alCambiar);
    },
  };
};
