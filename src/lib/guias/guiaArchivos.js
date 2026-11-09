/**
 * La guía de «Archivos» (`pages/admin/AdminMediaLibrary.jsx`). Anclajes:
 * `[data-tour-archivos="…"]`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_ARCHIVOS = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Todo lo que se ha subido al sitio: imágenes, PDF de informes y audios de podcast. Lo que se sube desde " +
      "el editor de una pieza también llega aquí, y desde aquí se puede reutilizar en otras piezas.",
  },
  {
    clave: "subir",
    titulo: "Subir un archivo",
    texto: "Un solo botón: el tipo lo reconoce solo (imagen, PDF o audio MP3/M4A).",
  },
  {
    clave: "filtros",
    titulo: "Buscar",
    puntos: [
      "Tipo: solo imágenes, solo documentos o solo audios.",
      "Buscar: por nombre, archivo o crédito.",
    ],
  },
  {
    clave: "tabla",
    titulo: "La lista",
    puntos: [
      "Etiqueta: un nombre para encontrarlo después desde el editor. Se guarda al salir del campo.",
      "Abrir: lo enseña en otra pestaña.",
      "Eliminar: solo si nada lo usa (ni una pieza, ni un anuncio, ni el boletín). Pide confirmación.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoArchivos = crearRecorrido("archivos", PASOS_ARCHIVOS);
