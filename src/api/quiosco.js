/**
 * Qué lecturas de la API salen por el «quiosco»: `/datos`, en este mismo dominio, que
 * Vercel reescribe hacia la API y guarda unos segundos en su borde (`vercel.json`).
 *
 * Por qué: cada visita a la portada hacía 25-35 preguntas directas al único proceso de la
 * API en Render, y ninguna se guardaba en ningún sitio (auditoría 17-nov-2026, tanda 2).
 * Las que son iguales para todos los lectores ahora las contesta el borde: a Render le
 * llega una por región cada medio minuto o cinco, en vez de una por lector. Y al ir por
 * el mismo dominio que la página, el navegador reutiliza la conexión que ya tiene abierta
 * en vez de abrir otra hacia Render.
 *
 * Solo lecturas (GET), sin sesión y de esta lista cerrada. Lo demás (la sesión, el panel,
 * la publicidad, las estadísticas) sigue yendo directo a la API: guardarlo en el borde
 * daría los datos de una persona a otra. La misma lista, regla por regla, está en
 * `vercel.json`; si se añade aquí una ruta, hay que añadirla allí (lo que el cliente mande a
 * `/datos` sin regla allí acabaría en la 404 del sitio, `api/no-encontrada.js`).
 *
 * Sin importaciones, para poder probarlo con `node` solo (`quiosco.test.mjs`).
 */

/** El prefijo en este dominio. En local, `vite.config.js` lo manda a la API local. */
export const RUTA_DEL_QUIOSCO = "/datos";

/**
 * Se puede apagar sin tocar código: `VITE_QUIOSCO=no` en Vercel y volver a desplegar, y
 * todo vuelve a ir directo a la API como antes. (`import.meta.env` no existe en Node.)
 */
export const QUIOSCO_ENCENDIDO = import.meta.env?.VITE_QUIOSCO !== "no";

/** Dónde pedir: el quiosco de esta página, o nulo fuera del navegador (pruebas, Vercel). */
export const baseDelQuiosco = () =>
  QUIOSCO_ENCENDIDO && typeof window !== "undefined" && window.location?.origin
    ? `${window.location.origin}${RUTA_DEL_QUIOSCO}`
    : null;

/**
 * Las rutas (sin la consulta) que se pueden guardar. Cada una tiene su `s-maxage` en la
 * API: si no lo tuviera, el borde no la guardaría, pero tampoco pasaría nada malo.
 */
const LECTURAS_PUBLICAS = [
  /^\/posts$/, // el listado, con sus filtros en la consulta
  /^\/posts\/[^/]+$/, // la ficha de una pieza (no sus comentarios ni sus documentos)
  /^\/(formats|topics|places)$/,
  /^\/cinta$/,
  /^\/monedas(\/[^/]+\/historia)?$/,
  // Solo la lista: `/headlines/version` va directa, porque es la que avisa de que la
  // sección se ocultó y eso no puede esperar a que caduque el borde.
  /^\/headlines$/,
  /^\/canal$/,
  /^\/social$/,
  /^\/lvbp\/[^/]+$/,
  /^\/analitica\/mas-leidas$/,
  /^\/resumen\/(ultimo|\d{4}-\d{2}-\d{2}(\/[^/]+)?)$/,
  /^\/juegos\/clave\/[^/]+$/,
  /^\/equipo(\/fotos)?$/,
];

/**
 * Si esta petición sale por el quiosco.
 *
 * @param {string} ruta La ruta de la API, sin la consulta (`/posts`, `/resumen/ultimo`).
 * @param {{ method?: string, headers?: Record<string, string>, enNavegador?: boolean }} [opciones]
 *   `enNavegador`: en Node (las pruebas, `api/pieza.js`) no hay dominio propio al que
 *   pedir, así que se va directo a la API.
 */
export const vaPorElQuiosco = (ruta, { method = "GET", headers = {}, enNavegador = true } = {}) => {
  if (!enNavegador) return false;
  if (String(method).toUpperCase() !== "GET") return false;
  const conSesion = Object.keys(headers ?? {}).some((h) => h.toLowerCase() === "authorization");
  if (conSesion) return false;
  const limpia = String(ruta ?? "").split("?")[0];
  return LECTURAS_PUBLICAS.some((patron) => patron.test(limpia));
};

