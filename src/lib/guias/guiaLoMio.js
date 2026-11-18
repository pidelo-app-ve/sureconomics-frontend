/**
 * La guía de «Lo mío», los módulos comprados (`pages/cuenta/CuentaLoMio.jsx`). Anclajes:
 * `[data-tour-lo-mio="…"]`. Textos en `cuenta.guias.loMio.*`. Con la lista vacía (aún no
 * ha comprado nada) los pasos de los módulos oscurecen todo y el texto vale solo.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_LO_MIO = [
  { titulo: "cuenta.guias.loMio.queHay.titulo", texto: "cuenta.guias.loMio.queHay.texto" },
  { clave: "modulos", titulo: "cuenta.guias.loMio.modulos.titulo", texto: "cuenta.guias.loMio.modulos.texto" },
  { clave: "recibo", titulo: "cuenta.guias.loMio.recibo.titulo", texto: "cuenta.guias.loMio.recibo.texto" },
  {
    clave: "abrir",
    titulo: "cuenta.guias.loMio.abrir.titulo",
    puntos: ["cuenta.guias.loMio.abrir.p1", "cuenta.guias.loMio.abrir.p2", "cuenta.guias.loMio.abrir.p3"],
  },
  { clave: "pendientes", titulo: "cuenta.guias.loMio.pendientes.titulo", texto: "cuenta.guias.loMio.pendientes.texto" },
  { clave: "guia", titulo: "cuenta.guias.volver.titulo", texto: "cuenta.guias.volver.texto" },
];

export const recorridoLoMio = crearRecorrido("lo-mio", PASOS_LO_MIO, { traducir: true });
