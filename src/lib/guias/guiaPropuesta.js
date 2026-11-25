/**
 * La guía de «Proponer una pieza» y de su edición (`features/cuenta/components/SubmissionForm.jsx`).
 * Anclajes: `[data-tour-propuesta="…"]`. Textos en `cuenta.guias.propuesta.*`.
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guides/propuesta.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_PROPUESTA } from "../../features/cuenta/guides/propuesta.js";

export { PASOS_PROPUESTA };

export const recorridoPropuesta = crearRecorrido("propuesta", PASOS_PROPUESTA, { traducir: true });
