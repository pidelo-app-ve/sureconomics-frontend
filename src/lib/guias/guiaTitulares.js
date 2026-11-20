/**
 * La guía del panel «Titulares» (`features/titulares/admin/pages/AdminTitulares.jsx`).
 * Anclajes: `[data-tour-titulares="…"]`. Sus pasos viven con el panel, en
 * `features/titulares/guides/pasosDelPanel.js`; aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_TITULARES } from "../../features/titulares/guides/pasosDelPanel.js";

export { PASOS_TITULARES };

export const recorridoTitulares = crearRecorrido("titulares", PASOS_TITULARES);
