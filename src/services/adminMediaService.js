import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

/**
 * The media library.
 *
 * Three ways a file gets in — an image upload, a PDF upload, or a URL pasted by
 * hand — and all three come back as the same asset record, so the editor attaches
 * one thing regardless of where the bytes live. The pasted-URL path is what lets
 * an entrevista be published today: the backend asks for a video asset, not for a
 * video we host ourselves.
 */

/**
 * The library, optionally narrowed by a needle.
 *
 * `q` matches the label, the original filename and the credit. The last two are what
 * make the byline-photo picker usable on day one: nothing uploaded before the label
 * column existed carries a label, and without them the whole existing library would
 * be unsearchable.
 */
export const listAdminMedia = async (params = {}) => {
  const raw = await adminRequest("/admin/media", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 24,
      kind: params.kind || undefined,
      q: params.q?.trim() || undefined,
    },
  });
  return unwrapListResponse(raw);
};

export const getAdminMedia = async (id) =>
  unwrapEntity(await adminRequest(`/admin/media/${encodeURIComponent(id)}`));

/** Register a file hosted elsewhere: a YouTube interview, a PDF on another site. */
export const createAdminExternalMedia = async (body) =>
  unwrapEntity(await adminRequest("/admin/media/external", { method: "POST", json: body }));

/** Kept in sync with `ALLOWED_IMAGE_KINDS` in the backend's `upload_service.py`. */
export const ACCEPTED_IMAGE_MIME = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Reports are PDFs and nothing else — the backend checks the magic bytes. */
export const ACCEPTED_DOCUMENT_MIME = "application/pdf";

/** Both match the backend defaults; used only for a hint before uploading. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

/**
 * `adminRequest` leaves `Content-Type` unset for a `FormData` body, so the browser
 * adds the multipart boundary itself.
 */
const upload = async (path, file) => {
  const body = new FormData();
  body.append("file", file);
  return unwrapEntity(await adminRequest(path, { method: "POST", body }));
};

export const uploadAdminMediaImage = (file) => upload("/admin/media/image", file);

export const uploadAdminMediaDocument = (file) => upload("/admin/media/document", file);

/**
 * El video de una entrevista, en tres pasos.
 *
 * No es un `upload()` como la imagen y el PDF, y no por gusto: media hora de entrevista
 * son cientos de megas, y hacerlos pasar por nuestro servidor seria tenerlos en su
 * memoria y agotar el tiempo de espera de la peticion para nada. Asi que el servidor
 * pide permiso, el navegador sube **directo** a Cloudflare, y despues se le dice al
 * servidor que lo anote.
 *
 *   1. `pedirSubidaDeVideo()`      -> una direccion de un solo uso y el `uid`
 *   2. `subirVideoAStream()`       -> el navegador sube ahi, con progreso
 *   3. `registrarVideoDeStream()`  -> el servidor anota el `uid` en la biblioteca
 *
 * El paso 3 es imprescindible: sin el, el video queda en Cloudflare y ninguna pieza
 * puede apuntarle.
 */
export const pedirSubidaDeVideo = async () =>
  unwrapEntity(await adminRequest("/admin/media/video/subida", { method: "POST" }));

/**
 * Sube el archivo a la direccion que dio Cloudflare.
 *
 * Con `XMLHttpRequest` y no con `fetch`, y es la unica razon por la que aparece aqui:
 * `fetch` no informa del progreso de subida, y en un archivo de medio giga una barra
 * que no se mueve es indistinguible de algo colgado. La redaccion cancelaria subidas
 * que iban bien.
 *
 * La peticion va **sin** nuestra cabecera de sesion: el destino es Cloudflare, y la
 * direccion ya lleva su propio permiso de un solo uso. Mandarle nuestro token seria
 * entregarselo a un tercero.
 */
export const subirVideoAStream = (file, uploadUrl, { onProgress } = {}) =>
  new Promise((resolve, reject) => {
    const cuerpo = new FormData();
    cuerpo.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      // Cloudflare contesta 200 con cuerpo vacio a esta subida. Un cuerpo vacio aqui
      // es exito, igual que en el DELETE de la API -- por dar eso por fallo se creia
      // roto un borrado que habia funcionado.
      if (xhr.status >= 200 && xhr.status < 300) resolve(true);
      else reject(new Error(`Cloudflare respondio ${xhr.status} al subir el video.`));
    };
    xhr.onerror = () => reject(new Error("Se corto la conexion durante la subida."));
    xhr.onabort = () => reject(new Error("Subida cancelada."));
    xhr.send(cuerpo);
  });

export const registrarVideoDeStream = async (uid, { nombre } = {}) =>
  unwrapEntity(
    await adminRequest("/admin/media/video", {
      method: "POST",
      json: { uid, original_filename: nombre || undefined },
    })
  );

/** Si Stream ya acabo de transcodificar. Hasta entonces el reproductor daria negro. */
export const estadoDelVideo = async (uid) =>
  unwrapEntity(
    await adminRequest(`/admin/media/video/${encodeURIComponent(uid)}/estado`)
  );

/** Kept in sync with `MAX_UPLOAD_VIDEO_BYTES` in the backend's config. */
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

/** Lo que Stream acepta. Se ofrece como filtro del selector, no como validacion. */
export const ACCEPTED_VIDEO_MIME = "video/mp4,video/quicktime,video/webm,video/x-matroska";

export const patchAdminMedia = async (id, body) =>
  unwrapEntity(
    await adminRequest(`/admin/media/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: body,
    })
  );

export const deleteAdminMedia = async (id) =>
  adminRequest(`/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Human-readable size, for the library's cards. */
export const formatBytes = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** `1440` → `"24 min"`, which is how the interview cards label a video. */
export const formatDuration = (seconds) => {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};
