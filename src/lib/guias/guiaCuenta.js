/**
 * La bienvenida a la cuenta del lector (`features/cuenta/pages/CuentaDashboardLayout.jsx`): salta
 * sola la primera vez (la marca «ya la vio» vive en el servidor, `recorridos_vistos`) y
 * se repite desde el botón «?» de la barra de arriba. Anclajes: `[data-tour-cuenta="…"]`
 * en cada enlace del menú. Los pasos con `abrirMenu` abren el menú lateral en el
 * teléfono, donde está plegado.
 *
 * Los textos son claves de `cuenta.guias.cuenta.*` (la cuenta se lee en dos idiomas).
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guia.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_CUENTA } from "../../features/cuenta/guia.js";

export { PASOS_CUENTA };

export const recorridoCuenta = crearRecorrido("cuenta", PASOS_CUENTA, { traducir: true });
