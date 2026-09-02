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
