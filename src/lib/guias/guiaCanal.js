/**
 * La guía del panel «Canal de YouTube» (`pages/admin/AdminCanal.jsx`). Anclajes:
 * `[data-tour-canal="…"]`. Textos para el editor: qué es cada cosa y para qué sirve.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_CANAL = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "El canal de YouTube de la casa. Desde aquí se elige el canal, y cada hora llegan solos sus últimos " +
      "shorts y videos. Los shorts salen en la portada, en la fila «En la calle», y el último video, en la " +
      "ventana «Nuestro canal». Nadie tiene que subir nada a mano.",
  },
  {
    clave: "canal",
    titulo: "El canal",
    puntos: [
      "Usar este canal: escribe su @nombre o pega su enlace y púlsalo. Se comprueba en YouTube y llegan sus últimos videos.",
      "Actualizar ahora: trae lo nuevo sin esperar a la hora.",
      "Cambiar de canal: se olvida lo que llegó del anterior.",
      "Quitar el canal: la portada deja de enseñar «En la calle» y «Nuestro canal».",
    ],
  },
  {
    clave: "shorts",
    titulo: "Los shorts",
    texto:
      "Los últimos shorts del canal, en el orden en que salen en la fila «En la calle». Los primeros que no " +
      "estén ocultos se ven en la portada; los demás quedan de reserva.",
    puntos: [
      "Ocultar: ese short deja de salir en el sitio. En YouTube sigue igual.",
      "Mostrar: vuelve a salir.",
      "La foto: lleva a YouTube, para ver el short entero antes de decidir.",
    ],
  },
  {
    clave: "largos",
    titulo: "Los videos largos",
    texto:
      "Los últimos videos normales del canal. El primero que no esté oculto es el de la ventana «Nuestro " +
      "canal». También se pueden ocultar.",
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoCanal = crearRecorrido("canal", PASOS_CANAL);
