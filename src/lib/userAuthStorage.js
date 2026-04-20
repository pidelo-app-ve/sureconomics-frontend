const ACCESS_KEY = "sureconomics_user_access_token";
const REFRESH_KEY = "sureconomics_user_refresh_token";
const ACCESS_EXPIRES_KEY = "sureconomics_user_access_expires_at";

/** @typedef {{ accessToken: string | null, refreshToken: string | null, accessExpiresAt: number | null }} StoredUserAuth */

/** @returns {StoredUserAuth} */
export const readUserAuth = () => {
  if (typeof sessionStorage === "undefined") {
    return { accessToken: null, refreshToken: null, accessExpiresAt: null };
  }
  const accessToken = sessionStorage.getItem(ACCESS_KEY);
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  const rawExpires = sessionStorage.getItem(ACCESS_EXPIRES_KEY);
  const accessExpiresAt = rawExpires ? Number.parseInt(rawExpires, 10) : null;
  return {
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    accessExpiresAt: Number.isFinite(accessExpiresAt) ? accessExpiresAt : null,
  };
};

/**
 * @param {{ accessToken: string, refreshToken: string, expiresIn?: number }} tokens
 */
export const persistUserAuth = ({ accessToken, refreshToken, expiresIn }) => {
  sessionStorage.setItem(ACCESS_KEY, accessToken);
  sessionStorage.setItem(REFRESH_KEY, refreshToken);
  if (typeof expiresIn === "number" && expiresIn > 0) {
    sessionStorage.setItem(ACCESS_EXPIRES_KEY, String(Date.now() + expiresIn * 1000));
  } else {
    sessionStorage.removeItem(ACCESS_EXPIRES_KEY);
  }
};

export const clearUserAuth = () => {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(ACCESS_EXPIRES_KEY);
};
