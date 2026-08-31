const normalizeBaseUrl = (raw) => {
  const base = typeof raw === "string" ? raw.trim() : "";
  return base.replace(/\/$/, "");
};

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, code?: string, details?: unknown, url?: string }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details ?? null;
    this.url = opts.url;
  }
}

const buildUrl = (baseUrl, path, query) => {
  const normalizedPath = path?.startsWith("/") ? path : `/${path ?? ""}`;
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${normalizedPath}`);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const unwrapPayload = (payload) => {
  if (!payload) return null;
  if (payload.success === false) return payload;
  if (Object.prototype.hasOwnProperty.call(payload, "meta") && payload.meta != null && "data" in payload) {
    return { data: payload.data, meta: payload.meta };
  }
  if ("data" in payload) return payload.data;
  return payload;
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
    const url = buildUrl(resolvedBaseUrl, path, options.query);
    const method = options.method ?? "GET";

    const headers = {
      ...defaultHeaders,
      ...(options.headers ?? {}),
    };

    // Reintentar con la misma clave devuelve la respuesta de la primera vez en vez de
    // crear otra cosa. Ver `lib/idempotencia.js`.
    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    let body;
    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: options.signal,
    });

    const payload = await safeJson(res);
    if (!res.ok) {
      const message =
        (payload && (payload.message || payload.error?.message)) ||
        res.statusText ||
        "Error en la solicitud";
      throw new ApiError(String(message), {
        status: res.status,
        code: payload?.error?.code,
        details: payload?.error?.details ?? payload,
        url,
      });
    }

    if (payload && payload.success === false) {
      const err = payload.error ?? { message: "Error en la solicitud" };
      throw new ApiError(typeof err.message === "string" ? err.message : "Error en la solicitud", {
        status: res.status,
        code: err.code,
        details: err.details ?? payload,
        url,
      });
    }

    return unwrapPayload(payload);
  };

  return { request };
};

