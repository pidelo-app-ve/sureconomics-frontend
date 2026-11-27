/**
 * Dónde estaba el lector en cada página, para devolverlo ahí con el botón «atrás».
 *
 * El sitio cambia de página sin recargar, así que el navegador no sabe devolver la
 * posición: al volver de una pieza, la portada salía arriba del todo. `ScrollToTop`
 * apunta la altura de cada entrada del historial (por su `location.key`) y, al volver a
 * una, la restaura con `restaurar`.
 *
 * ## Por qué no el `ScrollRestoration` de React Router
 *
 * Sube arriba en cada cambio de dirección, también cuando solo cambia la consulta: cada
 * filtro de `/explorar`, cada letra del buscador y cada «Cargar más» (`?pagina=`) tiraría
 * al lector arriba, salvo marcando una a una las veinte y tantas navegaciones del sitio.
 * Y restaura una sola vez, al llegar: la portada pinta su lista cuando llegan los datos, y
 * para entonces la página aún no era tan larga.
 *
 * ## Restaurar cuando la lista ya está pintada
 *
 * `restaurar` lleva la página a la altura apuntada y la mantiene ahí mientras crece (los
 * datos de la portada llegan después, las fotos se abren hueco…): cada vez que cambia el
 * alto del marco de la página vuelve a ponerla en su sitio. Para en cuanto el lector toca, gira la
 * rueda o pulsa una tecla (manda él), y como mucho a los `TOPE_RESTAURAR_MS`.
 *
 * **Con la página bloqueada, espera.** Una ventana encima (la invitación al boletín, el menú
 * del teléfono) pone `overflow: hidden` en `<html>` o en `<body>`: la página deja de poder
 * desplazarse y cualquier `scrollTo` se queda corto (medido en Edge: 2400 pedidos, 562
 * dados, y el lector se quedaba ahí al cerrarla). Mientras dure, `restaurar` no mueve nada,
 * no la sueltan ni los gestos (los de dentro de la ventana no son del lector con la página)
 * ni el tope; al desbloquearse, la vuelve a poner en su sitio. Y quien mide cuánto se ha
 * leído (la propia invitación) no cuenta lo que se desplaza mientras se restaura
 * (`restaurando`): eso no lo ha leído nadie.
 *
 * Mientras tanto, sin el anclaje de desplazamiento del navegador (`overflow-anchor`): al
 * crecer la portada por encima de lo que se ve (con la página aún corta, el pie), Chrome
 * la desplazaba para dejar el pie quieto, y lo hacía después de que avisara el vigía de
 * tamaño: medido en Edge, el lector acababa al final de la portada y no donde estaba.
 *
 * Sin importaciones, para probarlo con `node` solo (`desplazamiento.test.mjs`).
 */

/** Dónde se guarda, para que sobreviva a una recarga o a volver desde otro sitio. */
const CLAVE = "se-desplazamiento";

/** Cuántas entradas se guardan: las últimas; con más, nadie vuelve tan atrás. */
export const MAXIMO = 50;

/** Lo más que se sostiene la posición mientras la página termina de pintarse. */
export const TOPE_RESTAURAR_MS = 8000;

/** Lo que hace el lector cuando quiere moverse él: a partir de ahí, manda él. */
const GESTOS = ["wheel", "touchstart", "pointerdown", "keydown"];

/**
 * La clave de una entrada del historial. Las que crea el router traen la suya; las que
 * crea el navegador por su cuenta (la primera de la carga, o un `<a href="#ancla">`) no
 * traen ninguna y React Router las llama todas `default`: con su dirección al lado, la
 * portada y la portada con un ancla no comparten altura (medido en Edge: el ancla del
 * boletín acababa en el pie, con la altura de la portada sin ancla).
 */
export const claveDe = (location) =>
  location.key === "default" ? `default:${location.pathname}${location.search}${location.hash}` : location.key;

/**
 * El almacén: el que se pase o, si no, el de la pestaña. Se pide dentro del `try` de quien
 * lo usa, nunca como valor por omisión de un parámetro: con las cookies bloqueadas (o en
 * algún modo privado) solo tocar `sessionStorage` lanza un `SecurityError`, y fuera del
 * `try` rompía el pintado de `ScrollToTop`. Sin almacén, «atrás» funciona igual hasta que
 * se recargue.
 */
const deLaSesion = (almacen) => (almacen === undefined ? globalThis.sessionStorage : almacen);

/** Las posiciones guardadas (`Map` de clave → altura), o ninguna si no se pueden leer. */
export const leerPosiciones = (almacen) => {
  try {
    const lista = JSON.parse(deLaSesion(almacen)?.getItem(CLAVE) ?? "[]");
    return new Map(Array.isArray(lista) ? lista.filter(([, y]) => Number.isFinite(y)) : []);
  } catch {
    return new Map();
  }
};

