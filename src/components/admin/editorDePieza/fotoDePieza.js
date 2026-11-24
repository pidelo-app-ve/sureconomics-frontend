/**
 * La foto de una pieza (la de portada y las del cuerpo), preparada antes de subirla.
 *
 * El servidor saca solo versiones WebP más pequeñas (160 a 1.400 px) de lo que se sube
 * en JPEG, PNG o WebP (`app/services/imagenes_service.py`), y el sitio le da a cada
 * lector la que necesita. De un **SVG** no saca ninguna: cada lector se bajaba el archivo
 * entero. Así que un SVG se convierte aquí, en el navegador, en un WebP de 1.400 px como
 * mucho (la talla más grande que usa el sitio) y calidad 0,82, y de ese el servidor ya
 * saca sus versiones. Con el convertidor de todo el panel
 * (`components/admin/aligerarImagen.js`).
 *
 * Los JPEG, PNG y WebP no se tocan: de eso ya se encarga el servidor. Un GIF animado
 * tampoco (perdería el movimiento): se sube como está y se avisa de que bajará entero.
 *
 * La subida es la de siempre, `/admin/media/image` (también la usa el bot de Saúl, y no
 * se toca).
 */
import { uploadAdminMediaImage } from "../../../services/adminMediaService";
import {
  AVISO_OPTIMIZANDO,
  archivoEsGifAnimado,
  avisoDeAligerado,
  comprobarSenal,
  convertirImagen,
  esGif,
  esSvg,
  kilobytes,
  lienzoDelNavegador,
} from "../aligerarImagen.js";

/**
 * La caja de la foto convertida: 1.400 px de ancho, la talla más grande del sitio. De
 * alto, el doble, para que una infografía vertical no salga como un lienzo gigante.
 */
export const MEDIDAS_DE_FOTO = { ancho: 1400, alto: 2800 };

export const AVISO_GIF_ANIMADO =
  "Es un GIF animado: se sube tal cual para no perder el movimiento, y cada lector lo bajará entero.";

/**
 * Lo que se dice al acabar. Un SVG pequeño (un icono de 3 KB) puede salir más pesado en
 * WebP: decir «se aligeró» sería mentir, pero convertirlo sigue valiendo la pena porque
 * de él salen las versiones pequeñas de cada pantalla.
 */
export const notaDeConversion = (antes, despues) =>
  despues < antes
    ? avisoDeAligerado(antes, despues)
    : `Se convirtió a WebP (de ${kilobytes(antes)} KB a ${kilobytes(despues)} KB): ahora el sitio prepara versiones más pequeñas para cada pantalla.`;

/**
 * Qué se hace con una foto antes de subirla: `convertir` (un SVG), `avisar` (un GIF
 * animado: se sube como está, con su aviso) o `subir` tal cual (todo lo demás).
 *
 * @param {{ mime?: string, nombre?: string, gifAnimado?: boolean }} archivo
 * @returns {"convertir" | "avisar" | "subir"}
 */
export const decidirFotoDePieza = (archivo = {}) => {
  if (esSvg(archivo)) return "convertir";
  if (esGif(archivo) && archivo.gifAnimado) return "avisar";
  return "subir";
};

/**
 * Deja la foto lista para subir: un SVG convertido a WebP; lo demás, como está.
 *
 * @param {File} archivo
 * @param {{ onAviso?: (texto: string) => void, senal?: AbortSignal,
 *   lienzo?: typeof lienzoDelNavegador }} [opciones] `lienzo`: uno de mentira en las pruebas.
 * @returns {Promise<{ archivo: File, nota: string | null }>}
 */
export const prepararFotoDePieza = async (archivo, { onAviso, senal, lienzo = lienzoDelNavegador } = {}) => {
  const datos = { mime: archivo?.type, nombre: archivo?.name };
  const gifAnimado = esGif(datos) ? await archivoEsGifAnimado(archivo) : false;
  const que = decidirFotoDePieza({ ...datos, gifAnimado });
  if (que === "avisar") return { archivo, nota: AVISO_GIF_ANIMADO };
  if (que === "subir") return { archivo, nota: null };

  onAviso?.(AVISO_OPTIMIZANDO);
  // Sin tope: una sola pasada, con 0,82, la calidad con la que el servidor hace sus
  // versiones.
  const nuevo = await convertirImagen(archivo, { medidas: MEDIDAS_DE_FOTO, senal, lienzo });
  return { archivo: nuevo, nota: notaDeConversion(archivo.size, nuevo.size) };
};

/**
 * Sube una foto de la pieza a la biblioteca, preparada antes (`prepararFotoDePieza`).
 * Con la forma que esperan el selector (`AssetField`, en `onUpload`) y el cuerpo
 * (`EditorConImagenes`, en `subir`): `onAviso` mientras trabaja, `onNota` al acabar y
 * `signal` para cancelar antes de subir.
 */
export const subirFotoDePieza = async (archivo, { onAviso, onNota, signal } = {}) => {
  const { archivo: listo, nota } = await prepararFotoDePieza(archivo, { onAviso, senal: signal });
  comprobarSenal(signal);
  if (listo !== archivo) onAviso?.("Subiendo la imagen…");
  const fila = await uploadAdminMediaImage(listo);
  if (nota) onNota?.(nota);
  return fila;
};
