const ACCESS_KEY = "sureconomics_admin_access_token";
const REFRESH_KEY = "sureconomics_admin_refresh_token";
const ACCESS_EXPIRES_KEY = "sureconomics_admin_access_expires_at";
const ROLE_KEY = "sureconomics_admin_role";

/** @typedef {{ accessToken: string | null, refreshToken: string | null, accessExpiresAt: number | null, role: string | null }} StoredAuth */

/** @returns {StoredAuth} */
export const readStoredAuth = () => {
    if (typeof sessionStorage === "undefined") {
        return { accessToken: null, refreshToken: null, accessExpiresAt: null, role: null };
    }
    const accessToken = sessionStorage.getItem(ACCESS_KEY);
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    const rawExpires = sessionStorage.getItem(ACCESS_EXPIRES_KEY);
    const accessExpiresAt = rawExpires ? Number.parseInt(rawExpires, 10) : null;
    const role = sessionStorage.getItem(ROLE_KEY);
    return {
        accessToken: accessToken || null,
        refreshToken: refreshToken || null,
        accessExpiresAt: Number.isFinite(accessExpiresAt) ? accessExpiresAt : null,
        role: role || null,
    };
};

/**
 * @param {{ accessToken: string, refreshToken: string, expiresIn?: number, role?: string }} tokens
 */
export const persistAuth = ({ accessToken, refreshToken, expiresIn, role }) => {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
    if (typeof expiresIn === "number" && expiresIn > 0) {
        sessionStorage.setItem(ACCESS_EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
    } else {
        sessionStorage.removeItem(ACCESS_EXPIRES_KEY);
    }
    // Token refresh doesn't return `role` -- only overwrite it when a caller
    // (login) actually provides one, so refreshing never wipes it.
    if (role) {
        sessionStorage.setItem(ROLE_KEY, role);
    }
};

export const clearStoredAuth = () => {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_EXPIRES_KEY);
    sessionStorage.removeItem(ROLE_KEY);
};
