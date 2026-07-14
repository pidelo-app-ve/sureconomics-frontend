import { createApiClient } from "../services/apiClient";

const defaultClient = (() => {
  try {
    return createApiClient();
  } catch {
    return null;
  }
})();

const ensureClient = (client) => {
  if (client) return client;
  if (defaultClient) return defaultClient;
  return createApiClient();
};

/**
 * Single entry point for the "one login" screen: POST /auth/login resolves
 * against the backoffice table first, then the reader (colaborador) table.
 *
 * @param {string} email
 * @param {string} password
 * @param {{ client?: { request: Function } }} [opts]
 * @returns {Promise<{
 *   actor: "admin" | "user",
 *   role: string,
 *   tokens: { accessToken: string, refreshToken: string, expiresIn: number },
 * }>}
 */
export const loginUnified = async (email, password, opts = {}) => {
  const client = ensureClient(opts.client);
  const data = await client.request("/auth/login", {
    method: "POST",
    json: { email, password },
  });
  return {
    actor: data.actor,
    role: data.role,
    tokens: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    },
  };
};
