/**
 * La guía de «Suscriptores del boletín» (`features/boletin/admin/AdminNewsletterList.jsx`).
 * Anclajes: `[data-tour-suscriptores="…"]`. Sus pasos viven con el panel, en
 * `features/boletin/guia.js`; aquí se arma la guía con ellos. Los números del boletín
 * tienen la suya (`guiaBoletin.js`): son dos páginas.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_SUSCRIPTORES } from "../../features/boletin/guia.js";

export { PASOS_SUSCRIPTORES };

export const recorridoSuscriptores = crearRecorrido("suscriptores", PASOS_SUSCRIPTORES);
