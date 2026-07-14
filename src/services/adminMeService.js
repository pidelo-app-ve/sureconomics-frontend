import { adminRequest } from "../lib/api";
import { unwrapEntity } from "./adminResponseUtils";

/** @returns {Promise<{ id: number, name: string, email: string, role: string }>} */
export const getAdminMe = async () => unwrapEntity(await adminRequest("/admin/me"));

/** @param {{ name?: string, email?: string }} body */
export const updateAdminMe = async (body) =>
  unwrapEntity(await adminRequest("/admin/me", { method: "PATCH", json: body }));

/** @param {{ current_password: string, new_password: string }} body */
export const changeAdminMyPassword = async (body) =>
  adminRequest("/admin/me/password", { method: "PATCH", json: body });