/* —— Lo que ya viene dentro del HTML ——

   `api/portada.js` sirve la portada con la respuesta de su primera lectura dentro, en un
   `<script type="application/json" id="se-portada">`: lo mismo que contestaría el quiosco,
   para que la página no lo vuelva a pedir al cargar y pinte en cuanto llega el JavaScript
   (plan del 23-nov-2026, B8). Igual que `se-pieza` en las piezas: un `<script>` de datos
   no se ejecuta, así que la política de seguridad (CSP) no tiene que permitir scripts en
   línea.

   El bloque dice qué lectura contesta y cuándo se armó (`{ lectura, generada, respuesta }`),
   y quien lo toma comprueba que es la que iba a pedir. Si no está, es de otra lectura o no
   se puede leer, se pide como siempre. Si es viejo (`vieja`), se pinta igual y se pide el
   de ahora por detrás: así no se borra lo que ya se ve para enseñar «Cargando…». */

/**
 * La lectura de la portada: la primera página del listado, sin filtros, escrita como la
 * arma `getPieces` (`page` y después `limit`). Es también la clave del borde: la función
 * la pide así para que la portada del navegador y la del servidor calienten la misma copia.
 */
export const LISTADO_DE_LA_PORTADA = "/posts?page=1&limit=100";

/** Dónde viaja dentro del HTML de la portada. */
export const ID_DE_LA_PORTADA = "se-portada";

/**
 * Los titulares de Última hora que pinta la portada encima de la apertura, como los pide
 * `getTitulares` la primera vez (`features/titulares`): también vienen en el HTML, para que
 * la columna no cambie de alto al llegar (y empuje la apertura) después de montar.
 */
export const ultimaHoraDeLaPortada = (lang) => `/headlines?lang=${lang}&limit=40`;

/** Dónde viajan dentro del HTML de la portada. */
export const ID_DE_ULTIMA_HORA = "se-ultima-hora";

/**
 * Hasta cuándo es nuevo lo que trae el HTML. El borde guarda la portada medio minuto, y uno
 * más mientras la renueva; pero si la función fallara, sirve la de antes hasta un día
 * (`stale-if-error`). Con solo los datos de entonces la página se quedaría en la portada de
 * ayer: más viejo que esto, quien lo usa pide además el de ahora. Diez minutos y no dos,
 * por los relojes de los teléfonos, que no siempre van en hora (con uno adelantado, el
 * bloque parece viejo: se pinta igual y se vuelve a pedir, que es lo seguro).
 */
export const VIGENCIA_EN_EL_HTML_MS = 10 * 60_000;

/**
 * Lo que trajo el HTML para `lectura`: `{ respuesta, generada, vieja }`, o nulo (no está, es
 * de otra lectura o no se puede leer). `generada` es cuándo se armó (en ms, o `NaN` si no lo
 * dice) y `vieja`, si no es de los últimos `VIGENCIA_EN_EL_HTML_MS`. Solo lee: React, en modo
 * estricto, prepara dos veces el estado inicial, y si se quitara aquí la segunda vez ya no
 * estaría. Quien la usa la quita después con `soltarDelHtml`.
 */
export const leerDelHtml = (id, lectura, ahora = Date.now()) => {
  try {
    const nodo = typeof document === "undefined" ? null : document.getElementById(id);
    const bloque = nodo ? JSON.parse(nodo.textContent || "null") : null;
    if (bloque?.lectura !== lectura || bloque.respuesta == null) return null;
    const generada = Date.parse(bloque.generada);
    return { respuesta: bloque.respuesta, generada, vieja: !(Math.abs(ahora - generada) < VIGENCIA_EN_EL_HTML_MS) };
  } catch {
    return null;
  }
};

/**
 * Quita del documento la que ya se usó. Vale una vez, al llegar: si el lector vuelve a la
 * portada más tarde, sin recargar, se pide al quiosco y no se le enseña la de entonces.
 */
export const soltarDelHtml = (id) => {
  try {
    document.getElementById(id)?.remove();
  } catch {
    // Sin documento (Node): no hay nada que quitar.
  }
};
