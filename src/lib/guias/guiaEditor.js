/**
 * La guía del editor de piezas (`pages/admin/AdminPostEditor.jsx`). Anclajes:
 * `[data-tour-editor="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_EDITOR = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Aquí se escribe y se publica una pieza. A la izquierda va la pieza; a la derecha, cómo va y los " +
      "botones para guardarla y publicarla. Lo que se toca de vez en cuando va plegado: se abre con un clic.",
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
      "Resumen: dos o tres líneas bajo el título y en las tarjetas.",
      "Firma y foto: el nombre con el que se publica. Vacía, la pieza sale sin firma.",
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
      "Los temas y lugares ordenan la pieza en el sitio; el primero de cada uno es el principal. En «Sello " +
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
      "Para publicar falta: lo que impediría publicarla, antes de intentarlo.",
      "Ver en el sitio: abre la pieza publicada en otra pestaña.",
    ],
  },
  {
    clave: "acciones",
    titulo: "Guardar y publicar",
    puntos: [
      "El botón relleno: lo que toca ahora. En un borrador listo es «Publicar»; si no, «Guardar».",
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
