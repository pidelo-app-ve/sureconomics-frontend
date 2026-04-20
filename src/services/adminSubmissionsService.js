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

export const patchAdminSubmission = async (id, body) =>
  unwrapEntity(
    await adminRequest(`/admin/submissions/${encodeURIComponent(id)}`, { method: "PATCH", json: body })
  );
