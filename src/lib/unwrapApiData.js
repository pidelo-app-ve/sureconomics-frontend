/**
 * Field names that indicate the object is already the API entity, not a `{ data: entity }` envelope.
 * Prevents peeling a model's own JSON `data` column (e.g. User.settings) as if it were an envelope.
 */
const ENTITY_KEYS = [
  "id",
  "email",
  "title",
  "slug",
  "first_name",
  "firstName",
  "last_name",
  "lastName",
  "user_id",
  "userId",
  "status",
];

/**
 * Strips nested `{ data: inner }` envelope layers from API responses.
 * @param {Record<string, unknown>} obj
 * @returns {Record<string, unknown>}
 */
export const stripApiDataLayers = (obj) => {
  let cur = obj;
  while (
    cur &&
    typeof cur === "object" &&
    "data" in cur &&
    cur.data != null &&
    typeof cur.data === "object" &&
    !Array.isArray(cur.data)
  ) {
    // Paginated list envelope: keep as-is (unwrapListResponse handles this shape).
    if ("meta" in cur && cur.meta != null) break;
    const topLooksLikeEntity = ENTITY_KEYS.some((k) => {
      if (!Object.prototype.hasOwnProperty.call(cur, k)) return false;
      const v = cur[k];
      return v !== undefined && v !== null && v !== "";
    });
    if (topLooksLikeEntity) break;
    cur = /** @type {Record<string, unknown>} */ (cur.data);
  }
  return cur;
};
