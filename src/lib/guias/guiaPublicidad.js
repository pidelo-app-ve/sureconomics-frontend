/**
 * La guía del panel «Publicidad» (`features/publicidad/admin/AdminPublicidad.jsx`).
 * Anclajes: `[data-tour-publicidad="…"]`. Sus pasos viven con el panel, en
 * `features/publicidad/guia.js`; aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_PUBLICIDAD } from "../../features/publicidad/guia.js";

export { PASOS_PUBLICIDAD };

export const recorridoPublicidad = crearRecorrido("publicidad", PASOS_PUBLICIDAD);
