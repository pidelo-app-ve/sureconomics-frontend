/** El inglés de lo que va siempre: los mismos archivos que `es/index.js`. Se descarga solo en `/en`; las zonas, con su página. */
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
