/**
 * Dónde guarda el panel su sesión: `sessionStorage`, con las claves
 * `sureconomics_admin_*` (también el rol). El código es el de la sesión del lector, en
 * `src/api/sesion.js`; aquí solo se le da el prefijo.
 */
import { crearAlmacen } from "../api/sesion.js";

const almacen = crearAlmacen("sureconomics_admin", { conRol: true });

/** @typedef {{ accessToken: string | null, refreshToken: string | null, accessExpiresAt: number | null, role: string | null }} StoredAuth */

/** @returns {StoredAuth} */
export const readStoredAuth = almacen.leer;

/**
 * @param {{ accessToken: string, refreshToken: string, expiresIn?: number, role?: string }} tokens
 */
export const persistAuth = almacen.guardar;

export const clearStoredAuth = almacen.borrar;
