import { formatearFecha, idiomaActual, tActual } from "../i18n/motor.js";

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

/**
 * Los estados de una propuesta, los mismos que el servidor (el `CHECK` de
 * `collaborative_article_submissions.status`): llega como `submitted`, la redacción puede
 * pasarla a `under_review`, y acaba en `approved` (se publica) o en `rejected`.
 *
 * No existen ni `pending` ni `accepted`. Aquí estaban en su lugar: el panel filtraba por
 * ellos y no encontraba nada, y al lector se le enseñaba «approved» tal cual.
 */
export const ESTADOS_DE_PROPUESTA = ["submitted", "under_review", "approved", "rejected"];

/** Los estados que tienen nombre en `cuenta.estadoEnvio.*`; cualquier otro se enseña tal cual. */
const ESTADOS_CONOCIDOS = new Set(ESTADOS_DE_PROPUESTA);

/**
 * @param {string | undefined} status
 * @returns {string}
 */
export const submissionStatusLabel = (status) => {
  const s = String(status || "").toLowerCase();
  if (ESTADOS_CONOCIDOS.has(s)) return tActual(`cuenta.estadoEnvio.${s}`);
  return status ? String(status) : "—";
};

const KNOWN_STATUS_MODIFIERS = new Set(ESTADOS_DE_PROPUESTA);

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
