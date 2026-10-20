import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/** @returns {Promise<Array<{ id: number, name: string, email: string, role: string }>>} */
export const listAdminStaff = async () => unwrapEntity(await adminRequest("/admin/staff"));

/**
 * @param {{ name: string, email: string, password: string, role: string }} body
 */
export const createAdminStaff = async (body) =>
  unwrapEntity(await adminRequest("/admin/staff", { method: "POST", json: body }));

/**
 * @param {number} staffId
 * @param {string} role
 */
export const updateAdminStaffRole = async (staffId, role) =>
  unwrapEntity(await adminRequest(`/admin/staff/${staffId}`, { method: "PATCH", json: { role } }));

/**
 * Desactivar corta el acceso al panel sin borrar la cuenta (que firma piezas).
 * @param {number} staffId
 * @param {boolean} isActive
 */
export const setAdminStaffActive = async (staffId, isActive) =>
  unwrapEntity(await adminRequest(`/admin/staff/${staffId}`, { method: "PATCH", json: { is_active: isActive } }));

/** @param {number} staffId */
export const deleteAdminStaff = async (staffId) => adminRequest(`/admin/staff/${staffId}`, { method: "DELETE" });
