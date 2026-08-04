/**
 * Turn a thrown API error into something an editor can act on.
 *
 * `lib/api.js` surfaces the backend's `error.message` verbatim, which is right
 * for validation failures but useless for transport-level problems: a dropped
 * connection reads as "Failed to fetch", and Flask-Limiter answers a 429 with
 * the raw rule ("20 per 1 minute") rather than a sentence.
 */

/**
 * Statuses whose backend message is never worth showing, so the mapping below
 * always wins. Everything else prefers the server's own wording — the API says
 * useful, specific things like "Los escritores guardan artículos como borrador;
 * un publicador debe revisarlo y publicarlo." that a generic string would lose.
 */
const ALWAYS_OVERRIDE = new Set([0, 429, 500, 502, 504]);

const BY_STATUS = {
  0: "No se pudo contactar el servidor. Revise su conexión e inténtelo de nuevo.",
  401: "Su sesión expiró. Vuelva a iniciar sesión para continuar.",
  403: "No tiene permisos para realizar esta acción.",
  404: "El recurso ya no existe. Es posible que alguien más lo haya eliminado.",
  409: "Hay un conflicto con datos existentes (por ejemplo, un slug repetido).",
  413: "El archivo es demasiado grande.",
  429: "Demasiadas solicitudes. Espere unos minutos e inténtelo de nuevo.",
  500: "El servidor tuvo un error inesperado. Inténtelo de nuevo en unos momentos.",
  502: "El servidor no respondió correctamente. Inténtelo de nuevo en unos momentos.",
  503: "El servicio no está disponible en este momento. Inténtelo más tarde.",
  504: "El servidor tardó demasiado en responder. Inténtelo de nuevo.",
};

/** Generic server strings that carry no more information than the status does. */
const GENERIC_MESSAGES = new Set([
  "an unexpected error occurred.",
  "authentication required.",
  "bad request.",
  "error en la solicitud",
  "internal server error",
  "method not allowed.",
  "request error.",
  "request failed",
  "resource not found.",
  "you do not have permission to perform this action.",
]);

/** `fetch` rejects with a TypeError and no status when the request never left. */
const isNetworkFailure = (err) =>
  err?.status === undefined &&
  (err instanceof TypeError || /fetch|network/i.test(err?.message ?? ""));

/**
 * Flatten Marshmallow's `{ field: ["msg", ...] }` into one readable line.
 * @param {unknown} details
 * @returns {string}
 */
const formatValidationDetails = (details) => {
  if (!details || typeof details !== "object" || Array.isArray(details)) return "";
  const parts = [];
  Object.entries(details).forEach(([field, messages]) => {
    const text = Array.isArray(messages) ? messages.join(" ") : String(messages ?? "");
    if (text) parts.push(`${field}: ${text}`);
  });
  return parts.join(" · ");
};

/**
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export const adminErrorMessage = (err, fallback = "No se pudo completar la acción.") => {
  if (!err) return fallback;

  if (isNetworkFailure(err)) return BY_STATUS[0];

  const status = Number(err.status);

  // 422: name the offending fields — "Validation failed." alone doesn't help.
  if (status === 422) {
    const detail = formatValidationDetails(err.details);
    return detail
      ? `Hay campos inválidos — ${detail}`
      : "Hay campos inválidos. Revise el formulario e inténtelo de nuevo.";
  }

  if (ALWAYS_OVERRIDE.has(status)) return BY_STATUS[status];

  const message = typeof err.message === "string" ? err.message.trim() : "";
  if (message && !GENERIC_MESSAGES.has(message.toLowerCase())) return message;

  return BY_STATUS[status] || fallback;
};
