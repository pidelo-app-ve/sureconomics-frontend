/**
 * Lo puro que comparten las listas del panel (Titulares, Resumen, Usuarios, Suscriptores,
 * Avisos, Archivos…): la línea «Página X de Y — N en total», un trozo de una lista que se
 * pagina en el navegador, lo escrito en un buscador ya limpio, la espera del buscador y el
 * día de hoy en Caracas. Con su prueba al lado (`listasDelPanel.test.mjs`).
 *
 * Lo que va con React está en `hooks/useBuscadorConEspera.js`,
 * `hooks/useListaDelServidor.js` y `components/admin/PaginasDeLaLista.jsx`.
 */

/** Cuánto espera un buscador del panel a que se deje de escribir antes de pedir. */
export const ESPERA_DEL_BUSCADOR_MS = 250;

/** «  tasa   Selic » → «tasa Selic»: los espacios de más no cuentan. */
export const limpiarBusqueda = (texto) => String(texto ?? "").trim().replace(/\s+/g, " ");

/** «Página 2 de 5 — 87 en total», como en Contenido. Nunca «de 0». */
export const lineaDePaginas = ({ pagina, paginas, total }) =>
  `Página ${pagina || 1} de ${Math.max(1, paginas || 0)} — ${total || 0} en total`;

/** Un trozo de la lista: la página `pagina` (que se ajusta si ya no existe) y cuántas hay. */
export const trozoDeLista = (lista, pagina, porPagina) => {
  const paginas = Math.max(1, Math.ceil((lista?.length ?? 0) / porPagina));
  const actual = Math.min(Math.max(1, Number(pagina) || 1), paginas);
  return { pagina: actual, paginas, filas: (lista ?? []).slice((actual - 1) * porPagina, actual * porPagina) };
};

/** El día de hoy en Caracas (UTC-4, sin horario de verano), como AAAA-MM-DD. */
export const hoyEnCaracas = (ahora = new Date()) => new Date(ahora.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10);

/**
 * La página que hay que pedir cuando el servidor dice que la pedida ya no existe (una
 * lista que se quedó corta: se borró algo, o se pegó un enlace viejo): la última. `null`
 * si la pedida vale. Para las rutas que no la ajustan solas (`meta.pages` de las viejas).
 */
export const paginaQueExiste = (pedida, paginas) => (paginas > 0 && pedida > paginas ? paginas : null);
