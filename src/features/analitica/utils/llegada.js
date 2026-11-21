/**
 * Por dónde llegó una visita, visto desde el navegador: funciones puras.
 *
 * Están aparte de `analitica.js` para poder probarlas sin navegador
 * (`npm run test:llegada`). Lo que tienen en común es que **reducen**: de cada dato que
 * el navegador conoce sale lo mínimo que hace falta saber, y lo demás no viaja. El
 * servidor vuelve a reducirlo (`analitica_origen`, en el backend) y lo que se guarda es
 * un canal, un nombre, un país y un aparato.
 */

/** Lo más largo que se manda de una etiqueta de campaña; el servidor acota de nuevo. */
export const MAX_ETIQUETA = 60;

const APP_DE_ANDROID = new RegExp("^android-app://([a-z0-9._-]+)", "i");

const sinWww = (sitio) => String(sitio || "").toLowerCase().replace(/^www[.]/, "");

/**
 * El sitio desde el que se llegó: su dominio y nada más.
 *
 * `document.referrer` trae la dirección entera de la página anterior -- con lo que se
 * buscó, si venía de un buscador que lo ponga --, y de ahí no sale del navegador más
 * que el nombre del sitio. Android dice además desde qué aplicación se abrió el enlace
 * (`android-app://com.whatsapp/`), que es la única pista de lo que llega por mensajería.
 *
 * Venir de otra página del propio sitio no es llegar de fuera: `null`, como quien
 * escribe la dirección.
 */
export const sitioDeOrigen = (anterior, propio) => {
  if (typeof anterior !== "string" || !anterior) return null;
  const app = APP_DE_ANDROID.exec(anterior);
  if (app) return `app:${app[1].toLowerCase()}`;
  try {
    const { protocol, hostname } = new URL(anterior);
    if (protocol !== "http:" && protocol !== "https:") return null;
    const sitio = hostname.toLowerCase();
    if (!sitio || sinWww(sitio) === sinWww(propio)) return null;
    return sitio;
  } catch {
    return null;
  }
};

/**
 * Una etiqueta de campaña de la dirección con la que se entró: `?utm_source=boletin`.
 * Es lo que alguien escribió a propósito en el enlace para decir de dónde viene.
 */
export const etiquetaDeCampana = (consulta, nombre) => {
  try {
    const valor = new URLSearchParams(consulta || "").get(nombre);
    return valor ? valor.trim().slice(0, MAX_ETIQUETA) || null : null;
  } catch {
    return null;
  }
};

/**
 * Móvil, tableta o computadora.
 *
 * El agente de usuario se mira en el navegador y no viaja: lo que sale es una de tres
 * palabras. `toques` es `navigator.maxTouchPoints` y `movil` lo que diga
 * `navigator.userAgentData`, donde exista.
 */
export const aparatoDe = ({ agente = "", toques = 0, movil = false } = {}) => {
  const es = (patron) => patron.test(String(agente || ""));
  // Un iPad moderno se presenta como un Mac; lo delata la pantalla táctil.
  if (es(/iPad/i) || (es(/Macintosh/i) && toques > 1)) return "tableta";
  // «Tablet PC» era un Windows de escritorio, no una tableta.
  if (es(/Tablet(?! PC)|PlayBook|Silk|Kindle/i)) return "tableta";
  if (es(/Android/i)) return es(/Mobile/i) ? "movil" : "tableta";
  if (movil || es(/iPhone|iPod|Mobile|IEMobile|Opera Mini/i)) return "movil";
  return "computadora";
};

/** Sin los huecos: lo que no se sabe no se manda. */
const sinHuecos = (objeto) => Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor));

/**
 * El bloque `llegada` que acompaña a una página vista.
 *
 * El sitio de origen y la campaña valen solo para la visita con la que se cargó el
 * sitio (`esLaDeLlegada`). Quien deja la pestaña abierta y vuelve a ella dos horas
 * después empieza otra visita, y esa no llegó desde Google: ya estaba aquí. La zona
 * horaria y el aparato sí van siempre, porque no cambian.
 */
export const bloqueDeLlegada = ({ origen = {}, esLaDeLlegada = false, zona = null, dispositivo = null } = {}) =>
  sinHuecos({ ...(esLaDeLlegada ? origen : {}), zona, dispositivo });
