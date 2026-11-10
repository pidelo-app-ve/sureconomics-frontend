/**
 * La guía del editor de piezas (`pages/admin/AdminPostEditor.jsx`). Anclajes:
 * `[data-tour-editor="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_EDITOR = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Aquí se escribe y se publica una pieza. Lo primero es el título, el texto y la foto; lo demás va " +
      "plegado y se abre con un clic. A la derecha, qué falta para publicar y los botones.",
  },
  {
    clave: "formato",
    titulo: "El formato",
    texto:
      "Noticia, artículo, editorial, entrevista, informe o podcast. Decide qué pide el formulario y cómo " +
      "se ve la pieza en el sitio.",
  },
  {
    clave: "pieza",
    titulo: "La pieza",
    puntos: [
      "Título: el que sale en la portada y en la pieza.",
      "Resumen: dos o tres líneas bajo el título y en las tarjetas. Va plegado.",
      "Firma y foto: el nombre con el que se publica. Vacía, la pieza sale sin firma. Va plegado.",
      "Fuentes: de dónde sale lo que se cuenta. Va plegado; su cabecera dice cuántas hay.",
    ],
  },
  {
    clave: "cuerpo",
    titulo: "El cuerpo",
    texto:
      "El texto de la pieza, con negrita, subtítulos, listas, citas, enlaces y fotos entre párrafos. " +
      "Debajo, plegada, la versión en inglés: con «Traducir con Claude» se rellena sola para revisarla.",
  },
  {
    clave: "clasificacion",
    titulo: "Temas, lugares y sello",
    texto:
      "Los temas y lugares ordenan la pieza en el sitio; el primero de cada uno es el principal. Arriba salen " +
      "los que el panel propone leyendo el texto: un toque los añade. Sin tema no se puede publicar. En «Sello " +
      "y publicidad» se marca si es educativa o si no debe llevar anuncios.",
  },
  {
    clave: "publicacion",
    titulo: "Publicación",
    texto:
      "Si es borrador o programada (y para cuándo), y si abre la portada y hasta cuándo. Las noticias no se " +
      "programan: se publican cuando pasan.",
  },
  {
    clave: "estado",
    titulo: "Cómo va",
    puntos: [
      "Estado: borrador, programada o publicada, y si abre la portada.",
      "Guardado: dice si hay cambios sin guardar. Mientras tanto se guarda una copia en este equipo, por si se cierra la pestaña.",
      "Antes de publicar: qué falta (con una equis), qué conviene añadir y qué está listo.",
      "Ver en el sitio: abre la pieza publicada en otra pestaña.",
    ],
  },
  {
    clave: "acciones",
    titulo: "Guardar y publicar",
    puntos: [
      "El botón relleno: lo que toca ahora. En un borrador listo es «Publicar»; si no, «Guardar».",
      "Al crear: «Guardar borrador» la deja para después; «Publicar» la saca ya.",
      "Con el teclado: Ctrl+S guarda y Ctrl+Enter publica.",
      "Guardar y publicar: si hay cambios sin guardar, se guardan antes de publicar.",
      "Vista previa: la pieza como saldrá, sin publicarla.",
      "Eliminar la pieza: pide confirmación, con el título. No se puede deshacer.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoEditor = crearRecorrido("editor", PASOS_EDITOR);