/** Apunta `y` para `clave`, como la más reciente, y deja solo las `MAXIMO` últimas. */
export const apuntar = (posiciones, clave, y) => {
  posiciones.delete(clave);
  posiciones.set(clave, Math.max(0, Math.round(y)));
  while (posiciones.size > MAXIMO) posiciones.delete(posiciones.keys().next().value);
};

/** Las guarda; si el almacén no deja (modo privado, lleno), se quedan en memoria. */
export const guardarPosiciones = (posiciones, almacen) => {
  try {
    deLaSesion(almacen)?.setItem(CLAVE, JSON.stringify([...posiciones]));
  } catch {
    /* Sin almacén, la vuelta atrás funciona igual mientras no se recargue. */
  }
};

/**
 * Si la carga de la página (no una navegación de dentro) fue una recarga o un «atrás» /
 * «adelante» desde otro sitio: solo entonces vale lo guardado para la primera página. Un
 * enlace abierto de nuevo llega arriba, aunque en esta pestaña ya se hubiera visto.
 */
export const cargaQueRestaura = (ventana = globalThis.window) => {
  try {
    const tipo = ventana?.performance?.getEntriesByType?.("navigation")?.[0]?.type;
    return tipo === "reload" || tipo === "back_forward";
  } catch {
    return false;
  }
};

/**
 * Si la página no se puede desplazar ahora: `<html>` o `<body>` con `overflow: hidden` (una
 * ventana abierta encima). El `overflow-x: hidden` que lleva siempre `body` no cuenta.
 */
export const desplazamientoBloqueado = (ventana = globalThis.window) => {
  try {
    const doc = ventana?.document;
    return [doc?.documentElement, doc?.body].some(
      (el) => el && (el.style?.overflow === "hidden" || ventana.getComputedStyle?.(el)?.overflowY === "hidden")
    );
  } catch {
    return false;
  }
};

/** Cuántas restauraciones siguen sosteniendo su altura (una, como mucho, en la práctica). */
let activas = 0;

/** Si ahora mismo se está restaurando una altura: lo que se desplace no lo hizo el lector. */
export const restaurando = () => activas > 0;

/**
 * Lleva la página a `y` y la sostiene ahí mientras el contenido cambia de alto. Devuelve
 * con qué soltarla antes (la limpieza del efecto, al cambiar otra vez de página).
 * `alSoltar` avisa cuando deja de sostenerla, por lo que sea.
 */
export const restaurar = (y, { ventana = globalThis.window, tope = TOPE_RESTAURAR_MS, alSoltar = null } = {}) => {
  // Si estaba bloqueada la última vez que se miró: al dejar de estarlo, se vuelve a `y`.
  let estabaBloqueada = false;
  const ir = () => {
    estabaBloqueada = desplazamientoBloqueado(ventana);
    if (estabaBloqueada) return;
    if (Math.abs((ventana.scrollY ?? 0) - y) > 1) ventana.scrollTo(0, y);
  };
  const raiz = ventana.document?.documentElement;
  const anclaje = raiz?.style.overflowAnchor ?? "";
  if (raiz) raiz.style.overflowAnchor = "none";
  activas += 1;
  ir();
  let hecho = false;
  let vigia = null;
  let bloqueo = null;
  let reloj = null;
  const soltar = () => {
    if (hecho) return;
    hecho = true;
    activas -= 1;
    if (raiz) raiz.style.overflowAnchor = anclaje;
    vigia?.disconnect();
    bloqueo?.disconnect();
    clearTimeout(reloj);
    GESTOS.forEach((gesto) => ventana.removeEventListener(gesto, alGesto, true));
    alSoltar?.();
  };
  // El tope no corre mientras la página está bloqueada: se vuelve a mirar después.
  const armarReloj = () => {
    clearTimeout(reloj);
    reloj = setTimeout(() => (desplazamientoBloqueado(ventana) ? armarReloj() : soltar()), tope);
  };
  const alGesto = () => {
    if (!desplazamientoBloqueado(ventana)) soltar();
  };
  armarReloj();
  GESTOS.forEach((gesto) => ventana.addEventListener(gesto, alGesto, { capture: true, passive: true }));
  // Al cerrarse la ventana de encima (cambia el estilo o la clase de `<html>` o `<body>`).
  if (typeof ventana.MutationObserver === "function" && raiz) {
    bloqueo = new ventana.MutationObserver(() => {
      if (!estabaBloqueada) return;
      ir();
      if (!estabaBloqueada) armarReloj();
    });
    for (const el of [raiz, ventana.document.body].filter(Boolean)) {
      bloqueo.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
    }
  }
  // El marco de la página (lo primero dentro de `#root`) y no `#root`, que mide una pantalla
  // (`index.css`) y el contenido lo desborda: su tamaño no cambia nunca.
  const raizDeReact = ventana.document?.getElementById("root");
  const contenido = raizDeReact?.firstElementChild ?? raizDeReact ?? ventana.document?.body;
  if (typeof ventana.ResizeObserver === "function" && contenido) {
    vigia = new ventana.ResizeObserver(ir);
    vigia.observe(contenido);
  }
  return soltar;
};
