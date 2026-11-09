/**
 * La guía del listado «Contenido» (`pages/admin/AdminPostsList.jsx`). Anclajes:
 * `[data-tour-contenido="…"]`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_CONTENIDO = [
  {
    titulo: "Qué hay en esta página",
    texto: "Todas las piezas del sitio, publicadas o no, de la más nueva a la más vieja.",
  },
  {
    clave: "crear",
    titulo: "Crear una pieza",
    texto: "Abre el editor. Lo primero que pregunta es el formato: noticia, artículo, editorial, entrevista, informe o podcast.",
  },
  {
    clave: "filtros",
    titulo: "Buscar y filtrar",
    puntos: [
      "Buscar: por palabras del título o del resumen.",
      "Formato y estado: para ver, por ejemplo, solo los borradores de noticias.",
      "Sin clasificar: las piezas que todavía no tienen tema.",
    ],
  },
  {
    clave: "lista",
    titulo: "La lista",
    puntos: [
      "Título: abre la pieza en el editor.",
      "Estado: publicada, programada (y para cuándo) o borrador; también si abre la portada.",
      "Ver: abre la pieza publicada en el sitio, en otra pestaña.",
      "Publicar y Eliminar: sin abrir la pieza. Eliminar pide confirmación.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoContenido = crearRecorrido("contenido", PASOS_CONTENIDO);
