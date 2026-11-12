/**
 * La guía de «Audiencia» (`pages/admin/AdminAnalitica.jsx`). Anclajes:
 * `[data-tour-audiencia="…"]`. Los textos son para la redacción y para quien lleva el
 * negocio: qué dice cada número y hasta dónde se le puede creer, sin jerga.
 */
import { crearRecorrido } from "../recorridoVista.js";

export const PASOS_AUDIENCIA = [
  {
    titulo: "Qué hay en esta página",
    texto:
      "Cuánta gente lee el sitio, qué lee, de dónde llega y si vuelve. Lo cuenta el propio sitio, sin " +
      "herramientas de otras empresas, y solo a quien aceptó las cookies: por eso casi todo lo de aquí " +
      "es un mínimo. El bloque «Audiencia real estimada» dice cuánto queda fuera.",
  },
  {
    clave: "periodo",
    titulo: "El periodo",
    puntos: [
      "7, 30 o 90 días: cambia todos los bloques de la página a la vez. Cuenta hoy y los días anteriores.",
      "Actualizar: vuelve a pedir los datos sin perder el periodo que estaba mirando.",
    ],
  },
  {
    clave: "descarga",
    titulo: "Descargar el informe",
    texto:
      "Baja una hoja de cálculo (se abre con Excel o con Google Sheets) con lo mismo que esta página y " +
      "sin recortes: todas las piezas leídas y no solo las quince primeras, las semanas, los países, " +
      "las fuentes. La última pestaña explica cómo leer cada columna.",
    puntos: [
      "Estos días: el periodo que tiene elegido arriba.",
      "Todo lo guardado: hasta catorce meses atrás, que es lo que se conserva.",
    ],
  },
  {
    clave: "directo",
    titulo: "Leyendo ahora",
    texto:
      "Las visitas activas en los últimos cinco minutos y en qué páginas están. Se actualiza solo cada " +
      "veinte segundos.",
  },
  {
    clave: "fichas",
    titulo: "Las cifras del periodo",
    puntos: [
      "Visitas: cada vez que alguien entra al sitio. Si vuelve tras media hora sin tocar nada, es otra visita.",
      "Navegadores distintos: lo más parecido a «personas». La misma persona en el teléfono y en la computadora cuenta dos veces.",
      "Sube de verdad, baja de verdad o puede ser casualidad: el tráfico se mueve solo de un día a otro. Si el cambio frente al periodo anterior es más pequeño que ese vaivén, no se puede afirmar que algo haya cambiado.",
      "La leyeron entera: de las lecturas de texto, en cuántas el lector estuvo delante el tiempo que hace falta para leer la pieza completa, leyendo deprisa.",
      "Se van en la primera: vieron una sola página y salieron.",
    ],
  },
  {
    clave: "real",
    titulo: "Audiencia real estimada",
    texto:
      "Quien no acepta las cookies no se mide, pero sus páginas sí se suman a un contador que no guarda " +
      "nada de la persona. Con ese contador se calcula cuántas visitas hay de verdad. Sale un rango y " +
      "no una cifra, porque es una estimación: la punta baja supone que esa gente navega igual que la " +
      "que se mide, y la alta, que cada vez que se abre el sitio es una visita distinta.",
  },
  {
    clave: "cookies",
    titulo: "El aviso de cookies",
    texto:
      "Cuántos aceptan y cuántos rechazan la medición, por día. Si la tasa de aceptación baja, todo lo " +
      "demás de la página baja con ella sin que haya menos lectores.",
  },
  {
    clave: "serie",
    titulo: "Visitas por día",
    texto:
      "Cada día del periodo. Pase el ratón por encima para ver un día concreto; el punto marcado es el " +
      "mejor día. El botón «Tabla» de cada bloque enseña los mismos datos en números.",
  },
  {
    clave: "mes",
    titulo: "Cómo va el mes",
    texto:
      "Las visitas que lleva el mes en curso y en cuánto cerraría si sigue a este ritmo. Tiene en cuenta " +
      "que no entra lo mismo un lunes que un domingo. Es una proyección: por eso va con un mínimo y un " +
      "máximo, y no aparece hasta que hay dos semanas medidas. No depende del periodo elegido arriba.",
  },
  {
    clave: "lecturas",
    titulo: "Cuánto leen y a qué hora",
    puntos: [
      "Cuánto duran las lecturas: cuántas se quedaron unos segundos y cuántas varios minutos. Solo cuenta el tiempo con la pieza a la vista.",
      "A qué hora leen: las visitas por hora del día, en su hora local. Sirve para decidir cuándo publicar.",
    ],
  },
  {
    clave: "origen",
    titulo: "De dónde llegan",
    texto:
      "Por dónde entró cada visita. De la página anterior solo se guarda el nombre del sitio («Google», " +
      "«WhatsApp»), nunca lo que la persona buscó ni la dirección completa.",
    puntos: [
      "Buscadores: Google, Bing y parecidos.",
      "Asistentes de IA: ChatGPT, Perplexity, Gemini y otros que enlazan al sitio.",
      "Redes sociales y Mensajería: Instagram, X, Facebook; WhatsApp y Telegram.",
      "Directo: escribió la dirección, la tenía guardada o la aplicación no dice de dónde viene. Mucho de WhatsApp cae aquí.",
      "Altas al boletín: cuántas personas se apuntaron al boletín habiendo llegado por ese canal.",
    ],
  },
  {
    clave: "paises",
    titulo: "Desde qué país y con qué aparato",
    texto:
      "El país se deduce de la hora que marca el aparato del lector, no de su conexión: la dirección de " +
      "internet no se guarda. Un venezolano en Madrid cuenta como España. El aparato es una de tres " +
      "palabras: móvil, tableta o computadora.",
  },
  {
    clave: "piezas",
    titulo: "Lo más leído",
    texto:
      "Las quince piezas con más lecturas del periodo, con su tiempo medio y qué parte de los lectores " +
      "la terminó. Encima, las lecturas por sección. La lista completa está en el informe.",
  },
  {
    clave: "vuelven",
    titulo: "Cuántos vuelven",
    texto:
      "De quienes vinieron una semana, cuántos volvieron la semana siguiente. Es la medida de si el " +
      "sitio crea costumbre. Mira siempre las últimas semanas, sea cual sea el periodo elegido arriba. " +
      "Sale por debajo de la realidad: quien borra las cookies o cambia de aparato vuelve como si " +
      "fuera nuevo.",
  },
  {
    clave: "salidas",
    titulo: "Por dónde se van",
    texto: "La última página de cada visita. Si una se repite mucho, algo termina ahí.",
  },
  {
    clave: "guia",
    titulo: "Vuelve aquí cuando quieras",
    texto: "Este botón abre esta guía otra vez.",
  },
];

export const recorridoAudiencia = crearRecorrido("audiencia", PASOS_AUDIENCIA);

/** El atributo que marca un elemento como parada de la guía: `{...ancla("fichas")}`. */
export const ancla = (clave) => (clave ? { [recorridoAudiencia.atributo]: clave } : {});
