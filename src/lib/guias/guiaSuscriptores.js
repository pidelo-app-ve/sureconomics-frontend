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
    titulo: "Qué lista ver",
    texto: "Bajo el título se ve cuántos hay en la lista elegida.",
    puntos: [
      "Suscritos: a quién se le puede escribir. Es la que sale al entrar.",
      "Dados de baja: quien pidió salir. Sirve para comprobar que alguien salió cuando lo pide.",
      "Todos: las dos juntas.",
    ],
  },
  {
    clave: "csv",
    titulo: "Descargar la lista",
    texto:
      "Baja la lista en un archivo que se abre con Excel o con Google Sheets. Lleva solo a los suscritos; " +
      "con «Todos» elegido al lado, también a quienes se dieron de baja. Son correos de personas: " +
      "guárdelo con cuidado y no lo reenvíe.",
  },
  {
    clave: "tabla",
    titulo: "La lista",
    puntos: [
      "Correo y Estado: la dirección que dejó y si sigue suscrito o se dio de baja.",
      "Origen: dónde se apuntó: la portada, el pie de página, la página a la que lleva el perfil de Instagram o la invitación que aparece mientras se lee.",
      "Alta y Baja: el día en que se apuntó y el día en que salió. Si alguien se da de baja y vuelve, el alta pasa a ser el día en que volvió.",
      "Páginas: van de veinte en veinte; los botones de abajo pasan de una a otra.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez. Los números del boletín se preparan en «Entorno en Viñetas».",
  },
];

export const recorridoSuscriptores = crearRecorrido("suscriptores", PASOS_SUSCRIPTORES);
