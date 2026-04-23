import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

export const listAdminSubmissionNotes = async (submissionId, params = {}) => {
  const raw = await adminRequest(`/admin/submissions/${encodeURIComponent(submissionId)}/notes`, {
    query: { page: params.page ?? 1, limit: params.limit ?? 20 },
  });
  return unwrapListResponse(raw);
};

export const createAdminSubmissionNote = async (submissionId, payload) =>
  unwrapEntity(
    await adminRequest(`/admin/submissions/${encodeURIComponent(submissionId)}/notes`, {
      method: "POST",
      json: { note: payload?.note },
    })
  );

export const patchAdminSubmissionNote = async (submissionId, noteId, payload) =>
  unwrapEntity(
    await adminRequest(
      `/admin/submissions/${encodeURIComponent(submissionId)}/notes/${encodeURIComponent(noteId)}`,
      {
        method: "PATCH",
        json: { note: payload?.note },
      }
    )
  );

export const deleteAdminSubmissionNote = async (submissionId, noteId) =>
  adminRequest(`/admin/submissions/${encodeURIComponent(submissionId)}/notes/${encodeURIComponent(noteId)}`, {
    method: "DELETE",
  });

