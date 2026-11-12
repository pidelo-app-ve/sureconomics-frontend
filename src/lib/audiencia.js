/**
 * Con qué palabras escribe sus números la pantalla de audiencia
 * (`pages/admin/AdminAnalitica.jsx` y `components/admin/audiencia/`).
 *
 * Funciones puras -- sin React, sin red y sin reloj: lo que haga falta entra por los
 * argumentos --, así se prueban con números escritos a mano (`audiencia.test.mjs`).
 *
 * Los nombres de canal y de aparato son los mismos que lleva el informe descargable
 * (`analitica_informe.py`): quien mira la pantalla y luego abre la hoja de cálculo
 * tiene que encontrarse las mismas palabras.
 */

export const NOMBRE_FORMATO = {
  noticias: "Noticias",
  articulos: "Artículos",
  editorial: "Editorial",
  entrevistas: "Entrevistas",
  informes: "Informes",
  podcast: "Podcast",
};

export const NOMBRE_CANAL = {
  buscador: "Buscadores",
  ia: "Asistentes de IA",
  redes: "Redes sociales",
  mensajeria: "Mensajería",
  correo: "Correo y boletín",
  otros: "Otros sitios",
  directo: "Directo",
  "sin-dato": "Sin dato",
};

export const NOMBRE_APARATO = { movil: "Móvil", tableta: "Tableta", computadora: "Computadora" };

/** Las fuentes que el servidor guarda con una palabra y se escriben de otra manera. */
const NOMBRE_FUENTE = {
  google: "Google",
  "google-noticias": "Google Noticias",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  yahoo: "Yahoo",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  copilot: "Copilot",
  claude: "Claude",
  deepseek: "DeepSeek",
  grok: "Grok",
  "meta-ai": "Meta AI",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  gmail: "Gmail",
  outlook: "Outlook",
  boletin: "Nuestro boletín",
};

export const nombreDeCanal = (canal) => NOMBRE_CANAL[canal] ?? canal ?? NOMBRE_CANAL["sin-dato"];

/**
 * «google» -> «Google»; un dominio o una etiqueta de campaña que no se conoce se enseña
 * tal cual, y una visita sin fuente lleva el nombre de su canal («Directo»).
 */
export const nombreDeFuente = (fuente, canal) => {
  if (typeof fuente !== "string" || !fuente) return nombreDeCanal(canal);
  return NOMBRE_FUENTE[fuente] ?? fuente;
};

export const numero = (n) => new Intl.NumberFormat("es").format(Math.round(n || 0));

