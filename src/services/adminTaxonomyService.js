import { adminRequest } from "../lib/api";
import { unwrapEntity, unwrapListResponse } from "./adminResponseUtils";

const listForEditor = async (path) => {
  const raw = await adminRequest(path, { query: { page: 1, limit: 500 } });
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = raw.data;
    if (Array.isArray(inner)) return inner;
    if (inner && typeof inner === "object" && Array.isArray(inner.data)) return inner.data;
  }
  const { items } = unwrapListResponse(raw);
  return items;
};

export const listAdminCategoriesForEditor = () => listForEditor("/admin/categories");

export const listAdminTagsForEditor = () => listForEditor("/admin/tags");

export const listAdminCategoriesPaginated = async (params = {}) => {
  const raw = await adminRequest("/admin/categories", {
    query: { page: params.page ?? 1, limit: params.limit ?? 20 },
  });
  return unwrapListResponse(raw);
};

export const getAdminCategory = async (id) =>
  unwrapEntity(await adminRequest(`/admin/categories/${encodeURIComponent(id)}`));

export const createAdminCategory = async (body) =>
  unwrapEntity(await adminRequest("/admin/categories", { method: "POST", json: body }));

export const patchAdminCategory = async (id, body) =>
  unwrapEntity(await adminRequest(`/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", json: body }));

export const deleteAdminCategory = async (id) =>
  adminRequest(`/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });

export const listAdminTagsPaginated = async (params = {}) => {
  const raw = await adminRequest("/admin/tags", {
    query: { page: params.page ?? 1, limit: params.limit ?? 20 },
  });
  return unwrapListResponse(raw);
};

export const getAdminTag = async (id) =>
  unwrapEntity(await adminRequest(`/admin/tags/${encodeURIComponent(id)}`));

export const createAdminTag = async (body) =>
  unwrapEntity(await adminRequest("/admin/tags", { method: "POST", json: body }));

export const patchAdminTag = async (id, body) =>
  unwrapEntity(await adminRequest(`/admin/tags/${encodeURIComponent(id)}`, { method: "PATCH", json: body }));

export const deleteAdminTag = async (id) =>
  adminRequest(`/admin/tags/${encodeURIComponent(id)}`, { method: "DELETE" });
