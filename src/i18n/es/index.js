/**
 * El diccionario en español, por zonas. Cada JSON trae sus propios apartados de primer
 * nivel (`nav`, `pie`, `portada`…) y aquí se juntan en uno. `en/index.js` tiene los
 * mismos archivos: `npm run i18n` comprueba que ninguna clave falte en un lado.
 */
import comun from "./comun.json";
import portada from "./portada.json";
import piezas from "./piezas.json";
import listados from "./listados.json";
import cuenta from "./cuenta.json";
import boletin from "./boletin.json";
import educacion from "./educacion.json";
import juegos from "./juegos.json";
import paginas from "./paginas.json";
import publicidad from "./publicidad.json";

export default {
  ...comun,
  ...portada,
  ...piezas,
  ...listados,
  ...cuenta,
  ...boletin,
  ...educacion,
  ...juegos,
  ...paginas,
  ...publicidad,
};
