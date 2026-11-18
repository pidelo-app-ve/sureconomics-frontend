/**
 * La guía de «Marcadores», las piezas guardadas (`pages/cuenta/CuentaMarcadores.jsx`).
 * Anclajes: `[data-tour-marcadores="…"]`. Textos en `cuenta.guias.marcadores.*`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_MARCADORES = [
  { titulo: "cuenta.guias.marcadores.queHay.titulo", texto: "cuenta.guias.marcadores.queHay.texto" },
  { clave: "lista", titulo: "cuenta.guias.marcadores.lista.titulo", texto: "cuenta.guias.marcadores.lista.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

export const recorridoMarcadores = crearRecorrido("marcadores", PASOS_MARCADORES, { traducir: true });
