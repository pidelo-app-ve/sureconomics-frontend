/**
 * El puente entre El Analista y SurEconomics.
 *
 * El juego no sabe de cuentas ni de nuestra API: lee tres enganches de `window`, que
 * su equipo dejó para esto, y aquí se los damos.
 *
 * - `window.__REGISTRO`: la lista del ranking. La lee **al pintar**, así que tiene que
 *   estar puesta antes de montar el juego (la página espera a tenerla).
 * - `window.__puedeAnotar()`: promesa de si se puede anotar. Es `true` siempre que la API
 *   responda, también sin sesión: así el juego enseña el botón, y al pulsarlo nosotros
 *   explicamos que hace falta cuenta.
 * - `window.__anotarCarrera(entrada)`: promesa que resuelve `null` si se anotó o un
 *   motivo si no. Nunca rechaza: el juego no tiene por qué saber de errores HTTP.
 *
 * Y la carrera **pendiente**: la de quien pulsó «Anotar» sin cuenta. Se guarda en este
 * navegador con su clave de idempotencia y se anota sola al volver ya con sesión; si se
 * reintenta con la misma clave, el servidor no la cuenta dos veces.
 */

const PENDIENTE = "se_analista_pendiente";
/** Una carrera pendiente de hace más de un día ya no es «la que acabo de jugar». */
const CADUCA_MS = 24 * 3600 * 1000;

export const guardarPendiente = (entrada, clave) => {
  try {
    window.localStorage.setItem(PENDIENTE, JSON.stringify({ entrada, clave, desde: Date.now() }));
  } catch {
    /* sin almacenamiento, al volver no habrá nada que anotar */
  }
};

export const leerPendiente = () => {
  try {
    const p = JSON.parse(window.localStorage.getItem(PENDIENTE) || "null");
    if (!p || typeof p !== "object" || !p.entrada || !p.clave) return null;
    if (!(Date.now() - Number(p.desde) < CADUCA_MS)) {
      window.localStorage.removeItem(PENDIENTE);
      return null;
    }
    return p;
  } catch {
    return null;
  }
};

export const borrarPendiente = () => {
  try {
    window.localStorage.removeItem(PENDIENTE);
  } catch {
    /* nada que borrar */
  }
};

/**
 * Pone los tres enganches. `anotar(entrada)` lo da la página, que sabe de la sesión.
 * Devuelve la función que los quita, para cuando se sale de la página.
 */
export const instalarPuente = ({ registro, disponible, anotar }) => {
  window.__REGISTRO = Array.isArray(registro) ? registro : [];
  window.__puedeAnotar = () => Promise.resolve(Boolean(disponible));
  window.__anotarCarrera = (entrada) => {
    try {
      return Promise.resolve(anotar(entrada)).catch(() => "fallo");
    } catch {
      return Promise.resolve("fallo");
    }
  };
  return () => {
    delete window.__REGISTRO;
    delete window.__puedeAnotar;
    delete window.__anotarCarrera;
  };
};

/** Tras anotar, el ranking nuevo: el juego lo lee en su próximo pintado. */
export const actualizarRegistro = (registro) => {
  if (Array.isArray(registro)) window.__REGISTRO = registro;
};
