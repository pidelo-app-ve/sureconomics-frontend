/**
 * La guía del panel «Resumen diario» (`pages/admin/AdminResumen.jsx`). Anclajes:
 * `[data-tour-resumen="…"]`. Textos para el editor: qué es cada cosa y para qué sirve.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_RESUMEN = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "El resumen de la mañana, «Lo importante de hoy». A las 6:00 se arma solo un borrador con lo más " +
      "importante de las últimas 24 horas: nuestras piezas, los titulares de Última hora, las cifras y la " +
      "LVBP. Aquí lo revisas y lo apruebas, y a las 7:00 sale en la web, en Telegram y en WhatsApp. " +
      "Si nadie lo aprueba, no sale.",
  },
  {
    clave: "estado",
    titulo: "Cómo va el de hoy",
    puntos: [
      "Borrador: armado, esperando que alguien lo revise y lo apruebe.",
      "Aprobado: sale a las 7:00. Si lo apruebas después de las 7:00, sale en el minuto.",
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
      "Rehacer: lo arma otra vez desde cero con lo último publicado. Se pierden los cambios a las líneas; la frase y las cifras a mano se conservan.",
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
    clave: "vista",
    titulo: "Así sale",
    texto:
      "El mensaje tal como llega a WhatsApp, con lo último que guardaste. En Telegram es igual, pero cada " +
      "punto lleva su enlace.",
  },
  {
    clave: "historial",
    titulo: "Los días anteriores",
    texto: "Los últimos 30 resúmenes, con su estado y si llegaron a cada canal. Pulsa uno para verlo.",
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoResumen = crearRecorrido("resumen", PASOS_RESUMEN);
