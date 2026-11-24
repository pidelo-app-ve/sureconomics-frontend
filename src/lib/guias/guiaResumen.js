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
    clave: "activo",
    titulo: "Resumen activo",
    texto:
      "El interruptor general del resumen. Encendido, cada edición se arma y sale sola a su hora. Apagado, no se arma, " +
      "no sale ni se manda ninguna edición nueva, ni a la web ni a Telegram ni a WhatsApp: es para una emergencia de " +
      "varias horas, sin tener que frenar las ediciones una por una.",
    puntos: [
      "En pausa: así quedan las ediciones que iban a salir mientras está apagado.",
      "Al volver a encenderlo: una edición en pausa sale a su hora o, si ya llegó, en el próximo minuto. Una a la que ya se le pasó la hora no sale: lo que llevaba entra en la siguiente. Al encender, un aviso dice qué sale en ese momento.",
      "Lo que ya salió: sigue en la web. Para quitar una edición que ya salió está «Retirar edición».",
    ],
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
      "En pausa: el resumen está apagado (arriba, «Resumen activo») y por eso no sale.",
      "Caducada: ya pasó su hora sin salir (estaba retenida o el resumen apagado). Ya no sale, ni con «Dejar que salga»: lo que llevaba entra en la siguiente.",
      "Publicado: ya salió. Ya no se puede cambiar; si hay que quitarla, «Retirar edición».",
      "Retirada: salió y alguien la retiró. Ya no se ve en la web.",
      "Telegram y WhatsApp: si el mensaje llegó a cada canal. Si WhatsApp falla tres veces, aparece el botón para reintentarlo.",
      "Se borró después de armarla: si un titular o una pieza del mensaje se borra, aquí se avisa, y eso ya no sale.",
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
    clave: "retirar",
    titulo: "Retirar una edición que ya salió",
    texto:
      "Solo aparece en una edición que ya salió. Sirve para quitarla si salió con un error: deja de verse en la web, " +
      "y quien abra su enlace ve que se retiró, y se borra sola del canal de Telegram en el próximo minuto. No se puede deshacer.",
    puntos: [
      "Motivo: opcional. Queda en el historial de la edición para el equipo; en la web no se enseña.",
      "WhatsApp: si ya había salido allí (aunque fuera solo la foto), desde aquí no se puede borrar. La ficha lo avisa en rojo y hay que borrarlo a mano en el canal.",
      "Telegram a mano: si salió antes de que se guardaran sus mensajes, o tenían más de 48 horas, tampoco se borra solo. La ficha lo avisa en rojo con lo que hay que hacer.",
      "Reintentar borrado: si Telegram no dejó borrarla, el mismo botón lo vuelve a intentar.",
      "La web: puede tardar unos minutos en dejar de enseñarla, lo que dura la copia guardada.",
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
    clave: "registro",
    titulo: "Lo que se hizo con esta edición",
    texto:
      "Quién la armó, la cambió, la retuvo o la retiró, y cuándo; lo último, arriba. Si se retiró con un motivo, aparece aquí.",
  },
  {
    clave: "historial",
    titulo: "Las ediciones anteriores",
    texto:
      "Todas las ediciones que se han armado, de la más reciente a la más antigua, con su estado y si llegaron a " +
      "cada canal. Pulsa «Ver» en una para abrirla arriba.",
    puntos: [
      "Páginas: van de 21 en 21, una semana de tres ediciones. Arriba dice en qué página estás y cuántas hay en total; «Anterior» y «Siguiente» están arriba y abajo.",
    ],
  },
  {
    clave: "historial-filtros",
    titulo: "Buscar una edición",
    texto: "Para encontrar una edición concreta sin pasar páginas. Al cambiar un filtro, la lista vuelve a la primera página.",
    puntos: [
      "Estado: solo las publicadas, las retenidas, las que no tuvieron contenido nuevo, las retiradas o los borradores.",
      "Edición: solo las de la mañana, la tarde o la noche.",
      "Desde y Hasta: los días entre los que buscar. Si las pones al revés, se buscan igual.",
      "Solo con fallos de envío: las que no llegaron a Telegram o a WhatsApp, para revisar qué pasó.",
      "Limpiar filtros: si ninguna edición cumple lo elegido, aparece este botón para volver a verlas todas.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoResumen = crearRecorrido("resumen", PASOS_RESUMEN);
