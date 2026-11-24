/**
 * Dónde guarda el lector su sesión: `sessionStorage`, con las claves
 * `sureconomics_user_*`. El código es el de la sesión del panel, en `src/api/sesion.js`;
 * aquí solo se le da el prefijo.
 */
import { crearAlmacen } from "../api/sesion.js";

const almacen = crearAlmacen("sureconomics_user");

/** @typedef {{ accessToken: string | null, refreshToken: string | null, accessExpiresAt: number | null }} StoredUserAuth */

/** @returns {StoredUserAuth} */
export const readUserAuth = almacen.leer;

/**
 * @param {{ accessToken: string, refreshToken: string, expiresIn?: number }} tokens
 */
export const persistUserAuth = almacen.guardar;

export const clearUserAuth = almacen.borrar;
