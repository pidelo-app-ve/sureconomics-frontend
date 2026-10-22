/**
 * Qué hace la página «Última hora» cuando cambia la lista de titulares.
 *
 * La página enseña los seis más recientes (pedido de la redacción, 22-oct-2026): uno
 * nuevo entra arriba y el más antiguo sale. Pero un lector a mitad de la lista no puede
 * ver cómo el texto se le mueve debajo (revisión del 22-oct-2026, 3.2). Así que:
 *
 * - Si lo que cambia queda por debajo de lo que ya se ve (se borró uno y entra el
 *   siguiente por el final), se pone: no mueve nada.
 * - Si el lector está al principio de la lista, se pone: lo nuevo entra arriba.
 * - Si bajó leyendo y hay titulares nuevos, espera tras el botón «Ver N titulares
 *   nuevos»; y si solo cambió el orden (un titular fijado arriba), espera a que suba.
 *
 * Funciones puras, con ids: `npm run test:ultimahora`.
 */

const iguales = (a, b) => a.length === b.length && a.every((x, k) => x === b[k]);

/**
 * Los ids de `objetivo` que no se ven y entrarían por encima de alguno que sí se ve.
 * Uno que entra por el final, detrás de todos, no es nuevo: es el séptimo que sube
 * cuando se borra uno.
 */
export const nuevosEn = (enPantalla, objetivo) => {
  const ultimoVisto = Math.max(-1, ...enPantalla.map((id) => objetivo.indexOf(id)));
  return objetivo.filter((id, k) => !enPantalla.includes(id) && k < ultimoVisto);
};

/**
 * @param {{ enPantalla: number[], objetivo: number[], arriba: boolean }} estado
 * @returns {"nada" | "poner" | "boton" | "esperar"}
 */
export const queHacer = ({ enPantalla, objetivo, arriba }) => {
  if (iguales(enPantalla, objetivo)) return "nada";
  if (iguales(objetivo.slice(0, enPantalla.length), enPantalla)) return "poner";
  if (arriba) return "poner";
  return nuevosEn(enPantalla, objetivo).length ? "boton" : "esperar";
};
