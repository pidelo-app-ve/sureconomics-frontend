/**
 * Los pasos de las dos guías del panel del boletín: la de los números («Entorno en
 * Viñetas», `admin/AdminBoletin.jsx`, anclajes `[data-tour-boletin="…"]`) y la de la
 * lista de suscriptores (`admin/AdminNewsletterList.jsx`, anclajes
 * `[data-tour-suscriptores="…"]`). Dos guías porque son dos páginas. Los textos son para
 * la redacción: qué es cada cosa y para qué sirve, sin jerga.
 *
 * Las guías en sí (`crearRecorrido`) siguen en `lib/guias/guiaBoletin.js` y
 * `lib/guias/guiaSuscriptores.js`, con las demás: allí las encuentran el botón «Guía» y la
 * prueba de todas las guías. Los pasos viven aquí para que quien cambie el panel tenga sus
 * textos al lado.
 *
 * Solo datos, sin JSX ni importaciones: los lee también la prueba de las guías, que corre
 * en node sin compilar nada (`npm run test:recorrido`). Por eso las guías los importan de
 * este archivo y no de `index.js` (ver `src/arquitectura.test.mjs`).
 */
export const PASOS_BOLETIN = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los números del boletín Entorno en Viñetas: uno por lunes. Se suben las páginas, se manda una prueba " +
      "para ver cómo queda y se activa: ese lunes a las 9:00 sale solo a todos los suscriptores.",
  },
  {
    clave: "nuevo",
    titulo: "Nuevo número",
    texto: "Elige el lunes en que sale. Nace en borrador: no se manda nada hasta que lo active.",
  },
  {
    clave: "lista",
    titulo: "Los números",
    puntos: [
      "Cada fila: su lunes, su portada y en qué estado está (borrador, activo, enviado).",
      "Pulsar una fila: abre el número para subir páginas, mandar la prueba y activarlo.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez. La lista de suscriptores está en «Suscriptores del boletín».",
  },
];

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
