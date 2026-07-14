import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

export const listAdminUsers = async (params = {}) => {
  const raw = await adminRequest("/admin/users", {
    query: { page: params.page ?? 1, limit: params.limit ?? 20 },
  });
  return unwrapListResponse(raw);
};

export const getAdminUser = async (id) =>
  unwrapEntity(await adminRequest(`/admin/users/${encodeURIComponent(id)}`));

export const patchAdminUser = async (id, body) =>
  unwrapEntity(await adminRequest(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", json: body }));

export const setAdminUserCollabEnabled = async (id, enabled) =>
  unwrapEntity(
    await adminRequest(`/admin/users/${encodeURIComponent(id)}/collaborative-submissions`, {
      method: "PATCH",
      json: { enabled },
    })
  );

export const setAdminUserActive = async (id, enabled) =>
  unwrapEntity(
    await adminRequest(`/admin/users/${encodeURIComponent(id)}/active`, {
      method: "PATCH",
      json: { enabled },
    })
  );
