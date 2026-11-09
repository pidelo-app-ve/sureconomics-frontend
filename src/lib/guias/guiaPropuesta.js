/**
 * La guía de «Proponer una pieza» y de su edición (`components/submissions/SubmissionForm.jsx`).
 * Anclajes: `[data-tour-propuesta="…"]`. Textos en `cuenta.guias.propuesta.*`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_PROPUESTA = [
  { titulo: "cuenta.guias.propuesta.queHay.titulo", texto: "cuenta.guias.propuesta.queHay.texto" },
  { clave: "aviso", titulo: "cuenta.guias.propuesta.aviso.titulo", texto: "cuenta.guias.propuesta.aviso.texto" },
  { clave: "formato", titulo: "cuenta.guias.propuesta.formato.titulo", puntos: ["cuenta.guias.propuesta.formato.p1", "cuenta.guias.propuesta.formato.p2"] },
  { clave: "titulo", titulo: "cuenta.guias.propuesta.titulo.titulo", texto: "cuenta.guias.propuesta.titulo.texto" },
  { clave: "resumen", titulo: "cuenta.guias.propuesta.resumen.titulo", texto: "cuenta.guias.propuesta.resumen.texto" },
  { clave: "contenido", titulo: "cuenta.guias.propuesta.contenido.titulo", texto: "cuenta.guias.propuesta.contenido.texto" },
  { clave: "foto", titulo: "cuenta.guias.propuesta.foto.titulo", texto: "cuenta.guias.propuesta.foto.texto" },
  {
    clave: "acciones",
    titulo: "cuenta.guias.propuesta.acciones.titulo",
    puntos: ["cuenta.guias.propuesta.acciones.p1", "cuenta.guias.propuesta.acciones.p2", "cuenta.guias.propuesta.acciones.p3"],
  },
  { clave: "guia", titulo: "cuenta.guias.propuesta.guia.titulo", texto: "cuenta.guias.propuesta.guia.texto" },
];

export const recorridoPropuesta = crearRecorrido("propuesta", PASOS_PROPUESTA, { traducir: true });
