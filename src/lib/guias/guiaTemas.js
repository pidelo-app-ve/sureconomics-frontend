/**
 * La guía de «Temas» (`pages/admin/AdminTopicsList.jsx`). Anclajes:
 * `[data-tour-temas="…"]`. Textos para la redacción: qué es cada columna y para qué
 * sirve, sin jerga.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_TEMAS = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los temas con que se clasifican las piezas. Es una lista cerrada: aquí no se crean temas nuevos ni se " +
      "borran, y así los filtros del lector se mantienen cortos y claros. Lo que sí se puede es cambiarles el " +
      "nombre y el orden, y retirarlos.",
  },
  {
    clave: "lista",
    titulo: "Cada tema",
    puntos: [
      "Orden: las flechas suben o bajan el tema. Es el orden en que salen en los filtros.",
      "Nombre: se corrige escribiendo encima. Se guarda solo al salir de la casilla y cambia en todo el sitio.",
      "En inglés: el nombre que ve quien lee el sitio en inglés. Si se deja vacío, sale el de español.",
      "Slug: su nombre interno, fijo. No cambia aunque se cambie el nombre.",
      "Piezas publicadas: cuántas piezas publicadas llevan ese tema.",
      "Retirar: lo quita de los filtros del lector, pero las piezas que ya lo llevan lo conservan. Un tema retirado se ve más claro en la lista.",
      "Restituir: lo devuelve a los filtros.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoTemas = crearRecorrido("temas", PASOS_TEMAS);
