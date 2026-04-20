import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

export const listAdminHeadlines = async (params = {}) => {
  const raw = await adminRequest("/admin/headlines", {
    query: { page: params.page ?? 1, limit: params.limit ?? 20 },
  });
  return unwrapListResponse(raw);
};

export const getAdminHeadline = async (id) =>
  unwrapEntity(await adminRequest(`/admin/headlines/${encodeURIComponent(id)}`));

export const createAdminHeadline = async (body) =>
  unwrapEntity(await adminRequest("/admin/headlines", { method: "POST", json: body }));

export const patchAdminHeadline = async (id, body) =>
  unwrapEntity(
    await adminRequest(`/admin/headlines/${encodeURIComponent(id)}`, { method: "PATCH", json: body })
  );

export const deleteAdminHeadline = async (id) =>
  adminRequest(`/admin/headlines/${encodeURIComponent(id)}`, { method: "DELETE" });
