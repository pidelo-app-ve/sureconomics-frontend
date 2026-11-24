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
  avisoDeAligerado,
  convertirImagen,
  esGif,
  lienzoDelNavegador,
} from "../../../components/admin/aligerarImagen.js";
import { TOPE_ARTE_IMAGEN, decidirAligerado } from "./utils.js";

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
  const nuevo = await convertirImagen(archivo, { medidas, tope: TOPE_ARTE_IMAGEN, nombre: suNombre, senal, lienzo });
  if (!nuevo) {
    throw new Error(
      `No se pudo dejar ${suNombre ? `«${suNombre}»` : "el arte"} por debajo de ${TOPE_ARTE_IMAGEN / 1024} KB ni ` +
        "bajando la calidad y el tamaño. No se ha subido nada. Pida al anunciante una versión más sencilla.",
    );
  }
  return { archivo: nuevo, nota: avisoDeAligerado(archivo.size, nuevo.size) };
};
