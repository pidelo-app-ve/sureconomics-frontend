/**
 * Los pasos de la guía del panel «Publicidad» (`admin/AdminPublicidad.jsx`).
 * Anclajes: `[data-tour-publicidad="…"]`. Textos para quien carga los anuncios: qué es
 * cada cosa y para qué sirve, sin jerga.
 *
 * La guía en sí (`crearRecorrido`) sigue en `lib/guias/guiaPublicidad.js`, con las demás:
 * allí la encuentran el botón «Guía» y la prueba de todas las guías. Los pasos viven aquí
 * para que quien cambie el panel tenga sus textos al lado.
 *
 * Solo datos, sin JSX ni importaciones: los lee también la prueba de las guías, que corre
 * en node sin compilar nada (`npm run test:recorrido`). Por eso la guía los importa de
 * este archivo y no de `index.js` (ver `src/arquitectura.test.mjs`).
 */

export const PASOS_PUBLICIDAD = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los anuncios del sitio. Funciona en tres niveles: el anunciante es la empresa que paga, la campaña es " +
      "el periodo en que sale, y la pieza es lo que se ve (un banner, una tarjeta, una tira). Los huecos " +
      "forman una escalera y cada uno rota hasta tres marcas; en cada recarga del lector la escalera baja " +
      "un peldaño. El peso de una campaña son sus entradas en la cola.",
  },
  {
    clave: "publicar",
    titulo: "Publicar un anuncio",
    texto:
      "La forma de dar de alta un anuncio: cinco pasos (quién, cuándo, arte, dónde y afinar). En «Dónde» el " +
      "mapa enseña en qué hueco cae en cada recarga, y se le puede fijar una plaza. Termina con el anuncio al aire.",
  },
  {
    clave: "cifras",
    titulo: "Cómo rinde",
    texto: "Impresiones y clics de los últimos 30 días, de todo el sitio.",
  },
  {
    clave: "interruptores",
    titulo: "Los interruptores generales",
    puntos: [
      "Publicidad encendida: apaga todos los anuncios del sitio de golpe (pide confirmación). Para el día de una noticia delicada.",
      "Barra fija inferior: el anuncio pegado abajo de la pantalla. Nace apagada porque es el que más molesta.",
      "Sorteo libre entre espacios: lo normal es dejarlo apagado.",
    ],
  },
  {
    clave: "campanas",
    titulo: "Las campañas",
    puntos: [
      "Cómo va: al aire, en pausa, borrador, o por qué no sale aunque esté activa (tope alcanzado, fuera de fecha, sin pieza lista).",
      "Al aire: enciende o pausa la campaña con un clic. Una campaña sin pieza no se puede encender.",
      "Ficha: baja a la ficha del anunciante, con sus piezas y artes.",
    ],
  },
  {
    clave: "mapa",
    titulo: "El mapa del sitio",
    puntos: [
      "Páginas y aparato: la portada, una pieza, un listado y los juegos, en computador o teléfono.",
      "Cada hueco: pasa sus marcas cada siete segundos, en el orden en que lo verá el lector.",
      "Siguiente recarga: la escalera baja un peldaño, como cuando alguien recarga.",
      "Plaza fija: una marca con plaza fija en un hueco sale ahí siempre; la escalera llena las otras dos.",
    ],
  },
  {
    clave: "fichas",
    titulo: "Las fichas de los anunciantes",
    texto:
      "El detalle de cada anunciante: sus datos de contacto (no salen publicados), sus campañas y las piezas " +
      "de cada una, con el arte para computador y para teléfono. «Nueva campaña» abre el asistente con ese anunciante.",
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];
