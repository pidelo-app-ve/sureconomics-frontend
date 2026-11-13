/**
 * La guía de «En redes» (`pages/admin/AdminRedes.jsx`). Anclajes:
 * `[data-tour-redes="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 *
 * Instagram y TikTok cambian de forma según estén en automático o no; su anclaje va en
 * la sección que se pinte en cada caso, así que el paso ilumina lo que haya.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_REDES = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "La fila «En redes» que sale al pie de todas las páginas del sitio: publicaciones de Instagram, X y " +
      "TikTok, hasta ocho por red. Instagram y TikTok pueden ir en automático, y entonces llegan solas cada " +
      "hora y aquí solo se revisan; X va siempre a mano. Lo que va a mano se arma aquí: el enlace de la " +
      "publicación, el texto tal como se quiere que se lea y, en Instagram y TikTok, una imagen.",
  },
  {
    clave: "instagram",
    titulo: "Instagram",
    texto:
      "Si al lado del nombre dice «Automático», las publicaciones llegan solas cada hora desde " +
      "@sur_economics y aquí solo se revisan. Si no, es una lista a mano, como la de X.",
    puntos: [
      "Actualizar ahora: trae lo último sin esperar a la hora.",
      "Sale en el sitio y De reserva: salen las primeras que no estén ocultas; las demás esperan su turno.",
      "Ocultar: deja de salir en el sitio y la siguiente ocupa su hueco. En Instagram no cambia nada. Mostrar la devuelve.",
      "La foto: abre la publicación en Instagram.",
    ],
  },
  {
    clave: "x",
    titulo: "X y las listas a mano",
    texto: "X va siempre a mano y solo lleva texto. Cualquier lista a mano se arma igual:",
    puntos: [
      "Añadir publicación: una ficha nueva al final, hasta ocho por red.",
      "Texto: obligatorio, tal como se quiere que se lea en el sitio.",
      "Enlace: la dirección de la publicación. Tiene que ser de esa misma red.",
      "Fecha: opcional, el día en que se publicó.",
      "Imagen: solo en Instagram y TikTok, y obligatoria. Se pulsa el recuadro y se elige la foto; en TikTok, un fotograma o una captura del video. Queda guardada también en Archivos.",
      "Flechas ↑ y ↓: el orden de aquí es el orden de la fila en el sitio.",
      "Quitar: la saca de la lista.",
      "Sin ninguna publicación: esa red no aparece en el sitio.",
    ],
  },
  {
    clave: "tiktok",
    titulo: "TikTok",
    texto: "Puede estar de tres maneras:",
    puntos: [
      "A mano: una lista como la de X, con imagen.",
      "Conectar TikTok: si aparece ese recuadro encima de la lista, se puede pasar a automático. Se pulsa una vez con la sesión de @surecon0mics abierta en TikTok, se da permiso allí y se vuelve aquí. Antes hay que guardar los cambios pendientes, porque la página se va a TikTok.",
      "Automático: los últimos videos llegan solos cada hora. Actualizar ahora, Ocultar y Mostrar funcionan como en Instagram.",
      "Desconectar: dejan de llegar videos nuevos y la fila vuelve a la lista a mano. Se puede conectar otra vez cuando se quiera.",
    ],
  },
  {
    clave: "guardar",
    titulo: "Guardar",
    texto:
      "Las listas a mano no cambian el sitio hasta pulsar «Guardar», en la barra del final de la página: " +
      "cuando hay cambios pendientes se queda pegada abajo de la pantalla y dice «Hay cambios sin guardar». " +
      "Se guarda todo de una vez: si a una publicación le falta algo, no se guarda ninguna y se dice qué " +
      "falta. Si se intenta salir con cambios sin guardar, la página pregunta antes.",
    puntos: [
      "Lo que vale al momento: Ocultar, Mostrar y Actualizar ahora no necesitan Guardar.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoRedes = crearRecorrido("redes", PASOS_REDES);
