/**
 * La guía de «Fotos del equipo» (`pages/admin/AdminEquipo.jsx`). Anclajes:
 * `[data-tour-equipo="…"]`.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_EQUIPO = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Las caras de la página «Quiénes somos». Aquí solo se ponen y se quitan fotos: los nombres, los " +
      "cargos y el orden los cambia el equipo técnico. Quien sale en varios grupos aparece aquí una sola " +
      "vez, y su foto vale para todos.",
  },
  {
    clave: "persona",
    titulo: "Cada persona",
    puntos: [
      "El círculo: púlselo para subir o cambiar la foto. Antes de subirla se encuadra: se acerca y se mueve para que la cara llene el círculo.",
      "Fotos pequeñas: si su lado más corto mide menos de 256 píxeles, avisa de que se verá pixelada, pero deja usarla.",
      "Quitar la foto: vuelve a sus iniciales.",
      "Sin foto: sale con sus iniciales. Es normal, no un error.",
    ],
  },
  {
    clave: "guardar",
    titulo: "Guardar",
    texto:
      "Lo que suba o quite se ve aquí enseguida, pero no sale en «Quiénes somos» hasta pulsar «Guardar», " +
      "al final de la lista. Mientras quede algo sin guardar, esa barra se queda pegada abajo y lo dice; " +
      "si intenta irse de la página, pregunta antes.",
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoEquipo = crearRecorrido("equipo", PASOS_EQUIPO);
