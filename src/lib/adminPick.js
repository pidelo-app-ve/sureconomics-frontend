/**
 * @param {unknown} row
 * @param {string[]} keys
 * @param {string} [fallback]
 */
export const adminPick = (row, keys, fallback = "—") => {
  if (!row || typeof row !== "object") return fallback;
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v) !== "") return String(v);
  }
  return fallback;
};
