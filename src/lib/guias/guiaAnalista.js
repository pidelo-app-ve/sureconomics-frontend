/**
 * La guía de «Ranking de El Analista» (`pages/admin/AdminAnalista.jsx`). Anclajes:
 * `[data-tour-analista="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 *
 * El juego está en pausa (`/el-analista` lleva a `/juegos`, ver `routes.jsx`) y la página
 * no lo dice: lo dice la guía, para que nadie busque en el sitio un ranking que no se ve.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_ANALISTA = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "El ranking de «El Analista», el simulador de carrera e inversión. Cada fila es una partida terminada " +
      "que anotó un lector con cuenta y el correo confirmado. El nombre y las cifras los pone el juego en " +
      "el aparato del lector, así que puede colarse un nombre ofensivo o una cifra imposible: aquí se ocultan.",
    puntos: [
      "En pausa: el juego está en pausa. Su página en el sitio lleva a «Juegos» y el ranking no se ve. Lo que se oculte aquí queda así para cuando vuelva.",
    ],
  },
  {
    clave: "filtros",
    titulo: "Buscar partidas",
    puntos: [
      "Estado: todas, solo las que salen en el ranking o solo las ocultas. Cambia la lista al momento.",
      "Buscar: por el nombre en el ranking o por el correo de la cuenta. Se aplica al pulsar «Filtrar».",
    ],
  },
  {
    clave: "tabla",
    titulo: "Cada partida",
    puntos: [
      "Nombre en el ranking: el que escribió el lector al anotarla.",
      "Patrimonio: con cuánto terminó. Es lo que ordena el ranking.",
      "Carrera: el cargo al que llegó, la edad a la que se retiró, sus medallas (◆) y la frase final del juego.",
      "Cuenta: quién la anotó, con su correo. En el ranking sale solo la mejor partida de cada cuenta.",
      "Ocultar: la saca del ranking sin borrarla; si esa cuenta tiene otra partida, sale la siguiente mejor. «Volver a mostrar» la devuelve.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoAnalista = crearRecorrido("analista", PASOS_ANALISTA);