/** 95 -> «1 min 35 s». Un promedio en segundos sueltos no se lee de un vistazo. */
export const duracion = (segundos) => {
  const n = Math.max(0, Math.round(segundos || 0));
  if (n < 60) return `${n} s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
};

/** `null` -> `null` (la ficha dibuja una raya); 37 -> «37 %». */
export const porciento = (n) => (typeof n === "number" && Number.isFinite(n) ? `${n} %` : null);

/** «hace 40 s», «hace 3 min». Dice cuándo se miró, que en un panel en vivo es la mitad. */
export const desdeHace = (marca, ahora) => {
  const s = Math.max(0, Math.round((ahora - marca) / 1000));
  if (s < 10) return "recién actualizado";
  if (s < 60) return `actualizado hace ${s} s`;
  const m = Math.round(s / 60);
  return `actualizado hace ${m} min`;
};

const fechaDe = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const diaCorto = (iso) => {
  const d = fechaDe(iso);
  return d ? d.toLocaleDateString("es", { day: "numeric", month: "short" }) : iso;
};

export const diaLargo = (iso) => {
  const d = fechaDe(iso);
  return d ? d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }) : iso;
};

/** «3 nov – 9 nov»: una semana, o cualquier tramo de días, en una línea. */
export const tramo = (desde, hasta) => `${diaCorto(desde)} – ${diaCorto(hasta)}`;

/** «2026-11» -> «noviembre». */
export const nombreDelMes = (mes) => {
  const d = fechaDe(`${mes}-01`);
  return d ? d.toLocaleDateString("es", { month: "long" }) : mes;
};

/** «entre 1.200 y 1.900»; si las dos puntas coinciden, «unas 1.200». */
export const rango = (minimo, maximo) =>
  Math.round(minimo) === Math.round(maximo)
    ? `unas ${numero(minimo)}`
    : `entre ${numero(minimo)} y ${numero(maximo)}`;

const conSigno = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)} %`;

/**
 * Lo que se escribe debajo de una cifra al compararla con el periodo anterior.
 *
 * Entra lo que calcula el servidor (`analitica_calculos.comparar`): el cambio de la
 * media por día, el margen -- cuánto se mueve el tráfico solo, de unos días a otros --
 * y el veredicto. Sale `{ clase, cambio, veredicto }`:
 *
 * - `clase`: `sube` o `baja` solo cuando el cambio se sale del margen. Un +4 % con un
 *   margen de ±9 % va en `igual`, sin color: pintarlo de verde sería celebrar el azar.
 * - `cambio`: «+18 % al día frente al periodo anterior».
 * - `veredicto`: la frase que dice si es de fiar.
 *
 * Devuelve `null` si no hay con qué comparar (un servidor más viejo que la pantalla, o
 * un periodo anterior vacío): quien llama decide qué enseñar entonces.
 */
export const leerComparacion = (c) => {
  if (!c || typeof c.veredicto !== "string") return null;
  if (c.veredicto === "sin_datos") {
    return {
      clase: "nuevo",
      cambio: null,
      veredicto: "Aún no hay días suficientes para saber si cambió.",
    };
  }
  if (typeof c.cambio !== "number" || typeof c.margen !== "number") return null;
  const cambio = `${conSigno(c.cambio)} al día frente al periodo anterior`;
  const vaiven = `el vaivén normal es de ±${c.margen} %`;
  if (c.veredicto === "sube") {
    return { clase: "sube", cambio, veredicto: `Sube de verdad: ${vaiven}.` };
  }
  if (c.veredicto === "baja") {
    return { clase: "baja", cambio, veredicto: `Baja de verdad: ${vaiven}.` };
  }
  return { clase: "igual", cambio, veredicto: `Puede ser casualidad: ${vaiven}.` };
};

/**
 * Las visitas por canal con las altas al boletín de cada uno al lado.
 *
 * Son dos listas del servidor que no tienen por qué traer los mismos canales: puede
 * haber altas de un canal sin visitas en el periodo (la visita empezó antes) y, sobre
 * todo, altas «sin dato» de visitas anteriores a que se guardara el origen. Esas se
 * devuelven aparte, que es como las pone el informe descargable.
 */
export const canalesConAltas = (canales, porCanal) => {
  const altas = new Map();
  for (const f of porCanal ?? []) {
    if (f && typeof f.canal === "string") altas.set(f.canal, Number(f.altas) || 0);
  }
  const filas = (canales ?? []).map((f) => {
    const suyas = altas.get(f.canal) ?? 0;
    altas.delete(f.canal);
    return { canal: f.canal, sesiones: f.sesiones, porcentaje: f.porcentaje, altas: suyas };
  });
  const altasSinDato = altas.get("sin-dato") ?? 0;
  altas.delete("sin-dato");
  for (const [canal, n] of altas) filas.push({ canal, sesiones: 0, porcentaje: null, altas: n });
  return { filas, altasSinDato };
};

const dosCifras = (n) => String(n).padStart(2, "0");
const isoLocal = (d) => `${d.getFullYear()}-${dosCifras(d.getMonth() + 1)}-${dosCifras(d.getDate())}`;

/** Lo más que se puede pedir: lo que el servidor conserva (catorce meses). */
export const DIAS_GUARDADOS = 425;

/**
 * El nombre del archivo del informe: `sureconomics-audiencia-<desde>-a-<hasta>.xlsx`.
 *
 * Lo pone el panel y no el servidor porque están en dominios distintos y el navegador
 * no deja leer la cabecera con el nombre. Es el mismo que el servidor propone: hoy y
 * los `dias - 1` anteriores, en el día de quien descarga.
 */
export const nombreDelInforme = (dias, hoy = new Date()) => {
  const n = Math.max(1, Math.min(Math.round(Number(dias) || 30), DIAS_GUARDADOS));
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (n - 1));
  return `sureconomics-audiencia-${isoLocal(desde)}-a-${isoLocal(hoy)}.xlsx`;
};

/** «1.200 – 1.900», para una ficha: lo mismo que `rango` sin las palabras. */
export const rangoCorto = (minimo, maximo) =>
  Math.round(minimo) === Math.round(maximo) ? numero(minimo) : `${numero(minimo)} – ${numero(maximo)}`;
