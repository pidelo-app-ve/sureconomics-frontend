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
 * `tope` ms: pasado ese tiempo la página se pinta como se pintaba antes de esto, y las hojas
 * que seguían sin llegar se dan por perdidas. Así una hoja colgada (una red móvil que se
 * queda a medias) retrasa un solo cambio de página, y como mucho el tope; sin apuntarla,
 * cada cambio de página la volvía a esperar entero.
 *
 * Se esperan todas las pendientes, no solo las de la página que se abre: desde aquí no se
 * sabe cuáles pide cada trozo (eso lo decide Vite al construir). Con el tope y el olvido,
 * lo peor que hace una hoja ajena es un retraso de una vez.
 */

/** Las hojas que ya no se esperan: fallaron, o agotaron el tope una vez. */
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

/** Lo que se espera como mucho, en ms: lo que tarda una hoja pequeña en una red lenta. */
export const TOPE_HOJAS_MS = 2500;

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
    reloj = setTimeout(() => {
      // Se acabó el tope: las que siguen sin llegar no se vuelven a esperar.
      pendientes.forEach((enlace) => {
        if (!enlace.sheet) FALLIDAS.add(enlace);
      });
      listo();
    }, tope);
  });
  return Promise.race([Promise.all(llegadas), tiempo]).then(() => clearTimeout(reloj));
};
