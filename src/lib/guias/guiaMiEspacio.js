/**
 * La guía del inicio de la cuenta (`features/cuenta/pages/CuentaDashboardHome.jsx`). Anclajes:
 * `[data-tour-mi-espacio="…"]`. Textos en `cuenta.guias.miEspacio.*`. Dónde está cada
 * sección lo cuenta la bienvenida (`guiaCuenta.js`, el «?» de arriba); esta explica lo
 * que hay en la propia página.
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guides/miEspacio.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_MI_ESPACIO } from "../../features/cuenta/guides/miEspacio.js";

export { PASOS_MI_ESPACIO };

export const recorridoMiEspacio = crearRecorrido("mi-espacio", PASOS_MI_ESPACIO, { traducir: true });
