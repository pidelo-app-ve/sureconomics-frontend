/**
 * La guía de «Publicidad» (`pages/admin/AdminPublicidad.jsx`). Anclajes:
 * `[data-tour-publicidad="…"]`. Textos para quien carga los anuncios.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_PUBLICIDAD = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los anuncios del sitio. Funciona en tres niveles: el anunciante es la empresa que paga, la campaña es " +
      "el periodo en que sale, y la pieza es lo que se ve (un banner, una tarjeta, una tira).",
  },
  {
    clave: "publicar",
    titulo: "Publicar un anuncio",
    texto:
      "La forma de dar de alta un anuncio: en tres pasos (quién, cuándo, qué se ve) crea lo que haga falta y " +
      "termina con el anuncio al aire. Si el anunciante ya existe, se elige de la lista; no se puede crear dos veces.",
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
    clave: "mural",
    titulo: "Quién está al aire",
    texto: "Las marcas de un vistazo, con su logotipo. Pulsar una abre su ficha.",
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

export const recorridoPublicidad = crearRecorrido("publicidad", PASOS_PUBLICIDAD);
