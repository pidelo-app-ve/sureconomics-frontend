import { ApiError } from "../services/apiClient";
import { clearUserAuth, persistUserAuth, readUserAuth } from "./userAuthStorage";

export const USER_AUTH_SYNC_EVENT = "sureconomics-user-auth-sync";

export const dispatchUserAuthSync = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(USER_AUTH_SYNC_EVENT));
  }
};

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const buildUrl = (path, query) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalizedPath}`);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

const formatPayloadDetailMessage = (payload) => {
  const detail = payload?.detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        if (typeof d === "string") return d;
        if (d && typeof d.msg === "string") return d.msg;
        return null;
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
  }
  if (typeof detail === "string") return detail;
  return null;
};

const throwFromPayload = (res, payload) => {
  const err = payload?.error ?? {};
  const fromDetail = formatPayloadDetailMessage(payload);
  const fromError = typeof err.message === "string" ? err.message : "";
  const fromTop = typeof payload?.message === "string" ? payload.message : "";
  const message =
    (fromError && fromError !== "Request failed" ? fromError : null) ||
    fromDetail ||
    fromTop ||
    (typeof err.message === "string" ? err.message : null) ||
    res.statusText ||
    "Request failed";
  throw new ApiError(message, {
    status: res.status,
    code: err.code,
    details: err.details ?? payload ?? null,
  });
};

const unwrapUserResponseData = (payload) => {
  if (payload == null) return null;
  if (Object.prototype.hasOwnProperty.call(payload, "meta") && payload.meta != null) {
    return { data: payload.data, meta: payload.meta };
  }
  return payload.data !== undefined ? payload.data : payload;
};

/**
 * @param {string} path
 * @param {RequestInit & { token?: string, json?: unknown, query?: Record<string, unknown> }} [options]
 */
const rawUserFetch = async (path, options = {}) => {
  const { token, json, headers: initHeaders, body, query, idempotencyKey, ...rest } = options;
  const url = buildUrl(path, query);
  const headers = { ...initHeaders };
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  // Reintentar con la misma clave devuelve la respuesta de la primera vez en vez de
  // crear otra cosa. Ver `lib/idempotencia.js`.
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }
  const res = await fetch(url, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : body,
  });
  const payload = await res.json().catch(() => ({}));
  return { res, payload };
};

/**
 * Public JSON request (no consumer bearer).
 * @param {string} path
 * @param {Omit<RequestInit, 'body'> & { json?: unknown, query?: Record<string, unknown> }} [options]
 */
export const userPublicRequest = async (path, options = {}) => {
  if (!API_BASE) {
    throw new ApiError("Falta VITE_API_URL en el entorno.", { status: 0 });
  }
  const { res, payload } = await rawUserFetch(path, options);
  if (!res.ok || payload?.success === false) {
    throwFromPayload(res, payload ?? {});
  }
  return unwrapUserResponseData(payload);
};

/**
 * @returns {Promise<Record<string, unknown>>}
 */
export const refreshUserTokens = async () => {
  const { refreshToken } = readUserAuth();
  if (!refreshToken) {
    throw new ApiError("No hay token de renovación", { status: 401 });
  }
  const { res, payload } = await rawUserFetch("/user-auth/refresh", {
    method: "POST",
    json: { refresh_token: refreshToken },
  });
  if (!res.ok || payload?.success === false) {
    throwFromPayload(res, payload ?? {});
  }
  const data = unwrapUserResponseData(payload);
  if (!data || typeof data !== "object" || !data.access_token) {
    throw new ApiError("Respuesta de renovación inválida", { status: 401 });
  }
  persistUserAuth({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in,
  });
  dispatchUserAuthSync();
  return data;
};

/**
 * Authenticated consumer request (Bearer user access). On 401 refreshes once.
 * @param {string} path
 * @param {Omit<RequestInit, 'body'> & { json?: unknown, query?: Record<string, unknown> }} [options]
 */
export const userRequest = async (path, options = {}) => {
  if (!API_BASE) {
    throw new ApiError("Falta VITE_API_URL en el entorno.", { status: 0 });
  }

  const { refreshToken, accessExpiresAt } = readUserAuth();
  if (refreshToken && accessExpiresAt && Date.now() >= accessExpiresAt - 5000) {
    try {
      await refreshUserTokens();
    } catch {
      /* continue */
    }
  }

  const fetchWithStoredAccess = () =>
    rawUserFetch(path, {
      ...options,
      token: readUserAuth().accessToken,
    });

  if (!readUserAuth().accessToken) {
    throw new ApiError("Debe iniciar sesión", { status: 401 });
  }

  let { res, payload } = await fetchWithStoredAccess();

  if (res.status === 401 && readUserAuth().refreshToken) {
    try {
      await refreshUserTokens();
      ({ res, payload } = await fetchWithStoredAccess());
    } catch {
      clearUserAuth();
      dispatchUserAuthSync();
      throw new ApiError("Sesión expirada", { status: 401 });
    }
  }

  if (res.status === 401) {
    clearUserAuth();
    dispatchUserAuthSync();
  }

  if (!res.ok || payload?.success === false) {
    throwFromPayload(res, payload ?? {});
  }

  return unwrapUserResponseData(payload);
};

/**
 * Descarga un archivo protegido con la sesión del lector.
 *
 * Hace falta porque `window.open` no manda cabeceras: el token se queda fuera y el
 * servidor contesta 401. Así que se pide con `fetch`, que sí lo lleva, y los bytes se
 * entregan al navegador como una descarga normal.
 *
 * Es el mismo patrón de blob que usan los otros sistemas del equipo con R2, y por la
 * misma razón: los permisos los decide la aplicación en cada petición, no una firma en
 * la dirección que cualquiera podría reenviar.
 *
 * Refresca el token una vez si venció, igual que `userRequest`.
 */
export const descargarArchivoDeUsuario = async (path, { nombreSugerido } = {}) => {
  if (!API_BASE) {
    throw new ApiError("Falta VITE_API_URL en el entorno.", { status: 0 });
  }

  const { refreshToken, accessExpiresAt } = readUserAuth();
  if (refreshToken && accessExpiresAt && Date.now() >= accessExpiresAt - 5000) {
    try {
      await refreshUserTokens();
    } catch {
      /* continue */
    }
  }

  const pedir = () =>
    fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
      headers: { Authorization: `Bearer ${readUserAuth().accessToken}` },
    });

  if (!readUserAuth().accessToken) {
    throw new ApiError("Debe iniciar sesión", { status: 401 });
  }

  let res = await pedir();
  if (res.status === 401 && readUserAuth().refreshToken) {
    try {
      await refreshUserTokens();
      res = await pedir();
    } catch {
      /* se maneja abajo */
    }
  }

  if (!res.ok) {
    // El cuerpo de un error sí es JSON; el de un acierto son bytes.
    const payload = await res.json().catch(() => ({}));
    throwFromPayload(res, payload ?? {});
  }

  const blob = await res.blob();
  // El nombre lo pone el servidor en `Content-Disposition`; si no llega, el sugerido.
  const cabecera = res.headers.get("Content-Disposition") || "";
  const enCabecera = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cabecera);
  const nombre = (enCabecera && decodeURIComponent(enCabecera[1])) || nombreSugerido || "descarga";

  const objeto = URL.createObjectURL(blob);
  try {
    const enlace = document.createElement("a");
    enlace.href = objeto;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    // Sin esto el blob se queda en memoria hasta que se recargue la página, y un
    // informe de veinte megas se nota.
    setTimeout(() => URL.revokeObjectURL(objeto), 1000);
  }
  return { nombre, bytes: blob.size };
};
