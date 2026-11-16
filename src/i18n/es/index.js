/**
 * El diccionario en español que viaja con el sitio: lo que usa lo que se carga siempre
 * (cabecera, pie, portada, pieza). Cada JSON trae sus propios apartados de primer nivel
 * (`nav`, `pie`, `portada`…) y aquí se juntan en uno.
 *
 * El resto va por zonas, un JSON por zona (`cuenta.json`, `educacion.json`,
 * `juegos.json`…), y se descarga con la página que lo usa (`diccionarios.js`).
 * `siempre.json` guarda las claves de esas zonas que usa lo que viaja con el sitio: el
 * aviso de cookies, la invitación al boletín, la columna de última hora, La Clave dentro
 * de una pieza… Su apartado sigue siendo el de la zona (`boletin.invitacion.*`): solo
 * cambia el archivo donde vive.
 *
 * `en/index.js` tiene los mismos archivos: `npm run i18n` comprueba que ninguna clave
 * falte en un lado, que cada una viva en el mismo archivo en los dos, y que lo que usa lo
 * que va siempre esté aquí.
 */
import comun from "./comun.json";
import portada from "./portada.json";
import piezas from "./piezas.json";
import publicidad from "./publicidad.json";
import siempre from "./siempre.json";

export default {
  ...comun,
  ...portada,
  ...piezas,
  ...publicidad,
  ...siempre,
};
