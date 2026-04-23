import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

/**
 * @param {{ page?: number, limit?: number, status?: string, post_id?: string|number }} [params]
 */
export const listAdminComments = async (params = {}) => {
  const raw = await adminRequest("/admin/comments", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      status: params.status,
      post_id: params.post_id,
    },
  });
  return unwrapListResponse(raw);
};

export const approveAdminComment = async (id) =>
  unwrapEntity(await adminRequest(`/admin/comments/${encodeURIComponent(id)}/approve`, { method: "PATCH" }));

export const rejectAdminComment = async (id) =>
  unwrapEntity(await adminRequest(`/admin/comments/${encodeURIComponent(id)}/reject`, { method: "PATCH" }));

export const deleteAdminComment = async (id) =>
  adminRequest(`/admin/comments/${encodeURIComponent(id)}`, { method: "DELETE" });
