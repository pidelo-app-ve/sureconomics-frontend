/**
 * Lo que comparten las vistas de «Lo importante de hoy»: la página `/resumen` y el
 * lateral de Última hora.
 */

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
