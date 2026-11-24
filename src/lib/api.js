/**
 * Hablar con la API desde el panel (`adminRequest` y compañía). El trabajo lo hace el
 * núcleo, `src/api/` (`nucleo.js` y `sesion.js`); aquí queda lo propio del panel: su
 * sesión (`authStorage.js`), su forma de leer el error y de desenvolver la respuesta, y
 * su política si renovar la sesión falla (`CERRAR_SI_LA_SESION_NO_VALE`). Nunca por el
 * quiosco: todo lo del panel lleva sesión.
 */
import { clearStoredAuth, persistAuth, readStoredAuth } from "./authStorage";
import { desenvolverDelPanel, errorDelPanel, pedir } from "../api/nucleo.js";
import { CERRAR_SI_LA_SESION_NO_VALE, crearSesion } from "../api/sesion.js";

/** Fired after tokens are refreshed or cleared so AuthContext can sync from sessionStorage. */
export const ADMIN_AUTH_SYNC_EVENT = "sureconomics-admin-auth-sync";

/** Un `Error` con su estado HTTP. */
const conEstado = (mensaje, status) => Object.assign(new Error(mensaje), { status });

/** La respuesta ya leída: el error del panel si no fue bien; si no, `data` (o `{ data, meta }`). */
const abrir = ({ res, payload }) => {
    if (!res.ok || payload.success === false) {
        throw errorDelPanel(res, payload);
    }
    return desenvolverDelPanel(payload);
};

const sesion = crearSesion({
    almacen: { leer: readStoredAuth, guardar: persistAuth, borrar: clearStoredAuth },
    evento: ADMIN_AUTH_SYNC_EVENT,
    rutaDeRenovar: "/auth/refresh",
    pedir,
    abrir,
    sinRenovacion: () => conEstado("No refresh token", 401),
    renovacionInvalida: () => new Error("La renovación de la sesión devolvió una respuesta no válida."),
});

export const dispatchAdminAuthSync = sesion.avisar;

/**
 * Successful API envelope: returns `data` only, or `{ data, meta }` when `meta` is present.
 * @param {Record<string, unknown>} payload
 * @returns {unknown}
 */
export const unwrapResponseData = desenvolverDelPanel;

/**
 * @param {string} path
 * @param {RequestInit & { token?: string, json?: unknown, query?: Record<string, unknown> }} [options]
 * @returns {Promise<unknown>}
 */
export const apiRequest = async (path, options = {}) => abrir(await pedir(path, options));

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
export const refreshAdminTokens = sesion.renovar;

/**
 * Authenticated admin request. Uses access token from sessionStorage; on 401 refreshes once and retries.
 * Returns `data` or `{ data, meta }` when pagination meta is present.
 *
 * Pass `json` for a JSON body, or `body` directly for anything else — a `FormData`
 * body is left untouched and no `Content-Type` is set, so the browser can add the
 * multipart boundary itself (see `adminUploadsService`).
 *
 * Solo se cierra la sesión si el servidor dice que la renovación no vale (ver
 * `src/api/sesion.js`): sin red, un 429 o un 5xx al renovar no dicen nada de la sesión.
 *
 * @param {string} path
 * @param {RequestInit & { json?: unknown, query?: Record<string, unknown> }} [options]
 * @returns {Promise<unknown>}
 */
export const adminRequest = async (path, options = {}) => {
    await sesion.renovarSiVaACaducar();

    if (!readStoredAuth().accessToken) {
        throw conEstado("Debe iniciar sesión", 401);
    }

    const respuesta = await sesion.conRenovacion(
        () => pedir(path, { ...options, token: readStoredAuth().accessToken }),
        { siFalla: CERRAR_SI_LA_SESION_NO_VALE, errorCaducada: () => conEstado("Sesión expirada", 401) },
    );

    if (respuesta.res.status === 401) {
        sesion.cerrar();
    }

    return abrir(respuesta);
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
