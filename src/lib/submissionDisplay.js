import { formatearFecha, idiomaActual, tActual } from "../i18n/motor";

/**
 * Fecha y hora de un envío en el idioma del documento: «5 oct 2026, 14:30» en español,
 * «Oct 5, 2026, 2:30 PM» en inglés. Si no es una fecha, se devuelve tal cual llegó.
 * @param {string | undefined} iso
 * @returns {string}
 */
export const formatSubmissionDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return formatearFecha(d, "corta", idiomaActual(), { hour: "numeric", minute: "2-digit" });
};

/** Los estados que tienen nombre en `cuenta.estadoEnvio.*`; cualquier otro se enseña tal cual. */
const ESTADOS_CONOCIDOS = new Set(["submitted", "pending", "under_review", "accepted", "rejected"]);

/**
 * @param {string | undefined} status
 * @returns {string}
 */
export const submissionStatusLabel = (status) => {
  const s = String(status || "").toLowerCase();
  if (ESTADOS_CONOCIDOS.has(s)) return tActual(`cuenta.estadoEnvio.${s}`);
  return status ? String(status) : "—";
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
