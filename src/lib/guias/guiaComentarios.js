/**
 * La guía de «Comentarios» (`pages/admin/AdminCommentsList.jsx`). Anclajes:
 * `[data-tour-comentarios="…"]`. Textos para quien modera: qué es cada cosa y para qué
 * sirve, sin jerga.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_COMENTARIOS = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los comentarios que dejan los lectores debajo de las piezas. Ninguno sale en el sitio hasta que " +
      "alguien lo aprueba: los nuevos llegan como pendientes y esperan aquí. Desde esta página se leen y " +
      "se decide cuáles se publican.",
  },
  {
    clave: "filtros",
    titulo: "Buscar comentarios",
    puntos: [
      "Estado: para ver solo los pendientes, los aprobados o los rechazados. «Pendiente» deja solo lo que falta por revisar.",
      "ID del artículo: el número de una pieza, para ver solo sus comentarios. Es el número que sale al final de la dirección cuando se abre la pieza en el editor.",
      "Filtrar: vuelve a pedir la lista desde la primera página.",
    ],
  },
  {
    clave: "lista",
    titulo: "La lista",
    texto:
      "Veinte por página, del más nuevo al más viejo. Si ninguno coincide con los filtros, en su lugar sale " +
      "un aviso.",
    puntos: [
      "Artículo: la pieza donde se dejó. El enlace la abre en el sitio, en otra pestaña.",
      "Autor: el nombre y el correo de la cuenta del lector.",
      "Estado: pendiente (todavía no se ve), aprobado (se ve debajo de la pieza) o rechazado (no se ve).",
      "Texto: el comienzo del comentario.",
      "Aprobar: lo publica debajo de la pieza.",
      "Rechazar: lo quita del sitio sin borrarlo. Si fue un error, se puede aprobar después.",
      "Eliminar: lo borra del todo y no se puede recuperar. Pide confirmación.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoComentarios = crearRecorrido("comentarios", PASOS_COMENTARIOS);
