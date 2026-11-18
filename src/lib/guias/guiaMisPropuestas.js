/**
 * Las guías de «Mis propuestas» en la cuenta del lector: la lista
 * (`pages/cuenta/CuentaEnviosList.jsx`, anclajes `[data-tour-mis-propuestas="…"]`) y una
 * propuesta (`pages/cuenta/CuentaEnvioDetail.jsx`, anclajes `[data-tour-mi-propuesta="…"]`).
 * Dos guías porque son dos páginas, cada una con su botón «Guía». La del formulario para
 * proponer o corregir una es `guiaPropuesta.js`; la de la redacción, que las revisa,
 * `guiaPropuestasDeLectores.js`. Textos en `cuenta.guias.misPropuestas.*` y
 * `cuenta.guias.miPropuesta.*`; los estados, en `cuenta.guias.estados.*`, los mismos en
 * las dos.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_MIS_PROPUESTAS = [
  { titulo: "cuenta.guias.misPropuestas.queHay.titulo", texto: "cuenta.guias.misPropuestas.queHay.texto" },
  { clave: "nueva", titulo: "cuenta.guias.misPropuestas.nueva.titulo", texto: "cuenta.guias.misPropuestas.nueva.texto" },
  { clave: "lista", titulo: "cuenta.guias.misPropuestas.lista.titulo", texto: "cuenta.guias.misPropuestas.lista.texto" },
  {
    clave: "estado",
    titulo: "cuenta.guias.estados.titulo",
    puntos: [
      "cuenta.guias.estados.enviado",
      "cuenta.guias.estados.enRevision",
      "cuenta.guias.estados.aceptado",
      "cuenta.guias.estados.rechazado",
    ],
  },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

export const recorridoMisPropuestas = crearRecorrido("mis-propuestas", PASOS_MIS_PROPUESTAS, { traducir: true });

export const PASOS_MI_PROPUESTA = [
  { titulo: "cuenta.guias.miPropuesta.queHay.titulo", texto: "cuenta.guias.miPropuesta.queHay.texto" },
  {
    clave: "estado",
    titulo: "cuenta.guias.estados.titulo",
    puntos: [
      "cuenta.guias.estados.enviado",
      "cuenta.guias.estados.enRevision",
      "cuenta.guias.estados.aceptado",
      "cuenta.guias.estados.rechazado",
    ],
  },
  { clave: "editar", titulo: "cuenta.guias.miPropuesta.editar.titulo", texto: "cuenta.guias.miPropuesta.editar.texto" },
  { clave: "foto", titulo: "cuenta.guias.miPropuesta.foto.titulo", texto: "cuenta.guias.miPropuesta.foto.texto" },
  { clave: "texto", titulo: "cuenta.guias.miPropuesta.texto.titulo", texto: "cuenta.guias.miPropuesta.texto.texto" },
  { clave: "notas", titulo: "cuenta.guias.miPropuesta.notas.titulo", texto: "cuenta.guias.miPropuesta.notas.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

export const recorridoMiPropuesta = crearRecorrido("mi-propuesta", PASOS_MI_PROPUESTA, { traducir: true });
