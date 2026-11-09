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
 * @param {{ client?: { request: Function }, turnstile?: string }} [opts]
 *   `turnstile`: el token de «¿es una persona?» que el servidor pide (429 con
 *   `details.pide_turnstile`) cuando una cuenta lleva demasiados intentos fallidos; sin
 *   él, el dueño quedaría fuera de su propia cuenta mientras un tercero la machaca.
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
    json: opts.turnstile ? { email, password, turnstile: opts.turnstile } : { email, password },
  });
  return comoSesion(data);
};

/** La respuesta de `/auth/login` (y de la recuperación, que contesta igual). */
const comoSesion = (data) => ({
  actor: data.actor,
  role: data.role,
  tokens: {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  },
});

/**
 * «¿Olvidó su contraseña?», primer paso: el código por correo. Contesta lo mismo tenga
 * o no cuenta ese correo, así que aquí no hay nada que leer de la respuesta. Lleva las
 * defensas del registro: la trampa (`website`) y el token de Turnstile.
 */
export const pedirCodigoDeRecuperacion = async ({ email, website = "", turnstile = "" }, opts = {}) => {
  await ensureClient(opts.client).request("/auth/password-reset/request", {
    method: "POST",
    json: { email, website, turnstile },
  });
};

/**
 * Segundo paso: el código y la contraseña nueva. Sirve para el equipo y los lectores,
 * como el login, y contesta igual que él: con la sesión ya abierta.
 */
export const recuperarContrasena = async ({ email, code, password }, opts = {}) =>
  comoSesion(
    await ensureClient(opts.client).request("/auth/password-reset/confirm", {
      method: "POST",
      json: { email, code, password },
    }),
  );
