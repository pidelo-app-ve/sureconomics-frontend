/**
 * La guía de «Marcadores», las piezas guardadas (`features/cuenta/pages/CuentaMarcadores.jsx`).
 * Anclajes: `[data-tour-marcadores="…"]`. Textos en `cuenta.guias.marcadores.*`.
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guia.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_MARCADORES } from "../../features/cuenta/guia.js";

export { PASOS_MARCADORES };

export const recorridoMarcadores = crearRecorrido("marcadores", PASOS_MARCADORES, { traducir: true });
