const rawBase = import.meta.env.VITE_API_URL ?? "";
const API_BASE = rawBase.replace(/\/$/, "");

/**
 * @param {string} path
 * @param {RequestInit & { token?: string, json?: unknown }} [options]
 * @returns {Promise<unknown>}
 */
export const apiRequest = async (path, options = {}) => {
    const { token, json, headers: initHeaders, body, ...rest } = options;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${API_BASE}${normalizedPath}`;

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
    if (!res.ok || payload.success === false) {
        const err = payload.error ?? { message: res.statusText || "Request failed" };
        const error = new Error(typeof err.message === "string" ? err.message : "Request failed");
        error.status = res.status;
        error.code = err.code;
        error.details = err.details ?? null;
        throw error;
    }
    return payload.data;
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
