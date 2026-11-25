/**
 * Espera a que terminen de bajar las hojas de estilos que ya están pedidas.
 *
 * Por qué hace falta: un trozo perezoso con hoja propia (el buscador, por ejemplo) puede
 * haberse precargado desde otra página. Vite pone el `<link>` de su hoja y solo espera a
 * que llegue quien lo pidió primero; quien llega después mientras sigue bajando (abrir
 * /explorar desde la portada justo entonces) la da por pedida y pinta sin estilos hasta
 * que llega. Las páginas perezosas (`routes.jsx`) pasan por aquí antes de pintarse: si hay
 * una hoja a medio bajar, esperan a que termine.
 *
 * Una hoja que falló (sin red) no se espera: se apunta al fallar. Y nunca se espera más de
 * `tope` ms: pasado ese tiempo la página se pinta como se pintaba antes de esto.
 */

const FALLIDAS = new WeakSet();
if (typeof document !== "undefined") {
  // El `error` de un `<link>` no sube por el árbol: se escucha en la fase de captura.
  document.addEventListener(
    "error",
    (evento) => {
      if (evento.target?.tagName === "LINK") FALLIDAS.add(evento.target);
    },
    true
  );
}

/** Lo que se espera como mucho, en ms. */
export const TOPE_HOJAS_MS = 8000;

/**
 * @param {{ doc?: Document, tope?: number }} [opciones]  `doc`, para las pruebas
 * @returns {Promise<void>}
 */
export const esperarHojas = ({ doc = typeof document === "undefined" ? null : document, tope = TOPE_HOJAS_MS } = {}) => {
  if (!doc) return Promise.resolve();
  // Mientras baja, `sheet` es null; cuando llega, la hoja.
  const pendientes = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).filter(
    (enlace) => !enlace.sheet && !FALLIDAS.has(enlace)
  );
  if (!pendientes.length) return Promise.resolve();
  const llegadas = pendientes.map(
    (enlace) =>
      new Promise((listo) => {
        enlace.addEventListener("load", listo, { once: true });
        enlace.addEventListener("error", listo, { once: true });
      })
  );
  let reloj;
  const tiempo = new Promise((listo) => {
    reloj = setTimeout(listo, tope);
  });
  return Promise.race([Promise.all(llegadas), tiempo]).then(() => clearTimeout(reloj));
};
