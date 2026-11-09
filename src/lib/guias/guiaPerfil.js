/**
 * La guía de «Mi perfil» (`pages/cuenta/CuentaPerfil.jsx`). Anclajes:
 * `[data-tour-perfil="…"]`. Textos en `cuenta.guias.perfil.*`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_PERFIL = [
  { titulo: "cuenta.guias.perfil.queHay.titulo", texto: "cuenta.guias.perfil.queHay.texto" },
  { clave: "retrato", titulo: "cuenta.guias.perfil.retrato.titulo", texto: "cuenta.guias.perfil.retrato.texto" },
  { clave: "nombre", titulo: "cuenta.guias.perfil.nombre.titulo", texto: "cuenta.guias.perfil.nombre.texto" },
  { clave: "datos", titulo: "cuenta.guias.perfil.datos.titulo", texto: "cuenta.guias.perfil.datos.texto" },
  { clave: "guardar", titulo: "cuenta.guias.perfil.guardar.titulo", texto: "cuenta.guias.perfil.guardar.texto" },
  { clave: "guia", titulo: "cuenta.guias.perfil.guia.titulo", texto: "cuenta.guias.perfil.guia.texto" },
];

export const recorridoPerfil = crearRecorrido("perfil", PASOS_PERFIL, { traducir: true });
