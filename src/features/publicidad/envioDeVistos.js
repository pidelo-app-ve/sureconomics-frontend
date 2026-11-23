/**
 * Cómo salen hacia el servidor las impresiones de publicidad: lo que se factura. Sin
 * navegador (lo que toca `navigator` o el reloj llega de fuera), y por eso tiene pruebas:
 * `npm run test:lotes`. Lo usa `reportarVisto`, en `api.js`.
 *
 * ## Las cuatro reglas
 *
 * **1. La primera de cada página sale al momento, sola**, a `/publicidad/visto`, como
 * siempre. Quien entra y se va a los dos segundos ya contó.
 *
 * **2. Las rotaciones se juntan**: esperan como mucho `ESPERA_MAXIMA_MS` a las que vengan
 * detrás y salen en un envío a `/publicidad/vistos` (una ficha por línea). Al ocultar o
 * cerrar la pestaña sale todo en el acto.
 *
 * **3. Da igual qué se despliegue antes, o qué se revierta.** `/vistos` es una ruta
 * nueva; `/visto` no cambió. Con la pestaña a la vista, el lote va **siempre** por
 * `fetch`, que ve la respuesta: con 404 (un backend anterior, o uno que se revirtió
 * mientras la pestaña estaba abierta) ese lote sale otra vez ficha a ficha a `/visto` y
 * se recuerda «no» durante la sesión; con 2xx se recuerda «sí». `sendBeacon`, que no ve
 * la respuesta, queda solo para cuando la pestaña se oculta o se cierra: entonces el lote
 * va a `/vistos` si se sabe que existe, y si no, ficha a ficha a `/visto`, que vale con
 * cualquier backend.
 *
 * Lo que se acepta perder: si la pestaña se cierra con el **primer** `fetch` del primer
 * lote aún en vuelo, justo en la ventana en que el backend no tiene `/vistos` (un
 * despliegue a medias o una vuelta atrás), ese lote no llega a saber que fue 404 y no se
 * reenvía. Y lo mismo con un lote que sale por beacon al cerrar, si el backend se
 * revirtió después de que esta pestaña aprendiera «sí». Son rotaciones de una pestaña, en
 * los minutos que dura un despliegue.
 *
 * **4. Juntar no cambia lo que cuenta el cupo de 30 s.** El servidor cuenta una vista por
 * dirección, pieza y hueco cada 30 s (`VISTAS_POR_DIRECCION`) **según cuándo llegan**. Al
 * retrasar unas y no otras, dos vistas de la misma pieza en el mismo hueco podrían llegar
 * más juntas o más separadas de lo que se vieron, y el cupo decidiría distinto. Por eso
 * cada pieza (por su `clave`) recuerda cuándo se vio y cuándo salió la anterior:
 * - si esta se vio a **menos** de 30 s de la anterior, sale ya (llega a menos de 30 s,
 *   como habría llegado antes, y el cupo la descarta igual);
 * - si se vio a **30 s o más** pero saldría a menos de 30 s de la anterior, se retiene
 *   hasta que pasen (más un segundo de margen).
 * La única excepción es cerrar la pestaña con una retenida: sale igual, porque perderla
 * seguro es peor que arriesgar que el cupo la descarte.
 */

import { MAX_FICHAS_POR_ENVIO, trocearFichas } from "../../lib/lotesDeEnvio.js";

/** Lo que espera una rotación a las que vienen detrás. */
export const ESPERA_MAXIMA_MS = 5 * 1000;
/** El cupo del servidor: una vista por dirección, pieza y hueco cada 30 s. */
export const CUPO_MS = 30 * 1000;
/** Margen sobre el cupo para lo retenido (relojes y red no son exactos). */
const MARGEN_MS = 1000;

export const RUTA_UNA = "/publicidad/visto";
export const RUTA_VARIAS = "/publicidad/vistos";

/** Si el backend tiene `/vistos`: `"si"`, `"no"` o nada (aún no se sabe). */
export const CLAVE_SOPORTE = "sureconomics_pub_vistos";

/**
 * @param {object} o
 * @param {string} o.base           la API, sin barra final
 * @param {(url: string, cuerpo: string) => boolean} o.beacon       `sendBeacon`
 * @param {(url: string, cuerpo: string) => Promise<{ok: boolean, status: number}>} o.peticion
 *   `fetch` con `keepalive`, texto plano y sin credenciales
 * @param {() => number} o.reloj    milisegundos
 * @param {(fn: Function, ms: number) => any} o.programar
 * @param {(id: any) => void} o.cancelar
 * @param {{leer: () => string|null, escribir: (v: string) => void}} [o.almacen]  la sesión
 */
