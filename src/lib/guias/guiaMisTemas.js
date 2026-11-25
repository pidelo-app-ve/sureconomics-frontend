/**
 * La guía de «Mis temas» (`features/cuenta/pages/CuentaTemas.jsx`). Anclajes:
 * `[data-tour-mis-temas="…"]`. Textos en `cuenta.guias.misTemas.*`. El nombre no es
 * «temas»: ese es el de la guía de Temas del panel (`guiaTemas.js`).
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guides/misTemas.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_MIS_TEMAS } from "../../features/cuenta/guides/misTemas.js";

export { PASOS_MIS_TEMAS };

export const recorridoMisTemas = crearRecorrido("mis-temas", PASOS_MIS_TEMAS, { traducir: true });
