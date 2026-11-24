/**
 * El arte de un anuncio que pesa de más, aligerado antes de subirlo: qué se hace con
 * cada archivo (`decidirAligerado`, en `utils.js`) y la llamada al convertidor del panel
 * (`components/admin/aligerarImagen.js`, el mismo que usa el editor de piezas) con el
 * tamaño de su hueco y el tope de 150 KB.
 *
 * La subida no cambia: el archivo aligerado se sube por el mismo camino de siempre
 * (`/admin/media/image`, que es también el del bot de Saúl y no se toca), y el tope del
 * servidor sigue ahí como red por si algo se cuela.
 */
import {
  AVISO_OPTIMIZANDO,
  archivoEsGifAnimado,
  convertirImagen,
  esGif,
  lienzoDelNavegador,
  notaDeConversion,
} from "../../../components/admin/aligerarImagen.js";
import { TOPE_ARTE_IMAGEN, TOPE_ARTE_SVG, decidirAligerado } from "./utils.js";

/** Por qué vale la pena aunque pese más que antes (un SVG de 69 KB que sale en 136 KB). */
const POR_QUE = `un SVG de anuncio puede pesar hasta ${TOPE_ARTE_SVG / 1024} KB y una imagen hasta ${TOPE_ARTE_IMAGEN / 1024} KB.`;

/**
 * Deja un archivo listo para subirlo como arte: tal cual si no pasa del tope, o
 * aligerado si pasa. Un GIF animado que pasa no se toca y se rechaza con el aviso de
 * siempre.
 *
 * @param {File | Blob} archivo
 * @param {{ medidas: { ancho: number, alto: number }, nombre?: string,
 *   onAviso?: (texto: string) => void, senal?: AbortSignal,
 *   lienzo?: typeof lienzoDelNavegador }} opciones `lienzo`: uno de mentira en las pruebas.
 * @returns {Promise<{ archivo: File | Blob, nota: string | null }>} `nota`: «Se aligeró de…».
 */
export const prepararArte = async (archivo, { medidas, nombre, onAviso, senal, lienzo = lienzoDelNavegador } = {}) => {
  const suNombre = nombre ?? archivo?.name ?? "";
  const datos = { mime: archivo?.type, bytes: archivo?.size, nombre: suNombre };
  let decision = decidirAligerado(datos);
  if (decision.accion === "subir") return { archivo, nota: null };
  if (esGif(datos)) decision = decidirAligerado({ ...datos, gifAnimado: await archivoEsGifAnimado(archivo) });
  if (decision.accion === "rechazar") throw new Error(decision.motivo);

  onAviso?.(AVISO_OPTIMIZANDO);
  const convertir = (tope) => convertirImagen(archivo, { medidas, tope, nombre: suNombre, senal, lienzo });
  // Primero, que pese menos que el original (y que el tope). Un SVG de entre 50 y 150 KB
  // pasa del suyo pero puede no bajar de su propio peso en WebP: entonces basta con que
  // entre en el de las imágenes, y la nota lo dice tal cual.
  let nuevo = await convertir(Math.min(TOPE_ARTE_IMAGEN, archivo.size));
  if (!nuevo && archivo.size < TOPE_ARTE_IMAGEN) nuevo = await convertir(TOPE_ARTE_IMAGEN);
  if (!nuevo) {
    throw new Error(
      `No se pudo dejar ${suNombre ? `«${suNombre}»` : "el arte"} por debajo de ${TOPE_ARTE_IMAGEN / 1024} KB ni ` +
        "bajando la calidad y el tamaño. No se ha subido nada. Pida al anunciante una versión más sencilla.",
    );
  }
  return { archivo: nuevo, nota: notaDeConversion(archivo.size, nuevo, POR_QUE) };
};

/**
 * Para después de `correr` (el del panel, que resuelve a lo guardado, o a nada si falló):
 * si salió, pasa lo guardado a `despues` (releer la lista) y lo devuelve.
 */
export const siSalio = (despues) => async (hecho) => {
  if (hecho) await despues(hecho);
  return hecho;
};

/**
 * El `onReemplazar` de «Aligerar»: apunta en `marca` qué campo se guarda solo, para que al
 * volver la ficha del servidor se tome solo ese y no se pierda lo que se esté escribiendo
 * en los demás; lo guarda con `guardar(fila)` y resuelve a `true` si salió.
 *
 * @param {{ current: string | null }} marca
 * @param {string} campo
 * @param {(fila: { id: number }) => Promise<unknown>} guardar resuelve a algo si salió
 */
export const guardarSoloEseArte = (marca, campo, guardar) => async (fila) => {
  marca.current = campo;
  const hecho = await guardar(fila);
  if (!hecho) marca.current = null;
  return Boolean(hecho);
};
