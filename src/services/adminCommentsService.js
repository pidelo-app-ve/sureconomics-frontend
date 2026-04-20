import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

/**
 * @param {{ page?: number, limit?: number, status?: string, post_id?: string|number, slug?: string }} [params]
 */
export const listAdminComments = async (params = {}) => {
  const raw = await adminRequest("/admin/comments", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      status: params.status,
      post_id: params.post_id,
      slug: params.slug,
    },
  });
  return unwrapListResponse(raw);
};

export const patchAdminComment = async (id, body) =>
  unwrapEntity(
    await adminRequest(`/admin/comments/${encodeURIComponent(id)}`, { method: "PATCH", json: body })
  );

export const deleteAdminComment = async (id) =>
  adminRequest(`/admin/comments/${encodeURIComponent(id)}`, { method: "DELETE" });
