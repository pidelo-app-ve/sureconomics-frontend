/**
 * La guía de «Entorno en Viñetas» (`pages/admin/AdminBoletin.jsx`). Anclajes:
 * `[data-tour-boletin="…"]`.
 */
import { crearRecorrido } from "../recorridoVista.js";

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

export const recorridoBoletin = crearRecorrido("boletin", PASOS_BOLETIN);
