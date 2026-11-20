import { userPublicRequest } from "../../../lib/userApi";

/**
 * Los titulares en caliente: los redacta el backend cada 10 minutos a partir de lo que
 * trae el recolector (ver `services/titulares_web.py` en el backend). Sin sesión.
 *
 * - `getTitulares({ lang, version })`: la lista entera, ordenada. El servidor también
 *   sabe dar solo lo cambiado (`since`), pero la web ya no lo pide: `useHeadlines` pide la
 *   lista entera cada vez que cambia la versión.
 * - `getVersionTitulares()`: la consulta mínima de cada minuto.
 */
//
// La caché del navegador: el servidor manda `max-age=30, stale-while-revalidate=60`, y
// con eso la pregunta de cada minuto podía contestarse con una versión de hasta minuto y
// medio antes. En una emergencia («Ocultar sección») la pestaña no se enteraba. Por eso
// la versión se pregunta sin caché (`no-cache`: siempre al servidor, que la tiene en
// memoria), y la lista lleva la versión en la dirección (`v`): cada versión tiene su
// propia copia y nunca se sirve la de antes (revisión del 22-oct-2026, 3.6).
export const getTitulares = ({ lang, version } = {}) =>
  userPublicRequest("/headlines", { query: { lang, limit: 40, v: version } });

export const getVersionTitulares = () => userPublicRequest("/headlines/version", { cache: "no-cache" });
