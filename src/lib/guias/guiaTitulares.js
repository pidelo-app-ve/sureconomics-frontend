/**
 * La guía del panel «Titulares» (`dominios/titulares/panel/paginas/AdminTitulares.jsx`).
 * Anclajes: `[data-tour-titulares="…"]`. Sus pasos viven con el panel, en
 * `dominios/titulares/guias/pasosDelPanel.js`; aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_TITULARES } from "../../dominios/titulares/guias/pasosDelPanel.js";

export { PASOS_TITULARES };

export const recorridoTitulares = crearRecorrido("titulares", PASOS_TITULARES);
