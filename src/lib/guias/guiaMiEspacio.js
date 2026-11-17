/**
 * La guía del inicio de la cuenta (`pages/cuenta/CuentaDashboardHome.jsx`). Anclajes:
 * `[data-tour-mi-espacio="…"]`. Textos en `cuenta.guias.miEspacio.*`. Dónde está cada
 * sección lo cuenta la bienvenida (`guiaCuenta.js`, el «?» de arriba); esta explica lo
 * que hay en la propia página.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_MI_ESPACIO = [
  { titulo: "cuenta.guias.miEspacio.queHay.titulo", texto: "cuenta.guias.miEspacio.queHay.texto" },
  {
    clave: "estado",
    titulo: "cuenta.guias.miEspacio.estado.titulo",
    texto: "cuenta.guias.miEspacio.estado.texto",
    puntos: ["cuenta.guias.miEspacio.estado.p1", "cuenta.guias.miEspacio.estado.p2"],
  },
  { clave: "cifras", titulo: "cuenta.guias.miEspacio.cifras.titulo", texto: "cuenta.guias.miEspacio.cifras.texto" },
  { clave: "usos", titulo: "cuenta.guias.miEspacio.usos.titulo", texto: "cuenta.guias.miEspacio.usos.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

export const recorridoMiEspacio = crearRecorrido("mi-espacio", PASOS_MI_ESPACIO, { traducir: true });
