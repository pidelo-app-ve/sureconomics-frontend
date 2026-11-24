/**
 * Pedir un archivo de **este mismo sitio**, no de la API: `/media/…`, que en producción
 * reescribe Vercel y en local el proxy de Vite. Lo usa el panel para bajar una imagen ya
 * subida y convertirla (`components/admin/aligerarImagen.js`).
 *
 * Aquí y no en `nucleo.js`: sin importaciones (como `quiosco.js`), para que lo puedan
 * cargar las pruebas que corren con `node` solo (`npm run test:publicidad`), que no
 * entienden `import.meta.env` ni las rutas sin extensión.
 */

/**
 * Sin `API_BASE` ni la sesión de la API; con las cookies del sitio, como el navegador al
 * pintar la imagen. Devuelve el `Blob`.
 *
 * - Una dirección de otro sitio no se pide: lanza un error sin `status`.
 * - Si el servidor dice que no, lanza un error con su `status` (quien llama pone el texto).
 * - Con `senal` (un `AbortSignal`) se cancela: lanza el `AbortError` de `fetch`.
 *
 * @param {string} ruta `/media/…`, o la dirección entera si es de este sitio
 * @param {{ senal?: AbortSignal, origen?: string }} [opciones] `origen`: el de la página
 * @returns {Promise<Blob>}
 */
export const pedirArchivoDelSitio = async (ruta, { senal, origen = globalThis.location?.origin } = {}) => {
  let url = null;
  try {
    url = new URL(ruta, origen);
  } catch {
    url = null; // sin origen (fuera del navegador) o una dirección que no se entiende
  }
  if (!url || !origen || url.origin !== origen) throw new Error(`No es un archivo de este sitio: ${ruta}`);
  const res = await fetch(url.href, { credentials: "same-origin", signal: senal });
  if (!res.ok) {
    const error = new Error(`No se pudo descargar ${ruta} (respuesta ${res.status}).`);
    error.status = res.status;
    throw error;
  }
  return res.blob();
};
