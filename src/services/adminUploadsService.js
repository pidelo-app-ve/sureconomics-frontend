import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/** Kept in sync with `ALLOWED_IMAGE_KINDS` in the backend's `upload_service.py`. */
export const ACCEPTED_IMAGE_MIME = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Matches the backend default; only used for a client-side hint before uploading. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Upload one image to Cloudinary through the API and get its URL back.
 *
 * Sent as `multipart/form-data`; `adminRequest` leaves `Content-Type` unset for a
 * `FormData` body so the browser can add the multipart boundary itself.
 *
 * @param {File} file
 * @returns {Promise<{
 *   url: string,
 *   public_id?: string,
 *   format?: string,
 *   width?: number,
 *   height?: number,
 *   bytes?: number,
 * }>}
 */
export const uploadAdminImage = async (file) => {
  const body = new FormData();
  body.append("file", file);
  return unwrapEntity(await adminRequest("/admin/uploads/image", { method: "POST", body }));
};
