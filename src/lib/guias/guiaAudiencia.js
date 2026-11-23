/**
 * La guía de «Audiencia» (`features/analitica/admin/AdminAnalitica.jsx`). Anclajes:
 * `[data-tour-audiencia="…"]`. Sus pasos viven con el panel, en
 * `features/analitica/guia.js`; aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_AUDIENCIA } from "../../features/analitica/guia.js";

export { PASOS_AUDIENCIA };

export const recorridoAudiencia = crearRecorrido("audiencia", PASOS_AUDIENCIA);

/** El atributo que marca un elemento como parada de la guía: `{...ancla("fichas")}`. */
export const ancla = (clave) => (clave ? { [recorridoAudiencia.atributo]: clave } : {});