export const crearEnvioDeVistos = ({ base, beacon, peticion, reloj, programar, cancelar, almacen }) => {
  const leerSoporte = () => {
    try {
      const v = almacen?.leer();
      return v === "si" ? true : v === "no" ? false : null;
    } catch {
      return null;
    }
  };
  let soporte = leerSoporte();
  const recordarSoporte = (si) => {
    soporte = si;
    try {
      almacen?.escribir(si ? "si" : "no");
    } catch {
      /* sin almacén se vuelve a preguntar en la próxima carga */
    }
  };

  let pendientes = [];
  let temporizador = null;
  let retenidas = [];
  let relojDeRetenidas = null;
  let paginaActual;
  /** Por pieza: cuándo se vio y cuándo salió la última. */
  const ultimas = new Map();

  /** Beacon y, si no sale (`false` o error), `fetch` con `keepalive`. */
  const soltar = (ruta, cuerpo) => {
    let ok = false;
    try {
      ok = beacon(base + ruta, cuerpo) === true;
    } catch {
      ok = false;
    }
    if (ok) return;
    try {
      Promise.resolve(peticion(base + ruta, cuerpo)).catch(() => {});
    } catch {
      /* contar no puede romper la página */
    }
  };

  const unaAUna = (fichas) => fichas.forEach((f) => soltar(RUTA_UNA, f));

  const enviar = (items, { saliendo = false } = {}) => {
    if (!items.length) return;
    const ahora = reloj();
    for (const i of items) if (i.clave) ultimas.set(i.clave, { vistaEn: i.vistaEn, enviadaEn: ahora });
    const fichas = items.map((i) => i.ficha);
    if (fichas.length === 1) {
      soltar(RUTA_UNA, fichas[0]);
      return;
    }
    if (soporte === false || (saliendo && soporte !== true)) {
      unaAUna(fichas);
      return;
    }
    for (const cuerpo of trocearFichas(fichas)) {
      if (saliendo) {
        // Al cerrar solo sirve el beacon (sobrevive a la pestaña), aunque no vea el 404.
        soltar(RUTA_VARIAS, cuerpo);
        continue;
      }
      // Con la pestaña viva, siempre `fetch`: ve la respuesta, también si el backend se
      // revirtió después de aprender «sí».
      const otraVez = () => unaAUna(cuerpo.split("\n"));
      let respuesta;
      try {
        respuesta = Promise.resolve(peticion(base + RUTA_VARIAS, cuerpo));
      } catch {
        respuesta = Promise.reject(new Error("sin fetch"));
      }
      respuesta.then(
        (r) => {
          if (r && r.status === 404) {
            recordarSoporte(false);
            otraVez();
          } else if (r && r.ok) {
            recordarSoporte(true);
          } else {
            // 429, 5xx... Repetir es seguro: el servidor cuenta cada ficha una sola vez.
            otraVez();
          }
        },
        otraVez
      );
    }
  };

  const programarRetenidas = () => {
    if (relojDeRetenidas != null) cancelar(relojDeRetenidas);
    relojDeRetenidas = null;
    if (!retenidas.length) return;
    const proxima = Math.min(...retenidas.map((r) => r.cuando));
    relojDeRetenidas = programar(soltarRetenidas, Math.max(0, proxima - reloj()));
  };

  function soltarRetenidas() {
    relojDeRetenidas = null;
    const ahora = reloj();
    const listas = retenidas.filter((r) => r.cuando <= ahora);
    retenidas = retenidas.filter((r) => r.cuando > ahora);
    enviar(listas);
    programarRetenidas();
  }

  /** Manda lo pendiente. `saliendo`: la pestaña se oculta o se cierra; sale también lo retenido. */
  const vaciar = ({ saliendo = false } = {}) => {
    if (temporizador != null) cancelar(temporizador);
    temporizador = null;
    const lote = pendientes;
    pendientes = [];
    if (saliendo && retenidas.length) {
      if (relojDeRetenidas != null) cancelar(relojDeRetenidas);
      relojDeRetenidas = null;
      lote.push(...retenidas);
      retenidas = [];
    }
    enviar(lote, { saliendo });
  };

  /**
   * Una pieza acaba de verse. `clave`: qué pieza en qué hueco (dos fichas con la misma
   * clave son la misma pieza en el mismo hueco, servida en dos cargas). `pagina`: en qué
   * página, para saber cuál es la primera.
   */
  const ver = (ficha, { clave = null, pagina = null } = {}) => {
    if (typeof ficha !== "string" || !ficha || /\s/.test(ficha)) return;
    const ahora = reloj();
    const item = { ficha, clave, vistaEn: ahora };
    const nueva = pagina !== paginaActual;
    paginaActual = pagina;
    // Lo de la página anterior sale ya: no se junta con la nueva.
    if (nueva) vaciar();

    const anterior = clave ? ultimas.get(clave) : null;
    if (anterior && ahora - anterior.vistaEn < CUPO_MS) {
      enviar([item]);
      return;
    }
    if (anterior) {
      const puede = anterior.enviadaEn + CUPO_MS + MARGEN_MS;
      if (puede > ahora) {
        retenidas.push({ ...item, cuando: puede });
        programarRetenidas();
        return;
      }
    }
    if (nueva) {
      enviar([item]);
      return;
    }
    pendientes.push(item);
    if (pendientes.length >= MAX_FICHAS_POR_ENVIO) {
      vaciar();
      return;
    }
    if (temporizador == null) {
      temporizador = programar(() => {
        temporizador = null;
        vaciar();
      }, ESPERA_MAXIMA_MS);
    }
  };

  return { ver, vaciar };
};
