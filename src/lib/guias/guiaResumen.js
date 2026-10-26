/**
 * La guía del panel «Resumen diario» (`pages/admin/AdminResumen.jsx`). Anclajes:
 * `[data-tour-resumen="…"]`. Textos para el editor: qué es cada cosa y para qué sirve.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_RESUMEN = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "El resumen diario sale tres veces: a las 7:00, a las 13:00 y a las 19:00. Una hora antes de cada " +
      "una se arma solo un borrador con lo nuevo desde la edición anterior: nuestras piezas, los titulares " +
      "de Última hora, las cifras y, por la mañana, la LVBP. Lo que ya salió no se repite. Aquí lo revisas " +
      "y lo apruebas, y a su hora sale en la web, en Telegram y en WhatsApp. Si nadie lo aprueba, no sale.",
  },
  {
    clave: "hoy",
    titulo: "Las tres de hoy",
    puntos: [
      "Cada edición: mañana, tarde y noche, con su hora de salida y cómo va.",
      "Abrir: la trae abajo para revisarla.",
      "Armar ahora: arma una que todavía no está (por ejemplo, si el reloj está apagado).",
      "Sin contenido nuevo: en su franja hubo casi nada que no hubiera salido ya, así que no sale. Si después llega algo, ábrela y pulsa «Rehacer».",
    ],
  },
  {
    clave: "estado",
    titulo: "Cómo va la edición abierta",
    puntos: [
      "Borrador: armada, esperando que alguien la revise y la apruebe.",
      "Aprobado: sale a su hora. Si la apruebas después, sale en el minuto. Una que no se aprobó antes de que se arme la siguiente ya no sale: lo suyo entra en la siguiente.",
      "Publicado: ya salió. Ya no se puede cambiar.",
      "Telegram y WhatsApp: si el mensaje llegó a cada canal. Si WhatsApp falla tres veces, aparece el botón para reintentarlo.",
    ],
  },
  {
    clave: "acciones",
    titulo: "Los botones",
    puntos: [
      "Aprobar: lo deja listo para salir. Cualquier cambio después lo devuelve a borrador.",
      "Volver a borrador: deshace la aprobación si todavía no salió.",
      "Rehacer: la arma otra vez desde cero con lo nuevo desde la edición anterior. Se pierden los cambios a las líneas; la frase, las cifras a mano y la foto que hayas elegido se conservan.",
      "Copiar el texto: el mensaje tal cual sale en WhatsApp, por si hace falta pegarlo a mano en otro sitio.",
    ],
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
    clave: "imagen",
    titulo: "La foto de la edición",
    texto:
      "Se elige sola: la de la pieza más importante de la edición que tenga foto. Puedes cambiarla, subir " +
      "otra o quitarla; tiene que ser pública y se guarda con «Guardar cambios». En WhatsApp y en Telegram " +
      "sale primero la foto y enseguida el resumen, y en la web va arriba.",
  },
  {
    clave: "vista",
    titulo: "Así sale",
    texto:
      "El mensaje tal como llega a WhatsApp, con lo último que guardaste. En Telegram es igual, pero cada " +
      "punto lleva su enlace.",
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
