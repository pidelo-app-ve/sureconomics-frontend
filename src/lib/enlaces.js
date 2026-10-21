/**
 * Un enlace que viene de la API se pinta solo si es una dirección web.
 *
 * El backend ya rechaza al guardar todo lo que no empiece por `http(s)://`, pero esto
 * también pinta lo guardado antes de esa regla y lo que escriba el panel en una vista
 * previa sin guardar. Un `href` o un `src` con `javascript:` es código corriendo en
 * nuestra página con la sesión de quien la mire; aquí se queda en nada.
 */

const ESQUEMAS = new Set(["http:", "https:"]);

/**
 * La dirección tal cual si es `http(s)://` con dominio o una ruta del propio sitio
 * (`/media/...`, que es como llegan las fotos y los audios de R2); si no, `null`.
 * `//otro.dominio` no es una ruta: es una dirección sin esquema, y se rechaza.
 */
export const enlaceWeb = (valor) => {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  if (!texto) return null;
  // `//otro.com` y `/\\otro.com` no son rutas del sitio: el navegador los lee como otro
  // dominio (el segundo, porque trata `\\` como `/`).
  if (texto.startsWith("/")) return /^\/[\\/]/.test(texto) ? null : texto;
  let url;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }
  if (!ESQUEMAS.has(url.protocol) || !url.hostname) return null;
  return texto;
};

/**
 * Si la dirección es `https://` y su dominio es `dominio` o un subdominio suyo.
 * Para decidir qué se incrusta en un `<iframe>`: ahí no basta con que sea web, tiene
 * que ser de quien esperamos.
 */
export const esDeDominio = (valor, ...dominios) => {
  const texto = enlaceWeb(valor);
  if (!texto || texto.startsWith("/")) return false;
  const url = new URL(texto);
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return dominios.some((d) => host === d || host.endsWith(`.${d}`));
};
