import { userPublicRequest } from "../lib/userApi";

/**
 * Los titulares en caliente: los redacta el backend cada 10 minutos a partir de lo que
 * trae el recolector (ver `services/titulares_web.py` en el backend). Sin sesión.
 *
 * - `getTitulares({ lang })`: la lista, ordenada.
 * - `getTitulares({ lang, since })`: solo lo que cambió desde esa versión, y en
 *   `removed_ids` lo que hay que quitar (borrado por la redacción o caducado).
 * - `getVersionTitulares()`: la consulta mínima de cada minuto.
 */
export const getTitulares = ({ lang, since } = {}) =>
  userPublicRequest("/headlines", { query: { lang, since, limit: 40 } });

export const getVersionTitulares = () => userPublicRequest("/headlines/version");
