import { normalizeListMeta } from "../lib/api";

/**
 * Some admin write/read responses nest the entity under `data` without pagination `meta`.
 * @param {unknown} raw
 */
export const unwrapEntity = (raw) => {
  if (raw && typeof raw === "object" && "data" in raw && raw.data != null && raw.meta == null) {
    if (Array.isArray(raw.data)) return raw;
    return raw.data;
  }
  return raw;
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
