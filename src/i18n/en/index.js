/** El diccionario en inglés: los mismos archivos que `es/index.js`. Se descarga solo en `/en`. */
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
