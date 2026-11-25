/**
 * La guía de «Lo mío», los módulos comprados (`features/cuenta/pages/CuentaLoMio.jsx`). Anclajes:
 * `[data-tour-lo-mio="…"]`. Textos en `cuenta.guias.loMio.*`. Con la lista vacía (aún no
 * ha comprado nada) los pasos de los módulos oscurecen todo y el texto vale solo.
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guia.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_LO_MIO } from "../../features/cuenta/guia.js";

export { PASOS_LO_MIO };

export const recorridoLoMio = crearRecorrido("lo-mio", PASOS_LO_MIO, { traducir: true });
