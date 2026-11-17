import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/** @returns {Promise<{ id: number, name: string, email: string, role: string }>} */
export const getAdminMe = async () => unwrapEntity(await adminRequest("/admin/me"));

/** @param {{ name?: string, email?: string, telefono?: string, current_password?: string }} body
 *  `current_password` hace falta si cambian el correo o el celular. */
export const updateAdminMe = async (body) =>
  unwrapEntity(await adminRequest("/admin/me", { method: "PATCH", json: body }));

/** @param {{ current_password: string, new_password: string }} body */
export const changeAdminMyPassword = async (body) =>
  adminRequest("/admin/me/password", { method: "PATCH", json: body });

/** Apunta en el servidor que esta persona ya vio la guía `nombre` (p. ej. «panel»). */
export const marcarRecorridoVisto = async (nombre) =>
  adminRequest(`/admin/me/recorridos/${encodeURIComponent(nombre)}`, { method: "PUT", json: {} });
