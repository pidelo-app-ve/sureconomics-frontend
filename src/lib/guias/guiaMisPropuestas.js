/**
 * Las guías de «Mis propuestas» en la cuenta del lector: la lista
 * (`features/cuenta/pages/CuentaEnviosList.jsx`, anclajes `[data-tour-mis-propuestas="…"]`) y una
 * propuesta (`features/cuenta/pages/CuentaEnvioDetail.jsx`, anclajes `[data-tour-mi-propuesta="…"]`).
 * Dos guías porque son dos páginas, cada una con su botón «Guía». La del formulario para
 * proponer o corregir una es `guiaPropuesta.js`; la de la redacción, que las revisa,
 * `guiaPropuestasDeLectores.js`. Textos en `cuenta.guias.misPropuestas.*` y
 * `cuenta.guias.miPropuesta.*`; los estados, en `cuenta.guias.estados.*`, los mismos en
 * las dos.
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guides/misPropuestas.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_MIS_PROPUESTAS, PASOS_MI_PROPUESTA } from "../../features/cuenta/guides/misPropuestas.js";

export { PASOS_MIS_PROPUESTAS, PASOS_MI_PROPUESTA };

export const recorridoMisPropuestas = crearRecorrido("mis-propuestas", PASOS_MIS_PROPUESTAS, { traducir: true });

export const recorridoMiPropuesta = crearRecorrido("mi-propuesta", PASOS_MI_PROPUESTA, { traducir: true });
