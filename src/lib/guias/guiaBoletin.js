/**
 * La guía de «Entorno en Viñetas» (`features/boletin/admin/AdminBoletin.jsx`). Anclajes:
 * `[data-tour-boletin="…"]`. Sus pasos viven con el panel, en `features/boletin/guia.js`;
 * aquí se arma la guía con ellos. La lista de suscriptores tiene la suya
 * (`guiaSuscriptores.js`): son dos páginas.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_BOLETIN } from "../../features/boletin/guia.js";

export { PASOS_BOLETIN };

export const recorridoBoletin = crearRecorrido("boletin", PASOS_BOLETIN);
