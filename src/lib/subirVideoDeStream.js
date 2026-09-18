import {
  MAX_VIDEO_BYTES,
  estadoDelVideo,
  pedirSubidaDeVideo,
  registrarVideoDeStream,
  subirVideoAStream,
} from "../services/adminMediaService";

/**
 * Sube un video a Cloudflare Stream y devuelve la fila de la biblioteca.
 *
 * Vivía dentro del editor de piezas. Ahora las lecciones de Educación también suben
 * video, y dos copias de esto se separan en cuanto alguien toque una: son cuatro pasos
 * con estado en el servidor de otra empresa, y la copia que se quede vieja deja vídeos
 * pagados y huérfanos en la cuenta de Cloudflare.
 *
 * ## El orden de los pasos, que no es negociable
 *
 * Pedir permiso → subir → anotar en la biblioteca. Si la fila se anotara antes de
 * subir, un fallo a mitad de camino dejaría en la biblioteca un vídeo que no existe, y
 * la pieza se podría publicar con el reproductor vacío.
 *
 * ## La clave de idempotencia
 *
 * `clave` viaja a Cloudflare con la petición de permiso. Sin ella, pulsar dos veces
 * abre dos huecos de vídeo y los dos se facturan. Quien llama es responsable de
 * renovarla cuando la subida cuaja, para que la siguiente sea otro vídeo y no un
 * reintento de este.
 *
 * @param {File} file
 * @param {{ clave: string, onProgress?: Function, onAviso?: Function, onProcesando?: Function }} opciones
 */
export const subirVideoDeStream = async (
  file,
  { clave, onProgress, onAviso, onProcesando } = {},
) => {
  if (file.size > MAX_VIDEO_BYTES) {
    const tope = Math.round(MAX_VIDEO_BYTES / 1048576);
    throw new Error(
      `El video pesa ${Math.round(file.size / 1048576)} MB y el tope es ${tope}. ` +
        "Comprímalo o recorte el archivo.",
    );
  }

  onAviso?.("Pidiendo permiso a Cloudflare…");
  const permiso = await pedirSubidaDeVideo(clave);

  onAviso?.("Subiendo. No cierre esta página.");
  await subirVideoAStream(file, permiso.upload_url, { onProgress });

  onAviso?.("Subido. Anotándolo en la biblioteca…");
  const fila = await registrarVideoDeStream(permiso.uid, { nombre: file.name, clave });

  try {
    const estado = await estadoDelVideo(permiso.uid);
    if (!estado?.listo) onProcesando?.();
  } catch {
    // Que la consulta de estado falle no invalida la subida: el vídeo está arriba y la
    // fila anotada. Callar aquí es lo correcto; lanzar haría pensar que se perdió.
  }

  return fila;
};
