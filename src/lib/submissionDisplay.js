/**
 * @param {string | undefined} iso
 * @returns {string}
 */
export const formatSubmissionDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(d);
};

/**
 * @param {string | undefined} status
 * @returns {string}
 */
export const submissionStatusLabel = (status) => {
  const s = String(status || "").toLowerCase();
  const map = {
    submitted: "Enviado",
    pending: "Pendiente",
    under_review: "En revisión",
    accepted: "Aceptado",
    rejected: "Rechazado",
  };
  return map[s] ?? (status ? String(status) : "—");
};

const KNOWN_STATUS_MODIFIERS = new Set(["pending", "under_review", "accepted", "rejected", "submitted"]);

/**
 * CSS modifier for `se-admin-submissions__status--${modifier}` (admin list pills).
 * @param {string | undefined} status
 * @returns {string}
 */
export const submissionStatusCssModifier = (status) => {
  const s = String(status || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  return KNOWN_STATUS_MODIFIERS.has(s) ? s : "default";
};
