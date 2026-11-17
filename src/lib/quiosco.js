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
 * `/datos` sin regla allí acabaría en el `index.html` del sitio).
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
