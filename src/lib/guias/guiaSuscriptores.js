/**
 * La guía de «Suscriptores del boletín» (`pages/admin/AdminNewsletterList.jsx`).
 * Anclajes: `[data-tour-suscriptores="…"]`. Los números del boletín tienen la suya
 * (`guiaBoletin.js`): son dos páginas.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_SUSCRIPTORES = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Las personas que pidieron recibir el boletín por correo. Se apuntan solas desde el sitio y se " +
      "dan de baja con el enlace que trae cada correo del boletín. Desde aquí no se añade ni se quita a " +
      "nadie: la lista se consulta y se descarga.",
  },
  {
    clave: "filtro",
    titulo: "Qué lista ver y buscar",
    texto:
      "Bajo el título se ve cuántos hay con lo elegido. Al cambiar algo, la lista vuelve a la primera página.",
    puntos: [
      "Estado: «Suscritos» (a quién se le puede escribir; es la que sale al entrar), «Dados de baja» (quien pidió salir: sirve para comprobar que alguien salió cuando lo pide) o «Todos».",
      "Origen: solo los que se apuntaron desde un sitio: la portada, el pie de página, Instagram, la invitación o el panel.",
      "Buscar: un trozo del correo, por ejemplo el nombre o «gmail». Busca cuando deja de escribir.",
      "Limpiar filtros: si nadie cumple lo elegido, aparece este botón para volver a la lista de suscritos.",
    ],
  },
  {
    clave: "csv",
    titulo: "Descargar la lista",
    texto:
      "Baja la lista en un archivo que se abre con Excel o con Google Sheets. Lleva solo a los suscritos; " +
      "con «Todos» elegido en el estado, también a quienes se dieron de baja. El origen y la búsqueda no " +
      "cuentan: el archivo lleva la lista entera. Son correos de personas: guárdelo con cuidado y no lo reenvíe.",
  },
  {
    clave: "paginas",
    titulo: "Las páginas",
    texto:
      "La lista va de veinte en veinte. Aquí dice en qué página está y cuántos hay en total; «Anterior» y " +
      "«Siguiente» están aquí arriba y, con los números, también abajo.",
  },
  {
    clave: "tabla",
    titulo: "La lista",
    puntos: [
      "Correo y Estado: la dirección que dejó y si sigue suscrito o se dio de baja.",
      "Origen: dónde se apuntó: la portada, el pie de página, la página a la que lleva el perfil de Instagram o la invitación que aparece mientras se lee.",
      "Alta y Baja: el día en que se apuntó y el día en que salió. Si alguien se da de baja y vuelve, el alta pasa a ser el día en que volvió.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez. Los números del boletín se preparan en «Entorno en Viñetas».",
  },
];

export const recorridoSuscriptores = crearRecorrido("suscriptores", PASOS_SUSCRIPTORES);
