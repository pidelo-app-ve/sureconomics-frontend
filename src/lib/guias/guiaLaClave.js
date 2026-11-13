/**
 * La guía de «La Clave» (`pages/admin/AdminJuegoPalabras.jsx`). Anclajes:
 * `[data-tour-laclave="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 *
 * La palabra del día sale de un índice sobre las activas de la categoría (ver
 * `juego_palabras_service.py`): por eso añadir, retirar o borrar puede cambiar la de hoy.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_LA_CLAVE = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Las palabras de «La Clave», el juego de adivinar la palabra del día. Hay ocho categorías, y cada día " +
      "cada una tiene su palabra, la misma para todos los lectores: el sistema la elige sola entre las " +
      "palabras en juego de esa categoría. Aquí se añaden, se corrigen, se retiran y se borran.",
  },
  {
    clave: "cuenta",
    titulo: "Cuántas hay en juego",
    texto:
      "Las palabras en juego de cada categoría; las retiradas no cuentan. Una categoría a cero no sale en " +
      "el juego.",
  },
  {
    clave: "anadir",
    titulo: "Añadir una palabra",
    puntos: [
      "Palabra: de 4 a 10 letras y una sola palabra. Valen nombres propios (equipos, películas, héroes), y da igual que lleve tilde o no.",
      "Categoría: en cuál de las ocho entra. Una palabra no puede estar dos veces en la misma categoría.",
      "Definición: opcional. Se enseña al terminar la partida.",
      "Pista: opcional. Se le ofrece al lector al tercer intento fallido.",
    ],
  },
  {
    clave: "pegar",
    titulo: "Pegar una lista",
    texto:
      "Para cargar muchas de una vez: se elige la categoría y se pega una palabra por línea. Si se quiere, " +
      "detrás de una barra vertical van la definición y la pista, así: «Magallanes | El equipo de " +
      "Valencia | Rival eterno del Caracas». Al terminar dice cuántas entraron, cuáles ya estaban y qué " +
      "líneas no valieron, y por qué.",
  },
  {
    clave: "filtros",
    titulo: "Buscar en el catálogo",
    puntos: [
      "Categoría y Estado: «En juego» son las que entran en el sorteo; «Retiradas», las que no.",
      "Buscar: por la palabra o por su definición. Se escribe y se pulsa Intro.",
    ],
  },
  {
    clave: "lista",
    titulo: "Cada palabra",
    puntos: [
      "Letras: cuántas casillas tiene en el juego.",
      "Editar: corregir la palabra, la categoría, la definición o la pista.",
      "Retirar: la saca del sorteo sin borrarla. Reactivar la devuelve.",
      "Borrar: la elimina del todo, con su definición y su pista. Si solo se quiere que deje de salir, mejor retirarla.",
      "La palabra de hoy: sale de las palabras en juego de cada categoría, así que añadir, retirar o borrar una puede cambiar la de hoy en esa categoría.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoLaClave = crearRecorrido("laclave", PASOS_LA_CLAVE);
