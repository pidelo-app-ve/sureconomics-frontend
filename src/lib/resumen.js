/**
 * Lo que comparten las vistas de «Lo importante de hoy»: la página `/resumen` y el
 * lateral de Última hora.
 *
 * Solo importaciones con extensión: `node src/lib/resumen.test.mjs` lo carga sin Vite.
 */
import { tallasHastaLaOriginal } from "./fotoDePieza.js";

/** La dirección del backend es absoluta; dentro del sitio se navega con la ruta. */
export const rutaInterna = (url) => {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.hash}`;
  } catch {
    return url;
  }
};

/** La línea de un punto en el idioma de la página (la inglesa, si la hay). */
export const lineaDelPunto = (punto, lang) => (lang === "en" ? punto.linea_en || punto.linea : punto.linea);

/**
 * El ancho de la columna del resumen por tramos de ventana: `.se-container.se-res__caja`,
 * 720 px de tope con los márgenes dentro (24 px a cada lado, 32 desde 768 y 40 desde 1024).
 * Por debajo de 720 es el ancho de la ventana menos 48 (`sizesDelResumen`).
 */
const COLUMNA_DEL_RESUMEN = [
  [767, 672],
  [1023, 656],
  [Infinity, 640],
];

/**
 * El `sizes` de la foto del resumen para una foto de `ancho` px.
 *
 * Tiene que decir lo que la foto mide hoy y ni un píxel más, porque su CSS
 * (`.se-res__imagen img`) la deja a su tamaño natural (`width: auto`, sin pasar de la columna
 * ni de `min(520px, 60vh)` de alto): una infografía estrecha no se estira. Con `srcset` el
 * tamaño natural deja de ser el del archivo y pasa a ser el de `sizes`, así que `sizes` es el
 * menor entre la foto y la columna. Si dijera solo la columna, una foto de 599 px se
 * estiraría a 640.
 */
export const sizesDelResumen = (ancho) => {
  // Hasta donde la columna es más estrecha que la foto, la columna (la ventana menos 48).
  const tope = Math.min(719, ancho + 48);
  const tramos = tope < 719 ? [[719, ancho]] : [];
  COLUMNA_DEL_RESUMEN.forEach(([hasta, columna]) => tramos.push([hasta, Math.min(ancho, columna)]));
  // Los tramos seguidos que miden lo mismo, en uno.
  const juntos = [];
  tramos.forEach(([hasta, px]) => {
    const ultimo = juntos[juntos.length - 1];
    if (ultimo && ultimo[1] === px) ultimo[0] = hasta;
    else juntos.push([hasta, px]);
  });
  return [
    `(max-width: ${tope}px) calc(100vw - 48px)`,
    ...juntos.map(([hasta, px]) => (hasta === Infinity ? `${px}px` : `(max-width: ${hasta}px) ${px}px`)),
  ].join(", ");
};

/**
 * Los atributos de la `<img>` de la foto del resumen (`{ src, srcSet?, sizes? }`).
 *
 * Antes se pintaba siempre la original: la foto del día sale sola de las piezas y muchas son
 * el PNG de 1.536 px y casi 2 MB que sube la redacción. Ahora, las tallas WebP del servidor
 * (`tallasHastaLaOriginal`). Sin ancho guardado, de fuera, SVG, GIF o de menos de 640 px,
 * la original como antes.
 */
export const fotoDelResumen = (imagen) => {
  const src = imagen?.url;
  const ancho = Number.isInteger(imagen?.ancho) && imagen.ancho > 0 ? imagen.ancho : null;
  const srcSet = src && ancho ? tallasHastaLaOriginal(src, ancho) : null;
  return srcSet ? { src, srcSet, sizes: sizesDelResumen(ancho) } : { src };
};
