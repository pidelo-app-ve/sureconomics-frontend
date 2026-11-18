/** Kept in sync with `ALLOWED_IMAGE_KINDS` in the backend's `upload_service.py`. */
export const ACCEPTED_IMAGE_MIME = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Matches the backend default; only used for a client-side hint before uploading. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
