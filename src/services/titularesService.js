import { userPublicRequest } from "../lib/userApi";

/**
 * Los titulares en caliente: los redacta el backend cada 10 minutos a partir de lo que
 * trae el recolector (ver `services/titulares_web.py` en el backend). Sin sesión.
 *
 * - `getTitulares({ lang })`: la lista, ordenada.
 * - `getTitulares({ lang, since })`: solo lo que cambió desde esa versión, y en
 *   `removed_ids` lo que hay que quitar. La web ya no lo usa (`useHeadlines` pide la
 *   lista entera al cambiar la versión); queda para otros clientes. Si la respuesta trae
 *   `reset`, la lista está entera y hay que reemplazar, no mezclar.
 * - `getVersionTitulares()`: la consulta mínima de cada minuto.
 */
//
// La caché del navegador: el servidor manda `max-age=30, stale-while-revalidate=60`, y
// con eso la pregunta de cada minuto podía contestarse con una versión de hasta minuto y
// medio antes. En una emergencia («Ocultar sección») la pestaña no se enteraba. Por eso
// la versión se pregunta sin caché (`no-cache`: siempre al servidor, que la tiene en
// memoria), y la lista lleva la versión en la dirección (`v`): cada versión tiene su
// propia copia y nunca se sirve la de antes (revisión del 22-oct-2026, 3.6).
export const getTitulares = ({ lang, since, version } = {}) =>
  userPublicRequest("/headlines", { query: { lang, since, limit: 40, v: version } });

export const getVersionTitulares = () => userPublicRequest("/headlines/version", { cache: "no-cache" });
