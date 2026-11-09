/**
 * La guía del panel «Resumen diario» (`pages/admin/AdminResumen.jsx`). Anclajes:
 * `[data-tour-resumen="…"]`. Textos para el editor: qué es cada cosa y para qué sirve.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_RESUMEN = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "El resumen diario sale solo tres veces: a las 7:00, a las 13:00 y a las 19:00, en la web, en Telegram " +
      "y en el canal de WhatsApp. Nadie tiene que aprobarlo. Una hora antes de cada una se arma solo con lo " +
      "nuevo desde la edición anterior: nuestras piezas, los titulares de Última hora, las cifras y, por la " +
      "mañana, la LVBP; lo que ya salió no se repite. Aquí ves cómo va a llegar al canal, la foto y el " +
      "mensaje, y si quieres lo ajustas antes de la hora: si lo cambias, sale cambiado; si no lo tocas, sale tal cual.",
  },
  {
    clave: "hoy",
    titulo: "Las tres de hoy",
    puntos: [
      "Cada edición: mañana, tarde y noche, con su hora de salida y cómo va.",
      "Abrir: la trae abajo para revisarla.",
      "Armar ahora: arma una que todavía no está (por ejemplo, si el reloj está apagado). Una armada tarde sale diez minutos después, para que te dé tiempo a mirarla.",
      "Sin contenido nuevo: en su franja hubo casi nada que no hubiera salido ya, así que no sale. Si después llega algo, ábrela y pulsa «Rehacer».",
    ],
  },
  {
    clave: "estado",
    titulo: "Cómo va la edición abierta",
    puntos: [
      "Sale sola: armada; a la hora que dice sale tal como la ves, sin que nadie haga nada. Una que no salió antes de que se arme la siguiente ya no sale: lo suyo entra en la siguiente.",
      "Retenida: alguien pulsó «No mandar esta edición», así que no sale. Se puede seguir retocando y, con «Dejar que salga», vuelve a salir.",
      "Publicado: ya salió. Ya no se puede cambiar.",
      "Telegram y WhatsApp: si el mensaje llegó a cada canal. Si WhatsApp falla tres veces, aparece el botón para reintentarlo.",
    ],
  },
  {
    clave: "acciones",
    titulo: "Los botones",
    puntos: [
      "No mandar esta edición: la frena; no sale a su hora ni después. Para un caso puntual, no hace falta para lo normal.",
      "Dejar que salga: deshace lo anterior. Sale a su hora o, si ya pasó, en el próximo minuto.",
      "Rehacer: la arma otra vez desde cero con lo nuevo desde la edición anterior. Se pierden los cambios a las líneas; la frase, las cifras a mano y la foto que hayas elegido se conservan. Corre la salida diez minutos, para que te dé tiempo a mirarla.",
      "Copiar el texto: el mensaje tal cual sale en WhatsApp, por si hace falta pegarlo a mano en otro sitio.",
    ],
  },
  {
    clave: "imagen",
    titulo: "La foto del mensaje",
    texto:
      "La foto que sale antes del mensaje en WhatsApp y en Telegram, y arriba en la web. Se elige sola: la de la noticia " +
      "más importante del mensaje que tenga foto. Puedes pulsar la de otra noticia del mensaje, elegir una de la " +
      "biblioteca o subirla, o quitarla; la ves al momento en la maqueta y se guarda con «Guardar cambios». Si nadie la " +
      "toca, sale la que se eligió sola.",
  },
  {
    clave: "vista",
    titulo: "Así llega al canal",
    texto:
      "El mensaje como lo ve quien abre el canal de WhatsApp: primero la foto, en su proporción, y enseguida el texto " +
      "con la tarjeta del enlace, que WhatsApp arma con la foto y el título de la página. La foto cambia al elegirla; " +
      "el texto, al guardar. En Telegram es igual, pero cada punto lleva su enlace.",
  },
  {
    clave: "secciones",
    titulo: "Los puntos de cada sección",
    texto: "Cada punto es una línea que enlaza a su pieza o a su titular. Lo más importante va arriba.",
    puntos: [
      "La línea: se puede reescribir. La versión en inglés va aparte, en «Inglés», para la web en inglés.",
      "Flechas: suben o bajan el punto dentro de su sección.",
      "Mover a: lo pasa a otra sección.",
      "Quitar: lo saca del resumen. No se pierde: queda en «Añadir» por si quieres recuperarlo.",
      "Añadir: lo que quedó fuera del borrador, para meterlo en la sección que elijas.",
    ],
  },
  {
    clave: "cifras",
    titulo: "Las cifras",
    puntos: [
      "Automáticas: dólar y euro del BCV, la Bolsa de Caracas y las monedas de la región, con su variación del día. Las que llevan más de 3 días sin actualizarse no salen.",
      "A mano: hasta tres cifras que escribes tú, por ejemplo el precio del petróleo.",
    ],
  },
  {
    clave: "frase",
    titulo: "La frase del día",
    texto: "Opcional. Si la escribes, sale al final del mensaje en cursiva. Si la dejas vacía, no sale nada.",
  },
  {
    clave: "historial",
    titulo: "Las ediciones anteriores",
    texto: "Las ediciones de los últimos días, con su estado y si llegaron a cada canal. Pulsa una para verla.",
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoResumen = crearRecorrido("resumen", PASOS_RESUMEN);
