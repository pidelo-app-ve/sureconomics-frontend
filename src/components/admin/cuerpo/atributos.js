import { imagenAncho, imagenSrcSet } from "../../../lib/pieza";
import { SIZES_DEL_CUERPO } from "./figura";

/** Los anchos que se ofrecen al navegador: la columna mide ~612 px, a 1x, 2x y 3x. */
const ANCHOS_DEL_CUERPO = [640, 1100, 1400];

/**
 * Lo que guarda la foto en el cuerpo a partir de un archivo de la biblioteca (el que
 * devuelve la subida o el que se elige ya subido).
 *
 * - **`src`**: la talla de 1400 si el archivo vive en Cloudinary (que la genera al vuelo);
 *   la original si vive en nuestro bucket, que no redimensiona al vuelo.
 * - **`srcset`**: las tallas que existen de verdad, para que el teléfono no descargue la
 *   foto entera. Nula si no hay ninguna que ofrecer.
 * - **`width`/`height`**: las medidas de la original, para que el navegador reserve el
 *   hueco antes de que llegue y el texto no salte al cargar.
 */
export const atributosDeAsset = (fila) => {
  const url = fila?.url;
  if (!url) return null;
  const srcset = imagenSrcSet(url, ANCHOS_DEL_CUERPO, fila.width ?? null);
  return {
    src: imagenAncho(url, 1400),
    srcset: srcset || null,
    sizes: srcset ? SIZES_DEL_CUERPO : null,
    width: fila.width ? String(fila.width) : null,
    height: fila.height ? String(fila.height) : null,
  };
};
