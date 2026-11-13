/**
 * La guía de «Lugares» (`pages/admin/AdminPlacesList.jsx`). Anclajes:
 * `[data-tour-lugares="…"]`. Textos para la redacción: cómo está armado el árbol y qué
 * se puede tocar, sin jerga.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_LUGARES = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Los lugares con que se clasifican las piezas, en forma de árbol: Mundo, los continentes, sus regiones y " +
      "los países. Cada pieza se etiqueta con el lugar más concreto que le toque, casi siempre un país. Al " +
      "filtrar por una región salen también las piezas de sus países.",
  },
  {
    clave: "lista",
    titulo: "El árbol",
    puntos: [
      "Lugar: el nombre, más a la derecha cuanto más concreto, y las dos letras del país si las tiene.",
      "En inglés: el nombre que ve quien lee el sitio en inglés. Si se deja vacío, sale el de español. Se guarda solo al salir de la casilla.",
      "Nivel: raíz (Mundo), continente, región o país.",
      "Slug: su nombre interno, fijo.",
      "Piezas publicadas: las que llevan ese lugar exactamente. El número de una región no suma el de sus países.",
      "Retirar: lo quita de los filtros del lector, sin quitárselo a las piezas que ya lo llevan. «Restituir» lo devuelve.",
      "Eliminar: solo en los países, y solo si ninguna pieza lo lleva. Es para corregir uno mal escrito: se borra del todo.",
    ],
  },
  {
    clave: "anadir",
    titulo: "Añadir un país",
    texto: "Para sumar un país que falte. Solo países: Mundo, los continentes y las regiones son fijos.",
    puntos: [
      "Nombre: en español, como debe salir en el sitio.",
      "En inglés e ISO: opcionales. ISO son las dos letras del país, como VE o CO.",
      "Región o continente: debajo de qué va. Normalmente una región; algunos países van directamente bajo su continente.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelva aquí cuando quiera",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoLugares = crearRecorrido("lugares", PASOS_LUGARES);
