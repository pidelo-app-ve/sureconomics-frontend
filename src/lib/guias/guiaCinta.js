/**
 * La guía de «Cinta de mercado» (`pages/admin/AdminMarketTicker.jsx`). Anclajes:
 * `[data-tour-cinta="…"]`. Textos para la redacción: qué es cada cosa y para qué sirve.
 *
 * La cinta del sitio se llena sola (`GET /cinta`, ver `cinta_service.py` en el backend):
 * lo que se guarde en esta página la sustituye entera mientras tenga alguna cifra, y
 * vaciarla devuelve la automática. La guía lo dice así aunque la página aún hable de
 * «no hay conexión con ningún mercado».
 *
 * Abajo, las monedas de la región (`components/admin/MonedasDelPanel.jsx`): lo que se
 * publica de cada una, las cotizaciones que no cuadraron y esperan a una persona, y las
 * ocultas (con quién y cuándo, y «Deshacer»).
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_CINTA = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "La cinta de mercado es la franja que corre arriba del todo en el sitio, con cifras de cierre. " +
      "Normalmente se llena sola: el dólar y el euro del BCV, el índice de la Bolsa de Caracas y las " +
      "monedas de la región, que salen de sus bancos centrales o, si un banco no responde, de un servicio " +
      "de respaldo. Una cifra de hace más de dos días hábiles " +
      "no sale. Esta página es para el día en que haga falta fijar las cifras a mano, por ejemplo con una " +
      "devaluación: lo que se guarde aquí sustituye a toda la parte automática.",
    puntos: [
      "Los mercados del mundo: el petróleo, el oro y los demás que acompañan a la cinta no dependen de esta página.",
    ],
  },
  {
    clave: "sello",
    titulo: "El sello",
    texto:
      "La nota pequeña que acompaña a las cifras escritas a mano. Dice de qué cierre son y de dónde salen, " +
      "para que nadie las lea como datos en vivo. Solo se ve mientras la cinta va a mano.",
    puntos: [
      "Texto del sello: por ejemplo, «Al cierre · 19 ago · Rendivalores».",
      "Enlace de la fuente: opcional. Si se pone, el sello lleva a esa página.",
    ],
  },
  {
    clave: "cifras",
    titulo: "Las cifras",
    texto: "Cada fila es una cifra de la cinta, en el orden en que va a pasar.",
    puntos: [
      "Qué es: el nombre corto que se lee en la cinta, como USD/VES.",
      "Cuánto marca: la cifra tal como debe leerse, con su coma.",
      "Cómo se movió: si subió, bajó o quedó igual. Se guarda con la cifra, aunque hoy la cinta del sitio no dibuja la flecha de las cifras escritas a mano.",
      "Flechas ↑ y ↓: cambian el orden.",
      "Quitar: saca la fila de la tabla.",
      "Añadir una cifra: una fila nueva al final.",
      "Filas a medias: las que no tienen nombre o cifra no se guardan.",
    ],
  },
  {
    clave: "guardar",
    titulo: "Guardar la cinta",
    texto:
      "Nada de lo de arriba cambia el sitio hasta pulsar aquí. Al guardar, la cinta entera pasa a ser lo " +
      "que hay en la tabla: lo que no está, desaparece. Los lectores lo ven en cuanto cargan una página, " +
      "en un minuto como mucho.",
    puntos: ["Volver a la cinta automática: quitar todas las filas (o dejarlas vacías) y guardar."],
  },
  {
    clave: "monedas",
    titulo: "Las monedas de la región",
    texto:
      "Cuánto vale un dólar en cada moneda. Se leen solas cada hora, y cada cifra se compara antes de " +
      "publicarse: si está fuera de lo normal para esa moneda, o salta mucho de una lectura a la siguiente, " +
      "no sale. En el sitio sigue la última buena, con su fecha, y al equipo le llega un aviso por el bot de Telegram.",
    puntos: [
      "Última lectura: cuándo se leyeron por última vez y qué bancos no respondieron.",
      "El bolívar admite saltos más grandes que las demás, porque una devaluación puede ser de verdad.",
    ],
  },
  {
    clave: "sospechosas",
    titulo: "Las cotizaciones que no cuadran",
    texto:
      "Aquí esperan las cifras que no se publicaron. Cada fila dice qué se leyó, de dónde, por qué no cuadra " +
      "y qué se está enseñando mientras tanto. Si varias lecturas seguidas de la misma fuente fallan, salen " +
      "juntas en una fila y lo que se decida vale para todas.",
    puntos: [
      "Aceptar como buena: si la cifra es real, por ejemplo con una devaluación. Se publica y la próxima lectura se compara con ella.",
      "Ocultar esta cotización: si es un error del banco o de la lectura. No se publica, y si la fuente vuelve a dar la misma cifra en los próximos días, tampoco: se guarda oculta sin volver a preguntar.",
      "Un aviso por el bot cuando empieza una racha, y un recordatorio al día mientras quede algo sin decidir.",
      "Lo que se decide aquí se ve en todas partes en unos minutos.",
    ],
  },
  {
    clave: "publicadas",
    titulo: "Lo que se publica ahora",
    texto:
      "La cifra de cada moneda que ven los lectores en la página de monedas, el cintillo, las piezas y el resumen, " +
      "con su fuente y la fecha del dato.",
    puntos: [
      "Ocultar esta cotización: para una cifra mala que se coló. Vuelve a verse la buena de antes, también en el cintillo.",
      "Viejo, no sale: el último dato tiene más de dos días hábiles y no se enseña.",
    ],
  },
  {
    clave: "ocultas",
    titulo: "Las cotizaciones ocultas",
    texto:
      "Lo que alguien ocultó en los últimos 30 días: qué cifra, quién la ocultó y cuándo. Por si fue un error.",
    puntos: [
      "Deshacer: la decisión entera vuelve atrás. Si eran lecturas que no cuadraban, vuelven arriba para decidir otra vez; si era una cifra publicada, vuelve a publicarse.",
    ],
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoCinta = crearRecorrido("cinta", PASOS_CINTA);
