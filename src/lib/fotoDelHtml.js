/**
 * Cuándo puede montar React sin quitarle a la foto del HTML su sitio como LCP.
 *
 * La portada (`api/portada.js`, `aperturaEnHtml`) y las piezas (`api/pieza.js`,
 * `piezaEnHtml`) llegan con la foto de arriba ya pintada dentro de `#root`. React no
 * hidrata ese HTML: al montar (`createRoot`) lo borra y pinta su propia `<img>`, con la
 * misma dirección y del mismo tamaño. Si eso pasa antes de que el navegador haya anotado
 * la foto del HTML como candidata a LCP (el pintado más grande de la primera pantalla),
 * esa anotación se pierde: el LCP pasa a ser la foto de React, que sale después de todo el
 * JavaScript. Medido en el teléfono del laboratorio (Lighthouse, 25-nov-2026): 4,4 s
 * montando enseguida y 2,7-2,9 s esperando a la anotación.
 *
 * `esperarALaFotoDelHtml` es esa espera: una promesa que se cumple cuando el navegador
 * avisa (`PerformanceObserver` de `largest-contentful-paint`, con `buffered` para ver
 * también lo anotado antes de mirar) de que el LCP es esa `<img>`. Y nunca más de lo
 * debido:
 *
 * - **Tope de `TOPE_MS`.** Si la foto tarda en llegar o no es lo más grande de la
 *   pantalla (el aviso no llega nunca), React monta igual.
 * - **El primer toque o tecla.** Quien ya está tocando la página no espera a nada.
 * - **Sin espera** si no hay foto en el HTML, si la foto falló, si la pestaña está oculta
 *   (con la pestaña oculta el navegador no anota LCP) o si el navegador no mide el LCP
 *   (Safari y Firefox antiguos): ahí no hay nada que proteger.
 *
 * El JavaScript ya está descargado y ejecutándose: lo que se aplaza es solo el montaje.
 * Sin importaciones, para probarlo con `node` solo (`fotoDelHtml.test.mjs`).
 */

/** Lo más que espera React a que la foto del HTML quede anotada. */
export const TOPE_MS = 600;

/** La foto de arriba que trae el HTML: la apertura de la portada o la cabecera de una pieza. */
export const SELECTOR_FOTO_DEL_HTML = ".se-portada-anticipo .se-artcard__img, .se-previa .se-piece__img";

/** Si este navegador avisa del LCP (`largest-contentful-paint`). */
const mideElLcp = (ventana) => {
  const tipos = ventana?.PerformanceObserver?.supportedEntryTypes;
  return Array.isArray(tipos) && tipos.includes("largest-contentful-paint");
};

/**
 * La espera. `img`, la foto del HTML (o nada); `ventana`, la de la página (otra en las
 * pruebas). Devuelve por qué terminó: `"lcp"`, `"tope"`, `"gesto"`, `"sin-foto"` o
 * `"sin-espera"`.
 */
export const esperarALaFotoDelHtml = ({ img, tope = TOPE_MS, ventana = globalThis.window } = {}) =>
  new Promise((listo) => {
    if (!img || !mideElLcp(ventana) || ventana.document?.visibilityState === "hidden") {
      listo("sin-espera");
      return;
    }
    // Ya cargó y no tiene tamaño: la foto falló y no va a pintarse.
    if (img.complete && !img.naturalWidth) {
      listo("sin-foto");
      return;
    }
    let observador = null;
    let reloj = null;
    let hecho = false;
    const terminar = (motivo) => {
      if (hecho) return;
      hecho = true;
      ventana.clearTimeout(reloj);
      observador?.disconnect();
      ventana.removeEventListener("pointerdown", alTocar, true);
      ventana.removeEventListener("keydown", alTocar, true);
      img.removeEventListener("error", alFallar);
      listo(motivo);
    };
    const alTocar = () => terminar("gesto");
    const alFallar = () => terminar("sin-foto");
    reloj = ventana.setTimeout(() => terminar("tope"), tope);
    ventana.addEventListener("pointerdown", alTocar, true);
    ventana.addEventListener("keydown", alTocar, true);
    img.addEventListener("error", alFallar);
    try {
      observador = new ventana.PerformanceObserver((lista) => {
        if (lista.getEntries().some((entrada) => entrada.element === img)) terminar("lcp");
      });
      observador.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      terminar("sin-espera");
    }
  });
