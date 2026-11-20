/**
 * Los pasos de la guía que explican las monedas del panel (`admin/components/MonedasDelPanel.jsx`).
 *
 * No son una guía aparte: van dentro de la de «Cinta de mercado»
 * (`lib/guias/guiaCinta.js`), que es la página donde vive el panel de monedas, y se
 * iluminan con sus anclas (`ancla("monedas")`, `ancla("sospechosas")`…). Viven aquí para
 * que quien cambie el panel tenga sus textos al lado.
 *
 * Solo datos, sin JSX ni importaciones: los lee también la prueba de las guías, que corre
 * en node sin compilar nada (`npm run test:recorrido`). Por eso la cinta los importa de
 * este archivo y no de `index.js` (ver `src/arquitectura.test.mjs`).
 */
export const PASOS_MONEDAS_DEL_PANEL = [
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
];
