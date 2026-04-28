import {
    clearStoredAuth,
    persistAuth,
    readStoredAuth,
} from "./authStorage";

const rawBase = import.meta.env.VITE_API_URL ?? "";
const API_BASE = rawBase.replace(/\/$/, "");

/** Fired after tokens are refreshed or cleared so AuthContext can sync from sessionStorage. */
export const ADMIN_AUTH_SYNC_EVENT = "sureconomics-admin-auth-sync";

const dispatchAdminAuthSync = () => {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(ADMIN_AUTH_SYNC_EVENT));
    }
};

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

/**
 * @param {Response} res
 * @param {Record<string, unknown>} payload
 */
const throwFromPayload = (res, payload) => {
    const err = payload?.error ?? { message: res.statusText || "Request failed" };
    const error = new Error(typeof err.message === "string" ? err.message : "Request failed");
    error.status = res.status;
    error.code = err.code;
    error.details = err.details ?? payload ?? null;
    throw error;
};

/**
 * @param {string} path
 * @param {RequestInit & { token?: string, json?: unknown, query?: Record<string, unknown> }} [options]
 */
const rawFetch = async (path, options = {}) => {
    const { token, json, headers: initHeaders, body, query, ...rest } = options;
    const url = buildUrl(path, query);

    const headers = { ...initHeaders };
    if (json !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
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
 * Successful API envelope: returns `data` only, or `{ data, meta }` when `meta` is present.
 * @param {Record<string, unknown>} payload
 * @returns {unknown}
 */
export const unwrapResponseData = (payload) => {
    if (payload == null) return null;
    if (Object.prototype.hasOwnProperty.call(payload, "meta") && payload.meta != null) {
        return { data: payload.data, meta: payload.meta };
    }
    return payload.data;
};

/**
 * @param {string} path
 * @param {RequestInit & { token?: string, json?: unknown, query?: Record<string, unknown> }} [options]
 * @returns {Promise<unknown>}
 */
export const apiRequest = async (path, options = {}) => {
    const { res, payload } = await rawFetch(path, options);
    if (!res.ok || payload.success === false) {
        throwFromPayload(res, payload);
    }
    return unwrapResponseData(payload);
};

/**
 * @param {Record<string, unknown>} meta
 */
export const normalizeListMeta = (meta) => {
    if (!meta || typeof meta !== "object") {
        return { page: 1, limit: 20, total: 0, pages: 1 };
    }
    const page = Number(meta.page ?? 1) || 1;
    const limit = Number(meta.limit ?? 20) || 20;
    const total = Number(meta.total ?? 0) || 0;
    const pages = Number(meta.pages ?? 1) || 1;
    return { page, limit, total, pages };
};

/**
 * @returns {Promise<{ access_token: string, refresh_token: string, expires_in?: number, refresh_expires_in?: number }>}
 */
export const refreshAdminTokens = async () => {
    const { refreshToken } = readStoredAuth();
    if (!refreshToken) {
        const err = new Error("No refresh token");
        err.status = 401;
        throw err;
    }
    const { res, payload } = await rawFetch("/auth/refresh", {
        method: "POST",
        json: { refresh_token: refreshToken },
    });
    if (!res.ok || payload.success === false) {
        throwFromPayload(res, payload);
    }
    const data = unwrapResponseData(payload);
    if (!data || typeof data !== "object" || !data.access_token) {
        throw new Error("Invalid refresh response");
    }
    persistAuth({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        expiresIn: data.expires_in,
    });
    dispatchAdminAuthSync();
    return data;
};

/**
 * Authenticated admin request. Uses access token from sessionStorage; on 401 refreshes once and retries.
 * Returns `data` or `{ data, meta }` when pagination meta is present.
 *
 * @param {string} path
 * @param {Omit<RequestInit, 'body'> & { json?: unknown, query?: Record<string, unknown> }} [options]
 * @returns {Promise<unknown>}
 */
export const adminRequest = async (path, options = {}) => {
    const { refreshToken, accessExpiresAt } = readStoredAuth();
    if (refreshToken && accessExpiresAt && Date.now() >= accessExpiresAt - 5000) {
        try {
            await refreshAdminTokens();
        } catch {
            // continue; access token may still work
        }
    }

    const fetchWithStoredAccess = () =>
        rawFetch(path, {
            ...options,
            token: readStoredAuth().accessToken,
        });

    if (!readStoredAuth().accessToken) {
        const err = new Error("Not authenticated");
        err.status = 401;
        throw err;
    }

    let { res, payload } = await fetchWithStoredAccess();

    if (res.status === 401 && readStoredAuth().refreshToken) {
        try {
            await refreshAdminTokens();
            ({ res, payload } = await fetchWithStoredAccess());
        } catch {
            clearStoredAuth();
            dispatchAdminAuthSync();
            const err = new Error("Session expired");
            err.status = 401;
            throw err;
        }
    }

    if (res.status === 401) {
        clearStoredAuth();
        dispatchAdminAuthSync();
    }

    if (!res.ok || payload.success === false) {
        throwFromPayload(res, payload);
    }

    return unwrapResponseData(payload);
};

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{
 *   access_token: string,
 *   refresh_token: string,
 *   token_type: string,
 *   expires_in: number,
 *   refresh_expires_in: number
 * }>}
 */
export const loginAdmin = (email, password) =>
    apiRequest("/auth/login", { method: "POST", json: { email, password } });

/**
 * Admin registration.
 * Backend is expected to return the same token envelope as login.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{
 *   access_token: string,
 *   refresh_token: string,
 *   token_type?: string,
 *   expires_in?: number,
 *   refresh_expires_in?: number
 * }>}
 */
export const registerAdmin = (email, password) =>
    apiRequest("/auth/register", { method: "POST", json: { email, password } });
