/**
 * Lo que pasa con una pestaña abierta cuando publicamos una versión nueva del sitio.
 *
 * Cada versión trae su código partido en trozos con nombre propio (`Pieza-3fa2c1.js`), y
 * la anterior desaparece del servidor. Quien tenía el sitio abierto sigue con la página
 * vieja, y al ir a otra sección su navegador pide un trozo que ya no existe. Antes eso
 * acababa en "página no encontrada" sin que nadie entendiera por qué. Lo correcto es
 * recargar: la recarga trae la versión nueva entera.
 *
 * Una sola vez por minuto, para no entrar en un bucle si lo que falla es otra cosa (la
 * red, un bloqueador).
 */

const CLAVE = "se_recarga_tras_despliegue";
const ESPERA_MS = 60_000;

/** Si el error es un trozo de código que no se pudo descargar. */
export const esErrorDeCarga = (error) => {
  const texto = `${error?.name ?? ""} ${error?.message ?? error ?? ""}`;
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically|ChunkLoadError|Unable to preload CSS/i.test(
    texto,
  );
};

/** Recarga la página si no se recargó por esto hace menos de un minuto. Devuelve si lo hizo. */
export const recargarUnaVez = () => {
  let ultima = 0;
  try {
    ultima = Number(window.sessionStorage.getItem(CLAVE)) || 0;
  } catch {
    // Sin almacenamiento (modo privado estricto): se recarga igual, una vez por carga.
  }
  if (Date.now() - ultima < ESPERA_MS) return false;
  try {
    window.sessionStorage.setItem(CLAVE, String(Date.now()));
  } catch {
    // Ver arriba.
  }
  window.location.reload();
  return true;
};
