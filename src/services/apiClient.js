/**
 * El cliente de lo público (`createApiClient`): sin sesión, y las lecturas por el
 * quiosco. El trabajo lo hace el núcleo (`src/api/nucleo.js`); aquí queda lo propio de
 * este cliente: su base, sus cabeceras fijas, su forma de leer el error (con la dirección
 * pedida) y de desenvolver la respuesta, y que a `fetch` solo le llegan el método, las
 * cabeceras, el JSON y `signal`.
 */
import { ApiError, desenvolverPublico, errorPublico, pedir } from "../api/nucleo.js";

export { ApiError };

const normalizeBaseUrl = (raw) => {
  const base = typeof raw === "string" ? raw.trim() : "";
  return base.replace(/\/$/, "");
};

export const createApiClient = ({
  baseUrl = import.meta.env.VITE_API_URL,
  defaultHeaders = {},
} = {}) => {
  const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!resolvedBaseUrl) {
    // Fail fast to avoid silent requests to current origin.
    // Consumers can catch this and show a readable error state.
    throw new ApiError("Falta la URL base de la API. Defina VITE_API_URL en su .env.", { status: 0 });
  }

  /**
   * @param {string} path
   * @param {{
   *   method?: string,
   *   query?: Record<string, unknown>,
   *   json?: unknown,
   *   headers?: Record<string, string>,
   *   idempotencyKey?: string,
   *   signal?: AbortSignal,
   * }} [options]
   */
  const request = async (path, options = {}) => {
    const { res, payload, url } = await pedir(
      path,
      {
        method: options.method ?? "GET",
        headers: { ...defaultHeaders, ...(options.headers ?? {}) },
        json: options.json,
        query: options.query,
        idempotencyKey: options.idempotencyKey,
        signal: options.signal,
      },
      { base: resolvedBaseUrl, conQuiosco: true, siNoEsJson: null },
    );
    if (!res.ok || (payload && payload.success === false)) {
      throw errorPublico(res, payload, url);
    }
    return desenvolverPublico(payload);
  };

  return { request };
};
