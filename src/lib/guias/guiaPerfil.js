/**
 * La guía de «Mi perfil» (`features/cuenta/pages/CuentaPerfil.jsx`). Anclajes:
 * `[data-tour-perfil="…"]`. Textos en `cuenta.guias.perfil.*`.
 *
 * Sus pasos viven con la cuenta del lector, en `features/cuenta/guides/perfil.js`;
 * aquí se arma la guía con ellos.
 */
import { crearRecorrido } from "../recorridoVista.js";
import { PASOS_PERFIL } from "../../features/cuenta/guides/perfil.js";

export { PASOS_PERFIL };

export const recorridoPerfil = crearRecorrido("perfil", PASOS_PERFIL, { traducir: true });
