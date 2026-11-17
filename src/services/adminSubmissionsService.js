import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

export const listAdminSubmissions = async (params = {}) => {
  const raw = await adminRequest("/admin/submissions", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      status: params.status,
    },
  });
  return unwrapListResponse(raw);
};

export const getAdminSubmission = async (id) =>
  unwrapEntity(await adminRequest(`/admin/submissions/${encodeURIComponent(id)}`));

/**
 * @param {string} status - `under_review` | `accepted` | `rejected`
 * @param {{ topicIds?: number[] }} [extra] - al aceptar, los temas de la pieza: sin tema
 *   el servidor no publica nada (`topic_required`).
 */
export const applyAdminSubmissionWorkflow = async (id, status, { topicIds } = {}) => {
  const s = String(status || "").toLowerCase();
  const encoded = encodeURIComponent(id);
  if (s === "under_review") {
    return unwrapEntity(await adminRequest(`/admin/submissions/${encoded}/under-review`, { method: "PATCH" }));
  }
  if (s === "accepted") {
    const json = topicIds?.length ? { topic_ids: topicIds } : undefined;
    return unwrapEntity(await adminRequest(`/admin/submissions/${encoded}/approve`, { method: "PATCH", json }));
  }
  if (s === "rejected") {
    return unwrapEntity(await adminRequest(`/admin/submissions/${encoded}/reject`, { method: "PATCH" }));
  }
  throw new Error("Estado no admitido. Use En revisión, Aceptado o Rechazado.");
};
