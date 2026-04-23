import { normalizeListMeta } from "../lib/api";
import { stripApiDataLayers } from "../lib/unwrapApiData";

/**
 * Some admin write/read responses nest the entity under `data` without pagination `meta`.
 * Does not treat a model's own `data` JSON field as an envelope (e.g. User profile payloads).
 * @param {unknown} raw
 */
export const unwrapEntity = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  if (Array.isArray(raw)) return raw;
  return stripApiDataLayers(/** @type {Record<string, unknown>} */ (raw));
};

/**
 * @param {unknown} raw
 * @returns {{ items: unknown[], meta: ReturnType<typeof normalizeListMeta> }}
 */
export const unwrapListResponse = (raw) => {
  if (raw && typeof raw === "object" && "data" in raw && "meta" in raw) {
    const items = Array.isArray(raw.data) ? raw.data : [];
    return { items, meta: normalizeListMeta(raw.meta) };
  }
  const items = Array.isArray(raw) ? raw : [];
  return { items, meta: normalizeListMeta({ page: 1, limit: 20, total: items.length, pages: 1 }) };
};
