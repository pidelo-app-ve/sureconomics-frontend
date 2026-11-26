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
 * alto del contenido vuelve a ponerla en su sitio. Para en cuanto el lector toca, gira la
 * rueda o pulsa una tecla (manda él), y como mucho a los `TOPE_RESTAURAR_MS`.
 *
 * Sin importaciones, para probarlo con `node` solo (`desplazamiento.test.mjs`).
 */

/** Dónde se guarda, para que sobreviva a una recarga o a volver desde otro sitio. */
const CLAVE = "se-desplazamiento";

/** Cuántas entradas se guardan: las últimas; con más, nadie vuelve tan atrás. */
export const MAXIMO = 50;

/** Lo más que se sostiene la posición mientras la página termina de pintarse. */
export const TOPE_RESTAURAR_MS = 4000;

/** Lo que hace el lector cuando quiere moverse él: a partir de ahí, manda él. */
const GESTOS = ["wheel", "touchstart", "pointerdown", "keydown"];

/** Las posiciones guardadas (`Map` de clave → altura), o ninguna si no se pueden leer. */
export const leerPosiciones = (almacen = globalThis.sessionStorage) => {
  try {
    const lista = JSON.parse(almacen?.getItem(CLAVE) ?? "[]");
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
export const guardarPosiciones = (posiciones, almacen = globalThis.sessionStorage) => {
  try {
    almacen?.setItem(CLAVE, JSON.stringify([...posiciones]));
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
 * Lleva la página a `y` y la sostiene ahí mientras el contenido cambia de alto. Devuelve
 * con qué soltarla antes (la limpieza del efecto, al cambiar otra vez de página).
 */
export const restaurar = (y, { ventana = globalThis.window, tope = TOPE_RESTAURAR_MS } = {}) => {
  const ir = () => {
    if (Math.abs((ventana.scrollY ?? 0) - y) > 1) ventana.scrollTo(0, y);
  };
  ir();
  let hecho = false;
  let vigia = null;
  const soltar = () => {
    if (hecho) return;
    hecho = true;
    vigia?.disconnect();
    clearTimeout(reloj);
    GESTOS.forEach((gesto) => ventana.removeEventListener(gesto, soltar, true));
  };
  const reloj = setTimeout(soltar, tope);
  GESTOS.forEach((gesto) => ventana.addEventListener(gesto, soltar, { capture: true, passive: true }));
  const contenido = ventana.document?.getElementById("root") ?? ventana.document?.body;
  if (typeof ventana.ResizeObserver === "function" && contenido) {
    vigia = new ventana.ResizeObserver(ir);
    vigia.observe(contenido);
  }
  return soltar;
};
